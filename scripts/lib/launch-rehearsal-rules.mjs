import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';
import { ALWAYS_HIDDEN, listRoutes } from './audit-rules.mjs';

const HOME = '/';

function normalized(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function checkRobots($, route) {
  const robots = $('meta[name="robots"]').map((_, meta) => $(meta).attr('content') ?? '').get();
  if (ALWAYS_HIDDEN.has(route)) {
    return robots.some((content) => /\bnoindex\b/i.test(content))
      ? []
      : [`Page ${route} can be listed on Google after launch, but it must stay noindex. Pass noindex to BaseLayout on this page.`];
  }
  return robots.length === 1 && robots[0] === 'index,follow'
    ? []
    : [`Page ${route} should be index,follow after launch, but its robots tag says "${robots.join(', ')}". Check robotsContent in src/lib/seo.ts and what this page passes to BaseLayout.`];
}

function checkHome($, reviewsHeading) {
  const messages = [];
  const hasHeading = $('h1, h2, h3, h4, h5, h6').toArray().some((heading) => normalized($(heading).text()) === reviewsHeading);
  if (hasHeading) {
    messages.push(`The home page shows the reviews heading "${reviewsHeading}" with no reviews under it. Hide the section in src/components/ReviewsSection.astro when there are no reviews.`);
  }
  if ($('[data-review]').length > 0) {
    messages.push('The home page shows review cards even though every review was deleted. Check where src/pages/index.astro gets its reviews.');
  }
  return messages;
}

export function findLaunchedPageProblems(html, route, { banner, reviewsHeading }) {
  const $ = load(html);
  return [
    ...(normalized($('body').text()).includes(normalized(banner))
      ? [`Page ${route} still shows the preview banner ("${banner}"). Check src/components/PreviewBanner.astro.`]
      : []),
    ...checkRobots($, route),
    ...(route === HOME ? checkHome($, reviewsHeading) : []),
  ];
}

function htmlFileOf(route) {
  return route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1);
}

export async function findLaunchedSiteProblems(distDir, { banner, reviewsHeading }) {
  // Without this, looking for missing wording would find nothing and quietly pass.
  if (!banner || !reviewsHeading) {
    throw new Error('src/data/copy.json no longer has site.previewBanner or home.reviews.heading, so the built pages could not be checked. Update scripts/launch-rehearsal.mjs to read the new names.');
  }
  const routes = await listRoutes(distDir);
  const problems = [HOME, ...ALWAYS_HIDDEN]
    .filter((route) => !routes.includes(route))
    .map((route) => `Page ${route} is missing from the built site, so it could not be checked. Restore it under src/pages/.`);
  for (const route of routes) {
    const html = await readFile(join(distDir, htmlFileOf(route)), 'utf8');
    problems.push(...findLaunchedPageProblems(html, route, { banner, reviewsHeading }));
  }
  return { pages: routes.length, problems };
}
