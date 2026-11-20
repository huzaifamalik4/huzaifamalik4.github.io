// Bundles src/ into assets/js. Old chunks are cleared first so stale files never ship.
import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm('assets/js', { recursive: true, force: true });

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  splitting: true,
  format: 'esm',
  target: 'es2020',
  outdir: 'assets/js',
  entryNames: 'app',
  chunkNames: 'chunk-[hash]',
  legalComments: 'none',
  metafile: true,
});

for (const [file, info] of Object.entries(result.metafile.outputs)) {
  console.log(file.padEnd(34), `${(info.bytes / 1024).toFixed(1)} kB`);
}
