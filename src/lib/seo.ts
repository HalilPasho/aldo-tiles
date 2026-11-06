export interface SeoBusiness {
  name: string;
  baseCity: string;
  province: string;
  country: string;
  siteUrl: { value: string };
  phone: { e164: string };
  email: { value: string };
  areasServed: { value: string[] };
}

export interface ServiceInfo {
  name: string;
  description: string;
  path: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

const CONTEXT = 'https://schema.org';

export function robotsContent(launchReady: boolean, pageNoindex: boolean): 'index,follow' | 'noindex,follow' {
  return launchReady && !pageNoindex ? 'index,follow' : 'noindex,follow';
}

export function canonicalUrl(siteUrl: string, path: string): string {
  const url = new URL(path, siteUrl);
  url.pathname = url.pathname.replace(/\/*$/, '/');
  return url.href;
}

function businessId(siteUrl: string): string {
  return `${canonicalUrl(siteUrl, '/')}#business`;
}

function citiesServed(business: SeoBusiness) {
  return business.areasServed.value.map((name) => ({ '@type': 'City', name }));
}

export function localBusinessSchema(business: SeoBusiness): object {
  const siteUrl = business.siteUrl.value;
  return {
    '@context': CONTEXT,
    '@type': 'HomeAndConstructionBusiness',
    '@id': businessId(siteUrl),
    name: business.name,
    url: canonicalUrl(siteUrl, '/'),
    telephone: business.phone.e164,
    email: business.email.value,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.baseCity,
      addressRegion: business.province,
      addressCountry: business.country,
    },
    areaServed: citiesServed(business),
  };
}

export function serviceSchema(business: SeoBusiness, { name, description, path }: ServiceInfo): object {
  const siteUrl = business.siteUrl.value;
  return {
    '@context': CONTEXT,
    '@type': 'Service',
    name,
    description,
    url: canonicalUrl(siteUrl, path),
    provider: { '@id': businessId(siteUrl) },
    areaServed: citiesServed(business),
  };
}

export function breadcrumbSchema(siteUrl: string, items: BreadcrumbItem[]): object {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: canonicalUrl(siteUrl, path),
    })),
  };
}

// A literal "</script>" inside the data would end the script tag early.
export function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
