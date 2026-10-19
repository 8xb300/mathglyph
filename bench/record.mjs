// Records docs/preview.webp for the README: the preview page with the canvas renderer, or with the
// original script while dist/mathglyph.js does not exist. The text is plain at rest (rest: 'plain').
// The intro plays, the real mouse crosses the lines, leaves, and the text goes back to plain after
// the default revert of 2 s. Screenshots of the text are taken as fast as possible, and each frame keeps
// its real duration.
//
//   node bench/record.mjs [output.webp]
//
// Needs playwright (with its Chromium) and sharp where require() finds them: a node_modules folder
// or NODE_PATH.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { root, serveRepo, writeOriginal } from './run.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const RECORD_MS = 9000;
const INTRO_MS = 1800;
const SWEEP_MS = 1400;
// Where the mouse goes, in fractions of the text's box. It waits at the first point while the
// intro plays, then sweeps from point to point. x below 0 or above 1 is beside the text: the
// last point leaves it, so the text goes back to plain before the animation loops.
const POINTS = [[-0.04, 0.22], [1.04, 0.42], [-0.04, 0.72]];
const MAX_BYTES = 1.5e6;
// Tried in order until the file is under MAX_BYTES: WebP quality, and keep every n-th frame.
// Fewer frames go first: they save more than a lower quality and keep the small text sharp.
const ENCODINGS = [
  { quality: 80, every: 1 },
  { quality: 80, every: 2 },
  { quality: 65, every: 2 },
  { quality: 50, every: 3 },
];

async function moveMouse(page, box) {
  const at = ([x, y]) => [box.x + x * box.width, box.y + y * box.height];
  await page.mouse.move(...at(POINTS[0]));
  await sleep(INTRO_MS);
  for (let i = 1; i < POINTS.length; i++) {
    const [x0, y0] = at(POINTS[i - 1]);
    const [x1, y1] = at(POINTS[i]);
    const start = performance.now();
    for (let u = 0; u < 1; ) {
      u = Math.min(1, (performance.now() - start) / SWEEP_MS);
      await page.mouse.move(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, { steps: 4 });
      await sleep(16);
    }
  }
}

// Joins the frames into an animated WebP, keeping every n-th frame with the durations it covers.
function encode(frames, durations, { quality, every }) {
  const kept = frames.filter((_, i) => i % every === 0);
  const delay = kept.map((_, i) => durations.slice(i * every, (i + 1) * every).reduce((a, b) => a + b));
  return sharp(kept, { join: { animated: true } }).webp({ quality, delay, loop: 0 }).toBuffer();
}

const out = path.resolve(process.argv[2] ?? path.join(root, 'docs', 'preview.webp'));
const impl = fs.existsSync(path.join(root, 'dist', 'mathglyph.js')) ? 'canvas' : 'original';
if (impl === 'original') {
  console.error('dist/mathglyph.js does not exist, so this records the original script');
  writeOriginal();
}

const server = await serveRepo();
const browser = await chromium.launch();
const frames = [];
const times = [];
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 320 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/bench/page.html?impl=${impl}&mode=preview&rest=plain`);
  await page.evaluate(() => window.__ready);
  const box = await page.locator('#fx').boundingBox();
  const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
  const start = performance.now();
  const mouse = moveMouse(page, box);
  while (performance.now() - start < RECORD_MS) {
    times.push(performance.now());
    frames.push(await page.screenshot({ clip, caret: 'initial' }));
  }
  times.push(performance.now());
  await mouse;
} finally {
  await browser.close();
  server.close();
}

const durations = frames.map((_, i) => Math.round(times[i + 1] - times[i]));
let webp;
let encoding;
for (encoding of ENCODINGS) {
  webp = await encode(frames, durations, encoding);
  if (webp.length < MAX_BYTES) break;
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, webp);
// The encoder merges identical frames, so the file can have fewer frames than were kept.
const { pages } = await sharp(webp).metadata();
console.log(
  `${path.relative(root, out)}: ${(webp.length / 1e6).toFixed(2)} MB, ${pages} frames over ` +
    `${((times.at(-1) - times[0]) / 1000).toFixed(1)} s (${frames.length} screenshots, every ${encoding.every}, ` +
    `WebP quality ${encoding.quality}), impl=${impl}`,
);
if (webp.length >= MAX_BYTES) console.error(`still over ${MAX_BYTES / 1e6} MB with the smallest encoding`);
