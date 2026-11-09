import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { load } from 'cheerio';

export const REQUIRED_ROUTES = [
  '/',
  '/services/bathroom-shower-tile-installation/',
  '/services/floor-tile-installation/',
  '/services/kitchen-backsplash-installation/',
  '/services/commercial-tile-installation/',
  '/projects/',
  '/about/',
  '/contact/',
  '/thank-you/',
  '/privacy/',
];

const SEO_FILE = 'src/components/seo/Seo.astro';
const LAYOUT_FILE = 'src/layouts/BaseLayout.astro';
const BANNER_FILE = 'src/components/PreviewBanner.astro';
const COPY_FILE = 'src/data/copy.json';
const FORM_FILE = 'src/components/ContactForm.astro';
const CONFIG_FILE = 'astro.config.mjs';

export const ALWAYS_HIDDEN = new Set(['/thank-you/', '/404.html']);
const NO_BREADCRUMB = new Set(['/', ...ALWAYS_HIDDEN]);
const SERVICE_PAGE = /^\/services\/[^/]+\/$/;
const PROJECT_PAGE = /^\/projects\/[^/]+\/$/;

const OG_TAGS = ['og:title', 'og:description', 'og:url', 'og:type', 'og:image'];
const REVIEW_TYPE = /(Review|AggregateRating)$/;
const REVIEW_PROPERTIES = ['aggregateRating', 'review', 'reviews'];
const REVIEW_MARKUP = '[itemtype*="Review"], [itemtype*="AggregateRating"], [itemprop="aggregateRating"], [itemprop="review"]';
const MAX_SERVICE_OVERLAP = 0.5;

const FORM_ATTRIBUTES = [
  ['method', 'POST', "the browser won't send the message correctly"],
  ['data-netlify', 'true', "messages won't be delivered"],
  ['netlify-honeypot', 'bot-field', 'spam will get through'],
  ['action', '/thank-you/', "people won't see the thank-you page after sending"],
];
const FORM_FIELDS = ['bot-field', 'subject', 'name', 'phone', 'email', 'city', 'projectType', 'service', 'message'];
const FORM_FIELD_CONSEQUENCES = {
  'bot-field': 'spam will get through',
  subject: 'emails from the form arrive with a different subject line and are harder to spot',
};

// Cheerio's .text() would glue the last word of one tag to the first word of the next, and would include scripts.
function textOf($, selector) {
  const parts = [];
  const walk = (node) => {
    if (node.type === 'text') parts.push(node.data);
    else if (node.type === 'tag') node.children.forEach(walk);
  };
  $(selector).first().get().forEach(walk);
  return parts.join(' ');
}

function normalized(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function metaContent($, selector) {
  return ($(selector).first().attr('content') ?? '').trim();
}

function checkLength(label, text, min, max, route) {
  if (!text) return [`Page ${route} has no ${label}. Give it a ${label} of ${min} to ${max} characters in the file that sets this page's wording.`];
  if (text.length >= min && text.length <= max) return [];
  return [`Page ${route}'s ${label} is ${text.length} characters long. Make it ${min} to ${max} characters in the file that sets this page's wording.`];
}

// seo.ts always adds a trailing slash, and the canonical of a hidden error page carries no SEO weight.
function canonicalTargets(route, siteUrl) {
  const canonical = new URL(route, siteUrl).href;
  return route === '/404.html'
    ? [canonical, `${canonical}/`, new URL('/404/', siteUrl).href]
    : [canonical];
}

function checkBasics($, route, siteUrl) {
  const messages = [];
  if (!$('html').attr('lang')?.trim()) {
    messages.push(`Page ${route} lost the lang setting on its <html> tag. Screen readers and Google use it to know the language. Put lang="en" back in ${LAYOUT_FILE}.`);
  }
  if (!metaContent($, 'meta[name="viewport"]').includes('width=device-width')) {
    messages.push(`Page ${route} lost its viewport tag. Without it, the page looks tiny on phones. Put it back in ${SEO_FILE}.`);
  }
  const headings = $('h1').length;
  if (headings === 0) {
    messages.push(`Page ${route} has no main heading (h1). Add exactly one <h1> to the page.`);
  } else if (headings > 1) {
    messages.push(`Page ${route} has ${headings} main headings (h1). Keep one <h1> and change the others to <h2>.`);
  }
  messages.push(...checkLength('title', $('head > title').first().text().trim(), 10, 65, route));
  messages.push(...checkLength('description', metaContent($, 'meta[name="description"]'), 50, 165, route));

  const canonicals = $('link[rel="canonical"]').map((_, link) => $(link).attr('href')).get();
  if (canonicals.length !== 1 || !canonicalTargets(route, siteUrl).includes(canonicals[0])) {
    messages.push(`Page ${route} needs one canonical tag (it tells Google the page's real address) set to ${new URL(route, siteUrl).href}. Check the path passed to ${SEO_FILE}.`);
  }
  for (const tag of OG_TAGS) {
    if (metaContent($, `meta[property="${tag}"]`)) continue;
    messages.push(tag === 'og:image'
      ? `Page ${route} lost its og:image tag, the picture shown when the page is shared. Without it, links shared on social media look wrong. Check the default share image imported at the top of ${LAYOUT_FILE}, and any ogImage this page passes to BaseLayout. ${SEO_FILE} writes the tag and is protected, so don't edit it.`
      : `Page ${route} lost its ${tag} tag. Without it, links shared on social media look wrong. Put it back in ${SEO_FILE}.`);
  }
  return messages;
}

function checkRobots($, route, launchReady) {
  const robots = $('meta[name="robots"]').map((_, meta) => $(meta).attr('content') ?? '').get().join(',').trim().toLowerCase();
  if (!robots) return [`Page ${route} lost its robots tag, which tells Google whether to list the page. Put it back in ${SEO_FILE}.`];

  const hidden = /\b(noindex|none)\b/.test(robots);
  if (!launchReady && !hidden) {
    return [`Page ${route} can be listed on Google before launch. Every page must have noindex until launchReady is on. Restore the robots tag in ${SEO_FILE}.`];
  }
  if (launchReady && ALWAYS_HIDDEN.has(route) && !hidden) {
    return [`Page ${route} must stay hidden from Google, even after launch. Pass noindex to BaseLayout on this page.`];
  }
  if (launchReady && !ALWAYS_HIDDEN.has(route) && hidden) {
    return [`Page ${route} is hidden from Google even though the site has launched. Remove noindex from this page.`];
  }
  return [];
}

function checkPreviewBanner($, route, launchReady, previewBanner, showPreviewBanner = true) {
  if (launchReady) return [];
  if (!showPreviewBanner) {
    return $('.preview-banner').length ? [`Page ${route} still shows the preview banner although site-settings.json disables it.`] : [];
  }
  // Without the wording, every page would contain the empty text and the check would quietly pass.
  if (!previewBanner?.trim()) {
    throw new Error(`The audit needs the preview banner's wording, site.previewBanner in ${COPY_FILE}, to check the pages before launch.`);
  }
  if (normalized(textOf($, 'body')).includes(normalized(previewBanner))) return [];
  return [`Page ${route} lost the preview banner ("${previewBanner}"), which tells visitors the site still shows sample content. Every page must show it until launchReady is on. Keep ${BANNER_FILE}, and the <PreviewBanner /> line in ${LAYOUT_FILE} that puts it on every page. Restyle it freely.`];
}

function visitObjects(value, visit) {
  if (Array.isArray(value)) {
    value.forEach((item) => visitObjects(item, visit));
  } else if (value !== null && typeof value === 'object') {
    visit(value);
    Object.values(value).forEach((item) => visitObjects(item, visit));
  }
}

function checkStructuredData($, route) {
  const messages = [];
  const types = new Set();
  let hasReviewData = $(REVIEW_MARKUP).length > 0;
  let hasStreetAddress = false;

  $('script[type="application/ld+json"]').each((index, script) => {
    let data;
    try {
      data = JSON.parse($(script).html() ?? '');
    } catch {
      messages.push(`Page ${route} has structured data (hidden details for Google) that is broken, in block ${index + 1}. Google can't read it. Check the schema passed to ${SEO_FILE}.`);
      return;
    }
    visitObjects(data, (node) => {
      for (const type of [node['@type'] ?? []].flat()) {
        types.add(type);
        if (REVIEW_TYPE.test(type)) hasReviewData = true;
      }
      if (REVIEW_PROPERTIES.some((property) => property in node)) hasReviewData = true;
      if ('streetAddress' in node) hasStreetAddress = true;
    });
  });

  const requireType = (type, purpose) => {
    if (!types.has(type)) {
      messages.push(`Page ${route} lost its "${type}" structured data, which ${purpose}. Put it back in the schema this page passes to BaseLayout.`);
    }
  };
  if (route === '/') requireType('HomeAndConstructionBusiness', 'tells Google about the business');
  if (SERVICE_PAGE.test(route)) {
    requireType('Service', 'tells Google about this service');
    requireType('HomeAndConstructionBusiness', "tells Google who provides this service (the Service data's provider points to it)");
  }
  if (!NO_BREADCRUMB.has(route)) requireType('BreadcrumbList', "shows Google where the page sits in the site");
  if (hasReviewData) {
    messages.push(`Page ${route} has rating or review structured data, which this site must never publish. Remove it. Reviews can only appear as normal text on the page.`);
  }
  if (hasStreetAddress) {
    messages.push(`Page ${route} has a street address in its structured data, which this site must never publish. Remove it. Structured data uses Mississauga, ON, CA only.`);
  }
  return messages;
}

function checkImages($, route) {
  const messages = [];
  $('img').each((_, element) => {
    const image = $(element);
    const missing = [
      ...(image.attr('alt') === undefined ? ['alt'] : []),
      ...['width', 'height'].filter((attribute) => !image.attr(attribute)),
    ];
    if (missing.length > 0) {
      messages.push(`An image on page ${route} (${image.attr('src') ?? 'no source'}) is missing ${missing.join(', ')}. Alt text describes it for people who can't see it, and the size stops the page jumping as it loads. Add them, or use Astro's <Image> component.`);
    }
  });
  return messages;
}

function digitsOf(phone) {
  return phone.replace(/[^\d+]/g, '');
}

function checkContact($, route, phoneE164) {
  const numbers = $('a[href^="tel:"]').map((_, link) => $(link).attr('href').slice('tel:'.length)).get();
  if (numbers.length === 0) {
    return [`Page ${route} has no tap-to-call link. Add a link to tel:${phoneE164}, using the phone from src/data/business.json.`];
  }
  return numbers
    .filter((number) => digitsOf(number) !== digitsOf(phoneE164))
    .map((number) => `Page ${route} has a tap-to-call link to ${number}, but the business number is ${phoneE164}. Use the phone from src/data/business.json.`);
}

export function auditPage(html, route, { launchReady, siteUrl, phoneE164, previewBanner, showPreviewBanner = true }) {
  const $ = load(html);
  return [
    ...checkBasics($, route, siteUrl),
    ...checkRobots($, route, launchReady),
    ...checkPreviewBanner($, route, launchReady, previewBanner, showPreviewBanner),
    ...checkStructuredData($, route),
    ...checkImages($, route),
    ...checkContact($, route, phoneE164),
  ].map((message) => ({ where: route, message }));
}

function formProblem(lost, consequence) {
  return {
    where: '/contact/',
    message: `The contact form on /contact/ lost ${lost}. Without it, ${consequence}. Put it back in ${FORM_FILE}.`,
  };
}

export function auditForm(html, delivery = {}) {
  const $ = load(html);
  const named = $('form[name="contact"]');
  const form = named.length > 0 ? named.first() : $('form').first();
  if (form.length === 0) {
    return [{
      where: '/contact/',
      message: `The contact form on /contact/ is gone. Without it, nobody can send a message. Put it back using ${FORM_FILE}.`,
    }];
  }

  const problems = named.length > 0 ? [] : [formProblem('name="contact"', "messages won't be delivered")];
  const provider = delivery.provider ?? 'netlify';
  if (!['netlify', 'formsubmit'].includes(provider)) return [{ where: '/contact/', message: 'The form delivery provider is not supported.' }];
  if (provider === 'formsubmit' && (!delivery.recipientEmail || !delivery.siteUrl)) return [{ where: '/contact/', message: 'FormSubmit needs the business email and website address to deliver messages and return visitors.' }];
  const attributes = provider === 'formsubmit' ? [
    ['method', 'POST', "the browser won't send the message correctly"],
    ['action', `https://formsubmit.co/${delivery.recipientEmail}`, "messages won't reach the business email"],
  ] : FORM_ATTRIBUTES;
  for (const [attribute, value, consequence] of attributes) {
    const actual = form.attr(attribute);
    const matches = attribute === 'method' ? actual?.toUpperCase() === value : actual === value;
    if (!matches) problems.push(formProblem(`${attribute}="${value}"`, consequence));
  }
  const fields = new Set(form.find('input, select, textarea').map((_, field) => $(field).attr('name')).get());
  const requiredFields = provider === 'formsubmit' ? [...FORM_FIELDS, '_subject', '_next', '_honey'] : FORM_FIELDS;
  for (const field of requiredFields) {
    if (!fields.has(field)) {
      problems.push(formProblem(`its "${field}" field`, FORM_FIELD_CONSEQUENCES[field] ?? "that detail won't reach the business"));
    }
  }
  if (provider === 'formsubmit') {
    const expectedNext = new URL('/thank-you/', delivery.siteUrl).href;
    if (fields.has('_next') && form.find('[name="_next"]').attr('value') !== expectedNext) problems.push(formProblem('its correct "_next" return address', "people won't return to the site's thank-you page"));
    const subject = form.find('[name="subject"]').attr('value');
    if (fields.has('_subject') && (!subject || form.find('[name="_subject"]').attr('value') !== subject)) problems.push(formProblem('its matching "_subject" value', 'email notifications will have the wrong subject'));
    if (fields.has('_honey') && (form.find('[name="_honey"]').attr('type') !== 'text' || form.find('[name="_honey"]').attr('tabindex') !== '-1')) problems.push(formProblem('its protected "_honey" spam trap', 'spam protection or keyboard navigation may fail'));
  }
  return problems;
}

async function listFiles(distDir) {
  try {
    const entries = await readdir(distDir, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => relative(distDir, join(entry.parentPath, entry.name)).split(sep).join('/'))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function routeOf(file) {
  return file === 'index.html' || file.endsWith('/index.html') ? `/${file.slice(0, -'index.html'.length)}` : `/${file}`;
}

export async function listRoutes(distDir) {
  const files = await listFiles(distDir);
  return files.filter((file) => file.endsWith('.html')).map(routeOf);
}

function checkDuplicates(pages, label, read) {
  const routesByText = new Map();
  for (const [route, $] of pages) {
    const text = read($);
    if (text) routesByText.set(text, [...(routesByText.get(text) ?? []), route]);
  }
  return [...routesByText.values()]
    .filter((routes) => routes.length > 1)
    .map((routes) => ({
      where: routes.join(', '),
      message: `These pages have the same ${label}: ${routes.join(', ')}. Give each page its own, so Google can tell them apart.`,
    }));
}

function parseUrl(href, base) {
  try {
    return new URL(href, base);
  } catch {
    return null;
  }
}

function linkResolves(pathname, files) {
  let path;
  try {
    path = decodeURIComponent(pathname).slice(1);
  } catch {
    return false;
  }
  if (path === '' || path.endsWith('/')) return files.has(`${path}index.html`);
  return files.has(path) || files.has(`${path}/index.html`) || files.has(`${path}.html`);
}

function checkLinks(pages, files, siteUrl) {
  const { origin } = new URL(siteUrl);
  const brokenLinks = new Map();
  for (const [route, $] of pages) {
    $('a[href]').each((_, link) => {
      const href = $(link).attr('href');
      const url = parseUrl(href, new URL(route, siteUrl));
      if (url && url.origin !== origin) return;
      if (url && linkResolves(url.pathname, files)) return;
      const target = url ? url.pathname : href;
      brokenLinks.set(target, new Set([...(brokenLinks.get(target) ?? []), route]));
    });
  }
  return [...brokenLinks].map(([target, routes]) => ({
    where: [...routes].join(', '),
    message: `The link to ${target} goes nowhere. It's on ${[...routes].join(', ')}. Fix the link, or add the page it points to.`,
  }));
}

function checkRoutes(routes) {
  const built = new Set(routes);
  const problems = [...REQUIRED_ROUTES, '/404.html']
    .filter((route) => !built.has(route))
    .map((route) => ({
      where: route,
      message: `The page ${route} is missing from the built site. Add it under src/pages/, or restore its content file in src/content/.`,
    }));
  if (!routes.some((route) => PROJECT_PAGE.test(route))) {
    problems.push({
      where: '/projects/',
      message: 'There are no project pages like /projects/<name>/ in the built site. Add at least one project in src/content/projects/.',
    });
  }
  return problems;
}

async function checkSitemap(distDir, files, siteUrl) {
  const problems = [];
  if (!files.has('robots.txt')) {
    problems.push({ where: 'robots.txt', message: 'robots.txt is missing from the built site. Search engines read it first. Restore src/pages/robots.txt.ts.' });
  }
  if (!files.has('sitemap-index.xml')) {
    problems.push({ where: 'sitemap-index.xml', message: `sitemap-index.xml is missing from the built site, so Google can't find the page list. Restore the sitemap setting in ${CONFIG_FILE}.` });
    return problems;
  }

  const index = load(await readFile(join(distDir, 'sitemap-index.xml'), 'utf8'), { xml: true });
  const sitemaps = index('sitemap > loc').map((_, loc) => index(loc).text().trim()).get();
  if (sitemaps.length === 0) {
    problems.push({ where: 'sitemap-index.xml', message: `sitemap-index.xml lists no page lists. Restore the sitemap setting in ${CONFIG_FILE}.` });
  }
  for (const sitemap of sitemaps) {
    const file = parseUrl(sitemap, siteUrl)?.pathname.slice(1);
    if (!files.has(file)) {
      problems.push({ where: 'sitemap-index.xml', message: `sitemap-index.xml points to ${sitemap}, but that file wasn't built. Restore the sitemap setting in ${CONFIG_FILE}.` });
      continue;
    }
    const $ = load(await readFile(join(distDir, file), 'utf8'), { xml: true });
    const paths = $('url > loc').map((_, loc) => parseUrl($(loc).text().trim(), siteUrl)?.pathname).get();
    if (paths.some((path) => path.replace(/\/*$/, '/') === '/thank-you/')) {
      problems.push({ where: file, message: `The sitemap lists /thank-you/, but that page must stay out of Google. Put the /thank-you/ filter back in ${CONFIG_FILE}.` });
    }
  }
  return problems;
}

function trigramsOf(text) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return new Set(words.slice(2).map((word, index) => `${words[index]} ${words[index + 1]} ${word}`));
}

function overlapOf(first, second) {
  const smaller = Math.min(first.size, second.size);
  if (smaller === 0) return 0;
  return [...first].filter((trigram) => second.has(trigram)).length / smaller;
}

// The share of the shorter text's three-word phrases that also appear in the other text.
export function trigramOverlap(textA, textB) {
  return overlapOf(trigramsOf(textA), trigramsOf(textB));
}

function mainText($) {
  return textOf($, 'main');
}

function checkServicePages(pages) {
  const problems = [];
  const services = [];
  for (const [route, $] of pages) {
    if (!SERVICE_PAGE.test(route)) continue;
    const trigrams = trigramsOf(mainText($));
    if (trigrams.size === 0) {
      problems.push({
        where: route,
        message: `Service page ${route} has no wording inside its <main> section, so it can't be compared with the other service pages. Restore <main> in ${LAYOUT_FILE} and the wording in src/content/services/.`,
      });
    } else {
      services.push({ route, trigrams });
    }
  }
  services.forEach((first, index) => {
    for (const second of services.slice(index + 1)) {
      const overlap = overlapOf(first.trigrams, second.trigrams);
      if (overlap >= MAX_SERVICE_OVERLAP) {
        problems.push({
          where: `${first.route}, ${second.route}`,
          message: `Service pages ${first.route} and ${second.route} share ${Math.round(overlap * 100)}% of their wording, and must share under 50%. Google may treat near-copies as one page. Rewrite one of them in src/content/services/.`,
        });
      }
    }
  });
  return problems;
}

async function readBusiness(businessPath) {
  const text = await readFile(businessPath, 'utf8');
  const business = JSON.parse(text.replace(/^\uFEFF/, ''));
  return {
    launchReady: Boolean(business.launchReady),
    siteUrl: business.siteUrl.value,
    phoneE164: business.phone.e164,
    recipientEmail: business.email?.value,
  };
}

async function readCopy(copyPath) {
  const text = await readFile(copyPath, 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

export async function auditSite(distDir, businessPath, copyPath, settingsPath = join(dirname(businessPath), 'site-settings.json')) {
  let options;
  try {
    options = await readBusiness(businessPath);
  } catch {
    return [{ where: businessPath, message: `${businessPath} has a mistake or is missing, so the site could not be checked. Fix the file and run the check again.` }];
  }
  let copy;
  try {
    copy = await readCopy(copyPath);
  } catch {
    return [{ where: copyPath, message: `${copyPath} has a mistake or is missing, so the site could not be checked. Fix the file and run the check again.` }];
  }
  let settings = {};
  try {
    settings = JSON.parse(await readFile(settingsPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') return [{ where: settingsPath, message: 'Site settings cannot be read. Fix the configuration before publishing.' }];
  }
  if (settings.showPreviewBanner !== undefined && typeof settings.showPreviewBanner !== 'boolean') return [{ where: settingsPath, message: 'showPreviewBanner must be true or false.' }];
  if (settings.formProvider !== undefined && !['netlify', 'formsubmit'].includes(settings.formProvider)) return [{ where: settingsPath, message: 'Choose a supported form delivery provider.' }];
  options.showPreviewBanner = settings.showPreviewBanner !== false;
  options.formProvider = settings.formProvider ?? 'netlify';
  options.previewBanner = copy.site?.previewBanner;
  if (!options.launchReady && !(typeof options.previewBanner === 'string' && options.previewBanner.trim())) {
    return [{ where: copyPath, message: `${copyPath} has no site.previewBanner, the wording of the "Preview: sample content" banner, so the pages could not be checked for it. Put the wording back under site.previewBanner.` }];
  }

  const fileList = await listFiles(distDir);
  if (fileList.length === 0) {
    return [{ where: distDir, message: `There is no built site in ${distDir}. Run npm run build, then run the check again.` }];
  }
  const files = new Set(fileList);

  const htmlByRoute = new Map();
  for (const file of fileList.filter((name) => name.endsWith('.html'))) {
    htmlByRoute.set(routeOf(file), await readFile(join(distDir, file), 'utf8'));
  }
  const pages = new Map([...htmlByRoute].map(([route, html]) => [route, load(html)]));
  const routes = [...pages.keys()];

  return [
    ...checkRoutes(routes),
    ...(await checkSitemap(distDir, files, options.siteUrl)),
    ...[...htmlByRoute].flatMap(([route, html]) => auditPage(html, route, options)),
    ...(htmlByRoute.has('/contact/') ? auditForm(htmlByRoute.get('/contact/'), { provider: options.formProvider, recipientEmail: options.recipientEmail, siteUrl: options.siteUrl }) : []),
    ...checkDuplicates(pages, 'title', ($) => $('head > title').first().text().trim()),
    ...checkDuplicates(pages, 'description', ($) => metaContent($, 'meta[name="description"]')),
    ...checkLinks(pages, files, options.siteUrl),
    ...checkServicePages(pages),
  ];
}
