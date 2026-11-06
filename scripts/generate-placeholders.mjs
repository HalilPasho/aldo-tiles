import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANDSCAPE = [1600, 1200];
const PORTRAIT = [1200, 1600];
const HERO = [2000, 1200];

const NAVY = '#091e2b';
const GOLD = '#b6812a';
const OFF_WHITE = '#f8f7f5';

const PALETTES = {
  stoneGreige: { tile: '#b7afa3', grout: '#8f887d', mark: '#8d8578' },
  stoneMushroom: { tile: '#9d958a', grout: '#6f6961', mark: '#7a7268' },
  marbleWarm: { tile: '#ece8e1', grout: '#cbc5bb', mark: '#a79f93' },
  marbleSoft: { tile: '#dcd7cf', grout: '#b6afa4', mark: '#948c80' },
  oakPlank: { tile: '#b39472', grout: '#6e5a45', mark: '#8d7253' },
  concreteGrey: { tile: '#8f9498', grout: '#676c70', mark: '#7a7f83' },
  concreteDark: { tile: '#5d646a', grout: '#3b4146', mark: '#4c5359' },
  glazedIvory: { tile: '#efebe3', grout: '#c4bdb0', mark: '#e0dbd0' },
  sageGrey: { tile: '#a4aca3', grout: '#7d857c', mark: '#8e968d' },
  slateNavy: { tile: '#44586a', grout: '#2a3946', mark: '#37495a' },
  quarryClay: { tile: '#99705a', grout: '#574236', mark: '#83604c' },
};

const CABINET_AND_COUNTER = {
  top: { share: 0.14, color: NAVY },
  bottom: { share: 0.12, color: '#d9d3c8' },
};

const PROJECTS = [
  {
    slug: 'mississauga-stone-look-walk-in-shower',
    photos: [
      { name: 'stone-look-shower-wall', size: LANDSCAPE, layout: 'stacked', palette: 'stoneGreige', tile: [420, 210], grout: 5, finish: 'cloud', seed: 11 },
      { name: 'stone-look-shower-niche-wall', size: PORTRAIT, layout: 'stacked', palette: 'stoneMushroom', tile: [210, 420], grout: 5, finish: 'cloud', seed: 12 },
      { name: 'stone-look-shower-floor-mosaic', size: LANDSCAPE, layout: 'hex', palette: 'stoneMushroom', tile: [52], grout: 4, seed: 13 },
    ],
  },
  {
    slug: 'oakville-marble-look-ensuite',
    photos: [
      { name: 'marble-look-ensuite-shower-wall', size: PORTRAIT, layout: 'stacked', palette: 'marbleWarm', tile: [590, 1180], grout: 3, finish: 'vein', seed: 21 },
      { name: 'marble-look-ensuite-floor', size: LANDSCAPE, layout: 'stacked', palette: 'marbleSoft', tile: [560, 560], grout: 4, finish: 'vein', seed: 22 },
      { name: 'marble-look-ensuite-accent-wall', size: LANDSCAPE, layout: 'herringbone', palette: 'marbleWarm', tile: [240, 80], grout: 3, finish: 'vein', seed: 23 },
    ],
  },
  {
    slug: 'brampton-herringbone-entry-floor',
    photos: [
      { name: 'herringbone-entry-floor', size: LANDSCAPE, layout: 'herringbone', palette: 'oakPlank', tile: [360, 72], grout: 3, finish: 'grain', seed: 31 },
      { name: 'herringbone-hallway-detail', size: LANDSCAPE, layout: 'herringbone', palette: 'oakPlank', tile: [620, 124], grout: 4, finish: 'grain', seed: 32 },
    ],
  },
  {
    slug: 'etobicoke-large-format-basement-floor',
    photos: [
      { name: 'large-format-basement-floor', size: LANDSCAPE, layout: 'stacked', palette: 'concreteGrey', tile: [640, 640], grout: 4, finish: 'cloud', seed: 41 },
      { name: 'large-format-basement-stair-landing', size: PORTRAIT, layout: 'offset', palette: 'concreteGrey', tile: [800, 400], grout: 4, offset: 1 / 3, finish: 'cloud', seed: 42 },
    ],
  },
  {
    slug: 'mississauga-glazed-subway-backsplash',
    photos: [
      { name: 'subway-backsplash-full-wall', size: LANDSCAPE, layout: 'offset', palette: 'glazedIvory', tile: [190, 64], grout: 3, offset: 1 / 2, bands: CABINET_AND_COUNTER, seed: 51 },
      { name: 'subway-backsplash-tile-detail', size: LANDSCAPE, layout: 'offset', palette: 'glazedIvory', tile: [420, 140], grout: 5, offset: 1 / 2, seed: 52 },
    ],
  },
  {
    slug: 'brampton-hex-mosaic-backsplash',
    photos: [
      { name: 'hex-mosaic-backsplash-full-wall', size: LANDSCAPE, layout: 'hex', palette: 'marbleSoft', tile: [44], grout: 3, bands: CABINET_AND_COUNTER, seed: 61 },
      { name: 'hex-mosaic-backsplash-corner', size: PORTRAIT, layout: 'hex', palette: 'marbleWarm', tile: [78], grout: 4, seed: 62 },
    ],
  },
  {
    slug: 'mississauga-office-washroom-refit',
    photos: [
      { name: 'office-washroom-feature-wall', size: LANDSCAPE, layout: 'stacked', palette: 'sageGrey', tile: [84, 340], grout: 3, seed: 71 },
      { name: 'office-washroom-entry-wall', size: PORTRAIT, layout: 'stacked', palette: 'slateNavy', tile: [110, 440], grout: 3, seed: 72 },
      { name: 'office-washroom-floor', size: LANDSCAPE, layout: 'stacked', palette: 'concreteDark', tile: [400, 400], grout: 4, finish: 'cloud', seed: 73 },
    ],
  },
  {
    slug: 'etobicoke-restaurant-floor',
    photos: [
      { name: 'restaurant-dining-room-floor', size: LANDSCAPE, layout: 'offset', palette: 'concreteDark', tile: [480, 240], grout: 4, offset: 1 / 3, finish: 'cloud', seed: 81 },
      { name: 'restaurant-kitchen-quarry-floor', size: LANDSCAPE, layout: 'stacked', palette: 'quarryClay', tile: [190, 190], grout: 7, seed: 82 },
    ],
  },
];

const HERO_IMAGE = {
  size: HERO,
  layout: 'stacked',
  palette: 'marbleSoft',
  tile: [620, 620],
  grout: 4,
  finish: 'vein',
  seed: 91,
  labelCentre: [1040, 900],
};

function randomFrom(seed) {
  let state = seed * 2654435761;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex, amount) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  const shifted = channels.map((value) => Math.max(0, Math.min(255, Math.round(value + amount))));
  return `#${shifted.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

// Control points stay inside the tile, so each curve stays inside it and stops at an edge.
function veins(x, y, w, h, palette, random) {
  const small = Math.min(w, h) < 120;
  const count = small ? (random() < 0.45 ? 1 : 0) : 1 + Math.floor(random() * 2);
  const alongWidth = w >= h;
  const [length, across] = alongWidth ? [w, h] : [h, w];
  const point = (along, cross) => {
    const [px, py] = alongWidth ? [x + along * length, y + cross * across] : [x + cross * across, y + along * length];
    return `${px.toFixed(1)} ${py.toFixed(1)}`;
  };
  let marks = '';
  for (let index = 0; index < count; index += 1) {
    const start = 0.2 + random() * 0.6;
    const exitsSide = random() < 0.5;
    const endAlong = exitsSide ? 0.55 + random() * 0.4 : 1;
    const endCross = exitsSide ? (start < 0.5 ? 1 : 0) : 0.2 + random() * 0.6;
    const bend = () => 0.2 + random() * 0.6;
    const d = `M${point(0, start)}C${point(endAlong * 0.35, bend())} ${point(endAlong * 0.7, bend())} ${point(endAlong, endCross)}`;
    const opacity = 0.2 + random() * 0.2;
    marks += `<path d="${d}" fill="none" stroke="${palette.mark}" stroke-width="6" stroke-linecap="butt" opacity="${(opacity / 3).toFixed(2)}"/>`;
    marks += `<path d="${d}" fill="none" stroke="${palette.mark}" stroke-width="${(0.8 + random() * 0.7).toFixed(1)}" stroke-linecap="butt" opacity="${opacity.toFixed(2)}"/>`;
  }
  return marks;
}

function grain(x, y, w, h, palette, random) {
  const alongWidth = w >= h;
  const [length, across] = alongWidth ? [w, h] : [h, w];
  const point = (along, cross) => {
    const [px, py] = alongWidth ? [x + along, y + cross] : [x + cross, y + along];
    return `${px.toFixed(1)} ${py.toFixed(1)}`;
  };
  let marks = '';
  const lines = 3 + Math.floor(random() * 3);
  for (let index = 0; index < lines; index += 1) {
    const cross = across * (0.1 + 0.8 * random());
    const bow = (random() - 0.5) * across * 0.25;
    marks += `<path d="M${point(4, cross)}Q${point(length / 2, cross + bow)} ${point(length - 4, cross)}" fill="none" stroke="${palette.mark}" stroke-width="1.2" opacity="${(0.25 + random() * 0.3).toFixed(2)}"/>`;
  }
  return marks;
}

function rectTile(x, y, w, h, spec, palette, random, jitter = 7) {
  const gap = spec.grout / 2;
  const [tx, ty, tw, th] = [x + gap, y + gap, w - spec.grout, h - spec.grout];
  const fill = shade(palette.tile, (random() - 0.5) * 2 * jitter);
  let tile = `<rect x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}" rx="1.5" fill="${fill}"/>`;
  if (spec.finish === 'vein') tile += veins(tx, ty, tw, th, palette, random);
  if (spec.finish === 'grain') tile += grain(tx, ty, tw, th, palette, random);
  return tile;
}

function stacked(spec, palette, random, [width, height]) {
  const [w, h] = spec.tile;
  let tiles = '';
  const startX = -((w - (width % w)) / 2);
  const startY = -((h - (height % h)) / 2);
  for (let y = startY; y < height; y += h) {
    for (let x = startX; x < width; x += w) {
      tiles += rectTile(x, y, w, h, spec, palette, random);
    }
  }
  return tiles;
}

function offsetRows(spec, palette, random, [width, height]) {
  const [w, h] = spec.tile;
  let tiles = '';
  let row = 0;
  for (let y = -h / 2; y < height; y += h) {
    const shift = -w + ((row * spec.offset) % 1) * w;
    for (let x = shift; x < width; x += w) {
      tiles += rectTile(x, y, w, h, spec, palette, random);
    }
    row += 1;
  }
  return tiles;
}

// Planks repeat along (W, W) and (L, -L); each repeat holds one flat and one upright plank.
function herringbone(spec, palette, random, [width, height]) {
  const [long, short] = spec.tile;
  const reach = Math.hypot(width, height);
  const steps = Math.ceil(reach / short) + 2;
  const rows = Math.ceil(reach / long) + 2;
  let tiles = '';
  for (let i = -steps; i <= steps; i += 1) {
    for (let j = -rows; j <= rows; j += 1) {
      const x = width / 2 + i * short + j * long;
      const y = height / 2 + i * short - j * long;
      if (Math.hypot(x - width / 2, y - height / 2) > reach) continue;
      tiles += rectTile(x, y, long, short, spec, palette, random);
      tiles += rectTile(x + long, y + short - long, short, long, spec, palette, random);
    }
  }
  return `<g transform="rotate(45 ${width / 2} ${height / 2})">${tiles}</g>`;
}

function hexagons(spec, palette, random, [width, height]) {
  const [radius] = spec.tile;
  const stepX = Math.sqrt(3) * radius + spec.grout;
  const stepY = 1.5 * radius + spec.grout * 0.87;
  let tiles = '';
  let row = 0;
  for (let y = -radius; y < height + radius; y += stepY) {
    const shift = row % 2 === 0 ? 0 : stepX / 2;
    for (let x = -stepX + shift; x < width + stepX; x += stepX) {
      const corners = [];
      for (let corner = 0; corner < 6; corner += 1) {
        const angle = Math.PI / 6 + (corner * Math.PI) / 3;
        corners.push(`${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`);
      }
      const fill = shade(palette.tile, (random() - 0.5) * 22);
      tiles += `<polygon points="${corners.join(' ')}" fill="${fill}"/>`;
    }
    row += 1;
  }
  return tiles;
}

const LAYOUTS = { stacked, offset: offsetRows, herringbone, hex: hexagons };

function bandsMarkup(bands, [width, height]) {
  if (!bands) return '';
  const topHeight = Math.round(height * bands.top.share);
  const bottomHeight = Math.round(height * bands.bottom.share);
  const bottomY = height - bottomHeight;
  return `
    <rect width="${width}" height="${topHeight + 44}" y="${topHeight - 2}" fill="url(#cabinetShadow)"/>
    <rect width="${width}" height="${topHeight}" fill="${bands.top.color}"/>
    <rect y="${bottomY}" width="${width}" height="${bottomHeight}" fill="${bands.bottom.color}"/>
    <rect y="${bottomY}" width="${width}" height="4" fill="${shade(bands.bottom.color, -40)}"/>`;
}

function labelMarkup([width, height], centre) {
  const fontSize = Math.round(Math.max(width, height) * 0.024);
  const pillHeight = Math.round(fontSize * 2.1);
  const pillWidth = Math.round(fontSize * 8.9);
  const [cx, cy] = centre ?? [width / 2, height / 2];
  const x = Math.round(cx - pillWidth / 2);
  const y = Math.round(cy - pillHeight / 2);
  const square = Math.round(fontSize * 0.5);
  return `
    <g>
      <rect x="${x}" y="${y}" width="${pillWidth}" height="${pillHeight}" rx="4" fill="${NAVY}" opacity="0.86"/>
      <rect x="${x + fontSize * 0.7}" y="${Math.round(cy - square / 2)}" width="${square}" height="${square}" fill="${GOLD}"/>
      <text x="${x + fontSize * 1.55}" y="${Math.round(cy + fontSize * 0.35)}" font-family="Liberation Sans, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="0.5" fill="${OFF_WHITE}">Sample photo</text>
    </g>`;
}

function svgFor(spec) {
  const [width, height] = spec.size;
  const palette = PALETTES[spec.palette];
  const random = randomFrom(spec.seed);
  const tiles = LAYOUTS[spec.layout](spec, palette, random, spec.size);
  const clouds = spec.finish === 'cloud'
    ? `<rect width="${width}" height="${height}" filter="url(#clouds)" opacity="0.2"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="light" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.16"/>
        <stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.16"/>
      </linearGradient>
      <linearGradient id="cabinetShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.2"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
      <filter id="clouds" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves="3" seed="${spec.seed}"/>
        <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.23  0 0 0 0 0.2  0 0 0 1.4 -0.45"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="${palette.grout}"/>
    ${tiles}
    ${clouds}
    <rect width="${width}" height="${height}" fill="url(#light)"/>
    ${bandsMarkup(spec.bands, spec.size)}
    ${labelMarkup(spec.size, spec.labelCentre)}
  </svg>`;
}

async function writeImage(spec, path) {
  await mkdir(dirname(path), { recursive: true });
  const { size } = await sharp(Buffer.from(svgFor(spec)))
    .flatten({ background: OFF_WHITE })
    .jpeg({ quality: 76, mozjpeg: true })
    .toFile(path);
  console.log(`${path.slice(ROOT.length + 1)}  ${Math.round(size / 1024)} KB`);
}

await writeImage(HERO_IMAGE, join(ROOT, 'src', 'assets', 'sample-hero.jpg'));
for (const project of PROJECTS) {
  for (const photo of project.photos) {
    await writeImage(photo, join(ROOT, 'src', 'content', 'projects', project.slug, `sample-${photo.name}.jpg`));
  }
}
