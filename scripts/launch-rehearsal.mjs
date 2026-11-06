import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { findLaunchedSiteProblems } from './lib/launch-rehearsal-rules.mjs';
import { findLaunchProblems, SAMPLE_FRONTMATTER, SAMPLE_IMAGE, SAMPLE_PHOTO_WORDING } from './lib/launch-rules.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const realModules = join(root, 'node_modules');

// 555-01xx numbers are reserved for fiction and .test can never be a real address. These only ever exist in the temp copy.
const LAUNCH_VALUES = {
  site: 'https://aldotile-rehearsal.ca',
  phoneDisplay: '(647) 555-0142',
  phoneE164: '+16475550142',
  email: 'rehearsal@aldotile-rehearsal.test',
};
const GUARD_MESSAGE = 'launchReady is on, but sample content remains:';
const READY_MESSAGE = 'Ready to launch.';
const KEEP_HINT = 'To look around in the copy, set KEEP_REHEARSAL=1 and run npm run launch:rehearsal again.';

const NOT_COPIED = new Set([
  'node_modules', 'dist', '.git', '_old-drafts',
  '.astro', '.lighthouseci', 'test-results', 'playwright-report', '.netlify', '.superpowers', '.claude',
]);
const STEP_COUNT = 6;
const STOP_WAIT_MS = 15_000;

class RehearsalProblem extends Error {
  constructor(what, todo) {
    super(what);
    this.todo = todo;
  }
}

function isCopied(topLevelName) {
  return !NOT_COPIED.has(topLevelName) && !topLevelName.startsWith('.env');
}

function duration(milliseconds) {
  const seconds = Math.round(milliseconds / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function posix(path) {
  return path.split(sep).join('/');
}

let activeChild;

function run(command, { cwd, env = process.env, capture = false }) {
  return new Promise((resolve, reject) => {
    if (stopping) {
      reject(new Error('The rehearsal is stopping.'));
      return;
    }
    const child = spawn(command, {
      cwd,
      env,
      shell: true,
      stdio: ['ignore', capture ? 'pipe' : 'inherit', capture ? 'pipe' : 'inherit'],
      // Its own process group, so stopping reaches npm's and Astro's children too. On Windows this option opens a new console instead.
      detached: process.platform !== 'win32',
    });
    activeChild = child;
    let output = '';
    child.stdout?.on('data', (chunk) => { output += chunk; });
    child.stderr?.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('close', (status) => {
      if (activeChild === child) activeChild = undefined;
      resolve({ status, output });
    });
  });
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
    return true;
  } catch {
    return false;
  }
}

async function stopActiveChild() {
  if (!activeChild) return;
  const { pid } = activeChild;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  // SIGINT, because Playwright only shuts down its preview server and browsers on that signal. A SIGTERM would leave them running.
  signalGroup(pid, 'SIGINT');
  const deadline = Date.now() + STOP_WAIT_MS;
  while (signalGroup(pid, 0) && Date.now() < deadline) await delay(100);
  signalGroup(pid, 'SIGKILL');
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function listFilesIn(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name)).sort();
}

async function hashProject() {
  const paths = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!isCopied(entry.name) && entry.name !== 'dist') continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) paths.push(...(await listFilesIn(path)));
    else if (entry.isFile()) paths.push(path);
  }
  return new Map(await Promise.all(paths.map(async (path) => [
    posix(relative(root, path)),
    createHash('sha256').update(await readFile(path)).digest('hex'),
  ])));
}

// node_modules is too big to hash on every run, and any write or delete changes a size, a time or the list of paths.
async function fingerprintModules() {
  const entries = await readdir(realModules, { recursive: true, withFileTypes: true });
  return new Map(await Promise.all(entries.map(async (entry) => {
    const path = join(entry.parentPath, entry.name);
    const { size, mtimeMs } = await lstat(path);
    return [posix(relative(realModules, path)), `${size}:${mtimeMs}`];
  })));
}

function differences(before, after) {
  const changed = [...before.keys()].filter((path) => before.get(path) !== after.get(path));
  const added = [...after.keys()].filter((path) => !before.has(path));
  return [...changed, ...added].sort();
}

// A single link to all of node_modules would send the caches Astro, Vite and Vitest keep in node_modules/.* into the real
// project, where the copy's launched content would overwrite the real content cache. So those caches stay in the copy.
async function linkModules(copyDir) {
  const modules = join(copyDir, 'node_modules');
  await mkdir(modules);
  for (const entry of await readdir(realModules, { withFileTypes: true })) {
    const isLinkable = !entry.isFile() && (entry.name === '.bin' || !entry.name.startsWith('.'));
    if (isLinkable) await symlink(join(realModules, entry.name), join(modules, entry.name), 'junction');
  }
}

async function fillCopy(copyDir) {
  await cp(root, copyDir, {
    recursive: true,
    verbatimSymlinks: true,
    filter: (source) => {
      const path = relative(root, source);
      return path === '' || isCopied(path.split(sep)[0]);
    },
  });
  await linkModules(copyDir);
}

async function removeCopy(copyDir) {
  const modules = join(copyDir, 'node_modules');
  const names = existsSync(modules) ? await readdir(modules) : [];
  for (const name of names) {
    const path = join(modules, name);
    if ((await lstat(path)).isSymbolicLink()) await unlink(path);
  }
  await rm(copyDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

function parseJson(text, file) {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new RehearsalProblem(`${file} has a mistake, so it could not be read.`, 'Fix that file in the real project, then run npm run launch:rehearsal again.');
  }
}

async function readBusiness(copyDir) {
  return parseJson(await readFile(join(copyDir, 'src', 'data', 'business.json'), 'utf8'), 'src/data/business.json');
}

async function writeBusiness(copyDir, business) {
  await writeFile(join(copyDir, 'src', 'data', 'business.json'), `${JSON.stringify(business, null, 2)}\n`);
}

async function confirmGuardBites(copyDir) {
  const business = await readBusiness(copyDir);
  business.launchReady = true;
  await writeBusiness(copyDir, business);
  // Once the real site has launched there are no samples left, so plant one and the guard still gets tested.
  if ((await findLaunchProblems(copyDir)).length === 0) {
    console.log('    No samples remain in this project, so one was planted in the copy to test the guard.');
    business.siteUrl.sample = true;
    await writeBusiness(copyDir, business);
  }

  const { status, output } = await run('npm run build', { cwd: copyDir, capture: true });
  const fixGuard = 'Check scripts/launch-guard.mjs and that the build script in package.json runs it before astro build.';
  if (status === 0) {
    throw new RehearsalProblem('The build was allowed even though launchReady is on and samples remain. Sample content could go live.', fixGuard);
  }
  if (!output.includes(GUARD_MESSAGE)) {
    throw new RehearsalProblem(`The build failed, but not with the launch guard's message. It said:\n${output}`, fixGuard);
  }
  if (existsSync(join(copyDir, 'dist'))) {
    throw new RehearsalProblem('The launch guard complained, but Astro still built the site.', fixGuard);
  }
}

function clearSampleFlags(value) {
  if (value === null || typeof value !== 'object') return;
  if (value.sample === true) value.sample = false;
  Object.values(value).forEach(clearSampleFlags);
}

async function swapToLaunchValues(copyDir) {
  const src = join(copyDir, 'src');
  await rm(join(src, 'content', 'reviews'), { recursive: true, force: true });

  const renamed = new Map();
  for (const path of await listFilesIn(src)) {
    const name = basename(path);
    if (SAMPLE_IMAGE.test(name)) {
      const newName = name.replace(/^sample-?/i, 'rehearsal-');
      renamed.set(name, newName);
      await rename(path, join(dirname(path), newName));
    }
  }

  const sampleFrontmatter = new RegExp(SAMPLE_FRONTMATTER.source, `${SAMPLE_FRONTMATTER.flags}g`);
  const samplePhotoWording = new RegExp(SAMPLE_PHOTO_WORDING.source, 'gi');
  for (const path of await listFilesIn(src)) {
    const bytes = await readFile(path);
    if (bytes.includes(0)) continue;
    const before = bytes.toString('utf8');
    let text = before;
    for (const [name, newName] of renamed) text = text.replaceAll(name, newName);
    text = text.replace(samplePhotoWording, 'Rehearsal');
    if (path.endsWith('.md')) text = text.replace(sampleFrontmatter, 'sample: false');
    if (path.endsWith('.json')) {
      const data = parseJson(text, posix(relative(copyDir, path)));
      clearSampleFlags(data);
      text = `${JSON.stringify(data, null, 2)}\n`;
    }
    if (text !== before) await writeFile(path, text);
  }

  const business = await readBusiness(copyDir);
  business.launchReady = true;
  business.siteUrl.value = LAUNCH_VALUES.site;
  business.phone.display = LAUNCH_VALUES.phoneDisplay;
  business.phone.e164 = LAUNCH_VALUES.phoneE164;
  business.email.value = LAUNCH_VALUES.email;
  await writeBusiness(copyDir, business);
  return renamed.size;
}

async function confirmLaunchCheckPasses(copyDir) {
  const { status, output } = await run('npm run launch:check', { cwd: copyDir, capture: true });
  if (status !== 0 || !output.includes(READY_MESSAGE)) {
    throw new RehearsalProblem(
      `npm run launch:check did not pass after every sample was swapped. It said:\n${output}`,
      'If it names a sample value outside src/data/business.json, move that value into business.json. If it names a kind of sample this script does not swap, teach swapToLaunchValues in scripts/launch-rehearsal.mjs about it.',
    );
  }
}

async function runFullCheck(copyDir) {
  const port = await findFreePort();
  console.log(`    Browser tests use their own port, ${port}.`);
  // CI turns off Playwright's reuseExistingServer, so if the port is busy the tests stop instead of testing someone else's server.
  const env = { ...process.env, CI: '1', PLAYWRIGHT_PORT: String(port) };
  const { status } = await run('node scripts/check.mjs', { cwd: copyDir, env });
  if (status !== 0) {
    throw new RehearsalProblem(
      'The full check failed on the launched copy. The step that failed and why are printed above.',
      `Run npm run check on the real project first. If that passes, the cause only shows up once samples are gone. Fix it in the real project, not the copy. ${KEEP_HINT}`,
    );
  }
}

async function checkBuiltPages(copyDir) {
  const copy = parseJson(await readFile(join(copyDir, 'src', 'data', 'copy.json'), 'utf8'), 'src/data/copy.json');
  const { pages, problems } = await findLaunchedSiteProblems(join(copyDir, 'dist'), {
    banner: copy.site?.previewBanner,
    reviewsHeading: copy.home?.reviews?.heading,
  });
  if (problems.length > 0) {
    throw new RehearsalProblem(
      `The built pages are not ready for launch:\n${problems.map((problem, index) => `  ${index + 1}. ${problem}`).join('\n')}`,
      `Fix each one in the real project. ${KEEP_HINT}`,
    );
  }
  return pages;
}

function reportFailure(stepName, error) {
  console.error(`\nLaunch rehearsal FAILED at: ${stepName}`);
  console.error(`What happened: ${error.message}`);
  console.error(`What to do: ${error instanceof RehearsalProblem ? error.todo : 'Fix the cause named above, then run npm run launch:rehearsal again.'}`);
}

function reportChanged(label, paths) {
  const shown = paths.slice(0, 20).map((path) => `  ${path}`).join('\n');
  const more = paths.length > 20 ? `\n  and ${paths.length - 20} more` : '';
  console.error(`\nLaunch rehearsal FAILED: ${label} changed during the run, and the rehearsal must never touch it:\n${shown}${more}`);
  console.error('What to do: If you were editing files or running something else in this project at the same time, stop that and run npm run launch:rehearsal again. If not, the script is writing outside its temp copy: find out how before trusting it.');
}

const startedAt = Date.now();
let stepNumber = 0;
let currentStep = 'Starting';
let copyDir;
let failed = false;
let stopping = false;
let cleanUpDone;
let stepInFlight;

async function step(name, action) {
  if (stopping) return undefined;
  stepNumber += 1;
  currentStep = name;
  console.log(`\n[${stepNumber}/${STEP_COUNT}] ${name}`);
  const stepStartedAt = Date.now();
  stepInFlight = action();
  const result = await stepInFlight;
  console.log(`    Done in ${duration(Date.now() - stepStartedAt)}.`);
  return result;
}

async function removeOrKeepCopy() {
  if (!copyDir) return;
  const dir = copyDir;
  if (process.env.KEEP_REHEARSAL) {
    console.log(`\nKept the copy because KEEP_REHEARSAL is set: ${dir}\nIts node_modules holds links to the real packages. Delete the folder when you're done.`);
    return;
  }
  try {
    await removeCopy(dir);
  } catch (error) {
    failed = true;
    console.error(`\nCould not delete the temp copy: ${error.message}\nWhat to do: Close anything using it, then delete this folder by hand: ${dir}`);
  }
}

// Shared, so a signal during the normal clean-up waits for it instead of exiting halfway through.
function cleanUp() {
  cleanUpDone ??= removeOrKeepCopy();
  return cleanUpDone;
}

// Once the terminal is closed every write fails, and that error would otherwise end the script before it could clean up.
for (const stream of [process.stdout, process.stderr]) stream.on('error', () => {});

// Not process.once: Ctrl-C through npm arrives twice, from the terminal and from npm, and with no listener the second one would kill this script.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    console.error('\nLaunch rehearsal stopped. Ending what it was running and removing the temp copy.');
    await stopActiveChild();
    // The step may still be creating the copy, and it could make files again after they were deleted.
    await stepInFlight?.catch(() => {});
    await cleanUp();
    process.exit(1);
  });
}

console.log('Launch rehearsal: building a temp copy of the site as if it had launched. The real project is not touched. This takes a few minutes.');

let projectBefore;
let modulesBefore;
let swappedImages;
let pageCount;
try {
  await step('Copying the project', async () => {
    if (!existsSync(realModules)) {
      throw new RehearsalProblem('This project has no node_modules folder.', 'Run npm ci, then run npm run launch:rehearsal again.');
    }
    // The spaces are on purpose: every run proves the tools cope with a path that has them.
    copyDir = await realpath(await mkdtemp(join(tmpdir(), 'aldo tile rehearsal ')));
    projectBefore = await hashProject();
    modulesBefore = await fingerprintModules();
    console.log(`    Temp copy: ${copyDir}`);
    await fillCopy(copyDir);
  });
  await step('Confirming the launch guard stops a build with samples in it', () => confirmGuardBites(copyDir));
  await step('Swapping samples for launch values', async () => {
    swappedImages = await swapToLaunchValues(copyDir);
    console.log(`    Deleted all reviews, renamed ${swappedImages} sample image(s), rewrote sample photo descriptions, cleared every sample flag, set launchReady on.`);
  });
  await step('Confirming npm run launch:check passes', () => confirmLaunchCheckPasses(copyDir));
  await step('Running the full check on the launched copy: code check, unit tests, build, audit, browser tests', () => runFullCheck(copyDir));
  await step('Checking every built page', async () => {
    pageCount = await checkBuiltPages(copyDir);
  });
} catch (error) {
  failed = true;
  if (!stopping) reportFailure(currentStep, error);
}

// The signal handler finishes the job and exits. Carrying on here would delete the copy while its processes are still ending.
if (stopping) await new Promise(() => {});

await cleanUp();

if (projectBefore) {
  const changed = differences(projectBefore, await hashProject());
  if (changed.length > 0) {
    failed = true;
    reportChanged('the real project', changed);
  }
}
if (modulesBefore) {
  const changed = differences(modulesBefore, await fingerprintModules());
  if (changed.length > 0) {
    failed = true;
    reportChanged('the real node_modules', changed);
  }
}

const elapsed = duration(Date.now() - startedAt);
if (failed) {
  console.error(`\nLaunch rehearsal failed after ${elapsed}.`);
  process.exit(1);
}

console.log(`
Launch rehearsal passed in ${elapsed}.
  - The launch guard stopped a build with samples in it, before Astro started.
  - With samples swapped out and all reviews deleted, npm run launch:check said "${READY_MESSAGE}"
  - The full check passed: code check, unit tests, build, audit, browser tests.
  - All ${pageCount} built pages: no preview banner, right robots tag, no empty reviews heading on home.
  - Compared before and after, and unchanged: ${projectBefore.size} project files (everything copied, plus dist) by content, and ${modulesBefore.size} node_modules entries by path, size and time.
    Not compared: generated folders such as .astro and test-results.`);
