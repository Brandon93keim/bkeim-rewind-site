// @ts-check
import { readFile, writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';

/**
 * Writes dist/sitemap.xml from the built pages, skipping any page marked noindex
 * (404, placeholder pages). New pages and project detail pages are picked up automatically.
 * @returns {import('astro').AstroIntegration}
 */
function sitemap() {
  /** @type {URL | undefined} */
  let site;
  return {
    name: 'sitemap',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site ? new URL(config.site) : undefined;
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (!site) return logger.warn('No `site` configured; skipping sitemap.xml');
        const urls = [];
        for (const { pathname } of pages) {
          const path = pathname.replace(/^\/|\/$/g, '');
          const html = await readFile(new URL(`${path || 'index'}.html`, dir), 'utf8').catch(() => '');
          if (!html || /<meta name="robots" content="[^"]*noindex/.test(html)) continue;
          urls.push(new URL(path ? `/${path}` : '/', site).href);
        }
        urls.sort();
        const xml =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          urls.map((u) => `  <url><loc>${u}</loc></url>\n`).join('') +
          '</urlset>\n';
        await writeFile(new URL('sitemap.xml', dir), xml);
        logger.info(`sitemap.xml: ${urls.length} URLs`);
      },
    },
  };
}

export default defineConfig({
  // Production domain. Canonical URLs, og:url, sitemap.xml and robots.txt all derive from this.
  // bkrewind.com is NOT attached to the Worker yet (see CLAUDE.md); this only affects metadata.
  site: 'https://bkrewind.com',
  trailingSlash: 'never',
  // Inline all CSS: it is small, and this removes render-blocking requests from first paint.
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [sitemap()],
  vite: {
    server: {
      // `npm run dev:api` runs the Worker on 8787; forward form posts to it during `astro dev`.
      proxy: { '/api': 'http://localhost:8787' },
    },
  },
});
