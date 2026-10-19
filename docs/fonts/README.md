# Demo fonts

These fonts are for the demo page only. They are not part of the package.

- `noto-sans-math-subset.woff2`: a copy of `fonts/noto-sans-math-subset.woff2`, made by the build. See `fonts/README.md`.
- `noto-serif-{jp,kr}-900-*.woff2`: the heavy CJK fonts of the columns card, from Noto Serif JP and KR at weight 900 (Black), version 2.003. Their bold Ming strokes are close to the characters on Hong Kong MTR station signs. Each file holds only the characters of one card text: 19 for Japanese, 18 for Korean (about 5 KB each).
- The three Hong Kong faces for Traditional Chinese (the chips 路, 黑 and 宋, and the font picker). Each holds the 34 characters of the columns card text and the hero's Traditional Chinese text:
  - `dela-gothic-one-hk.*.woff2`: Dela Gothic One 1.005 (5,880 B), licence `OFL-dela-gothic-one.txt`. A road-sign look. It is not Prison Gothic (監獄體): no openly licensed version of that exists.
  - `chiron-hei-hk-900-hk.*.woff2`: Chiron Hei HK 2.530 at weight 900 (8,224 B), licence `OFL-chiron-hei-hk.txt`.
  - `noto-serif-hk-900-hk.*.woff2`: Noto Serif HK 2.003 at weight 900 (8,908 B), licence `OFL-noto-serif-cjk.txt`.

The 8 hex digits before `.woff2` are the start of the file's SHA-256, so a changed file gets a new name and a cache can keep each file forever.

The subsets are Modified Versions under the SIL Open Font License 1.1: unused glyphs, hinting and OpenType layout features are removed. They keep the copyright and licence names.

To make them again, get the fonts from the google/fonts repository: `ofl/notoserifhk/NotoSerifHK[wght].ttf`, `ofl/notoserifjp/NotoSerifJP[wght].ttf`, `ofl/notoserifkr/NotoSerifKR[wght].ttf`, `ofl/chironheihk/ChironHeiHK[wght].ttf` and `ofl/delagothicone/DelaGothicOne-Regular.ttf`. Then run this for each, with fontTools 4.67.0 and brotli (the date keeps the bytes the same). Dela Gothic One has one weight, so it skips the first step:

    export SOURCE_DATE_EPOCH=1724039772
    python3 -m fontTools.varLib.instancer 'NotoSerifHK[wght].ttf' wght=900 --update-name-table -o hk-900.ttf
    python3 -m fontTools.subset hk-900.ttf --text='一字一變量一句一證明符號呼吸著又歸於平淡每個字都是一個變量每句話都是一個證明靠近一點，符號就會變化然後慢慢變回文字' \
      --layout-features='' --no-hinting --name-IDs+=0,13,14 --flavor=woff2 --output-file=noto-serif-hk-900-hk.woff2

The texts for the other two: Japanese `どの字も変数言葉は証明字は呼吸するまた字に戻る`, Korean `글자는변수낱말은증명늘호흡하고다시글자로`. Then add the hash to each name: `sha256sum <file> | cut -c1-8`.
