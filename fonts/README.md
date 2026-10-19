# Noto Sans Math subset

`noto-sans-math-subset.woff2` (66 KB, 1,007 glyphs) holds only the glyphs mathglyph swaps in: the symbols in
the tables of `src/mathglyph.js` and `src/languages.js`, the Letterlike Symbols and the Mathematical Alphanumeric
Symbols. Greek letters are in it, but no ASCII, Latin-1 or Cyrillic letters, so it never draws plain Latin or
Cyrillic text. Noto Sans Math has no super/subscripts (₀ ²), ‰ ₹ ₿ or IPA letters; those come from the next font.

Source: Noto Sans Math 3.000, `NotoSansMath/full/ttf/NotoSansMath-Regular.ttf` in `NotoSansMath-v3.000.zip` from
https://github.com/notofonts/math/releases/tag/NotoSansMath-v3.000 (the `full` build has ° · € ‡ ℧ ⅋, the
`unhinted` build does not). The subset is a Modified Version under the SIL Open Font License 1.1 (`OFL.txt`):
unused glyphs, hinting, OpenType layout features and the MATH table are removed.

Use it with the library: `fonts: [{ family: 'Noto Sans Math', url: '/path/noto-sans-math-subset.woff2' }]`

To regenerate, extract the zip in the repository root and run this there (made with fontTools 4.67.0).
`unicodes.txt` lists the code points; add new symbols there first.

    uvx --from fonttools --with brotli pyftsubset NotoSansMath/full/ttf/NotoSansMath-Regular.ttf \
      --unicodes-file=fonts/unicodes.txt --layout-features='' --no-hinting --drop-tables+=MATH \
      --name-IDs+=13,14 --flavor=woff2 --output-file=fonts/noto-sans-math-subset.woff2
