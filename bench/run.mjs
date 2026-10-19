// Benchmark: the original script against the new engine, or each hover effect of the new engine.
// (The DOM renderer in the README table was measured at commit 1f75b33, where it still existed.)
//
//   node bench/run.mjs [original] [canvas] [--runs=3] [--chars=2000]
//   node bench/run.mjs effects [breathe] [ripple] [ripple,lens] ... [--runs=3] [--chars=2000]
//   node bench/run.mjs idle [--runs=3] [--chars=2000]
//
// effects: only the hover test, once per effect (default: breathe, every module in dist/effects, and
// the stack ripple,lens). Names with commas are a stack, in the bench page's effects syntax.
//
// Needs playwright (with its Chromium) and esbuild where require() finds them: a node_modules
// folder or NODE_PATH. Linux only, because the browser's CPU time comes from /proc.
// Prints Markdown tables on stdout (progress goes to stderr) and writes bench/results/latest.json.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const resultsDir = path.join(root, 'bench', 'results');

const FILES = { original: 'bench/results/original.js', canvas: 'dist/mathglyph.js' };
const VIEWPORT = { width: 1400, height: 1000 };
const HOVER_MS = 5000;
const IDLE_MS = 10000;
const OFFSCREEN_MS = 5000;
const CLOCK_TICKS = Number(execFileSync('getconf', ['CLK_TCK'], { encoding: 'utf8' }));

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

// The original script is src/mathglyph.js as of the first commit.
export function writeOriginal() {
  const firstCommit = git('rev-list', '--max-parents=0', 'HEAD').trim().split('\n').pop();
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(path.join(resultsDir, 'original.js'), git('show', `${firstCommit}:src/mathglyph.js`));
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// Serves the repo root on 127.0.0.1 and a free port.
export async function serveRepo() {
  const server = http.createServer((request, response) => {
    const file = path.join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
    fs.readFile(file, (error, data) => {
      if (error) return response.writeHead(404).end();
      response.writeHead(200, {
        'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      response.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

// CPU seconds (user + system) of all processes that descend from this one: the whole browser.
function browserCpuSeconds() {
  const parents = new Map();
  const ticks = new Map();
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    let stat;
    try {
      stat = fs.readFileSync(`/proc/${entry}/stat`, 'utf8');
    } catch {
      continue; // the process ended after readdirSync
    }
    // After the ")" that closes the command name: state, ppid, ... utime is field 14, stime 15.
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    parents.set(Number(entry), Number(fields[1]));
    ticks.set(Number(entry), Number(fields[11]) + Number(fields[12]));
  }
  let total = 0;
  for (const [pid, count] of ticks) {
    for (let parent = parents.get(pid); parent; parent = parents.get(parent)) {
      if (parent === process.pid) {
        total += count;
        break;
      }
    }
  }
  return total / CLOCK_TICKS;
}

async function sample(page) {
  const wakeups = await page.evaluate(() => window.__wakeups);
  return { wakeups, cpu: browserCpuSeconds(), time: performance.now() };
}

const cpuPercent = (before, after) => ((after.cpu - before.cpu) / ((after.time - before.time) / 1000)) * 100;

async function metrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.map((metric) => [metric.name, metric.value]));
}

async function openPage(browser, url) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  return page;
}

// Runs in the page. For `ms`, once per frame, sends a pointermove to the element along a zig-zag:
// left and right every 2 s while going from the top line to the bottom one and back.
// Returns the frame timestamps.
function drivePointer(ms) {
  const element = document.getElementById('fx');
  const box = element.getBoundingClientRect();
  const triangle = (t, period) => 1 - Math.abs(2 * ((t / period) % 1) - 1);
  const stamps = [];
  return new Promise((resolve) => {
    window.__raw.requestAnimationFrame(function frame(now) {
      stamps.push(now);
      const t = now - stamps[0];
      if (t >= ms) return resolve(stamps);
      element.dispatchEvent(new PointerEvent('pointermove', {
        clientX: box.left + box.width * (0.02 + 0.96 * triangle(t, 2000)),
        clientY: box.top + box.height * (0.02 + 0.96 * triangle(t, ms)),
        bubbles: true,
        // As a real mouse sends them, for engines that skip other pointers.
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      }));
      window.__raw.requestAnimationFrame(frame);
    });
  });
}

const sorted = (values) => [...values].sort((a, b) => a - b);
const percentile = (values, p) => sorted(values)[Math.max(0, Math.ceil((p / 100) * values.length) - 1)];

function median(values) {
  const s = sorted(values);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function hoverTest(browser, url) {
  const page = await openPage(browser, url);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await sleep(1000);
  const metricsBefore = await metrics(cdp);
  const before = await sample(page);
  const stamps = await page.evaluate(drivePointer, HOVER_MS);
  const after = await sample(page);
  const metricsAfter = await metrics(cdp);
  await page.close();
  const intervals = stamps.slice(1).map((t, i) => t - stamps[i]);
  const perFrame = (name) => ((metricsAfter[name] - metricsBefore[name]) * 1000) / intervals.length;
  return {
    frames: intervals.length,
    mainMs: perFrame('TaskDuration'),
    scriptMs: perFrame('ScriptDuration'),
    layoutMs: perFrame('LayoutDuration'),
    styleMs: perFrame('RecalcStyleDuration'),
    frameP50: percentile(intervals, 50),
    frameP95: percentile(intervals, 95),
    slowFrames: intervals.filter((interval) => interval > 20).length,
    hoverCpu: cpuPercent(before, after),
    hoverWakeups: after.wakeups - before.wakeups,
  };
}

async function idleTest(browser, url) {
  const page = await openPage(browser, url);
  await sleep(2000);
  const before = await sample(page);
  await sleep(IDLE_MS);
  const after = await sample(page);
  await page.close();
  return { idleWakeups: after.wakeups - before.wakeups, idleCpu: cpuPercent(before, after) };
}

// No input: the idle option moves the text by itself. Starts after its first 1.2 s.
async function idleMotionTest(browser, url) {
  const page = await openPage(browser, url);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await sleep(2000);
  const metricsBefore = await metrics(cdp);
  const before = await sample(page);
  await sleep(HOVER_MS);
  const after = await sample(page);
  const metricsAfter = await metrics(cdp);
  await page.close();
  const wakeups = after.wakeups - before.wakeups;
  const mainMs = (metricsAfter.TaskDuration - metricsBefore.TaskDuration) * 1000;
  return { wakeups, mainMsPerWakeup: mainMs / wakeups, mainMsPerSecond: mainMs / (HOVER_MS / 1000), cpu: cpuPercent(before, after) };
}

async function idleMain(runs, chars) {
  const modes = { 'idle shuffle': { mode: 'shuffle' }, 'idle wander': { mode: 'wander' }, "motion 'always'": null };
  const server = await serveRepo();
  const all = Object.fromEntries(Object.keys(modes).map((name) => [name, []]));
  let version;
  try {
    for (let run = 1; run <= runs; run++) {
      const browser = await chromium.launch();
      try {
        version = browser.version();
        for (const [name, idle] of Object.entries(modes)) {
          console.error(`run ${run} of ${runs}: ${name}`);
          const query = idle ? `options=${encodeURIComponent(JSON.stringify({ idle }))}` : 'motion=always';
          all[name].push(await idleMotionTest(browser, `http://127.0.0.1:${server.address().port}/bench/page.html?impl=canvas&chars=${chars}&${query}`));
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    server.close();
  }
  const out = [
    `**Idle motion**: ${HOVER_MS / 1000} s with no input, ${chars.toLocaleString('en-US')} characters, default settings.`,
    '',
    '| | wakeups | main thread / wakeup | main thread / s | CPU |',
    '|---|--:|--:|--:|--:|',
  ];
  for (const [name, results] of Object.entries(all)) {
    const m = Object.fromEntries(Object.keys(results[0]).map((key) => [key, median(results.map((result) => result[key]))]));
    out.push(`| ${name} | ${Math.round(m.wakeups)} | ${m.mainMsPerWakeup.toFixed(2)} ms | ${m.mainMsPerSecond.toFixed(1)} ms | ${m.cpu.toFixed(1)} % |`);
  }
  out.push('', `Median of ${runs} runs on ${os.type()} ${os.machine()}, headless Chromium ${version}.`);
  console.log(out.join('\n'));
}

// The page has a tall spacer below the text, so scrolling to the end hides the text.
async function offscreenTest(browser, url) {
  const page = await openPage(browser, url);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(1000);
  const before = await sample(page);
  await sleep(OFFSCREEN_MS);
  const after = await sample(page);
  await page.close();
  return { offscreenWakeups: after.wakeups - before.wakeups };
}

// The effect and layout modules in dist/, by name.
function built(kind) {
  const dir = path.join(root, 'dist', kind);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.min.js')).map((f) => f.slice(0, -'.min.js'.length)).sort();
}

function sizes() {
  const { transformSync } = require('esbuild');
  const original = fs.readFileSync(path.join(resultsDir, 'original.js'));
  const files = [
    ['original', original],
    ['original, esbuild minify', Buffer.from(transformSync(original.toString(), { minify: true }).code)],
  ];
  const names = ['dist/mathglyph.min.js', 'dist/mathglyph.iife.min.js', 'dist/mathglyph.all.iife.min.js', 'dist/languages.min.js'];
  for (const kind of ['effects', 'layouts']) names.push(...built(kind).map((name) => `dist/${kind}/${name}.min.js`));
  for (const name of names) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) files.push([name, fs.readFileSync(file)]);
  }
  return files.map(([name, data]) => ({ name, bytes: data.length, gzip: zlib.gzipSync(data, { level: 9 }).length }));
}

function sizeTable(size) {
  const out = ['**Size**', '', '| file | bytes | gzip -9 |', '|---|--:|--:|'];
  for (const file of size) out.push(`| ${file.name} | ${file.bytes.toLocaleString('en-US')} | ${file.gzip.toLocaleString('en-US')} |`);
  return out;
}

function markdown({ machine, chars, runs, median, size }) {
  const count = (n) => Math.round(n).toLocaleString('en-US');
  const ms = (n, digits) => `${n.toFixed(digits)} ms`;
  const percent = (n) => `${n.toFixed(1)} %`;
  const out = [
    `**Hover**: for ${HOVER_MS / 1000} s, one synthetic pointermove per frame zig-zags across every line of ` +
      `${count(chars)} characters (lines of about 80, 1280 px wide).`,
    '',
    '| | frames | main thread / frame | script | layout | style | frame p50 | frame p95 | frames > 20 ms | CPU |',
    '|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|',
  ];
  for (const [variant, m] of Object.entries(median)) {
    out.push(`| ${variant} | ${count(m.frames)} | ${ms(m.mainMs, 2)} | ${ms(m.scriptMs, 2)} | ${ms(m.layoutMs, 2)} | ` +
      `${ms(m.styleMs, 2)} | ${ms(m.frameP50, 1)} | ${ms(m.frameP95, 1)} | ${count(m.slowFrames)} | ${percent(m.hoverCpu)} |`);
  }
  out.push(
    '',
    `**Idle**: ${IDLE_MS / 1000} s with no input after the text settled. ` +
      `**Offscreen**: motion 'always', scrolled out of view, ${OFFSCREEN_MS / 1000} s.`,
    '',
    '| | idle wakeups | idle CPU | offscreen wakeups |',
    '|---|--:|--:|--:|',
  );
  for (const [variant, m] of Object.entries(median)) {
    out.push(`| ${variant} | ${count(m.idleWakeups)} | ${percent(m.idleCpu)} | ${count(m.offscreenWakeups)} |`);
  }
  out.push('', ...sizeTable(size));
  out.push(
    '',
    `Median of ${runs} runs on ${machine}. Per-frame times are the CDP Performance.getMetrics ` +
      'deltas of TaskDuration, ScriptDuration, LayoutDuration and RecalcStyleDuration divided by the frames. ' +
      'CPU is the user and system time of all browser processes, in % of one core. ' +
      'Wakeups are setTimeout, setInterval and requestAnimationFrame callbacks that ran.',
  );
  return out.join('\n');
}

function effectsMarkdown({ machine, chars, runs, median, size }) {
  const ms = (n, digits) => `${n.toFixed(digits)} ms`;
  const out = [
    `**Hover, per effect**: for ${HOVER_MS / 1000} s, one synthetic pointermove per frame zig-zags across every line of ` +
      `${Math.round(chars).toLocaleString('en-US')} characters (lines of about 80, 1280 px wide), layout 'lines'.`,
    '',
    '| effect | frames | main thread / frame | script | frame p50 | frame p95 | frames > 20 ms | CPU |',
    '|---|--:|--:|--:|--:|--:|--:|--:|',
  ];
  for (const [effect, m] of Object.entries(median)) {
    out.push(`| ${effect.replaceAll(',', ' + ')} | ${Math.round(m.frames)} | ${ms(m.mainMs, 2)} | ${ms(m.scriptMs, 2)} | ${ms(m.frameP50, 1)} | ` +
      `${ms(m.frameP95, 1)} | ${Math.round(m.slowFrames)} | ${m.hoverCpu.toFixed(1)} % |`);
  }
  out.push('', ...sizeTable(size), '', `Median of ${runs} runs on ${machine}.`);
  return out.join('\n');
}

// The hover test once per effect, with the effects taking turns in each run. A stack of two effects
// shows what one more effect costs in a frame.
async function effectsMain(asked, runs, chars) {
  const effects = asked.length ? asked : ['breathe', ...built('effects'), 'ripple,lens'];
  const server = await serveRepo();
  const all = Object.fromEntries(effects.map((effect) => [effect, []]));
  let version;
  try {
    for (let run = 1; run <= runs; run++) {
      const browser = await chromium.launch();
      try {
        version = browser.version();
        for (const effect of effects) {
          console.error(`run ${run} of ${runs}: ${effect}`);
          const param = /[,:]/.test(effect) ? 'effects' : 'effect';
          const url = `http://127.0.0.1:${server.address().port}/bench/page.html?impl=canvas&chars=${chars}&${param}=${effect}`;
          all[effect].push(await hoverTest(browser, url));
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    server.close();
  }
  const medians = Object.fromEntries(Object.entries(all).map(([effect, results]) =>
    [effect, Object.fromEntries(Object.keys(results[0]).map((key) => [key, median(results.map((result) => result[key]))]))]));
  const report = { machine: `${os.type()} ${os.machine()}, headless Chromium ${version}`, chars, runs, median: medians, size: sizes(), all };
  fs.writeFileSync(path.join(resultsDir, 'effects.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(effectsMarkdown(report));
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => Number(args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
  const runs = option('runs', 3);
  const chars = option('chars', 2000);
  const asked = args.filter((arg) => !arg.startsWith('--'));
  if (asked[0] === 'idle') {
    await idleMain(runs, chars);
    return;
  }
  if (asked[0] === 'effects') {
    writeOriginal();
    await effectsMain(asked.slice(1), runs, chars);
    return;
  }
  const unknown = asked.filter((variant) => !FILES[variant]);
  if (unknown.length) {
    console.error(`unknown variant ${unknown.join(', ')}: use original or canvas`);
    process.exitCode = 1;
    return;
  }

  writeOriginal();
  const variants = (asked.length ? asked : Object.keys(FILES)).filter((variant) => {
    if (fs.existsSync(path.join(root, FILES[variant]))) return true;
    console.error(`skipping ${variant}: ${FILES[variant]} does not exist (build the engine first)`);
    return false;
  });
  if (!variants.length) {
    console.error('nothing to run');
    process.exitCode = 1;
    return;
  }

  const server = await serveRepo();
  const pageUrl = (variant, motion) =>
    `http://127.0.0.1:${server.address().port}/bench/page.html?impl=${variant}&chars=${chars}&motion=${motion}`;
  const all = Object.fromEntries(variants.map((variant) => [variant, []]));
  let version;
  try {
    // Variants take turns, so that a slow minute on the machine does not land on one of them.
    for (let run = 1; run <= runs; run++) {
      for (const variant of variants) {
        console.error(`run ${run} of ${runs}: ${variant}`);
        const browser = await chromium.launch();
        try {
          version = browser.version();
          const result = {
            ...(await hoverTest(browser, pageUrl(variant, 'hover'))),
            ...(await idleTest(browser, pageUrl(variant, 'hover'))),
            ...(await offscreenTest(browser, pageUrl(variant, 'always'))),
          };
          if (!result.hoverWakeups) console.error(`  ${variant} did not wake up during the hover: is it listening?`);
          all[variant].push(result);
        } finally {
          await browser.close();
        }
      }
    }
  } finally {
    server.close();
  }

  const medians = {};
  for (const [variant, results] of Object.entries(all)) {
    medians[variant] = {};
    for (const key of Object.keys(results[0])) medians[variant][key] = median(results.map((result) => result[key]));
  }
  const report = {
    machine: `${os.type()} ${os.machine()}, headless Chromium ${version}`,
    chars,
    runs,
    median: medians,
    size: sizes(),
    all,
  };
  fs.writeFileSync(path.join(resultsDir, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(markdown(report));
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
