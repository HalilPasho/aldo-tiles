import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findLaunchProblems, isLaunchReady } from '../../scripts/lib/launch-rules.mjs';

let root: string;

async function put(file: string, content: string | Buffer) {
  const path = join(root, file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function filesWithProblems() {
  return (await findLaunchProblems(root)).map((problem) => problem.file);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'launch rules '));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('findLaunchProblems', () => {
  it('finds sample true in markdown frontmatter', async () => {
    await put('src/content/services/floors.md', '---\ntitle: Floors\nsample: true\n---\nBody\n');
    expect(await filesWithProblems()).toEqual(['src/content/services/floors.md']);
  });

  it('finds sample true in a CRLF markdown file', async () => {
    await put('src/content/services/walls.md', '---\r\ntitle: Walls\r\nsample: true\r\n---\r\nBody\r\n');
    expect(await filesWithProblems()).toEqual(['src/content/services/walls.md']);
  });

  it.each(['True', 'TRUE'])('finds sample: %s, which YAML also reads as true', async (value) => {
    await put('src/content/services/floors.md', `---\ntitle: Floors\nsample: ${value}\n---\nBody\n`);
    expect(await filesWithProblems()).toEqual(['src/content/services/floors.md']);
  });

  it('finds sample true in a folder path containing a space', async () => {
    await put('src/content/my projects/index.md', '---\nsample: true\n---\n');
    expect(await filesWithProblems()).toEqual(['src/content/my projects/index.md']);
  });

  it('finds sample true in JSON', async () => {
    await put('src/data/facts.json', '{ "sample": true }');
    expect(await filesWithProblems()).toEqual(['src/data/facts.json']);
  });

  it('finds nested sample true in JSON', async () => {
    await put('src/data/facts.json', JSON.stringify({ gallery: [{ sample: false }, { deep: { sample: true } }] }));
    const problems = await findLaunchProblems(root);
    expect(problems).toHaveLength(1);
    expect(problems[0].file).toBe('src/data/facts.json');
    expect(problems[0].message).toContain('gallery > 1 > deep');
  });

  it('reads JSON saved with a byte order mark', async () => {
    await put('src/data/facts.json', '\uFEFF{ "phone": { "sample": true } }');
    expect((await findLaunchProblems(root)).map((problem) => problem.message)).toEqual([
      'Phone number is still a sample. Replace it in src/data/facts.json.',
    ]);
  });

  it.each([
    ['dashed phone', '(647) 555-0100'],
    ['spaced phone', '647 555 0100'],
    ['international phone', 'tel:+16475550100'],
    ['bare phone digits', '5550100'],
    ['email', 'hello@example.com'],
    ['website on example.com', 'https://www.example.com/'],
    ['.example address', 'https://aldotile.example'],
    ['uppercase address', 'HTTPS://ALDOTILE.EXAMPLE'],
  ])('finds sample phone, email and .example address: %s', async (_name, literal) => {
    await put('src/components/Footer.astro', `<footer>${literal}</footer>`);
    expect(await filesWithProblems()).toEqual(['src/components/Footer.astro']);
  });

  it('asks for a real description when placeholder wording is left behind', async () => {
    await put('src/content/projects/job/index.md', '---\nsample: false\nphotos:\n  - alt: "Sample placeholder image: grey floor"\n---\n');
    await put('src/data/words.json', '{ "imageAlt": "Sample placeholder image: pale marble" }');
    const problems = await findLaunchProblems(root);
    expect(problems.map((problem) => problem.file)).toEqual(['src/content/projects/job/index.md', 'src/data/words.json']);
    for (const { file, message } of problems) {
      expect(message).toContain(file);
      expect(message).toContain('Write a description of the real photo');
    }
  });

  it('finds placeholder wording in any case, and wrapped over two lines', async () => {
    await put('src/data/shouting.json', '{ "alt": "SAMPLE PLACEHOLDER photo" }');
    await put('src/content/services/wrapped.md', '---\nalt: >\n  Sample\n  placeholder image of a wall\n---\n');
    expect(await filesWithProblems()).toEqual(['src/content/services/wrapped.md', 'src/data/shouting.json']);
  });

  it('leaves real wording that only looks close alone', async () => {
    await put('src/content/services/floors.md', [
      '---',
      'alt: "Sample boards of porcelain laid out on a kitchen counter"',
      '---',
      'Bring a sample. We use a placeholder strip to test the layout, then order more samples placeholder-free.',
    ].join('\n'));
    await put('src/data/words.json', '{ "sampleLabel": "Sample review", "formHint": "A placeholder for your phone number" }');
    expect(await findLaunchProblems(root)).toEqual([]);
  });

  it('catches a sample value whose flag was cleared', async () => {
    await put(
      'src/data/business.json',
      JSON.stringify({ phone: { display: '(647) 555-0100', e164: '+16475550100', sample: false } }),
    );
    expect(await findLaunchProblems(root)).toEqual([
      {
        file: 'src/data/business.json',
        message: 'Phone number is still a sample. Replace it in src/data/business.json.',
      },
    ]);
  });

  it.each(['sample-hero.jpg', 'sample-kitchen.JPEG', 'Sample-floor.webp', 'sample_1.png', 'sample-logo.svg'])(
    'finds sample-prefixed image files: %s',
    async (name) => {
      await put(`src/assets/${name}`, Buffer.from([0xff, 0xd8, 0x00, 0x01]));
      expect(await findLaunchProblems(root)).toEqual([
        {
          file: `src/assets/${name}`,
          message: `Image is still a sample. Replace src/assets/${name} with a real photo.`,
        },
      ]);
    },
  );

  it('reports each problem with file and plain message', async () => {
    await put(
      'src/data/business.json',
      JSON.stringify({
        siteUrl: { value: 'https://aldotile.example', sample: true },
        phone: { display: '(647) 555-0100', sample: true },
        email: { value: 'hello@example.com', sample: true },
      }),
    );
    expect(await findLaunchProblems(root)).toEqual([
      {
        file: 'src/data/business.json',
        message: 'Website address is still a sample. Replace it in src/data/business.json.',
      },
      {
        file: 'src/data/business.json',
        message: 'Phone number is still a sample. Replace it in src/data/business.json.',
      },
      {
        file: 'src/data/business.json',
        message: 'Email address is still a sample. Replace it in src/data/business.json.',
      },
    ]);
  });

  it('reports a broken JSON file instead of skipping it', async () => {
    await put('src/data/facts.json', '{ "sample": true,');
    expect(await findLaunchProblems(root)).toEqual([
      {
        file: 'src/data/facts.json',
        message: 'This file has a mistake and could not be checked. Fix src/data/facts.json and run the check again.',
      },
    ]);
  });

  it('skips text checks in binary files', async () => {
    await put('src/assets/kitchen.jpg', Buffer.concat([Buffer.from([0x00]), Buffer.from('555-0100')]));
    expect(await findLaunchProblems(root)).toEqual([]);
  });

  it('does not scan outside src', async () => {
    await put('docs/notes.md', 'sample: true and hello@example.com');
    await put('public/sample-hero.jpg', Buffer.from([0x00]));
    expect(await findLaunchProblems(root)).toEqual([]);
  });

  it('returns no problems when src is missing', async () => {
    expect(await findLaunchProblems(root)).toEqual([]);
  });

  it('returns no problems for clean content', async () => {
    await put(
      'src/data/business.json',
      JSON.stringify({
        launchReady: true,
        siteUrl: { value: 'https://aldo-tile.test', sample: false },
        // Ends in the sample digits plus one more, so it is a different, real number.
        phone: { display: '(655) 550-1001', e164: '+16555501001', sample: false },
        email: { value: 'aldo@aldo-tile.test', sample: false },
      }),
    );
    await put(
      'src/content/services/floors.md',
      '---\ntitle: Floors\nsample: false\n---\nFor example, a sample: true board. See our examples at example.community.\n',
    );
    await put('src/components/Footer.astro', '<p>Grout, for example. Example projects.</p>');
    await put('src/assets/kitchen.jpg', Buffer.from([0xff, 0xd8, 0x00]));
    await put('src/assets/samples.txt', 'Plain text with a harmless name.');
    expect(await findLaunchProblems(root)).toEqual([]);
  });
});

describe('isLaunchReady', () => {
  it('is true when launchReady is on', async () => {
    await put('src/data/business.json', '{ "launchReady": true }');
    expect(await isLaunchReady(root)).toBe(true);
  });

  it('is false when launchReady is off', async () => {
    await put('src/data/business.json', '{ "launchReady": false }');
    expect(await isLaunchReady(root)).toBe(false);
  });

  it('is false when business.json is missing', async () => {
    expect(await isLaunchReady(root)).toBe(false);
  });

  it('treats a mistyped truthy value as on so the guard still runs', async () => {
    await put('src/data/business.json', '{ "launchReady": "true" }');
    expect(await isLaunchReady(root)).toBe(true);
  });

  it('says what to do when business.json is broken', async () => {
    await put('src/data/business.json', '{ "launchReady": true,');
    await expect(isLaunchReady(root)).rejects.toThrow(/src\/data\/business\.json has a mistake/);
  });
});

// Netlify builds with the command in netlify.toml. If that skipped npm run build, or the build script skipped the guard,
// a site with launchReady on could go live with sample content.
describe('the launch guard runs on every build', () => {
  function netlifyCommands() {
    let section = '';
    const commands: { section: string; command: string }[] = [];
    for (const line of readFileSync('netlify.toml', 'utf8').split(/\r?\n/)) {
      section = line.match(/^\s*\[{1,2}\s*([^\]]+?)\s*\]{1,2}\s*(?:#.*)?$/)?.[1] ?? section;
      const command = line.match(/^\s*command\s*=\s*(.*?)\s*(?:#.*)?$/)?.[1];
      if (command !== undefined) commands.push({ section, command });
    }
    return commands;
  }

  it('netlify.toml builds with npm run build, and nothing overrides it', () => {
    expect(netlifyCommands(), 'netlify.toml must have one command, "npm run build", under [build]').toEqual([
      { section: 'build', command: '"npm run build"' },
    ]);
  });

  it('the build script runs the launch guard before Astro', () => {
    const { build } = JSON.parse(readFileSync('package.json', 'utf8')).scripts;
    expect(build, 'package.json\'s build script must start with the launch guard').toMatch(/^node scripts\/launch-guard\.mjs && /);
  });
});
