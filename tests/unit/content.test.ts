import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const CONTENT_DIR = 'src/content';
const COPY_PATH = 'src/data/copy.json';
const SERVICE_SLUGS = [
  'bathroom-shower-tile-installation',
  'floor-tile-installation',
  'kitchen-backsplash-installation',
  'commercial-tile-installation',
];
const COPY_PAGES = ['home', 'about', 'contact', 'projects', 'thankYou', 'notFound', 'privacy'];
const PROJECT_TITLE_SUFFIX = ' | Aldo Tile';

function readMarkdown(path: string) {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return { frontmatter: match?.[1] ?? '', body: match?.[2] ?? text };
}

function field(text: string, name: string): string {
  const value = text.match(new RegExp(`^[ \\t]*${name}:[ \\t]*(.*?)[ \\t]*$`, 'm'))?.[1] ?? '';
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

function listDir(path: string): string[] {
  return existsSync(path) ? readdirSync(path).sort() : [];
}

function photosOf(frontmatter: string, dir: string) {
  const block = frontmatter.match(/^photos:[ \t]*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? '';
  return block
    .split(/^[ \t]*-[ \t]+/m)
    .filter((item) => item.trim())
    .map((item) => ({ path: join(dir, field(item, 'src')), alt: field(item, 'alt') }));
}

const services = listDir(join(CONTENT_DIR, 'services'))
  .filter((file) => file.endsWith('.md'))
  .map((file) => ({ slug: basename(file, '.md'), ...readMarkdown(join(CONTENT_DIR, 'services', file)) }));

const projects = listDir(join(CONTENT_DIR, 'projects'))
  .filter((name) => existsSync(join(CONTENT_DIR, 'projects', name, 'index.md')))
  .map((slug) => {
    const dir = join(CONTENT_DIR, 'projects', slug);
    const { frontmatter, body } = readMarkdown(join(dir, 'index.md'));
    return { slug, frontmatter, body, photos: photosOf(frontmatter, dir) };
  });

const reviews = listDir(join(CONTENT_DIR, 'reviews'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({ file, ...JSON.parse(readFileSync(join(CONTENT_DIR, 'reviews', file), 'utf8')) }));

function readCopy() {
  return JSON.parse(readFileSync(COPY_PATH, 'utf8'));
}

function isSampleItem(frontmatter: string) {
  return field(frontmatter, 'sample') === 'true';
}

// Real projects arrive one at a time, so rules about the sample set stop once the first one lands.
function allProjectsAreSamples() {
  return projects.every(({ frontmatter }) => isSampleItem(frontmatter));
}

function expectUnique(values: string[]) {
  expect(new Set(values).size, `Duplicates in: ${values.join(' / ')}`).toBe(values.length);
}

describe('content collections', () => {
  it('has the 4 fixed services and at least one project', () => {
    expect(services.map(({ slug }) => slug).sort()).toEqual([...SERVICE_SLUGS].sort());
    expect(projects.length).toBeGreaterThan(0);
  });

  it('every content item has a boolean sample flag', () => {
    expect(services.length).toBeGreaterThan(0);
    expect(projects.length).toBeGreaterThan(0);
    for (const { slug, frontmatter } of [...services, ...projects]) {
      expect(['true', 'false'], `${slug} sample flag`).toContain(field(frontmatter, 'sample'));
    }
    for (const review of reviews) {
      expect(typeof review.sample, `${review.file} sample flag`).toBe('boolean');
    }
    expect(typeof readCopy().sample).toBe('boolean');
  });

  it('each project names a real service', () => {
    expect(projects.length).toBeGreaterThan(0);
    for (const { slug, frontmatter } of projects) {
      expect(SERVICE_SLUGS, `${slug} service`).toContain(field(frontmatter, 'service'));
    }
  });

  it('each service has at least 2 projects', () => {
    expect(projects.length).toBeGreaterThan(0);
    if (!allProjectsAreSamples()) return;
    for (const slug of SERVICE_SLUGS) {
      const related = projects.filter(({ frontmatter }) => field(frontmatter, 'service') === slug);
      expect(related.length, `${slug} projects`).toBeGreaterThanOrEqual(2);
    }
  });

  it('service bodies are at least 200 words', () => {
    expect(services.length).toBeGreaterThan(0);
    for (const { slug, body } of services) {
      expect(body.split(/\s+/).filter(Boolean).length, `${slug} word count`).toBeGreaterThanOrEqual(200);
    }
  });

  it('project cities are city names only', () => {
    expect(projects.length).toBeGreaterThan(0);
    for (const { slug, frontmatter } of projects) {
      const city = field(frontmatter, 'city');
      expect(city, `${slug} city`).not.toBe('');
      expect(city, `${slug} city`).not.toMatch(/\d/);
    }
  });

  it('sample photos have sample- filenames and non-empty alt text', () => {
    expect(projects.length).toBeGreaterThan(0);
    for (const { slug, frontmatter, photos } of projects) {
      expect(photos.length, `${slug} photos`).toBeGreaterThan(0);
      for (const photo of photos) {
        expect(existsSync(photo.path), `${photo.path} exists`).toBe(true);
        expect(photo.alt, `${photo.path} alt text`).not.toBe('');
        if (isSampleItem(frontmatter)) {
          expect(basename(photo.path), `${slug} photo name`).toMatch(/^sample-.+\.jpg$/);
        }
      }
    }
  });

  it('at least 2 photos are portrait', async () => {
    expect(projects.length).toBeGreaterThan(0);
    if (!allProjectsAreSamples()) return;
    const photos = projects.flatMap((project) => project.photos);
    const sizes = await Promise.all(photos.map(({ path }) => sharp(path).metadata()));
    expect(sizes.filter(({ width, height }) => height > width).length).toBeGreaterThanOrEqual(2);
  });
});

describe('search titles and descriptions', () => {
  function metaEntries() {
    const copy = readCopy();
    return [
      ...services.map(({ slug, frontmatter }) => ({
        where: slug,
        title: field(frontmatter, 'metaTitle'),
        description: field(frontmatter, 'metaDescription'),
      })),
      ...projects.map(({ slug, frontmatter }) => ({
        where: slug,
        title: `${field(frontmatter, 'title')}${PROJECT_TITLE_SUFFIX}`,
        description: field(frontmatter, 'metaDescription'),
      })),
      ...COPY_PAGES.map((page) => ({
        where: page,
        title: copy[page].metaTitle as string,
        description: copy[page].metaDescription as string,
      })),
    ];
  }

  it('copy.json pages have a title, description and h1', () => {
    const copy = readCopy();
    for (const page of COPY_PAGES) {
      expect(copy[page]?.metaTitle, `${page} metaTitle`).toBeTruthy();
      expect(copy[page]?.metaDescription, `${page} metaDescription`).toBeTruthy();
      expect(copy[page]?.h1, `${page} h1`).toBeTruthy();
    }
  });

  it('titles are 10 to 65 characters and descriptions 50 to 165', () => {
    for (const { where, title, description } of metaEntries()) {
      expect(title.length, `${where} title: ${title}`).toBeGreaterThanOrEqual(10);
      expect(title.length, `${where} title: ${title}`).toBeLessThanOrEqual(65);
      expect(description.length, `${where} description: ${description}`).toBeGreaterThanOrEqual(50);
      expect(description.length, `${where} description: ${description}`).toBeLessThanOrEqual(165);
    }
  });

  it('titles and descriptions are unique', () => {
    const entries = metaEntries();
    expectUnique(entries.map(({ title }) => title));
    expectUnique(entries.map(({ description }) => description));
  });

  it('service titles name Mississauga', () => {
    expect(services.length).toBeGreaterThan(0);
    for (const { slug, frontmatter } of services) {
      expect(field(frontmatter, 'metaTitle'), slug).toContain('Mississauga');
    }
  });
});
