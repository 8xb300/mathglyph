// Measures how smooth the slots move. On every frame it records where each glyph is drawn, each
// slot's width and each line's left edge, while a pointer sweeps over the README preview text
// (rest: 'plain') and leaves, so the text goes back to plain. Then it measures the main-thread
// time per frame while a pointer zig-zags over 2,000 characters, as bench/run.mjs does.
//
//   node bench/motion.mjs [engine.js] [--seeds=3] [--layout=grid] [--effect=ripple]
//
// --layout and --effect load that module from dist/ (run npm run build first). A glyph's place is
// its slot centre (cx, cy) where the engine has one, else its line's left edge plus its offset.
//
// engine.js defaults to dist/mathglyph.js. Give the path of an older build to compare: the page
// gets that file in its place. Math.random is seeded, so a run with the same engine and seed
// replays the same glyphs. Needs playwright (with its Chromium) where require() finds it.
// Writes bench/results/motion.json.
//
// Per phase (hover, revert) it prints:
//   max jump      the largest move of one glyph between two frames, in px
//   max jump/60Hz the same, scaled to a 16.7 ms frame, so a dropped frame does not count double
//   max kick      the largest change of one glyph's speed between two frames, in px per 16.7 ms frame
//   twitch        how often a glyph's motion turns back, along x or y, per glyph per second
//   width twitch  the same for slot widths
//   line twitch   the same for the left edge of each line
//   line max jump the largest move of a line's left edge between two frames, in px

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { root, serveRepo } from './run.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const option = (name, fallback) => Number(args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const SEEDS = option('seeds', 3);
const modules = ['layout', 'effect'].map((kind) => args.find((arg) => arg.startsWith(`--${kind}=`))?.replace('--', '&')).join('');
const engineFile = path.resolve(args.find((arg) => !arg.startsWith('--')) ?? path.join(root, 'dist', 'mathglyph.js'));
const HOVER_MS = 5000;
// A move under this many px between two frames counts as standing still.
const STILL = 0.05;
const TURN = 3;

// The page gets the engine with one line added: window.__mgState() returns its lines and cells.
function engineSource(hook) {
  const source = fs.readFileSync(engineFile, 'utf8');
  if (!hook) return source;
  const start = /function mount\(root, options\) \{/;
  if (!start.test(source)) throw new Error(`${engineFile}: no "function mount(root, options) {" to hook into`);
  return source.replace(start, (head) => `${head} window.__mgState = function () { return { lines: lines, cells: cells }; };`);
}

// Runs in the page before its scripts: a seeded Math.random, and a sample of every slot after each
// animation-frame callback. Samples are kept per frame time, so the last callback of a frame wins.
function initScript(seed) {
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  window.__samples = null;
  const native = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => native((now) => {
    callback(now);
    if (!window.__samples || !window.__mgState) return;
    const { lines, cells } = window.__mgState();
    const sample = {
      t: now,
      left: lines.map((line) => line.left ?? 0),
      x: cells.map((c) => c.cx ?? lines[c.line].left + c.x + c.w / 2),
      y: cells.map((c) => c.cy ?? 0),
      w: cells.map((c) => c.w),
      g: cells.map((c) => c.g),
      line: cells.map((c) => c.line),
    };
    const last = window.__samples[window.__samples.length - 1];
    if (last && last.t === now) window.__samples[window.__samples.length - 1] = sample;
    else window.__samples.push(sample);
  });
}

// Runs in the page: the pointer waits beside the text, sweeps over it along `points` (fractions
// of the text's box) at `ms` per leg, one pointermove per frame, then leaves. Resolves when no
// timer or frame has run for 500 ms. Returns the time of the leave.
function sweep({ points, ms }) {
  const el = document.getElementById('fx');
  const box = el.getBoundingClientRect();
  const raf = window.__raw.requestAnimationFrame;
  const move = (type, [x, y]) => el.dispatchEvent(new PointerEvent(type, {
    clientX: box.left + box.width * x, clientY: box.top + box.height * y,
    bubbles: type !== 'pointerleave', pointerId: 1, pointerType: 'mouse', isPrimary: true,
  }));
  window.__samples = [];
  return new Promise((resolve) => {
    let start = 0;
    raf(function frame(now) {
      if (!start) start = now;
      const leg = Math.floor((now - start) / ms);
      if (leg < points.length - 1) {
        const u = (now - start) / ms - leg;
        const [x0, y0] = points[leg];
        const [x1, y1] = points[leg + 1];
        move('pointermove', [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]);
        raf(frame);
        return;
      }
      move('pointerleave', points[points.length - 1]);
      const left = performance.now();
      let seen = window.__wakeups, quietSince = performance.now();
      (function wait() {
        if (window.__wakeups !== seen) { seen = window.__wakeups; quietSince = performance.now(); }
        if (performance.now() - quietSince > 500 || performance.now() - left > 8000) {
          resolve(left);
          return;
        }
        window.__raw.setTimeout(wait, 50);
      })();
    });
  });
}

function phaseStats(samples, from, to) {
  const s = samples.filter((sample) => sample.t >= from && sample.t <= to);
  const out = { frames: s.length, seconds: s.length ? (s[s.length - 1].t - s[0].t) / 1000 : 0 };
  let maxJump = 0, maxJump60 = 0, maxKick = 0, flips = 0, widthFlips = 0, lineFlips = 0, lineJump = 0, swaps = 0;
  const cells = s.length ? s[0].x.length : 0;
  const lines = s.length ? s[0].left.length : 0;
  const lastDx = new Array(cells).fill(0), lastDy = new Array(cells).fill(0);
  // A turn is a move against the last real move, when that move was at most TURN frames ago:
  // the old engine stands still for one frame when a target changes, then moves the other way.
  const turns = (count) => ({ sign: new Array(count).fill(0), frame: new Array(count).fill(-99) });
  const gx = turns(cells), gy = turns(cells), gw = turns(cells), gl = turns(lines);
  const turned = (t, i, d, f) => {
    if (Math.abs(d) < STILL) return 0;
    const sign = Math.sign(d), back = sign === -t.sign[i] && f - t.frame[i] <= TURN;
    t.sign[i] = sign;
    t.frame[i] = f;
    return back ? 1 : 0;
  };
  for (let f = 1; f < s.length; f++) {
    const a = s[f - 1], b = s[f], scale = 16.667 / (b.t - a.t);
    for (let i = 0; i < cells; i++) {
      if (b.g[i] !== a.g[i]) swaps++;
      // Only glyphs that are drawn in both frames: a folded word letter has width 0.
      if (a.w[i] < 0.5 || b.w[i] < 0.5) { lastDx[i] = NaN; continue; }
      const dx = b.x[i] - a.x[i], dy = b.y[i] - a.y[i], dw = b.w[i] - a.w[i], d = Math.hypot(dx, dy);
      maxJump = Math.max(maxJump, d);
      maxJump60 = Math.max(maxJump60, d * scale);
      if (!Number.isNaN(lastDx[i])) maxKick = Math.max(maxKick, Math.hypot(dx * scale - lastDx[i], dy * scale - lastDy[i]));
      flips += turned(gx, i, dx, f) + turned(gy, i, dy, f);
      widthFlips += turned(gw, i, dw, f);
      lastDx[i] = dx * scale;
      lastDy[i] = dy * scale;
    }
    for (let l = 0; l < lines; l++) {
      const dl = b.left[l] - a.left[l];
      lineJump = Math.max(lineJump, Math.abs(dl));
      lineFlips += turned(gl, l, dl, f);
    }
  }
  const per = (n, count) => (out.seconds ? n / count / out.seconds : 0);
  return Object.assign(out, {
    maxJump, maxJump60, maxKick,
    twitch: per(flips, cells), widthTwitch: per(widthFlips, cells), lineTwitch: per(lineFlips, lines),
    lineJump, swaps,
  });
}

async function recordSweep(browser, url, seed) {
  const context = await browser.newContext({ viewport: { width: 900, height: 320 }, deviceScaleFactor: 1 });
  await context.route('**/dist/mathglyph.js', (route) =>
    route.fulfill({ body: engineSource(true), contentType: 'text/javascript; charset=utf-8' }));
  await context.addInitScript(initScript, seed);
  const page = await context.newPage();
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  await sleep(3000);  // the intro
  // Beside the text, across the second line, down to the fourth, and out at the right.
  const left = await page.evaluate(sweep, { points: [[-0.05, 0.3], [1.05, 0.3], [-0.05, 0.7], [1.05, 0.7]], ms: 1400 });
  const samples = await page.evaluate(() => window.__samples);
  await context.close();
  return {
    hover: phaseStats(samples, 0, left),
    revert: phaseStats(samples, left, Infinity),
  };
}

// Main-thread time per frame while a pointer zig-zags over every line of 2,000 characters.
async function hoverCost(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  await context.route('**/dist/mathglyph.js', (route) =>
    route.fulfill({ body: engineSource(false), contentType: 'text/javascript; charset=utf-8' }));
  const page = await context.newPage();
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await sleep(1000);
  const read = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const before = await read();
  const frames = await page.evaluate((ms) => {
    const el = document.getElementById('fx');
    const box = el.getBoundingClientRect();
    const triangle = (t, period) => 1 - Math.abs(2 * ((t / period) % 1) - 1);
    let first = 0, count = 0;
    return new Promise((resolve) => {
      window.__raw.requestAnimationFrame(function frame(now) {
        if (!first) first = now;
        if (now - first >= ms) return resolve(count);
        count++;
        el.dispatchEvent(new PointerEvent('pointermove', {
          clientX: box.left + box.width * (0.02 + 0.96 * triangle(now - first, 2000)),
          clientY: box.top + box.height * (0.02 + 0.96 * triangle(now - first, ms)),
          bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true,
        }));
        window.__raw.requestAnimationFrame(frame);
      });
    });
  }, HOVER_MS);
  const after = await read();
  await context.close();
  return ((after.TaskDuration - before.TaskDuration) * 1000) / frames;
}

const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

const server = await serveRepo();
const browser = await chromium.launch();
const runs = [];
const costs = [];
try {
  const base = `http://127.0.0.1:${server.address().port}/bench/page.html?impl=canvas`;
  for (let seed = 1; seed <= SEEDS; seed++) {
    console.error(`seed ${seed} of ${SEEDS}`);
    runs.push(await recordSweep(browser, `${base}&mode=preview&rest=plain${modules}`, seed));
    costs.push(await hoverCost(browser, `${base}&chars=2000${modules}`));
  }
} finally {
  await browser.close();
  server.close();
}

const keys = Object.keys(runs[0].hover);
const result = { engine: path.relative(root, engineFile), seeds: SEEDS, mainMsPerFrame: median(costs), hover: {}, revert: {} };
for (const phase of ['hover', 'revert']) {
  for (const key of keys) result[phase][key] = median(runs.map((run) => run[phase][key]));
}
fs.mkdirSync(path.join(root, 'bench', 'results'), { recursive: true });
fs.writeFileSync(path.join(root, 'bench', 'results', 'motion.json'), JSON.stringify({ ...result, runs, costs }, null, 2) + '\n');

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
console.log(`engine ${result.engine}${modules.replaceAll('&', ', ')}, median of ${SEEDS} seeds`);
console.log(`| | hover | revert |\n|---|--:|--:|`);
const names = {
  frames: 'frames', seconds: 'seconds', maxJump: 'max jump, px', maxJump60: 'max jump/60Hz, px', maxKick: 'max kick, px/60Hz frame',
  twitch: 'twitch, /glyph/s', widthTwitch: 'width twitch, /slot/s', lineTwitch: 'line twitch, /line/s',
  lineJump: 'line max jump, px', swaps: 'glyph swaps',
};
for (const key of keys) console.log(`| ${names[key]} | ${fmt(result.hover[key])} | ${fmt(result.revert[key])} |`);
console.log(`\nmain thread per frame, hover over 2,000 characters: ${result.mainMsPerFrame.toFixed(2)} ms`);
