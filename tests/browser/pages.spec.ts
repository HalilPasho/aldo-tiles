// import { existsSync, readdirSync, readFileSync } from 'node:fs';
// import { join } from 'node:path';
// import { expect, test, type Page } from '@playwright/test';
// import { services } from './site';

// const SERVICE_SLUGS = services.map(({ id }) => id);
// const PHONE_WIDTH_LIMIT = 760;
// const SHARPNESS_WIDTHS = [390, 768, 900, 1024, 1280, 1600, 1920];
// const SHARPNESS_DENSITIES = [1, 2];
// const SHARPNESS_TOLERANCE = 0.95;
// // The widest file the site makes from a photo, apart from the hero's. Past this, a soft photo beats a slow page.
// const WIDEST_FILE = 1600;

// // Every expectation here comes from the content, so the tests keep passing when real content
// // replaces the samples, reviews are deleted, or a service has few projects. tests/unit/page-states.test.ts
// // covers the states the current content isn't in.
// function readJson(path: string) {
//   return JSON.parse(readFileSync(path, 'utf8'));
// }

// function listDir(path: string) {
//   return existsSync(path) ? readdirSync(path) : [];
// }

// const business = readJson('src/data/business.json');
// const copy = readJson('src/data/copy.json');

// function frontmatterOf(path: string) {
//   return readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
// }

// function unquote(value: string) {
//   return value.trim().replace(/^"(.*)"$/, '$1');
// }

// const projects = listDir('src/content/projects')
//   .filter((id) => existsSync(join('src/content/projects', id, 'index.md')))
//   .map((id) => {
//     const frontmatter = frontmatterOf(join('src/content/projects', id, 'index.md'));
//     return {
//       id,
//       service: frontmatter.match(/^service:\s*(.+)$/m)?.[1].trim() ?? '',
//       alts: [...frontmatter.matchAll(/^\s+alt:\s*(.+)$/gm)].map((match) => unquote(match[1])),
//     };
//   });

// const PAGES = [
//   '/',
//   ...SERVICE_SLUGS.map((slug) => `/services/${slug}/`),
//   '/projects/',
//   ...projects.map(({ id }) => `/projects/${id}/`),
// ];

// const reviews = listDir('src/content/reviews')
//   .filter((file) => file.endsWith('.json'))
//   .map((file) => readJson(join('src/content/reviews', file)));

// function servicePage(slug: string) {
//   const frontmatter = frontmatterOf(join('src/content/services', `${slug}.md`));
//   return {
//     questions: [...frontmatter.matchAll(/^\s+- q:\s*(.+)$/gm)].map((match) => unquote(match[1])),
//     highlights: [...frontmatter.matchAll(/^ {2}- "(.+)"$/gm)].map((match) => match[1]),
//   };
// }

// // textContent, not innerText, so a design that sets headings in capitals with CSS still matches the wording.
// function plain(text: string | null) {
//   return (text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
// }

// function hasSparePhoto(alts: string[]) {
//   return alts.length > 1;
// }

// async function structuredData(page: Page) {
//   const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
//   return blocks.map((block) => JSON.parse(block));
// }

// // naturalWidth can't name the file, because the browser adjusts it for the srcset density.
// async function photoFiles(image: ReturnType<Page['locator']>) {
//   return image.evaluate(async (element: HTMLImageElement) => {
//     await element.decode().catch(() => {});
//     const candidates = element.srcset.split(',').map((candidate) => {
//       const [url, width] = candidate.trim().split(/\s+/);
//       return { path: new URL(url, location.href).pathname, width: parseInt(width, 10) };
//     });
//     const { width: frameWidth, height: frameHeight } = element.getBoundingClientRect();
//     return {
//       chosen: candidates.find(({ path }) => path === new URL(element.currentSrc).pathname)?.width ?? element.width,
//       largest: Math.max(...candidates.map(({ width }) => width)),
//       sourceWidth: Number(element.getAttribute('width')),
//       frameWidth,
//       frameHeight,
//       sourceRatio: Number(element.getAttribute('width')) / Number(element.getAttribute('height')),
//     };
//   });
// }

// test.describe('home page', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/');
//   });

//   test('home names the service and city in the h1 or lead', async ({ page }) => {
//     const opening = plain(`${await page.locator('h1').textContent()} ${await page.locator('[data-hero-lead]').textContent()}`);
//     expect(opening).toContain('tile');
//     expect(opening).toContain(plain(business.baseCity));
//   });

//   test('home links to every service page and contact', async ({ page }) => {
//     const main = page.locator('main');
//     for (const slug of SERVICE_SLUGS) {
//       await expect(main.locator(`a[href="/services/${slug}/"]`), `The home page needs at least one link to /services/${slug}/.`).not.toHaveCount(0);
//     }
//     await expect(main.locator('a[href="/contact/"]').first()).toBeVisible();
//   });

//   test('the header offers a call link and the hero offers a quote without repeating the phone', async ({ page }) => {
//     const hero = page.locator('[data-hero]');
//     const headerCall = page.locator(`.site-header a[href="tel:${business.phone.e164}"]:visible`);
//     await expect(headerCall).toHaveCount(1);
//     await expect(headerCall).toBeVisible();
//     const desktopCall = page.locator('.site-header__call--full a');
//     if (await desktopCall.isVisible()) {
//       await expect(desktopCall).toHaveText(copy.site.nav.contactButtonLabel);
//     }
//     await expect(hero.locator('a[href^="tel:"]')).toHaveCount(0);
//     await expect(hero.locator('a[href="/contact/"]')).toHaveText(copy.home.hero.formLabel);
//   });

//   // Halil authorized About Us and the contact form after the marble call to action.
//   // The hero remains first, every expected section appears once, and the consultation block closes the page.
//   test('the hero comes first, every section appears once, and consultation follows the call to action', async ({ page }) => {
//     const areas = business.areasServed.value;
//     const credentials = business.credentials.value;
//     const hasProof = Boolean(business.yearsExperience.value) || areas.length > 0 || credentials.length > 0;

//     const expected = [
//       ...(hasProof ? [copy.home.proof.heading] : []),
//       copy.home.services.heading,
//       ...(projects.length > 0 ? [copy.home.projects.heading] : []),
//       ...(reviews.length > 0 ? [copy.home.reviews.heading] : []),
//       ...(areas.length > 0 ? [copy.home.areas.heading] : []),
//       copy.home.cta.heading,
//       copy.home.reference.aboutHeading,
//       copy.home.reference.contactHeading,
//     ];
//     const headings = (await page.locator('main h2').allTextContents()).map(plain);

//     const firstIsHero = await page.locator('main').evaluate((main) => main.firstElementChild?.hasAttribute('data-hero') ?? false);
//     expect(firstIsHero, 'The hero (the top section with the h1) must come first on the home page.').toBe(true);
//     await expect(page.locator('[data-hero] h1')).toHaveCount(1);
//     for (const heading of expected) {
//       const count = headings.filter((shown) => shown === plain(heading)).length;
//       expect(count, `The home section "${heading}" must appear exactly once. Section order is free, and new sections are fine.`).toBe(1);
//     }
//     expect(headings.slice(-3), 'The marble call to action must precede About Us and the closing contact form.').toEqual([copy.home.cta.heading, copy.home.reference.aboutHeading, copy.home.reference.contactHeading].map(plain));
//     const closingBlock = page.locator('main > .home-bottom');
//     await expect(closingBlock.locator('#about')).toHaveCount(1);
//     await expect(closingBlock.locator('#contact form[name="contact"]')).toHaveCount(1);
//     expect(await closingBlock.evaluate((element) => element === element.parentElement?.lastElementChild)).toBe(true);
//   });

//   test('the proof strip shows the facts from business.json', async ({ page }) => {
//     const proof = page.locator('[data-proof]');
//     const years = business.yearsExperience.value;
//     const areas = business.areasServed.value;
//     const credentials = business.credentials.value;

//     if (years) {
//       await expect(proof).toContainText(String(years));
//       await expect(proof).toContainText(copy.home.proof.yearsLabel);
//     }
//     if (areas.length > 0) {
//       await expect(proof).toContainText(String(areas.length));
//       await expect(proof).toContainText(copy.home.proof.areasLabel);
//     }
//     if (credentials.length > 0) {
//       await expect(proof).toContainText(copy.home.proof.credentialsLabel);
//     }
//     for (const credential of credentials) {
//       await expect(proof).toContainText(credential);
//     }
//     for (const tile of await proof.locator('> *').all()) {
//       await expect(tile).not.toBeEmpty();
//     }
//   });

//   test('every area served is listed', async ({ page }) => {
//     const areas = page.locator('[data-areas] li');
//     await expect(areas).toHaveCount(business.areasServed.value.length);
//     if (business.areasServed.value.length > 0) {
//       await expect(areas).toHaveText(business.areasServed.value);
//     }
//   });

//   test('sample reviews are visibly labelled', async ({ page }) => {
//     await expect(page.locator('[data-review]')).toHaveCount(reviews.length);

//     for (const { text, sample } of reviews) {
//       const card = page.locator('[data-review]', { hasText: text });
//       // Sample wording itself starts with "Sample review", so only an exact match proves the label is there.
//       const label = card.getByText('Sample review', { exact: true });
//       if (sample) {
//         await expect(label).toBeVisible();
//       } else {
//         await expect(label).toHaveCount(0);
//       }
//     }
//   });

//   test('review arrows rotate existing comments and keep keyboard focus', async ({ page }) => {
//     const cards = page.locator('[data-review]');
//     const comments = cards.locator('blockquote p');
//     const before = await comments.allTextContents();
//     const next = page.getByRole('button', { name: copy.home.reviews.nextLabel, exact: true });
//     const previous = page.getByRole('button', { name: copy.home.reviews.previousLabel, exact: true });
//     if (before.length < 2) {
//       await expect(next).toHaveCount(0);
//       await expect(previous).toHaveCount(0);
//       return;
//     }
//     await next.click();
//     await expect(comments).toHaveText([...before.slice(1), before[0]]);
//     await expect(next).toBeFocused();
//     await previous.click();
//     await expect(comments).toHaveText(before);
//     await expect(previous).toBeFocused();
//   });

//   test('the hero photo loads first and every other photo waits', async ({ page }) => {
//     const hero = page.locator('[data-hero] img');
//     await expect(hero).toHaveAttribute('loading', 'eager');
//     await expect(hero).toHaveAttribute('fetchpriority', 'high');
//     await expect(hero).toHaveAttribute('srcset', /\.webp/);

//     for (const image of await page.locator('main img:not([data-hero] img)').all()) {
//       await expect(image).toHaveAttribute('loading', 'lazy');
//     }
//   });

//   test('a phone does not download the largest hero file', async ({ page }) => {
//     test.skip((page.viewportSize()?.width ?? 0) >= PHONE_WIDTH_LIMIT, 'Phone only');
//     const { chosen, largest } = await photoFiles(page.locator('[data-hero] img'));
//     expect(chosen).toBeLessThan(largest);
//   });
// });

// for (const slug of SERVICE_SLUGS) {
//   test.describe(`service page ${slug}`, () => {
//     const own = projects.filter(({ service }) => service === slug);
//     const hasLeadPhoto = own.some(({ alts }) => hasSparePhoto(alts));
//     const { questions, highlights } = servicePage(slug);

//     test.beforeEach(async ({ page }) => {
//       await page.goto(`/services/${slug}/`);
//     });

//     test("service page shows only its own projects' photos and links back to contact", async ({ page }) => {
//       const ownAlts = own.flatMap(({ alts }) => alts);
//       const shownAlts = await page.locator('main img').evaluateAll((images) => images.map((image) => image.getAttribute('alt')));

//       expect(shownAlts).toHaveLength(own.length + (hasLeadPhoto ? 1 : 0));
//       for (const alt of shownAlts) {
//         expect(ownAlts).toContain(alt);
//       }

//       const main = page.locator('main');
//       for (const { id } of own) {
//         await expect(main.locator(`a[href="/projects/${id}/"]`)).toHaveCount(1);
//       }
//       await expect(main.locator('a[href="/contact/"]').first()).toBeVisible();
//     });

//     test('only a lead photo loads first, and the project photos wait', async ({ page }) => {
//       const eager = page.locator('main img[fetchpriority="high"]');
//       await expect(eager).toHaveCount(hasLeadPhoto ? 1 : 0);
//       if (hasLeadPhoto) {
//         await expect(eager).toHaveAttribute('loading', 'eager');
//       }
//       await expect(page.locator('main img[loading="lazy"]')).toHaveCount(own.length);
//     });

//     test('shows its highlights and FAQs as visible text', async ({ page }) => {
//       const main = page.locator('main');
//       for (const highlight of highlights) {
//         await expect(main.getByText(highlight, { exact: true })).toBeVisible();
//       }
//       for (const question of questions) {
//         await expect(main.getByText(question, { exact: true })).toBeVisible();
//       }
//     });

//     test('its Service data points at the business data on the same page', async ({ page }) => {
//       const data = await structuredData(page);
//       const types = data.map((entry) => entry['@type']);
//       expect(types).toEqual(expect.arrayContaining(['Service', 'BreadcrumbList', 'HomeAndConstructionBusiness']));

//       const serviceData = data.find((entry) => entry['@type'] === 'Service');
//       const businessData = data.find((entry) => entry['@type'] === 'HomeAndConstructionBusiness');
//       expect(serviceData.provider['@id']).toBe(businessData['@id']);
//     });
//   });
// }

// test.describe('photos stay sharp', () => {
//   test.skip(({ isMobile }) => isMobile, 'Each test sets its own screen sizes');

//   // object-fit: cover scales a photo to whichever side of the frame needs it most, so a tall frame needs a much wider file than its width suggests.
//   for (const path of PAGES) {
//     test(`the first photo on ${path} is never stretched past its file`, async ({ browser, baseURL }) => {
//       for (const width of SHARPNESS_WIDTHS) {
//         for (const deviceScaleFactor of SHARPNESS_DENSITIES) {
//           const context = await browser.newContext({ baseURL, deviceScaleFactor, viewport: { width, height: 800 } });
//           const page = await context.newPage();
//           await page.goto(path);

//           const image = page.locator('main img[fetchpriority="high"]');
//           if ((await image.count()) > 0) {
//             const { chosen, sourceWidth, frameWidth, frameHeight, sourceRatio } = await photoFiles(image);
//             const needed = Math.max(frameWidth, frameHeight * sourceRatio) * deviceScaleFactor;
//             const where = `${width}px wide at density ${deviceScaleFactor}: needs ${Math.round(needed)}px, got the ${chosen}w file`;
//             const nothingSharper = chosen >= Math.min(sourceWidth, WIDEST_FILE);
//             expect(nothingSharper || chosen >= needed * SHARPNESS_TOLERANCE, where).toBe(true);
//           }
//           await context.close();
//         }
//       }
//     });
//   }
// });

// for (const path of PAGES) {
//   test.describe(`page ${path}`, () => {
//     test.beforeEach(async ({ page }) => {
//       await page.goto(path);
//     });

//     test('has no FAQ or review structured data', async ({ page }) => {
//       expect(JSON.stringify(await structuredData(page))).not.toMatch(/FAQPage|aggregateRating|"Review"/);
//     });

//     test('does not scroll sideways', async ({ page }) => {
//       const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
//       expect(overflow).toBeLessThanOrEqual(0);
//     });

//     test('the sticky header and call bar never cover a focused link', async ({ page }) => {
//       const links = await page.locator('main a[href]').all();
//       // Forwards checks the call bar at the bottom of the screen, backwards checks the sticky header at the top.
//       for (const link of [...links, ...links.toReversed()]) {
//         await link.focus();
//         const uncovered = await link.evaluate((element) => {
//           const { left, top, width, height } = element.getBoundingClientRect();
//           const hit = document.elementFromPoint(left + width / 2, top + height / 2);
//           return hit !== null && (element === hit || element.contains(hit) || hit.contains(element));
//         });
//         expect(uncovered, `${await link.getAttribute('href')} is hidden behind something when focused`).toBe(true);
//       }
//     });
//   });
// }
