// Records the demo's showreel (docs/index.html?showreel) as an H.264 MP4, frame by frame at 60 fps:
// the page stays paused, and each frame moves it on by exactly 1/60 s with step(), so no frame drops.
//
//   node bench/showreel.mjs out.mp4 [width] [height] [seed] [dpr]
//
// Default: 1080 x 1080, seed 1, device pixel ratio 1. With dpr 2 the page draws at twice the size and
// ffmpeg scales each frame down. Math.random gets a fixed seed, so the same arguments give the same video.
// Frames go to ffmpeg through a pipe: nothing is written to disk but the MP4.
//
// Needs playwright (with its Chromium) where require() finds it, and ffmpeg on PATH or in FFMPEG.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { serveRepo } from './run.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [out, width = 1080, height = 1080, seed = 1, dpr = 1] = process.argv.slice(2);
if (!out) {
  console.error('usage: node bench/showreel.mjs out.mp4 [width] [height] [seed] [dpr]');
  process.exit(2);
}
const FPS = 60;

const server = await serveRepo();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) }, deviceScaleFactor: Number(dpr) });
await page.addInitScript(() => {
  let s = 12345;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
});
page.on('pageerror', (error) => console.error('page:', error.message));
await page.goto(`http://127.0.0.1:${server.address().port}/docs/index.html?showreel&record&seed=${seed}`);
await page.waitForFunction(() => window.showreel);
const duration = await page.evaluate(() => window.showreel.ready.then(() => window.showreel.duration));
const frames = Math.round((duration / 1000) * FPS);

const ffmpeg = spawn(process.env.FFMPEG || 'ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', `scale=${width}:${height}:flags=lanczos`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-an', '-map_metadata', '-1', '-map_metadata:s:v', '-1', '-metadata:s:v', 'encoder=', '-fflags', '+bitexact', '-flags:v', '+bitexact', '-movflags', '+faststart',
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((resolve, reject) => ffmpeg.on('close', (code) => (code ? reject(new Error(`ffmpeg exit ${code}`)) : resolve())));

for (let i = 0; i < frames; i++) {
  await page.evaluate((ms) => window.showreel.advance(ms), 1000 / FPS);
  const png = await page.screenshot({ type: 'png' });
  if (!ffmpeg.stdin.write(png)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
  if (i % 120 === 0) console.log(`frame ${i} / ${frames}`);
}
ffmpeg.stdin.end();
await done;
await browser.close();
server.close();
console.log(`${out}: ${frames} frames, ${(frames / FPS).toFixed(2)} s`);
