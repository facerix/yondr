/** Clear only Yondr's Cache Storage entries, then load the app without its old worker. */
export async function clearAppCache(): Promise<void> {
  if (!('caches' in globalThis)) {
    throw new Error('The Cache API is not available in this browser');
  }

  const cacheNames = await caches.keys();
  for (const name of cacheNames.filter(name => name.startsWith('yondr-cache-'))) {
    if (!await caches.delete(name)) {
      throw new Error(`Could not delete cache ${name}`);
    }
  }

  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration && !await registration.unregister()) {
    throw new Error('Could not unregister the Yondr service worker');
  }

  window.location.reload();
}
