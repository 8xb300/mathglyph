# Changelog

## 0.7.0

- New option `idle`: motion while the pointer is away. `mode: 'shuffle'` swaps random letters every `every` seconds (default 1.5), a share `amount` of them each time (default 0.1). `mode: 'wander'` drifts a slow virtual pointer over the text and runs the effect. Off by default. The pointer takes over at once, and idle motion comes back 1.2 s after it leaves (with `rest: 'plain'`, after the revert). It stops off screen, in a hidden tab and with reduced motion.
- `motion: 'always'` is now a shortcut for `idle: { mode: 'shuffle', every: 0.18, amount: 0.025 }`, with the wandering point as before. Its letters now scramble for a moment before they settle, and the shuffle waits while the pointer is on the text.
- `bench/plain.mjs idle` and `bench/run.mjs idle` check and measure the new option.
- The core grows by 232 B gzipped, to 14,377 B.

## 0.6.2

First release published from GitHub Actions with npm provenance. No code changes.

## 0.6.1

Type fixes, `lang` in Copy code, and the Dela Gothic One font removed from the demo.
