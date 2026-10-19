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

MathGlyph.register(columns, grid, ring, ripple, firework, lens, cascade, shatter);

// Look-alike tables for scripts beyond Latin, passed as `lookalikes`.
const TABLES = { greek, cyrillic, cjk };

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
      'every letter is a variable',
      'and every word, a small proof',
      'the symbols *breathe* around it',
      'then settle back into plain text',
      'therefore: nothing is plain',
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

// The gallery: a card per layout and per effect. 'lines' and 'breathe' are built in; the others are
// the modules registered above. A card shows CARD_TEXT, or its own lines that fill its shape.
const CARD_TEXT = ['every letter is', 'a small *variable*'];
const GALLERY = {
  layout: {
    lines: { about: 'Centred lines. The default.' },
    columns: {
      module: columns,
      about: 'Vertical text, read right to left in Chinese, Japanese and Korean. The columns breathe up and down.',
      // Short columns in a large font. The anchor word, "breath", stays still.
      texts: {
        'zh-Hans': { name: '中文', lines: ['一字一变量', '一句一证明', '符号*呼吸*着', '又归于平淡'], anchor: '呼吸' },
        ja: { name: '日本語', lines: ['どの文字も変数', '言葉は小さな証明', '記号は*呼吸*する', 'また文字に戻る'], anchor: '呼吸' },
        ko: { name: '한국어', lines: ['글자는 변수', '낱말은 증명', '기호가 *숨* 쉬고', '다시 글자로'], anchor: '숨' },
      },
      options: { layout: { name: 'columns', spacing: 2 }, lookalikes: cjk, maxSize: 34 },
    },
    grid: {
      module: grid,
      about: 'Rows and aligned columns. A wide glyph pushes its column and its row apart.',
      lines: ['every', 'glyph', '*moves*'],
    },
    ring: {
      module: ring,
      about: 'The text runs around a circle that grows outward as glyphs widen.',
      lines: ['every letter goes *round*'],
      options: { anchor: 'round', maxSize: 30 },
    },
  },
  effect: {
    breathe: { about: 'Glyphs near the pointer scramble, and their slots widen. The default.' },
    ripple: { module: ripple, about: 'Rings run out from the pointer. Glyphs swap and pulse as a ring passes.' },
    firework: { module: firework, about: 'Glyphs burst out with coloured sparks, then spring back.' },
    lens: { module: lens, about: 'A magnifier follows the pointer. Letters under it grow.' },
    cascade: { module: cascade, about: 'Letters drop into their slots, column by column, like rain.' },
    shatter: { module: shatter, about: 'Letters break into dots that fly back, often as a new glyph.' },
  },
};

// Slider ranges for the layout and effect settings: [min, max, step]. Distances are in em.
const SPEED = [0.25, 3, 0.05];
const RANGES = {
  columns: { spacing: [1, 4, 0.1] },
  ring: { gap: [0, 4, 0.1] },
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
const state = { ...BASE, lines: LANGUAGES.en.lines, fonts: [MATH_FONT], rest: 'plain', anchor: LANGUAGES.en.anchor };
let tableName = null;  // which entry of TABLES is in state.lookalikes
const fx = MathGlyph.mount(hero, { lines: state.lines, fonts: state.fonts, rest: state.rest, anchor: state.anchor });
const cards = [];  // the live instances in the gallery

function set(patch) {
  Object.assign(state, patch);
  fx.update(patch);
  const shared = Object.fromEntries(Object.entries(patch).filter(([key]) => SHARED.includes(key)));
  if (Object.keys(shared).length) for (const card of cards) card.update(shared);
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
// from the module's defaults.
const nameOf = (value) => (typeof value === 'string' ? value : value.name);
const defaultsOf = (kind, name) => GALLERY[kind][name].module?.defaults || {};

function settingsOf(kind) {
  const { name, ...settings } = typeof state[kind] === 'string' ? { name: state[kind] } : state[kind];
  return { ...defaultsOf(kind, name), ...settings };
}

function valueOf(kind, name, settings = {}) {
  const defaults = defaultsOf(kind, name);
  const changed = Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== defaults[key]));
  return Object.keys(changed).length ? { name, ...changed } : name;
}

function choose(kind, name, settings = {}) {
  set({ [kind]: valueOf(kind, name, settings) });
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
    tableName: Object.keys(TABLES).find((key) => TABLES[key] === lookalikes) || null,
    patch: {
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

function addCard(kind, name, { about, lines = CARD_TEXT, texts, options }) {
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
  card.append(live, title, caption);
  const shared = Object.fromEntries(SHARED.map((key) => [key, state[key]]));
  const text = texts && Object.values(texts)[0];
  const mg = MathGlyph.mount(live, {
    ...shared,
    lines,
    [kind]: name,
    intro: false,
    maxSize: 18,
    ...options,
    ...(text && { lines: text.lines, anchor: text.anchor }),
  });
  cards.push(mg);
  if (!texts) {
    $(`${kind}s`).append(card);
    return;
  }
  // A card with texts in several languages gets a picker beside it: a button can not hold buttons.
  const slot = document.createElement('div');
  slot.className = 'slot';
  const picker = document.createElement('div');
  picker.className = 'picker';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', `${name} text language`);
  for (const [code, { name: label }] of Object.entries(texts)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.lang = code;
    chip.textContent = label;
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
    mg.update({ lines: texts[code].lines, anchor: texts[code].anchor });
  });
  slot.append(card, picker);
  $(`${kind}s`).append(slot);
}

function showCards() {
  for (const kind of ['layout', 'effect']) {
    for (const card of $(`${kind}s`).querySelectorAll(`[data-${kind}]`)) {
      card.setAttribute('aria-pressed', String(card.dataset[kind] === nameOf(state[kind])));
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
}

for (const kind of ['layout', 'effect']) {
  for (const [name, card] of Object.entries(GALLERY[kind])) addCard(kind, name, card);
}

$('gallery').addEventListener('click', (event) => {
  const card = event.target.closest('[data-layout], [data-effect]');
  if (!card) return;
  const kind = card.dataset.layout ? 'layout' : 'effect';
  const name = card.dataset[kind];
  if (kind === 'layout') {
    const { code, tableName: table, patch } = setupOf(name);
    tableName = table;
    set(patch);
    showControls(code);
    showCards();
    showSettings(kind);
  } else if (name !== nameOf(state[kind])) {
    choose(kind, name);
    showCards();
    showSettings(kind);
  }
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
  // The layout and effect modules the config needs: they are imported and registered.
  const modules = ['layout', 'effect'].map((kind) => [kind, nameOf(state[kind])]).filter(([kind, name]) => GALLERY[kind][name].module);
  $('copy-status').textContent = '';
  $('config').textContent =
    "import * as MathGlyph from './mathglyph.js';\n" +
    modules.map(([kind, name]) => `import { ${name} } from './${kind}s/${name}.js';\n`).join('') +
    (tableName ? `import { ${tableName} } from './languages.js';\n` : '') + '\n' +
    (modules.length ? `MathGlyph.register(${modules.map(([, name]) => name).join(', ')});\n` : '') +
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
