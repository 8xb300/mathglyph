# AGENTS.md

Instructions for coding agents that change this repo. To add mathglyph to a website, read [docs/llms.txt](docs/llms.txt) instead.

mathglyph is a small text effect. It draws monospace text on one canvas. Letters swap to math glyphs and move under the pointer.
It has no dependencies. The only dev dependency is esbuild.

## Layout

| Path | What it holds |
|---|---|
| `src/mathglyph.js` | The engine: `mount`, `register`, the symbol tables, the `'lines'` layout and the `'breathe'` effect. |
| `src/mathglyph.d.ts` | The public types: `Options`, `Effect`, `Layout`, `Glyph` and the rest. |
| `src/languages.js`, `src/languages.d.ts` | The Greek, Cyrillic and CJK look-alike tables. |
| `src/effects/<name>.js` | One effect per file: `ripple`, `firework`, `lens`, `cascade`, `shatter`. |
| `src/layouts/<name>.js` | One layout per file: `columns`, `grid`, `ring`. |
| `build.mjs` | The build. It writes `dist/` and copies the modules and the font into `docs/`. |
| `dist/` | Built files. They are committed, and the CDN links in the README serve them. |
| `docs/` | The demo page (GitHub Pages): `index.html`, `demo.js`, `demo.css`, previews and a copy of the built modules. |
| `docs/examples/sine.js` | A custom layout, written with the public `Layout` interface: lines on a sine wave. The README shows it, and the demo imports it. The build does not touch it. |
| `docs/llms.txt` | The guide for agents that add mathglyph to a site. |
| `bench/` | Checks and benchmarks: `plain.mjs`, `run.mjs`, `motion.mjs`, `record.mjs`, and the page they open. |
| `fonts/` | The Noto Sans Math subset (SIL OFL 1.1). |

## Build

```sh
npm install
npm run build
```

The build is deterministic. After a build, `git status` shows changes only in files that you changed in `src/`, plus the matching `dist/` and `docs/` copies.
Commit those copies in the same commit as the source. `package-lock.json` is not tracked.

## Run the demo locally

Run the build first. The demo is static files, so any static server works:

```sh
python3 -m http.server 8000 --directory docs
```

Open http://localhost:8000/. `docs/mathglyph.js`, `docs/languages.js`, `docs/effects/` and `docs/layouts/` are build output. Edit `src/`, then build again.

## Checks before a commit

The benchmarks need Playwright and its Chromium. They are not in `package.json`. Install them without saving:

```sh
npm install --no-save playwright
npx playwright install chromium
```

Run `npm run build` first, because the checks load `dist/` and `docs/`.

1. `node bench/plain.mjs` takes about 10 minutes. It checks that the demo and every layout with every effect go back to plain text with `rest: 'plain'`, and that no frames run after that. It also checks that reduced motion changes nothing. Passing means every line starts with `ok` and the exit code is 0. It prints `FAIL` lines and exits 1 otherwise. `node bench/plain.mjs demo` and `node bench/plain.mjs matrix [layout]` run a part.
2. `node bench/run.mjs` measures the original script against the current engine. It prints tables and has no pass or fail exit code. Passing means that the engine has no regression against the README "Numbers" table (about 3.0 ms of main-thread time per frame while hovering 2,000 characters, 0 frames over 20 ms, 0 wakeups at rest, 0 wakeups off screen). Timing depends on the machine, so compare the `canvas` row with a run before your change on the same machine. `node bench/run.mjs effects` does the same for each effect. It needs Linux and the full git history.
3. Run `node bench/motion.mjs` if you changed how slots, springs or lines move. See the comment at the top of the file.

The size of each file prints at the end of `npm run build`. Compare it with the Sizes table in the README.

## Hard rules

- **Zero dependencies.** Nothing is imported at run time. esbuild is the only dev dependency. Do not add a runtime package, a font CDN or a network call.
- **Zero work when idle.** No timer or frame runs while nothing moves, while the text is off screen, or while the tab is hidden. One `requestAnimationFrame` loop drives all motion and stops when the last glyph settles. The outside hooks (`burst`, `setPointer`, `step` and the others that `mount` returns) follow this rule too: a call can start the loop, but they add no timer, and the loop still stops when nothing moves. `bench/plain.mjs` and the idle rows of `bench/run.mjs` check this.
- **No layout reads in the frame loop.** Do not call `getBoundingClientRect`, `offsetWidth`, `getComputedStyle` or `measureText` in a frame. Glyph widths and slot geometry are cached, and updated only on resize and when a font loads. A layout may read the viewport height only in `size()`.
- **Respect reduced motion.** With `prefers-reduced-motion: reduce` there is no intro, no hover scramble, no effect, no reshuffle and no transition. The engine does not call effects. A new feature must follow this.
- **Size budget.** Each effect or layout module is about 1 KB gzipped. The largest today is `shatter` at 1,170 B. The core is about 14 KB gzipped. Do not make a module or the core larger without a reason, and put the new numbers in the README Sizes table.
- **Everything returns to plain.** With `rest: 'plain'`, every layout and every effect must leave the text plain after the pointer leaves, and the loop must stop. `node bench/plain.mjs` fails if one does not.
- **Modules stand alone.** A file in `src/effects/` or `src/layouts/` has no imports and exports one `var <name>`, so its build holds nothing of the core. Use ES2019 syntax (the build target).
- **Accessibility stays.** The canvas is `aria-hidden`, and the element keeps a visually hidden copy of the plain text.

## Add an effect

1. Create `src/effects/<name>.js` that exports `var <name> = { name, defaults, frame, glyph, paint?, reach? }`. The interface is `Effect` in `src/mathglyph.d.ts` and the "Custom effects" section of the README. Copy a small module: `src/effects/lens.js` (a `frame()` with state) or `src/effects/ripple.js`. `src/effects/shatter.js` shows `paint()`. Keep per-glyph state in `g.fx` and per-mount state in `f.state`, never in module variables, so that the effect stacks: the engine gives each effect in an `effect: [...]` list its own.
2. Add the name to `EffectName` in `src/mathglyph.d.ts`, and document the settings in the `effect` comment of `Options`.
3. Run `npm run build`. The build finds the file by itself and writes `dist/effects/<name>.min.js`, its `.d.ts` and the copy in `docs/effects/`. `bench/plain.mjs` and `bench/run.mjs effects` also find it by themselves.
4. In `docs/demo.js`, import the module, add it to the `MathGlyph.register(...)` call, and add a card to `GALLERY.effect`.
5. In `bench/record.mjs`, add a line to the table of previews. Record the preview with `node bench/record.mjs previews <name>` (needs `sharp`).
6. In the README, add a row to the Effects table, a row to the Sizes table, a row to the hover table in Performance, and the name to the `effect` row in Options.

## Add a layout

1. Create `src/layouts/<name>.js` that exports `var <name> = { name, defaults?, size?, place, bands?, vertical? }`. The built-in layouts and custom layouts use the same public interface: `Layout` in `src/mathglyph.d.ts` and the "Custom layouts" section of the README. Copy `src/layouts/ring.js` (a short one), `src/layouts/grid.js` or `docs/examples/sine.js`. `size()` is optional: without it, the engine uses the size of `'lines'`. `size()` runs on start, resize, font load and update, never in the frame loop. `place()` sets `cx`, `cy` and `r` of every glyph from the slot widths `w`. It must keep the anchor word still.
2. Add the name to `LayoutName` in `src/mathglyph.d.ts`, and document the settings in the `layout` comment of `Options`.
3. Run `npm run build`, then `node bench/plain.mjs matrix <name>`.
4. Update `docs/demo.js` (import, `register`, `GALLERY.layout`), `bench/record.mjs` and the README (the Layouts table, the Sizes table, the `layout` row in Options), as for an effect.

## Change an option

An option is in `src/mathglyph.js` (the default and the code), `src/mathglyph.d.ts` (the type and its comment), the README Options table and `docs/llms.txt`. Change all four in one commit.
The demo shows the options in `docs/index.html` (a control with `data-opt="<name>"`) and `docs/demo.js` (the `SHOWN` list and the "Copy code" output). Add or change the control there. Keep the "Copy code" text a working `mount` call.
If a default or a size changes, update the numbers in the README and in `docs/llms.txt`. The version appears in `package.json`, `docs/llms.txt` and the CDN links in the README.

## Style

- Match the file you edit. The source uses `var`, plain functions and short comments that give the reason, not the syntax.
- Write docs in short, literal sentences. Distances are in em, sizes in CSS px, and shares are numbers from 0 to 1.
- Make one change per commit, with a message that says what changed.
