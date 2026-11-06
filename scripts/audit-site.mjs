import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSite, listRoutes } from './lib/audit-rules.mjs';
import { formatProblems } from './lib/launch-rules.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = process.argv[2] ? resolve(process.argv[2]) : join(root, 'dist');
const businessPath = join(root, 'src', 'data', 'business.json');
const copyPath = join(root, 'src', 'data', 'copy.json');

try {
  const problems = await auditSite(distDir, businessPath, copyPath);
  if (problems.length > 0) {
    console.log(`The site audit found ${problems.length} problem(s). Fix each one, then run npm run check again:`);
    console.log(formatProblems(problems));
    process.exitCode = 1;
  } else {
    console.log(`Site audit passed: ${(await listRoutes(distDir)).length} pages.`);
  }
} catch (error) {
  console.error(`The site audit could not finish: ${error.message}. Fix that, then run npm run check again.`);
  process.exitCode = 1;
}
