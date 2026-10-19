/*
  mathglyph
  A monospace "glyph noise" text effect: plain code-font text where some letters
  swap to math alphabets (𝕋 𝒢 𝔣 𝑛), Greek look-alikes (σ χ φ) and operators
  (⊨ ⊗ ∈ ↑), some get colored, and some get little outlined boxes.
  Each character's slot grows to fit the glyph it shows, so lines breathe wider
  as wide symbols swap in. Moving the pointer over the text scrambles the
  characters near it. Slot widths move on critically damped springs, so they never
  jump or turn back when a glyph changes mid-motion, and lines centre on them.
  With rest: 'plain' the text is plain until the pointer touches it, and goes
  back to plain a few seconds after the pointer leaves.

  Usage:
    import { mount } from './mathglyph.js';
    const hero = mount(document.getElementById('hero'), {
      lines: ['first line', 'a *highlighted* word'],   // *stars* = white, kept readable at rest
    });
    hero.update({ substitute: 0.4 });   // change any option live
    hero.replay();                      // run the intro again
    hero.destroy();

  The options are listed in DEFAULTS below and explained in the README.

  A layout places the slots and an effect says what the pointer does. Both are plain
  objects (see mathglyph.d.ts): 'lines' and 'breathe' are built in, the others are
  modules in src/layouts and src/effects, added with register().

  Speed: one requestAnimationFrame loop that runs only while something moves,
  stops off screen and in hidden tabs, and never reads layout. Glyph widths are
  measured once per font; slot positions are plain numbers kept here.
*/
var BASE = { bold: 0x1D400, italic: 0x1D434, script: 0x1D49C, fraktur: 0x1D504, double: 0x1D538 };
// Letters that Unicode keeps outside the Mathematical Alphanumeric block.
var HOLES = {
  italic:  { h: 'ℎ' },
  script:  { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ',
             M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
  fraktur: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
  double:  { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
};
// Math-alphabet Greek: bold, italic, bold italic, sans bold, sans bold italic.
var GREEK_STYLES = [0x1D6A8, 0x1D6E2, 0x1D71C, 0x1D756, 0x1D790];
var GREEK = {
  a: 'α', b: 'β', e: 'ε', o: 'σ', x: 'χ', n: 'η', p: 'φ', t: 'τ', u: 'υ', w: 'ω',
  i: 'ι', k: 'κ', m: 'μ', v: 'ν', y: 'γ', d: '∂', l: 'λ',
  A: 'Δ', E: 'Σ', L: 'Λ', M: 'Π', O: 'Ω', P: 'Φ', T: 'Τ', W: 'Ψ'
};
// Symbols that look like a given letter, used by the 'legible' option.
// Greek and Cyrillic tables are in languages.js; pass them as `lookalikes`.
var LOOKALIKE = {
  A: '∀Λ∆', a: '∂α', B: 'β', b: 'β', C: '⊂ℂ∁', c: '⊂', D: '∂', d: '∂', E: '∃∈Σ', e: '∈ε',
  F: '∫', f: '∫', H: 'ℍ', h: 'ℏ', I: '∣', i: 'ι', J: '⌋', j: '⌋', K: 'κ', k: 'κ',
  L: '⌊∟', l: 'ℓ∣', N: 'ℕ', n: '∩η', O: '∅Θ⊕○', o: '∘σ⊙', P: 'ℙρ', p: 'ρ', Q: 'ℚ',
  R: 'ℝ', S: '∫§', s: '∫', T: '⊤', t: '†τ', U: '∪', u: '∪μ', V: '∨√', v: '∨ν',
  W: 'ω', w: 'ω', X: '×χ', x: '×χ', Y: 'γ', y: 'γ', Z: 'ℤ', '0': '∅', '1': '∣', '3': '∃'
};

// Letters of other scripts that look like a Latin letter, for the `scripts` option. Letters whose
// look-alike looks the same (Greek Α, Cyrillic А) are left out: swapping to them shows nothing.
var SCRIPTS = {
  greek: {
    A: 'ΛΔ', B: 'β', E: 'ΣΞ', N: 'Π', O: 'ΘΦ', W: 'Ψ', Y: 'Ψ', a: 'α', b: 'β', c: 'ς', d: 'δ',
    e: 'εξ', i: 'ι', k: 'κ', n: 'ηπ', o: 'σθ', p: 'ρ', t: 'τ', u: 'υμ', v: 'ν', w: 'ωψ', x: 'χ',
    y: 'γ', z: 'ζ'
  },
  cyrillic: {
    A: 'Д', B: 'Б', E: 'ЭЁ', I: 'Ї', N: 'ИЙ', O: 'Ф', R: 'Я', U: 'Ц', W: 'Ш', X: 'Ж', Y: 'У',
    a: 'д', b: 'ь', e: 'э', h: 'ћ', i: 'ї', k: 'к', n: 'п', o: 'ф', r: 'г', t: 'т', u: 'ц',
    w: 'ш', x: 'ж', y: 'ч'
  }
};

// Words that have a symbol meaning the same thing, used by the 'words' option.
var WORDS = {
  and: '∧', or: '∨', not: '¬', no: '¬', therefore: '∴', so: '∴', because: '∵', since: '∵',
  to: '→', into: '→', then: '⇒', implies: '⇒', iff: '⇔', 'in': '∈', every: '∀', all: '∀',
  each: '∀', some: '∃', exists: '∃', about: '≈', approximately: '≈', roughly: '≈',
  forever: '∞', infinite: '∞', infinity: '∞', change: 'Δ', delta: 'Δ', equals: '=',
  plus: '+', minus: '−', times: '×', sum: '∑', integral: '∫', nothing: '∅', none: '∅',
  empty: '∅', less: '<', more: '>', at: '@', per: '/', percent: '%', section: '§',
  pi: 'π', lambda: 'λ', between: '↔', from: '←', proof: '∎', qed: '∎'
};

// Symbol groups. Symbols are single characters; tokens are short multi-character
// bits of notation that only appear when slots can widen (expand: true).
// Nothing here uses Latin letters, so a swap never reads as a different word.
// A swap first picks a group at random, then a symbol in it, so big groups
// (like Greek) don't crowd out small ones.
var T = '︎';  // forces text style, so ♀ and ♂ don't turn into emoji
function S(str) { return Array.from(str); }
var SETS = {
  general:   { label: 'General',        symbols: S('÷∼≺≻≠≤≥≈↖{}±√∛×⋅…'),
               tokens: ['±1', '√2', '½', '¾'] },
  calculus:  { label: 'Calculus',       symbols: S('∑∏∐∫∬∭∮∯∂∇′″∞∆'),
               tokens: ['∫₀', '∑₁', '∂²', '∇²', '∫∫', '∂∂'] },
  logic:     { label: 'Logic & sets',   symbols: S('∀∃∄¬∧∨⊻⊼⊢⊣⊨⊤⊥⇒⇔∈∉∋⊂⊃⊆⊇⊊∪∩∖∅ℵℶ'),
               tokens: ['ℵ₀', '¬∃', '⊢⊥', '⇔¬'] },
  linalg:    { label: 'Linear algebra', symbols: S('⊗⊕⊖⊙⊘⊥⟨⟩†‖⊺⋅×'),
               tokens: ['⊗²', '⊕²', '⟨·⟩', '‖·‖', '⊗³'] },
  numbers:   { label: 'Number theory',  symbols: S('∣∤≡≢⌊⌋⌈⌉ℤℚℕℝℂℙ'),
               tokens: ['ℤ₂', 'ℤ₇', 'ℚ²', 'ℝ³', 'ℂ²', '⌊·⌋'] },
  geometry:  { label: 'Geometry',       symbols: S('△▱□○∠∡∢∟⊥∥∦≅≃∼⌒°π'),
               tokens: ['2π', 'π²', '∠°', '△≅△'] },
  statistics:{ label: 'Statistics',     symbols: S('∼≈∓±‰∝𝔼ℙ𝕍⫫∣μσρχ'),
               tokens: ['σ²', 'χ²', 'ρ²', 'μ₀', '𝔼[·]', 'ℙ(·)'] },
  physics:   { label: 'Physics',        symbols: S('ℏ∝°Å∂∇∮⟨⟩∣ℓ⊙∞'),
               tokens: ['ℏω', '∂²', 'Δφ', '∇²', '∇×', '∇·', '⟨ψ|', '|ψ⟩', 'γ⁰'] },
  engineering:{ label: 'Engineering',   symbols: S('∠∥△⊙Ω⌀±°∝≈'),
               tokens: ['∠θ', 'ω₀', 'τ₀', 'Ω²'] },
  chemistry: { label: 'Chemistry',      symbols: S('⇌⇋⇄⟶→↑↓°‡≡⁺Δ'),
               tokens: ['δ⁺', '⁺⁺', '⇌°', '‡'] },
  cs:        { label: 'CS',             symbols: S('λ↦≡∘←⊕⊻⊤⊥⌈⌉⌊⌋∅⊑'),
               tokens: ['&&', '::', '=>', '<<', '!=', '->', '[]', '{}'] },
  greek:     { label: 'Greek',          symbols: S('αβγδεζηθικλμνξπρστυφχψωϕϑϵϱΓΔΘΛΞΠΣΦΨΩ'),
               tokens: ['θ₀', 'ψ²', 'Δθ', 'ξ₁'] },
  bioastro:  { label: 'Bio & astro',    symbols: ['♀' + T, '♂' + T, '×', '☉', '⊕'],
               tokens: ['♀' + T + '×♂' + T, '☉⊕'] },
  economics: { label: 'Economics',      symbols: S('≻≺≿≾∼∂∑𝔼ΔΓΘνραβ'),
               tokens: ['β₁', 'α₀', 'Δ%', '∂π', 'Γ²'] },
  philosophy:{ label: 'Philosophy',     symbols: S('□◇∴∵∷∶⊢⊨⊬⊭⊩¬→↔∧∨⊃≡⊥⊤⊸⅋'),
               tokens: ['□◇', '◇¬', '∴□', '⊢□', '¬□', '∵∴', '⊩◇', '⊸⅋'] },
  proofs:    { label: 'Proofs',         symbols: S('∎□∴∵∷∶≔≕≝≜≐⋮⋯⋰⋱⊢⊬⊨'),
               tokens: ['∴∎', '≔∎', '⋯⋯', '∵∴', '⊢∎', '≝⋯'] },
  linguistics:{ label: 'Linguistics',   symbols: S('əʃʒŋðθʔɾɪʊɛɔæɑʌɹːˈ⟦⟧λ'),
               tokens: ['⟦·⟧', '/ə/', '[ʃ]', 'ˈŋ', 'ðə'] },
  law:       { label: 'Law & texts',    symbols: S('§¶†‡'),
               tokens: ['§§', '§1', '¶2', '§3'] },
  finance:   { label: 'Finance',        symbols: S('$€£¥₹¢₿%‰±Δ↑↓'),
               tokens: ['$1', '€2', '±%', '₹¥', '¢¢', 'Δ%'] },
  category:  { label: 'Category theory', symbols: S('↪↠⇉⇇⊣⊢≅∘→⟶⟹⊗⥲'),
               tokens: ['⊣⊢', '↪↠', '≅∘', '⇉⇇', '→∘→'] },
  functional:{ label: 'Functional prog.', symbols: S('λ∘⊥→⇒∀∷'),
               tokens: ['>>=', '<$>', '|>', '<*>', '<|>', '>=>', '::', '\\λ'] }
};

var PALETTES = {
  pastel: ['#8fc27a', '#7aa2f7', '#a98bff', '#e3b34c', '#e8798e', '#5fb8a5'],
  ember:  ['#f2a65a', '#e0705f', '#d9c06a', '#c98bd9', '#7fc4b0', '#f3d3a4'],
  ice:    ['#7fd1e8', '#8ea8ff', '#b39cff', '#6fe0c2', '#c6d4ff', '#5aa9e6'],
  mono:   ['#f2f2f2', '#c4c4c4', '#a3a3a3', '#dedede', '#b5b5b5', '#8f8f8f'],
  shimmer: ['#a70947', '#ff0000', '#ffa500', '#ffe135', '#008000', '#6475d8', '#1e90ff']
};

var MONO_STACK = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'JetBrains Mono', " +
  "'DejaVu Sans Mono', 'Liberation Mono', 'Noto Sans Mono'";

var DEFAULTS = {
  lines: ['plain text, now with', 'a *math* accent'],
  layout: 'lines',
  effect: 'breathe',
  scripts: null,
  palette: 'pastel',
  substitute: 0.35,
  color: 0.55,
  box: 0.22,
  boxStyle: 'detect',
  boxJitter: 0.5,
  boxSpan: 3,
  labels: 0.6,
  labelFormat: null,
  symbols: 'all',
  sets: null,
  tokens: true,
  symbolMix: 0.15,
  legible: 0.6,
  lookalikes: null,
  words: 0.7,
  wordMap: null,
  motion: 'hover',
  rest: 'glyphs',
  revert: 0,
  anchor: null,
  tracking: -0.04,
  wordSpacing: 0.3,
  intro: true,
  speed: 1,
  hoverRadius: 2.6,
  expand: true,
  base: '#8d8b93',
  highlight: '#ffffff',
  font: MONO_STACK + ", 'Noto Sans Math', 'STIX Two Math', 'Cambria Math', monospace",
  fonts: [],
  fit: true,
  maxSize: 44
};

var BOX_PAD = 0.16;    // em a boxed slot grows by
var BOX_JITTER = 0.3;  // em a box edge moves in or out at most, at boxJitter: 1
var BOX_OUT = 0.05;    // em a box edge moves up or down out at most, so the box stays in its line's strip
var SPAN_ODDS = 0.3;   // the chance that a box covers one more glyph of its word, up to boxSpan
var SPACE_PAD = 0.34;  // em a space grows by when it shows a symbol
var LINE_H = 1.5;      // line height, em
var CELL_H = 1.24;     // box height, em
var LABEL_EM = 0.26;   // label font size, em
var TICK = 60;         // ms between scramble steps
// Springs, in rad/s at speed 1. A critically damped spring reaches 90% of a step in 3.9 / stiffness s.
var SPRING = 20;          // slot widths
var SETTLE_SPRING = 13;   // slot widths going back to plain (rest: 'plain')
var PEAK_MS = 350;   // a scrambling slot keeps its widest recent width, relaxing with this time constant
var FADE_MS = 80;    // crossfade from the old glyph to the new one
var REVERT_WAVE_MS = 700;  // spread of the staggered wave back to plain, ms
var RELEASE_MS = 200;      // what an effect moved eases back to rest in this long once frame() returns false

var segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
function graphemes(s) {
  return segmenter ? Array.from(segmenter.segment(s), function (x) { return x.segment; }) : Array.from(s);
}

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function variant(ch, style) {
  if (HOLES[style] && HOLES[style][ch]) return HOLES[style][ch];
  var up = ch >= 'A' && ch <= 'Z', lo = ch >= 'a' && ch <= 'z';
  if (!up && !lo) return ch;
  var i = up ? ch.charCodeAt(0) - 65 : 26 + ch.charCodeAt(0) - 97;
  return String.fromCodePoint(BASE[style] + i);
}

// A math-alphabet version of a Greek letter, or null for anything else.
function greekVariant(ch) {
  var cp = ch.codePointAt(0);
  var i = cp >= 0x391 && cp <= 0x3A9 && cp !== 0x3A2 ? cp - 0x391
    : cp >= 0x3B1 && cp <= 0x3C9 ? 26 + cp - 0x3B1 : -1;
  return i < 0 || ch.length > 1 ? null : String.fromCodePoint(pick(GREEK_STYLES) + i);
}

function isLatin(ch) { return /^[A-Za-z]$/.test(ch); }

// Where `word` first appears in `str` as a whole word, else where it first appears at all.
var LETTER = /[\p{L}\p{M}\p{N}]/u;
function wordAt(str, word) {
  var first = str.indexOf(word);
  for (var k = first; k >= 0; k = str.indexOf(word, k + 1)) {
    if (!LETTER.test(str.charAt(k - 1)) && !LETTER.test(str.charAt(k + word.length))) return k;
  }
  return first;
}

function parseLine(line) {
  var out = [], hl = false;
  graphemes(line).forEach(function (ch) {
    if (ch === '*') { hl = !hl; return; }
    out.push({ ch: ch, hl: hl });
  });
  return out;
}

// One canvas for measuring, shared by every instance.
var measureCtx = null, measureFont = '';
function measureText(font, g) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  if (measureFont !== font) { measureCtx.font = font; measureFont = font; }
  return measureCtx.measureText(g);
}

// FontFace objects already added to the page, by family and source.
var faces = {};

function contentWidth(el) {
  var cs = (el.ownerDocument.defaultView || window).getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

// A fixed number in [0, 1) for glyph i. Not Math.random, so a seeded page replays the same glyphs.
function seedOf(i) {
  var h = Math.imul(i + 1, 0x9E3779B1);
  h = Math.imul(h ^ (h >>> 15), 0x85EBCA77);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

// ---- the built-in effect and layout ----
// The glyphs in an ellipse around the pointer scramble, and their slots widen.
var BREATHE = {
  name: 'breathe',
  glyph: function (g, out, f) {
    var rx = f.radius, dx = (g.cx - f.pointer.x) / rx, dy = (g.cy - f.pointer.y) / (rx * 0.62);
    out.swap = dx * dx < 1 - dy * dy;
  }
};

// Centred lines, or the anchor's middle at the element's middle. The widths move on springs, so
// the centring needs no spring of its own: one that lags makes the letters right of a changing
// slot go one way, then back. bands: each line has its own strip, so a change redraws only it.
var LINES = {
  name: 'lines',
  bands: true,
  size: function (m) {
    var most = 1, grid = 1;
    m.lines.forEach(function (L) {
      var n = L.natural, g = L.grid;
      // An anchored line is as wide as twice its longer side, since the anchor stays in the middle.
      if (L.a1) { g *= 2 * Math.max(L.mid, n - L.mid) / n; n = 2 * Math.max(L.mid, n - L.mid); }
      most = Math.max(most, n);
      grid = Math.max(grid, g);
    });
    // Leave room for lines to grow, and for labels under the last line.
    var fs = m.fit ? Math.max(8, Math.min(m.maxSize, m.width / (m.expand ? most * 1.2 : grid * 1.0333))) : m.fs;
    return { fs: fs, height: Math.ceil(m.lines.length * (fs * LINE_H) + fs * 0.3) };
  },
  place: function (m) {
    m.lines.forEach(function (L, i) {
      if (!m.dirty[i]) return;
      var cs = L.cells, x = 0, j, c;
      for (j = 0; j < cs.length; j++) { cs[j].x = x; x += cs[j].w; }
      L.top = i * m.lineH;
      L.left = L.a1 ? (m.width - cs[L.a0].x - cs[L.a1 - 1].x - cs[L.a1 - 1].w) / 2 : (m.width - x) / 2;
      for (j = 0; j < cs.length; j++) {
        c = cs[j];
        c.cx = L.left + c.x + c.w / 2;
        c.cy = L.top + m.lineH / 2;
        c.r = 0;
      }
    });
  }
};

var EFFECTS = { breathe: BREATHE }, LAYOUTS = { lines: LINES }, warned = {};

// Adds effects (objects with glyph()) and layouts (objects with place()), so options can name them.
export function register() {
  for (var i = 0; i < arguments.length; i++) {
    var m = arguments[i];
    if (m && m.glyph) EFFECTS[m.name] = m;
    else if (m && m.place) LAYOUTS[m.name] = m;
  }
}

// An `effect` or `layout` option: a name, a module, or { name, ...settings }. Gives the module and
// its settings, or the default for a name nobody registered.
function resolve(table, value, fallback) {
  var mod = value, own = {};
  if (!value) mod = table[fallback];
  else if (!value.glyph && !value.place) {
    var name = value.name || value;
    mod = table[name];
    if (typeof value === 'object') own = value;
    if (!mod) {
      if (!warned[name]) { warned[name] = 1; console.warn('mathglyph: nothing named ' + name + ' is registered'); }
      mod = table[fallback];
      own = {};
    }
  }
  var settings = Object.assign({}, mod.defaults, own);
  delete settings.name;
  return { mod: mod, settings: settings };
}

export function mount(root, options) {
  var o = Object.assign({}, DEFAULTS, options || {});
  var win = root.ownerDocument.defaultView || window;
  var lines = [], cells = [], hot = [], moving = [], dirty = [], bandDirty = [], dirtyAny = false;
  var maxLen = 1;
  var look, wordTable, allSets, pool = [], scriptList = [], scriptSum = 0;
  var widths = {}, stack = '', monoEm = 0.6, ascEm = 0.8, descEm = 0.2;
  var W = contentWidth(root), H = 0, dpr = 1, fs = 16, lineH = 24, boxH = 20, monoPx = 9.6;
  var pad = 0, padPx = 0, labelSize = 8, fontPx = '', labelPx = '';
  // The effect: fx and its frame F, one `out` for every glyph, and the glyphs it changes now
  // (fxCells) and changed last frame (fxLast). ease goes from 1 to 0 as they go back to rest.
  var fx, F = { state: {} }, OUT = {}, fxCells = [], fxLast = [], fxOn = false, releaseStart = 0, ease = 1;
  // The layout, and what it gets: M.
  var lay, M = { state: {} }, layBusy = false, area = { x: 0, y: 0, w: 0, h: 0 }, wander = { x: 0, y: 0 };
  var decoding = false, decodeStart = 0, idleAcc = 0, lastTick = 0, lastFrame = 0;
  var reverting = [], revertStart = 0, revertTimer = 0;
  var raf = 0, dead = false, onScreen = true, needMeasure = false, needLayout = false;
  var pointer = null, pointerMoved = false, rect = null;
  var mq = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mq && mq.matches);
  var renderer, io = null, ro = null;

  var saved = Array.prototype.slice.call(root.childNodes);
  root.textContent = '';
  var sr = document.createElement('span');
  sr.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;' +
    'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:pre-line';
  root.appendChild(sr);

  function palette() {
    return Array.isArray(o.palette) ? o.palette : (PALETTES[o.palette] || PALETTES.pastel);
  }

  // ---- tables: built-ins plus the user's own ----
  function tables() {
    look = Object.assign({}, LOOKALIKE, o.lookalikes);
    wordTable = Object.assign({}, WORDS);
    if (o.wordMap) Object.keys(o.wordMap).forEach(function (k) { wordTable[k.toLowerCase()] = o.wordMap[k]; });
    allSets = Object.assign({}, SETS);
    if (o.sets) Object.keys(o.sets).forEach(function (k) {
      var s = o.sets[k];
      allSets[k] = {
        label: s.label || k,
        symbols: typeof s.symbols === 'string' ? graphemes(s.symbols) : (s.symbols || []),
        tokens: s.tokens || []
      };
    });
    var keys = (!o.symbols || o.symbols === 'all') ? Object.keys(allSets)
      : [].concat(o.symbols).filter(function (k) { return allSets[k] && allSets[k].symbols.length; });
    if (!keys.length) keys = ['general'];
    pool = keys.map(function (k) { return allSets[k]; });
    // scripts: names, or names with weights. Each swap of a Latin letter picks one by weight.
    var ws = o.scripts || {};
    if (Array.isArray(ws)) ws = ws.reduce(function (m, k) { m[k] = 1; return m; }, {});
    scriptSum = 0;
    scriptList = Object.keys(ws).map(function (k) { scriptSum += +ws[k] || 0; return [SCRIPTS[k], scriptSum]; });
  }

  // A look-alike from the script this swap picks, or null for 'latin' and for letters it lacks.
  function scripted(ch) {
    if (!scriptSum) return null;
    var r = Math.random() * scriptSum, i = 0;
    while (scriptList[i][1] <= r) i++;
    var t = scriptList[i][0];
    return t && t[ch] ? pick(Array.from(t[ch])) : null;
  }

  function pickSymbol() {
    var set = pick(pool);
    if (o.tokens && o.expand && set.tokens.length && Math.random() < 0.3) return pick(set.tokens);
    return pick(set.symbols);
  }

  function lookalike(ch) {
    var opts = [];
    if (look[ch]) { var l = Array.from(look[ch]); opts = opts.concat(l, l); }  // weighted x2
    if (GREEK[ch]) opts.push(GREEK[ch]);
    opts.push(variant(ch, 'bold'), variant(ch, 'italic'), variant(ch, 'double'));
    return pick(opts);
  }

  function mutate(ch) {
    if (ch >= '0' && ch <= '9' && ch.length === 1) {
      if (look[ch] && Math.random() < o.legible * 0.5) return pick(Array.from(look[ch]));
      if (Math.random() < o.symbolMix) return pickSymbol();
      return String.fromCodePoint((Math.random() < 0.5 ? 0x1D7CE : 0x1D7D8) + (+ch));
    }
    if (!isLatin(ch)) return mutateOther(ch);
    var alt = scripted(ch);
    if (alt) return alt;
    if (Math.random() < o.legible) return lookalike(ch);
    if (Math.random() < o.symbolMix) return pickSymbol();
    var r = Math.random();
    if (r < 0.33) return variant(ch.toUpperCase(), 'double');
    if (r < 0.50) return variant(ch, 'italic');
    if (r < 0.61) return variant(ch, 'script');
    if (r < 0.69) return variant(ch, 'fraktur');
    if (r < 0.90 && GREEK[ch]) return GREEK[ch];
    if (r < 0.98) return variant(ch, 'bold');
    return pickSymbol();
  }

  // Letters of other scripts: their own look-alike table and math Greek if any,
  // accented letters like their base letter, everything else a symbol.
  function mutateOther(ch) {
    var key = look[ch] ? ch : ch.normalize('NFD').charAt(0);
    if (key !== ch && isLatin(key)) return mutate(key);
    var l = look[key], gv = greekVariant(key);
    if (!l && !gv) return pickSymbol();
    if (Math.random() < o.legible) {
      var opts = l ? Array.from(l) : [];
      opts = opts.concat(opts);
      if (gv) opts.push(gv);
      return pick(opts);
    }
    if (Math.random() < o.symbolMix) return pickSymbol();
    return gv || pick(Array.from(l));
  }

  // ---- glyph widths (measured once per glyph and font, in em) ----
  function glyphW(g) {
    if (g === ' ') return monoEm;
    var w = widths[g];
    if (w === undefined) w = widths[g] = measureText('100px ' + stack, g).width / 100;
    return w;
  }

  // The plain width of a character: a space is wordSpacing wide, every other slot gets tracking.
  function plainWidth(ch, grid) {
    if (ch === ' ') return o.wordSpacing;
    return (grid ? grid * monoEm : Math.max(monoEm, glyphW(ch))) + o.tracking;
  }

  function slotWidth(c) {
    if (!o.expand) return (plainWidth(c.ch, c.grid) + pad) * fs;
    if (c.gone) return 0;
    if (c.g === ' ') return (o.wordSpacing + pad) * fs;
    return (Math.max(monoEm, glyphW(c.g)) + o.tracking + (c.box ? BOX_PAD : 0) + (c.pad ? SPACE_PAD : 0) + pad) * fs;
  }

  function retarget(c) {
    var tw = slotWidth(c);
    if (tw === c.tw) return;
    c.tw = tw;
    if (!animated()) { c.w = c.peak = tw; c.v = 0; return; }
    c.w0 = c.w;
    // A scrambling slot widens at once for a wider glyph, and narrows only slowly (see stepWidths).
    if (!c.mix || tw > c.peak) c.peak = tw;
    // Going back to plain, and word letters that fold away or come back, move more softly.
    c.stiff = (c.reverting || c.gone || c.w0 < 0.5 ? SETTLE_SPRING : SPRING) * Math.max(o.speed, 0.25);
    move(c);
  }

  function move(c) {
    if (!c.moving) { c.moving = true; moving.push(c); }
  }

  function markDirty(i) { dirty[i] = true; dirtyAny = true; }

  // ---- choosing what a character shows ----
  function roll(c, scramble) {
    var s = choose(c, scramble);
    s.mix = scramble;
    return s;
  }

  function choose(c, scramble) {
    var pal = palette();
    if (c.anchor) return { g: c.ch, col: null, box: false };
    if (c.ch === ' ') {
      var spaceRate = (scramble ? 0.2 : o.substitute * 0.12) * (1 - o.legible * 0.7);
      if (Math.random() < spaceRate) {
        return { g: pickSymbol(), col: Math.random() < o.color ? pick(pal) : null, box: false, pad: true };
      }
      return { g: ' ', col: null, box: false };
    }
    if (c.hl) {
      if (scramble) {
        var p = pick(pal);
        return { g: Math.random() < 0.6 ? mutate(c.ch) : c.ch, col: p, box: Math.random() < 0.35 };
      }
      if (Math.random() < o.box * 0.4) return { g: c.ch, col: pick(pal), box: true };
      return { g: c.ch, col: null, box: false };
    }
    var sub = Math.random() < (scramble ? 0.85 : o.substitute);
    var colored = Math.random() < (sub ? Math.min(1, o.color * 1.5) : o.color * 0.45);
    var col = colored ? pick(pal) : null;
    return { g: sub ? mutate(c.ch) : c.ch, col: col, box: colored && Math.random() < Math.min(1, o.box * 1.8) };
  }

  function paint(c, s) {
    var col = s.col || null, box = !!s.box;
    // Crossfade from the old look. A change in the first half of a fade keeps the glyph that is
    // fading out, so no glyph ever jumps to full strength.
    if (animated() && c.w >= 0.5 && (s.g !== c.g || col !== c.color || box !== c.box)) {
      if (c.f >= 0.5) {
        c.og = c.g; c.oc = colorOf(c); c.ob = c.box; c.ol = showsLabel(c);
        c.f = c.f < 1 ? 1 - c.f : 0;
      }
      move(c);
    }
    // A box that appears where none shows gets its shape, and keeps it while it stays.
    if (box && !c.box && !(c.ob && c.f < 1)) shape(c);
    c.g = s.g;
    c.color = col;
    c.box = box;
    c.pad = !!s.pad;
    c.gone = !!s.gone;
    c.mix = !!s.mix;
    c.label = c.box && Math.random() < o.labels;
    retarget(c);
    markDirty(c.line);
  }

  // A box's shape: each edge moves in or out by its own random amount (jl, jr, jt, jb, em, out is
  // positive), and it may cover the next glyphs of its word (span). Detection boxes are never
  // exact. With boxJitter: 0 and boxSpan: 1 it is the plain slot, and no random number is drawn.
  function shape(c) {
    var j = o.boxJitter * BOX_JITTER, n = 1, next;
    c.jl = c.jr = c.jt = c.jb = 0;
    if (j) {
      c.jl = j * (2 * Math.random() - 1);
      c.jr = j * (2 * Math.random() - 1);
      c.jt = Math.min(BOX_OUT, j * (2 * Math.random() - 1));
      c.jb = Math.min(BOX_OUT, j * (2 * Math.random() - 1));
    }
    while (n < o.boxSpan && (next = lines[c.line].cells[c.col + n]) && next.ch !== ' ' && !next.anchor && Math.random() < SPAN_ODDS) n++;
    c.span = n;
  }

  // ---- whole-word swaps: the first letter shows the symbol, the rest fold away ----
  function rollWord(w) {
    if (o.expand && Math.random() < o.words) {
      w.on = true;
      var colored = Math.random() < Math.max(o.color, 0.5);
      var col = colored ? pick(palette()) : null;
      var box = colored && Math.random() < Math.min(1, o.box * 1.8);
      w.cells.forEach(function (c, i) {
        paint(c, i === 0 ? { g: w.sym, col: col, box: box } : { g: c.ch, col: null, box: false, gone: true });
      });
    } else {
      w.on = false;
      w.cells.forEach(function (c) { paint(c, roll(c, false)); });
    }
  }

  // Repaint one character, keeping whole-word swaps consistent.
  function refresh(c, scramble) {
    if (!scramble && rests(c)) { sleep(c); return; }
    var w = c.word;
    if (!w) { paint(c, roll(c, scramble)); return; }
    if (scramble) {
      if (w.on) {
        w.on = false;
        w.cells.forEach(function (x) { if (x !== c) paint(x, roll(x, false)); });
      }
      paint(c, roll(c, true));
      return;
    }
    for (var i = 0; i < w.cells.length; i++) {
      if (w.cells[i] !== c && w.cells[i].hot) { paint(c, roll(c, false)); return; }
    }
    rollWord(w);
  }

  function settleAll() {
    cells.forEach(function (c) {
      if (rests(c)) { if (!c.word || c === c.word.cells[0]) sleep(c); }
      else if (!c.word) paint(c, roll(c, false));
      else if (c === c.word.cells[0]) rollWord(c.word);
    });
  }

  // ---- rest: 'plain': only characters the pointer touched show glyphs ----
  // A word wakes and sleeps as one, so its folded letters come back together.
  function rests(c) { return o.rest === 'plain' && !c.woke; }

  function wakeCell(c) {
    if (c.woke || o.rest !== 'plain' || c.anchor) return;
    (c.word ? c.word.cells : [c]).forEach(function (x) { x.woke = true; });
  }

  function sleep(c) {
    var w = c.word;
    if (w) w.on = false;
    (w ? w.cells : [c]).forEach(function (x) {
      x.woke = false;
      paint(x, { g: x.ch, col: null, box: false });
    });
  }

  function isHot(c) {
    return c.word ? c.word.cells.some(function (x) { return x.hot; }) : !!c.hot;
  }

  // After the text is re-rolled with no pointer on it, woken characters go back to plain.
  function revertIfGone() {
    if (!pointer && !reverting.length) scheduleRevert();
  }

  function cancelRevert() {
    if (revertTimer) { win.clearTimeout(revertTimer); revertTimer = 0; }
    reverting.forEach(function (c) { c.reverting = false; });
    reverting = [];
  }

  // Woken characters go back to plain in a wave from left to right. It runs only once the pointer
  // is gone, so characters that still scramble join the wave and sleep when they cool.
  function startRevert() {
    revertTimer = 0;
    var sp = Math.max(o.speed, 0.25);
    cells.forEach(function (c) {
      if (!c.woke || c.reverting || (c.word && c !== c.word.cells[0])) return;
      var off = (maxLen - c.len) / 2 + c.col;
      c.settle = ((off / maxLen) * REVERT_WAVE_MS + Math.random() * 40) / sp;
      (c.word ? c.word.cells : [c]).forEach(function (x) { x.reverting = true; });
      reverting.push(c);
    });
    revertStart = 0;
    wake();
  }

  function scheduleRevert() {
    cancelRevert();
    if (o.rest !== 'plain' || !animated()) return;
    if (!cells.some(function (c) { return c.woke; })) return;
    if (o.revert > 0) revertTimer = win.setTimeout(startRevert, o.revert * 1000);
    else startRevert();
  }

  // ---- text model ----
  // ---- anchor: one word that never changes and never moves; its line grows outward from it ----
  // anchor: true pins the first *highlighted* run, a string its first match (a whole word if any).
  function pin(L, str, at) {
    var from = -1, to = -1, cs = L.cells;
    if (o.anchor === true) {
      for (var i = 0; i < cs.length; i++) {
        if (from < 0 ? cs[i].hl && cs[i].ch !== ' ' : !cs[i].hl) { if (from < 0) from = i; else break; }
      }
      to = i;
      while (to > from && cs[to - 1].ch === ' ') to--;
    } else if (typeof o.anchor === 'string' && o.anchor) {
      var k = wordAt(str, o.anchor);
      if (k >= 0) { from = at[k]; to = at[k + o.anchor.length]; }
    }
    if (!(from >= 0 && to > from)) return false;
    L.a0 = from;
    L.a1 = to;
    for (var j = from; j < to; j++) cs[j].anchor = true;
    return true;
  }

  function build() {
    var plain = [], pinned = false;
    var src = Array.isArray(o.lines) ? o.lines : String(o.lines).split('\n');
    clearFx();
    lines = M.lines = [];
    cells = [];
    hot = [];
    moving = [];
    dirty = M.dirty = [];
    M.anchor = null;
    F.state = {};
    cancelRevert();
    src.forEach(function (text, li) {
      var parsed = parseLine(String(text));
      var L = { cells: [], top: 0, left: 0, a0: 0, a1: 0, natural: 0, grid: 0, mid: 0 };
      var at = [], offset = 0, str = '';
      parsed.forEach(function (p, col) {
        // cx, cy, r: where the layout puts the slot. tf: the effect changes it, by tx, ty (offset),
        // ts (scale), tr (rotation) and ta (alpha); tp: it paints it; tc: that changed this frame.
        var c = {
          ch: p.ch, hl: p.hl, line: li, col: col, len: parsed.length, word: null, grid: 1, pw: 0,
          g: p.ch, color: null, box: false, pad: false, gone: false, label: false,
          hot: 0, inHot: false, settle: 0, settled: true, mix: false, anchor: false,
          w: 0, w0: 0, tw: -1, v: 0, peak: 0, stiff: SPRING, x: 0, moving: false, prev: null,
          og: ' ', oc: '', ob: false, ol: false, f: 1, span: 1, jl: 0, jr: 0, jt: 0, jb: 0,
          woke: false, reverting: false,
          i: cells.length, seed: seedOf(cells.length), fx: undefined, cx: 0, cy: 0, r: 0,
          tf: false, tc: false, tp: false, tx: 0, ty: 0, ts: 1, tr: 0, ta: 1
        };
        at[offset] = col;
        offset += p.ch.length;
        str += p.ch;
        cells.push(c);
        L.cells.push(c);
      });
      at[offset] = parsed.length;
      if (!pinned && (pinned = pin(L, str, at))) M.anchor = { line: li, from: L.a0, to: L.a1 };
      // Mark whole words that have a symbol (never inside *highlighted* text or the anchor).
      var re = /[\p{L}\p{M}]+/gu, m;
      while ((m = re.exec(str))) {
        var sym = wordTable[m[0].toLowerCase()];
        var from = at[m.index], to = at[m.index + m[0].length];
        if (!sym || from === undefined || to === undefined) continue;
        var wc = L.cells.slice(from, to);
        if (wc.some(function (c) { return c.hl || c.anchor; })) continue;
        var w = { sym: sym, cells: wc, on: false };
        wc.forEach(function (c) { c.word = w; });
      }
      plain.push(str);
      lines.push(L);
    });
    sr.textContent = plain.join('\n');
  }

  // ---- fonts ----
  function fontStack() {
    var front = [];
    (o.fonts || []).forEach(function (f) {
      var family = typeof f === 'string' ? f : f.family;
      if (family && o.font.indexOf(family) < 0) front.push(JSON.stringify(family));
    });
    return front.concat(o.font).join(', ');
  }

  function loadFonts() {
    if (!document.fonts) return;
    (o.fonts || []).forEach(function (f) {
      if (typeof f === 'string') {
        document.fonts.load('16px ' + JSON.stringify(f)).then(onFonts, function () {});
        return;
      }
      var src = f.src || 'url(' + JSON.stringify(f.url) + ')';
      var key = f.family + '\n' + src;
      if (!faces[key]) {
        var desc = Object.assign({}, f);
        delete desc.family;
        delete desc.url;
        delete desc.src;
        faces[key] = new FontFace(f.family, src, desc);
        document.fonts.add(faces[key]);
      }
      faces[key].load().then(onFonts, function (e) {
        console.warn('mathglyph: could not load font ' + f.family, e);
      });
    });
  }

  function onFonts() {
    needMeasure = true;
    wake();
  }

  // ---- geometry: measured on start, resize and font load, never in the loop ----
  function measure() {
    needMeasure = false;
    widths = {};
    measureFont = '';
    stack = fontStack();
    monoEm = measureText('100px ' + stack, '0').width / 100 || 0.6;
    var m = measureText('100px ' + stack, 'Hg');
    if (m.fontBoundingBoxAscent) { ascEm = m.fontBoundingBoxAscent / 100; descEm = m.fontBoundingBoxDescent / 100; }
    maxLen = 1;
    // Each line's plain width in em (natural, or grid with expand: false), and where its anchor's middle is.
    lines.forEach(function (L) {
      var natural = 0, grid = 0, mid = 0;
      L.cells.forEach(function (c, i) {
        c.grid = Math.max(1, Math.round(glyphW(c.ch) / monoEm));
        if (i === L.a0) mid = natural;
        if (i === L.a1) mid = (mid + natural) / 2;
        var n = plainWidth(c.ch, 0), g = plainWidth(c.ch, c.grid);
        c.pw = o.expand ? n : g;
        natural += n;
        grid += g;
      });
      if (L.a1 === L.cells.length) mid = (mid + natural) / 2;
      L.natural = natural;
      L.grid = grid;
      L.mid = mid;
      maxLen = Math.max(maxLen, L.cells.length);
    });
    needLayout = true;
  }

  // The layout sets the font size and the canvas height (pad: em it adds to every slot along the
  // text), then places the slots. The viewport and computed style are read here, never in the loop.
  function layout() {
    needLayout = false;
    if (!W) return;
    M.width = W;
    M.viewH = win.innerHeight;
    M.fit = o.fit;
    M.maxSize = o.maxSize;
    M.expand = o.expand;
    M.speed = Math.max(o.speed, 0.25);
    M.lineEm = LINE_H;
    M.fs = o.fit ? 0 : parseFloat(win.getComputedStyle(root).fontSize) || 16;
    var s = lay.size(M);
    fs = M.fs = s.fs;
    H = M.height = s.height;
    pad = s.pad || 0;
    padPx = pad * fs;
    lineH = M.lineH = fs * LINE_H;
    boxH = M.boxH = fs * CELL_H;
    monoPx = (monoEm + o.tracking + pad) * fs;
    labelSize = Math.max(8, Math.round(fs * LABEL_EM));
    fontPx = fs + 'px ' + stack;
    labelPx = labelSize + 'px ' + MONO_STACK + ', monospace';
    dpr = Math.min(win.devicePixelRatio || 1, 3);
    moving = [];
    cells.forEach(function (c) { c.moving = false; c.tw = slotWidth(c); c.w = c.w0 = c.peak = c.tw; c.v = 0; c.f = 1; });
    lines.forEach(function (L, i) { markDirty(i); });
    M.state = {};
    M.dt = 0;
    lay.place(M);
    // The wandering point of motion: 'always' stays inside the text's box.
    var x0 = W, x1 = 0, y0 = H, y1 = 0;
    cells.forEach(function (c) {
      x0 = Math.min(x0, c.cx); x1 = Math.max(x1, c.cx);
      y0 = Math.min(y0, c.cy); y1 = Math.max(y1, c.cy);
    });
    area = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    renderer.resize();
  }

  function colorOf(c) { return c.color || (c.hl ? o.highlight : o.base); }

  // Folding word letters fade with their width.
  function alphaOf(c) {
    if (c.gone) return c.w0 > 0 ? Math.min(1, c.w / c.w0) : 0;
    if (c.moving && c.w0 === 0 && c.tw > 0) return Math.min(1, c.w / c.tw);
    return 1;
  }

  function labelText(c) {
    var dx = Math.round(c.w - monoPx);
    if (c.prev !== c.g + dx) {
      c.prev = c.g + dx;
      c.text = o.labelFormat
        ? String(o.labelFormat({ glyph: c.g, char: c.ch, dx: dx, width: c.w, color: colorOf(c), line: c.line, column: c.col }))
        : 'Δx=' + dx + 'px';
    }
    return c.text;
  }

  function showsLabel(c) { return c.box && c.label && o.boxStyle !== 'soft' && c.w >= 0.5; }

  // How far the crossfade to the current look is, eased: 0 shows the old look, 1 the new one.
  function fadeOf(c) { return c.f >= 1 ? 1 : c.f * c.f * (3 - 2 * c.f); }

  // ---- the canvas: draws what the cells say, nothing else ----
  function canvasRenderer() {
    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    var drawn = [];
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'display:block;width:100%;height:0;touch-action:pan-y';

    function resize() {
      var bw = Math.max(1, Math.round(W * dpr)), bh = Math.max(1, Math.round(H * dpr));
      if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
      cv.style.height = H + 'px';
    }

    function box(x, y, w, h, col, a) {
      ctx.fillStyle = ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      if (o.boxStyle === 'soft') {
        var r = fs * 0.16;
        ctx.globalAlpha = 0.16 * a;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.globalAlpha = 0.78 * a;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r); else ctx.rect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.stroke();
        return;
      }
      // x is not rounded, so a box glides with its slot.
      var bx = x + 1.5, by = Math.round(y) + 0.5, bw = w - 3, bh = Math.round(h) - 1;
      ctx.globalAlpha = 0.06 * a;
      ctx.fillRect(bx, by, bw, bh);
      ctx.globalAlpha = a;
      ctx.strokeRect(bx, by, bw, bh);
    }

    // One glyph centred on x, with the box RX, RY, RW, RH, at alpha a.
    function look(x, base, g, col, hasBox, a) {
      if (a <= 0) return;
      if (hasBox) box(RX, RY, RW, RH, col, a);
      if (g === ' ') return;
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.fillText(g, x, base);
    }

    // Where cell c is drawn: X, Y and alpha A. That is its slot centre, moved, scaled and turned by
    // the effect (ease takes it back to rest). A transform costs about 8 plain glyphs, so only a
    // scaled or turned cell gets one, and returns true; an offset goes into X and Y.
    var X = 0, Y = 0, A = 1;
    function at(c) {
      var s = 1, r = c.r;
      X = c.cx;
      Y = c.cy;
      A = alphaOf(c);
      if (c.tf) {
        X += c.tx * ease;
        Y += c.ty * ease;
        s += (c.ts - 1) * ease;
        r += c.tr * ease;
        A *= 1 + (c.ta - 1) * ease;
      }
      if (s === 1 && !r) return false;
      var cos = Math.cos(r) * s * dpr, sin = Math.sin(r) * s * dpr;
      ctx.setTransform(cos, sin, -sin, cos, X * dpr, Y * dpr);
      X = Y = 0;
      return true;
    }

    // The box of cell c drawn at X, Y: its slot, or its span's slots when they sit in a row with
    // it, each edge moved by its shape.
    var RX = 0, RY = 0, RW = 0, RH = 0;
    function boxRect(c) {
      var w = c.w - padPx, more = 0, last = c.span > 1 && !lay.vertical && lines[c.line].cells[c.col + c.span - 1];
      if (last && !c.r && !last.r && last.cy === c.cy) more = last.cx - c.cx + (last.w - c.w) / 2;
      RX = X - w / 2 - c.jl * fs;
      RY = Y - boxH / 2 - c.jt * fs;
      RW = w + more + (c.jl + c.jr) * fs;
      RH = boxH + (c.jt + c.jb) * fs;
    }

    function drawLooks(c) {
      var turned = at(c), base = Y + (ascEm - descEm) * fs / 2, p = fadeOf(c);
      if (c.box || c.ob) boxRect(c);
      if (p < 1) look(X, base, c.og, c.oc, c.ob, A * (1 - p));
      look(X, base, c.g, colorOf(c), c.box, A * p);
      if (turned) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // A label hangs under its box. In a vertical layout it reads down beside the box instead, so
    // it stays out of the next glyph and the next column.
    function drawLabel(c, la, col) {
      var turned = at(c);
      boxRect(c);
      ctx.globalAlpha = 0.9 * la * A;
      ctx.fillStyle = col;
      if (lay.vertical) {
        ctx.save();
        ctx.translate(RX + RW + 2 + labelSize, RY);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(labelText(c), 0, 0);
        ctx.restore();
      } else ctx.fillText(labelText(c), RX + 1, RY + RH + 1);
      if (turned) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // The looks of these cells, then their labels: the cells the effect changes (tf) if fxPass is
    // true, else the others.
    function drawCells(list, fxPass, labelsOnly) {
      var i, c, labelled = false;
      if (!labelsOnly) {
        ctx.font = fontPx;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        for (i = 0; i < list.length; i++) {
          c = list[i];
          if (c.w >= 0.5 && c.tf === fxPass) drawLooks(c);
        }
      }
      for (i = 0; i < list.length; i++) {
        c = list[i];
        var shown = showsLabel(c), fade = fadeOf(c), la = (shown ? fade : 0) + (c.ol && fade < 1 ? 1 - fade : 0);
        if (!la || c.w < 0.5 || c.tf !== fxPass) continue;
        if (!labelled) {
          labelled = true;
          ctx.font = labelPx;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
        }
        drawLabel(c, la, shown ? colorOf(c) : c.oc);
      }
      ctx.globalAlpha = 1;
    }

    // Band b is line b's strip, from BY, BH high. Labels hang below their line, so a band also
    // draws the labels of the line above it, and a changed line redraws the band under it too.
    // Band edges sit on device pixels: a clip edge inside a pixel would leave a trace of what was
    // drawn across it, and the text would not get back to the same pixels.
    var BY = 0, BH = 0;
    function bandRect(b) {
      BY = Math.round(b * lineH * dpr) / dpr;
      BH = (b < lines.length ? Math.round((b + 1) * lineH * dpr) / dpr : H) - BY;
    }

    function band(b) {
      bandRect(b);
      if (BH <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, BY, W, BH);
      ctx.clip();
      ctx.clearRect(0, BY, W, BH);
      if (b < lines.length) drawCells(lines[b].cells, false, false);
      if (b > 0) drawCells(lines[b - 1].cells, false, true);
      ctx.restore();
    }

    // A layout with bands redraws the changed ones, others redraw everything. Then the cells the
    // effect changes go on top, in one pass clipped to what was redrawn, and then their paint.
    function draw() {
      var b, i, c, n = lines.length;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (lay.bands) {
        for (b = 0; b <= n; b++) if ((drawn[b] = !!(dirty[b] || dirty[b - 1] || bandDirty[b]))) band(b);
      } else {
        ctx.clearRect(0, 0, W, H);
        drawCells(cells, false, false);
      }
      if (!fxCells.length) return;
      ctx.save();
      if (lay.bands) {
        ctx.beginPath();
        for (b = 0; b <= n; b++) if (drawn[b]) { bandRect(b); ctx.rect(0, BY, W, BH); }
        ctx.clip();
      }
      drawCells(fxCells, true, false);
      for (i = 0; i < fxCells.length; i++) {
        c = fxCells[i];
        if (!c.tp || !fx.paint) continue;
        OUT.x = c.tx; OUT.y = c.ty; OUT.scale = c.ts; OUT.rotate = c.tr; OUT.alpha = c.ta;
        OUT.swap = false;
        OUT.paint = true;
        ctx.save();
        fx.paint(ctx, c, OUT, F);
        ctx.restore();
      }
      ctx.restore();
    }

    return { el: cv, resize: resize, draw: draw };
  }

  // Places the changed slots, and draws them and what the effect changed.
  function flush() {
    if (!dirtyAny && !layBusy) return;
    layBusy = lay.place(M) === true;
    for (var i = 0; i < fxCells.length; i++) {
      var c = fxCells[i];
      if (c.tc || c.tp || dirty[c.line]) markReach(c);
    }
    renderer.draw();
    dirtyAny = false;
    for (var b = 0; b <= lines.length; b++) dirty[b] = bandDirty[b] = false;
  }

  // A cell the effect changes can be drawn `reach` lines from its slot, with its label below.
  function markReach(c) {
    var r = Math.ceil(fx.reach >= 0 ? fx.reach : 1);
    for (var b = Math.max(0, c.line - r); b <= c.line + r + 1; b++) bandDirty[b] = true;
    dirtyAny = true;
  }

  // Moves c.w (velocity c.v) toward target on a critically damped spring of stiffness k, for dt ms.
  // Exact for any frame time, so it looks the same at 60, 120 or 144 Hz. Returns false once it
  // has arrived.
  function spring(c, target, k, dt) {
    var t = dt / 1000, d = c.w - target, e = Math.exp(-k * t), j = (c.v + k * d) * t;
    d = (d + j) * e;
    c.v = (c.v - k * j) * e;
    if (Math.abs(d) < 0.1 && Math.abs(c.v) < 6) { c.w = target; c.v = 0; return false; }
    c.w = target + d;
    return true;
  }

  // ---- the loop: runs only while something moves ----
  function animated() { return !reduce && o.motion !== 'still'; }
  function active() { return !dead && onScreen && !document.hidden; }
  function busy() {
    return moving.length || hot.length || decoding || reverting.length || fxOn || fxCells.length || layBusy ||
      (o.motion === 'always' && animated());
  }

  function wake() {
    if (!raf && active()) raf = win.requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0;
    if (!active()) return;
    if (needMeasure) measure();
    if (needLayout) layout();
    var dt = lastFrame ? Math.min(now - lastFrame, 100) : 1000 / 60;
    if (animated()) runEffect(now, dt);
    if (animated() && (hot.length || decoding || reverting.length || o.motion === 'always')) {
      if (!lastTick || now - lastTick > 4 * TICK) lastTick = now - TICK;
      while (now - lastTick >= TICK) { lastTick += TICK; tick(lastTick); }
    } else {
      lastTick = 0;
    }
    if (reverting.length) settleWave(now);
    stepWidths(dt);
    M.dt = dt;
    flush();
    M.dt = 0;
    lastFrame = busy() ? now : 0;
    if (lastFrame) raf = win.requestAnimationFrame(frame);
  }

  function stepWidths(dt) {
    var still = [];
    for (var i = 0; i < moving.length; i++) {
      var c = moving[i], target = c.tw;
      if (c.mix && c.peak > c.tw) target = c.peak = c.tw + (c.peak - c.tw) * Math.exp(-dt / PEAK_MS);
      else c.peak = c.tw;
      var going = c.w !== target && spring(c, target, c.stiff, dt);
      if (c.f < 1) c.f = Math.min(1, c.f + dt / FADE_MS);
      if (going || c.f < 1 || c.w !== c.tw) still.push(c);
      else { c.moving = false; c.v = 0; }
      markDirty(c.line);
    }
    moving = still;
  }

  // Woken characters go back to plain at their own time in the wave, on the frame it comes.
  function settleWave(now) {
    if (!revertStart) revertStart = now;
    var left = [];
    for (var j = 0; j < reverting.length; j++) {
      var rc = reverting[j];
      if (now < revertStart + rc.settle || isHot(rc)) { left.push(rc); continue; }
      sleep(rc);
      (rc.word ? rc.word.cells : [rc]).forEach(function (x) { x.reverting = false; });
    }
    reverting = left;
  }

  function tick(now) {
    var flicker = Math.min(0.9, 0.45 * o.speed);   // chance a hot cell changes this tick
    if (hot.length) {
      var still = [];
      for (var i = 0; i < hot.length; i++) {
        var c = hot[i];
        if (now < c.hot) { still.push(c); if (Math.random() < flicker) refresh(c, true); }
        else { c.hot = 0; c.inHot = false; refresh(c, false); }
      }
      hot = still;
    }

    if (decoding) {
      if (!decodeStart) decodeStart = now;
      var done = true;
      cells.forEach(function (c) {
        if (c.hot) return;
        if (now < decodeStart + c.settle) { done = false; if (Math.random() < 0.7) refresh(c, true); }
        else if (!c.settled) { c.settled = true; refresh(c, false); }
      });
      if (done) decoding = false;
      return;
    }

    if (o.motion !== 'always' || reduce || !cells.length) return;
    idleAcc += 60 * o.speed;
    if (idleAcc < 180) return;
    idleAcc = 0;
    var n = Math.max(1, Math.round(cells.length * 0.025));
    for (var k = 0; k < n; k++) { var r = pick(cells); if (!r.hot) refresh(r, false); }
  }

  // ---- the effect ----
  function setFrame(now, dt, p, moved) {
    F.now = now;
    F.dt = dt;
    F.pointer = p;
    F.moved = moved;
    F.fs = fs;
    F.lineH = lineH;
    F.width = W;
    F.height = H;
    F.speed = o.speed;
    F.radius = fs * o.hoverRadius;
    F.palette = palette();
    F.font = fontPx;
    F.glyphs = cells;
  }

  function call(c) {
    OUT.x = OUT.y = OUT.rotate = 0;
    OUT.scale = OUT.alpha = 1;
    OUT.swap = OUT.paint = false;
    fx.glyph(c, OUT, F);
    if (OUT.swap) swap(c, F.now);
  }

  // A swap makes the glyph hot: it scrambles for a moment, then settles. With rest: 'plain' only
  // the real pointer swaps, so the text always gets back to plain after it leaves.
  function swap(c, now) {
    if (!pointer && o.rest === 'plain') return;
    wakeCell(c);
    c.hot = now + 260 / Math.max(o.speed, 0.25);
    if (!c.inHot) { c.inHot = true; hot.push(c); }
  }

  // motion: 'always': a slow point that wanders over the text while the pointer is away.
  function wanderAt(now) {
    var t = now / 1000 * Math.max(o.speed, 0.25);
    wander.x = area.x + area.w * (0.5 + 0.5 * Math.sin(t * 0.43));
    wander.y = area.y + area.h * (0.5 + 0.5 * Math.sin(t * 0.71 + 1));
    return wander;
  }

  function runEffect(now, dt) {
    var p = pointer, pm = pointerMoved, i, c;
    if (!fx.frame) {
      // Without frame(), glyph() runs only when the pointer moved, and swaps are its only output.
      if (!p || !pm) return;
      pointerMoved = false;
      setFrame(now, dt, p, true);
      for (i = 0; i < cells.length; i++) if (!cells[i].anchor) call(cells[i]);
      return;
    }
    pointerMoved = false;
    if (!p && o.motion === 'always') { p = wanderAt(now); pm = true; }
    setFrame(now, dt, p, pm);
    var last = fxCells;
    fxCells = fxLast;
    fxLast = last;
    fxCells.length = 0;
    fxOn = !!fx.frame(F);
    if (fxOn) {
      releaseStart = 0;
      ease = 1;
      for (i = 0; i < cells.length; i++) {
        c = cells[i];
        if (c.anchor) continue;
        call(c);
        if (OUT.x || OUT.y || OUT.scale !== 1 || OUT.rotate || OUT.alpha !== 1 || OUT.paint) {
          c.tc = !c.tf || c.tx !== OUT.x || c.ty !== OUT.y || c.ts !== OUT.scale || c.tr !== OUT.rotate || c.ta !== OUT.alpha;
          c.tf = true;
          c.tx = OUT.x; c.ty = OUT.y; c.ts = OUT.scale; c.tr = OUT.rotate; c.ta = OUT.alpha; c.tp = OUT.paint;
          if (c.tc || c.tp) dirtyAny = true;
          fxCells.push(c);
        } else if (c.tf) {
          c.tf = false;
          markReach(c);
        }
      }
    } else if (last.length) {
      // Ease what the effect changed back to rest, then draw it plain again: the same pixels as plain.
      if (!releaseStart) releaseStart = now;
      var t = (now - releaseStart) * Math.max(o.speed, 0.25) / RELEASE_MS;
      ease = t < 1 ? 1 - t * t * (3 - 2 * t) : 0;
      for (i = 0; i < last.length; i++) {
        c = last[i];
        c.tp = false;
        c.tc = true;
        if (ease) fxCells.push(c);
        else { c.tf = false; markReach(c); }
      }
      dirtyAny = true;
      if (!ease) ease = 1;
    }
  }

  // Drops what the effect changed at once: for a new effect or text, and when motion stops.
  function clearFx() {
    fxCells.forEach(function (c) { c.tf = false; markReach(c); });
    fxCells.length = fxLast.length = 0;
    fxOn = false;
    ease = 1;
    releaseStart = 0;
  }

  function useEffect() {
    var r = resolve(EFFECTS, o.effect, 'breathe');
    clearFx();
    fx = r.mod;
    F.settings = r.settings;
    F.state = {};
    cells.forEach(function (c) { c.fx = undefined; });
  }

  function useLayout() {
    var r = resolve(LAYOUTS, o.layout, 'lines');
    lay = r.mod;
    M.settings = r.settings;
  }

  function onMove(e) {
    if (!animated()) return;
    if (!rect) rect = renderer.el.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointerMoved = true;
    cancelRevert();
    wake();
  }
  // The pointer left the text, the window or the page. Each of these can come with another.
  function onLeave() {
    if (!pointer && (revertTimer || reverting.length)) return;
    pointer = null;
    rect = null;
    scheduleRevert();
  }
  function onOut(e) { if (!e.relatedTarget) onLeave(); }
  function onScroll() { rect = null; }
  function onVisibility() {
    if (document.hidden) onLeave();
    wake();
  }
  function onMotionPref() {
    reduce = mq.matches;
    if (reduce) {
      cancelRevert();
      cells.forEach(function (c) { c.woke = false; });
      hot.forEach(function (c) { c.hot = 0; c.inHot = false; });
      hot = [];
      decoding = false;
      settleAll();
      moving.forEach(function (c) { c.w = c.peak = c.tw; c.v = 0; c.f = 1; c.moving = false; });
      moving = [];
      clearFx();
    }
    wake();
  }

  function replay() {
    cancelRevert();
    cells.forEach(function (c) { c.woke = false; });
    if (!animated()) { decoding = false; settleAll(); wake(); return; }
    var sp = Math.max(o.speed, 0.25);
    cells.forEach(function (c) {
      var off = (maxLen - c.len) / 2 + c.col;  // position on the centered row
      c.settled = false;
      c.settle = (250 + (off / maxLen) * 800 + Math.random() * 500) / sp;
    });
    decoding = true;
    decodeStart = 0;  // the intro starts on the first frame the text is on screen
    wake();
  }

  function update(next) {
    next = next || {};
    var linesChanged = next.lines && JSON.stringify(next.lines) !== JSON.stringify(o.lines);
    var rebuild = linesChanged || 'wordMap' in next || 'anchor' in next;
    var refont = ('font' in next && next.font !== o.font) || 'fonts' in next;
    Object.assign(o, next);
    if ('effect' in next) useEffect();
    if ('layout' in next) useLayout();
    if ('rest' in next || !animated()) {
      cells.forEach(function (c) { c.woke = false; });
      cancelRevert();
    }
    if (!animated()) {
      hot.forEach(function (c) { c.hot = 0; c.inHot = false; });
      hot = [];
      clearFx();
    }
    tables();
    if ('boxJitter' in next || 'boxSpan' in next) cells.forEach(function (c) { if (c.box) shape(c); });
    if (refont) loadFonts();
    if (rebuild) build();
    if (rebuild || refont || 'tracking' in next || 'wordSpacing' in next) measure();
    cells.forEach(function (c) { c.prev = null; });
    layout();
    if (rebuild) { settleAll(); if (linesChanged && o.intro) replay(); }
    else if (!decoding) settleAll();
    revertIfGone();
    flush();
    wake();
  }

  function destroy() {
    dead = true;
    cancelRevert();
    if (raf) win.cancelAnimationFrame(raf);
    if (io) io.disconnect();
    if (ro) ro.disconnect();
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerdown', onMove);
    root.removeEventListener('pointerleave', onLeave);
    root.removeEventListener('pointercancel', onLeave);
    root.removeEventListener('touchend', onLeave);
    document.removeEventListener('pointerout', onOut);
    win.removeEventListener('blur', onLeave);
    win.removeEventListener('scroll', onScroll, true);
    document.removeEventListener('visibilitychange', onVisibility);
    if (mq && mq.removeEventListener) mq.removeEventListener('change', onMotionPref);
    if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts);
    root.textContent = '';
    saved.forEach(function (n) { root.appendChild(n); });
  }

  // ---- start ----
  tables();
  useEffect();
  useLayout();
  renderer = canvasRenderer();
  root.insertBefore(renderer.el, sr);
  build();
  loadFonts();
  measure();
  layout();
  settleAll();
  if (o.intro) replay();
  moving.forEach(function (c) { c.w = c.peak = c.tw; c.f = 1; c.moving = false; });
  moving = [];
  if (!decoding) flush();
  wake();

  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerdown', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointercancel', onLeave);
  root.addEventListener('touchend', onLeave, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  win.addEventListener('blur', onLeave);
  win.addEventListener('scroll', onScroll, { passive: true, capture: true });
  document.addEventListener('visibilitychange', onVisibility);
  if (mq && mq.addEventListener) mq.addEventListener('change', onMotionPref);
  if (win.IntersectionObserver) {
    io = new win.IntersectionObserver(function (entries) {
      onScreen = entries[entries.length - 1].isIntersecting;
      wake();
    });
    io.observe(root);
  }
  if (win.ResizeObserver) {
    ro = new win.ResizeObserver(function (entries) {
      var w = entries[entries.length - 1].contentRect.width;
      if (w === W) return;
      W = w;
      rect = null;
      needLayout = true;
      wake();
    });
    ro.observe(root);
  }
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(onFonts);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
  }

  return { update: update, replay: replay, reroll: function () { settleAll(); revertIfGone(); wake(); }, destroy: destroy };
}

export { PALETTES as palettes, SETS as sets, WORDS as words, LOOKALIKE as lookalike, DEFAULTS as defaults };
