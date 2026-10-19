// Checks that the demo with rest: 'plain' and revert: 0 always goes back to plain text: after a
// change in the options panel, after the pointer leaves the text or the window, after the window
// loses focus, and after the page is hidden. Then it checks that the idle page draws no frames.
//
//   node bench/plain.mjs
//
// Needs playwright (with its Chromium) where require() finds it: a node_modules folder or NODE_PATH.
// Run npm run build first: the demo loads docs/mathglyph.js. Exits 1 if a check fails.

import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';
import { serveRepo } from './run.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const SETTLE_MS = 1500;
const INTRO_MS = 2500;  // the intro takes up to about 1.8 s
const IDLE_MS = 2000;

const server = await serveRepo();
const browser = await chromium.launch();
const failures = [];
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // Counts the animation frames the page asks for.
  await page.addInitScript(() => {
    window.__frames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => { window.__frames++; return raf(f); };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/docs/index.html`);
  await page.waitForSelector('#hero canvas');
  await page.evaluate(() => document.fonts.ready);
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
    const ok = got === plain;
    if (!ok) failures.push(name);
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  }

  const sliders = await page.locator('input[type=range]').evaluateAll((els) => els.map((e) => e.id));
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

  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 150);
  await sleep(SETTLE_MS);
  const before = await page.evaluate(() => window.__frames);
  await sleep(IDLE_MS);
  const frames = (await page.evaluate(() => window.__frames)) - before;
  if (frames) failures.push('idle');
  console.log(`${frames ? 'FAIL' : 'ok  '} idle for ${IDLE_MS / 1000} s: ${frames} frames`);
} finally {
  await browser.close();
  server.close();
}
if (failures.length) {
  console.error(`${failures.length} failed`);
  process.exit(1);
}
