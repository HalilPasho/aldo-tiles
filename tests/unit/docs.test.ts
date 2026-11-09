import { existsSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';

const AGENTS = 'AGENTS.md';
const START_HERE = 'START-HERE.md';
const OTHER_GUIDES = ['README.md', 'docs/owner-setup.md', 'docs/launch-checklist.md'];
const PROTECTED_FILES = [
  'src/lib/seo.ts',
  'src/components/seo/Seo.astro',
  'src/components/ContactForm.astro',
  'src/components/PreviewBanner.astro',
  'src/layouts/BaseLayout.astro',
];
const PROMPTS = [
  'Change the main colours to warmer gold and cream.',
  "Show me two different ideas for the top of the homepage. Don't save either until I choose.",
  "Make the site look like this screenshot, but keep Aldo's logo.",
  'Undo my last change.',
  'Add this new job: [photos], [city], [type of tile], [short description].',
  'Replace the sample phone number with [number].',
  'Save my work and give me a preview link.',
  'A check failed. Explain it simply, fix it, and tell me what changed.',
];

// Paths the guides may name that a correct project doesn't always have, with everything inside them.
const MAY_BE_MISSING = [
  '_old-drafts/', // git-ignored, so a fresh copy never has it
  '.superpowers/', // the builder's git-ignored scratch folder, deleted after the build
  'dist/', // made by the build, so absent before it
  'src/content/reviews/', // git keeps no empty folders, so it goes when the last review does
];
const FILE_EXTENSION = /\.(astro|css|html|jpe?g|json|md|mjs|png|svg|toml|ts|txt|ya?ml|webp)$/i;
const packageScripts = Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).scripts);

function read(file: string) {
  return readFileSync(file, 'utf8');
}

// A backtick span is a path when it has a slash or a file extension. Spans with spaces are commands,
// with = or quotes are code, a leading slash is a page address, and a leading @ is a package name.
function isPath(span: string) {
  if (/\s|:\/\/|^\/|^@|[="']/.test(span)) return false;
  return span.includes('/') || FILE_EXTENSION.test(span);
}

// "src/content/projects/<slug>/index.md" can only be checked up to the folder before the placeholder.
function knownPart(path: string) {
  const placeholder = path.search(/[<*[]/);
  return placeholder === -1 ? path : path.slice(0, path.lastIndexOf('/', placeholder) + 1);
}

function missingNames(markdown: string, docDir = '.') {
  const spans = [...markdown.matchAll(/`([^`\n]+)`/g)].map((match) => match[1].trim()).filter(isPath);
  const links = [...markdown.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => target && !/^[a-z]+:/i.test(target))
    .map((target) => posix.join(docDir, target));
  const missingPaths = [...spans, ...links]
    .map(knownPart)
    .filter((path) => path && !MAY_BE_MISSING.some((folder) => path.startsWith(folder)) && !existsSync(path))
    .map((path) => `file or folder ${path}`);

  const scripts = [
    ...[...markdown.matchAll(/\bnpm run ([\w:-]+)/g)].map((match) => match[1]),
    ...(/\bnpm test\b/.test(markdown) ? ['test'] : []),
  ];
  const missingScripts = scripts.filter((name) => !packageScripts.includes(name)).map((name) => `npm script ${name}`);
  return [...new Set([...missingPaths, ...missingScripts])];
}

const DATA_FILES: Record<string, unknown> = Object.fromEntries(
  ['src/data/copy.json', 'src/data/business.json', 'src/data/site-settings.json'].map((file) => [file, JSON.parse(read(file))]),
);
const COPY_FILE = 'src/data/copy.json';

function hasKey(data: unknown, keyPath: string) {
  let value = data;
  for (const key of keyPath.split('.')) {
    if (value === null || typeof value !== 'object' || !(key in value)) return false;
    value = (value as Record<string, unknown>)[key];
  }
  return true;
}

// Keys look like `launchReady` or `home.hero.imageAlt`. A dotted key must be in copy.json, or in a data file
// named on the same line. A one-word camelCase key is checked when its line names a data file.
function missingDataKeys(markdown: string) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const filesOnLine = Object.keys(DATA_FILES).filter((file) => line.includes(`\`${file}\``));
    return [...line.matchAll(/`([^`\n]+)`/g)]
      .map((match) => match[1])
      .filter((span) => /^[a-z]\w*(?:\.\w+)*$/.test(span) && !isPath(span) && (span.includes('.') || /[A-Z]/.test(span)))
      .filter((span) => {
        const files = span.includes('.') ? [...new Set([...filesOnLine, COPY_FILE])] : filesOnLine;
        return files.length > 0 && !files.some((file) => hasKey(DATA_FILES[file], span));
      })
      .map((span) => `key ${span}`);
  });
}

const JARGON = [
  { term: 'repository', pattern: /\brepositor(?:y|ies)\b/gi },
  { term: 'repo', pattern: /\brepos?\b/gi },
  { term: 'commit', pattern: /\bcommit(?:s|ted|ting)?\b/gi },
  { term: 'branch', pattern: /\bbranch(?:es)?\b/gi },
  { term: 'pull request', pattern: /\bpull requests?\b/gi },
  { term: 'merge', pattern: /\bmerg(?:e|es|ed|ing)\b/gi },
  { term: 'push', pattern: /\bpush(?:es|ed|ing)?\b/gi },
  { term: 'deploy', pattern: /\bdeploy(?:s|ed|ing|ment)?\b/gi },
  { term: 'clone', pattern: /\bclon(?:e|es|ed|ing)\b/gi },
  { term: 'terminal', pattern: /\bterminal\b/gi },
  { term: 'localhost', pattern: /\blocalhost\b/gi },
  { term: 'npm', pattern: /\bnpm\b/gi },
  { term: 'WSL', pattern: /\bWSL\b/g },
  { term: 'sandbox', pattern: /\bsandbox\b/gi },
  { term: 'JSON', pattern: /\bJSON\b/g },
];
const GLOSSARY_HEADING = /^## [^\n]*(?:glossary|words you may see)[^\n]*$/im;
// The rest of the word (such as "**" or ":4321/"), then a bracket holding at least two words.
const EXPLAINED_BESIDE = /^[^\s(]*\s?\([^)]*\S\s+\S[^)]*\)/;

function splitGlossary(markdown: string) {
  const heading = markdown.match(GLOSSARY_HEADING);
  if (heading?.index === undefined) return { body: markdown, glossary: '' };
  const next = markdown.indexOf('\n## ', heading.index + 1);
  const end = next === -1 ? markdown.length : next;
  return { body: markdown.slice(0, heading.index) + markdown.slice(end), glossary: markdown.slice(heading.index, end) };
}

// A jargon word is explained when it sits in the glossary, or a plain explanation in brackets follows it.
function unexplainedJargon(markdown: string) {
  const { body } = splitGlossary(markdown);
  return body.split(/\r?\n/).flatMap((line) =>
    JARGON.flatMap(({ term, pattern }) =>
      [...line.matchAll(pattern)]
        .filter((match) => !EXPLAINED_BESIDE.test(line.slice(match.index + match[0].length)))
        .map(() => `"${term}" in: ${line.trim()}`),
    ),
  );
}

function jargonMissingFromGlossary(markdown: string) {
  const { body, glossary } = splitGlossary(markdown);
  return JARGON.filter(({ pattern }) => new RegExp(pattern).test(body) && !new RegExp(pattern).test(glossary)).map(
    ({ term }) => term,
  );
}

describe('the guides exist', () => {
  it.each([AGENTS, START_HERE, ...OTHER_GUIDES])('%s exists', (file) => {
    expect(existsSync(file), `${file} is missing`).toBe(true);
  });
});

describe('AGENTS.md', () => {
  it('every file and script named in AGENTS.md exists', () => {
    expect(missingNames(read(AGENTS)), 'AGENTS.md names things that do not exist').toEqual([]);
  });

  it('AGENTS.md names every protected file', () => {
    const text = read(AGENTS);
    for (const file of PROTECTED_FILES) expect(text, `AGENTS.md should name ${file}`).toContain(`\`${file}\``);
  });

  it('is under 150 lines, short enough for Codex to hold in mind', () => {
    expect(read(AGENTS).trimEnd().split(/\r?\n/).length).toBeLessThan(150);
  });
});

describe('the other guides', () => {
  it.each([START_HERE, ...OTHER_GUIDES])('every file and script named in %s exists', (file) => {
    expect(missingNames(read(file), posix.dirname(file)), `${file} names things that do not exist`).toEqual([]);
  });

  it.each([AGENTS, START_HERE, ...OTHER_GUIDES])('every data key named in %s exists', (file) => {
    expect(missingDataKeys(read(file)), `${file} names keys that are not in the data files`).toEqual([]);
  });

  it('README.md says all rights are reserved', () => {
    expect(read('README.md')).toContain('All rights reserved');
  });
});

describe('START-HERE.md', () => {
  it('has every ready-to-paste prompt, word for word', () => {
    const text = read(START_HERE);
    for (const prompt of PROMPTS) expect(text, `missing prompt: ${prompt}`).toContain(prompt);
  });

  it('START-HERE has no unexplained jargon', () => {
    const text = read(START_HERE);
    expect(unexplainedJargon(text), 'explain these in brackets beside the word, or reword').toEqual([]);
    expect(jargonMissingFromGlossary(text), 'add these to the glossary').toEqual([]);
  });
});

describe('the name check itself', () => {
  it('reports a fake path and a fake npm script', () => {
    const text = 'Edit `src/fake/nope.ts`, then run `npm run nope` and [read this](docs/nothing-here.md).';
    expect(missingNames(text)).toEqual(['file or folder src/fake/nope.ts', 'file or folder docs/nothing-here.md', 'npm script nope']);
  });

  it('reports a bare file name, because guides name files from the project root', () => {
    expect(missingNames('Change `tokens.css`.')).toEqual(['file or folder tokens.css']);
  });

  it('checks a placeholder path up to the placeholder', () => {
    expect(missingNames('Add `src/content/projects/<slug>/index.md`.')).toEqual([]);
    expect(missingNames('Add `src/nothing/<slug>/index.md`.')).toEqual(['file or folder src/nothing/']);
  });

  it('accepts real paths and scripts, and ignores commands, page addresses, links out and packages', () => {
    const text = [
      '`src/data/business.json`, `npm run check`, `npm test`, `npm run launch:check`.',
      '`git switch -c warmer-colours`, `/services/floor-tile-installation/`, `https://github.com/a/b`, `@lhci/cli`.',
      '[Netlify](https://www.netlify.com/), [the top](#top), `launchReady`, `_old-drafts/`, `.superpowers/sdd/.gitignore`, `action="/thank-you/"`.',
    ].join('\n');
    expect(missingNames(text)).toEqual([]);
  });

  it('resolves a link from the folder of the guide that holds it', () => {
    expect(missingNames('[Back](../package.json)', 'docs')).toEqual([]);
    expect(missingNames('[Back](package.json)', 'docs')).toEqual(['file or folder docs/package.json']);
  });
});

describe('the data key check itself', () => {
  it('finds real keys in copy.json and business.json', () => {
    const text = [
      'Its description is `home.hero.imageAlt` in `src/data/copy.json`, and see `about.story`.',
      'Set `launchReady` to `true` in `src/data/business.json`, and `siteUrl` too.',
    ].join('\n');
    expect(missingDataKeys(text)).toEqual([]);
  });

  it('reports a key that is not there', () => {
    expect(missingDataKeys('Change `home.hero.photoAlt`.')).toEqual(['key home.hero.photoAlt']);
    expect(missingDataKeys('Turn on `launchReddy` in `src/data/business.json`.')).toEqual(['key launchReddy']);
  });

  it('leaves file names, plain words and camelCase names away from a data file alone', () => {
    expect(missingDataKeys('Edit `astro.config.mjs` and set `sample` to `false`. Keep `metaDescription` short.')).toEqual([]);
  });
});

describe('the jargon check itself', () => {
  const glossary = '\n## Words you may see\n\n- **Branch**: a separate copy of your work.\n';

  it('flags a jargon word with no explanation', () => {
    expect(unexplainedJargon(`Codex made a branch for you.${glossary}`)).toEqual(['"branch" in: Codex made a branch for you.']);
  });

  it('accepts a plain explanation in brackets beside the word', () => {
    expect(unexplainedJargon(`Codex made a branch (a separate copy of your work) for you.${glossary}`)).toEqual([]);
    expect(unexplainedJargon('Open **localhost**:4321 (an address only your computer can open).')).toEqual([]);
  });

  it('does not count a one-word bracket as an explanation', () => {
    expect(unexplainedJargon('Open a pull request (PR).')).toEqual(['"pull request" in: Open a pull request (PR).']);
  });

  it('allows any jargon inside the glossary', () => {
    expect(unexplainedJargon(`# Guide${glossary}- **Commit**: a saved step, kept with a note.\n`)).toEqual([]);
  });

  it('catches a jargon word used inside an explanation', () => {
    expect(unexplainedJargon('Make a branch (a copy you can merge later).')).toEqual([
      '"merge" in: Make a branch (a copy you can merge later).',
    ]);
  });

  it('catches the word in any form and case', () => {
    expect(unexplainedJargon('Branches are merged.')).toHaveLength(2);
  });

  it('requires a glossary entry for each jargon word used', () => {
    expect(jargonMissingFromGlossary(`Codex made a branch (a separate copy of your work).${glossary}`)).toEqual([]);
    expect(jargonMissingFromGlossary(`Codex made a commit (a saved step of your work).${glossary}`)).toEqual(['commit']);
  });
});
