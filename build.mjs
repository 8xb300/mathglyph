// Builds dist/ and copies the modules and the math font into docs/ for the demo.
// Usage: npm install && npm run build
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
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
const outputs = ['dist/mathglyph.js', 'dist/mathglyph.min.js', 'dist/languages.min.js', 'dist/mathglyph.iife.min.js'];

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

// Each effect and layout is its own module: src/<kind>/<name>.js exports `var <name>`, with no
// imports, so its build holds nothing of the core.
const modules = [];
for (const [kind, type] of [['effects', 'Effect'], ['layouts', 'Layout']]) {
  if (!existsSync(`src/${kind}`)) continue;
  mkdirSync(`dist/${kind}`, { recursive: true });
  mkdirSync(`docs/${kind}`, { recursive: true });
  for (const file of readdirSync(`src/${kind}`).filter((f) => f.endsWith('.js')).sort()) {
    const name = file.slice(0, -3);
    const out = `dist/${kind}/${name}.min.js`;
    await build({ ...common, entryPoints: [`src/${kind}/${file}`], format: 'esm', minify: true, outfile: out });
    writeFileSync(`dist/${kind}/${name}.d.ts`, `import type { ${type} } from '../mathglyph.js';\nexport declare const ${name}: ${type};\n`);
    copyFileSync(out, `docs/${kind}/${name}.js`);
    modules.push({ kind, name });
    outputs.push(out);
  }
}

// The all-in-one script: core, languages, and every effect and layout, already registered.
await build({
  ...common,
  entryPoints: undefined,
  stdin: {
    contents: [
      "import { register } from './mathglyph.js';",
      ...modules.map(({ kind, name }) => `import { ${name} } from './${kind}/${name}.js';`),
      `register(${modules.map(({ name }) => name).join(', ')});`,
      "export * from './mathglyph.js'; export * from './languages.js';",
    ].join('\n'),
    resolveDir: 'src',
  },
  format: 'iife',
  globalName: 'MathGlyph',
  minify: true,
  outfile: 'dist/mathglyph.all.iife.min.js',
});
outputs.push('dist/mathglyph.all.iife.min.js');

mkdirSync('docs/fonts', { recursive: true });
copyFileSync('dist/mathglyph.min.js', 'docs/mathglyph.js');
copyFileSync('dist/languages.min.js', 'docs/languages.js');
if (existsSync('fonts/noto-sans-math-subset.woff2')) {
  copyFileSync('fonts/noto-sans-math-subset.woff2', 'docs/fonts/noto-sans-math-subset.woff2');
}

for (const f of outputs) {
  const buf = readFileSync(f);
  console.log(`${f.padEnd(34)} ${String(buf.length).padStart(6)} B   gzip ${String(gzipSync(buf, { level: 9 }).length).padStart(5)} B`);
}
