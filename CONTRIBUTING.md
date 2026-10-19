# Contributing to mathglyph

Thank you for helping. mathglyph is a small library, and we want to keep it small, fast and plain. Issues and pull requests are welcome.

If you use a coding agent, point it at [AGENTS.md](AGENTS.md). It has the same rules in more detail.

## Set up

You need Node.js 18 or later and git.

```sh
git clone https://github.com/8xb300/mathglyph.git
cd mathglyph
npm install
npm run build
```

The build writes `dist/` and copies the modules into `docs/`. Edit files in `src/`, never the built files. Commit the rebuilt `dist/` and `docs/` files together with your change to `src/`.

## Run the demo

The demo in `docs/` is static. After a build, serve it:

```sh
python3 -m http.server 8000 --directory docs
```

Open http://localhost:8000/. Use the demo to try your change, then press "Copy code" to get the options as a working `mount` call.

## Run the checks

The checks need Playwright and its Chromium:

```sh
npm install --no-save playwright
npx playwright install chromium
node bench/plain.mjs
node bench/run.mjs
```

- `node bench/plain.mjs` takes about 10 minutes (`node bench/plain.mjs demo` is faster). It must print `ok` for every line. It checks that the text goes back to plain with `rest: 'plain'` and that no frames run afterwards, for the demo and for every layout with every effect.
- `node bench/run.mjs` measures speed (Linux only). Run it before and after your change on the same machine, and say in your pull request if the numbers differ.

## Budgets

- **Speed.** The loop does no layout reads and no work when idle. The README "Numbers" section has the reference: about 3 ms of main-thread time per frame for the default effect, with no frame over 20 ms.
- **Size.** There are no dependencies. Each effect or layout module is about 1 KB gzipped, and the core is about 13 KB gzipped. `npm run build` prints the sizes. If your change makes a file larger, say why in the pull request.
- **Motion.** With `prefers-reduced-motion: reduce`, nothing moves.

## Code style

- Match the file you edit: `var`, plain functions, ES2019 syntax and short comments that say why.
- Effects and layouts are single files in `src/effects/` and `src/layouts/`, with no imports.
- Keep docs short and literal. Update the README, `src/mathglyph.d.ts` and `docs/llms.txt` when an option changes.

## Propose an effect or a layout

Open an issue first. Say what it does, show a short clip or a link to a branch, and give its size when built. Good candidates are small (about 1 KB gzipped), return to plain text when the pointer leaves, and stop all work when they finish.

To write one, copy a small module (`src/effects/lens.js` or `src/layouts/ring.js`) and follow "Add an effect" or "Add a layout" in [AGENTS.md](AGENTS.md).

## Report a bug

Open an issue and include:

- Your browser and its version, and your operating system.
- The options that show the bug. In the demo, press "Copy code" and paste the result.
- What you expected, and what happened. A short screen recording helps.
- Whether it happens with `prefers-reduced-motion` on, and with the default font.

## Licence

By contributing, you agree that your contribution is under the [MIT licence](LICENSE). The font file `fonts/noto-sans-math-subset.woff2` stays under the SIL OFL 1.1.
