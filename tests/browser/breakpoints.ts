import { readFileSync } from 'node:fs';

// The call bar and the header switch layout at rem widths measured for the body font. The browser tests read those
// numbers from the CSS, so a font change moves only the CSS number and the test cases follow it.
export const CALL_BAR_FILE = 'src/components/MobileCallBar.astro';
export const FULL_MENU_FILES = ['src/components/Header.astro', 'src/styles/global.css', 'src/pages/services/[slug]/index.astro'];
const CALL_BAR_RULE = /@container\s+page\s*\(\s*max-width\s*:\s*([^)]*?)\s*\)/g;
const FULL_MENU_RULE = /@container\s+page\s*\(\s*min-width\s*:\s*([^)]*?)\s*\)/g;
const REM = /^(\d+(?:\.\d+)?)rem$/;

// At P% text, 1rem is 0.16 × P pixels.
const PX_PER_REM_PER_PERCENT = 0.16;
// A case sits at least this many percent of text size away from the switch, so rounding can't put it on the line.
const MARGIN = 0.5;
const PHONE_WIDTHS_NEAR_SWITCH = [320, 360, 375, 390, 412, 430];
const LAST_PHONE_WIDTH = 759;
const SMALL_TEXT = 87.5;

export interface TextCase {
  width: number;
  percent: number;
}

export function remAt({ width, percent }: TextCase) {
  return width / (PX_PER_REM_PER_PERCENT * percent);
}

export function readRem(file: string, source: string, rule: RegExp, example: string): number {
  const values = [...source.matchAll(rule)].map((match) => match[1]);
  const fix = `Keep exactly one rule written like "${example}" in ${file}, or update tests/browser/breakpoints.ts to find the new one.`;
  if (values.length !== 1) {
    throw new Error(`The layout tests read a switch width from ${file}, but found ${values.length} rules like "${example}" there. ${fix}`);
  }
  const rem = values[0].match(REM);
  if (!rem || !(Number(rem[1]) > 0)) {
    throw new Error(`The layout tests read the switch width "${values[0]}" in ${file}, but it isn't a plain rem number like 16.59rem. ${fix}`);
  }
  return Number(rem[1]);
}

export function readCallBarSwitch(read = (file: string) => readFileSync(file, 'utf8')) {
  return readRem(CALL_BAR_FILE, read(CALL_BAR_FILE), CALL_BAR_RULE, '@container page (max-width: 16.59rem)');
}

export function readFullMenuSwitch(read = (file: string) => readFileSync(file, 'utf8')) {
  const found = FULL_MENU_FILES.map((file) => ({
    file,
    rem: readRem(file, read(file), FULL_MENU_RULE, '@container page (min-width: 77.5rem)'),
  }));
  if (new Set(found.map(({ rem }) => rem)).size > 1) {
    const list = found.map(({ file, rem }) => `${rem}rem in ${file}`).join(', ');
    throw new Error(`The full menu's switch width must be the same in all three files, but it's ${list}. Raise all three together.`);
  }
  return found[0].rem;
}

function unique(cases: TextCase[]) {
  return [...new Map(cases.map((textCase) => [`${textCase.width}@${textCase.percent}`, textCase])).values()];
}

// The 100% and 200% cases are fixed. Each phone width also gets one case just under the text size where the bar
// stops sticking, and one just over it.
export function callBarCases(switchRem: number) {
  const sticky: TextCase[] = [{ width: 320, percent: 100 }, { width: 390, percent: 100 }, { width: LAST_PHONE_WIDTH, percent: 200 }];
  const inFlow: TextCase[] = [{ width: 320, percent: 200 }, { width: 390, percent: 200 }];
  for (const width of PHONE_WIDTHS_NEAR_SWITCH) {
    const atSwitch = width / (PX_PER_REM_PER_PERCENT * switchRem);
    sticky.push({ width, percent: Math.floor(atSwitch - MARGIN) });
    inFlow.push({ width, percent: Math.ceil(atSwitch + MARGIN) });
  }
  return { sticky: unique(sticky), inFlow: unique(inFlow) };
}

export function desktopCases(fullMenuRem: number) {
  const fullMenuFrom = Math.ceil(fullMenuRem * 16);
  // A narrower screen than 1280 that still gets the full menu, because its text is smaller.
  const smallTextWidth = Math.ceil((fullMenuRem * PX_PER_REM_PER_PERCENT * SMALL_TEXT) / 10) * 10 + 10;
  const headerCases = [
    { width: 1280, percent: 100 },
    { width: smallTextWidth, percent: SMALL_TEXT },
    { width: 1280, percent: 200 },
  ].map((textCase) => ({ ...textCase, fullMenu: remAt(textCase) >= fullMenuRem }));
  return {
    fullMenuFrom,
    oneRowWidths: [...new Set([1024, fullMenuFrom - 1, fullMenuFrom, 1280])],
    headerCases,
  };
}
