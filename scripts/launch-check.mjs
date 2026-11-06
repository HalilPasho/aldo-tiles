import { fileURLToPath } from 'node:url';
import { findLaunchProblems, formatProblems } from './lib/launch-rules.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const problems = await findLaunchProblems(root);

if (problems.length > 0) {
  console.log(formatProblems(problems));
  process.exitCode = 1;
} else {
  console.log('Ready to launch.');
}
