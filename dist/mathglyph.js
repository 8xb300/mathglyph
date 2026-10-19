/*! mathglyph v0.3.1 | MIT | github.com/8xb300/mathglyph */

// src/mathglyph.js
var BASE = { bold: 119808, italic: 119860, script: 119964, fraktur: 120068, double: 120120 };
var HOLES = {
  italic: { h: "ℎ" },
  script: {
    B: "ℬ",
    E: "ℰ",
    F: "ℱ",
    H: "ℋ",
    I: "ℐ",
    L: "ℒ",
    M: "ℳ",
    R: "ℛ",
    e: "ℯ",
    g: "ℊ",
    o: "ℴ"
  },
  fraktur: { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" },
  double: { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" }
};
var GREEK_STYLES = [120488, 120546, 120604, 120662, 120720];
var GREEK = {
  a: "α",
  b: "β",
  e: "ε",
  o: "σ",
  x: "χ",
  n: "η",
  p: "φ",
  t: "τ",
  u: "υ",
  w: "ω",
  i: "ι",
  k: "κ",
  m: "μ",
  v: "ν",
  y: "γ",
  d: "∂",
  l: "λ",
  A: "Δ",
  E: "Σ",
  L: "Λ",
  M: "Π",
  O: "Ω",
  P: "Φ",
  T: "Τ",
  W: "Ψ"
};
var LOOKALIKE = {
  A: "∀Λ∆",
  a: "∂α",
  B: "β",
  b: "β",
  C: "⊂ℂ∁",
  c: "⊂",
  D: "∂",
  d: "∂",
  E: "∃∈Σ",
  e: "∈ε",
  F: "∫",
  f: "∫",
  H: "ℍ",
  h: "ℏ",
  I: "∣",
  i: "ι",
  J: "⌋",
  j: "⌋",
  K: "κ",
  k: "κ",
  L: "⌊∟",
  l: "ℓ∣",
  N: "ℕ",
  n: "∩η",
  O: "∅Θ⊕○",
  o: "∘σ⊙",
  P: "ℙρ",
  p: "ρ",
  Q: "ℚ",
  R: "ℝ",
  S: "∫§",
  s: "∫",
  T: "⊤",
  t: "†τ",
  U: "∪",
  u: "∪μ",
  V: "∨√",
  v: "∨ν",
  W: "ω",
  w: "ω",
  X: "×χ",
  x: "×χ",
  Y: "γ",
  y: "γ",
  Z: "ℤ",
  "0": "∅",
  "1": "∣",
  "3": "∃"
};
var WORDS = {
  and: "∧",
  or: "∨",
  not: "¬",
  no: "¬",
  therefore: "∴",
  so: "∴",
  because: "∵",
  since: "∵",
  to: "→",
  into: "→",
  then: "⇒",
  implies: "⇒",
  iff: "⇔",
  "in": "∈",
  every: "∀",
  all: "∀",
  each: "∀",
  some: "∃",
  exists: "∃",
  about: "≈",
  approximately: "≈",
  roughly: "≈",
  forever: "∞",
  infinite: "∞",
  infinity: "∞",
  change: "Δ",
  delta: "Δ",
  equals: "=",
  plus: "+",
  minus: "−",
  times: "×",
  sum: "∑",
  integral: "∫",
  nothing: "∅",
  none: "∅",
  empty: "∅",
  less: "<",
  more: ">",
  at: "@",
  per: "/",
  percent: "%",
  section: "§",
  pi: "π",
  lambda: "λ",
  between: "↔",
  from: "←",
  proof: "∎",
  qed: "∎"
};
var T = "︎";
function S(str) {
  return Array.from(str);
}
var SETS = {
  general: {
    label: "General",
    symbols: S("÷∼≺≻≠≤≥≈↖{}±√∛×⋅…"),
    tokens: ["±1", "√2", "½", "¾"]
  },
  calculus: {
    label: "Calculus",
    symbols: S("∑∏∐∫∬∭∮∯∂∇′″∞∆"),
    tokens: ["∫₀", "∑₁", "∂²", "∇²", "∫∫", "∂∂"]
  },
  logic: {
    label: "Logic & sets",
    symbols: S("∀∃∄¬∧∨⊻⊼⊢⊣⊨⊤⊥⇒⇔∈∉∋⊂⊃⊆⊇⊊∪∩∖∅ℵℶ"),
    tokens: ["ℵ₀", "¬∃", "⊢⊥", "⇔¬"]
  },
  linalg: {
    label: "Linear algebra",
    symbols: S("⊗⊕⊖⊙⊘⊥⟨⟩†‖⊺⋅×"),
    tokens: ["⊗²", "⊕²", "⟨·⟩", "‖·‖", "⊗³"]
  },
  numbers: {
    label: "Number theory",
    symbols: S("∣∤≡≢⌊⌋⌈⌉ℤℚℕℝℂℙ"),
    tokens: ["ℤ₂", "ℤ₇", "ℚ²", "ℝ³", "ℂ²", "⌊·⌋"]
  },
  geometry: {
    label: "Geometry",
    symbols: S("△▱□○∠∡∢∟⊥∥∦≅≃∼⌒°π"),
    tokens: ["2π", "π²", "∠°", "△≅△"]
  },
  statistics: {
    label: "Statistics",
    symbols: S("∼≈∓±‰∝𝔼ℙ𝕍⫫∣μσρχ"),
    tokens: ["σ²", "χ²", "ρ²", "μ₀", "𝔼[·]", "ℙ(·)"]
  },
  physics: {
    label: "Physics",
    symbols: S("ℏ∝°Å∂∇∮⟨⟩∣ℓ⊙∞"),
    tokens: ["ℏω", "∂²", "Δφ", "∇²", "∇×", "∇·", "⟨ψ|", "|ψ⟩", "γ⁰"]
  },
  engineering: {
    label: "Engineering",
    symbols: S("∠∥△⊙Ω⌀±°∝≈"),
    tokens: ["∠θ", "ω₀", "τ₀", "Ω²"]
  },
  chemistry: {
    label: "Chemistry",
    symbols: S("⇌⇋⇄⟶→↑↓°‡≡⁺Δ"),
    tokens: ["δ⁺", "⁺⁺", "⇌°", "‡"]
  },
  cs: {
    label: "CS",
    symbols: S("λ↦≡∘←⊕⊻⊤⊥⌈⌉⌊⌋∅⊑"),
    tokens: ["&&", "::", "=>", "<<", "!=", "->", "[]", "{}"]
  },
  greek: {
    label: "Greek",
    symbols: S("αβγδεζηθικλμνξπρστυφχψωϕϑϵϱΓΔΘΛΞΠΣΦΨΩ"),
    tokens: ["θ₀", "ψ²", "Δθ", "ξ₁"]
  },
  bioastro: {
    label: "Bio & astro",
    symbols: ["♀" + T, "♂" + T, "×", "☉", "⊕"],
    tokens: ["♀" + T + "×♂" + T, "☉⊕"]
  },
  economics: {
    label: "Economics",
    symbols: S("≻≺≿≾∼∂∑𝔼ΔΓΘνραβ"),
    tokens: ["β₁", "α₀", "Δ%", "∂π", "Γ²"]
  },
  philosophy: {
    label: "Philosophy",
    symbols: S("□◇∴∵∷∶⊢⊨⊬⊭⊩¬→↔∧∨⊃≡⊥⊤⊸⅋"),
    tokens: ["□◇", "◇¬", "∴□", "⊢□", "¬□", "∵∴", "⊩◇", "⊸⅋"]
  },
  proofs: {
    label: "Proofs",
    symbols: S("∎□∴∵∷∶≔≕≝≜≐⋮⋯⋰⋱⊢⊬⊨"),
    tokens: ["∴∎", "≔∎", "⋯⋯", "∵∴", "⊢∎", "≝⋯"]
  },
  linguistics: {
    label: "Linguistics",
    symbols: S("əʃʒŋðθʔɾɪʊɛɔæɑʌɹːˈ⟦⟧λ"),
    tokens: ["⟦·⟧", "/ə/", "[ʃ]", "ˈŋ", "ðə"]
  },
  law: {
    label: "Law & texts",
    symbols: S("§¶†‡"),
    tokens: ["§§", "§1", "¶2", "§3"]
  },
  finance: {
    label: "Finance",
    symbols: S("$€£¥₹¢₿%‰±Δ↑↓"),
    tokens: ["$1", "€2", "±%", "₹¥", "¢¢", "Δ%"]
  },
  category: {
    label: "Category theory",
    symbols: S("↪↠⇉⇇⊣⊢≅∘→⟶⟹⊗⥲"),
    tokens: ["⊣⊢", "↪↠", "≅∘", "⇉⇇", "→∘→"]
  },
  functional: {
    label: "Functional prog.",
    symbols: S("λ∘⊥→⇒∀∷"),
    tokens: [">>=", "<$>", "|>", "<*>", "<|>", ">=>", "::", "\\λ"]
  }
};
var PALETTES = {
  pastel: ["#8fc27a", "#7aa2f7", "#a98bff", "#e3b34c", "#e8798e", "#5fb8a5"],
  ember: ["#f2a65a", "#e0705f", "#d9c06a", "#c98bd9", "#7fc4b0", "#f3d3a4"],
  ice: ["#7fd1e8", "#8ea8ff", "#b39cff", "#6fe0c2", "#c6d4ff", "#5aa9e6"],
  mono: ["#f2f2f2", "#c4c4c4", "#a3a3a3", "#dedede", "#b5b5b5", "#8f8f8f"],
  shimmer: ["#a70947", "#ff0000", "#ffa500", "#ffe135", "#008000", "#6475d8", "#1e90ff"]
};
var MONO_STACK = "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'JetBrains Mono', 'DejaVu Sans Mono', 'Liberation Mono', 'Noto Sans Mono'";
var DEFAULTS = {
  lines: ["plain text, now with", "a *math* accent"],
  palette: "pastel",
  substitute: 0.35,
  color: 0.55,
  box: 0.22,
  boxStyle: "detect",
  labels: 0.6,
  labelFormat: null,
  symbols: "all",
  sets: null,
  tokens: true,
  symbolMix: 0.15,
  legible: 0.6,
  lookalikes: null,
  words: 0.7,
  wordMap: null,
  motion: "hover",
  rest: "glyphs",
  revert: 0,
  anchor: null,
  tracking: -0.04,
  wordSpacing: 0.3,
  intro: true,
  speed: 1,
  hoverRadius: 2.6,
  expand: true,
  base: "#8d8b93",
  highlight: "#ffffff",
  font: MONO_STACK + ", 'Noto Sans Math', 'STIX Two Math', 'Cambria Math', monospace",
  fonts: [],
  fit: true,
  maxSize: 44
};
var BOX_PAD = 0.16;
var SPACE_PAD = 0.34;
var LINE_H = 1.5;
var CELL_H = 1.24;
var LABEL_EM = 0.26;
var TICK = 60;
var SPRING = 20;
var SETTLE_SPRING = 13;
var PEAK_MS = 350;
var FADE_MS = 80;
var REVERT_WAVE_MS = 700;
var segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;
function graphemes(s) {
  return segmenter ? Array.from(segmenter.segment(s), function(x) {
    return x.segment;
  }) : Array.from(s);
}
function pick(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function variant(ch, style) {
  if (HOLES[style] && HOLES[style][ch]) return HOLES[style][ch];
  var up = ch >= "A" && ch <= "Z", lo = ch >= "a" && ch <= "z";
  if (!up && !lo) return ch;
  var i = up ? ch.charCodeAt(0) - 65 : 26 + ch.charCodeAt(0) - 97;
  return String.fromCodePoint(BASE[style] + i);
}
function greekVariant(ch) {
  var cp = ch.codePointAt(0);
  var i = cp >= 913 && cp <= 937 && cp !== 930 ? cp - 913 : cp >= 945 && cp <= 969 ? 26 + cp - 945 : -1;
  return i < 0 || ch.length > 1 ? null : String.fromCodePoint(pick(GREEK_STYLES) + i);
}
function isLatin(ch) {
  return /^[A-Za-z]$/.test(ch);
}
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
  graphemes(line).forEach(function(ch) {
    if (ch === "*") {
      hl = !hl;
      return;
    }
    out.push({ ch, hl });
  });
  return out;
}
var measureCtx = null;
var measureFont = "";
function measureText(font, g) {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  if (measureFont !== font) {
    measureCtx.font = font;
    measureFont = font;
  }
  return measureCtx.measureText(g);
}
var faces = {};
function contentWidth(el) {
  var cs = (el.ownerDocument.defaultView || window).getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}
function mount(root, options) {
  var o = Object.assign({}, DEFAULTS, options || {});
  var win = root.ownerDocument.defaultView || window;
  var lines = [], cells = [], hot = [], moving = [], dirty = [], dirtyAny = false;
  var maxLen = 1, maxNatural = 1, maxGrid = 1;
  var look, wordTable, allSets, pool = [];
  var widths = {}, stack = "", monoEm = 0.6, ascEm = 0.8, descEm = 0.2;
  var W = contentWidth(root), H = 0, dpr = 1, fs = 16, lineH = 24, boxH = 20, monoPx = 9.6;
  var fontPx = "", labelPx = "";
  var decoding = false, decodeStart = 0, idleAcc = 0, lastTick = 0, lastFrame = 0;
  var reverting = [], revertStart = 0, revertTimer = 0;
  var raf = 0, dead = false, onScreen = true, needMeasure = false, needLayout = false;
  var pointer = null, pointerMoved = false, rect = null;
  var mq = win.matchMedia ? win.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduce = !!(mq && mq.matches);
  var renderer, io = null, ro = null;
  var saved = Array.prototype.slice.call(root.childNodes);
  root.textContent = "";
  var sr = document.createElement("span");
  sr.style.cssText = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:pre-line";
  root.appendChild(sr);
  function palette() {
    return Array.isArray(o.palette) ? o.palette : PALETTES[o.palette] || PALETTES.pastel;
  }
  function tables() {
    look = Object.assign({}, LOOKALIKE, o.lookalikes);
    wordTable = Object.assign({}, WORDS);
    if (o.wordMap) Object.keys(o.wordMap).forEach(function(k) {
      wordTable[k.toLowerCase()] = o.wordMap[k];
    });
    allSets = Object.assign({}, SETS);
    if (o.sets) Object.keys(o.sets).forEach(function(k) {
      var s = o.sets[k];
      allSets[k] = {
        label: s.label || k,
        symbols: typeof s.symbols === "string" ? graphemes(s.symbols) : s.symbols || [],
        tokens: s.tokens || []
      };
    });
    var keys = !o.symbols || o.symbols === "all" ? Object.keys(allSets) : [].concat(o.symbols).filter(function(k) {
      return allSets[k] && allSets[k].symbols.length;
    });
    if (!keys.length) keys = ["general"];
    pool = keys.map(function(k) {
      return allSets[k];
    });
  }
  function pickSymbol() {
    var set = pick(pool);
    if (o.tokens && o.expand && set.tokens.length && Math.random() < 0.3) return pick(set.tokens);
    return pick(set.symbols);
  }
  function lookalike(ch) {
    var opts = [];
    if (look[ch]) {
      var l = Array.from(look[ch]);
      opts = opts.concat(l, l);
    }
    if (GREEK[ch]) opts.push(GREEK[ch]);
    opts.push(variant(ch, "bold"), variant(ch, "italic"), variant(ch, "double"));
    return pick(opts);
  }
  function mutate(ch) {
    if (ch >= "0" && ch <= "9" && ch.length === 1) {
      if (look[ch] && Math.random() < o.legible * 0.5) return pick(Array.from(look[ch]));
      if (Math.random() < o.symbolMix) return pickSymbol();
      return String.fromCodePoint((Math.random() < 0.5 ? 120782 : 120792) + +ch);
    }
    if (!isLatin(ch)) return mutateOther(ch);
    if (Math.random() < o.legible) return lookalike(ch);
    if (Math.random() < o.symbolMix) return pickSymbol();
    var r = Math.random();
    if (r < 0.33) return variant(ch.toUpperCase(), "double");
    if (r < 0.5) return variant(ch, "italic");
    if (r < 0.61) return variant(ch, "script");
    if (r < 0.69) return variant(ch, "fraktur");
    if (r < 0.9 && GREEK[ch]) return GREEK[ch];
    if (r < 0.98) return variant(ch, "bold");
    return pickSymbol();
  }
  function mutateOther(ch) {
    var key = look[ch] ? ch : ch.normalize("NFD").charAt(0);
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
  function glyphW(g) {
    if (g === " ") return monoEm;
    var w = widths[g];
    if (w === void 0) w = widths[g] = measureText("100px " + stack, g).width / 100;
    return w;
  }
  function plainWidth(ch, grid) {
    if (ch === " ") return o.wordSpacing;
    return (grid ? grid * monoEm : Math.max(monoEm, glyphW(ch))) + o.tracking;
  }
  function slotWidth(c) {
    if (!o.expand) return plainWidth(c.ch, c.grid) * fs;
    if (c.gone) return 0;
    if (c.g === " ") return o.wordSpacing * fs;
    return (Math.max(monoEm, glyphW(c.g)) + o.tracking + (c.box ? BOX_PAD : 0) + (c.pad ? SPACE_PAD : 0)) * fs;
  }
  function retarget(c) {
    var tw = slotWidth(c);
    if (tw === c.tw) return;
    c.tw = tw;
    if (!animated()) {
      c.w = c.peak = tw;
      c.v = 0;
      return;
    }
    c.w0 = c.w;
    if (!c.mix || tw > c.peak) c.peak = tw;
    c.stiff = (c.reverting || c.gone || c.w0 < 0.5 ? SETTLE_SPRING : SPRING) * Math.max(o.speed, 0.25);
    move(c);
  }
  function move(c) {
    if (!c.moving) {
      c.moving = true;
      moving.push(c);
    }
  }
  function markDirty(i) {
    dirty[i] = true;
    dirtyAny = true;
  }
  function roll(c, scramble) {
    var s = choose(c, scramble);
    s.mix = scramble;
    return s;
  }
  function choose(c, scramble) {
    var pal = palette();
    if (c.anchor) return { g: c.ch, col: null, box: false };
    if (c.ch === " ") {
      var spaceRate = (scramble ? 0.2 : o.substitute * 0.12) * (1 - o.legible * 0.7);
      if (Math.random() < spaceRate) {
        return { g: pickSymbol(), col: Math.random() < o.color ? pick(pal) : null, box: false, pad: true };
      }
      return { g: " ", col: null, box: false };
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
    return { g: sub ? mutate(c.ch) : c.ch, col, box: colored && Math.random() < Math.min(1, o.box * 1.8) };
  }
  function paint(c, s) {
    var col = s.col || null, box = !!s.box;
    if (animated() && c.w >= 0.5 && (s.g !== c.g || col !== c.color || box !== c.box)) {
      if (c.f >= 0.5) {
        c.og = c.g;
        c.oc = colorOf(c);
        c.ob = c.box;
        c.ol = showsLabel(c);
        c.f = c.f < 1 ? 1 - c.f : 0;
      }
      move(c);
    }
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
  function rollWord(w) {
    if (o.expand && Math.random() < o.words) {
      w.on = true;
      var colored = Math.random() < Math.max(o.color, 0.5);
      var col = colored ? pick(palette()) : null;
      var box = colored && Math.random() < Math.min(1, o.box * 1.8);
      w.cells.forEach(function(c, i) {
        paint(c, i === 0 ? { g: w.sym, col, box } : { g: c.ch, col: null, box: false, gone: true });
      });
    } else {
      w.on = false;
      w.cells.forEach(function(c) {
        paint(c, roll(c, false));
      });
    }
  }
  function refresh(c, scramble) {
    if (!scramble && rests(c)) {
      sleep(c);
      return;
    }
    var w = c.word;
    if (!w) {
      paint(c, roll(c, scramble));
      return;
    }
    if (scramble) {
      if (w.on) {
        w.on = false;
        w.cells.forEach(function(x) {
          if (x !== c) paint(x, roll(x, false));
        });
      }
      paint(c, roll(c, true));
      return;
    }
    for (var i = 0; i < w.cells.length; i++) {
      if (w.cells[i] !== c && w.cells[i].hot) {
        paint(c, roll(c, false));
        return;
      }
    }
    rollWord(w);
  }
  function settleAll() {
    cells.forEach(function(c) {
      if (rests(c)) {
        if (!c.word || c === c.word.cells[0]) sleep(c);
      } else if (!c.word) paint(c, roll(c, false));
      else if (c === c.word.cells[0]) rollWord(c.word);
    });
  }
  function rests(c) {
    return o.rest === "plain" && !c.woke;
  }
  function wakeCell(c) {
    if (c.woke || o.rest !== "plain" || c.anchor) return;
    (c.word ? c.word.cells : [c]).forEach(function(x) {
      x.woke = true;
    });
  }
  function sleep(c) {
    var w = c.word;
    if (w) w.on = false;
    (w ? w.cells : [c]).forEach(function(x) {
      x.woke = false;
      paint(x, { g: x.ch, col: null, box: false });
    });
  }
  function isHot(c) {
    return c.word ? c.word.cells.some(function(x) {
      return x.hot;
    }) : !!c.hot;
  }
  function revertIfGone() {
    if (!pointer && !reverting.length) scheduleRevert();
  }
  function cancelRevert() {
    if (revertTimer) {
      win.clearTimeout(revertTimer);
      revertTimer = 0;
    }
    reverting.forEach(function(c) {
      c.reverting = false;
    });
    reverting = [];
  }
  function startRevert() {
    revertTimer = 0;
    var sp = Math.max(o.speed, 0.25);
    cells.forEach(function(c) {
      if (!c.woke || c.reverting || c.word && c !== c.word.cells[0]) return;
      var off = (maxLen - c.len) / 2 + c.col;
      c.settle = (off / maxLen * REVERT_WAVE_MS + Math.random() * 40) / sp;
      (c.word ? c.word.cells : [c]).forEach(function(x) {
        x.reverting = true;
      });
      reverting.push(c);
    });
    revertStart = 0;
    wake();
  }
  function scheduleRevert() {
    cancelRevert();
    if (o.rest !== "plain" || !animated()) return;
    if (!cells.some(function(c) {
      return c.woke;
    })) return;
    if (o.revert > 0) revertTimer = win.setTimeout(startRevert, o.revert * 1e3);
    else startRevert();
  }
  function pin(L, str, at) {
    var from = -1, to = -1, cs = L.cells;
    if (o.anchor === true) {
      for (var i = 0; i < cs.length; i++) {
        if (from < 0 ? cs[i].hl && cs[i].ch !== " " : !cs[i].hl) {
          if (from < 0) from = i;
          else break;
        }
      }
      to = i;
      while (to > from && cs[to - 1].ch === " ") to--;
    } else if (typeof o.anchor === "string" && o.anchor) {
      var k = wordAt(str, o.anchor);
      if (k >= 0) {
        from = at[k];
        to = at[k + o.anchor.length];
      }
    }
    if (!(from >= 0 && to > from)) return false;
    L.a0 = from;
    L.a1 = to;
    for (var j = from; j < to; j++) cs[j].anchor = true;
    return true;
  }
  function build() {
    var plain = [], pinned = false;
    var src = Array.isArray(o.lines) ? o.lines : String(o.lines).split("\n");
    lines = [];
    cells = [];
    hot = [];
    moving = [];
    dirty = [];
    cancelRevert();
    src.forEach(function(text, li) {
      var parsed = parseLine(String(text));
      var L = { cells: [], top: 0, left: 0, width: 0, a0: 0, a1: 0 };
      var at = [], offset = 0, str = "";
      parsed.forEach(function(p, col) {
        var c = {
          ch: p.ch,
          hl: p.hl,
          line: li,
          col,
          len: parsed.length,
          word: null,
          grid: 1,
          g: p.ch,
          color: null,
          box: false,
          pad: false,
          gone: false,
          label: false,
          hot: 0,
          inHot: false,
          settle: 0,
          settled: true,
          mix: false,
          anchor: false,
          w: 0,
          w0: 0,
          tw: -1,
          v: 0,
          peak: 0,
          stiff: SPRING,
          x: 0,
          moving: false,
          prev: null,
          og: " ",
          oc: "",
          ob: false,
          ol: false,
          f: 1,
          woke: false,
          reverting: false
        };
        at[offset] = col;
        offset += p.ch.length;
        str += p.ch;
        cells.push(c);
        L.cells.push(c);
      });
      at[offset] = parsed.length;
      if (!pinned) pinned = pin(L, str, at);
      var re = /[\p{L}\p{M}]+/gu, m;
      while (m = re.exec(str)) {
        var sym = wordTable[m[0].toLowerCase()];
        var from = at[m.index], to = at[m.index + m[0].length];
        if (!sym || from === void 0 || to === void 0) continue;
        var wc = L.cells.slice(from, to);
        if (wc.some(function(c) {
          return c.hl || c.anchor;
        })) continue;
        var w = { sym, cells: wc, on: false };
        wc.forEach(function(c) {
          c.word = w;
        });
      }
      plain.push(str);
      lines.push(L);
    });
    sr.textContent = plain.join("\n");
  }
  function fontStack() {
    var front = [];
    (o.fonts || []).forEach(function(f) {
      var family = typeof f === "string" ? f : f.family;
      if (family && o.font.indexOf(family) < 0) front.push(JSON.stringify(family));
    });
    return front.concat(o.font).join(", ");
  }
  function loadFonts() {
    if (!document.fonts) return;
    (o.fonts || []).forEach(function(f) {
      if (typeof f === "string") {
        document.fonts.load("16px " + JSON.stringify(f)).then(onFonts, function() {
        });
        return;
      }
      var src = f.src || "url(" + JSON.stringify(f.url) + ")";
      var key = f.family + "\n" + src;
      if (!faces[key]) {
        var desc = Object.assign({}, f);
        delete desc.family;
        delete desc.url;
        delete desc.src;
        faces[key] = new FontFace(f.family, src, desc);
        document.fonts.add(faces[key]);
      }
      faces[key].load().then(onFonts, function(e) {
        console.warn("mathglyph: could not load font " + f.family, e);
      });
    });
  }
  function onFonts() {
    needMeasure = true;
    wake();
  }
  function measure() {
    needMeasure = false;
    widths = {};
    measureFont = "";
    stack = fontStack();
    monoEm = measureText("100px " + stack, "0").width / 100 || 0.6;
    var m = measureText("100px " + stack, "Hg");
    if (m.fontBoundingBoxAscent) {
      ascEm = m.fontBoundingBoxAscent / 100;
      descEm = m.fontBoundingBoxDescent / 100;
    }
    maxLen = maxNatural = maxGrid = 1;
    lines.forEach(function(L) {
      var natural = 0, grid = 0, mid = 0;
      L.cells.forEach(function(c, i) {
        c.grid = Math.max(1, Math.round(glyphW(c.ch) / monoEm));
        if (i === L.a0) mid = natural;
        if (i === L.a1) mid = (mid + natural) / 2;
        natural += plainWidth(c.ch, 0);
        grid += plainWidth(c.ch, c.grid);
      });
      if (L.a1 === L.cells.length) mid = (mid + natural) / 2;
      if (L.a1) {
        grid *= 2 * Math.max(mid, natural - mid) / natural;
        natural = 2 * Math.max(mid, natural - mid);
      }
      maxLen = Math.max(maxLen, L.cells.length);
      maxNatural = Math.max(maxNatural, natural);
      maxGrid = Math.max(maxGrid, grid);
    });
    needLayout = true;
  }
  function layout() {
    needLayout = false;
    if (!W) return;
    if (o.fit) {
      var perLine = o.expand ? maxNatural * 1.2 : maxGrid * 1.0333;
      fs = Math.max(8, Math.min(o.maxSize, W / perLine));
    } else {
      fs = parseFloat(win.getComputedStyle(root).fontSize) || 16;
    }
    lineH = fs * LINE_H;
    boxH = fs * CELL_H;
    monoPx = (monoEm + o.tracking) * fs;
    fontPx = fs + "px " + stack;
    labelPx = Math.max(8, Math.round(fs * LABEL_EM)) + "px " + MONO_STACK + ", monospace";
    H = Math.ceil(lines.length * lineH + fs * 0.3);
    dpr = Math.min(win.devicePixelRatio || 1, 3);
    moving = [];
    cells.forEach(function(c) {
      c.moving = false;
      c.tw = slotWidth(c);
      c.w = c.w0 = c.peak = c.tw;
      c.v = 0;
      c.f = 1;
    });
    lines.forEach(function(L, i) {
      L.top = i * lineH;
      layoutLine(L);
      markDirty(i);
    });
    renderer.resize();
  }
  function layoutLine(L) {
    var x = 0;
    for (var i = 0; i < L.cells.length; i++) {
      L.cells[i].x = x;
      x += L.cells[i].w;
    }
    L.width = x;
    if (!L.a1) {
      L.left = (W - x) / 2;
      return;
    }
    var a = L.cells[L.a0], b = L.cells[L.a1 - 1];
    L.left = (W - a.x - b.x - b.w) / 2;
  }
  function colorOf(c) {
    return c.color || (c.hl ? o.highlight : o.base);
  }
  function alphaOf(c) {
    if (c.gone) return c.w0 > 0 ? Math.min(1, c.w / c.w0) : 0;
    if (c.moving && c.w0 === 0 && c.tw > 0) return Math.min(1, c.w / c.tw);
    return 1;
  }
  function labelText(c) {
    var dx = Math.round(c.w - monoPx);
    if (c.prev !== c.g + dx) {
      c.prev = c.g + dx;
      c.text = o.labelFormat ? String(o.labelFormat({ glyph: c.g, char: c.ch, dx, width: c.w, color: colorOf(c), line: c.line, column: c.col })) : "Δx=" + dx + "px";
    }
    return c.text;
  }
  function showsLabel(c) {
    return c.box && c.label && o.boxStyle !== "soft" && c.w >= 0.5;
  }
  function fadeOf(c) {
    return c.f >= 1 ? 1 : c.f * c.f * (3 - 2 * c.f);
  }
  function canvasRenderer() {
    var cv = document.createElement("canvas");
    var ctx = cv.getContext("2d");
    var drawn = [];
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "display:block;width:100%;height:0;touch-action:pan-y";
    function resize() {
      var bw = Math.max(1, Math.round(W * dpr)), bh = Math.max(1, Math.round(H * dpr));
      if (cv.width !== bw || cv.height !== bh) {
        cv.width = bw;
        cv.height = bh;
      }
      cv.style.height = H + "px";
    }
    function box(x, y, w, col, a) {
      ctx.fillStyle = ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      if (o.boxStyle === "soft") {
        var r = fs * 0.16;
        ctx.globalAlpha = 0.16 * a;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, boxH, r);
        else ctx.rect(x, y, w, boxH);
        ctx.fill();
        ctx.globalAlpha = 0.78 * a;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x + 0.5, y + 0.5, w - 1, boxH - 1, r);
        else ctx.rect(x + 0.5, y + 0.5, w - 1, boxH - 1);
        ctx.stroke();
        return;
      }
      var bx = x + 1.5, by = Math.round(y) + 0.5, bw = w - 3, bh = Math.round(boxH) - 1;
      ctx.globalAlpha = 0.06 * a;
      ctx.fillRect(bx, by, bw, bh);
      ctx.globalAlpha = a;
      ctx.strokeRect(bx, by, bw, bh);
    }
    function look2(x, top, base, w, g, col, hasBox, a) {
      if (a <= 0) return;
      if (hasBox) box(x, top, w, col, a);
      if (g === " ") return;
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.fillText(g, x + w / 2, base);
    }
    function drawLine(L, labelsOnly) {
      var cy = L.top + lineH / 2, top = cy - boxH / 2, base = cy + (ascEm - descEm) * fs / 2;
      var i, c, x;
      if (!labelsOnly) {
        ctx.font = fontPx;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        for (i = 0; i < L.cells.length; i++) {
          c = L.cells[i];
          if (c.w < 0.5) continue;
          x = L.left + c.x;
          var a = alphaOf(c), p = fadeOf(c);
          if (p < 1) look2(x, top, base, c.w, c.og, c.oc, c.ob, a * (1 - p));
          look2(x, top, base, c.w, c.g, colorOf(c), c.box, a * p);
        }
      }
      var labelled = false;
      for (i = 0; i < L.cells.length; i++) {
        c = L.cells[i];
        var shown = showsLabel(c), fade = fadeOf(c), la = (shown ? fade : 0) + (c.ol && fade < 1 ? 1 - fade : 0);
        if (!la || c.w < 0.5) continue;
        if (!labelled) {
          labelled = true;
          ctx.font = labelPx;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
        }
        ctx.globalAlpha = 0.9 * la * alphaOf(c);
        ctx.fillStyle = shown ? colorOf(c) : c.oc;
        ctx.fillText(labelText(c), L.left + c.x + 1, top + boxH + 1);
      }
      ctx.globalAlpha = 1;
    }
    function band(b) {
      var y = b * lineH, h = b < lines.length ? lineH : H - y;
      if (h <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, W, h);
      ctx.clip();
      ctx.clearRect(0, y, W, h);
      if (b < lines.length) drawLine(lines[b], false);
      if (b > 0) drawLine(lines[b - 1], true);
      ctx.restore();
    }
    function draw(list) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawn.length = 0;
      list.forEach(function(k) {
        if (!drawn[k]) {
          drawn[k] = true;
          band(k);
        }
        if (!drawn[k + 1]) {
          drawn[k + 1] = true;
          band(k + 1);
        }
      });
    }
    return { el: cv, resize, draw };
  }
  function flush() {
    if (!dirtyAny) return;
    var list = [];
    for (var i = 0; i < lines.length; i++) {
      if (dirty[i]) {
        dirty[i] = false;
        layoutLine(lines[i]);
        list.push(i);
      }
    }
    dirtyAny = false;
    renderer.draw(list);
  }
  function spring(c, target, k, dt) {
    var t = dt / 1e3, d = c.w - target, e = Math.exp(-k * t), j = (c.v + k * d) * t;
    d = (d + j) * e;
    c.v = (c.v - k * j) * e;
    if (Math.abs(d) < 0.1 && Math.abs(c.v) < 6) {
      c.w = target;
      c.v = 0;
      return false;
    }
    c.w = target + d;
    return true;
  }
  function animated() {
    return !reduce && o.motion !== "still";
  }
  function active() {
    return !dead && onScreen && !document.hidden;
  }
  function busy() {
    return moving.length || hot.length || decoding || reverting.length || o.motion === "always" && animated();
  }
  function wake() {
    if (!raf && active()) raf = win.requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    if (!active()) return;
    if (needMeasure) measure();
    if (needLayout) layout();
    if (pointer && pointerMoved) {
      pointerMoved = false;
      scan(now);
    }
    if (animated() && (hot.length || decoding || reverting.length || o.motion === "always")) {
      if (!lastTick || now - lastTick > 4 * TICK) lastTick = now - TICK;
      while (now - lastTick >= TICK) {
        lastTick += TICK;
        tick(lastTick);
      }
    } else {
      lastTick = 0;
    }
    if (reverting.length) settleWave(now);
    var dt = lastFrame ? Math.min(now - lastFrame, 100) : 1e3 / 60;
    stepWidths(dt);
    flush();
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
      else {
        c.moving = false;
        c.v = 0;
      }
      markDirty(c.line);
    }
    moving = still;
  }
  function settleWave(now) {
    if (!revertStart) revertStart = now;
    var left = [];
    for (var j = 0; j < reverting.length; j++) {
      var rc = reverting[j];
      if (now < revertStart + rc.settle || isHot(rc)) {
        left.push(rc);
        continue;
      }
      sleep(rc);
      (rc.word ? rc.word.cells : [rc]).forEach(function(x) {
        x.reverting = false;
      });
    }
    reverting = left;
  }
  function tick(now) {
    var flicker = Math.min(0.9, 0.45 * o.speed);
    if (hot.length) {
      var still = [];
      for (var i = 0; i < hot.length; i++) {
        var c = hot[i];
        if (now < c.hot) {
          still.push(c);
          if (Math.random() < flicker) refresh(c, true);
        } else {
          c.hot = 0;
          c.inHot = false;
          refresh(c, false);
        }
      }
      hot = still;
    }
    if (decoding) {
      if (!decodeStart) decodeStart = now;
      var done = true;
      cells.forEach(function(c2) {
        if (c2.hot) return;
        if (now < decodeStart + c2.settle) {
          done = false;
          if (Math.random() < 0.7) refresh(c2, true);
        } else if (!c2.settled) {
          c2.settled = true;
          refresh(c2, false);
        }
      });
      if (done) decoding = false;
      return;
    }
    if (o.motion !== "always" || reduce || !cells.length) return;
    idleAcc += 60 * o.speed;
    if (idleAcc < 180) return;
    idleAcc = 0;
    var n = Math.max(1, Math.round(cells.length * 0.025));
    for (var k = 0; k < n; k++) {
      var r = pick(cells);
      if (!r.hot) refresh(r, false);
    }
  }
  function scan(now) {
    if (!animated()) return;
    var rx = fs * o.hoverRadius, ry = rx * 0.62;
    var until = now + 260 / Math.max(o.speed, 0.25);
    var first = Math.max(0, Math.floor((pointer.y - ry) / lineH));
    var last = Math.min(lines.length - 1, Math.floor((pointer.y + ry) / lineH));
    for (var li = first; li <= last; li++) {
      var L = lines[li], dy = (L.top + lineH / 2 - pointer.y) / ry, room = 1 - dy * dy;
      if (room <= 0) continue;
      for (var i = 0; i < L.cells.length; i++) {
        var c = L.cells[i], dx = (L.left + c.x + c.w / 2 - pointer.x) / rx;
        if (dx * dx < room && !c.anchor) {
          wakeCell(c);
          c.hot = until;
          if (!c.inHot) {
            c.inHot = true;
            hot.push(c);
          }
        }
      }
    }
  }
  function onMove(e) {
    if (!animated()) return;
    if (!rect) rect = renderer.el.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pointerMoved = true;
    cancelRevert();
    wake();
  }
  function onLeave() {
    if (!pointer && (revertTimer || reverting.length)) return;
    pointer = null;
    rect = null;
    scheduleRevert();
  }
  function onOut(e) {
    if (!e.relatedTarget) onLeave();
  }
  function onScroll() {
    rect = null;
  }
  function onVisibility() {
    if (document.hidden) onLeave();
    wake();
  }
  function onMotionPref() {
    reduce = mq.matches;
    if (reduce) {
      cancelRevert();
      cells.forEach(function(c) {
        c.woke = false;
      });
      hot.forEach(function(c) {
        c.hot = 0;
        c.inHot = false;
      });
      hot = [];
      decoding = false;
      settleAll();
      moving.forEach(function(c) {
        c.w = c.peak = c.tw;
        c.v = 0;
        c.f = 1;
        c.moving = false;
      });
      moving = [];
    }
    wake();
  }
  function replay() {
    cancelRevert();
    cells.forEach(function(c) {
      c.woke = false;
    });
    if (!animated()) {
      decoding = false;
      settleAll();
      wake();
      return;
    }
    var sp = Math.max(o.speed, 0.25);
    cells.forEach(function(c) {
      var off = (maxLen - c.len) / 2 + c.col;
      c.settled = false;
      c.settle = (250 + off / maxLen * 800 + Math.random() * 500) / sp;
    });
    decoding = true;
    decodeStart = 0;
    wake();
  }
  function update(next) {
    next = next || {};
    var linesChanged = next.lines && JSON.stringify(next.lines) !== JSON.stringify(o.lines);
    var rebuild = linesChanged || "wordMap" in next || "anchor" in next;
    var refont = "font" in next && next.font !== o.font || "fonts" in next;
    Object.assign(o, next);
    if ("rest" in next || !animated()) {
      cells.forEach(function(c) {
        c.woke = false;
      });
      cancelRevert();
    }
    if (!animated()) {
      hot.forEach(function(c) {
        c.hot = 0;
        c.inHot = false;
      });
      hot = [];
    }
    tables();
    if (refont) loadFonts();
    if (rebuild) build();
    if (rebuild || refont || "tracking" in next || "wordSpacing" in next) measure();
    cells.forEach(function(c) {
      c.prev = null;
    });
    layout();
    if (rebuild) {
      settleAll();
      if (linesChanged && o.intro) replay();
    } else if (!decoding) settleAll();
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
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerdown", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointercancel", onLeave);
    root.removeEventListener("touchend", onLeave);
    document.removeEventListener("pointerout", onOut);
    win.removeEventListener("blur", onLeave);
    win.removeEventListener("scroll", onScroll, true);
    document.removeEventListener("visibilitychange", onVisibility);
    if (mq && mq.removeEventListener) mq.removeEventListener("change", onMotionPref);
    if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener("loadingdone", onFonts);
    root.textContent = "";
    saved.forEach(function(n) {
      root.appendChild(n);
    });
  }
  tables();
  renderer = canvasRenderer();
  root.insertBefore(renderer.el, sr);
  build();
  loadFonts();
  measure();
  layout();
  settleAll();
  if (o.intro) replay();
  moving.forEach(function(c) {
    c.w = c.peak = c.tw;
    c.f = 1;
    c.moving = false;
  });
  moving = [];
  if (!decoding) flush();
  wake();
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerdown", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointercancel", onLeave);
  root.addEventListener("touchend", onLeave, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  win.addEventListener("blur", onLeave);
  win.addEventListener("scroll", onScroll, { passive: true, capture: true });
  document.addEventListener("visibilitychange", onVisibility);
  if (mq && mq.addEventListener) mq.addEventListener("change", onMotionPref);
  if (win.IntersectionObserver) {
    io = new win.IntersectionObserver(function(entries) {
      onScreen = entries[entries.length - 1].isIntersecting;
      wake();
    });
    io.observe(root);
  }
  if (win.ResizeObserver) {
    ro = new win.ResizeObserver(function(entries) {
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
    if (document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", onFonts);
  }
  return { update, replay, reroll: function() {
    settleAll();
    revertIfGone();
    wake();
  }, destroy };
}
export {
  DEFAULTS as defaults,
  LOOKALIKE as lookalike,
  mount,
  PALETTES as palettes,
  SETS as sets,
  WORDS as words
};
