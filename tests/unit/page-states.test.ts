import { load } from 'cheerio';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewsSection from '../../src/components/ReviewsSection.astro';
import copy from '../../src/data/copy.json';
import AboutPage from '../../src/pages/about/index.astro';
import ContactPage from '../../src/pages/contact/index.astro';
import HomePage from '../../src/pages/index.astro';
import PrivacyPage from '../../src/pages/privacy/index.astro';
import ProjectPage from '../../src/pages/projects/[slug]/index.astro';
import ProjectsPage from '../../src/pages/projects/index.astro';
import ServicePage from '../../src/pages/services/[slug]/index.astro';

// These pages must render well in states the real content may never be in on the day the tests run:
// no reviews, real reviews, few projects, missing facts. So every test sets its own content.
const state = vi.hoisted(() => ({
  entries: { services: [], projects: [], reviews: [] } as Record<string, unknown[]>,
  business: {} as Record<string, unknown>,
}));

vi.mock('astro:content', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCollection: async (name: string, filter?: (entry: unknown) => boolean) =>
    state.entries[name].filter(filter ?? (() => true)),
  getEntry: async ({ collection, id }: { collection: string; id: string }) =>
    state.entries[collection].find((entry) => (entry as { id: string }).id === id),
}));

vi.mock('../../src/data/business.json', () => ({ default: state.business }));

const SAMPLE_LABEL = 'Sample review';
const PHOTO = { src: '/fixture-photo.jpg', width: 1600, height: 1200, format: 'jpg' as const };

function photo(alt: string) {
  return { src: PHOTO, alt };
}

function project(id: string, service: string, order: number, photoAlts: string[]) {
  return {
    id,
    collection: 'projects',
    filePath: `src/content/projects/${id}/index.md`,
    body: 'Story text.',
    rendered: { html: '<p>Story text.</p>', metadata: {} },
    data: {
      title: `Project ${id}`,
      city: 'Mississauga',
      service: { id: service, collection: 'services' },
      projectType: 'home',
      tileType: 'Porcelain',
      summary: 'A summary.',
      metaDescription: 'A description.',
      order,
      sample: false,
      photos: photoAlts.map(photo),
    },
  };
}

function review(id: string, text: string, sample: boolean) {
  return { id, collection: 'reviews', data: { author: `Author ${id}`, city: 'Oakville', text, sample } };
}

function service(id: string, overrides = {}) {
  return {
    id,
    collection: 'services',
    filePath: `src/content/services/${id}.md`,
    body: 'Article text.',
    rendered: { html: '<h2>Article heading</h2><p>Article text.</p>', metadata: {} },
    data: {
      title: `Service ${id}`,
      metaTitle: `Service ${id} title`,
      metaDescription: 'A service description.',
      h1: `Service ${id} heading`,
      summary: 'A service summary.',
      order: 1,
      sample: false,
      highlights: ['A highlight'],
      faqs: [{ q: 'A question?', a: 'An answer.' }],
      ...overrides,
    },
  };
}

async function renderAbout() {
  const container = await AstroContainer.create();
  return load(await container.renderToString(AboutPage));
}

async function renderHome() {
  const container = await AstroContainer.create();
  return load(await container.renderToString(HomePage));
}

async function renderService(entry: ReturnType<typeof service>) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ServicePage, { props: { service: entry }, params: { slug: entry.id } });
  return load(html);
}

async function renderProjects() {
  const container = await AstroContainer.create();
  return load(await container.renderToString(ProjectsPage));
}

async function renderProject(entry: ReturnType<typeof project>) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ProjectPage, { props: { project: entry }, params: { slug: entry.id } });
  return load(html);
}

function filterLabels($: ReturnType<typeof load>) {
  return $('main fieldset label')
    .map((_, label) => $(label).text().trim())
    .get();
}

function schemaTypes($: ReturnType<typeof load>) {
  return $('script[type="application/ld+json"]')
    .map((_, script) => JSON.parse($(script).html() ?? '{}')['@type'])
    .get();
}

function srcsetWidths(image: ReturnType<ReturnType<typeof load>>) {
  return (image.attr('srcset') ?? '').split(',').map((candidate) => parseInt(candidate.trim().split(/\s+/)[1], 10));
}

function headings($: ReturnType<typeof load>) {
  return $('main h2')
    .map((_, heading) => $(heading).text().trim())
    .get();
}

function exactText($: ReturnType<typeof load>, scope: string, text: string) {
  return $(scope)
    .find('*')
    .filter((_, element) => $(element).children().length === 0 && $(element).text().trim() === text);
}

beforeEach(() => {
  state.entries = { services: [service('floor')], projects: [], reviews: [] };
  for (const key of Object.keys(state.business)) delete state.business[key];
  Object.assign(state.business, {
    launchReady: true,
    name: 'Fixture Tile',
    baseCity: 'Mississauga',
    province: 'ON',
    country: 'CA',
    siteUrl: { value: 'https://fixture.test', sample: false },
    phone: { display: '(416) 555-0199', e164: '+14165550199', sample: false },
    email: { value: 'hello@fixture.test', sample: false },
    areasServed: { value: ['Mississauga', 'Brampton'], sample: false },
    yearsExperience: { value: 20, sample: false },
    credentials: { value: ['A credential'], sample: false },
  });
});

describe('reviews', () => {
  it('render nothing at all when there are none', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ReviewsSection, { props: { reviews: [] } });
    expect(html.trim()).toBe('');
  });

  it('leave no heading on the home page when there are none', async () => {
    const $ = await renderHome();
    expect(headings($)).not.toContain(copy.home.reviews.heading);
    expect($('[data-review]')).toHaveLength(0);
  });

  it('are labelled one by one, by their own sample flag', async () => {
    state.entries.reviews = [review('a-real', 'Real words.', false), review('b-sample', 'Sample words.', true)];
    const $ = await renderHome();
    const [real, sample] = $('[data-review]').toArray();

    expect($(real).text()).toContain('Real words.');
    expect(exactText($, 'main', SAMPLE_LABEL)).toHaveLength(1);
    expect($(real).text()).not.toContain(SAMPLE_LABEL);
    expect($(sample).text()).toContain('Sample words.');
    expect($(sample).text()).toContain(SAMPLE_LABEL);
  });
});

describe('home page proof strip', () => {
  it('shows a tile for each fact', async () => {
    const $ = await renderHome();
    const numbers = $('[data-proof] .proof__number')
      .map((_, number) => $(number).text().trim())
      .get();
    expect(numbers).toEqual(['20', '2']);
    expect($('[data-proof]').text()).toContain('A credential');
    expect($('[data-proof] > .panel')).toHaveLength(4);
  });

  it('drops the tile of a missing fact and leaves no empty box', async () => {
    state.business.yearsExperience = { value: 0, sample: false };
    state.business.credentials = { value: [], sample: false };
    const $ = await renderHome();

    expect($('[data-proof] > .panel')).toHaveLength(2);
    expect($('[data-proof]').text()).not.toContain(copy.home.proof.yearsLabel);
    expect($('[data-proof]').text()).not.toContain(copy.home.proof.credentialsLabel);
    $('[data-proof] > .panel').each((_, tile) => {
      expect($(tile).text().trim()).not.toBe('');
    });
  });

  it('disappears with its heading when no facts are left', async () => {
    state.business.yearsExperience = { value: 0, sample: false };
    state.business.credentials = { value: [], sample: false };
    state.business.areasServed = { value: [], sample: false };
    const $ = await renderHome();

    expect($('[data-proof]')).toHaveLength(0);
    expect(headings($)).not.toContain(copy.home.proof.heading);
    expect(headings($)).not.toContain(copy.home.areas.heading);
  });
});

describe('about page facts', () => {
  const { experience, areas } = copy.about;

  it('shows the years, each credential and each area', async () => {
    const $ = await renderAbout();
    expect($('.about-years').text()).toContain('20');
    expect($('.about-years').text()).toContain(experience.yearsLabel);
    expect($('.about-credentials li').text()).toBe('A credential');
    expect($('.about-areas li')).toHaveLength(2);
  });

  it('drops a missing fact and leaves no bare label or empty list', async () => {
    state.business.yearsExperience = { value: 0, sample: false };
    const $ = await renderAbout();

    expect($('.about-years')).toHaveLength(0);
    expect($('main').text()).not.toContain(experience.yearsLabel);
    expect($('.about-credentials li')).toHaveLength(1);

    state.business.yearsExperience = { value: 20, sample: false };
    state.business.credentials = { value: [], sample: false };
    const $2 = await renderAbout();

    expect($2('.about-years').text()).toContain('20');
    expect($2('.about-credentials')).toHaveLength(0);
  });

  it('drops the experience panel and its heading when it has no facts', async () => {
    state.business.yearsExperience = { value: 0, sample: false };
    state.business.credentials = { value: [], sample: false };
    const $ = await renderAbout();

    expect(headings($)).not.toContain(experience.heading);
    expect($('.about-experience')).toHaveLength(0);
    expect($('.about-areas li')).toHaveLength(2);
  });

  it('drops the areas panel when there are no areas, and the whole row when nothing is left', async () => {
    state.business.areasServed = { value: [], sample: false };
    const $ = await renderAbout();

    expect(headings($)).not.toContain(areas.heading);
    expect(headings($)).toContain(experience.heading);

    state.business.yearsExperience = { value: 0, sample: false };
    state.business.credentials = { value: [], sample: false };
    const $2 = await renderAbout();

    expect($2('.about-facts')).toHaveLength(0);
  });
});

describe('home page projects', () => {
  it('shows the lowest order numbers first, and at most 4', async () => {
    state.entries.projects = [5, 3, 1, 4, 2].map((order) => project(`p${order}`, 'floor', order, [`Photo ${order}`]));
    const $ = await renderHome();
    const links = $('a[href^="/projects/p"]')
      .map((_, link) => $(link).attr('href'))
      .get();
    expect(links).toEqual(['/projects/p1/', '/projects/p2/', '/projects/p3/', '/projects/p4/']);
  });

  it('disappears when there are none', async () => {
    const $ = await renderHome();
    expect(headings($)).not.toContain(copy.home.projects.heading);
  });
});

describe('service page', () => {
  const heading = copy.servicePage.projectsHeading;

  it('hides related projects and the lead photo when it has no projects', async () => {
    state.entries.projects = [project('other', 'walls', 1, ['Other photo', 'Other spare'])];
    const $ = await renderService(service('floor'));

    expect(headings($)).not.toContain(heading);
    expect($('main img')).toHaveLength(0);
    expect($('main').text()).toContain('Article text.');
  });

  it('shows one card and no repeated photo for one project with one photo', async () => {
    state.entries.projects = [project('only', 'floor', 1, ['Only photo'])];
    const $ = await renderService(service('floor'));

    expect(headings($)).toContain(heading);
    expect($('main img')).toHaveLength(1);
    expect($('main img').attr('alt')).toBe('Only photo');
    expect($('main img').attr('loading')).toBe('lazy');
    expect($('main img[fetchpriority="high"]')).toHaveLength(0);
  });

  it('leads with a spare photo, and shows only its own projects', async () => {
    state.entries.projects = [
      project('second', 'floor', 2, ['Second first']),
      project('first', 'floor', 1, ['First first', 'First spare']),
      project('other', 'walls', 3, ['Other photo']),
    ];
    const $ = await renderService(service('floor'));
    const alts = $('main img')
      .map((_, image) => $(image).attr('alt'))
      .get();

    expect(alts).toEqual(['First spare', 'First first', 'Second first']);
    expect($('main img').first().attr('fetchpriority')).toBe('high');
    expect($('main img').first().attr('loading')).toBe('eager');
    expect($('a[href="/projects/other/"]')).toHaveLength(0);
  });

  it('leaves out an empty highlights panel', async () => {
    const $ = await renderService(service('floor', { highlights: [] }));
    expect(headings($)).not.toContain(copy.servicePage.highlightsHeading);
    expect($('main aside')).toHaveLength(0);
  });

  it('leaves out the FAQ section when there are no questions', async () => {
    const $ = await renderService(service('floor', { faqs: [] }));
    expect(headings($)).not.toContain(copy.servicePage.faqHeading);
  });
});

describe('projects gallery filter', () => {
  const FLOOR_ID = 'floor-tile-installation';
  const WALL_ID = 'commercial-tile-installation';
  const EMPTY_ID = 'kitchen-backsplash-installation';
  const navLabel = (id: string) => copy.site.nav.services.find(({ path }) => path === `/services/${id}/`)?.label;

  beforeEach(() => {
    state.entries.services = [
      service(WALL_ID, { order: 2 }),
      service(FLOOR_ID, { order: 1 }),
      service(EMPTY_ID, { order: 3 }),
    ];
    state.entries.projects = [project('a', FLOOR_ID, 2, ['A']), project('b', WALL_ID, 1, ['B'])];
  });

  it('offers All projects, then only the services that have a project, in service order', async () => {
    const $ = await renderProjects();

    expect(filterLabels($)).toEqual([copy.projects.filterAll, navLabel(FLOOR_ID), navLabel(WALL_ID)]);
    expect(filterLabels($)).not.toContain(navLabel(EMPTY_ID));
    expect($('main fieldset legend').text().trim()).toBe(copy.projects.filterLegend);
    expect($(`input[type="radio"][value="${EMPTY_ID}"]`)).toHaveLength(0);
  });

  it('never offers a choice that leads to an empty gallery', async () => {
    const $ = await renderProjects();
    const cards = $('[data-project-service]')
      .map((_, card) => $(card).attr('data-project-service'))
      .get();

    $('input[type="radio"]:not(:checked)').each((_, radio) => {
      expect(cards).toContain($(radio).attr('value'));
    });
  });

  it('starts on All projects, with one group of real radios outside any form', async () => {
    const $ = await renderProjects();
    const radios = $('main fieldset input[type="radio"]');
    const names = new Set(radios.map((_, radio) => $(radio).attr('name')).get());

    expect(radios).toHaveLength(3);
    expect(names.size).toBe(1);
    expect($('main form')).toHaveLength(0);
    expect($('main input[type="radio"][checked]')).toHaveLength(1);
    expect($('main input[type="radio"][checked]').closest('label').text().trim()).toBe(copy.projects.filterAll);
  });

  it('builds one CSS rule per offered service, from the service list', async () => {
    const $ = await renderProjects();
    const css = $('head style').text();

    expect(css).toContain(`[value="${FLOOR_ID}"]:checked`);
    expect(css).toContain(`[value="${WALL_ID}"]:checked`);
    expect(css).not.toContain(EMPTY_ID);
    expect($('body style')).toHaveLength(0);
  });

  it("names a service that isn't in the menu by its title", async () => {
    state.entries.services = [service('stairs', { title: 'Stair tile' })];
    state.entries.projects = [project('a', 'stairs', 1, ['A'])];
    const $ = await renderProjects();

    expect(filterLabels($)).toEqual([copy.projects.filterAll, 'Stair tile']);
  });

  it('lists every project, lowest order first, under a heading', async () => {
    const $ = await renderProjects();
    const links = $('main h3 a')
      .map((_, link) => $(link).attr('href'))
      .get();

    expect(links).toEqual(['/projects/b/', '/projects/a/']);
    expect($('main h2')).toHaveLength(1);
    expect($('main h1').text().trim()).toBe(copy.projects.h1);
    expect(schemaTypes($)).toContain('BreadcrumbList');
  });

  it('loads only the first card early, because it is the first thing on screen', async () => {
    const $ = await renderProjects();
    const [first, second] = $('main img').toArray().map((image) => $(image));

    expect(first.attr('loading')).toBe('eager');
    expect(first.attr('fetchpriority')).toBe('high');
    expect(second.attr('loading')).toBe('lazy');
    expect(second.attr('fetchpriority')).toBeUndefined();
  });

  it('shows no filter or empty list when there are no projects', async () => {
    state.entries.projects = [];
    const $ = await renderProjects();

    expect($('main fieldset')).toHaveLength(0);
    expect($('main h2')).toHaveLength(0);
    expect($('main ul')).toHaveLength(0);
    expect($('head').html()).not.toContain('data-project-filter');
    expect($('main').text()).not.toContain(copy.projects.intro);
    expect($('main').text()).toContain(copy.projects.emptyText);
    expect($('main a[href="/contact/"]')).toHaveLength(1);
  });
});

describe('project page', () => {
  const entry = (overrides = {}, photoAlts = ['First', 'Second', 'Third']) => {
    const base = project('job', 'floor', 1, photoAlts);
    return { ...base, data: { ...base.data, ...overrides } };
  };

  it('shows every photo, and only the first one loads early', async () => {
    const $ = await renderProject(entry());
    const images = $('main img');

    expect(images.map((_, image) => $(image).attr('alt')).get()).toEqual(['First', 'Second', 'Third']);
    expect(images.first().attr('loading')).toBe('eager');
    expect(images.first().attr('fetchpriority')).toBe('high');
    images.slice(1).each((_, image) => {
      expect($(image).attr('loading')).toBe('lazy');
      expect($(image).attr('fetchpriority')).toBeUndefined();
    });
  });

  it('handles a project with a single photo', async () => {
    const $ = await renderProject(entry({}, ['Only']));

    expect($('main img')).toHaveLength(1);
    expect($('main img').attr('fetchpriority')).toBe('high');
  });

  it('never offers a photo wider than its file', async () => {
    const small = { src: { ...PHOTO, width: 1000, height: 1400 }, alt: 'Small' };
    const tiny = { src: { ...PHOTO, width: 320, height: 240 }, alt: 'Tiny' };
    const large = { src: { ...PHOTO, width: 4032, height: 3024 }, alt: 'Large' };
    const $ = await renderProject(entry({ photos: [small, tiny, large] }));
    const [smallImage, tinyImage, largeImage] = $('main img').toArray().map((image) => $(image));

    expect(Math.max(...srcsetWidths(smallImage))).toBe(1000);
    expect(srcsetWidths(tinyImage)).toEqual([320]);
    expect(Math.max(...srcsetWidths(largeImage))).toBe(1600);
  });

  it('declares the most each photo can fill, and the same phone width for every shape', async () => {
    const shape = (width: number, height: number, alt: string) => ({ src: { ...PHOTO, width, height }, alt });
    const $ = await renderProject(entry({ photos: [shape(1200, 1600, 'Upright'), shape(1600, 1200, 'Flat'), shape(3000, 1000, 'Panorama')] }));
    const sizes = $('main img')
      .map((_, image) => $(image).attr('sizes'))
      .get();

    expect(sizes).toEqual([
      '(min-width: 900px) 540px, 93vw',
      '(min-width: 1033px) 960px, 93vw',
      '(min-width: 1280px) 1190px, 93vw',
    ]);
  });

  it('shows the tile, city, type, service and story', async () => {
    const { detail } = copy.projects;
    const $ = await renderProject(entry({ tileType: 'Fixture porcelain', city: 'Oakville' }));
    const main = $('main').text();

    for (const text of [detail.tileTypeLabel, 'Fixture porcelain', detail.cityLabel, 'Oakville', detail.projectTypeLabel, detail.projectTypeHome, detail.serviceLabel, 'Service floor', 'Story text.']) {
      expect(main).toContain(text);
    }
  });

  it('says commercial for a commercial job', async () => {
    const $ = await renderProject(entry({ projectType: 'commercial' }));
    expect($('main dl').text()).toContain(copy.projects.detail.projectTypeCommercial);
    expect($('main dl').text()).not.toContain(copy.projects.detail.projectTypeHome);
  });

  it('links to its service, contact and the gallery', async () => {
    const { detail } = copy.projects;
    const $ = await renderProject(entry());

    expect(exactText($, 'main', detail.serviceLinkLabel).attr('href')).toBe('/services/floor/');
    expect(exactText($, 'main', detail.contactLabel).attr('href')).toBe('/contact/');
    expect(exactText($, 'main', detail.backLabel).attr('href')).toBe('/projects/');
  });

  it('takes its title and description from the project, and adds only breadcrumb data', async () => {
    const $ = await renderProject(entry({ title: 'Fixture job', metaDescription: 'Fixture description.' }));

    expect($('head title').text()).toBe('Fixture job | Fixture Tile');
    expect($('meta[name="description"]').attr('content')).toBe('Fixture description.');
    expect(schemaTypes($)).toEqual(['BreadcrumbList']);
  });

  it('stops the build with a clear message when its service does not exist', async () => {
    const base = project('job', 'missing', 1, ['First']);
    await expect(renderProject(base)).rejects.toThrow(/job.*"missing".*src\/content\/services/);
  });
});

describe('contact page areas', () => {
  async function renderContact() {
    const container = await AstroContainer.create();
    return load(await container.renderToString(ContactPage));
  }

  it('lists each area under its heading', async () => {
    const $ = await renderContact();
    expect(headings($)).toContain(copy.contact.areas.heading);
    expect($('.contact-areas li').map((_, area) => $(area).text().trim()).get()).toEqual(['Mississauga', 'Brampton']);
  });

  it('drops the heading, its intro and the empty list when there are no areas', async () => {
    state.business.areasServed = { value: [], sample: false };
    const $ = await renderContact();

    expect(headings($)).not.toContain(copy.contact.areas.heading);
    expect($('main').text()).not.toContain(copy.contact.areas.intro);
    expect($('.contact-areas')).toHaveLength(0);
    expect(headings($)).toContain(copy.contact.next.heading);
  });
});

describe('privacy page deletion email', () => {
  type Section = (typeof copy.privacy.sections)[number] & { deletionEmail?: boolean };
  const sections: Section[] = copy.privacy.sections;
  const realSections = [...sections];

  afterEach(() => {
    copy.privacy.sections = realSections;
  });

  async function renderPrivacy() {
    const container = await AstroContainer.create();
    return load(await container.renderToString(PrivacyPage));
  }

  function sectionsWithEmail($: ReturnType<typeof load>) {
    return $('main section')
      .filter((_, section) => $(section).find('a[href^="mailto:"]').length > 0)
      .map((_, section) => $(section).find('h2').text().trim())
      .get();
  }

  it('the real notice flags exactly one section for the deletion email', () => {
    expect(sections.filter((section) => section.deletionEmail === true).map(({ heading }) => heading)).toHaveLength(1);
  });

  it('shows the email in the flagged section', async () => {
    const $ = await renderPrivacy();
    const flagged = sections.find((section) => section.deletionEmail === true)?.heading;
    expect(sectionsWithEmail($)).toEqual([flagged]);
    expect($('main a[href="mailto:hello@fixture.test"]').text().trim()).toBe('hello@fixture.test');
    expect($('main').text()).toContain(copy.privacy.deletionEmailLabel);
  });

  it('keeps the email with its section when the sections are reordered', async () => {
    const flagged = { heading: 'Deleting your details', paragraphs: ['Write to us.'], deletionEmail: true };
    copy.privacy.sections = [flagged, ...realSections.map(({ deletionEmail: _, ...section }) => section)] as Section[];
    const $ = await renderPrivacy();

    expect(sectionsWithEmail($)).toEqual(['Deleting your details']);
    expect($('main a[href^="mailto:"]')).toHaveLength(1);
  });
});

