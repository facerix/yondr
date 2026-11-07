import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

async function expectDistFile(url) {
  const rel = url === '/' ? 'index.html' : url.replace(/^\//, '');
  await assert.doesNotReject(access(join(dist, rel)), `Missing built resource: ${url}`);
}

test('all service worker precache resources are shipped', async () => {
  const source = await readFile(join(dist, 'sw-core.js'), 'utf8');
  const cacheConfig = runInNewContext(`${source}\nCacheConfig`, { self: {} });
  for (const url of [...cacheConfig.getCoreResources(), ...cacheConfig.getStaticAssets()]) {
    await expectDistFile(url);
  }
});

test('OS metadata is excluded from the deployment directory', async () => {
  for (const rel of ['images', 'fonts']) {
    const files = await readdir(join(dist, rel));
    assert.ok(!files.includes('.DS_Store'), `${rel}/.DS_Store should not be deployed`);
  }
});

test('page icons and static assets resolve in dist', async () => {
  for (const file of ['index.html', 'about.html', 'explore/index.html', 'plan/index.html']) {
    const html = await readFile(join(dist, file), 'utf8');
    for (const match of html.matchAll(/<(?:img|link)\b[^>]*(?:src|href)=["'](\/(?:images\/|fonts\/|icons\/|icon|hero|main\.css|manifest\.json)[^"']*)["']/g)) {
      await expectDistFile(match[1]);
    }
  }
});

test('HTML entry points and compiled module imports resolve in dist', async () => {
  const htmlFiles = ['index.html', 'explore/index.html', 'plan/index.html'];
  const pending = [];
  for (const file of htmlFiles) {
    const html = await readFile(join(dist, file), 'utf8');
    for (const match of html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)) {
      const url = match[1];
      const rel = url.startsWith('/') ? url.slice(1) : join(dirname(file), url);
      await expectDistFile(rel);
      pending.push(rel);
    }
  }

  const visited = new Set();
  while (pending.length) {
    const rel = pending.pop();
    if (visited.has(rel)) continue;
    visited.add(rel);
    const js = await readFile(join(dist, rel), 'utf8');
    for (const match of js.matchAll(/\bimport\s+(?:[^'";]*?\s+from\s+)?["']([^"']+\.js)["']/g)) {
      const specifier = match[1];
      const imported = specifier.startsWith('/')
        ? specifier.slice(1)
        : join(dirname(rel), specifier);
      await expectDistFile(imported);
      pending.push(imported);
    }
  }
  assert.ok(visited.size > 10, 'expected the app module graph to be checked');
});
