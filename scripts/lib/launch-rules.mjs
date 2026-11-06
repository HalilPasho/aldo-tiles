import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative, sep } from 'node:path';

export const SAMPLE_FRONTMATTER = /^sample:\s*true\s*$/im;
export const SAMPLE_IMAGE = /^sample.*\.(avif|gif|jpe?g|png|svg|webp)$/i;
export const SAMPLE_PHOTO_WORDING = /\bsample\s+placeholder\b/i;

const SAMPLE_LITERALS = [
  // The digit lookahead lets a real number that merely contains these digits through.
  { label: 'Phone number', pattern: /555[-.\s]?0100(?!\d)/ },
  { label: 'Email address', pattern: /@example\.com\b/i },
  { label: 'Website address', pattern: /(?<!@)\bexample\.com\b|\.example\b/i },
];

const FACT_LABELS = new Map([
  ['siteUrl', 'Website address'],
  ['phone', 'Phone number'],
  ['email', 'Email address'],
  ['areasServed', 'Service area list'],
  ['yearsExperience', 'Years of experience'],
  ['credentials', 'Credentials list'],
]);

function sampleMessage(label, file) {
  return `${label} is still a sample. Replace it in ${file}.`;
}

function sampleFlagPaths(value, path = []) {
  if (value === null || typeof value !== 'object') return [];
  const nested = Object.entries(value).flatMap(([key, child]) => sampleFlagPaths(child, [...path, key]));
  return value.sample === true ? [path, ...nested] : nested;
}

function labelForPath(path) {
  if (path.length === 0) return 'Content';
  return FACT_LABELS.get(path.at(-1)) ?? `Entry "${path.join(' > ')}"`;
}

function checkJson(text, file) {
  try {
    return sampleFlagPaths(JSON.parse(text)).map((path) => sampleMessage(labelForPath(path), file));
  } catch {
    return [`This file has a mistake and could not be checked. Fix ${file} and run the check again.`];
  }
}

function checkText(text, file) {
  const extension = extname(file).toLowerCase();
  return [
    ...(extension === '.md' && SAMPLE_FRONTMATTER.test(text) ? [sampleMessage('Content', file)] : []),
    ...(extension === '.json' ? checkJson(text, file) : []),
    ...SAMPLE_LITERALS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => sampleMessage(label, file)),
    ...(SAMPLE_PHOTO_WORDING.test(text) ? [`A photo description still says "Sample placeholder". Write a description of the real photo in ${file}.`] : []),
  ];
}

async function checkFile(path, file) {
  const messages = SAMPLE_IMAGE.test(basename(file))
    ? [`Image is still a sample. Replace ${file} with a real photo.`]
    : [];
  const bytes = await readFile(path);
  if (!bytes.includes(0)) {
    messages.push(...checkText(bytes.toString('utf8').replace(/^\uFEFF/, ''), file));
  }
  return new Set(messages);
}

async function listFiles(dir) {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function findLaunchProblems(rootDir) {
  const problems = [];
  for (const path of await listFiles(join(rootDir, 'src'))) {
    const file = relative(rootDir, path).split(sep).join('/');
    for (const message of await checkFile(path, file)) {
      problems.push({ file, message });
    }
  }
  return problems;
}

export async function isLaunchReady(rootDir) {
  let text;
  try {
    text = await readFile(join(rootDir, 'src', 'data', 'business.json'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  try {
    return Boolean(JSON.parse(text.replace(/^\uFEFF/, '')).launchReady);
  } catch {
    throw new Error('src/data/business.json has a mistake, so launchReady could not be read. Fix the file and try again.');
  }
}

export function formatProblems(problems) {
  return problems.map((problem, index) => `${index + 1}. ${problem.message}`).join('\n');
}
