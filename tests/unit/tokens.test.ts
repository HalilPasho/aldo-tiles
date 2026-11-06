import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKENS_FILE = join('src', 'styles', 'tokens.css');
const GLOBAL_CSS = join('src', 'styles', 'global.css');
const SCANNED_FOLDERS = [join('src', 'components'), join('src', 'layouts'), join('src', 'pages')];
const CODE_FILE = /\.(astro|css|js|mjs|ts)$/;

const HEX_COLOUR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;
const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab)\(/gi;
const QUOTED_NAME = `'[^']*'|"[^"]*"`;
const PLAIN_TEXT = '[^;}"\'`,\\n]';
const FONT_NAME = `(?:(?:${QUOTED_NAME})${PLAIN_TEXT}*|${PLAIN_TEXT}+)`;
const FONT_VALUE = `${FONT_NAME}(?:\\s*,\\s*${FONT_NAME})*`;
const FONT_FAMILY = new RegExp(`font-family\\s*:\\s*(${FONT_VALUE})`, 'gi');
const FONT_SHORTHAND = new RegExp(`(?<![\\w-])font\\s*:\\s*(${FONT_VALUE})`, 'gi');
const KEYWORD_OR_TOKEN = String.raw`(?:inherit|initial|unset|revert|var\(--[\w-]+\))(?:\s*!important)?`;
const ALLOWED_FONT_VALUE = new RegExp(`^${KEYWORD_OR_TOKEN}$`);
const ALLOWED_SHORTHAND_VALUE = new RegExp(`^${KEYWORD_OR_TOKEN}$|^[^,'"]*\\s${KEYWORD_OR_TOKEN}$`);

// CSS named colours, without transparent and currentColor, which hard-code nothing.
const NAMED_COLOURS = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown
burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue
darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite
forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory
khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen
lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive
olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke
yellow yellowgreen`.split(/\s+/));
const COLOUR_PROPERTY = /^(?:--[\w-]+|[\w-]*color|background(?:-[\w-]+)?|border(?:-[\w-]+)?|outline|fill|stroke|box-shadow|text-shadow|text-decoration|column-rule|text-emphasis|filter)$/i;
const DECLARATION = /(?<![\w-])(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]*)([;{}]?)/gi;
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTRIBUTE = /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\})/gi;
const COLOUR_ATTRIBUTE = /\b(fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function isLinkOrReference(before: string) {
  return /(?:href\s*=\s*[{"'`]*|url\(\s*["']?)$/i.test(before);
}

function isCssSelector(after: string) {
  return after.replace(/\$\{[^}]*\}/g, '').match(/[{;}"'`]/)?.[0] === '{';
}

function lineAround(source: string, index: number) {
  const start = source.lastIndexOf('\n', index) + 1;
  const end = source.indexOf('\n', index);
  return source.slice(start, end === -1 ? undefined : end).trim();
}

function fontProblems(source: string, pattern: RegExp, allowed: RegExp) {
  return [...source.matchAll(pattern)]
    .filter(({ 1: value }) => !allowed.test(value.trim()))
    .map(({ 0: declaration }) => `font in "${declaration.trim()}"`);
}

// Only real CSS is read, so a word like "white" in page text or a comment is never taken for a colour.
function cssIn(source: string, kind: 'css' | 'markup') {
  if (kind === 'css') return [source];
  return [
    ...[...source.matchAll(STYLE_BLOCK)].map((match) => match[1]),
    ...[...source.matchAll(STYLE_ATTRIBUTE)].map((match) => match[1] ?? match[2] ?? match[3]),
    ...[...source.matchAll(COLOUR_ATTRIBUTE)].map((match) => `${match[1]}: ${match[2] ?? match[3]};`),
  ];
}

function namedColours(source: string, kind: 'css' | 'markup') {
  return cssIn(source, kind).flatMap((css) =>
    [...css.replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(DECLARATION)]
      .filter(({ 1: property, 3: end }) => end !== '{' && COLOUR_PROPERTY.test(property))
      .flatMap(({ 1: property, 2: value }) => {
        const words = value
          .replace(/"[^"]*"|'[^']*'|url\([^)]*\)|--[\w-]+/gi, ' ')
          .match(/(?<![\w-])[a-z]+(?![\w-])/gi) ?? [];
        return words
          .filter((word) => NAMED_COLOURS.has(word.toLowerCase()))
          .map((word) => `colour ${word} in "${property}: ${value.trim()}"`);
      }),
  );
}

function findHardCodedStyles(source: string, kind: 'css' | 'markup' = 'css'): string[] {
  const hexColours = [...source.matchAll(HEX_COLOUR)]
    .filter(({ 0: match, index }) => {
      const before = source.slice(0, index);
      const after = source.slice(index + match.length);
      return !isLinkOrReference(before) && !isCssSelector(after);
    })
    .map(({ 0: match, index }) => `colour ${match} in "${lineAround(source, index)}"`);
  const colourFunctions = [...source.matchAll(COLOUR_FUNCTION)].map(
    ({ 0: match, index }) => `colour ${match} in "${lineAround(source, index)}"`,
  );
  return [
    ...hexColours,
    ...colourFunctions,
    ...namedColours(source, kind),
    ...fontProblems(source, FONT_FAMILY, ALLOWED_FONT_VALUE),
    ...fontProblems(source, FONT_SHORTHAND, ALLOWED_SHORTHAND_VALUE),
  ];
}

function filesIn(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return CODE_FILE.test(name) ? [path] : [];
  });
}

describe('the design token check itself', () => {
  it.each([
    ['color: #091e2b;'],
    ['background:#fff}'],
    ['<path fill="#b6812a" />'],
    ["const gold = '#b6812a';"],
    ['border-color: rgb(9, 30, 43);'],
    ['box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);'],
    ['font-family: Georgia, serif;'],
    ["font-family: 'Inter';"],
    ['font: 400 16px/1.5 Arial;'],
    ["font-family:'Inter';"],
    ['font-family: var(--font-body), Georgia, serif;'],
    ['font-family: var(--font-body, Georgia);'],
    ['font: 500 1rem/1.2 var(--font-body), Georgia;'],
    ['color: #123456 ${x}'],
    ['`color: #123456 ${x};`'],
  ])('catches %s', (source) => {
    expect(findHardCodedStyles(source)).not.toEqual([]);
  });

  it.each([
    ["font-family: 'Inter';", "font-family: 'Inter'"],
    ["font-family:'Inter';", "font-family:'Inter'"],
    ['font-family: var(--font-body), Georgia, serif;', 'font-family: var(--font-body), Georgia, serif'],
    ['font: 400 16px/1.5 Arial;', 'font: 400 16px/1.5 Arial'],
    ['color: #123456;', 'color: #123456;'],
  ])('names the whole declaration for %s', (source, declaration) => {
    expect(findHardCodedStyles(source).join()).toContain(declaration);
  });

  it.each([
    ['<a href="#main">Skip</a>'],
    ['<a href="#add">Add</a>'],
    ['<a href={`#face`}>Face</a>'],
    ['fill: url(#bed);'],
    ['#cafe { color: var(--color-ink); }'],
    ['color: var(--color-ink);'],
    ['font-family: var(--font-display);'],
    ['font-family: inherit;'],
    ['font: inherit;'],
    ['font: 500 1rem/1.2 var(--font-body);'],
    ['font-size: 1rem;'],
    ['<p style="font-family: var(--font-body)" class="x">'],
    ['font-family: var(--font-display) !important;'],
    ['#cafe ${x} { color: var(--color-ink); }'],
  ])('allows %s', (source) => {
    expect(findHardCodedStyles(source)).toEqual([]);
  });

  it.each([
    ['color: white;', 'css'],
    ['.a{background:Navy}', 'css'],
    ['border: 1px solid gold;', 'css'],
    ['outline-color: rebeccapurple;', 'css'],
    ['box-shadow: 0 0 0 2px black;', 'css'],
    ['--panel-edge: white;', 'css'],
    ['color: var(--color-ink, white);', 'css'],
    ['<style>\n  .a {\n    color: white;\n  }\n</style>', 'markup'],
    ['<p style="color: white">Hi</p>', 'markup'],
    ['<p style={`background: tan`}>Hi</p>', 'markup'],
    ['<path fill="white" />', 'markup'],
    ['<rect stroke="Black" />', 'markup'],
  ] as const)('catches the named colour in %s', (source, kind) => {
    expect(findHardCodedStyles(source, kind)).toEqual([expect.stringMatching(/^colour \w+ in "/)]);
  });

  it.each([
    ['color: currentColor;', 'css'],
    ['fill: currentcolor;', 'css'],
    ['background: transparent;', 'css'],
    ['color: inherit;', 'css'],
    ['border-color: initial;', 'css'],
    ['color: var(--color-white);', 'css'],
    ['background: var(--tile-gold-tone);', 'css'],
    ['--white-tile: var(--color-ink);', 'css'],
    ['animation: gold-glint 1s;', 'css'],
    ['/* white text on navy: color: white */ color: var(--color-on-ink);', 'css'],
    ['@media (forced-colors: active) { .a { outline-color: CanvasText; } }', 'css'],
    ['content: "red";', 'css'],
    ['<p>Color: white grout lines on a navy floor.</p>', 'markup'],
    ['<p>Background: red brick, fill: tan stone.</p>', 'markup'],
    ['<path fill="currentColor" />', 'markup'],
    ['<svg><title>White tile</title></svg>', 'markup'],
    ['<!-- color: white --><p class="white">Hi</p>', 'markup'],
    ['<style>.a { color: var(--color-ink); }</style><p>Fill the gold tile.</p>', 'markup'],
  ] as const)('allows %s', (source, kind) => {
    expect(findHardCodedStyles(source, kind)).toEqual([]);
  });
});

describe('design tokens', () => {
  it('components use tokens, not hard-coded colours or fonts', () => {
    expect(existsSync(GLOBAL_CSS), `${GLOBAL_CSS} should exist`).toBe(true);
    const files = [...SCANNED_FOLDERS.flatMap(filesIn), GLOBAL_CSS];

    const problems = files.flatMap((file) =>
      findHardCodedStyles(readFileSync(file, 'utf8'), file.endsWith('.css') ? 'css' : 'markup').map((problem) => `${file}: ${problem}`),
    );

    expect(
      problems,
      `Move these values into ${TOKENS_FILE} as tokens, and use var(--token-name) in the file listed`,
    ).toEqual([]);
  });

  it('changing main colour needs only tokens.css', () => {
    expect(existsSync(TOKENS_FILE), `${TOKENS_FILE} should exist`).toBe(true);
    const definesAccent = /--color-accent\s*:/;
    const definedIn = filesIn('src').filter((file) => definesAccent.test(readFileSync(file, 'utf8')));

    expect(definedIn, `--color-accent should be set in ${TOKENS_FILE} and nowhere else`).toEqual([TOKENS_FILE]);
  });
});
