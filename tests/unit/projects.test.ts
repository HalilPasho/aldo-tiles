import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PROJECTS_DIR = join('src', 'content', 'projects');
const SOURCE_FOLDERS = [join('src', 'pages'), join('src', 'components')];

function filesIn(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

describe('projects', () => {
  it('adding a project needs one folder only', () => {
    const folders = existsSync(PROJECTS_DIR)
      ? readdirSync(PROJECTS_DIR).filter((name) => existsSync(join(PROJECTS_DIR, name, 'index.md')))
      : [];
    const sources = SOURCE_FOLDERS.flatMap(filesIn);

    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      for (const folder of folders) {
        expect(text.includes(folder), `${file} names the project folder ${folder}. Read projects from the collection instead.`).toBe(false);
      }
    }
  });
});
