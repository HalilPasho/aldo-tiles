import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  canonicalUrl,
  localBusinessSchema,
  robotsContent,
  serializeJsonLd,
  serviceSchema,
} from '../../src/lib/seo';

const SITE = 'https://aldotile.example';

const business = {
  launchReady: false,
  name: 'Aldo Tile',
  baseCity: 'Mississauga',
  province: 'ON',
  country: 'CA',
  siteUrl: { value: SITE, sample: true },
  phone: { display: '(647) 555-0100', e164: '+16475550100', sample: true },
  email: { value: 'hello@example.com', sample: true },
  areasServed: { value: ['Mississauga', 'Brampton'], sample: true },
  yearsExperience: { value: 15, sample: true },
  credentials: { value: ['Fully insured'], sample: true },
};

const service = { name: 'Bathroom tile', description: 'Showers and floors.', path: '/services/bathroom/' };

describe('robotsContent', () => {
  it('robots is noindex until launch', () => {
    expect(robotsContent(false, false)).toBe('noindex,follow');
    expect(robotsContent(true, false)).toBe('index,follow');
  });

  it('noindex page stays noindex after launch', () => {
    expect(robotsContent(true, true)).toBe('noindex,follow');
    expect(robotsContent(false, true)).toBe('noindex,follow');
  });
});

describe('canonicalUrl', () => {
  it('canonical always has a trailing slash', () => {
    expect(canonicalUrl(SITE, '/')).toBe(`${SITE}/`);
    expect(canonicalUrl(SITE, '/about')).toBe(`${SITE}/about/`);
    expect(canonicalUrl(SITE, '/about/')).toBe(`${SITE}/about/`);
    expect(canonicalUrl(SITE, 'services/bathroom')).toBe(`${SITE}/services/bathroom/`);
  });

  it('copes with a site address that ends in a slash', () => {
    expect(canonicalUrl(`${SITE}/`, '/about/')).toBe(`${SITE}/about/`);
  });
});

describe('localBusinessSchema', () => {
  it('uses the home and construction type and a stable @id', () => {
    expect(localBusinessSchema(business)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      '@id': `${SITE}/#business`,
      name: 'Aldo Tile',
      url: `${SITE}/`,
      telephone: '+16475550100',
      email: 'hello@example.com',
    });
  });

  it('local business has no street address', () => {
    const schema = localBusinessSchema(business) as { address: Record<string, string> };
    expect(schema.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      addressCountry: 'CA',
    });
    expect(JSON.stringify(schema)).not.toContain('streetAddress');
  });

  it('local business lists areas served as cities', () => {
    expect(localBusinessSchema(business)).toMatchObject({
      areaServed: [
        { '@type': 'City', name: 'Mississauga' },
        { '@type': 'City', name: 'Brampton' },
      ],
    });
  });
});

describe('schemas', () => {
  it('schemas never include ratings or reviews', () => {
    const output = JSON.stringify([
      localBusinessSchema(business),
      serviceSchema(business, service),
      breadcrumbSchema(SITE, [{ name: 'Home', path: '/' }]),
    ]);
    expect(output).not.toContain('aggregateRating');
    expect(output).not.toContain('"Review"');
  });

  it('service links to the business by @id', () => {
    expect(serviceSchema(business, service)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Bathroom tile',
      description: 'Showers and floors.',
      url: `${SITE}/services/bathroom/`,
      provider: { '@id': `${SITE}/#business` },
    });
  });

  it('breadcrumb positions start at 1 and use absolute URLs', () => {
    expect(
      breadcrumbSchema(SITE, [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE}/services/` },
      ],
    });
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so text cannot close the script tag', () => {
    const output = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(output).not.toContain('<');
    expect(JSON.parse(output)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
