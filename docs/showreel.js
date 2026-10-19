// The showreel: ?showreel plays every layout and effect, a few palettes and languages, full-bleed,
// then an end card. A virtual pointer drives the effects through setPointer, burst and clearPointer.
// ?showreel&seed=N gives another order of the scenes. The same seed gives the same order.
// ?showreel&record does not play: bench/showreel.mjs calls window.showreel.advance(ms) for each
// frame of a video.
//
// The instance stays paused, and one requestAnimationFrame loop moves the virtual pointer and then
// calls step(dt). So the pointer and the glyphs move in the same frame, live and in a recording.
import * as MathGlyph from './mathglyph.js';

const SCENE_MS = 1900;
// In each scene: the text blooms (the intro), the pointer sweeps from IN to OUT, then the text settles.
const IN = 250;
const OUT = 1400;
const END_MS = 2800;
const END = { lines: ['*mathglyph*', 'npm i mathglyph'], anchor: null, wordMap: {}, lookalikes: null, layout: 'lines', effect: 'breathe', palette: 'pastel' };

// The scenes before the shuffle: the first stays first. Each has a layout, an effect, a text and a palette.
// path: how the pointer moves. 'across': a curve over the lines. 'down': over vertical columns.
// 'round': around the ring.
function looks({ LANGUAGES, GALLERY, TABLES }) {
  const layout = GALLERY.layout;
  const columns = (key) => {
    const { lines, anchor, maxSize, font, lang } = layout.columns.texts[key];
    return { lang, lines, anchor, base: maxSize, font, lookalikes: TABLES.cjk, layout: { name: 'columns', columnGap: 0.15 }, path: 'down' };
  };
  // The other languages have two short lines: they take a larger font.
  const language = (code) => ({ lang: code, base: 56, lines: LANGUAGES[code].lines, wordMap: LANGUAGES[code].wordMap || {}, lookalikes: TABLES[LANGUAGES[code].lookalikes] || null });
  return [
    { lang: 'en', lines: LANGUAGES.en.lines, anchor: LANGUAGES.en.anchor, layout: 'lines', effect: 'shatter' },
    { ...columns('hei'), effect: 'cascade' },
    { lang: 'en', lines: layout.grid.lines, layout: 'grid', effect: 'firework', palette: 'shimmer' },
    { lang: 'en', lines: layout.ring.lines, anchor: 'round', base: 30, layout: 'ring', effect: GALLERY.effect['ripple + lens'].stack, path: 'round' },
    { ...language('el'), layout: 'sine', effect: 'lens', palette: 'ice' },
    { ...language('ru'), layout: 'lines', effect: 'ripple', palette: 'ember' },
    { ...columns('ja'), effect: 'firework', bursts: [[1550, 0.5, 0.45]] },
    { ...language('hi'), layout: 'lines', effect: 'breathe', palette: 'shimmer' },
  ];
}

const nameOf = (value) => (typeof value === 'string' ? value : value.name);
const effectNames = (effect) => (Array.isArray(effect) ? effect.map(nameOf) : [nameOf(effect)]);

// Two scenes side by side must differ in layout and effect: ripple + lens counts as both.
function clash(a, b) {
  return nameOf(a.layout) === nameOf(b.layout) || effectNames(a.effect).some((name) => effectNames(b.effect).includes(name));
}

function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle([first, ...scenes], seed) {
  const next = random(seed);
  for (;;) {
    const order = scenes.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.unshift(first);
    if (order.every((scene, i) => !i || !clash(order[i - 1], scene))) return order;
  }
}

// The pointer's way through a scene, in shares of the canvas: x from the left, y from the top.
// Points outside 0..1 are beside the text, so the pointer comes in and goes out.
function pathOf(scene, i) {
  if (scene.path === 'round') {
    const turn = i % 2 ? -1 : 1;
    return Array.from({ length: 9 }, (_, k) => {
      const a = -2.2 + turn * k * 0.95, r = k ? 0.36 : 0.75;
      return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
    });
  }
  const way = scene.path === 'down'
    ? [[1.1, 0.1], [0.78, 0.85], [0.5, 0.2], [0.22, 0.8], [-0.1, 0.35]]
    : [[-0.08, 0.3], [0.3, 0.8], [0.55, 0.25], [0.8, 0.75], [1.08, 0.4]];
  return i % 2 ? way.map(([x, y]) => [1 - x, y]).reverse() : way;
}

// A point on a Catmull-Rom curve through the points, at u from 0 to 1.
function along(points, u) {
  const n = points.length - 1, k = Math.min(n - 1, Math.floor(u * n)), t = u * n - k;
  const p = (j) => points[Math.max(0, Math.min(n, j))];
  const [p0, p1, p2, p3] = [p(k - 1), p(k), p(k + 1), p(k + 2)];
  return [0, 1].map((d) => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t +
    (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t * t + (3 * p1[d] - p0[d] + 3 * p2[d] - p3[d]) * t * t * t));
}

const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function showreel(data) {
  const { MATH_FONT, seed, record, onStop } = data;
  const scenes = shuffle(looks(data), seed);
  const fonts = [MATH_FONT, ...new Set(scenes.map((scene) => scene.font).filter(Boolean))];

  const box = document.createElement('div');
  box.className = 'reel';
  const stage = document.createElement('div');
  stage.className = 'reel-stage';
  box.append(stage);
  document.body.append(box);
  document.body.classList.add('reeling');

  // Every font of every scene loads before the first frame. A scene then names only its own.
  const fx = MathGlyph.mount(stage, { lines: END.lines, fonts, rest: 'plain', intro: false, palette: 'pastel' });
  fx.pause();
  const ready = document.fonts.ready.then(() => new Promise(requestAnimationFrame));

  // maxSize grows with the screen: the demo's hero is 300 px tall. fit fills the whole width, so for
  // text in rows maxSize also leaves a fifth of the width free: slots widen, and effects push glyphs out.
  const scale = () => (0.95 * innerHeight) / 300;
  const ruler = document.createElement('canvas').getContext('2d');
  function maxSizeOf(scene) {
    const size = (scene.base || 44) * scale();
    // Columns grow along their length as slots widen: on a narrow screen the width limits them too.
    if (scene.path === 'down') return Math.round(Math.min(size, 0.2 * stage.clientWidth));
    if (scene.path) return Math.round(size);
    ruler.font = `100px ${MathGlyph.defaults.font}`;
    const widest = Math.max(...scene.lines.map((line) => ruler.measureText(line.replace(/\*/g, '')).width));
    return Math.round(Math.min(size, (80 * stage.clientWidth) / widest));
  }
  let now = 0, at = -1, size = { w: 0, h: 0 };

  function show(scene) {
    stage.lang = scene.lang || 'en';
    fx.update({
      lines: scene.lines,
      anchor: scene.anchor || null,
      wordMap: scene.wordMap || {},
      lookalikes: scene.lookalikes || null,
      fonts: scene.font ? [MATH_FONT, scene.font] : [MATH_FONT],
      layout: scene.layout,
      effect: scene.effect,
      palette: scene.palette || 'pastel',
      maxSize: maxSizeOf(scene),
      intro: true,
    });
    fx.replay();
    const canvas = stage.firstChild;
    size = { w: canvas.offsetWidth, h: canvas.offsetHeight };
  }

  // Moves the showreel on by ms: the scene, then the pointer, then the glyphs.
  function advance(ms) {
    now += ms;
    const i = Math.floor(now / SCENE_MS);
    if (i !== at && i <= scenes.length) {
      at = i;
      show(scenes[i] || END);
    }
    const scene = scenes[i];
    const t = now - i * SCENE_MS;
    if (scene && t >= IN && t < OUT) {
      const [x, y] = along(pathOf(scene, i), ease((t - IN) / (OUT - IN)));
      fx.setPointer(x * size.w, y * size.h);
    } else if (scene && t - ms < OUT && t >= OUT) {
      fx.clearPointer();
    }
    for (const [when, x, y] of (scene && scene.bursts) || []) {
      if (t - ms < when && t >= when) fx.burst(x * size.w, y * size.h);
    }
    fx.step(ms);
  }

  const duration = scenes.length * SCENE_MS + END_MS;
  if (record) {
    window.showreel = { ready, duration, advance };
    return;
  }

  // Live: the showreel plays in a loop until a key, a touch or a real pointer move.
  let raf = 0, last = 0, from = null;
  function frame(time) {
    advance(last ? Math.min(time - last, 50) : 1000 / 60);
    last = time;
    if (now >= duration) { now = 0; at = -1; }
    raf = requestAnimationFrame(frame);
  }
  ready.then(() => { raf = requestAnimationFrame(frame); });

  const started = performance.now();
  function stop() {
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', onMove, true);
    for (const type of ['keydown', 'pointerdown', 'wheel']) removeEventListener(type, stop, true);
    fx.destroy();
    box.remove();
    document.body.classList.remove('reeling');
    onStop();
  }
  // A browser can send a pointer move when the page changes under a still mouse: only a real move stops.
  function onMove(event) {
    if (event.pointerType !== 'mouse') return stop();
    if (performance.now() - started < 800) return;
    from = from || [event.clientX, event.clientY];
    if (Math.hypot(event.clientX - from[0], event.clientY - from[1]) > 8) stop();
  }
  addEventListener('pointermove', onMove, true);
  for (const type of ['keydown', 'pointerdown', 'wheel']) addEventListener(type, stop, true);
}
