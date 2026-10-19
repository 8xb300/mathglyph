import * as MathGlyph from './mathglyph.js';
import { greek, cyrillic, cjk } from './languages.js';
import { columns } from './layouts/columns.js';
import { grid } from './layouts/grid.js';
import { ring } from './layouts/ring.js';
import { ripple } from './effects/ripple.js';
import { firework } from './effects/firework.js';
import { lens } from './effects/lens.js';
import { cascade } from './effects/cascade.js';
import { shatter } from './effects/shatter.js';
import { sine } from './examples/sine.js';

MathGlyph.register(columns, grid, ring, ripple, firework, lens, cascade, shatter, sine);

// Look-alike tables for scripts beyond Latin, passed as `lookalikes`.
const TABLES = { greek, cyrillic, cjk };

// Always loaded: a small Noto Sans Math subset (OFL), hosted next to this page.
const MATH_FONT = { family: 'Noto Sans Math', url: './fonts/noto-sans-math-subset.woff2' };

// Heavy CJK fonts for the columns card: Noto Serif HK, JP and KR at weight 900 (OFL), whose bold
// Ming strokes are close to the characters on Hong Kong MTR station signs. Each file holds only the
// characters of its card text (see fonts/README.md), so it is about 5 KB.
const CJK_FONTS = {
  'zh-Hant': { family: 'Noto Serif HK Black', url: './fonts/noto-serif-hk-900-zh.9b8c2b74.woff2' },
  ja: { family: 'Noto Serif JP Black', url: './fonts/noto-serif-jp-900-ja.7a93619b.woff2' },
  ko: { family: 'Noto Serif KR Black', url: './fonts/noto-serif-kr-900-ko.5f54798b.woff2' },
};

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
    // Four short lines, so that they take the same large font as the other layouts on a phone.
    lines: ['every letter', 'a *variable*', 'every word', 'a small proof'],
    anchor: 'variable',
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
    name: '简体中文',
    lines: ['每个字都是一个*变量*', '每句话都是一个*证明*', '靠近一点，符号就会变化', '然后慢慢变回文字'],
  },
  'zh-Hant': {
    name: '繁體中文',
    lines: ['每個字都是一個*變量*', '每句話都是一個*證明*', '靠近一點，符號就會變化', '然後慢慢變回文字'],
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

// The gallery: a card per layout and per effect. 'lines' and 'breathe' are built in; the others are
// the modules registered above. A card shows CARD_TEXT, or its own lines that fill its shape.
// `custom` cards show what you can build: a layout of your own (`from`: its file), and a stack of
// effects. They are in the gallery, not in the bar under the hero.
// `preview` holds options for the card only, so that the shape fits the card's preview.
// Every layout fills the same box in the hero (see #hero in demo.css) at about the same font size:
// the text of each card is made for it.
const CARD_TEXT = ['every letter is', 'a small *variable*'];
const GALLERY = {
  layout: {
    lines: { about: 'Centred lines. The default.' },
    columns: {
      module: columns,
      about: 'Vertical CJK text.',
      // Short columns in a large, heavy font, set close together as the characters on a sign. The
      // anchor word, "breath", stays still. At most 6 characters a column, with the anchor in the
      // middle, so that every language fits the hero's box.
      texts: {
        'zh-Hant': { name: '繁體中文', short: '中', lines: ['一字一變量', '一句一證明', '符號*呼吸*著', '又歸於平淡'], anchor: '呼吸', font: CJK_FONTS['zh-Hant'] },
        ja: { name: '日本語', short: '日', lines: ['どの字も変数', '言葉は証明', '字は*呼吸*する', 'また字に戻る'], anchor: '呼吸', font: CJK_FONTS.ja },
        ko: { name: '한국어', short: '한', lines: ['글자는 변수', '낱말은 증명', '늘 *호흡*하고', '다시 글자로'], anchor: '호흡', font: CJK_FONTS.ko },
      },
      options: { layout: { name: 'columns', columnGap: 0.15 }, lookalikes: cjk, maxSize: 34 },
      preview: { maxSize: 16, layout: { name: 'columns', columnGap: 0.15 } },
    },
    grid: {
      module: grid,
      about: 'Rows and aligned columns.',
      lines: ['every', 'glyph', '*moves*'],
    },
    ring: {
      module: ring,
      about: 'Text around a growing circle.',
      lines: ['every letter goes *round*'],
      options: { anchor: 'round', maxSize: 35 },
      preview: { maxSize: 14 },
    },
    sine: {
      module: sine,
      custom: true,
      from: './examples/sine.js',
      about: 'A custom layout: a wave.',
      lines: ['every letter', 'rides a *wave*', 'then settles'],
    },
  },
  effect: {
    breathe: { about: 'Glyphs swap, slots widen.' },
    ripple: { module: ripple, about: 'Rings run out from the pointer.' },
    firework: { module: firework, about: 'Glyphs burst out with sparks.' },
    lens: { module: lens, about: 'A magnifier follows the pointer.' },
    cascade: { module: cascade, about: 'Letters fall into place like rain.' },
    shatter: { module: shatter, about: 'Letters burst into dots.' },
    'ripple + lens': {
      custom: true,
      stack: ['ripple', { name: 'lens', strength: 0.6 }],
      about: 'Two effects at once: a stack.',
    },
  },
};

// Slider ranges for the layout and effect settings: [min, max, step]. Distances are in em.
const SPEED = [0.25, 3, 0.05];
const RANGES = {
  columns: { columnGap: [0, 2, 0.05] },
  ring: { gap: [0, 4, 0.1] },
  sine: { amplitude: [0, 1, 0.05], wavelength: [2, 16, 0.5] },
  ripple: { speed: SPEED, radius: [1, 16, 0.5], gap: [0.5, 6, 0.1], pulse: [0, 1.5, 0.05] },
  firework: { speed: SPEED, radius: [0.5, 6, 0.1], power: [0, 3, 0.05], spin: [0, 3, 0.05], sparks: [0, 8, 1] },
  lens: { speed: SPEED, radius: [2, 14, 0.5], zoom: [1, 3, 0.05] },
  cascade: { speed: SPEED, radius: [0.5, 8, 0.1], fall: [0, 3, 0.1] },
  shatter: { speed: SPEED, radius: [0.5, 5, 0.1], scatter: [0, 0.6, 0.02], dots: [2, 32, 1] },
};

// The options the page can change, in the order "Your config" lists them.
const SHOWN = [
  'lines', 'layout', 'effect', 'scripts', 'fonts', 'font', 'wordMap', 'lookalikes', 'palette', 'substitute', 'color',
  'box', 'boxStyle', 'boxJitter', 'boxSpan', 'labels', 'symbols', 'tokens', 'symbolMix', 'legible', 'words', 'motion',
  'rest', 'revert', 'anchor', 'tracking', 'wordSpacing', 'intro', 'speed', 'hoverRadius', 'expand', 'fit', 'maxSize',
];
// The options the gallery cards take from the hero.
const SHARED = ['rest', 'palette', 'scripts'];

const $ = (id) => document.getElementById(id);
const hero = $('hero');

// What the library does with no options. An empty wordMap adds nothing to the English map.
const BASE = { ...MathGlyph.defaults, wordMap: {} };
// Plain at rest is the first view: it shows the slots grow and shrink best.
// The middle line's white word is the anchor: it stays still while the rest breathes around it.
const START = { ...BASE, lines: LANGUAGES.en.lines, fonts: [MATH_FONT], rest: 'plain', anchor: LANGUAGES.en.anchor };
const state = { ...START };
let tableName = null;  // which entry of TABLES is in state.lookalikes
// The hero's fonts: the ones the font picker chose, and the font of the layout card's text (the
// columns card has its own CJK fonts).
let pickedFonts = START.fonts;
let cardFont = null;
const heroFonts = () => (cardFont ? [...pickedFonts, cardFont] : pickedFonts);
const fx = MathGlyph.mount(hero, { lines: state.lines, fonts: state.fonts, rest: state.rest, anchor: state.anchor });
const cards = [];  // the live instances in the gallery

function set(patch) {
  Object.assign(state, patch);
  fx.update(patch);
  const shared = Object.fromEntries(Object.entries(patch).filter(([key]) => SHARED.includes(key)));
  if (Object.keys(shared).length) for (const card of cards) card.update(shared);
  showConfig();
  showSummaries();
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

function showOptions() {
  for (const el of document.querySelectorAll('[data-opt]')) {
    const key = el.dataset.opt;
    if (el.type === 'checkbox') el.checked = state[key];
    else el.value = state[key];
    if (el.type === 'range') showValue(el);
  }
  $('rest-plain').checked = state.rest === 'plain';
  showSwatches();
}

for (const el of document.querySelectorAll('[data-opt]')) {
  const key = el.dataset.opt;
  if (el.type === 'range') {
    el.addEventListener('input', () => {
      showValue(el);
      set({ [key]: Number(el.value) });
    });
  } else {
    el.addEventListener('change', () => set({ [key]: el.type === 'checkbox' ? el.checked : el.value }));
  }
}
$('rest-plain').addEventListener('change', () => set({ rest: $('rest-plain').checked ? 'plain' : 'glyphs' }));
$('palette').addEventListener('change', showSwatches);
showOptions();

$('replay').addEventListener('click', () => fx.replay());
$('reroll').addEventListener('click', () => fx.reroll());

// ---- language and custom text ----

for (const [code, language] of Object.entries(LANGUAGES)) {
  const option = new Option(language.name, code);
  option.lang = code;
  $('lang').add(option);
}
$('text').value = state.lines.join('\n');
$('anchor').value = state.anchor || '';

$('lang').addEventListener('change', () => {
  const code = $('lang').value;
  const language = LANGUAGES[code];
  hero.lang = code;
  $('text').lang = code;
  $('text').value = language.lines.join('\n');
  $('anchor').value = language.anchor || '';
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

$('anchor').addEventListener('change', () => set({ anchor: $('anchor').value.trim() || null }));
$('anchor-form').addEventListener('submit', (event) => event.preventDefault());

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

// ---- scripts ----

// null is Latin only. Un-picking the last script goes back to it.
const SCRIPTS = ['latin', 'greek', 'cyrillic'];

function showScripts() {
  const on = state.scripts || ['latin'];
  for (const chip of $('scripts').children) chip.setAttribute('aria-pressed', String(on.includes(chip.dataset.script)));
}

$('scripts').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-script]');
  if (!chip) return;
  const script = chip.dataset.script;
  const on = state.scripts || ['latin'];
  const next = on.includes(script) ? on.filter((s) => s !== script) : [...on, script];
  const picked = SCRIPTS.filter((s) => next.includes(s));
  set({ scripts: picked.length && picked.join() !== 'latin' ? picked : null });
  showScripts();
});
showScripts();

// ---- gallery: layouts and effects ----

// state.layout and state.effect are a name, or { name, ...settings } with the settings that differ
// from the module's defaults, or for a stack of effects, its list.
const itemName = (value) => (typeof value === 'string' ? value : value.name);
const nameOf = (value) => (Array.isArray(value) ? value.map(itemName).join(' + ') : itemName(value));
const defaultsOf = (kind, name) => GALLERY[kind][name].module?.defaults || {};

function settingsOf(kind) {
  if (Array.isArray(state[kind])) return {};  // a stack has no settings of its own here
  const { name, ...settings } = typeof state[kind] === 'string' ? { name: state[kind] } : state[kind];
  return { ...defaultsOf(kind, name), ...settings };
}

function valueOf(kind, name, settings = {}) {
  const defaults = defaultsOf(kind, name);
  const changed = Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== defaults[key]));
  return Object.keys(changed).length ? { name, ...changed } : name;
}

function choose(kind, name, settings = {}) {
  set({ [kind]: GALLERY[kind][name].stack || valueOf(kind, name, settings) });
}

// The language each layout card's picker shows. A layout card loads that text into the hero.
const pickedText = {};

// Everything a layout card shows, as an update for the hero: text, language, sizes and layout settings.
function setupOf(name) {
  const card = GALLERY.layout[name];
  const code = card.texts ? pickedText[name] || Object.keys(card.texts)[0] : 'en';
  const language = LANGUAGES[code];
  const text = card.texts?.[code] || (card.lines ? { lines: card.lines } : language);
  const { layout: { name: _, ...layoutSettings } = {}, ...options } = card.options || {};
  const lookalikes = options.lookalikes || (language.lookalikes && TABLES[language.lookalikes]) || null;
  return {
    code,
    font: text.font || null,
    tableName: Object.keys(TABLES).find((key) => TABLES[key] === lookalikes) || null,
    patch: {
      fonts: text.font ? [...pickedFonts, text.font] : pickedFonts,
      lines: text.lines,
      anchor: options.anchor || text.anchor || null,
      wordMap: language.wordMap || {},
      lookalikes,
      maxSize: BASE.maxSize,
      fit: BASE.fit,
      ...options,
      layout: valueOf('layout', name, layoutSettings),
    },
  };
}

// Point the text box, language picker and sliders at what the hero shows now.
function showControls(code) {
  hero.lang = $('text').lang = code;
  $('lang').value = code;
  $('text').value = state.lines.join('\n');
  $('anchor').value = state.anchor || '';
  for (const key of ['maxSize', 'fit']) {
    const input = $(key);
    if (input.type === 'checkbox') input.checked = state[key];
    else {
      input.value = state[key];
      showValue(input);
    }
  }
}

function addCard(kind, name, { about, lines = CARD_TEXT, texts, options, preview, custom, stack }) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.dataset[kind] = name;
  const live = document.createElement('span');
  live.className = 'live';
  live.setAttribute('aria-hidden', 'true');
  const title = document.createElement('span');
  title.className = 'name';
  title.textContent = name;
  const caption = document.createElement('span');
  caption.className = 'about';
  caption.textContent = about;
  caption.title = about;
  card.append(live, title, caption);
  const shared = Object.fromEntries(SHARED.map((key) => [key, state[key]]));
  const text = texts && Object.values(texts)[0];
  const mg = MathGlyph.mount(live, {
    ...shared,
    lines,
    [kind]: stack || name,
    intro: false,
    maxSize: 18,
    ...options,
    ...preview,
    ...(text && { lines: text.lines, anchor: text.anchor, fonts: text.font ? [text.font] : [] }),
  });
  cards.push(mg);
  // Every card sits in a slot, so that all cards are built the same. A card with texts in several
  // languages puts a picker in the slot, over its preview.
  const slot = document.createElement('div');
  slot.className = 'slot';
  slot.append(card);
  $(custom ? 'customs' : `${kind}s`).append(slot);
  if (!texts) return;
  const picker = document.createElement('div');
  picker.className = 'picker';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', `${name} text language`);
  for (const [code, { name: label, short }] of Object.entries(texts)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.lang = code;
    chip.textContent = short;
    chip.title = label;
    chip.setAttribute('aria-label', label);
    chip.dataset.text = code;
    chip.setAttribute('aria-pressed', String(texts[code] === text));
    picker.append(chip);
  }
  live.lang = Object.keys(texts)[0];
  picker.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-text]');
    if (!chip) return;
    const code = chip.dataset.text;
    for (const other of picker.children) other.setAttribute('aria-pressed', String(other === chip));
    live.lang = code;
    pickedText[name] = code;
    mg.update({ lines: texts[code].lines, anchor: texts[code].anchor, fonts: texts[code].font ? [texts[code].font] : [] });
  });
  slot.append(picker);
}

// The quick controls under the hero: a segmented control for each kind, in step with the gallery.
function addSegments(kind) {
  for (const name of Object.keys(GALLERY[kind]).filter((key) => !GALLERY[kind][key].custom)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.value = name;
    $(`bar-${kind}`).append(button);
  }
  $(`bar-${kind}`).addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) pick(kind, button.value);
  });
}

function showCards() {
  for (const kind of ['layout', 'effect']) {
    for (const card of $(`${kind}s`).querySelectorAll(`[data-${kind}]`)) {
      card.setAttribute('aria-pressed', String(card.dataset[kind] === nameOf(state[kind])));
    }
    for (const button of $(`bar-${kind}`).children) {
      button.setAttribute('aria-pressed', String(button.value === nameOf(state[kind])));
    }
  }
}

// A slider for each number among the defaults, a checkbox for each boolean.
function showSettings(kind) {
  const box = $(`${kind}-settings`);
  const name = nameOf(state[kind]);
  const defaults = defaultsOf(kind, name);
  const settings = settingsOf(kind);
  const fields = [];
  for (const [key, value] of Object.entries(defaults)) {
    const id = `${kind}-${key}`;
    const field = document.createElement('div');
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = key;
    const input = document.createElement('input');
    input.id = id;
    if (typeof value === 'boolean') {
      field.className = 'check';
      input.type = 'checkbox';
      input.checked = settings[key];
      input.addEventListener('change', () => choose(kind, name, { ...settingsOf(kind), [key]: input.checked }));
      field.append(input, label);
    } else if (typeof value === 'number') {
      field.className = 'field';
      const output = document.createElement('output');
      output.setAttribute('for', id);
      const [min, max, step] = RANGES[name]?.[key] || [0, value * 2 || 1, 0.01];
      Object.assign(input, { type: 'range', min, max, step, value: settings[key] });
      input.addEventListener('input', () => {
        showValue(input);
        choose(kind, name, { ...settingsOf(kind), [key]: Number(input.value) });
      });
      field.append(label, output, input);
    } else {
      continue;
    }
    fields.push(field);
  }
  const legend = document.createElement('legend');
  legend.textContent = `${kind}: ${name}`;
  box.replaceChildren(legend, ...fields);
  for (const input of box.querySelectorAll('input[type=range]')) showValue(input);
  box.hidden = !fields.length;
  $('modules-none').hidden = !($('layout-settings').hidden && $('effect-settings').hidden);
  $('modules-none').textContent = `${nameOf(state.layout)} and ${nameOf(state.effect)} have no settings of their own.`;
}

for (const kind of ['layout', 'effect']) {
  for (const [name, card] of Object.entries(GALLERY[kind])) addCard(kind, name, card);
  addSegments(kind);
}

// A layout brings its text, language and sizes to the hero. An effect changes only the effect.
function pick(kind, name) {
  if (kind === 'layout') {
    const { code, font, tableName: table, patch } = setupOf(name);
    tableName = table;
    cardFont = font;
    set(patch);
    showControls(code);
    showCards();
    showSettings(kind);
  } else if (name !== nameOf(state[kind])) {
    choose(kind, name);
    showCards();
    showSettings(kind);
  }
}

$('gallery').addEventListener('click', (event) => {
  const card = event.target.closest('[data-layout], [data-effect]');
  if (!card) return;
  const kind = card.dataset.layout ? 'layout' : 'effect';
  pick(kind, card.dataset[kind]);
  // The gallery is far below the hero: bring the hero into view, with the settings under it.
  hero.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
showCards();
showSettings('layout');
showSettings('effect');

// ---- font picker ----

$('font').add(new Option('System monospace (default)', 'system'));
FONTS.forEach((font, i) => $('font').add(new Option(font.family, String(i))));
$('font').add(new Option('Custom…', 'custom'));

// source: a font from FONTS, { family, url } from the custom form, or a bare family name.
function useFont(source) {
  const family = source && (typeof source === 'string' ? source : source.family);
  pickedFonts = source ? [MATH_FONT, source] : [MATH_FONT];
  set({ fonts: heroFonts(), font: source ? `'${family}', 'Noto Sans Math', ui-monospace, monospace` : BASE.font });
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
  if (changed.fonts) changed.fonts = changed.fonts.map((f) => (f.url ? { ...f, url: new URL(f.url, location.href).href } : f));
  // The layout and effect modules the config needs: they are imported and registered.
  const modules = ['layout', 'effect']
    .flatMap((kind) => (Array.isArray(state[kind]) ? state[kind] : [state[kind]]).map((value) => [kind, itemName(value)]))
    .filter(([kind, name]) => GALLERY[kind][name]?.module);
  const url = (file) => quote(new URL(file, location.href).href);
  for (const status of document.querySelectorAll('.copy-status')) status.textContent = '';
  $('sum-code').textContent = `${Object.keys(changed).length} options differ from the defaults`;
  $('config').textContent =
    `import * as MathGlyph from ${url('./mathglyph.js')};\n` +
    modules.map(([kind, name]) => `import { ${name} } from ${url(GALLERY[kind][name].from || `./${kind}s/${name}.js`)};\n`).join('') +
    (tableName ? `import { ${tableName} } from ${url('./languages.js')};\n` : '') + '\n' +
    (modules.length ? `MathGlyph.register(${modules.map(([, name]) => name).join(', ')});\n` : '') +
    "const el = document.getElementById('hero');\n" +
    `const fx = MathGlyph.mount(el, ${toJS(changed, '')});\n`.replace(/['"]__TABLE__['"]/, tableName);
}
showConfig();

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const status = button.parentElement.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText($('config').textContent);
      status.textContent = 'Copied.';
    } catch {
      $('sec-code').open = true;
      getSelection().selectAllChildren($('config'));
      status.textContent = 'Selected. Press Ctrl+C or Cmd+C to copy.';
    }
  });
}

// ---- sections: a short summary on each header, and the open ones kept across visits ----

function fixed(n) {
  return String(Math.round(n * 100) / 100);
}

function showSummaries() {
  const font = $('font').value;
  $('sum-text').textContent = [
    LANGUAGES[$('lang').value]?.name || 'custom text',
    font === 'system' ? 'system font' : font === 'custom' ? 'custom font' : FONTS[Number(font)].family,
    state.anchor ? `anchor ${state.anchor}` : 'no anchor',
    `tracking ${fixed(state.tracking)}`,
  ].join(' · ');
  $('sum-glyphs').textContent = [
    `substitute ${fixed(state.substitute)}`,
    `legible ${fixed(state.legible)}`,
    (state.scripts || ['latin']).join('+'),
    state.symbols === 'all' ? 'all symbols' : `${state.symbols.length} symbol groups`,
    state.expand ? 'expand' : 'strict grid',
  ].join(' · ');
  $('sum-colour').textContent = [state.palette, `color ${fixed(state.color)}`, `box ${fixed(state.box)}`, state.boxStyle].join(' · ');
  $('sum-motion').textContent = [
    state.motion,
    state.rest === 'plain' ? 'plain at rest' : 'glyphs at rest',
    `speed ${fixed(state.speed)}×`,
    state.fit ? `fit, max ${state.maxSize}px` : 'no fit',
  ].join(' · ');
  $('sum-modules').textContent = ['layout', 'effect'].map((kind) => {
    if (Array.isArray(state[kind])) return nameOf(state[kind]);
    const { name, ...changed } = typeof state[kind] === 'string' ? { name: state[kind] } : state[kind];
    return [name, ...Object.entries(changed).map(([key, value]) => `${key} ${typeof value === 'number' ? fixed(value) : value}`)].join(' ');
  }).join(' · ');
}
showSummaries();

const OPEN_KEY = 'mathglyph-demo:open';
const sections = [...document.querySelectorAll('.sec')];
let stored = [];
try { stored = JSON.parse(localStorage.getItem(OPEN_KEY)) || []; } catch {}
for (const section of sections) {
  section.open = stored.includes(section.id);
  section.addEventListener('toggle', () => {
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(sections.filter((s) => s.open).map((s) => s.id))); } catch {}
    showOpenAll();
  });
}

function showOpenAll() {
  $('open-all').textContent = sections.every((s) => s.open) ? 'Close all' : 'Open all';
}
showOpenAll();
$('open-all').addEventListener('click', () => {
  const open = !sections.every((s) => s.open);
  for (const section of sections) section.open = open;
});

// ---- how to use: folded by default, and kept across visits ----

const how = $('how');
try { how.open = localStorage.getItem('mathglyph-demo:how') === 'open'; } catch {}
how.addEventListener('toggle', () => {
  try { localStorage.setItem('mathglyph-demo:how', how.open ? 'open' : 'closed'); } catch {}
});

// ---- reset: every option back to the first view ----

$('reset').addEventListener('click', () => {
  tableName = null;
  pickedFonts = START.fonts;
  cardFont = null;
  $('font').value = 'system';
  $('font-form').hidden = true;
  set({ ...START });
  showOptions();
  showControls('en');
  showChips();
  showScripts();
  showCards();
  showSettings('layout');
  showSettings('effect');
  showSummaries();
});
