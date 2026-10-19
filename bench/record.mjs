// Records the README previews from the bench page, with the text plain at rest (rest: 'plain').
//
//   node bench/record.mjs                     docs/preview.webp: the pitch text
//   node bench/record.mjs previews [name...]  docs/previews/<name>.webp: one per layout and effect
//
// Both load the engine and the modules from src/, so they work before a build.
//
// The page's clock runs at SLOW of real time while screenshots of the text are taken as fast as
// possible, so a preview gets many frames per second of page time. Each frame keeps its duration in
// page time. The real mouse waits while the intro plays, sweeps over the text and leaves it, so the
// text goes back to plain before the animation loops.
//
// Needs playwright (with its Chromium) and sharp where require() finds them: a node_modules folder
// or NODE_PATH.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { root, serveRepo } from './run.mjs';
import { cjk } from '../src/languages.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const SLOW = 0.25;

// Points are fractions of the text's box. The mouse waits at the first point for waitMs, then
// sweeps from point to point. x below 0 or above 1 is beside the text. The encodings are tried in
// order until the file is under maxBytes: WebP quality, and keep every n-th frame. Fewer frames go
// first: they save more than a lower quality and keep the small text sharp.
const MAIN = {
  out: 'docs/preview.webp',
  query: 'impl=canvas&src=1&mode=preview&rest=plain',
  viewport: { width: 900, height: 320 },
  waitMs: 1800,
  sweepMs: 1400,
  recordMs: 9000,
  points: [[-0.04, 0.22], [1.04, 0.42], [-0.04, 0.72]],
  maxBytes: 1.05e6,
  encodings: [
    { quality: 75, every: 4 },
    { quality: 65, every: 4 },
    { quality: 65, every: 5 },
    { quality: 55, every: 6 },
  ],
};

// A small preview: no intro, a short text in a narrower box, and a smaller font than fit would
// give, so the lines have room to grow. The layouts run with 'breathe', the effects in 'lines'.
// 'breathe' is also the preview of 'lines'.
const TEXT = ['every letter is', 'a small *variable*', 'in a long proof'];
const PREVIEWS = {
  breathe: { lines: TEXT },
  columns: {
    layout: 'columns',
    lines: ['一字一变量', '一句一证明', '符号*呼吸*着', '又归于平淡'],
    options: { layout: { name: 'columns', columnGap: 1 }, anchor: '呼吸', lookalikes: cjk, maxSize: 40 },
  },
  grid: { layout: 'grid', lines: ['every glyph has', 'its own *column*', 'and its own row'] },
  ring: { layout: 'ring', lines: ['every letter goes *round*'], options: { anchor: 'round', maxSize: 40 } },
  ripple: { effect: 'ripple', lines: TEXT },
  firework: { effect: 'firework', lines: TEXT },
  lens: { effect: 'lens', lines: TEXT },
  cascade: { effect: 'cascade', lines: TEXT },
  shatter: { effect: 'shatter', lines: TEXT },
};
const SMALL = {
  query: 'impl=canvas&src=1&mode=preview&rest=plain&intro=0',
  css: 'body.preview #fx { width: 360px; padding: 10px 12px; }',
  viewport: { width: 600, height: 600 },
  waitMs: 300,
  sweepMs: 1800,
  recordMs: 3300,
  points: [[-0.06, 0.25], [1.06, 0.75]],
  options: { anchor: null, maxSize: 26 },
  maxBytes: 90e3,
  encodings: [
    { quality: 50, every: 8 },
    { quality: 45, every: 10 },
    { quality: 45, every: 12 },
    { quality: 40, every: 16 },
  ],
};

async function moveMouse(page, box, { points, waitMs, sweepMs }) {
  const at = ([x, y]) => [box.x + x * box.width, box.y + y * box.height];
  await page.mouse.move(...at(points[0]));
  await sleep(waitMs / SLOW);
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = at(points[i - 1]);
    const [x1, y1] = at(points[i]);
    const start = performance.now();
    for (let u = 0; u < 1; ) {
      u = Math.min(1, (performance.now() - start) / (sweepMs / SLOW));
      await page.mouse.move(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, { steps: 4 });
      await sleep(16);
    }
  }
}

// Joins the frames into an animated WebP, keeping every n-th frame with the durations it covers.
function encode(frames, durations, { quality, every }) {
  const kept = frames.filter((_, i) => i % every === 0);
  const delay = kept.map((_, i) => Math.round(durations.slice(i * every, (i + 1) * every).reduce((a, b) => a + b)));
  return sharp(kept, { join: { animated: true } }).webp({ quality, delay, loop: 0 }).toBuffer();
}

async function record(browser, base, spec, options = {}) {
  const page = await browser.newPage({ viewport: spec.viewport, deviceScaleFactor: 1 });
  const frames = [];
  const times = [];
  try {
    // The page's clock: performance.now and animation-frame times run at SLOW.
    await page.addInitScript((slow) => {
      const now = performance.now.bind(performance);
      const t0 = now();
      performance.now = () => t0 + (now() - t0) * slow;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => raf((t) => callback(t0 + (t - t0) * slow));
    }, SLOW);
    const query = new URLSearchParams(spec.query);
    for (const kind of ['layout', 'effect']) if (options[kind]) query.set(kind, options[kind]);
    await page.goto(`${base}/bench/page.html?${query}`);
    if (spec.css) await page.addStyleTag({ content: spec.css });
    await page.evaluate(() => window.__ready);
    if (options.lines) await page.evaluate((o) => window.__fx.update(o), { ...spec.options, ...options.options, lines: options.lines });
    await sleep(500);
    const box = await page.locator('#fx').boundingBox();
    const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
    const start = performance.now();
    const mouse = moveMouse(page, box, spec);
    while (performance.now() - start < spec.recordMs / SLOW) {
      times.push(performance.now());
      frames.push(await page.screenshot({ clip, caret: 'initial' }));
    }
    times.push(performance.now());
    await mouse;
  } finally {
    await page.close();
  }

  const durations = frames.map((_, i) => (times[i + 1] - times[i]) * SLOW);
  let webp;
  let encoding;
  for (encoding of spec.encodings) {
    webp = await encode(frames, durations, encoding);
    if (webp.length < spec.maxBytes) break;
  }
  const out = path.join(root, spec.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, webp);
  // The encoder merges identical frames, so the file can have fewer frames than were kept.
  const { pages, width, height } = await sharp(webp).metadata();
  console.log(
    `${spec.out}: ${(webp.length / 1e3).toFixed(0)} kB, ${width}×${height}, ${pages} frames over ` +
      `${(((times.at(-1) - times[0]) * SLOW) / 1000).toFixed(1)} s (${frames.length} screenshots, every ${encoding.every}, ` +
      `WebP quality ${encoding.quality})`,
  );
  if (webp.length >= spec.maxBytes) console.error(`  still over ${spec.maxBytes / 1e3} kB with the smallest encoding`);
}

const [mode = 'main', ...names] = process.argv.slice(2);
const server = await serveRepo();
const browser = await chromium.launch();
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  if (mode === 'previews') {
    for (const name of names.length ? names : Object.keys(PREVIEWS)) {
      await record(browser, base, { ...SMALL, out: `docs/previews/${name}.webp` }, PREVIEWS[name]);
    }
  } else {
    await record(browser, base, MAIN);
  }
} finally {
  await browser.close();
  server.close();
}
