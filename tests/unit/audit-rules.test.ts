import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, type CheerioAPI } from 'cheerio';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  auditForm,
  auditPage,
  auditSite,
  listRoutes,
  REQUIRED_ROUTES,
  trigramOverlap,
} from '../../scripts/lib/audit-rules.mjs';

const SITE = 'https://aldotile.example';
const PHONE = '+16475550100';
const BANNER = 'Preview: sample content';
const PREVIEW = { launchReady: false, siteUrl: SITE, phoneE164: PHONE, previewBanner: BANNER };
const LAUNCHED = { ...PREVIEW, launchReady: true };

const SERVICE = '/services/floor-tile-installation/';
const SERVICE_ROUTES = REQUIRED_ROUTES.filter((route: string) => route.startsWith('/services/'));
const ALWAYS_HIDDEN = ['/thank-you/', '/404.html'];

interface PageOptions {
  launchReady?: boolean;
  siteUrl?: string;
  phoneE164?: string;
  title?: string;
  description?: string;
  main?: string;
  nav?: string[];
  banner?: string;
}

function schemaFor(route: string): object[] {
  const business = { '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': `${SITE}/#business`, name: 'Aldo Tile' };
  if (route === '/') return [business];
  if (ALWAYS_HIDDEN.includes(route)) return [];
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [] };
  const service = { '@type': 'Service', name: 'Tile', provider: { '@id': business['@id'] } };
  return route.startsWith('/services/') ? [service, business, breadcrumb] : [breadcrumb];
}

function pageHtml(route: string, options: PageOptions = {}): string {
  const {
    launchReady = false,
    siteUrl = SITE,
    phoneE164 = PHONE,
    title = 'Aldo Tile: tile installation',
    description = 'Aldo Tile installs tile in Mississauga and in the nearby cities.',
    main = '<p>Good tile work.</p>',
    nav = [],
    banner = BANNER,
  } = options;
  const canonical = new URL(route, siteUrl).href;
  const robots = launchReady && !ALWAYS_HIDDEN.includes(route) ? 'index,follow' : 'noindex,follow';
  const schema = schemaFor(route)
    .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
    .join('');
  const links = nav.map((href) => `<a href="${href}">Link</a>`).join('');
  const previewBanner = launchReady ? '' : `<aside class="preview-banner"><p>${banner}</p></aside>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:image" content="${siteUrl}/_astro/share.jpg">
${schema}</head><body>${previewBanner}<nav>${links}</nav><main id="main"><h1>Heading</h1>
<img src="/a.webp" alt="Tiled floor" width="800" height="600">${main}</main>
<footer><a href="tel:${phoneE164}">Call</a></footer></body></html>`;
}

function edit(html: string, change: ($: CheerioAPI) => void): string {
  const $ = load(html);
  change($);
  return $.html();
}

function messages(problems: { message: string }[]): string[] {
  return problems.map((problem) => problem.message);
}

function onlyProblem(pattern: RegExp) {
  return [expect.stringMatching(pattern)];
}

function auditAbout(change: ($: CheerioAPI) => void) {
  return messages(auditPage(edit(pageHtml('/about/'), change), '/about/', PREVIEW));
}

function textOfLength(length: number): string {
  return 'x'.repeat(length);
}

describe('auditPage: page basics', () => {
  it('finds nothing wrong with a good page', () => {
    for (const route of [...REQUIRED_ROUTES, '/projects/sample-bathroom/', '/404.html']) {
      expect(auditPage(pageHtml(route), route, PREVIEW)).toEqual([]);
      expect(auditPage(pageHtml(route, { launchReady: true }), route, LAUNCHED)).toEqual([]);
    }
  });

  it('names the page in where and in the message', () => {
    const [problem] = auditPage(edit(pageHtml('/about/'), ($) => $('h1').remove()), '/about/', PREVIEW);
    expect(problem.where).toBe('/about/');
    expect(problem.message).toContain('/about/');
  });

  it.each<[string, ($: CheerioAPI) => void, RegExp]>([
    ['lang removed', ($) => { $('html').removeAttr('lang'); }, /lang/],
    ['lang empty', ($) => { $('html').attr('lang', ''); }, /lang/],
    ['viewport removed', ($) => { $('meta[name="viewport"]').remove(); }, /viewport/],
    ['viewport not device width', ($) => { $('meta[name="viewport"]').attr('content', 'width=1200'); }, /viewport/],
    ['no h1', ($) => { $('h1').remove(); }, /no main heading/],
    ['two h1', ($) => { $('main').append('<h1>Another</h1>'); }, /2 main headings/],
    ['title removed', ($) => { $('title').remove(); }, /no title/],
    ['title of 9 characters', ($) => { $('title').text(textOfLength(9)); }, /title is 9 characters/],
    ['title of 66 characters', ($) => { $('title').text(textOfLength(66)); }, /title is 66 characters/],
    ['description removed', ($) => { $('meta[name="description"]').remove(); }, /no description/],
    ['description of 49 characters', ($) => { $('meta[name="description"]').attr('content', textOfLength(49)); }, /description is 49 characters/],
    ['description of 166 characters', ($) => { $('meta[name="description"]').attr('content', textOfLength(166)); }, /description is 166 characters/],
    ['canonical removed', ($) => { $('link[rel="canonical"]').remove(); }, /canonical/],
    ['canonical to another page', ($) => { $('link[rel="canonical"]').attr('href', `${SITE}/contact/`); }, /canonical/],
    ['canonical on another site', ($) => { $('link[rel="canonical"]').attr('href', 'https://other.example/about/'); }, /canonical/],
    ['canonical without trailing slash', ($) => { $('link[rel="canonical"]').attr('href', `${SITE}/about`); }, /canonical/],
    ['a second canonical', ($) => { $('head').append(`<link rel="canonical" href="${SITE}/contact/">`); }, /canonical/],
    ['og:title removed', ($) => { $('meta[property="og:title"]').remove(); }, /og:title/],
    ['og:description removed', ($) => { $('meta[property="og:description"]').remove(); }, /og:description/],
    ['og:url removed', ($) => { $('meta[property="og:url"]').remove(); }, /og:url/],
    ['og:type removed', ($) => { $('meta[property="og:type"]').remove(); }, /og:type/],
    ['og:image removed', ($) => { $('meta[property="og:image"]').remove(); }, /og:image/],
    ['og:title empty', ($) => { $('meta[property="og:title"]').attr('content', ''); }, /og:title/],
  ])('reports %s', (_name, change, pattern) => {
    expect(auditAbout(change)).toEqual(onlyProblem(pattern));
  });

  it('sends a lost og:image to the share image in BaseLayout first, and names Seo.astro as protected', () => {
    const [message] = auditAbout(($) => { $('meta[property="og:image"]').remove(); });
    expect(message).toMatch(/share image.*src\/layouts\/BaseLayout\.astro.*src\/components\/seo\/Seo\.astro.*protected/);
  });

  it.each<[string, ($: CheerioAPI) => void]>([
    ['title of 10 characters', ($) => { $('title').text(textOfLength(10)); }],
    ['title of 65 characters', ($) => { $('title').text(textOfLength(65)); }],
    ['description of 50 characters', ($) => { $('meta[name="description"]').attr('content', textOfLength(50)); }],
    ['description of 165 characters', ($) => { $('meta[name="description"]').attr('content', textOfLength(165)); }],
    ['a title inside an svg icon', ($) => { $('footer').append('<svg><title>x</title></svg>'); }],
  ])('accepts %s', (_name, change) => {
    expect(auditAbout(change)).toEqual([]);
  });

  it('counts a title by its characters, not its HTML codes', () => {
    const html = pageHtml('/about/').replace(/<title>.*?<\/title>/, `<title>${'&amp;'.repeat(65)}</title>`);
    expect(messages(auditPage(html, '/about/', PREVIEW))).toEqual([]);
  });

  it.each(['/404/', '/404.html/', '/404.html'])('accepts %s as the canonical of the 404 page', (path) => {
    const html = edit(pageHtml('/404.html'), ($) => { $('link[rel="canonical"]').attr('href', `${SITE}${path}`); });
    expect(auditPage(html, '/404.html', PREVIEW)).toEqual([]);
  });

  it('still reports a 404 page whose canonical points somewhere else', () => {
    const html = edit(pageHtml('/404.html'), ($) => { $('link[rel="canonical"]').attr('href', `${SITE}/about/`); });
    expect(messages(auditPage(html, '/404.html', PREVIEW))).toEqual(onlyProblem(/canonical/));
  });

  it('works when siteUrl ends with a slash', () => {
    expect(auditPage(pageHtml('/about/'), '/about/', { ...PREVIEW, siteUrl: `${SITE}/` })).toEqual([]);
  });
});

describe('auditPage: robots', () => {
  it('reports a page open to Google before launch', () => {
    const html = edit(pageHtml('/about/', { launchReady: true }), ($) => { $('body').prepend(`<aside>${BANNER}</aside>`); });
    expect(messages(auditPage(html, '/about/', PREVIEW))).toEqual(onlyProblem(/before launch/));
  });

  it('reports a hidden page after launch', () => {
    const html = pageHtml('/about/', { launchReady: false });
    expect(messages(auditPage(html, '/about/', LAUNCHED))).toEqual(onlyProblem(/hidden from Google/));
  });

  it.each(ALWAYS_HIDDEN)('reports %s when it is open to Google after launch', (route) => {
    const html = edit(pageHtml(route, { launchReady: true }), ($) => { $('meta[name="robots"]').attr('content', 'index,follow'); });
    expect(messages(auditPage(html, route, LAUNCHED))).toEqual(onlyProblem(/must stay hidden/));
  });

  it('reports a missing robots tag', () => {
    expect(auditAbout(($) => { $('meta[name="robots"]').remove(); })).toEqual(onlyProblem(/robots/));
    const html = edit(pageHtml('/about/', { launchReady: true }), ($) => { $('meta[name="robots"]').remove(); });
    expect(messages(auditPage(html, '/about/', LAUNCHED))).toEqual(onlyProblem(/robots/));
  });

  it('treats the "none" value as hidden', () => {
    const html = edit(pageHtml('/about/', { launchReady: true }), ($) => { $('meta[name="robots"]').attr('content', 'NONE'); });
    expect(messages(auditPage(html, '/about/', LAUNCHED))).toEqual(onlyProblem(/hidden from Google/));
  });
});

describe('auditPage: preview banner', () => {
  it.each([...REQUIRED_ROUTES, '/404.html'])('reports %s without the banner before launch', (route) => {
    const html = edit(pageHtml(route), ($) => { $('.preview-banner').remove(); });
    expect(messages(auditPage(html, route, PREVIEW))).toEqual(
      onlyProblem(/preview banner.*src\/components\/PreviewBanner\.astro.*src\/layouts\/BaseLayout\.astro/),
    );
  });

  it('reports a banner whose wording changed', () => {
    expect(auditAbout(($) => { $('.preview-banner p').text('Coming soon'); })).toEqual(onlyProblem(/preview banner/));
  });

  it('finds the banner wherever it sits, split across lines or tags', () => {
    expect(auditAbout(($) => {
      $('.preview-banner').remove();
      $('footer').append('<div>\n  Preview:\n  <strong>sample</strong> content\n</div>');
    })).toEqual([]);
  });

  it('does not count the wording inside a script', () => {
    expect(auditAbout(($) => {
      $('.preview-banner').remove();
      $('footer').append(`<script>const text = "${BANNER}";</script>`);
    })).toEqual(onlyProblem(/preview banner/));
  });

  it('does not ask for the banner once the site has launched', () => {
    const html = pageHtml('/about/', { launchReady: true });
    expect(html).not.toContain(BANNER);
    expect(auditPage(html, '/about/', LAUNCHED)).toEqual([]);
    expect(auditPage(html, '/about/', { ...LAUNCHED, previewBanner: undefined })).toEqual([]);
  });

  it('refuses to check a preview page without the banner wording, rather than pass it', () => {
    expect(() => auditPage(pageHtml('/about/'), '/about/', { ...PREVIEW, previewBanner: '' })).toThrow(/site\.previewBanner/);
  });
});

describe('auditPage: structured data', () => {
  function withBlock(route: string, block: string): string {
    return pageHtml(route).replace('</head>', `<script type="application/ld+json">${block}</script></head>`);
  }

  it('reports a block that does not parse', () => {
    expect(messages(auditPage(withBlock('/about/', '{broken'), '/about/', PREVIEW))).toEqual(onlyProblem(/structured data.*broken/));
  });

  it('reports an empty block', () => {
    expect(messages(auditPage(withBlock('/about/', ''), '/about/', PREVIEW))).toEqual(onlyProblem(/structured data.*broken/));
  });

  it('reports a raw closing script tag that cuts a block short', () => {
    const html = withBlock('/about/', '{"name":"a</script>b"}');
    expect(messages(auditPage(html, '/about/', PREVIEW))).toEqual(onlyProblem(/structured data.*broken/));
  });

  it('accepts a closing script tag escaped the way serializeJsonLd does it', () => {
    const html = withBlock('/about/', '{"name":"a\\u003c/script>b"}');
    expect(auditPage(html, '/about/', PREVIEW)).toEqual([]);
  });

  function withoutSchema(route: string): string {
    return edit(pageHtml(route), ($) => { $('script[type="application/ld+json"]').remove(); });
  }

  function withoutType(route: string, type: string): string {
    return edit(pageHtml(route), ($) => {
      const blocks = $('script[type="application/ld+json"]').filter((_, script) => JSON.parse($(script).html() ?? '')['@type'] === type);
      expect(blocks).toHaveLength(1);
      blocks.remove();
    });
  }

  it('reports a home page without the business data', () => {
    expect(messages(auditPage(withoutSchema('/'), '/', PREVIEW))).toEqual(onlyProblem(/HomeAndConstructionBusiness/));
  });

  it('reports a service page without Service data', () => {
    expect(messages(auditPage(withoutType(SERVICE, 'Service'), SERVICE, PREVIEW))).toEqual(onlyProblem(/"Service"/));
  });

  it.each(SERVICE_ROUTES)('reports %s without the business data its Service provider points to', (route) => {
    const found = messages(auditPage(withoutType(route, 'HomeAndConstructionBusiness'), route, PREVIEW));
    expect(found).toEqual(onlyProblem(/"HomeAndConstructionBusiness"/));
  });

  it.each(['/about/', '/contact/', '/privacy/', '/projects/', '/projects/sample-bathroom/'])(
    'reports %s without BreadcrumbList',
    (route) => {
      expect(messages(auditPage(withoutSchema(route), route, PREVIEW))).toEqual(onlyProblem(/BreadcrumbList/));
    },
  );

  it('reports a service page without BreadcrumbList', () => {
    expect(messages(auditPage(withoutType(SERVICE, 'BreadcrumbList'), SERVICE, PREVIEW))).toEqual(onlyProblem(/BreadcrumbList/));
  });

  it.each(['/', '/thank-you/', '/404.html'])('does not ask %s for BreadcrumbList', (route) => {
    expect(messages(auditPage(pageHtml(route), route, PREVIEW)).join()).not.toMatch(/BreadcrumbList/);
  });

  it('finds a required type inside @graph or a list of types', () => {
    const graph = '{"@graph":[{"@type":["Thing","BreadcrumbList"]}]}';
    const html = withoutSchema('/about/').replace('</head>', `<script type="application/ld+json">${graph}</script></head>`);
    expect(auditPage(html, '/about/', PREVIEW)).toEqual([]);
  });

  it.each([
    ['aggregateRating property', '{"@type":"Thing","aggregateRating":{"ratingValue":5}}'],
    ['review property', '{"@type":"Thing","review":[]}'],
    ['Review type', '{"@type":"Review"}'],
    ['AggregateRating type', '{"@type":"AggregateRating"}'],
    ['Review type in a list', '{"@type":["Thing","Review"]}'],
    ['Review nested deep inside', '{"@graph":[{"@type":"Thing","about":{"@type":"UserReview"}}]}'],
  ])('reports %s', (_name, block) => {
    expect(messages(auditPage(withBlock('/about/', block), '/about/', PREVIEW))).toEqual(onlyProblem(/rating or review/));
  });

  it.each([
    ['Review microdata', '<div itemscope itemtype="https://schema.org/Review"></div>'],
    ['aggregateRating microdata', '<div itemprop="aggregateRating"></div>'],
  ])('reports %s', (_name, markup) => {
    expect(auditAbout(($) => { $('main').append(markup); })).toEqual(onlyProblem(/rating or review/));
  });

  it.each([
    ['at the top level', '{"@type":"Thing","streetAddress":"12 Main St"}'],
    ['nested inside address', '{"@type":"Thing","address":{"@type":"PostalAddress","streetAddress":"12 Main St","addressLocality":"Mississauga"}}'],
  ])('reports streetAddress %s', (_name, block) => {
    expect(messages(auditPage(withBlock('/about/', block), '/about/', PREVIEW))).toEqual(onlyProblem(/street address.*Mississauga, ON, CA/));
  });

  it('accepts an address with only city, province and country', () => {
    const block = '{"@type":"Thing","address":{"@type":"PostalAddress","addressLocality":"Mississauga","addressRegion":"ON","addressCountry":"CA"}}';
    expect(auditPage(withBlock('/about/', block), '/about/', PREVIEW)).toEqual([]);
  });

  it('allows reviews shown as normal text', () => {
    expect(auditAbout(($) => { $('main').append('<h2>Review from a client</h2><p>aggregateRating</p>'); })).toEqual([]);
  });
});

describe('auditPage: images', () => {
  it.each(['alt', 'width', 'height'])('reports an image without %s', (attr) => {
    const found = auditAbout(($) => { $('img').removeAttr(attr); });
    expect(found).toEqual(onlyProblem(new RegExp(`/a\\.webp.*${attr}`)));
  });

  it.each(['width', 'height'])('reports an image with an empty %s', (attr) => {
    expect(auditAbout(($) => { $('img').attr(attr, ''); })).toHaveLength(1);
  });

  it('allows an empty alt for a decorative image', () => {
    expect(auditAbout(($) => { $('img').attr('alt', ''); })).toEqual([]);
  });

  it('reports each bad image', () => {
    const found = auditAbout(($) => { $('main').append('<img src="/b.webp"><img src="/c.webp">'); });
    expect(found).toHaveLength(2);
  });
});

describe('auditPage: contact', () => {
  it('reports a page with no tel link', () => {
    expect(auditAbout(($) => { $('a[href^="tel:"]').remove(); })).toEqual(onlyProblem(/tap-to-call/));
  });

  it('reports a page whose only tel link has the wrong number', () => {
    expect(auditAbout(($) => { $('a[href^="tel:"]').attr('href', 'tel:+14165550199'); })).toEqual(onlyProblem(/\+14165550199/));
  });

  it('reports a wrong tel link next to a right one', () => {
    expect(auditAbout(($) => { $('footer').append('<a href="tel:+14165550199">Old</a>'); })).toEqual(onlyProblem(/\+14165550199/));
  });

  it('accepts a tel link written with separators', () => {
    expect(auditAbout(($) => { $('a[href^="tel:"]').attr('href', 'tel:+1-647-555-0100'); })).toEqual([]);
  });
});

const FORM_FIELDS = ['bot-field', 'subject', 'name', 'phone', 'email', 'city', 'projectType', 'service', 'message'];
const CONTACT_FORM = `<form name="contact" method="POST" action="/thank-you/" data-netlify="true" netlify-honeypot="bot-field">
<input type="hidden" name="subject"><input name="bot-field"><input name="name"><input name="phone"><input name="email"><input name="city">
<select name="projectType"></select><select name="service"></select><textarea name="message"></textarea>
<button type="submit">Send</button></form>`;

describe('auditForm', () => {
  function auditEdited(change: ($: CheerioAPI) => void) {
    return messages(auditForm(edit(`<main>${CONTACT_FORM}</main>`, change)));
  }

  it('finds nothing wrong with a good form', () => {
    expect(auditForm(`<main>${CONTACT_FORM}</main>`)).toEqual([]);
  });

  it('form problem message tells you what to restore', () => {
    const found = auditEdited(($) => { $('form').removeAttr('data-netlify'); });
    expect(found).toEqual([
      'The contact form on /contact/ lost data-netlify="true". Without it, messages won\'t be delivered. Put it back in src/components/ContactForm.astro.',
    ]);
  });

  it.each([
    ['name', 'contact'],
    ['method', 'POST'],
    ['data-netlify', 'true'],
    ['netlify-honeypot', 'bot-field'],
    ['action', '/thank-you/'],
  ])('reports the form without %s', (attr, value) => {
    const expected = `lost ${attr}="${value}"`;
    expect(auditEdited(($) => { $('form').removeAttr(attr); })).toEqual([expect.stringContaining(expected)]);
    expect(auditEdited(($) => { $('form').attr(attr, 'wrong'); })).toEqual([expect.stringContaining(expected)]);
  });

  it.each(FORM_FIELDS)('reports the form without the %s field', (field) => {
    const found = auditEdited(($) => { $(`form [name="${field}"]`).remove(); });
    expect(found).toEqual([expect.stringContaining(`lost its "${field}" field`)]);
  });

  it('says what losing the subject field does', () => {
    const found = auditEdited(($) => { $('form [name="subject"]').remove(); });
    expect(found).toEqual([
      'The contact form on /contact/ lost its "subject" field. Without it, emails from the form arrive with a different subject line and are harder to spot. Put it back in src/components/ContactForm.astro.',
    ]);
  });

  it('reports a field that sits outside the form', () => {
    const found = auditEdited(($) => { $('form [name="phone"]').remove(); $('main').append('<input name="phone">'); });
    expect(found).toEqual([expect.stringContaining('lost its "phone" field')]);
  });

  it('reports a page with no form at all', () => {
    expect(messages(auditForm('<main><p>Call us</p></main>'))).toEqual(onlyProblem(/is gone.*ContactForm\.astro/));
  });

  it('points every form problem at the page', () => {
    for (const problem of auditForm('<main></main>')) expect(problem.where).toBe('/contact/');
  });
});

describe('trigramOverlap', () => {
  it('ignores case and punctuation', () => {
    expect(trigramOverlap('Floor tile, done well.', 'floor TILE done well')).toBe(1);
  });

  it('is zero for different text and for text too short to compare', () => {
    expect(trigramOverlap('one two three', 'four five six')).toBe(0);
    expect(trigramOverlap('one two', 'one two')).toBe(0);
  });

  it('measures against the smaller page', () => {
    expect(trigramOverlap('a b c d', 'a b c d e f g h i j')).toBe(1);
  });

  it('gives exactly one half when half the trigrams are shared', () => {
    expect(trigramOverlap('a b c d e f', 'a b c d x y')).toBe(0.5);
  });
});

describe('REQUIRED_ROUTES', () => {
  it('lists the 10 fixed routes', () => {
    expect([...REQUIRED_ROUTES].sort()).toEqual([
      '/',
      '/about/',
      '/contact/',
      '/privacy/',
      '/projects/',
      '/services/bathroom-shower-tile-installation/',
      '/services/commercial-tile-installation/',
      '/services/floor-tile-installation/',
      '/services/kitchen-backsplash-installation/',
      '/thank-you/',
    ]);
  });
});

function pageFile(route: string): string {
  return route === '/404.html' ? '404.html' : `${route.slice(1)}index.html`;
}

function wordsFor(route: string): string {
  const stem = route.replace(/\W/g, '');
  return Array.from({ length: 30 }, (_, index) => `${stem}${index}`).join(' ');
}

const ALL_ROUTES: string[] = [...REQUIRED_ROUTES, '/projects/sample-bathroom/', '/404.html'];

interface Business {
  launchReady: boolean;
  siteUrl: { value: string };
  phone: { e164: string };
}

const TEST_BUSINESS: Business = { launchReady: false, siteUrl: { value: SITE }, phone: { e164: PHONE } };

function siteFiles(business: Business, banner = BANNER): Map<string, string> {
  const files = new Map<string, string>();
  ALL_ROUTES.forEach((route, index) => {
    const main = route === '/contact/' ? CONTACT_FORM : `<p>${wordsFor(route)}</p>`;
    files.set(
      pageFile(route),
      pageHtml(route, {
        launchReady: business.launchReady,
        siteUrl: business.siteUrl.value,
        phoneE164: business.phone.e164,
        title: `Aldo Tile page number ${index}`,
        description: `Tile work details for page number ${index} in Mississauga and nearby.`,
        main,
        banner,
        nav: ['/', '/about/', `${business.siteUrl.value}/contact/`, '/thank-you/#top', '/about/?from=nav', '#main', 'https://elsewhere.example/nope/', 'mailto:a@b.example'],
      }),
    );
  });
  const urls = ALL_ROUTES.filter((route) => !ALWAYS_HIDDEN.includes(route))
    .map((route) => `<url><loc>${business.siteUrl.value}${route}</loc></url>`)
    .join('');
  files.set('sitemap-index.xml', `<?xml version="1.0"?><sitemapindex><sitemap><loc>${business.siteUrl.value}/sitemap-0.xml</loc></sitemap></sitemapindex>`);
  files.set('sitemap-0.xml', `<?xml version="1.0"?><urlset>${urls}</urlset>`);
  files.set('robots.txt', 'User-agent: *\nAllow: /\n');
  files.set('favicon.svg', '<svg></svg>');
  return files;
}

describe('auditSite', () => {
  let root: string;
  let dist: string;
  let businessPath: string;
  let copyPath: string;

  function audit() {
    return auditSite(dist, businessPath, copyPath);
  }

  async function writeSite(change?: (files: Map<string, string>) => void, business = TEST_BUSINESS) {
    const files = siteFiles(business);
    change?.(files);
    for (const [file, content] of files) {
      const path = join(dist, file);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
    await writeFile(businessPath, JSON.stringify(business));
    await writeFile(copyPath, JSON.stringify({ site: { previewBanner: BANNER } }));
  }

  async function auditWith(change: (files: Map<string, string>) => void) {
    await writeSite(change);
    return messages(await audit());
  }

  function replaceIn(files: Map<string, string>, file: string, from: string | RegExp, to: string) {
    const before = files.get(file)!;
    const after = before.replace(from, to);
    expect(after).not.toBe(before);
    files.set(file, after);
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'audit site '));
    dist = join(root, 'dist');
    businessPath = join(root, 'business.json');
    copyPath = join(root, 'copy.json');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('finds nothing wrong with a good site', async () => {
    expect(await auditWith(() => {})).toEqual([]);
  });

  it('finds nothing wrong with a good launched site', async () => {
    await writeSite(undefined, { ...TEST_BUSINESS, launchReady: true });
    expect(await audit()).toEqual([]);
  });

  it('reads a business file that starts with a byte order mark', async () => {
    await writeSite();
    await writeFile(businessPath, `\uFEFF${JSON.stringify(TEST_BUSINESS)}`);
    expect(await audit()).toEqual([]);
  });

  it('lists every built page as a route', async () => {
    await writeSite();
    expect((await listRoutes(dist)).sort()).toEqual([...ALL_ROUTES].sort());
  });

  it('says to build first when there is no dist folder', async () => {
    await writeFile(businessPath, JSON.stringify(TEST_BUSINESS));
    await writeFile(copyPath, JSON.stringify({ site: { previewBanner: BANNER } }));
    expect(messages(await audit())).toEqual(onlyProblem(/npm run build/));
  });

  it('reports a business file with a mistake', async () => {
    await writeSite();
    await writeFile(businessPath, '{nope');
    expect(messages(await audit())).toEqual(onlyProblem(/has a mistake/));
  });

  it('reports a preview page that lost the banner', async () => {
    const found = await auditWith((files) => replaceIn(files, 'about/index.html', /<aside class="preview-banner">.*?<\/aside>/, ''));
    expect(found).toEqual(onlyProblem(/\/about\/.*preview banner/));
  });

  it('takes the banner wording from the copy file', async () => {
    await writeSite();
    await writeFile(copyPath, JSON.stringify({ site: { previewBanner: 'Some other wording' } }));
    const found = messages(await audit());
    expect(found).toHaveLength(ALL_ROUTES.length);
    expect(found.join()).toMatch(/Some other wording/);
  });

  it.each([
    ['has a mistake', '{nope', /copy\.json has a mistake/],
    ['has no banner wording', JSON.stringify({ site: {} }), /copy\.json.*site\.previewBanner/],
  ])('reports a copy file that %s', async (_name, content, pattern) => {
    await writeSite();
    await writeFile(copyPath, content);
    expect(messages(await audit())).toEqual(onlyProblem(pattern));
  });

  it('does not need the banner wording once the site has launched', async () => {
    await writeSite(undefined, { ...TEST_BUSINESS, launchReady: true });
    await writeFile(copyPath, JSON.stringify({ site: {} }));
    expect(await audit()).toEqual([]);
  });

  it('runs the page rules on every page', async () => {
    const found = await auditWith((files) => replaceIn(files, 'about/index.html', /<h1>.*?<\/h1>/, ''));
    expect(found).toEqual(onlyProblem(/\/about\/ has no main heading/));
  });

  it('uses the launch switch from the business file', async () => {
    await writeSite(undefined, { ...TEST_BUSINESS, launchReady: true });
    await writeFile(businessPath, JSON.stringify(TEST_BUSINESS));
    const found = messages(await audit());
    expect(found.filter((message) => /before launch/.test(message))).toHaveLength(ALL_ROUTES.length - ALWAYS_HIDDEN.length);
    expect(found.filter((message) => /preview banner/.test(message))).toHaveLength(ALL_ROUTES.length);
    expect(found).toHaveLength(ALL_ROUTES.length - ALWAYS_HIDDEN.length + ALL_ROUTES.length);
  });

  it('uses the phone number from the business file', async () => {
    await writeSite();
    await writeFile(businessPath, JSON.stringify({ ...TEST_BUSINESS, phone: { e164: '+14165550199' } }));
    expect(messages(await audit()).join()).toMatch(/tap-to-call/);
  });

  it('runs the form rules on the contact page', async () => {
    const found = await auditWith((files) => replaceIn(files, 'contact/index.html', ' data-netlify="true"', ''));
    expect(found).toEqual(onlyProblem(/lost data-netlify="true"/));
  });

  it.each(REQUIRED_ROUTES)('reports the required page %s when it is missing', async (route) => {
    const found = await auditWith((files) => {
      files.delete(pageFile(route));
      for (const file of files.keys()) {
        if (file.endsWith('.html')) {
          files.set(file, files.get(file)!.replace(/<nav>.*?<\/nav>/, ''));
        }
      }
    });
    expect(found).toEqual(onlyProblem(new RegExp(`page ${route.replace(/[/]/g, '\\/')} is missing`)));
  });

  it('reports a site with no project detail page', async () => {
    const found = await auditWith((files) => files.delete(pageFile('/projects/sample-bathroom/')));
    expect(found).toEqual(onlyProblem(/no project pages/));
  });

  it('reports a site with no 404 page', async () => {
    expect(await auditWith((files) => files.delete('404.html'))).toEqual(onlyProblem(/404/));
  });

  it('reports a missing sitemap index', async () => {
    expect(await auditWith((files) => files.delete('sitemap-index.xml'))).toEqual(onlyProblem(/sitemap-index\.xml.*astro\.config\.mjs/));
  });

  it('reports a sitemap index that lists nothing', async () => {
    const found = await auditWith((files) => replaceIn(files, 'sitemap-index.xml', /<sitemap>.*<\/sitemap>/, ''));
    expect(found).toEqual(onlyProblem(/sitemap-index\.xml/));
  });

  it('reports a sitemap file the index points to but that does not exist', async () => {
    expect(await auditWith((files) => files.delete('sitemap-0.xml'))).toEqual(onlyProblem(/sitemap-0\.xml/));
  });

  it('reports a missing robots.txt', async () => {
    expect(await auditWith((files) => files.delete('robots.txt'))).toEqual(onlyProblem(/robots\.txt/));
  });

  it('reports /thank-you/ in the sitemap', async () => {
    const found = await auditWith((files) =>
      replaceIn(files, 'sitemap-0.xml', '</urlset>', `<url><loc>${SITE}/thank-you/</loc></url></urlset>`),
    );
    expect(found).toEqual(onlyProblem(/sitemap lists \/thank-you\//));
  });

  it('reports two pages with the same title', async () => {
    const found = await auditWith((files) => {
      for (const file of ['about/index.html', 'privacy/index.html']) {
        replaceIn(files, file, /<title>.*?<\/title>/, '<title>The very same title</title>');
      }
    });
    expect(found).toEqual(onlyProblem(/same title.*\/about\/.*\/privacy\//));
  });

  it('reports two pages with the same description', async () => {
    const same = 'The very same description text used on two different pages of the site.';
    const found = await auditWith((files) => {
      for (const file of ['about/index.html', 'privacy/index.html']) {
        replaceIn(files, file, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${same}">`);
      }
    });
    expect(found).toEqual(onlyProblem(/same description.*\/about\/.*\/privacy\//));
  });

  it('does not call missing titles duplicates', async () => {
    const found = await auditWith((files) => {
      replaceIn(files, 'about/index.html', /<title>.*?<\/title>/, '');
      replaceIn(files, 'privacy/index.html', /<title>.*?<\/title>/, '');
    });
    expect(found).toEqual([expect.stringMatching(/\/about\/ has no title/), expect.stringMatching(/\/privacy\/ has no title/)]);
  });

  it('reports an internal link to a page that was not built, once per target', async () => {
    const found = await auditWith((files) => {
      replaceIn(files, 'about/index.html', '<nav>', '<nav><a href="/nope/">Gone</a><a href="/nope/#x">Gone</a>');
      replaceIn(files, 'privacy/index.html', '<nav>', `<nav><a href="${SITE}/nope/">Gone</a>`);
    });
    expect(found).toEqual(onlyProblem(/\/nope\/.*\/about\/.*\/privacy\//));
  });

  it('accepts links to real files and to pages without the trailing slash', async () => {
    const found = await auditWith((files) => {
      replaceIn(files, 'about/index.html', '<nav>', '<nav><a href="/favicon.svg">Icon</a><a href="/privacy">Privacy</a><a href="/404.html">Lost</a>');
    });
    expect(found).toEqual([]);
  });

  it('resolves a relative link from the page it is on', async () => {
    const good = await auditWith((files) => {
      replaceIn(files, 'about/index.html', '<nav>', '<nav><a href="../privacy/">Privacy</a>');
    });
    expect(good).toEqual([]);
    const bad = await auditWith((files) => {
      replaceIn(files, 'about/index.html', '<nav>', '<nav><a href="privacy/">Privacy</a>');
    });
    expect(bad).toEqual(onlyProblem(/\/about\/privacy\//));
  });

  it('reports a link it cannot read', async () => {
    const found = await auditWith((files) => {
      replaceIn(files, 'about/index.html', '<nav>', '<nav><a href="https://">Bad</a>');
    });
    expect(found).toEqual(onlyProblem(/https:\/\/.*\/about\//));
  });

  describe('service pages differ', () => {
    const [first, second] = SERVICE_ROUTES;

    function setMain(files: Map<string, string>, route: string, main: string) {
      replaceIn(files, pageFile(route), /<main id="main">.*<\/main>/s, `<main id="main"><h1>Heading</h1>${main}</main>`);
    }

    it('reports two service pages that share half their wording', async () => {
      const found = await auditWith((files) => {
        setMain(files, first, '<p>a b c d e f</p>');
        setMain(files, second, '<p>a b c d x y</p>');
      });
      expect(found).toEqual(onlyProblem(new RegExp(`${first}.*${second}.*\\d+%`)));
    });

    it('accepts two service pages that share under half their wording', async () => {
      const found = await auditWith((files) => {
        setMain(files, first, '<p>a b c d e f g h</p>');
        setMain(files, second, '<p>a b c d x y z w</p>');
      });
      expect(found).toEqual([]);
    });

    it('splits words across tags', async () => {
      const found = await auditWith((files) => {
        setMain(files, first, '<p>a b c d e f</p>');
        setMain(files, second, '<p>a</p><p>b</p><p>c</p><p>d</p><p>e</p><p>f</p>');
      });
      expect(found).toEqual(onlyProblem(new RegExp(`${first}.*${second}`)));
    });

    it('compares only what is inside main, without scripts', async () => {
      const shared = wordsFor('shared');
      const found = await auditWith((files) => {
        for (const route of [first, second]) {
          replaceIn(files, pageFile(route), '<footer>', `<aside>${shared}</aside><footer>`);
        }
        const script = `<script>${shared}</script>`;
        setMain(files, first, `<p>alpha beta gamma delta epsilon</p>${script}`);
        setMain(files, second, `<p>one two three four five</p>${script}`);
      });
      expect(found).toEqual([]);
    });

    it('reports a service page with no main text, so it cannot slip past the comparison', async () => {
      const found = await auditWith((files) => setMain(files, first, ''));
      expect(found).toEqual(onlyProblem(new RegExp(`${first}.*no wording`)));
    });

    it('reports a service page with no main section', async () => {
      const found = await auditWith((files) => {
        replaceIn(files, pageFile(first), /<main id="main">(.*)<\/main>/s, '<div>$1</div>');
      });
      expect(found).toEqual(onlyProblem(new RegExp(`${first}.*no wording`)));
    });
  });
});

describe('audit-site command', () => {
  const project = fileURLToPath(new URL('../..', import.meta.url));
  let root: string;
  let dist: string;

  function runAudit(...args: string[]) {
    return spawnSync(process.execPath, ['scripts/audit-site.mjs', ...args], { cwd: project, encoding: 'utf8' });
  }

  async function writeRealSite(change?: (files: Map<string, string>) => void) {
    const business: Business = JSON.parse(await readFile(join(project, 'src/data/business.json'), 'utf8'));
    const copy = JSON.parse(await readFile(join(project, 'src/data/copy.json'), 'utf8'));
    const files = siteFiles(business, copy.site.previewBanner);
    change?.(files);
    for (const [file, content] of files) {
      const path = join(dist, file);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'audit command '));
    dist = join(root, 'dist');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('prints the page count and exits 0 on a good site', async () => {
    await writeRealSite();
    const result = runAudit(dist);
    expect(result.stdout.trim()).toBe(`Site audit passed: ${ALL_ROUTES.length} pages.`);
    expect(result.status).toBe(0);
  });

  it('prints a numbered list and exits 1 on problems', async () => {
    await writeRealSite((files) => {
      files.delete('robots.txt');
      files.set('about/index.html', files.get('about/index.html')!.replace(/<h1>.*?<\/h1>/, ''));
    });
    const result = runAudit(dist);
    expect(result.stdout).toMatch(/^1\. .*\n2\. /m);
    expect(result.stdout).toMatch(/robots\.txt/);
    expect(result.stdout).toMatch(/\/about\/ has no main heading/);
    expect(result.status).toBe(1);
  });

  it('says to build first and exits 1 when the folder does not exist', () => {
    const result = runAudit(join(root, 'nothing-here'));
    expect(result.stdout).toMatch(/npm run build/);
    expect(result.status).toBe(1);
  });
});
