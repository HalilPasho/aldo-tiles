import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { axeProblems, SUBPIXEL } from './site';

// Expectations come from the content, so these keep passing when real projects replace the samples.
// tests/unit/page-states.test.ts covers the states the current content isn't in.
const CARD = 'main [data-project-service]';
const FILTER_RADIOS = 'main fieldset input[type="radio"]';
const TAP_TARGET = 44;
const FLOOR_SERVICE = 'floor-tile-installation';
const CROP_TOLERANCE = 0.02;
const TALLEST_PHOTO_ON_DESKTOP = 720;
const DESKTOP_WIDTH = 1000;
const IN_BETWEEN_WIDTHS = [560, 768, 900, 920, 1024, 1100, 1240, 1600];
// The facts tile can stretch a row slightly at these widths when its words are long, which trims a photo's edges a little.
const IN_BETWEEN_CROP_TOLERANCE = 0.1;

const copy = JSON.parse(readFileSync('src/data/copy.json', 'utf8'));

const PROJECTS_DIR = 'src/content/projects';
const projectFolders = existsSync(PROJECTS_DIR)
  ? readdirSync(PROJECTS_DIR).filter((name) => existsSync(join(PROJECTS_DIR, name, 'index.md')))
  : [];

const projects = projectFolders.map((id) => {
  const dir = join(PROJECTS_DIR, id);
  const frontmatter = readFileSync(join(dir, 'index.md'), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  return {
    id,
    dir,
    service: frontmatter.match(/^service:\s*(.+)$/m)?.[1].trim() ?? '',
    files: [...frontmatter.matchAll(/^\s+- src:\s*(.+)$/gm)].map((match) => match[1].trim()),
  };
});

const offeredServices = [...new Set(projects.map(({ service }) => service))];

function labelOf(service: string): string {
  const menuLabel = copy.site.nav.services.find(({ path }: { path: string }) => path === `/services/${service}/`)?.label;
  if (menuLabel) return menuLabel;
  const file = readFileSync(join('src/content/services', `${service}.md`), 'utf8');
  return file.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? '';
}

function hrefsOf(service?: string) {
  return projects
    .filter((project) => !service || project.service === service)
    .map(({ id }) => `/projects/${id}/`)
    .sort();
}

async function visibleCards(page: Page) {
  const hrefs = await page.locator(`${CARD} a`).evaluateAll((links) =>
    links.filter((link) => link.checkVisibility()).map((link) => link.getAttribute('href')),
  );
  return hrefs.sort();
}

async function expectFloorFilterWorks(page: Page) {
  await page.getByRole('radio', { name: labelOf(FLOOR_SERVICE), exact: true }).check();
  expect(await visibleCards(page)).toEqual(hrefsOf(FLOOR_SERVICE));
}

test('with no projects, the gallery shows a way to get in touch instead of an empty list', async ({ page }) => {
  test.skip(projects.length > 0, 'Only applies when there are no projects');
  await page.goto('/projects/');
  await expect(page.locator('main fieldset')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(copy.projects.emptyText);
  await expect(page.locator('main a[href="/contact/"]')).toBeVisible();
});

test.describe('projects gallery', () => {
  test.skip(projects.length === 0, 'No projects right now');

  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/');
  });

  test('all projects are visible by default', async ({ page }) => {
    await expect(page.getByRole('radio', { name: copy.projects.filterAll })).toBeChecked();
    expect(await visibleCards(page)).toEqual(hrefsOf());
  });

  test('filter shows only the chosen service', async ({ page }) => {
    test.skip(!offeredServices.includes(FLOOR_SERVICE), 'No floor projects right now');
    await expectFloorFilterWorks(page);
  });

  test('every choice shows its own projects, and All projects brings them all back', async ({ page }) => {
    for (const service of offeredServices) {
      await page.getByRole('radio', { name: labelOf(service), exact: true }).check();
      expect(await visibleCards(page), service).toEqual(hrefsOf(service));
    }
    await page.getByRole('radio', { name: copy.projects.filterAll }).check();
    expect(await visibleCards(page)).toEqual(hrefsOf());
  });

  test('the filter works from the keyboard, with a visible focus state', async ({ page }) => {
    const first = page.locator(FILTER_RADIOS).first();
    await first.focus();
    await page.keyboard.press('ArrowRight');

    const moved = page.locator(`${FILTER_RADIOS}:checked`);
    await expect(moved).toBeFocused();
    expect(await visibleCards(page)).toEqual(hrefsOf(await moved.getAttribute('value') ?? ''));

    const outlineWidth = await moved.evaluate((radio) => parseFloat(getComputedStyle(radio.nextElementSibling as Element).outlineWidth));
    expect(outlineWidth).toBeGreaterThan(0);
  });

  test('every choice is a target of at least 44px', async ({ page }) => {
    await expect(page.locator(FILTER_RADIOS)).toHaveCount(offeredServices.length + 1);
    for (const radio of await page.locator(FILTER_RADIOS).all()) {
      const box = await radio.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(TAP_TARGET);
      expect(box?.width).toBeGreaterThanOrEqual(TAP_TARGET);
    }
  });

  test('filtered cards close up, with no holes in the grid', async ({ page }) => {
    const cardBoxes = () =>
      page.locator(CARD).evaluateAll((items) =>
        items
          .filter((item) => item.checkVisibility())
          .map((item) => {
            const { x, y, width } = item.getBoundingClientRect();
            return { x, y, width };
          }),
      );
    const allCards = await cardBoxes();
    const columns = [...new Set(allCards.map(({ x }) => Math.round(x)))];

    for (const service of offeredServices) {
      await page.getByRole('radio', { name: labelOf(service), exact: true }).check();
      const shown = await cardBoxes();

      expect(shown.length, service).toBeGreaterThan(0);
      expect(shown[0].y).toBeCloseTo(allCards[0].y, 0);
      shown.forEach((card, index) => {
        expect(Math.round(card.x), `${service} card ${index} sits in the next free column`).toBe(columns[index % columns.length]);
        expect(card.width).toBeCloseTo(allCards[0].width, 0);
        const rowStart = shown[index - (index % columns.length)];
        expect(card.y, `${service} card ${index} shares its row`).toBeCloseTo(rowStart.y, 0);
      });
    }
  });

  test('the first card loads early, because it is on screen first', async ({ page }) => {
    const images = page.locator(`${CARD} img`);
    await expect(images.first()).toHaveAttribute('fetchpriority', 'high');
    await expect(images.first()).toHaveAttribute('loading', 'eager');
    await expect(page.locator('main img[fetchpriority="high"]')).toHaveCount(1);
  });

  test('the filter rules sit in the head', async ({ page }) => {
    const rulesInHead = await page.evaluate(
      () => [...document.head.querySelectorAll('style')].filter((style) => style.textContent?.includes('data-project-filter')).length,
    );
    expect(rulesInHead).toBe(1);
    await expect(page.locator('body style')).toHaveCount(0);
  });

  test('a filtered gallery has no accessibility problems axe can find', async ({ page }) => {
    await page.getByRole('radio', { name: labelOf(offeredServices[0]), exact: true }).check();
    expect(await axeProblems(page)).toEqual([]);
  });

  test('portrait and landscape photos produce same-height cards', async ({ page }) => {
    const cards = await page.locator(CARD).evaluateAll((items) =>
      items.map((item) => {
        const { x, y, width, height } = item.getBoundingClientRect();
        const photo = item.querySelector('img')!.getBoundingClientRect();
        const article = item.firstElementChild!;
        return {
          x,
          y,
          width,
          height,
          photoWidth: photo.width,
          photoHeight: photo.height,
          articleHeight: article.getBoundingClientRect().height,
          overflows: article.scrollWidth > article.clientWidth || article.scrollHeight > article.clientHeight,
        };
      }),
    );

    expect(cards).toHaveLength(projects.length);
    const rows = Map.groupBy(cards, ({ y }) => Math.round(y));
    for (const row of rows.values()) {
      for (const card of row) {
        expect(Math.abs(card.height - row[0].height)).toBeLessThanOrEqual(SUBPIXEL);
        expect(Math.abs(card.articleHeight - card.height)).toBeLessThanOrEqual(SUBPIXEL);
      }
    }
    for (const card of cards) {
      expect(Math.abs(card.photoWidth - cards[0].photoWidth)).toBeLessThanOrEqual(SUBPIXEL);
      expect(Math.abs(card.photoHeight - cards[0].photoHeight)).toBeLessThanOrEqual(SUBPIXEL);
      expect(card.overflows).toBe(false);
    }
  });
});

test.describe('projects gallery without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test.skip(projects.length === 0, 'No projects right now');

  test('filter works without JavaScript', async ({ page }) => {
    test.skip(!offeredServices.includes(FLOOR_SERVICE), 'No floor projects right now');
    await page.goto('/projects/');
    await expect(page.locator(`${CARD} a`)).toHaveCount(projects.length);
    await expectFloorFilterWorks(page);
  });
});

for (const { id, dir, service, files } of projects) {
  test.describe(`project page ${id}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/projects/${id}/`);
    });

    test('project page links to its service and to contact', async ({ page }) => {
      const { detail } = copy.projects;
      const main = page.locator('main');
      await expect(main.getByRole('link', { name: detail.serviceLinkLabel })).toHaveAttribute('href', `/services/${service}/`);
      await expect(main.getByRole('link', { name: detail.contactLabel })).toHaveAttribute('href', '/contact/');
      await expect(main.getByRole('link', { name: detail.backLabel })).toHaveAttribute('href', '/projects/');
    });

    test('shows every photo in its own shape, at a size that fits the screen', async ({ page, viewport }) => {
      const images = page.locator('main img');
      await expect(images).toHaveCount(files.length);

      for (const [index, file] of files.entries()) {
        const image = images.nth(index);
        await image.scrollIntoViewIfNeeded();
        const { width: sourceWidth = 1, height: sourceHeight = 1 } = await sharp(join(dir, file)).metadata();
        const box = await image.boundingBox();
        const shownRatio = (box?.width ?? 0) / (box?.height ?? 1);
        const sourceRatio = sourceWidth / sourceHeight;

        expect(Math.abs(shownRatio / sourceRatio - 1), file).toBeLessThanOrEqual(CROP_TOLERANCE);
        if ((viewport?.width ?? 0) >= DESKTOP_WIDTH) {
          expect(box?.height, file).toBeLessThanOrEqual(TALLEST_PHOTO_ON_DESKTOP);
        }

        const largestOffered = await image.evaluate((element: HTMLImageElement) =>
          Math.max(...element.srcset.split(',').map((candidate) => parseInt(candidate.trim().split(/\s+/)[1], 10))),
        );
        expect(largestOffered, file).toBeLessThanOrEqual(sourceWidth);
      }
    });

    test('photos are never cropped hard at in-between screen widths', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Sets its own screen sizes');
      for (const width of IN_BETWEEN_WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        const stretches = await page.locator('main img').evaluateAll((images) =>
          images.map((image) => {
            const { width: shownWidth, height: shownHeight } = image.getBoundingClientRect();
            return Math.abs(shownWidth / shownHeight / (Number(image.getAttribute('width')) / Number(image.getAttribute('height'))) - 1);
          }),
        );
        expect(Math.max(...stretches), `at ${width}px wide`).toBeLessThanOrEqual(IN_BETWEEN_CROP_TOLERANCE);
      }
    });
  });
}

// The sample photos are all 4:3 or 3:4, which hides holes that ordinary camera and phone mixes would show.
// So these swap other shapes into a real page, with its real CSS.
const SHAPE_MIXES: Record<string, number[]> = {
  '4:3 + 3:2': [4 / 3, 3 / 2],
  '4:3 + 16:9': [4 / 3, 16 / 9],
  '3:2 + 16:9': [3 / 2, 16 / 9],
  '16:9 + 16:9': [16 / 9, 16 / 9],
  '3:4 + 3:4 + 4:3': [3 / 4, 3 / 4, 4 / 3],
  '9:16 + 9:16 + 16:9': [9 / 16, 9 / 16, 16 / 9],
  '3:4 + 16:9 + 4:3 + 3:2': [3 / 4, 16 / 9, 4 / 3, 3 / 2],
  'one 3:4': [3 / 4],
  'one 4:3': [4 / 3],
  'one 1:1': [1],
  'one 5:4': [5 / 4],
  'one 6:5': [6 / 5],
};
const ROW_FILL_WIDTHS = [640, 744, 768, 820, 899, 900, 903, 909, 915, 924, 930, 960, 1024, 1100, 1280, 1440, 1920];
const HEIGHT_CAP_STARTS = 900;
const SIZES_WIDTHS = [390, 640, 768, 899, 900, 964, 1024, 1033, 1100, 1280, 1600, 1920];

async function showPhotoShapes(page: Page, ratios: number[]) {
  await page.locator('[data-photo-gallery]').evaluate((gallery, shapes) => {
    const photos = [...gallery.querySelectorAll('img')];
    const template = photos[0];
    const tile = gallery.querySelector(':scope > :not(img)');
    photos.forEach((photo) => photo.remove());
    for (const ratio of shapes) {
      const width = 1200;
      const height = Math.round(width / ratio);
      const photo = template.cloneNode() as HTMLImageElement;
      photo.removeAttribute('srcset');
      photo.removeAttribute('sizes');
      photo.loading = 'eager';
      photo.width = width;
      photo.height = height;
      photo.style.setProperty('--photo-ratio', String(ratio));
      photo.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"/>`;
      gallery.insertBefore(photo, tile);
    }
  }, ratios);
}

test.describe('project page rows', () => {
  test.skip(({ isMobile }) => isMobile, 'Sets its own screen sizes');
  test.skip(projects.length === 0, 'No projects right now');

  for (const [name, ratios] of Object.entries(SHAPE_MIXES)) {
    test(`${name} leaves no hole at the end of a row`, async ({ page }) => {
      await page.goto(`/projects/${projects[0].id}/`);
      await showPhotoShapes(page, ratios);

      for (const width of ROW_FILL_WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        const holes = await page.locator('[data-photo-gallery]').evaluate((gallery) => {
          const right = gallery.getBoundingClientRect().right;
          const edges = new Map<number, number>();
          for (const child of gallery.children) {
            const box = child.getBoundingClientRect();
            const row = Math.round(box.top);
            edges.set(row, Math.max(edges.get(row) ?? 0, box.right));
          }
          return [...edges.values()].map((edge) => right - edge);
        });
        expect(Math.max(...holes), `empty space at the right of a row at ${width}px wide`).toBeLessThanOrEqual(SUBPIXEL);

        if (width >= HEIGHT_CAP_STARTS) {
          const heights = await page.locator('[data-photo-gallery] img').evaluateAll((images) =>
            images.map((image) => image.getBoundingClientRect().height),
          );
          expect(Math.max(...heights), `tallest photo at ${width}px wide`).toBeLessThanOrEqual(TALLEST_PHOTO_ON_DESKTOP + SUBPIXEL);
        }
      }
    });
  }

  test('no photo shows wider than its sizes says, at any tested width', async ({ page }) => {
    for (const { id } of projects) {
      await page.goto(`/projects/${id}/`);
      for (const width of SIZES_WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        const photos = await page.locator('main img').evaluateAll((images) =>
          images.map((image) => {
            const { sizes } = image as HTMLImageElement;
            const entries = sizes.split(/,\s*/).map((entry) => entry.match(/^(?:(\(.+\))\s+)?([\d.]+)(px|vw)$/));
            const chosen = entries.find((entry) => entry && (!entry[1] || matchMedia(entry[1]).matches));
            return {
              shown: image.getBoundingClientRect().width,
              declared: chosen ? (chosen[3] === 'vw' ? (Number(chosen[2]) * innerWidth) / 100 : Number(chosen[2])) : 0,
            };
          }),
        );
        for (const { shown, declared } of photos) {
          expect(shown, `${id} at ${width}px`).toBeLessThanOrEqual(declared + SUBPIXEL);
        }
      }
    }
  });
});
