// Checks that the text always goes back to plain with rest: 'plain' and revert: 0, and that the
// idle page draws no frames.
//
// The demo: after a change in the options panel, after a click in the gallery, after the pointer
// leaves the text or the window, after the window loses focus, and after the page is hidden. Its
// hero keeps one height when the layout or the language changes.
// Every layout with every effect, on the bench page: the pointer crosses the text and leaves, the
// text is plain again, and then no frames run. With reduced motion the pointer changes nothing.
// The layouts include 'sine', the custom layout in docs/examples/.
// Stacks of effects, each on 'lines' and on one other layout, in the same way, and one with reduced
// motion.
// The hooks of mount() on the bench page: burst(), setPointer(), clearPointer(), pause(), step(),
// resume(), on() and off().
//
//   node bench/plain.mjs [demo] [matrix [layout]] [stacks] [hooks]
//
// With no part named, all of them run. A layout name runs the matrix for that layout only, so
// node bench/plain.mjs matrix sine stacks hooks runs the custom layout, the stacks and the hooks.
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
const PARTS = ['demo', 'matrix', 'stacks', 'hooks'];
const args = process.argv.slice(2);
const wanted = (part) => !args.some((arg) => PARTS.includes(arg)) || args.includes(part);
const oneLayout = args.find((arg) => !PARTS.includes(arg));
// 'sine' is not in dist/: the page loads it from docs/examples/.
const LAYOUTS = [...modules('layouts', 'lines'), 'sine'].filter((name) => !oneLayout || name === oneLayout);
const EFFECTS = modules('effects', 'breathe');
// Stacks in the page's effects syntax (name:strength), each with the layout it runs on besides
// 'lines': a strength below 1, two effects with paint(), and an effect without frame().
const STACKS = [['ripple,lens:0.5', 'grid'], ['firework,shatter', 'ring'], ['breathe,cascade', 'columns']];

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
    // The chosen card, and only it, shows as chosen. So does its switch in the bar, if it has one.
    const chosen = await page.evaluate((kind) => ({
      cards: [...document.querySelectorAll(`#gallery .card[data-${kind}][aria-pressed=true]`)].map((card) => card.dataset[kind]),
      bar: [...document.querySelectorAll(`#bar-${kind} [aria-pressed=true]`)].map((button) => button.value),
      inBar: [...document.querySelectorAll(`#bar-${kind} button`)].map((button) => button.value),
    }), kind);
    report(`the ${kind} "${name}" shows as chosen`,
      chosen.cards.join() === name && chosen.bar.join() === (chosen.inBar.includes(name) ? name : ''),
      `: cards ${chosen.cards.join() || 'none'}, bar ${chosen.bar.join() || 'none'}`);
  }

  await page.mouse.move(2, 2);
  await sleep(SETTLE_MS);
  const before = await page.evaluate(() => window.__frames);
  await sleep(IDLE_MS);
  const frames = (await page.evaluate(() => window.__frames)) - before;
  report(`demo idle for ${IDLE_MS / 1000} s`, !frames, `: ${frames} frames`);
  await page.close();
}

// The demo's hero is as tall for every layout and every language of the columns card, at a phone's
// width and a desktop's, so that the page under it does not move when they change.
async function heroChecks() {
  for (const width of [390, 1400]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${base}/docs/index.html`);
    await page.waitForSelector('#hero canvas');
    const sizes = [];
    const measure = async () => {
      await sleep(SETTLE_MS);
      sizes.push(await page.evaluate(() => [document.getElementById('hero').offsetHeight, document.querySelector('.bar').offsetTop]));
    };
    for (const button of await page.locator('#bar-layout button').all()) {
      await button.click();
      await measure();
    }
    for (const chip of await page.locator('.picker [data-text]').all()) {
      await chip.click();
      await page.locator('[data-layout="columns"]').click();
      await measure();
    }
    const same = sizes.every(([h, top]) => h === sizes[0][0] && top === sizes[0][1]);
    report(`hero at ${width} px: one height for every layout and language`, same, `: ${sizes.map(([h]) => h).join(', ')} px`);
    await page.close();
  }
}

// One layout with one effect or a stack on the bench page, with the README text and its anchor: the
// real mouse crosses every line and leaves, then the text must be plain again and no timer or frame
// may run. With reduced motion the pointer must change nothing at all.
async function combo(context, layout, effect, reduced, options = '', label = options) {
  const page = await context.newPage();
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  const param = /[,:]/.test(effect) ? 'effects' : 'effect';
  await page.goto(`${base}/bench/page.html?impl=canvas&mode=preview&rest=plain&intro=0&layout=${layout}&${param}=${effect}` +
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
  const shown = effect.replaceAll(',', ' + ').replaceAll(':', ' at ');
  const name = `${layout} × ${shown}${reduced ? ', reduced motion' : ''}${label && `, ${label}`}`;
  if (reduced) report(`${name}: the pointer changes nothing, then idle`, !moved && back && !wakeups, `: ${wakeups} wakeups`);
  else report(`${name}: hover, leave, plain again, then idle`, moved && back && !wakeups,
    `: ${moved ? '' : 'nothing moved, '}${back ? '' : 'not plain, '}${wakeups} wakeups`);
}

async function matrix() {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
  for (const layout of LAYOUTS) {
    for (const effect of EFFECTS) await combo(context, layout, effect, false);
  }
  if (LAYOUTS.includes('lines')) {
    for (const effect of EFFECTS) await combo(context, 'lines', effect, true);
  }
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

async function stacks() {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
  for (const [stack, other] of STACKS) {
    for (const layout of ['lines', other]) await combo(context, layout, stack, false);
  }
  await combo(context, 'lines', STACKS[0][0], true);
  await context.close();
}

// The hooks of mount(), with rest: 'plain' and the ripple effect, so that step() drives an effect's
// frame() too. A burst at the middle of the text changes it, then the text is plain again and no
// timer or frame runs; 'wake' and 'settle' fire once for that burst, and not after off(). While
// paused, setPointer() draws nothing, step() moves the text, and clearPointer() with enough steps
// leaves it plain. After resume() no timer or frame runs.
async function hooks() {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  await page.goto(`${base}/bench/page.html?impl=canvas&mode=preview&rest=plain&intro=0&effect=ripple`);
  await page.evaluate(() => window.__ready);
  await sleep(600);
  const canvas = page.locator('#fx canvas');
  const pixels = () => canvas.evaluate((c) => c.toDataURL());
  const wakeups = () => page.evaluate(() => window.__wakeups);
  const box = await canvas.boundingBox();
  const middle = [box.width / 2, box.height / 2];
  const step = (frames) => page.evaluate((n) => {
    for (let k = 0; k < n; k++) window.__fx.step(1000 / 60);
  }, frames);
  const plain = await pixels();

  await page.evaluate(() => {
    window.__events = { wake: 0, settle: 0 };
    window.__onWake = () => window.__events.wake++;
    window.__fx.on('wake', window.__onWake);
    window.__offSettle = window.__fx.on('settle', () => window.__events.settle++);
  });
  await page.evaluate(([x, y]) => window.__fx.burst(x, y), middle);
  await sleep(300);
  const changed = (await pixels()) !== plain;
  await sleep(EFFECT_SETTLE_MS);
  const back = (await pixels()) === plain;
  let before = await wakeups();
  await sleep(IDLE_MS);
  let idle = (await wakeups()) - before;
  report('hooks: burst() at the middle, plain again, then idle', changed && back && !idle,
    `: ${changed ? '' : 'nothing changed, '}${back ? '' : 'not plain, '}${idle} wakeups`);
  const events = await page.evaluate(() => {
    const counted = { ...window.__events };
    window.__fx.off('wake', window.__onWake);
    window.__offSettle();
    return counted;
  });

  await page.evaluate(() => window.__fx.pause());
  before = await wakeups();
  await page.evaluate(([x, y]) => window.__fx.setPointer(x, y), middle);
  await sleep(300);
  const drawn = (await pixels()) !== plain;
  const pointed = (await wakeups()) - before;
  report('hooks: paused, setPointer() draws no frame', !drawn && !pointed, `: ${drawn ? 'drawn, ' : ''}${pointed} wakeups`);
  await step(10);
  const moved = (await pixels()) !== plain;
  await page.evaluate(() => window.__fx.clearPointer());
  await step(180);
  const stepped = (await pixels()) === plain;
  const pausedWakeups = (await wakeups()) - before;
  report('hooks: paused, step() moves the text, then clearPointer() and steps leave it plain', moved && stepped && !pausedWakeups,
    `: ${moved ? '' : 'nothing moved, '}${stepped ? '' : 'not plain, '}${pausedWakeups} wakeups`);

  await page.evaluate(() => window.__fx.resume());
  await sleep(500);
  const resumed = (await pixels()) === plain;
  before = await wakeups();
  await sleep(IDLE_MS);
  idle = (await wakeups()) - before;
  report('hooks: after resume(), plain, then idle', resumed && !idle, `: ${resumed ? '' : 'not plain, '}${idle} wakeups`);

  const after = await page.evaluate(() => window.__events);
  report(`hooks: 'wake' and 'settle' fire once for one burst, and not after off()`,
    events.wake === 1 && events.settle === 1 && after.wake === 1 && after.settle === 1,
    `: wake ${events.wake}, settle ${events.settle}; after off(): wake ${after.wake}, settle ${after.settle}`);
  await page.close();
}

try {
  if (wanted('demo')) {
    await demoChecks();
    await heroChecks();
  }
  if (wanted('matrix')) await matrix();
  if (wanted('stacks')) await stacks();
  if (wanted('hooks')) await hooks();
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(`${failures.length} failed`);
  process.exit(1);
}
