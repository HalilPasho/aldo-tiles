import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const steps = [
  { name: 'Code check', command: 'npx astro check' },
  { name: 'Unit tests', command: 'npx vitest run' },
  { name: 'Site build', command: 'npm run build' },
  { name: 'Site audit', command: 'node scripts/audit-site.mjs' },
];
if (existsSync(join(root, 'playwright.config.ts'))) {
  steps.push({ name: 'Browser tests', command: 'npx playwright test' });
}

for (const { name, command } of steps) {
  console.log(`\nRunning: ${name}`);
  const { status } = spawnSync(command, { cwd: root, shell: true, stdio: 'inherit' });
  if (status !== 0) {
    console.error(`\nStep failed: ${name}. Read the messages above, fix the cause, and run npm run check again.`);
    process.exit(1);
  }
}

console.log('\nAll checks passed.');
