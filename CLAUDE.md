# B Keim Rewind Marketing site

Astro static site served by a Cloudflare Worker, same setup as `coxparker-site`. `worker/index.ts`
handles `POST /api/contact`; everything else is static assets from `dist/`. Replaces the Wix site at
bkrewind.com.

## Pages

Paths are fixed to match the old Wix URLs: `/`, `/about-us`, `/portfolio`, `/services`, `/contact-us`.
`/blog` is intentionally skipped for now (404).

## Brand

Pine `#1e3d34`, sage `#86c1a6`, blush `#f1cfc4`, bone `#f5efe5` (full set in `src/styles/tokens.css`).
Archivo for headings and body, Space Mono for eyebrows and accents. Both self-hosted via @fontsource.

## Copy

All placeholder copy starts with `TODO` and carries the `.todo` class (dashed outline) so it is
visible on the page. Image slots use `Placeholder.astro`. `grep -rn TODO src` lists everything left.

## Domain

- `site` in `astro.config.mjs` is `https://bkrewind.com`; canonical URLs, sitemap and robots derive from it.
- **Not attached yet.** The Worker is on the default `*.workers.dev` URL only. Do not add `routes`
  or a custom domain in `wrangler.jsonc` until bkrewind.com has moved off Wix.

## Contact form

Shared definition in `src/lib/forms.ts` (name, email, phone, service interest, message), validated
in the browser and again in the Worker. Bot protection: honeypot + Cloudflare Turnstile. Email goes
out through Resend to `CONTACT_TO` with `reply_to` set to the visitor.

One-time setup before the form can send:

1. Turnstile: create a widget in Cloudflare (hostnames: the workers.dev host now, bkrewind.com later).
   Put the site key in `.env.production` as `PUBLIC_TURNSTILE_SITE_KEY`, then
   `npx wrangler secret put TURNSTILE_SECRET_KEY`.
2. Resend: verify bkrewind.com as a sending domain (or change `CONTACT_FROM` to an already-verified
   domain), then `npx wrangler secret put RESEND_API_KEY`.
3. `npm run deploy`.

Local: copy `.env.example` to `.env` and `.dev.vars.example` to `.dev.vars` (keeps EMAIL_ENABLED=false),
then `npm run preview` and post to `http://localhost:8787/api/contact`.
