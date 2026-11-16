/**
 * Cloudflare Worker: serves the static Astro build and handles the contact form endpoint.
 *
 * Config (wrangler.jsonc vars, or .dev.vars locally; secrets via `wrangler secret put`):
 *   CONTACT_TO            Comma-separated recipients; each submission is one email to all of them.
 *   EMAIL_ENABLED         "true" sends through Resend. Anything else logs and returns success.
 *   CONTACT_FROM          Verified Resend sender, e.g. "B Keim Rewind Website <website@bkrewind.com>".
 *   RESEND_API_KEY        Secret. Required when EMAIL_ENABLED is "true".
 *   TURNSTILE_SECRET_KEY  Secret. May be unset only when EMAIL_ENABLED is "false" (verification is then
 *                         skipped); otherwise a missing key rejects every submission with a 500.
 *
 * Missing required config is checked before anything else, so a misconfigured deploy fails loudly
 * instead of silently skipping the bot check or dropping mail.
 */
import { forms, HONEYPOT, TURNSTILE_FIELD, validateForm, type FormDef } from '../src/lib/forms';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  EMAIL_ENABLED?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const MAX_BODY_BYTES = 32 * 1024;

const routes: Record<string, FormDef> = {
  '/api/contact': forms.contact,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const form = routes[pathname];

    if (form) {
      if (request.method !== 'POST') return json({ ok: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });
      try {
        return await handleSubmission(request, env, form);
      } catch (err) {
        console.error(`[${form.id}] unhandled error`, err);
        return json({ ok: false, message: 'Something went wrong. Please try again.' }, 500);
      }
    }

    if (pathname.startsWith('/api/')) return json({ ok: false, message: 'Not found.' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function handleSubmission(request: Request, env: Env, form: FormDef): Promise<Response> {
  const data = await readBody(request);
  if (!data) return json({ ok: false, message: 'Invalid request.' }, 400);

  // Bots that fill the honeypot get a normal-looking success and nothing is sent.
  if (typeof data[HONEYPOT] === 'string' && data[HONEYPOT].trim() !== '') {
    console.log(`[${form.id}] honeypot triggered, submission dropped`);
    return json({ ok: true });
  }

  // Same rules as the browser, re-run here because the browser check can be bypassed.
  const { values, errors, ok } = validateForm(form, data);
  if (!ok) return json({ ok: false, message: 'Please check the highlighted fields.', errors }, 400);

  const missing = missingConfig(env);
  if (missing.length) {
    console.error(`[${form.id}] rejecting submission: EMAIL_ENABLED is "${env.EMAIL_ENABLED ?? ''}" but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not set. Set secrets with \`wrangler secret put <NAME>\` and vars in wrangler.jsonc.`);
    return json({ ok: false, message: 'Something went wrong. Please try again.' }, 500);
  }

  const human = await verifyTurnstile(env, data[TURNSTILE_FIELD], request.headers.get('CF-Connecting-IP'));
  if (!human) return json({ ok: false, message: 'We could not verify your submission. Please try again.' }, 403);

  const email = buildEmail(form, values);

  if (env.EMAIL_ENABLED !== 'true') {
    console.log(`[${form.id}] email disabled, logging submission\n${email.subject}\n${email.text}`);
    return json({ ok: true });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: recipients(env),
      reply_to: values.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!res.ok) {
    console.error(`[${form.id}] Resend error ${res.status}: ${await res.text()}`);
    return json({ ok: false, message: 'Something went wrong. Please try again.' }, 502);
  }
  return json({ ok: true });
}

/** Names of required settings that are unset. Skipping Turnstile is only allowed while email is explicitly off. */
function missingConfig(env: Env): string[] {
  const missing: string[] = [];
  if (!env.TURNSTILE_SECRET_KEY && env.EMAIL_ENABLED !== 'false') missing.push('TURNSTILE_SECRET_KEY');
  if (env.EMAIL_ENABLED === 'true') {
    if (!env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
    if (!env.CONTACT_FROM?.trim()) missing.push('CONTACT_FROM');
    if (!recipients(env).length) missing.push('CONTACT_TO');
  }
  return missing;
}

function recipients(env: Env): string[] {
  return (env.CONTACT_TO ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) return null;

  const type = request.headers.get('Content-Type') ?? '';
  try {
    if (type.includes('application/json')) {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return null;
      const parsed: unknown = JSON.parse(text);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    }
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const body = await request.formData();
      const out: Record<string, unknown> = {};
      body.forEach((value, key) => {
        if (typeof value === 'string') out[key] = value;
      });
      return out;
    }
  } catch {
    return null;
  }
  return null;
}

async function verifyTurnstile(env: Env, token: unknown, ip: string | null): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.warn('TURNSTILE_SECRET_KEY not set and EMAIL_ENABLED is "false", skipping Turnstile verification');
    return true;
  }
  if (typeof token !== 'string' || !token) return false;

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const outcome = (await res.json()) as { success?: boolean };
  return outcome.success === true;
}

function buildEmail(form: FormDef, values: Record<string, string>) {
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  const who = values.name || values.email;
  const subject = oneLine(`${form.subject}: ${who}`);
  const rows = form.fields.map((f) => ({ field: f, value: values[f.name] || '(not provided)' }));

  const text = rows
    .map(({ field, value }) => (field.type === 'textarea' ? `${field.label}:\n${value}` : `${field.label}: ${value}`))
    .join('\n\n');

  const cell = 'padding:6px 12px 6px 0;vertical-align:top;';
  const html = `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
<h2 style="font-size:18px;margin:0 0 12px;">${escapeHtml(subject)}</h2>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
${rows
  .map(
    ({ field, value }) =>
      `<tr><th align="left" style="${cell}white-space:nowrap;">${escapeHtml(field.label)}</th>` +
      `<td style="${cell}white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`,
  )
  .join('\n')}
</table>
</body></html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
