# Demo fonts

These fonts are for the demo page only. They are not part of the package.

- `noto-sans-math-subset.woff2`: a copy of `fonts/noto-sans-math-subset.woff2`, made by the build. See `fonts/README.md`.
- `noto-serif-{jp,kr}-900-*.woff2`: the heavy CJK fonts of the columns card, from Noto Serif JP and KR at weight 900 (Black), version 2.003. Their bold Ming strokes are close to the characters on Hong Kong MTR station signs. Each file holds only the characters of one card text: 9 for Japanese (2,964 B), and for Korean the 18 of an earlier, longer card text (4,544 B).
- The three Hong Kong faces for Traditional Chinese (the chips 路, 黑 and 宋, and the font picker). Each holds the 12 characters of the columns card text and the hero's Traditional Chinese text:
  - `dela-gothic-one-hk.*.woff2`: Dela Gothic One 1.005 (2,568 B), licence `OFL-dela-gothic-one.txt`. A road-sign look. It is not Prison Gothic (監獄體): no openly licensed version of that exists.
  - `chiron-hei-hk-900-hk.*.woff2`: Chiron Hei HK 2.530 at weight 900 (3,828 B), licence `OFL-chiron-hei-hk.txt`.
  - `noto-serif-hk-900-hk.*.woff2`: Noto Serif HK 2.003 at weight 900 (3,964 B), licence `OFL-noto-serif-cjk.txt`.

- `dela-gothic-one/`, `chiron-hei-hk/`, `noto-serif-hk/`: the full fonts, for any Chinese text: the same fonts at the same weights, with every character from U+2E80 up (CJK, kana, full-width forms), in unicode-range slices. Each folder holds one stylesheet with an `@font-face` rule for each slice, the slices and `OFL.txt`. Dela Gothic One: 8,185 characters in 17 slices, 1.30 MB. Chiron Hei HK: 45,241 characters in 107 slices, 7.48 MB. Noto Serif HK: 19,627 characters in 54 slices, 4.59 MB.

The 8 hex digits before `.woff2` are the start of the file's SHA-256, so a changed file gets a new name and a cache can keep each file forever.

The subsets are Modified Versions under the SIL Open Font License 1.1: unused glyphs, hinting and OpenType layout features are removed. They keep the copyright and licence names.

To make them again, get the fonts from the google/fonts repository: `ofl/notoserifhk/NotoSerifHK[wght].ttf`, `ofl/notoserifjp/NotoSerifJP[wght].ttf`, `ofl/notoserifkr/NotoSerifKR[wght].ttf`, `ofl/chironheihk/ChironHeiHK[wght].ttf` and `ofl/delagothicone/DelaGothicOne-Regular.ttf`. Then run this for each, with fontTools 4.67.0 and brotli (the date keeps the bytes the same). Dela Gothic One has one weight, so it skips the first step:

    export SOURCE_DATE_EPOCH=1724039772
    python3 -m fontTools.varLib.instancer 'NotoSerifHK[wght].ttf' wght=900 --update-name-table -o hk-900.ttf
    python3 -m fontTools.subset hk-900.ttf --text='字是變量句是證明呼吸每個字都是變量' \
      --layout-features='' --no-hinting --name-IDs+=0,13,14 --flavor=woff2 --output-file=noto-serif-hk-900-hk.woff2

The texts for the other two: Japanese `字は変数文は証明呼吸`, Korean `글자는변수낱말은증명늘호흡하고다시글자로`. Then add the hash to each name: `sha256sum <file> | cut -c1-8`.

To cut the slices, the characters go in the order of the unicode-range slices of the Google Fonts stylesheet for Noto Sans HK, most common first, then the characters that no slice holds, in code point order. Consecutive groups merge until a slice holds about 75 KB. To make one slice again, subset the font from the same instance as above, with the slice's `unicode-range` from the stylesheet as `--unicodes`, and the same flags except `--text`. The slices keep the name IDs 0 to 6, 13 and 14.
