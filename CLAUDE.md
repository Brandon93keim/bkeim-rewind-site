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
2. Resend: `CONTACT_FROM` is currently Resend's test sender `onboarding@resend.dev`, which only
   delivers to the Resend account email (Brandon@bkrewind.com, the current `CONTACT_TO`). Set
   `RESEND_API_KEY` as a secret. To send to anyone else, verify bkrewind.com in Resend and switch
   `CONTACT_FROM` to `website@bkrewind.com`.
3. Deploy (Workers Builds or `npm run deploy`).

`PUBLIC_TURNSTILE_SITE_KEY` is read only at build time (`astro build`), from `.env.production` or
from a build environment variable. If neither is present the widget is left out of the page and
every submission fails the bot check. Runtime vars and secrets cannot supply it.

## Workers Builds (Git deploy)

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch must be the branch you want live on workers.dev. Other branches run the
  non-production command (`npx wrangler versions upload`), which only makes a preview version.
- Secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`) go in the Worker's Settings > Variables and
  Secrets. Plain vars come from `wrangler.jsonc` and are replaced on every deploy.

Local: copy `.env.example` to `.env` and `.dev.vars.example` to `.dev.vars` (keeps EMAIL_ENABLED=false),
then `npm run preview` and post to `http://localhost:8787/api/contact`.
