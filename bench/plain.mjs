// Checks that the text always goes back to plain with rest: 'plain' and revert: 0, and that the
// idle page draws no frames.
//
// The demo: after a change in the options panel, after a click in the gallery, after the pointer
// leaves the text or the window, after the window loses focus, and after the page is hidden.
// Every layout with every effect, on the bench page: the pointer crosses the text and leaves, the
// text is plain again, and then no frames run. With reduced motion the pointer changes nothing.
//
//   node bench/plain.mjs [demo | matrix [layout]]
//
// Needs playwright (with its Chromium) where require() finds it: a node_modules folder or NODE_PATH.
// Run npm run build first: the pages load docs/ and dist/. Exits 1 if a check fails.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { root, serveRepo } from './run.mjs';
import { cjk } from '../src/languages.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const SETTLE_MS = 1500;
const INTRO_MS = 2500;  // the intro takes up to about 1.8 s
const IDLE_MS = 2000;
// An effect eases out in about 1 s after the leave, then the revert wave takes about 0.7 s.
const EFFECT_SETTLE_MS = 2500;

// The built-in layout and effect, and every module in dist/.
function modules(kind, builtIn) {
  const dir = path.join(root, 'dist', kind);
  const built = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.min.js')) : [];
  return [builtIn, ...built.map((f) => f.slice(0, -'.min.js'.length)).sort()];
}
const LAYOUTS = modules('layouts', 'lines').filter((name) => !process.argv[3] || name === process.argv[3]);
const EFFECTS = modules('effects', 'breathe');

const only = process.argv[2];
const server = await serveRepo();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const failures = [];
function report(name, ok, detail = '') {
  if (!ok) failures.push(name);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail}`);
}

async function demoChecks() {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // Counts the animation frames the page asks for.
  await page.addInitScript(() => {
    window.__frames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => { window.__frames++; return raf(f); };
  });
  await page.goto(`${base}/docs/index.html`);
  await page.waitForSelector('#hero canvas');
  await page.evaluate(() => document.fonts.ready);
  // The options sit in folded sections: open them all, so that every control is in reach.
  await page.locator('#open-all').click();
  await sleep(3000);  // the intro
  await page.evaluate(() => {
    const el = document.getElementById('revert');
    el.value = 0;
    el.dispatchEvent(new Event('input'));
  });

  const canvas = page.locator('#hero canvas');
  const box = await canvas.boundingBox();
  const pixels = () => canvas.evaluate((c) => c.toDataURL());
  // Plain text for the options as they are now: rest 'glyphs', then back to 'plain'.
  async function plainPixels() {
    await page.evaluate(() => {
      const el = document.getElementById('rest-plain');
      for (const on of [false, true]) {
        el.checked = on;
        el.dispatchEvent(new Event('change'));
      }
    });
    await sleep(SETTLE_MS);
    return pixels();
  }
  // Moves the real mouse across every line of the text and stops on it.
  async function hover() {
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const y = box.y + ((r + 0.5) / rows) * box.height;
      await page.mouse.move(box.x + box.width * 0.1, y);
      await page.mouse.move(box.x + box.width * 0.9, y, { steps: 12 });
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  }
  async function check(name, act, wait = SETTLE_MS) {
    await act();
    await sleep(wait);
    const got = await pixels();
    const plain = await plainPixels();
    report(name, got === plain);
  }

  const sliders = await page.locator('input[type=range]').evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => e.id));
  for (const id of sliders) {
    await check(`hover, then drag the "${id}" slider`, async () => {
      await hover();
      const s = await page.locator(`#${id}`).boundingBox();
      await page.mouse.move(s.x + s.width * 0.3, s.y + s.height / 2, { steps: 4 });
      await page.mouse.down();
      await page.mouse.move(s.x + s.width * 0.6, s.y + s.height / 2, { steps: 6 });
      await page.mouse.up();
      if (id !== 'revert') return;
      await page.evaluate(() => {
        const el = document.getElementById('revert');
        el.value = 0;
        el.dispatchEvent(new Event('input'));
      });
    });
  }
  await check('hover, then change the anchor', async () => {
    await hover();
    await page.locator('#anchor').fill('symbols');
    await page.locator('#anchor').press('Enter');
    await page.locator('#anchor').blur();
  });
  await check('click "reroll"', () => page.locator('#reroll').click());
  await check('click "replay"', () => page.locator('#replay').click(), INTRO_MS);
  await check('hover, then leave the text', async () => {
    await hover();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 150, { steps: 2 });
  });
  // The browser sends pointerout with no relatedTarget when the pointer leaves the window.
  await check('hover, then leave the window', async () => {
    await hover();
    await page.evaluate(() => document.documentElement.dispatchEvent(
      new PointerEvent('pointerout', { bubbles: true, relatedTarget: null })));
  });
  await check('hover, then the window loses focus', async () => {
    await hover();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  });
  await check('hover, then the page is hidden and shown again', async () => {
    await hover();
    const setHidden = (hidden) => page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { value: h, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: h ? 'hidden' : 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    await setHidden(true);
    await sleep(500);
    await setHidden(false);
  });

  // The gallery: each layout and effect, applied to the hero.
  for (const item of await page.locator('[data-layout], [data-effect]').all()) {
    const name = (await item.getAttribute('data-layout')) ?? (await item.getAttribute('data-effect'));
    const kind = (await item.getAttribute('data-layout')) ? 'layout' : 'effect';
    await check(`click the ${kind} "${name}" in the gallery, hover, then leave`, async () => {
      await item.click();
      await sleep(SETTLE_MS);
      Object.assign(box, await canvas.boundingBox());
      await hover();
      await page.mouse.move(2, 2, { steps: 2 });
    }, EFFECT_SETTLE_MS);
  }

  await page.mouse.move(2, 2);
  await sleep(SETTLE_MS);
  const before = await page.evaluate(() => window.__frames);
  await sleep(IDLE_MS);
  const frames = (await page.evaluate(() => window.__frames)) - before;
  report(`demo idle for ${IDLE_MS / 1000} s`, !frames, `: ${frames} frames`);
  await page.close();
}

// One layout with one effect on the bench page, with the README text and its anchor: the real mouse
// crosses every line and leaves, then the text must be plain again and no timer or frame may run.
// With reduced motion the pointer must change nothing at all.
async function combo(context, layout, effect, reduced, options = '', label = options) {
  const page = await context.newPage();
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}/bench/page.html?impl=canvas&mode=preview&rest=plain&intro=0&layout=${layout}&effect=${effect}` +
    (options && `&options=${encodeURIComponent(options)}`));
  await page.evaluate(() => window.__ready);
  await sleep(600);
  const canvas = page.locator('#fx canvas');
  const pixels = () => canvas.evaluate((c) => c.toDataURL());
  const plain = await pixels();
  const box = await canvas.boundingBox();
  // Something must change while the pointer crosses the text: across each row, then down each
  // column, as columns of vertical text are narrow. The middle of a ring is empty, so look after
  // each pass, not after the pointer stops.
  const passes = 5;
  let moved = false;
  for (const across of [true, false]) {
    for (let r = 0; r < passes; r++) {
      const at = (r + 0.5) / passes;
      const [x0, y0, x1, y1] = across ? [0.05, at, 0.95, at] : [at, 0.05, at, 0.95];
      await page.mouse.move(box.x + box.width * x0, box.y + box.height * y0);
      await page.mouse.move(box.x + box.width * x1, box.y + box.height * y1, { steps: 16 });
      moved ||= (await pixels()) !== plain;
    }
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
  await sleep(300);
  await page.mouse.move(2, 2, { steps: 2 });
  await sleep(EFFECT_SETTLE_MS);
  const back = (await pixels()) === plain;
  const before = await page.evaluate(() => window.__wakeups);
  await sleep(IDLE_MS);
  const wakeups = (await page.evaluate(() => window.__wakeups)) - before;
  await page.close();
  const name = `${layout} × ${effect}${reduced ? ', reduced motion' : ''}${label && `, ${label}`}`;
  if (reduced) report(`${name}: the pointer changes nothing, then idle`, !moved && back && !wakeups, `: ${wakeups} wakeups`);
  else report(`${name}: hover, leave, plain again, then idle`, moved && back && !wakeups,
    `: ${moved ? '' : 'nothing moved, '}${back ? '' : 'not plain, '}${wakeups} wakeups`);
}

async function matrix() {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
  for (const layout of LAYOUTS) {
    for (const effect of EFFECTS) await combo(context, layout, effect, false);
  }
  for (const effect of EFFECTS) await combo(context, 'lines', effect, true);
  // The most varied boxes: big jitter, wide spans, a box on most woken glyphs.
  for (const layout of LAYOUTS) await combo(context, layout, 'breathe', false, '{"boxJitter":1,"boxSpan":4,"box":1}');
  // The gallery's cards: short Chinese columns with the CJK table, and a short ring, both anchored.
  for (const effect of EFFECTS) {
    if (LAYOUTS.includes('columns')) {
      const options = { lines: ['一字一变量', '一句一证明', '符号*呼吸*着', '又归于平淡'], anchor: '呼吸', lookalikes: cjk, maxSize: 34 };
      await combo(context, 'columns', effect, false, JSON.stringify(options), 'the CJK card');
    }
    if (LAYOUTS.includes('ring')) {
      const options = { lines: ['every letter goes *round*'], anchor: 'round', maxSize: 30 };
      await combo(context, 'ring', effect, false, JSON.stringify(options), 'the ring card');
    }
  }
  await context.close();
}

try {
  if (only !== 'matrix') await demoChecks();
  if (only !== 'demo') await matrix();
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(`${failures.length} failed`);
  process.exit(1);
}
