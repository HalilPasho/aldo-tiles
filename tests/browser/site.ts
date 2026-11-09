import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { REQUIRED_ROUTES } from '../../scripts/lib/audit-rules.mjs';

const SERVICES_DIR = 'src/content/services';
const PROJECTS_DIR = 'src/content/projects';
export const SUBPIXEL = 1;

function frontmatterOf(path: string) {
  return readFileSync(path, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

export const services = readdirSync(SERVICES_DIR)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const frontmatter = frontmatterOf(join(SERVICES_DIR, file));
    return {
      id: file.replace(/\.md$/, ''),
      title: frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? '',
      order: Number(frontmatter.match(/^order:\s*(\d+)/m)?.[1]),
    };
  })
  .sort((a, b) => a.order - b.order);

const projectIds = existsSync(PROJECTS_DIR)
  ? readdirSync(PROJECTS_DIR).filter((name) => existsSync(join(PROJECTS_DIR, name, 'index.md')))
  : [];

// From the content, so real services and projects are covered as soon as they replace the samples.
export const ROUTES: string[] = [
  ...REQUIRED_ROUTES.filter((route: string) => !route.startsWith('/services/')),
  ...services.map(({ id }) => `/services/${id}/`),
  '/services/wall-tiling/',
  '/services/custom-tile-layouts/',
  '/services/premium-tile-finishing/',
  ...projectIds.map((id) => `/projects/${id}/`),
  '/404.html',
];

type AxeNode = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]['nodes'][number];

function oneLine(text = '') {
  return text.replace(/\s*\n\s*/g, ' ').trim();
}

function contrastOf(node: AxeNode) {
  const data = node.any.find((check) => check.data?.contrastRatio)?.data;
  if (!data) return oneLine(node.failureSummary);
  return `${data.fgColor} on ${data.bgColor} is ${data.contrastRatio}:1, needs ${data.expectedContrastRatio}`;
}

export async function axeProblems(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations.map(({ id, help, helpUrl, nodes }) => {
    if (id === 'color-contrast') {
      const elements = nodes.map((node) => `${node.target}: ${contrastOf(node)}`);
      return `color-contrast: text is too hard to read on its background. Change the colours in src/styles/tokens.css until each one passes. ${elements.join(' | ')}`;
    }
    const elements = nodes.map((node) => `${node.target}: ${oneLine(node.failureSummary)}`);
    return `${id}: ${help}. How to fix it: ${helpUrl} ${elements.join(' | ')}`;
  });
}

// Stands in for a browser's text size setting: rem sizes grow, while px sizes and screen width stay put.
export async function setTextSize(page: Page, percent: number) {
  await page.addStyleTag({ content: `html { font-size: ${percent}%; }` });
}

// scrollWidth alone misses anything inside overflow: clip, like the buttons in CtaBand, so this also finds text and controls cut off by the screen edge.
export async function sidewaysProblems(page: Page) {
  return page.evaluate((subpixel) => {
    const { scrollWidth, clientWidth } = document.documentElement;
    const cutOff = [...document.querySelectorAll('a, button, summary, input, select, textarea, label, h1, h2, h3, p, li, dt, dd')]
      .filter((element) => element.checkVisibility())
      .filter((element) => {
        const { left, right } = element.getBoundingClientRect();
        return right > clientWidth + subpixel || left < -subpixel;
      })
      .map((element) => `<${element.tagName.toLowerCase()}> "${element.textContent?.trim().slice(0, 30)}"`);
    return { extraWidth: Math.max(0, scrollWidth - clientWidth), cutOff };
  }, SUBPIXEL);
}

// Finds each match of `pattern` in the text of `selector` that the browser broke across two lines.
export async function splitAcrossLines(page: Page, selector: string, pattern: RegExp) {
  return page.evaluate(({ selector, source }) => {
    const split: string[] = [];
    for (const element of document.querySelectorAll(selector)) {
      if (!element.checkVisibility()) continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (const match of (node.textContent ?? '').matchAll(new RegExp(source, 'g'))) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const lines = new Set([...range.getClientRects()].map(({ top }) => Math.round(top)));
          if (lines.size > 1) split.push(match[0]);
        }
      }
    }
    return split;
  }, { selector, source: pattern.source });
}
