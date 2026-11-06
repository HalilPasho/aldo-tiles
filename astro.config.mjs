import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import business from './src/data/business.json' with { type: 'json' };

export default defineConfig({
  site: business.siteUrl.value,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => new URL(page).pathname !== '/thank-you/',
    }),
  ],
});
