import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CALL_BAR_FILE,
  callBarCases,
  desktopCases,
  FULL_MENU_FILES,
  readCallBarSwitch,
  readFullMenuSwitch,
  remAt,
  type TextCase,
} from '../browser/breakpoints';

const CALL_BAR_RULE = '@container page (max-width: 16.59rem) {';
const FULL_MENU_RULE = '@container page (min-width: 77.5rem) {';

function reader(files: Record<string, string>) {
  return (file: string) => {
    if (!(file in files)) throw new Error(`unexpected read of ${file}`);
    return files[file];
  };
}

function fullMenuFiles(...rules: string[]) {
  return reader(Object.fromEntries(FULL_MENU_FILES.map((file, index) => [file, `a {}\n${rules[index] ?? rules[0]}\n  b {}\n}`])));
}

function key({ width, percent }: TextCase) {
  return `${width}@${percent}`;
}

describe('reading the switch widths from the CSS', () => {
  it('reads the real numbers', () => {
    expect(readCallBarSwitch()).toBeGreaterThan(0);
    expect(readFileSync(CALL_BAR_FILE, 'utf8')).toContain(`(max-width: ${readCallBarSwitch()}rem)`);
    expect(readFullMenuSwitch()).toBeGreaterThan(0);
  });

  it('reads the number from the rule, not from the rest of the file', () => {
    const read = reader({ [CALL_BAR_FILE]: `/* 15rem */\n@media (max-width: 20rem) {}\n@container page (max-width: 17.25rem) {}` });
    expect(readCallBarSwitch(read)).toBe(17.25);
    expect(readFullMenuSwitch(fullMenuFiles('@container page (min-width: 80rem) {'))).toBe(80);
  });

  it.each([
    ['is missing', 'nothing here', /found 0 rules like "@container page \(max-width: 16\.59rem\)".*MobileCallBar\.astro/],
    ['is there twice', `${CALL_BAR_RULE}}\n${CALL_BAR_RULE}}`, /found 2 rules/],
    ['is not in rem', '@container page (max-width: 265px) {}', /"265px".*isn't a plain rem number/],
    ['is a calculation', '@container page (max-width: calc(16rem + 1px)) {}', /isn't a plain rem number/],
  ])('stops with a plain message when the call bar rule %s', (_name, source, message) => {
    expect(() => readCallBarSwitch(reader({ [CALL_BAR_FILE]: source }))).toThrow(message);
  });

  it('stops with a plain message when one of the full menu files lost its rule', () => {
    const files = reader({ ...Object.fromEntries(FULL_MENU_FILES.map((file) => [file, FULL_MENU_RULE])), [FULL_MENU_FILES[1]]: '' });
    expect(() => readFullMenuSwitch(files)).toThrow(/found 0 rules.*src\/styles\/global\.css/);
  });

  it('stops when the three full menu numbers differ, because they must be raised together', () => {
    const read = fullMenuFiles(FULL_MENU_RULE, FULL_MENU_RULE, '@container page (min-width: 78rem) {');
    expect(() => readFullMenuSwitch(read)).toThrow(/77\.5rem in src\/components\/Header\.astro.*78rem in src\/pages\/services.*Raise all three together/);
  });
});

describe('call bar cases', () => {
  const FIXED_STICKY = ['320@100', '390@100', '759@200'];
  const FIXED_IN_FLOW = ['320@200', '390@200'];
  const NEAR_WIDTHS = [320, 360, 375, 390, 412, 430];

  it.each([16.59, 16.84, 17.5, 15])('at a switch of %srem, keep the fixed cases and put one just either side at each width', (switchRem) => {
    const { sticky, inFlow } = callBarCases(switchRem);

    expect(sticky.map(key)).toEqual(expect.arrayContaining(FIXED_STICKY));
    expect(inFlow.map(key)).toEqual(expect.arrayContaining(FIXED_IN_FLOW));
    for (const textCase of sticky) expect(remAt(textCase), key(textCase)).toBeGreaterThan(switchRem);
    for (const textCase of inFlow) expect(remAt(textCase), key(textCase)).toBeLessThan(switchRem);
    for (const width of NEAR_WIDTHS) {
      const under = Math.max(...sticky.filter((textCase) => textCase.width === width && !FIXED_STICKY.includes(key(textCase))).map(({ percent }) => percent));
      const over = Math.min(...inFlow.filter((textCase) => textCase.width === width && !FIXED_IN_FLOW.includes(key(textCase))).map(({ percent }) => percent));
      expect(over - under, `at ${width}px`).toBeLessThanOrEqual(3);
    }
    expect(sticky).toHaveLength(FIXED_STICKY.length + NEAR_WIDTHS.length);
    expect(inFlow).toHaveLength(FIXED_IN_FLOW.length + NEAR_WIDTHS.length);
  });

  it('matches the cases measured by hand for 16.59rem', () => {
    const { sticky, inFlow } = callBarCases(16.59);
    expect(sticky.map(key)).toEqual(expect.arrayContaining(['320@120', '360@135', '375@140', '390@146', '412@154', '430@161']));
    expect(inFlow.map(key)).toEqual(expect.arrayContaining(['320@122']));
  });

  it('moves the cases when the number is raised', () => {
    expect(callBarCases(16.84).sticky.map(key)).toContain('320@118');
    expect(callBarCases(16.84).sticky.map(key)).not.toContain('320@120');
  });
});

describe('desktop cases', () => {
  it('match the cases measured by hand for 77.5rem', () => {
    expect(desktopCases(77.5)).toEqual({
      fullMenuFrom: 1240,
      oneRowWidths: [1024, 1239, 1240, 1280],
      headerCases: [
        { width: 1280, percent: 100, fullMenu: true },
        { width: 1100, percent: 87.5, fullMenu: true },
        { width: 1280, percent: 200, fullMenu: false },
      ],
    });
  });

  it('follow a raised number', () => {
    const { fullMenuFrom, oneRowWidths, headerCases } = desktopCases(80.25);
    expect(fullMenuFrom).toBe(1284);
    expect(oneRowWidths).toEqual([1024, 1283, 1284, 1280]);
    expect(headerCases).toEqual([
      { width: 1280, percent: 100, fullMenu: false },
      { width: 1140, percent: 87.5, fullMenu: true },
      { width: 1280, percent: 200, fullMenu: false },
    ]);
  });
});
