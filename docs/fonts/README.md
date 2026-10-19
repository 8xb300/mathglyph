# Demo fonts

These fonts are for the demo page only. They are not part of the package.

- `noto-sans-math-subset.woff2`: a copy of `fonts/noto-sans-math-subset.woff2`, made by the build. See `fonts/README.md`.
- `noto-serif-{hk,jp,kr}-900-*.woff2`: the heavy CJK fonts of the columns card, from Noto Serif HK, JP and KR at weight 900 (Black), version 2.003. Their bold Ming strokes are close to the characters on Hong Kong MTR station signs. Each file holds only the characters of one card text: 17 for Chinese, 19 for Japanese, 18 for Korean (4.5 to 5.2 KB each). The 8 hex digits before `.woff2` are the start of the file's SHA-256, so a changed file gets a new name and a cache can keep each file forever.

The CJK files are Modified Versions under the SIL Open Font License 1.1 (`OFL-noto-serif-cjk.txt`): unused glyphs, hinting and OpenType layout features are removed. They keep the copyright and licence names.

To make them again, get the variable fonts from the google/fonts repository (`ofl/notoserifhk/NotoSerifHK[wght].ttf`, `ofl/notoserifjp/NotoSerifJP[wght].ttf`, `ofl/notoserifkr/NotoSerifKR[wght].ttf`), then run this for each, with fontTools 4.67.0 and brotli (the date keeps the bytes the same):

    export SOURCE_DATE_EPOCH=1724039772
    python3 -m fontTools.varLib.instancer 'NotoSerifHK[wght].ttf' wght=900 --update-name-table -o hk-900.ttf
    python3 -m fontTools.subset hk-900.ttf --text='一字一變量一句一證明符號呼吸著又歸於平淡' \
      --layout-features='' --no-hinting --name-IDs+=0,13,14 --flavor=woff2 --output-file=noto-serif-hk-900-zh.woff2

The texts for the other two: Japanese `どの字も変数言葉は証明字は呼吸するまた字に戻る`, Korean `글자는변수낱말은증명늘호흡하고다시글자로`. Then add the hash to each name: `sha256sum <file> | cut -c1-8`.
