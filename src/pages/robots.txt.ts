import type { APIRoute } from 'astro';
import business from '../data/business.json';

export const GET: APIRoute = () => {
  const sitemap = new URL('/sitemap-index.xml', business.siteUrl.value).href;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
