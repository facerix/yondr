import assert from 'node:assert/strict';
import test from 'node:test';
import { clearAppCache } from '../dist/src/clearAppCache.js';

test('clearing the app cache removes only Yondr caches, unregisters, and reloads', async () => {
  const keys = ['navigator', 'window', 'caches'];
  const original = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const setGlobal = (key, value) => Object.defineProperty(globalThis, key, {
    configurable: true, writable: true, value,
  });
  const deleted = [];
  let unregistered = false;
  let reloaded = false;
  const registration = { async unregister() { unregistered = true; return true; } };

  try {
    setGlobal('window', { location: { reload() { reloaded = true; } } });
    setGlobal('navigator', {
      serviceWorker: { async getRegistration() { return registration; } },
    });
    setGlobal('caches', {
      async keys() { return ['yondr-cache-v2', 'yondr-cache-static', 'another-app-cache']; },
      async delete(name) { deleted.push(name); return true; },
    });

    await clearAppCache();

    assert.deepEqual(deleted, ['yondr-cache-v2', 'yondr-cache-static']);
    assert.equal(unregistered, true);
    assert.equal(reloaded, true);
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor === undefined) delete globalThis[key];
      else Object.defineProperty(globalThis, key, descriptor);
    }
  }
});

test('a failed cache deletion does not unregister or reload', async () => {
  const keys = ['navigator', 'window', 'caches'];
  const original = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const setGlobal = (key, value) => Object.defineProperty(globalThis, key, {
    configurable: true, writable: true, value,
  });
  let unregistered = false;
  let reloaded = false;

  try {
    setGlobal('window', { location: { reload() { reloaded = true; } } });
    setGlobal('navigator', { serviceWorker: {
      async getRegistration() { return { async unregister() { unregistered = true; return true; } }; },
    } });
    setGlobal('caches', {
      async keys() { return ['yondr-cache-v2']; },
      async delete() { return false; },
    });

    await assert.rejects(clearAppCache(), /Could not delete cache/);
    assert.equal(unregistered, false);
    assert.equal(reloaded, false);
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor === undefined) delete globalThis[key];
      else Object.defineProperty(globalThis, key, descriptor);
    }
  }
});
