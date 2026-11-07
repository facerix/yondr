import { cp, mkdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const files = [
  'index.html', 'about.html', 'explore/index.html', 'plan/index.html',
  'main.css', 'manifest.json', 'hero.svg', 'logo.png',
  'icon512_maskable.png', 'icon512_rounded.png',
  'sw.js', 'sw-dev.js', 'sw-core.js',
];
const dirs = ['images', 'fonts'];

async function run() {
  await mkdir(dist, { recursive: true });
  for (const rel of files) {
    const dest = join(dist, rel);
    await mkdir(dirname(dest), { recursive: true });
    await cp(join(root, rel), dest);
  }
  for (const rel of dirs) {
    await cp(join(root, rel), join(dist, rel), {
      recursive: true,
      filter: source => basename(source) !== '.DS_Store',
    });
  }
  console.log(`[copy-assets] copied ${files.length} files + ${dirs.length} dirs to dist/`);
}

run().catch(error => {
  console.error('[copy-assets] failed:', error);
  process.exitCode = 1;
});
