/*
  mathglyph.js
  A monospace "glyph noise" text effect: plain code-font text where some letters
  swap to math alphabets (𝕋 𝒢 𝔣 𝑛), Greek look-alikes (σ χ φ) and operators
  (⊨ ⊗ ∈ ↑), some get colored, and some get little outlined boxes.
  Each character's slot grows to fit the glyph it shows, so lines breathe as
  wide symbols swap in. Moving the pointer over the text scrambles the
  characters near it.

  Fonts: the default stack is system fonts. For full math coverage, self-host a
  math font (for example Noto Sans Math, OFL) and add it to the `font` stack.

  Usage:
    const hero = MathGlyph.mount(document.getElementById('hero'), {
      lines: ['first line', 'a *highlighted* word'],   // *stars* = white, kept readable at rest
    });
    hero.update({ substitute: 0.4 });   // change any option live
    hero.replay();                      // run the intro again
    hero.destroy();

  Options (all optional):
    lines        array of strings, one per row. Wrap words in *stars* to highlight them.
    palette      'pastel' | 'ember' | 'ice' | 'mono', or an array of hex colors
    substitute   0..1  share of letters swapped for math/Greek/operator glyphs at rest
    color        0..1  how often glyphs get a palette color
    box          0..1  how often colored glyphs get an outlined box
    symbols      'all', or an array of groups: 'general', 'calculus', 'logic',
                 'linalg', 'numbers', 'geometry', 'statistics', 'physics',
                 'engineering', 'chemistry', 'cs', 'greek', 'bioastro',
                 'economics', 'philosophy', 'linguistics', 'law',
                 'finance', 'category', 'functional', 'proofs'
    tokens       true = also swap in short notation like ∫₀, ℏω, ⊗², &&
                 (only when expand is on, since they need wider slots)
    symbolMix    0..1  share of swaps that use the symbol groups instead of
                 math-alphabet or Greek versions of the same letter
    legible      0..1  how often a swapped letter uses a symbol that looks like it
                 (∃ for E, ∪ for U, ∅ for O) instead of a random one
    words        0..1  how often words with a symbol meaning swap whole
                 (and → ∧, therefore → ∴, every → ∀). Needs expand on.
    motion       'hover'  = still until the pointer moves over it (default)
                 'always' = hover, plus a slow constant reshuffle
                 'still'  = no animation at all
    intro        true = play a left-to-right decode when it first appears
    speed        0.25..2  how fast the scramble flickers and settles
    hoverRadius  how far the hover reaches, in character heights
    expand       true = slots grow to fit wide glyphs; false = strict monospace grid
    base         color of plain text
    highlight    color of *highlighted* text
    font         CSS font-family stack
    fit          true = scale the font so the text fits the container width
    maxSize      largest font size in px when fit is on
*/
(function (global) {
  'use strict';

  var BASE = { bold: 0x1D400, italic: 0x1D434, script: 0x1D49C, fraktur: 0x1D504, double: 0x1D538 };
  // Letters that Unicode keeps outside the Mathematical Alphanumeric block.
  var HOLES = {
    italic:  { h: 'ℎ' },
    script:  { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ',
               M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
    fraktur: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
    double:  { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
  };
  var GREEK = {
    a: 'α', b: 'β', e: 'ε', o: 'σ', x: 'χ', n: 'η', p: 'φ', t: 'τ', u: 'υ', w: 'ω',
    i: 'ι', k: 'κ', m: 'μ', v: 'ν', y: 'γ', d: '∂', l: 'λ',
    A: 'Δ', E: 'Σ', L: 'Λ', M: 'Π', O: 'Ω', P: 'Φ', T: 'Τ', W: 'Ψ'
  };
  // Symbols that look like a given letter, used by the 'legible' option.
  var LOOKALIKE = {
    A: '∀Λ∆', a: '∂α', B: 'β', b: 'β', C: '⊂ℂ∁', c: '⊂', D: '∂', d: '∂', E: '∃∈Σ', e: '∈ε',
    F: '∫', f: '∫', H: 'ℍ', h: 'ℏ', I: '∣', i: 'ι', J: '⌋', j: '⌋', K: 'κ', k: 'κ',
    L: '⌊∟', l: 'ℓ∣', N: 'ℕ', n: '∩η', O: '∅Θ⊕○', o: '∘σ⊙', P: 'ℙρ', p: 'ρ', Q: 'ℚ',
    R: 'ℝ', S: '∫§', s: '∫', T: '⊤', t: '†τ', U: '∪', u: '∪μ', V: '∨√', v: '∨ν',
    W: 'ω', w: 'ω', X: '×χ', x: '×χ', Y: 'γ', y: 'γ', Z: 'ℤ', '0': '∅', '1': '∣', '3': '∃'
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
    mono:   ['#f2f2f2', '#c4c4c4', '#a3a3a3', '#dedede', '#b5b5b5', '#8f8f8f']
  };

  var DEFAULTS = {
    lines: ['plain text, now with', 'a *math* accent'],
    palette: 'pastel',
    substitute: 0.35,
    color: 0.55,
    box: 0.22,
    symbols: 'all',
    tokens: true,
    symbolMix: 0.15,
    legible: 0.6,
    words: 0.7,
    motion: 'hover',
    intro: true,
    speed: 1,
    hoverRadius: 2.6,
    expand: true,
    base: '#8d8b93',
    highlight: '#ffffff',
    font: "'JetBrains Mono', 'Noto Sans Math', 'Noto Sans Mono', ui-monospace, monospace",
    fit: true,
    maxSize: 44
  };

  var MONO_W = 0.6;  // advance width of JetBrains Mono, in em
  var BOX_PAD = 0.16;

  var CSS =
    '.mg{font-family:var(--mg-font);text-align:center;white-space:pre;font-variant-ligatures:none;touch-action:pan-y}' +
    '.mg-line{display:block;line-height:1.5}' +
    '.mg-c{display:inline-block;width:' + MONO_W + 'em;line-height:1.24;text-align:center;border-radius:.16em;' +
    'vertical-align:baseline;transition:width .26s cubic-bezier(.2,.8,.2,1),opacity .2s,background-color .2s,box-shadow .2s}' +
    '.mg-gone{width:0!important;overflow:hidden;opacity:0}' +
    '.mg-box{background:color-mix(in srgb,var(--c) 16%,transparent);' +
    'box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 78%,transparent)}' +
    '@media (prefers-reduced-motion:reduce){.mg-c{transition:none}}';

  function injectCSS() {
    if (document.getElementById('mg-style')) return;
    var s = document.createElement('style');
    s.id = 'mg-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function variant(ch, style) {
    if (HOLES[style] && HOLES[style][ch]) return HOLES[style][ch];
    var up = ch >= 'A' && ch <= 'Z', lo = ch >= 'a' && ch <= 'z';
    if (!up && !lo) return ch;
    var i = up ? ch.charCodeAt(0) - 65 : 26 + ch.charCodeAt(0) - 97;
    return String.fromCodePoint(BASE[style] + i);
  }

  function parseLine(line) {
    var out = [], hl = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '*') { hl = !hl; continue; }
      out.push({ ch: ch, hl: hl });
    }
    return out;
  }

  function mount(root, options) {
    injectCSS();
    var o = Object.assign({}, DEFAULTS, options || {});
    var cells = [], maxLen = 1, timer = null, decoding = false, idleAcc = 0, ro = null;
    var widthCache = {}, ctx = null;
    var pointer = null, rafPending = false;
    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function palette() {
      return Array.isArray(o.palette) ? o.palette : (PALETTES[o.palette] || PALETTES.pastel);
    }

    // ---- symbol pool from the chosen groups ----
    var pool = [];
    function buildPool() {
      var keys = (!o.symbols || o.symbols === 'all') ? Object.keys(SETS)
        : [].concat(o.symbols).filter(function (k) { return SETS[k]; });
      if (!keys.length) keys = ['general'];
      pool = keys.map(function (k) { return SETS[k]; });
    }
    function pickSymbol() {
      var set = pick(pool);
      if (o.tokens && o.expand && set.tokens.length && Math.random() < 0.3) return pick(set.tokens);
      return pick(set.symbols);
    }

    function lookalike(ch) {
      var opts = [];
      if (LOOKALIKE[ch]) { var l = Array.from(LOOKALIKE[ch]); opts = opts.concat(l, l); }  // weighted x2
      if (GREEK[ch]) opts.push(GREEK[ch]);
      opts.push(variant(ch, 'bold'), variant(ch, 'italic'), variant(ch, 'double'));
      return pick(opts);
    }

    function mutate(ch) {
      if (ch >= '0' && ch <= '9') {
        if (LOOKALIKE[ch] && Math.random() < o.legible * 0.5) return pick(Array.from(LOOKALIKE[ch]));
        if (Math.random() < o.symbolMix) return pickSymbol();
        return String.fromCodePoint((Math.random() < 0.5 ? 0x1D7CE : 0x1D7D8) + (+ch));
      }
      if (!/[A-Za-z]/.test(ch)) return pickSymbol();
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

    // ---- glyph widths (measured once per glyph, in em) ----
    function glyphW(g) {
      if (g === ' ') return MONO_W;
      if (widthCache[g] != null) return widthCache[g];
      if (!ctx) ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '100px ' + o.font;
      var w = ctx.measureText(g).width / 100;
      widthCache[g] = w;
      return w;
    }
    function applyWidth(c) {
      if (!c.state) return;
      if (!o.expand) { c.el.style.width = ''; return; }
      var w = Math.max(MONO_W, glyphW(c.state.g)) + (c.state.box ? BOX_PAD : 0) + (c.state.pad ? 0.34 : 0);
      c.el.style.width = w.toFixed(3) + 'em';
    }

    // ---- choosing what a character shows ----
    function roll(c, scramble) {
      var pal = palette();
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
      c.state = s;
      c.el.textContent = s.g;
      var color = s.col || (c.hl ? o.highlight : o.base);
      c.el.style.color = color;
      c.el.style.setProperty('--c', color);
      c.el.classList.toggle('mg-box', s.box);
      c.el.classList.toggle('mg-gone', !!s.gone);
      applyWidth(c);
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

    function fit() {
      if (!o.fit) { root.style.fontSize = ''; return; }
      var w = root.clientWidth;
      if (!w) return;
      var perChar = o.expand ? 0.72 : 0.62;   // leave room for lines to grow
      root.style.fontSize = Math.max(8, Math.min(o.maxSize, w / (maxLen * perChar))) + 'px';
    }

    function build() {
      root.innerHTML = '';
      root.classList.add('mg');
      root.style.setProperty('--mg-font', o.font);
      var plain = [];
      cells = [];
      maxLen = 1;
      o.lines.forEach(function (line) {
        var parsed = parseLine(line);
        maxLen = Math.max(maxLen, parsed.length);
        plain.push(parsed.map(function (p) { return p.ch; }).join(''));
        var row = document.createElement('span');
        row.className = 'mg-line';
        row.setAttribute('aria-hidden', 'true');
        var lineCells = [];
        parsed.forEach(function (p, col) {
          var el = document.createElement('span');
          el.className = 'mg-c';
          row.appendChild(el);
          var c = { ch: p.ch, hl: p.hl, el: el, col: col, len: parsed.length, settle: 0, hot: 0, state: null, word: null };
          cells.push(c);
          lineCells.push(c);
        });
        // Mark whole words that have a symbol (never inside *highlighted* text).
        var text = parsed.map(function (p) { return p.ch; }).join('');
        var re = /[A-Za-z]+/g, m;
        while ((m = re.exec(text))) {
          var sym = WORDS[m[0].toLowerCase()];
          if (!sym) continue;
          var wc = lineCells.slice(m.index, m.index + m[0].length);
          if (wc.some(function (c) { return c.hl; })) continue;
          var w = { sym: sym, cells: wc, on: false };
          wc.forEach(function (c) { c.word = w; });
        }
        root.appendChild(row);
      });
      root.setAttribute('role', 'img');
      root.setAttribute('aria-label', plain.join(' '));
      fit();
    }

    function settleAll() {
      cells.forEach(function (c) {
        if (!c.word) paint(c, roll(c, false));
        else if (c === c.word.cells[0]) rollWord(c.word);
      });
    }

    function animated() { return !reduce && o.motion !== 'still'; }

    // ---- hover: mark characters near the pointer as "hot" ----
    function scanPointer() {
      rafPending = false;
      if (!pointer || !animated()) return;
      var fs = parseFloat(getComputedStyle(root).fontSize) || 16;
      var rx = fs * o.hoverRadius, ry = fs * o.hoverRadius * 0.62;
      var until = performance.now() + 260 / Math.max(o.speed, 0.25);
      for (var i = 0; i < cells.length; i++) {
        var r = cells[i].el.getBoundingClientRect();
        var dx = (r.left + r.width / 2 - pointer.x) / rx;
        var dy = (r.top + r.height / 2 - pointer.y) / ry;
        if (dx * dx + dy * dy < 1) cells[i].hot = until;
      }
    }
    function onMove(e) {
      pointer = { x: e.clientX, y: e.clientY };
      if (!rafPending) { rafPending = true; requestAnimationFrame(scanPointer); }
    }
    function onLeave() { pointer = null; }

    // ---- the clock ----
    function tick() {
      var now = performance.now();
      var flicker = Math.min(0.9, 0.45 * o.speed);   // chance a hot cell changes this tick

      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (!c.hot) continue;
        if (now < c.hot) { if (Math.random() < flicker) refresh(c, true); }
        else { c.hot = 0; refresh(c, false); }
      }

      if (decoding) {
        var done = true;
        cells.forEach(function (c) {
          if (c.hot) return;
          if (now < c.settle) { done = false; if (Math.random() < 0.7) refresh(c, true); }
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

    function replay() {
      if (!animated()) { decoding = false; settleAll(); return; }
      var start = performance.now(), sp = Math.max(o.speed, 0.25);
      cells.forEach(function (c) {
        var off = (maxLen - c.len) / 2 + c.col;  // position on the centered row
        c.settled = false;
        c.settle = start + (250 + (off / maxLen) * 800 + Math.random() * 500) / sp;
      });
      decoding = true;
    }

    function onFonts() {
      widthCache = {};
      cells.forEach(applyWidth);
      fit();
    }

    buildPool();
    build();
    settleAll();
    if (o.intro) replay();
    timer = setInterval(tick, 60);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    if (global.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(root); }
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(onFonts);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
    }

    return {
      update: function (next) {
        var linesChanged = next.lines && JSON.stringify(next.lines) !== JSON.stringify(o.lines);
        if (next.font && next.font !== o.font) widthCache = {};
        Object.assign(o, next);
        buildPool();
        if (linesChanged) { build(); settleAll(); if (o.intro) replay(); }
        else {
          root.style.setProperty('--mg-font', o.font);
          fit();
          if (!decoding) settleAll();
        }
      },
      replay: replay,
      reroll: settleAll,
      destroy: function () {
        clearInterval(timer);
        if (ro) ro.disconnect();
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerleave', onLeave);
        if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts);
        root.innerHTML = '';
        root.classList.remove('mg');
      }
    };
  }

  global.MathGlyph = { mount: mount, palettes: PALETTES, sets: SETS, words: WORDS, lookalike: LOOKALIKE, defaults: DEFAULTS };
})(window);
