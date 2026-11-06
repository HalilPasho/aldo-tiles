import { fileURLToPath } from 'node:url';
import { findLaunchProblems, formatProblems, isLaunchReady } from './lib/launch-rules.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

try {
  if (await isLaunchReady(root)) {
    const problems = await findLaunchProblems(root);
    if (problems.length > 0) {
      console.error('launchReady is on, but sample content remains:');
      console.error(formatProblems(problems));
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
