import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { listRoutes } from '../../scripts/lib/audit-rules.mjs';
import { callBarCases, desktopCases, readCallBarSwitch, readFullMenuSwitch } from './breakpoints';
import { ROUTES, services, setTextSize, sidewaysProblems, splitAcrossLines, SUBPIXEL } from './site';

const TAP_TARGET = 44;
const SMALLEST_PHONE = { width: 320, height: 640 };
const TEXT_SIZES = [150, 200];
const LARGEST_TEXT = 200;
const PHONE_WIDTHS = [320, 360, 375, 380, 390, 412, 768];
const SMALL_PHONE_WIDTHS = [320, 360, 375, 390];
const HEADER_WIDTHS = [320, 340, 360, 375, 390, 412, 430];
const SLIGHTLY_LARGER_TEXT = [105, 110, 115, 120, 125, 130, 140, 150, 175, 200];
// Read from the CSS, so the cases just either side of each switch follow it when a font change moves it.
const { sticky: STICKY_BAR_CASES, inFlow: IN_FLOW_BAR_CASES } = callBarCases(readCallBarSwitch());
const CALL_BAR_CASES = [...STICKY_BAR_CASES, ...IN_FLOW_BAR_CASES];
const { fullMenuFrom: FULL_MENU_FROM, oneRowWidths: DESKTOP_WIDTHS, headerCases: HEADER_COVER_CASES } = desktopCases(readFullMenuSwitch());
const HEADING_SIZE_WIDTHS = [320, 340, 360, 375, 390, 412, 430];
const HEADING_SIZE_TEXT = [150, 175, 200];
const TAP_SPACING = 8;
const ALL_BUT_ROUNDING = 0.99;
const VISIBLE_BORDER_CONTRAST = 3;
const SUBMIT = 'form[name="contact"] button[type="submit"]';
const CALL_BAR = '.call-bar';

const copy = JSON.parse(readFileSync('src/data/copy.json', 'utf8'));
const navLinks: { path: string }[] = [...copy.site.nav.services, ...copy.site.nav.pages];

async function expectNothingSideways(page: Page) {
  expect(await sidewaysProblems(page)).toEqual({ extraWidth: 0, cutOff: [] });
}

// block: 'end' puts the element as low on screen as the page's scroll padding allows, the worst case for a bar at the bottom.
async function overlapWithCallBar(target: Locator) {
  return target.evaluate((element, { barSelector, subpixel }) => {
    element.scrollIntoView({ block: 'end', behavior: 'instant' });
    const box = element.getBoundingClientRect();
    const bar = document.querySelector(barSelector)?.getBoundingClientRect();
    const overlap = bar ? box.bottom - bar.top : 0;
    return overlap > subpixel ? overlap : 0;
  }, { barSelector: CALL_BAR, subpixel: SUBPIXEL });
}

async function expectAllClearOfCallBar(targets: Locator) {
  for (const target of await targets.all()) {
    const label = (await target.textContent())?.trim();
    expect(await overlapWithCallBar(target), `"${label}" is hidden behind the call bar`).toBe(0);
  }
}

// Flex items on one row share a centre, so this sees an item dropping to a second row. It can't see text wrapping inside one item: splitAcrossLines covers the phone number.
async function headerRowsAreOne(page: Page) {
  const centres = await page.locator('.site-header__row > *').evaluateAll((items) =>
    items
      .filter((item) => item.checkVisibility())
      .map((item) => {
        const { top, height } = item.getBoundingClientRect();
        return top + height / 2;
      }),
  );
  return Math.max(...centres) - Math.min(...centres) <= SUBPIXEL;
}

async function barButtonsShareARow(page: Page) {
  const tops = await page.locator(`${CALL_BAR} .button`).evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().top));
  return Math.abs(tops[0] - tops[1]) <= SUBPIXEL;
}

// Footer headings are small labels on purpose, so only headings at least body size at normal text count.
async function markBodySizedHeadings(page: Page) {
  await page.evaluate(() => {
    const body = parseFloat(getComputedStyle(document.body).fontSize);
    for (const heading of document.querySelectorAll('h1, h2, h3')) {
      if (parseFloat(getComputedStyle(heading).fontSize) >= body) heading.setAttribute('data-body-sized', '');
    }
  });
}

async function headingsSmallerThanBody(page: Page) {
  return page.locator('[data-body-sized]').evaluateAll((headings) => {
    const body = parseFloat(getComputedStyle(document.body).fontSize);
    return headings
      .filter((heading) => parseFloat(getComputedStyle(heading).fontSize) < body)
      .map((heading) => `"${heading.textContent?.trim()}" is ${getComputedStyle(heading).fontSize}, body is ${body}px`);
  });
}

async function menuIsBesideLogo(page: Page) {
  const centre = async (selector: string) => {
    const { y, height } = (await page.locator(selector).boundingBox())!;
    return y + height / 2;
  };
  return Math.abs((await centre('.nav-menu')) - (await centre('.site-header__logo'))) <= SUBPIXEL;
}

function relativeLuminance(rgb: number[]) {
  const [red, green, blue] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const [lighter, darker] = [first, second]
    .map((color) => relativeLuminance(color.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number)))
    .sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test('these checks cover every built page', async () => {
  expect([...ROUTES].sort(), 'A page was added or removed. Add it to ROUTES in tests/browser/site.ts.').toEqual((await listRoutes('dist')).sort());
});

test.describe('on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phone only');

  for (const path of ROUTES) {
    test(`no sideways scrolling at 320px on ${path}`, async ({ page }) => {
      await page.setViewportSize(SMALLEST_PHONE);
      await page.goto(path);
      await expectNothingSideways(page);
    });

    for (const percent of TEXT_SIZES) {
      test(`no sideways scrolling at ${percent}% text on ${path}`, async ({ page }) => {
        await page.goto(path);
        await setTextSize(page, percent);
        await expectNothingSideways(page);
      });
    }
  }

  for (const path of ROUTES) {
    test(`no sideways scrolling at 320px and the largest text on ${path}`, async ({ page }) => {
      await page.setViewportSize(SMALLEST_PHONE);
      await page.goto(path);
      await setTextSize(page, LARGEST_TEXT);
      await expectNothingSideways(page);
    });
  }

  for (const width of PHONE_WIDTHS) {
    test(`the header stays on one row at ${width}px, with the menu open or closed`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      expect(await headerRowsAreOne(page)).toBe(true);
      await page.locator('.nav-menu summary').click();
      expect(await headerRowsAreOne(page)).toBe(true);
    });
  }

  for (const width of HEADER_WIDTHS) {
    test(`the Menu button stays beside the logo at ${width}px as text grows`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const menu = page.locator('.nav-menu');
      for (const percent of SLIGHTLY_LARGER_TEXT) {
        await setTextSize(page, percent);
        for (const open of [false, true]) {
          await menu.evaluate((details: HTMLDetailsElement, value) => { details.open = value; }, open);
          expect(await menuIsBesideLogo(page), `at ${percent}% text, menu ${open ? 'open' : 'closed'}`).toBe(true);
        }
      }
    });
  }

  for (const path of ROUTES) {
    test(`the digits of the phone number stay together at the largest text on ${path}`, async ({ page }) => {
      await page.goto(path);
      await setTextSize(page, LARGEST_TEXT);
      for (const width of SMALL_PHONE_WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        expect(await splitAcrossLines(page, '.call-number', /\d+/), `at ${width}px`).toEqual([]);
      }
    });

    test(`headings are never smaller than body text at large text on ${path}`, async ({ page }) => {
      await page.goto(path);
      await markBodySizedHeadings(page);
      for (const width of HEADING_SIZE_WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        for (const percent of HEADING_SIZE_TEXT) {
          await setTextSize(page, percent);
          expect(await headingsSmallerThanBody(page), `at ${width}px and ${percent}% text`).toEqual([]);
        }
      }
    });

    test(`headings keep their words whole at the largest text on ${path}`, async ({ page }) => {
      await page.goto(path);
      await setTextSize(page, LARGEST_TEXT);
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 800 });
        expect(await splitAcrossLines(page, 'h1, h2, h3', /[^\s-]+/), `at ${width}px`).toEqual([]);
      }
    });
  }

  test('the open menu really shows on screen', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-menu summary').click();
    const links = page.locator('.nav-menu__panel a');
    await expect(links.first()).toBeInViewport();
    const onTop = await links.first().evaluate((link) => {
      const { left, top, width, height } = link.getBoundingClientRect();
      return link.contains(document.elementFromPoint(left + width / 2, top + height / 2));
    });
    expect(onTop).toBe(true);
    await expect(page.locator('.nav-menu__panel')).toHaveCSS('opacity', '1');
  });

  test('call bar never covers the form submit button when scrolled to it', async ({ page }) => {
    await page.setViewportSize(SMALLEST_PHONE);
    await page.goto('/contact/');
    await expect(page.locator(CALL_BAR)).toBeVisible();
    expect(await overlapWithCallBar(page.locator(SUBMIT))).toBe(0);
  });

  for (const { width, percent } of CALL_BAR_CASES) {
    test.describe(`at ${width}px and ${percent}% text`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 640 });
      });

      test('call bar never covers the form submit button', async ({ page }) => {
        await page.goto('/contact/');
        await setTextSize(page, percent);
        expect(await overlapWithCallBar(page.locator(SUBMIT))).toBe(0);
      });

      test("call bar leaves every footer link and the page's end clear", async ({ page }) => {
        await page.goto('/');
        await setTextSize(page, percent);
        await expectAllClearOfCallBar(page.locator('.site-footer a'));
        expect(await overlapWithCallBar(page.locator('.site-footer__legal'))).toBe(0);

        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await expect(page.locator(CALL_BAR)).toBeInViewport({ ratio: ALL_BUT_ROUNDING });
      });

      test('call bar never covers a page link', async ({ page }) => {
        await page.goto('/contact/');
        await setTextSize(page, percent);
        await expectAllClearOfCallBar(page.locator('main a[href]'));
      });
    });
  }

  for (const { width, percent } of STICKY_BAR_CASES) {
    test(`at ${width}px and ${percent}% text the bar stays on screen and is no taller than its token`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await page.goto('/contact/');
      await setTextSize(page, percent);
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
      await expect(page.locator(CALL_BAR)).toBeInViewport({ ratio: 1 });

      const { height, token } = await page.locator(CALL_BAR).evaluate((bar) => {
        const probe = document.body.appendChild(document.createElement('div'));
        probe.style.height = 'var(--call-bar-height)';
        const token = probe.getBoundingClientRect().height;
        probe.remove();
        return { height: bar.getBoundingClientRect().height, token };
      });
      expect(height).toBeLessThanOrEqual(token + SUBPIXEL);
      expect(await barButtonsShareARow(page)).toBe(true);
    });
  }

  for (const { width, percent } of IN_FLOW_BAR_CASES) {
    test(`at ${width}px and ${percent}% text the bar gives the screen back and sits after the footer`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await page.goto('/contact/');
      await setTextSize(page, percent);

      const bar = page.locator(CALL_BAR);
      await expect(bar).not.toBeInViewport();
      await expect(page.locator('.site-header a[href^="tel:"]').locator('visible=true')).toHaveCount(0);
      const call = bar.locator('a[href^="tel:"]');
      await call.scrollIntoViewIfNeeded();
      await expect(call).toBeInViewport();
      const { barTop, footerBottom } = await bar.evaluate((element) => ({
        barTop: element.getBoundingClientRect().top,
        footerBottom: document.querySelector('.site-footer')!.getBoundingClientRect().bottom,
      }));
      expect(barTop).toBeGreaterThanOrEqual(footerBottom - SUBPIXEL);
      expect(await barButtonsShareARow(page)).toBe(false);
    });
  }

  for (const percent of [100, LARGEST_TEXT]) {
    test(`the open menu fits sideways and every link clears the call bar at ${percent}% text`, async ({ page }) => {
      await page.goto('/');
      await setTextSize(page, percent);
      await page.locator('.nav-menu summary').click();
      const panel = page.locator('.nav-menu__panel');
      await expect(panel).toBeVisible();
      await expectNothingSideways(page);
      await expectAllClearOfCallBar(panel.locator('a'));
    });
  }

  test('the open menu fits a 320px screen', async ({ page }) => {
    await page.setViewportSize(SMALLEST_PHONE);
    await page.goto('/');
    await page.locator('.nav-menu summary').click();
    await expect(page.locator('.nav-menu__panel')).toBeVisible();
    await expectNothingSideways(page);
  });

  test('tap targets in the open menu are at least 44px tall', async ({ page }) => {
    await page.goto('/');
    await page.locator('.nav-menu summary').click();
    for (const link of await page.locator('.nav-menu__panel a').all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(TAP_TARGET);
    }
  });
});

test('call bar is visible on phones and hidden on desktop', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    await expect(page.locator(CALL_BAR)).toBeInViewport({ ratio: 1 });
  } else {
    await expect(page.locator(CALL_BAR)).toBeHidden();
  }
});

test('tap targets in header and call bar are at least 44px tall', async ({ page }) => {
  await page.goto('/');
  const targets = page.locator('.site-header a, .site-header summary, .call-bar a').locator('visible=true');
  expect(await targets.count()).toBeGreaterThan(0);
  for (const target of await targets.all()) {
    const { height } = (await target.boundingBox())!;
    expect(height, `"${(await target.textContent())?.trim()}" is too short to tap`).toBeGreaterThanOrEqual(TAP_TARGET);
  }
});

test.describe('site works without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of ROUTES) {
    test(`site works without JavaScript on ${path}`, async ({ page, isMobile }) => {
      await page.goto(path);

      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();

      let header = page.locator('.nav-full');
      if (isMobile) {
        await page.locator('.nav-menu summary').click();
        header = page.locator('.nav-menu__panel');
      }
      for (const { path: target } of navLinks) {
        await expect(header.locator(`a[href="${target}"]`)).toBeVisible();
        await expect(page.locator(`.site-footer a[href="${target}"]`)).toBeVisible();
      }
    });
  }
});

test.describe('on a desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop only');

  for (const path of ROUTES) {
    test(`no sideways scrolling at the largest text on ${path}`, async ({ page }) => {
      await page.goto(path);
      await setTextSize(page, LARGEST_TEXT);
      await expectNothingSideways(page);
    });
  }

  for (const width of DESKTOP_WIDTHS) {
    test(`the header stays on one row at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      expect(await headerRowsAreOne(page)).toBe(true);
    });
  }

  test(`the full menu starts at ${FULL_MENU_FROM}px, as the CSS says`, async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: FULL_MENU_FROM - 1, height: 800 });
    await expect(page.locator('.nav-full')).toBeHidden();
    await expect(page.locator('.nav-menu')).toBeVisible();
    await page.setViewportSize({ width: FULL_MENU_FROM, height: 800 });
    await expect(page.locator('.nav-full')).toBeVisible();
    await expect(page.locator('.nav-menu')).toBeHidden();
  });

  for (const { width, percent, fullMenu } of HEADER_COVER_CASES) {
    test(`the header never covers a page link scrolled to at ${width}px and ${percent}% text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/contact/');
      await setTextSize(page, percent);
      await expect(page.locator('.nav-full'), fullMenu ? 'the full, sticky menu should show here' : 'the Menu button should show here').toBeVisible({ visible: fullMenu });
      await expectNothingSideways(page);
      for (const link of await page.locator('main a[href]').all()) {
        const covered = await link.evaluate((element) => {
          element.scrollIntoView({ block: 'start', behavior: 'instant' });
          return document.querySelector('.site-header')!.getBoundingClientRect().bottom - element.getBoundingClientRect().top;
        });
        expect(covered, `${await link.getAttribute('href')} is under the header`).toBeLessThanOrEqual(SUBPIXEL);
      }
    });
  }

  test('at the largest text the header leaves most of the screen to the page', async ({ page }) => {
    await page.goto('/');
    await setTextSize(page, LARGEST_TEXT);
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    const { bottom } = await page.locator('.site-header').evaluate((header) => header.getBoundingClientRect().toJSON());
    expect(bottom).toBeLessThanOrEqual(0);
  });
});

test.describe('service page', () => {
  test.skip(({ isMobile }) => isMobile, 'The two columns only start at 900px');

  test('a service with no highlights leaves no blank column', async ({ page }) => {
    await page.goto(`/services/${services[0].id}/`);
    const prose = page.locator('.service-prose');
    const columns = () => prose.evaluate((element) => getComputedStyle(element.parentElement!).gridTemplateColumns.split(' ').length);

    expect(await columns()).toBe(2);
    await page.locator('main aside').evaluate((aside) => aside.remove());
    expect(await columns()).toBe(1);
    await expect(page.locator('main aside')).toHaveCount(0);

    // Text left at reading width is the accepted look, rather than running the full width of the page.
    const { width, readingWidth } = await prose.locator('p').first().evaluate((paragraph) => ({
      width: paragraph.getBoundingClientRect().width,
      readingWidth: parseFloat(getComputedStyle(paragraph).maxWidth),
    }));
    expect(Math.abs(width - readingWidth)).toBeLessThanOrEqual(SUBPIXEL);
  });
});

test.describe('404 page links', () => {
  const LINK = '.lost__link';

  test('look like links', async ({ page }) => {
    await page.goto('/404.html');
    const links = page.locator(LINK);
    expect(await links.count()).toBeGreaterThan(0);

    const { underline, border, background } = await links.first().evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        underline: style.textDecorationLine,
        border: style.borderBlockStartColor,
        background: style.backgroundColor,
      };
    });
    expect(underline).toContain('underline');
    expect(contrast(border, background)).toBeGreaterThanOrEqual(VISIBLE_BORDER_CONTRAST);

    const gap = await links.first().evaluate((element) => parseFloat(getComputedStyle(element.closest('ul')!).rowGap));
    expect(gap).toBeGreaterThanOrEqual(TAP_SPACING);
  });

  test('show when pressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/404.html');
    const link = page.locator(LINK).first();
    const look = () => link.evaluate((element) => {
      const { opacity, backgroundColor, color } = getComputedStyle(element);
      return { opacity, backgroundColor, color };
    });

    await link.hover();
    const hovering = await look();
    await page.mouse.down();
    const pressed = await look();
    await page.mouse.move(0, 0);
    await page.mouse.up();

    expect(pressed).not.toEqual(hovering);
  });
});
