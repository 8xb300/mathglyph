// Builds dist/ and copies the module and the math font into docs/ for the demo.
// Usage: npm install && npm run build
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const common = {
  entryPoints: ['src/mathglyph.js'],
  bundle: true,
  charset: 'utf8',
  target: 'es2019',
  banner: { js: `/*! mathglyph v${version} | MIT | github.com/8xb300/mathglyph */` },
  logLevel: 'warning',
};

await build({ ...common, format: 'esm', outfile: 'dist/mathglyph.js' });
await build({ ...common, format: 'esm', minify: true, outfile: 'dist/mathglyph.min.js' });
await build({ ...common, entryPoints: ['src/languages.js'], format: 'esm', minify: true, outfile: 'dist/languages.min.js' });
// The script-tag build carries the Greek and Cyrillic tables too: MathGlyph.greek, MathGlyph.cyrillic.
await build({
  ...common,
  entryPoints: undefined,
  stdin: { contents: "export * from './mathglyph.js'; export * from './languages.js';", resolveDir: 'src' },
  format: 'iife',
  globalName: 'MathGlyph',
  minify: true,
  outfile: 'dist/mathglyph.iife.min.js',
});
copyFileSync('src/mathglyph.d.ts', 'dist/mathglyph.d.ts');
copyFileSync('src/languages.d.ts', 'dist/languages.d.ts');

mkdirSync('docs/fonts', { recursive: true });
copyFileSync('dist/mathglyph.min.js', 'docs/mathglyph.js');
copyFileSync('dist/languages.min.js', 'docs/languages.js');
if (existsSync('fonts/noto-sans-math-subset.woff2')) {
  copyFileSync('fonts/noto-sans-math-subset.woff2', 'docs/fonts/noto-sans-math-subset.woff2');
}

for (const f of ['dist/mathglyph.js', 'dist/mathglyph.min.js', 'dist/languages.min.js', 'dist/mathglyph.iife.min.js']) {
  const buf = readFileSync(f);
  console.log(`${f.padEnd(28)} ${String(buf.length).padStart(6)} B   gzip ${gzipSync(buf, { level: 9 }).length} B`);
}
