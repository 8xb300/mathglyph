# mathglyph

A small text effect: monospace lines where some letters turn into math glyphs (𝕋 𝒢 ∃ ⊗) and scramble under the pointer.

[Live demo](https://8xb300.github.io/mathglyph/) · [Demo source in `docs/`](docs/)

![mathglyph preview](docs/preview.webp)

Give it a few lines of text. It shows them centred, in monospace, with a math accent:

- At rest, some letters swap to math glyphs. Some glyphs get a colour from the palette, and some coloured glyphs get a box.
- The pointer scrambles the characters near it, then they settle. There is also a left-to-right decode intro (on by default) and a slow idle reshuffle (off by default).
- Words in `*stars*` are highlighted: white, and readable at rest.
- With `rest: 'plain'`, the text is plain at rest. The pointer wakes glyphs near it, and the slots widen. A few seconds after the pointer leaves, the text goes back to plain and the slots narrow. The preview above uses this mode.

## How it's different

A typical text-scramble effect cycles random characters in a fixed grid. mathglyph differs in these ways:

- **Real math, not noise.** Letters swap to Unicode's math alphabets (𝔸 𝒢 𝔣 𝑛, with the older letters that fill the block's holes, like ℝ ℂ ℍ ℎ) and to notation from 21 fields, from logic and calculus to category theory.
- **Slots that fit the glyph.** Each slot widens to fit the glyph it shows, so wide symbols and short tokens (∫₀, ℏω, ⊗², &&) fit and the lines breathe. `expand: false` keeps a strict grid.
- **Smooth breathing.** Slot widths move on critically damped springs that run on the real frame time, and lines stay centred on them, so the motion never jumps or turns back when a glyph changes mid-motion, at 60, 120 or 144 Hz. A scrambling slot keeps its widest recent width for a moment instead of twitching with each glyph, glyphs crossfade, and boxes and labels move with their slots to the subpixel.
- **An anchor word.** `anchor` pins one word: it never changes, it stays at the middle of the element, and its line grows outward from it, so only the letters beyond a widening slot move.
- **Readable at rest.** Look-alike swaps (∃ for E, ∪ for U, ∅ for O) and math versions of the same letter keep words legible.
- **Whole-word swaps.** Words with a symbol meaning turn into it: and → ∧, therefore → ∴, every → ∀. You can add your own words, in any language.
- **Bounding-box labels.** Boxes look like vision-model detections: a thin 1px rectangle with a tiny label that shows the slot's real width change, such as `Δx=30px`. `boxStyle: 'soft'` draws a rounded box instead.
- **Any script, any font.** Text is split into grapheme clusters, widths are measured per glyph, and you can load your own fonts.
- **No work when idle.** No timers or frames run while nothing moves, while the text is off screen, or while the tab is hidden.
- **About 10 KB** minified and gzipped, with no dependencies. See [Performance](#performance).

## Use cases

- Hero headlines and landing pages.
- Docs and blog titles about math, CS or science.
- 404 pages and loading screens.
- Launch and announcement pages.
- Talk slides and portfolio headers.
- Sites for AI and research tools.

## Quick start

mathglyph is not on npm yet. Load it from jsDelivr, or copy `dist/` into your project.

```html
<h1 id="hero">Every proof starts with a good guess</h1>
<script type="module">
  import { mount } from 'https://cdn.jsdelivr.net/gh/8xb300/mathglyph@v0.3.0/dist/mathglyph.min.js';
  const lines = ['Every proof starts', 'with a *good* guess'];  // *stars* highlight a word
  mount(document.getElementById('hero'), { lines, palette: 'ice' });
</script>
```

With a plain script tag, the same exports are on the global `MathGlyph`:

```html
<script src="https://cdn.jsdelivr.net/gh/8xb300/mathglyph@v0.3.0/dist/mathglyph.iife.min.js"></script>
<script>
  MathGlyph.mount(document.getElementById('hero'), { lines: ['Every proof starts', 'with a *good* guess'] });
</script>
```

If you copy `dist/`, import `mathglyph.min.js` from wherever you put it. Types are in `dist/mathglyph.d.ts`.

### Configure in code

The sliders are only on the demo page. The library ships with no UI: you set options at mount and change them live from your own code.

```js
const fx = mount(document.getElementById('hero'), {
  lines: ['every *function* has a story', 'and every story has an end'],
  palette: 'ember',
  symbols: ['logic', 'calculus'],
});

fx.update({ palette: 'ice', substitute: 0.5 });  // change any option live
fx.replay();                                     // run the decode intro again
fx.reroll();                                     // pick new glyphs at rest
```

### Plain at rest

```js
mount(document.getElementById('hero'), {
  lines: ['every letter is a *variable*', 'and every word, a small *proof*'],
  rest: 'plain',  // plain text until the pointer touches it
  revert: 0,      // back to plain as soon as the pointer leaves (seconds to wait)
});
```

The intro decodes to plain text. On hover or touch, the characters near the pointer turn into glyphs and stay so while the pointer is over the text. When the pointer has been away for `revert` seconds (default 0, so at once), the glyphs settle back to their letters in a short wave from left to right, and the slots narrow. The pointer is away when it leaves the text or the window, when the window loses focus, or when the page is hidden. A change of options while the pointer is away also ends in plain text. The next hover picks new glyphs.

### Anchor

```js
mount(document.getElementById('hero'), {
  lines: ['every letter is a *variable*', 'the symbols *breathe* around it', 'then settle back'],
  anchor: 'breathe',  // or true: the first *highlighted* word
});
```

The anchor never swaps, never gets a box and never moves. Its middle sits at the middle of the element. In its line, the letters to its left grow leftward and the letters to its right grow rightward. The other lines centre on the same point. Put the anchor near the middle of its line: a line with much more text on one side reaches further out on that side.

### Without JavaScript

Put the plain text in the element, as in the first Quick start example. `mount` replaces it with the effect, and `destroy()` puts it back. Without JavaScript, or before the script loads, visitors and crawlers see the plain text.

## Options

Every option has a default. Pass any of them to `mount`, or change them later with `update`. Shares and rates are numbers from 0 to 1.

| Option | Default | What it does |
|---|---|---|
| `lines` | `['plain text, now with', 'a *math* accent']` | One string per row. Wrap words in `*stars*` to highlight them. |
| `palette` | `'pastel'` | `'pastel'`, `'ember'`, `'ice'`, `'mono'`, `'shimmer'`, or an array of CSS colours. `'shimmer'` is the colours of the glyphs in the background of 8xb300.org. Its navy is `#6475d8`, lightened from the site's `#131836` so it reads on dark backgrounds. |
| `substitute` | `0.35` | Share of letters swapped at rest. |
| `color` | `0.55` | How often glyphs get a palette colour. |
| `box` | `0.22` | How often coloured glyphs get a box. |
| `boxStyle` | `'detect'` | `'detect'`: a thin 1px rectangle with a label. `'soft'`: a rounded box with a faint fill. |
| `labels` | `0.6` | Share of boxes that show a label (`'detect'` only). |
| `labelFormat` | `null` | A function `(cell) => string` for your own label text. See [Labels](#labels). |
| `symbols` | `'all'` | `'all'`, or an array of group names. See [Symbol groups](#symbol-groups). |
| `sets` | `null` | Extra symbol groups, `{ name: { symbols, tokens? } }`. You can name them in `symbols`. |
| `tokens` | `true` | Also swap in short notation like ∫₀, ℏω, ⊗², &&. Only with `expand`. |
| `symbolMix` | `0.15` | Share of swaps that use the symbol groups instead of a math-alphabet or Greek version of the same letter. |
| `legible` | `0.6` | How often a swapped letter uses a symbol that looks like it: ∃ for E, ∪ for U, ∅ for O. |
| `lookalikes` | `null` | Extra look-alikes, `{ char: 'glyphs' }`, merged over the built-in Latin table. Also how you plug in the Greek and Cyrillic tables. See [Languages](#languages). |
| `words` | `0.7` | How often words with a symbol meaning swap whole. Needs `expand`. |
| `wordMap` | `null` | Extra word → symbol pairs, merged over the English map. |
| `motion` | `'hover'` | `'hover'`: still until the pointer moves over it. `'always'`: adds a slow reshuffle. `'still'`: no animation. |
| `rest` | `'glyphs'` | `'glyphs'`: some letters show glyphs at rest. `'plain'`: plain text at rest, glyphs only where the pointer touched. See [Plain at rest](#plain-at-rest). |
| `revert` | `0` | With `rest: 'plain'`: seconds after the pointer leaves before the text goes back to plain. |
| `anchor` | `null` | A word that never changes and never moves: a string pins its first match (a whole word if there is one), `true` the first *highlighted* word. See [Anchor](#anchor). |
| `tracking` | `-0.02` | Extra space between letters, in em. Negative values set letters closer. |
| `wordSpacing` | `0.45` | The width of a space, in em. A monospace space is about `0.6`. |
| `intro` | `true` | Left-to-right decode on first show. |
| `speed` | `1` | How fast the scramble flickers and settles, from `0.25` to `2`. It also sets how fast slots and lines glide. |
| `hoverRadius` | `2.6` | How far the pointer reaches, in character heights. |
| `expand` | `true` | Each slot widens to fit its glyph. `false` keeps a strict grid. |
| `base` | `'#8d8b93'` | Colour of plain text. |
| `highlight` | `'#ffffff'` | Colour of highlighted words. |
| `font` | system monospace stack | CSS `font-family` stack. See [Fonts](#fonts). |
| `fonts` | `[]` | Fonts to load. See [Fonts](#fonts). |
| `fit` | `true` | Scale the font so the text fits the container width. |
| `maxSize` | `44` | Largest font size in px for `fit`. |

### Labels

With `boxStyle: 'detect'`, some boxes get a label. `Δx=30px` means the slot is 30px wider than a plain monospace slot. Set `labels: 0` to hide them all, or write your own text:

```js
mount(element, {
  labelFormat: (cell) => `${cell.char}→${cell.glyph}`,  // "E→∃"
});
```

`cell` has:

- `glyph`: the glyph the slot shows now
- `char`: the original character of the slot
- `dx`: width change against a plain monospace slot, in CSS px, rounded
- `width`: width of the slot now, in CSS px
- `color`, `line` and `column`

### Symbol groups

`symbols: 'all'` uses every group. To narrow it down, list group names, like `symbols: ['logic', 'calculus']`.

| Name | Label | For example |
|---|---|---|
| `general` | General | ÷ ≠ ≤ ≈ ± √ × |
| `calculus` | Calculus | ∑ ∏ ∫ ∮ ∂ ∇ ∞ |
| `logic` | Logic & sets | ∀ ∃ ¬ ∧ ⊢ ⊨ ∈ ∪ ℵ |
| `linalg` | Linear algebra | ⊗ ⊕ ⊙ ⊥ ⟨ ⟩ † ‖ |
| `numbers` | Number theory | ≡ ∣ ⌊ ⌋ ℤ ℚ ℕ ℝ |
| `geometry` | Geometry | △ □ ○ ∠ ∥ ≅ ° π |
| `statistics` | Statistics | ∝ 𝔼 ℙ 𝕍 μ σ χ |
| `physics` | Physics | ℏ ∝ Å ∂ ∇ ∮ ℓ |
| `engineering` | Engineering | ∠ ∥ Ω ⌀ ± ° |
| `chemistry` | Chemistry | ⇌ ⟶ ↑ ↓ ‡ Δ |
| `cs` | CS | λ ↦ ≡ ∘ ← ⊕ ⊑ |
| `greek` | Greek | α β γ δ θ λ π ψ Ω |
| `bioastro` | Bio & astro | ♀ ♂ ☉ ⊕ |
| `economics` | Economics | ≻ ≺ ≿ 𝔼 Δ Γ |
| `philosophy` | Philosophy | □ ◇ ∴ ∵ ⊢ ⊩ ⊸ ⅋ |
| `proofs` | Proofs | ∎ ∴ ∵ ≔ ≝ ≜ ⋯ |
| `linguistics` | Linguistics | ə ʃ ʒ ŋ ð θ ʔ ⟦ ⟧ |
| `law` | Law & texts | § ¶ † ‡ |
| `finance` | Finance | € £ ¥ ₹ ₿ ‰ |
| `category` | Category theory | ↪ ↠ ⇉ ⊣ ≅ ∘ ⟹ |
| `functional` | Functional prog. | λ ∘ ⊥ → ⇒ ∀ ∷ |

Add your own groups with `sets`. `'all'` includes them, and you can name them in `symbols` like any other group. A group's `symbols` can be a string, which is split into characters. Its `tokens` are optional and only show when `expand` is on.

```js
mount(element, {
  sets: { music: { symbols: '♩♪♫♭♮♯', tokens: ['♭♭', '♯♯'] } },
  symbols: ['music', 'logic'],
});
```

## API

`mount(element, options)` starts the effect and returns four methods:

```js
const glyphs = mount(element, options);

glyphs.update({ palette: 'ember' });  // change any option live; pass only what changes
glyphs.replay();                      // run the intro again
glyphs.reroll();                      // pick new glyphs at rest
glyphs.destroy();                     // stop everything and restore the element
```

The module also exports its built-in tables:

| Export | What it holds |
|---|---|
| `palettes` | The built-in palettes by name, each an array of CSS colours. |
| `sets` | The 21 symbol groups: `{ name: { label, symbols, tokens } }`. |
| `words` | The English word → symbol map. |
| `lookalike` | The built-in Latin look-alike table: character → glyphs. |
| `defaults` | The default options. |

Use them to build on the defaults:

```js
import { mount, sets, palettes } from 'https://cdn.jsdelivr.net/gh/8xb300/mathglyph@v0.3.0/dist/mathglyph.min.js';

mount(element, {
  symbols: Object.keys(sets).filter((name) => name !== 'greek'),  // every group but Greek
  palette: [...palettes.ice, '#ffffff'],                           // ice, plus white
});
```

## Fonts

The default `font` is a system monospace stack with math fallbacks. Nothing loads from a font CDN.

To use other fonts, list them in `fonts`. Each entry is one of:

- `'IBM Plex Mono'`: a family your page already provides, for example with your own `@font-face` rule.
- `{ family: 'IBM Plex Mono', url: '/fonts/plex-mono.woff2' }`: a font file, loaded with the FontFace API.
- `{ family: 'IBM Plex Mono', src: 'url(/fonts/plex-mono-bold.woff2)', weight: '700' }`: a CSS `src` value plus any FontFace descriptors, also loaded with the FontFace API.

Each font in `fonts` goes at the front of the `font` stack, unless `font` already names it. Then it stays where you put it.

Widths are measured per glyph with the real font stack, and measured again when a font loads. So slots and labels stay right while fonts arrive.

### Math fallback font (recommended on Linux)

Linux systems often lack math glyphs, and a missing glyph shows as an empty box. This repo ships an optional fallback: [`fonts/noto-sans-math-subset.woff2`](fonts/noto-sans-math-subset.woff2). It is Noto Sans Math, subset to the glyphs the effect uses, under the SIL OFL 1.1 (licence in [`fonts/OFL.txt`](fonts/OFL.txt)). Host it with your site and load it:

```js
mount(element, {
  fonts: [{ family: 'Noto Sans Math', url: '/your/path/noto-sans-math-subset.woff2' }],
});
```

The default stack already names 'Noto Sans Math', so it slots in after the monospace fonts.

## Languages

Lines are split into grapheme clusters with `Intl.Segmenter`, so any script works, and so do emoji. Widths are measured, so wide characters (CJK, full-width forms) get wide slots.

The built-in look-alike table covers Latin. Greek and Cyrillic tables ship as a separate module, `dist/languages.min.js` (under 1 KB gzipped), so pages that don't need them don't load them. Plug them in with `lookalikes`:

```js
import { mount } from 'https://cdn.jsdelivr.net/gh/8xb300/mathglyph@v0.3.0/dist/mathglyph.min.js';
import { greek, cyrillic } from 'https://cdn.jsdelivr.net/gh/8xb300/mathglyph@v0.3.0/dist/languages.min.js';

mount(element, {
  lines: ['каждый знак — *переменная*'],
  lookalikes: { ...greek, ...cyrillic },
});
```

The script-tag build already includes both, as `MathGlyph.greek` and `MathGlyph.cyrillic`.

Greek letters also get math-alphabet Greek (𝛂 𝜷 𝝅), with or without the table. Accented letters (é, ά, й) swap like their base letter. Letters from other scripts swap to symbols from the chosen groups.

You can add your own tables:

- `lookalikes` adds look-alike glyphs. For example, `{ 'ß': 'β', 'ø': '∅⌀' }`.
- `wordMap` adds whole-word swaps. Word matching uses Unicode letters, so it works for any script that puts spaces between words.
- `sets` adds symbol groups (see [Symbol groups](#symbol-groups)).

In Spanish:

```js
mount(element, {
  lines: ['para todo ε existe un δ', 'y la *prueba* termina'],
  wordMap: { y: '∧', o: '∨', todo: '∀', existe: '∃' },
});
```

For CJK text with your own fonts, name both fonts in `font`, so the monospace font stays first for Latin letters and the CJK font only fills in what it lacks:

```js
mount(element, {
  lines: ['すべての *関数* には物語がある'],
  font: "'JetBrains Mono', 'Noto Sans JP', monospace",
  fonts: [
    { family: 'JetBrains Mono', url: '/fonts/jetbrains-mono.woff2' },
    { family: 'Noto Sans JP', url: '/fonts/noto-sans-jp.woff2' },
  ],
});
```

What does not work:

- Right-to-left scripts (Arabic, Hebrew) render left to right.
- Cursive scripts (Arabic, Syriac, Mongolian) lose their joined letter forms, because every character sits in its own slot.
- Languages written without spaces (Chinese, Japanese, Thai) get no whole-word swaps.

## Performance

- **No work at rest.** When nothing animates, no timers run. The effect also pauses when it is off screen (IntersectionObserver) and when the tab is hidden.
- **No layout reads in the animation loop.** Glyph widths and slot geometry are cached, and updated only on resize and when a font loads.
- **One `requestAnimationFrame` loop** drives the animation. It stops as soon as the last glyph settles.
- **One canvas, and only changed lines are redrawn.** Screen readers get a visually hidden copy of the text (see [Accessibility](#accessibility)).

### Numbers

Hovering over 2,000 characters (25 lines of 80) for 5 seconds, with a synthetic pointer that crosses every line. Median of 3 runs on Linux x86_64, headless Chromium 156, software rendering. `bench/run.mjs` measures it.

| | First version | DOM renderer | Canvas (ships) |
|---|---:|---:|---:|
| Main-thread time per frame while hovering | 8.1 ms | 5.7 ms | **3.0 ms** |
| Browser CPU while hovering (all processes) | 88% | 63% | **28%** |
| Frames over 20 ms | 0 | 0 | 0 |
| Timer and frame wakeups in 10 s at rest | 167 | 0 | **0** |
| Wakeups in 5 s off screen, `motion: 'always'` | 83 | 0 | **0** |
| Size, minified and gzipped | 6,018 B | | 10,545 B |

- *First version*: the original script, one `<span>` per character, CSS width transitions, a 60 ms `setInterval` that never stops, and `getBoundingClientRect` on every character for each pointer move.
- *DOM renderer*: this engine drawing into absolutely positioned spans moved with transforms. It ran 2.2× slower than canvas and added 0.8 KB, so it was dropped. It lives in commit `1f75b33` if you want to compare.
- *Canvas*: what ships. About 3 KB of its 10 KB are the symbol tables. The Greek and Cyrillic tables are a separate 0.9 KB module. It does more than the first version: fonts, languages, labels, pausing, springs and crossfades.

To run the benchmark: `npm install && npm run build`, then `npm i -D playwright && npx playwright install chromium && node bench/run.mjs`. `node bench/plain.mjs` checks that the demo with `rest: 'plain'` always goes back to plain text.

### Motion

`bench/motion.mjs` records where each glyph is drawn on every frame while a pointer sweeps over the preview text and leaves it, then compares the frames. Median of 5 seeds, same machine:

| | v0.2.2 | v0.3.0 |
|---|--:|--:|
| Hover: largest change of a glyph's speed between two frames | 8.4 px | **2.1 px** |
| Hover: times a glyph turns back, per second | 2.7 | **0.9** |
| Hover: times a line's left edge turns back, per second | 3.0 | **1.0** |
| Hover: largest move of a glyph in one frame | 9.1 px | **6.0 px** |
| Back to plain: times a glyph turns back, per second | 0.9 | **0.8** |
| Back to plain: largest move of a glyph in one frame | 3.1 px | 3.2 px |

`node bench/motion.mjs path/to/old/mathglyph.js` measures an older build on the same page.

## Accessibility

- The visual layer is `aria-hidden`. Screen readers and search engines read a visually hidden copy of the plain text, without the stars.
- The element keeps its own role, so an `<h1>` stays a heading.
- With `prefers-reduced-motion: reduce`, there is no intro, no hover scramble, no reshuffle and no transitions. With `rest: 'plain'` the text stays plain. Labels stay, since nothing flickers.

## Browser support

Evergreen browsers. Lines are split with `Intl.Segmenter` (Chrome 87+, Safari 14.1+, Firefox 125+). Where it is missing, mathglyph falls back to code points, so emoji sequences and letters built from combining marks may split across slots.

## Development

```sh
npm install
npm run build
```

The build uses esbuild. It writes `dist/` and copies the module and the font into `docs/`, the demo page on GitHub Pages. Source is in `src/`.

## Inspired by

- [@illo](https://x.com/illo) of [Corca](https://x.com/Corca_math): the teaser for Corca's monospace math font.
- [Andrea Catanzaro](https://www.instagram.com/p/DcI25DONxvd/) of Vercel: the bounding-box take on the effect.

## Licence

MIT for the code ([LICENSE](LICENSE)). SIL OFL 1.1 for the font file `fonts/noto-sans-math-subset.woff2` ([fonts/OFL.txt](fonts/OFL.txt)).
