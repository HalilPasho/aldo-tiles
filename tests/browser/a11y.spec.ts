import { expect, test } from '@playwright/test';
import { axeProblems, ROUTES } from './site';

for (const path of ROUTES) {
  test(`${path} has no accessibility problems axe can find`, async ({ page }) => {
    await page.goto(path);
    expect(await axeProblems(page)).toEqual([]);
  });
}

test('the open menu has no accessibility problems axe can find', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The menu button only shows under 1240px');
  await page.goto('/');
  await page.locator('.nav-menu summary').click();
  await expect(page.locator('.nav-menu__panel')).toBeVisible();
  expect(await axeProblems(page)).toEqual([]);
});
