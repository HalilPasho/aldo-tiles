import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findLaunchedPageProblems, findLaunchedSiteProblems } from '../../scripts/lib/launch-rehearsal-rules.mjs';

const BANNER = 'Test banner wording';
const HEADING = 'Test reviews heading';
const wording = { banner: BANNER, reviewsHeading: HEADING };

function page({ robots = 'index,follow', body = '<main><h1>A page</h1></main>' } = {}) {
  return `<!doctype html><html><head><meta name="robots" content="${robots}"></head><body>${body}</body></html>`;
}

function problemsOn(route: string, html: string) {
  return findLaunchedPageProblems(html, route, wording);
}

describe('a launched page', () => {
  it('passes when nothing is wrong', () => {
    expect(problemsOn('/about/', page())).toEqual([]);
    expect(problemsOn('/', page())).toEqual([]);
    expect(problemsOn('/thank-you/', page({ robots: 'noindex,follow' }))).toEqual([]);
    expect(problemsOn('/404.html', page({ robots: 'noindex,follow' }))).toEqual([]);
  });

  it('fails when the banner wording is on the page, whatever tag holds it', () => {
    const inAside = page({ body: `<aside class="any-class"><p>${BANNER}</p></aside><main></main>` });
    const inDiv = page({ body: `<div>  Test   banner\n wording </div>` });
    expect(problemsOn('/about/', inAside).join()).toContain('preview banner');
    expect(problemsOn('/about/', inDiv).join()).toContain('preview banner');
  });

  it('fails when a normal page is not index,follow', () => {
    expect(problemsOn('/about/', page({ robots: 'noindex,follow' })).join()).toContain('index,follow');
    expect(problemsOn('/about/', page({ robots: 'index,nofollow' })).join()).toContain('index,follow');
    expect(problemsOn('/about/', page().replace(/<meta[^>]*>/, '')).join()).toContain('index,follow');
  });

  it('fails when a page that must stay hidden can be listed', () => {
    expect(problemsOn('/thank-you/', page()).join()).toContain('noindex');
    expect(problemsOn('/404.html', page()).join()).toContain('noindex');
  });

  it('fails when home has a reviews heading or review cards with no reviews', () => {
    expect(problemsOn('/', page({ body: `<h2> ${HEADING} </h2>` })).join()).toContain('reviews heading');
    expect(problemsOn('/', page({ body: '<figure data-review></figure>' })).join()).toContain('review cards');
  });

  it('allows the same wording as a heading on other pages', () => {
    expect(problemsOn('/about/', page({ body: `<h2>${HEADING}</h2>` }))).toEqual([]);
  });
});

describe('a launched site', () => {
  let dist: string;

  async function put(file: string, html: string) {
    const path = join(dist, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, html);
  }

  async function putGoodSite() {
    await put('index.html', page());
    await put('about/index.html', page());
    await put('thank-you/index.html', page({ robots: 'noindex,follow' }));
    await put('404.html', page({ robots: 'noindex,follow' }));
  }

  beforeEach(async () => {
    dist = await mkdtemp(join(tmpdir(), 'launched-site-'));
  });

  afterEach(async () => {
    await rm(dist, { recursive: true, force: true });
  });

  it('passes and counts every page when nothing is wrong', async () => {
    await putGoodSite();
    expect(await findLaunchedSiteProblems(dist, wording)).toEqual({ pages: 4, problems: [] });
  });

  it('checks every built page, not a fixed list', async () => {
    await putGoodSite();
    await put('projects/brand-new-job/index.html', page({ body: `<p>${BANNER}</p>` }));
    const { problems } = await findLaunchedSiteProblems(dist, wording);
    expect(problems.join()).toContain('/projects/brand-new-job/');
  });

  it('fails when a page the checks depend on was not built', async () => {
    await put('about/index.html', page());
    const { problems } = await findLaunchedSiteProblems(dist, wording);
    for (const route of ['/', '/thank-you/', '/404.html']) {
      expect(problems.join()).toContain(`${route} is missing`);
    }
  });

  it('refuses to pass when the wording to look for is missing', async () => {
    await putGoodSite();
    await expect(findLaunchedSiteProblems(dist, { banner: undefined, reviewsHeading: HEADING })).rejects.toThrow(/copy\.json/);
    await expect(findLaunchedSiteProblems(dist, { banner: BANNER, reviewsHeading: '' })).rejects.toThrow(/copy\.json/);
  });
});
