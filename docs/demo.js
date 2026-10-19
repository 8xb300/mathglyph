import * as MathGlyph from './mathglyph.js';
import { greek, cyrillic } from './languages.js';

// Look-alike tables for scripts beyond Latin, passed as `lookalikes`.
const TABLES = { greek, cyrillic };

// Always loaded: a small Noto Sans Math subset (OFL), hosted next to this page.
const MATH_FONT = { family: 'Noto Sans Math', url: './fonts/noto-sans-math-subset.woff2' };

// OFL monospace fonts from Fontsource, served by jsDelivr. Only loaded when picked.
const FONTS = [
  { family: 'JetBrains Mono', url: 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff2' },
  { family: 'Fira Code', url: 'https://cdn.jsdelivr.net/fontsource/fonts/fira-code@latest/latin-400-normal.woff2' },
  { family: 'IBM Plex Mono', url: 'https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.woff2' },
  { family: 'Space Mono', url: 'https://cdn.jsdelivr.net/fontsource/fonts/space-mono@latest/latin-400-normal.woff2' },
];

const LANGUAGES = {
  en: {
    name: 'English',
    lines: [
      'every letter is a *variable*',
      'and every word, a small *proof*',
      'the symbols *breathe* around it',
      'then settle back into plain text',
      'therefore: nothing is *plain*',
    ],
    anchor: 'breathe',
  },
  es: {
    name: 'Español',
    lines: [
      'cada letra es una *variable*',
      'y cada palabra, una *prueba*',
      'acércate y todo cambia,',
      'entonces vuelve a su lugar',
    ],
    wordMap: {
      y: '∧', o: '∨', no: '¬', todo: '∀', todos: '∀', existe: '∃', hay: '∃',
      entonces: '⇒', porque: '∵', en: '∈', más: '+', menos: '−',
    },
  },
  el: {
    name: 'Ελληνικά',
    lines: [
      'κάθε γράμμα είναι μια *μεταβλητή*',
      'και κάθε λέξη, μια *απόδειξη*',
      'πλησίασε και όλα αλλάζουν,',
      'άρα τίποτα δεν είναι απλό',
    ],
    wordMap: { και: '∧', ή: '∨', κάθε: '∀', όλα: '∀', υπάρχει: '∃', άρα: '∴', επειδή: '∵', τίποτα: '∅' },
    lookalikes: 'greek',
  },
  ru: {
    name: 'Русский',
    lines: [
      'каждый знак — *переменная*',
      'и каждое слово — *теорема*',
      'подойди ближе, и все знаки оживут,',
      'следовательно, текст не прост',
    ],
    wordMap: {
      и: '∧', или: '∨', не: '¬', все: '∀', каждый: '∀', существует: '∃',
      следовательно: '∴', потому: '∵', в: '∈',
    },
    lookalikes: 'cyrillic',
  },
  ja: {
    name: '日本語',
    lines: ['どの文字も*変数*になる', 'どの言葉も小さな*証明*', '近づくと記号が動きだし', 'やがて静かに文字へ戻る'],
  },
  'zh-Hans': {
    name: '中文',
    lines: ['每个字都是一个*变量*', '每句话都是一个*证明*', '靠近一点，符号就会变化', '然后慢慢变回文字'],
  },
  ko: {
    name: '한국어',
    lines: ['모든 글자는 *변수*이고', '모든 단어는 작은 *증명*이다', '가까이 다가가면 기호로 바뀌고', '곧 다시 글자로 돌아온다'],
    wordMap: { 모든: '∀', 그리고: '∧', 또는: '∨' },
  },
  hi: {
    name: 'हिन्दी',
    lines: ['हर अक्षर एक *चर* है', 'हर शब्द एक छोटा *प्रमाण* है', 'पास आओ तो चिह्न बदलते हैं', 'फिर अक्षर लौट आते हैं'],
    wordMap: { हर: '∀', और: '∧', या: '∨', फिर: '⇒', इसलिए: '∴', क्योंकि: '∵' },
  },
};

// The options the page can change, in the order "Your config" lists them.
const SHOWN = [
  'lines', 'fonts', 'font', 'wordMap', 'lookalikes', 'palette', 'substitute', 'color', 'box', 'boxStyle', 'labels',
  'symbols', 'tokens', 'symbolMix', 'legible', 'words', 'motion', 'rest', 'revert', 'anchor', 'intro', 'speed',
  'hoverRadius', 'expand', 'fit', 'maxSize',
];

const $ = (id) => document.getElementById(id);
const hero = $('hero');

// What the library does with no options. An empty wordMap adds nothing to the English map.
const BASE = { ...MathGlyph.defaults, wordMap: {} };
// Plain at rest is the first view: it shows the slots grow and shrink best.
// The middle line's white word is the anchor: it stays still while the rest breathes around it.
const state = { ...BASE, lines: LANGUAGES.en.lines, fonts: [MATH_FONT], rest: 'plain', anchor: LANGUAGES.en.anchor };
let tableName = null;  // which entry of TABLES is in state.lookalikes
const fx = MathGlyph.mount(hero, { lines: state.lines, fonts: state.fonts, rest: state.rest, anchor: state.anchor });

function set(patch) {
  Object.assign(state, patch);
  fx.update(patch);
  showConfig();
}

// ---- sliders, selects and checkboxes: the element id is the option name ----

for (const name of Object.keys(MathGlyph.palettes)) $('palette').add(new Option(name, name));

function showSwatches() {
  $('swatches').replaceChildren(...MathGlyph.palettes[state.palette].map((c) => {
    const dot = document.createElement('i');
    dot.style.background = c;
    return dot;
  }));
}

function showValue(input) {
  document.querySelector(`output[for="${input.id}"]`).textContent = input.value + (input.dataset.unit || '');
}

for (const el of document.querySelectorAll('[data-opt]')) {
  const key = el.dataset.opt;
  if (el.type === 'checkbox') el.checked = state[key];
  else el.value = state[key];

  if (el.type === 'range') {
    showValue(el);
    el.addEventListener('input', () => {
      showValue(el);
      set({ [key]: Number(el.value) });
    });
  } else {
    el.addEventListener('change', () => set({ [key]: el.type === 'checkbox' ? el.checked : el.value }));
  }
}
$('rest-plain').checked = state.rest === 'plain';
$('rest-plain').addEventListener('change', () => set({ rest: $('rest-plain').checked ? 'plain' : 'glyphs' }));
$('palette').addEventListener('change', showSwatches);
showSwatches();

$('replay').addEventListener('click', () => fx.replay());
$('reroll').addEventListener('click', () => fx.reroll());

// ---- language and custom text ----

for (const [code, language] of Object.entries(LANGUAGES)) {
  const option = new Option(language.name, code);
  option.lang = code;
  $('lang').add(option);
}
$('text').value = state.lines.join('\n');

$('lang').addEventListener('change', () => {
  const code = $('lang').value;
  const language = LANGUAGES[code];
  hero.lang = code;
  $('text').lang = code;
  $('text').value = language.lines.join('\n');
  tableName = language.lookalikes || null;
  set({
    lines: language.lines,
    wordMap: language.wordMap || {},
    lookalikes: tableName && TABLES[tableName],
    anchor: language.anchor || null,
  });
});

$('text-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const lines = $('text').value.split('\n').map((line) => line.trimEnd()).filter(Boolean);
  if (lines.length) set({ lines });
});

// ---- symbol groups ----

function addChip(group, text, sample) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.dataset.group = group;
  chip.textContent = text;
  if (sample) {
    const glyphs = document.createElement('span');
    glyphs.className = 'sample';
    glyphs.setAttribute('aria-hidden', 'true');
    glyphs.textContent = sample;
    chip.append(glyphs);
  }
  $('groups').append(chip);
}

function showChips() {
  for (const chip of $('groups').children) {
    const group = chip.dataset.group;
    const on = state.symbols === 'all' ? group === 'all' : state.symbols.includes(group);
    chip.setAttribute('aria-pressed', String(on));
  }
}

addChip('all', 'all');
for (const [group, { label, symbols }] of Object.entries(MathGlyph.sets)) addChip(group, label, symbols.slice(0, 3).join(''));

// "all" uses every group. Picking a group narrows to the picked groups; un-picking the last one goes back to all.
$('groups').addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  const group = chip.dataset.group;
  let picked = state.symbols === 'all' ? [] : state.symbols;
  if (group === 'all') picked = [];
  else if (picked.includes(group)) picked = picked.filter((g) => g !== group);
  else picked = [...picked, group];
  set({ symbols: picked.length ? picked : 'all' });
  showChips();
});
showChips();

// ---- font picker ----

$('font').add(new Option('System monospace (default)', 'system'));
FONTS.forEach((font, i) => $('font').add(new Option(font.family, String(i))));
$('font').add(new Option('Custom…', 'custom'));

// source: a font from FONTS, { family, url } from the custom form, or a bare family name.
function useFont(source) {
  if (!source) {
    set({ fonts: [MATH_FONT], font: BASE.font });
    return;
  }
  const family = typeof source === 'string' ? source : source.family;
  set({ fonts: [MATH_FONT, source], font: `'${family}', 'Noto Sans Math', ui-monospace, monospace` });
}

$('font').addEventListener('change', () => {
  const choice = $('font').value;
  $('font-form').hidden = choice !== 'custom';
  if (choice === 'system') useFont(null);
  else if (choice !== 'custom') useFont(FONTS[Number(choice)]);
});

$('font-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const family = $('font-family').value.replace(/['"\\]/g, '').trim();
  const url = $('font-url').value.trim();
  if (family) useFont(url ? { family, url } : family);
});

// ---- "Your config": the options that differ from the defaults, as a mount call ----

const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const keyName = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k));

// Arrays and objects that fit in 80 columns stay on one line; longer ones get one item per line.
// `lead` is the width of what comes before the value on its line, such as "fonts: ".
function toJS(value, indent, lead = 0) {
  if (typeof value === 'string') return quote(value);
  if (typeof value !== 'object' || value === null) return String(value);
  const inner = indent + '  ';
  const isArray = Array.isArray(value);
  const items = isArray
    ? value.map((v) => toJS(v, inner))
    : Object.entries(value).map(([k, v]) => `${keyName(k)}: ${toJS(v, inner, keyName(k).length + 2)}`);
  const oneLine = isArray ? `[${items.join(', ')}]` : `{ ${items.join(', ')} }`;
  if (indent && !oneLine.includes('\n') && indent.length + lead + oneLine.length <= 80) return oneLine;
  const [open, close] = isArray ? ['[', ']'] : ['{', '}'];
  return `${open}\n${items.map((item) => `${inner}${item},\n`).join('')}${indent}${close}`;
}

function showConfig() {
  const changed = {};
  for (const key of SHOWN) {
    if (JSON.stringify(state[key]) !== JSON.stringify(BASE[key])) changed[key] = state[key];
  }
  if (changed.lookalikes) changed.lookalikes = '__TABLE__';
  $('copy-status').textContent = '';
  $('config').textContent =
    "import * as MathGlyph from './mathglyph.js';\n" +
    (tableName ? `import { ${tableName} } from './languages.js';\n` : '') + '\n' +
    `const fx = MathGlyph.mount(document.getElementById('hero'), ${toJS(changed, '')});\n`.replace(/['"]__TABLE__['"]/, tableName);
}
showConfig();

$('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('config').textContent);
    $('copy-status').textContent = 'Copied.';
  } catch {
    getSelection().selectAllChildren($('config'));
    $('copy-status').textContent = 'Selected. Press Ctrl+C or Cmd+C to copy.';
  }
});
