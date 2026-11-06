import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { services } from './site';

const FIELD_ORDER = ['name', 'phone', 'email', 'city', 'projectType', 'service', 'message'];
const VISIBLE_FIELDS = 'input:not([type="hidden"]):not([name="bot-field"]), select, textarea';

const { form: formCopy } = JSON.parse(readFileSync('src/data/copy.json', 'utf8')).contact;

function contactForm(page: Page) {
  return page.locator('form[name="contact"]');
}

function field(form: Locator, name: string) {
  return form.locator(`[name="${name}"]`);
}

async function fillRequiredFields(form: Locator) {
  await field(form, 'name').fill('Sam Example');
  await field(form, 'phone').fill('647 555 0100');
  await field(form, 'message').fill('A small bathroom floor, about 40 square feet.');
}

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
  });

  test('empty form is blocked by the browser', async ({ page }) => {
    const form = contactForm(page);
    await form.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(form.locator('input[name="name"]:invalid')).toHaveCount(1);
  });

  test('blank optional email is accepted', async ({ page }) => {
    const form = contactForm(page);
    await fillRequiredFields(form);

    await expect(field(form, 'email')).toHaveValue('');
    await expect(form.locator(':invalid')).toHaveCount(0);
  });

  test('invalid email shows as invalid', async ({ page }) => {
    const form = contactForm(page);
    await fillRequiredFields(form);
    await field(form, 'email').fill('not-an-email');

    await expect(form.locator('input[name="email"]:invalid')).toHaveCount(1);
  });

  test('honeypot is unreachable', async ({ page }) => {
    const honeypot = field(contactForm(page), 'bot-field');

    await expect(honeypot).toHaveCount(1);
    await expect(honeypot).toBeHidden();
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    await expect(honeypot).toHaveAttribute('autocomplete', 'off');
  });

  test('the hidden subject sets the email subject line', async ({ page }) => {
    const subject = field(contactForm(page), 'subject');

    await expect(subject).toHaveAttribute('type', 'hidden');
    await expect(subject).toHaveValue(formCopy.subject);
  });

  test('the dropdowns offer the right choices, starting with a blank prompt', async ({ page }) => {
    const form = contactForm(page);
    const choices = (name: string) =>
      field(form, name)
        .locator('option')
        .evaluateAll((options: HTMLOptionElement[]) => options.map(({ value, text }) => ({ value, text })));
    const choice = (text: string) => ({ value: text, text });
    const prompt = { value: '', text: formCopy.selectPrompt };

    expect(await choices('projectType')).toEqual([
      prompt,
      choice(formCopy.projectTypeHome),
      choice(formCopy.projectTypeCommercial),
    ]);
    expect(await choices('service')).toEqual([
      prompt,
      ...services.map(({ title }) => choice(title)),
      choice(formCopy.serviceOther),
    ]);
  });

  test('every field has a label and tab order follows the visual order', async ({ page }) => {
    const form = contactForm(page);
    const fields = form.locator(VISIBLE_FIELDS);

    const onScreen = await fields.evaluateAll((elements) =>
      elements.map((element) => {
        const { top, left } = element.getBoundingClientRect();
        return { name: element.getAttribute('name') ?? '', top: Math.round(top), left: Math.round(left) };
      }),
    );
    const visualOrder = [...onScreen].sort((a, b) => a.top - b.top || a.left - b.left).map(({ name }) => name);
    expect(visualOrder).toEqual(FIELD_ORDER);

    for (const name of FIELD_ORDER) {
      const id = await field(form, name).getAttribute('id');
      const label = form.locator(`label[for="${id}"]`);
      await expect(label, `the ${name} field needs a label`).toHaveCount(1);
      await expect(label).not.toBeEmpty();
      await expect(label).toBeVisible();
    }

    const tabOrder = [FIELD_ORDER[0]];
    await field(form, FIELD_ORDER[0]).focus();
    while (tabOrder.length < FIELD_ORDER.length) {
      await page.keyboard.press('Tab');
      tabOrder.push(await page.evaluate(() => document.activeElement?.getAttribute('name') ?? ''));
    }
    expect(tabOrder).toEqual(visualOrder);
  });

  test('required fields say so in their label', async ({ page }) => {
    const form = contactForm(page);
    for (const name of ['name', 'phone', 'message']) {
      await expect(field(form, name)).toHaveAttribute('required', '');
      const id = await field(form, name).getAttribute('id');
      await expect(form.locator(`label[for="${id}"]`)).toContainText('Required');
    }
  });
});

test.describe('contact form with JavaScript off', () => {
  test.use({ javaScriptEnabled: false });

  test('form works with JavaScript off', async ({ page }) => {
    await page.goto('/contact/');
    const form = contactForm(page);

    await expect(form).toHaveAttribute('action', '/thank-you/');
    await expect(form).toHaveAttribute('method', 'POST');
    for (const name of FIELD_ORDER) {
      await expect(field(form, name)).toBeVisible();
    }
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });
});
