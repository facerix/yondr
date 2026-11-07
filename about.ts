import serviceWorkerManager from './src/ServiceWorkerManager.js';
import { clearAppCache } from './src/clearAppCache.js';

const version = document.querySelector<HTMLElement>('#current-version');
const clearButton = document.querySelector<HTMLButtonElement>('#clear-cache');
const status = document.querySelector<HTMLElement>('#cache-status');

try {
  const registration = await serviceWorkerManager.register();
  if (registration && !registration.active) {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker activation timed out')), 5000)),
    ]);
  }
  const cacheInfo = await serviceWorkerManager.getCacheInfo();
  version.textContent = cacheInfo?.version ?? 'Unavailable';
} catch (error) {
  console.error('[Yondr] Could not read the current version:', error);
  version.textContent = 'Unavailable';
}

clearButton.addEventListener('click', async () => {
  if (!window.confirm('Clear Yondr’s cached app files and reload to get the latest version? Your saved crossroads and settings will remain on this device.')) {
    return;
  }

  clearButton.disabled = true;
  status.textContent = 'Clearing cache…';
  try {
    await clearAppCache();
  } catch (error) {
    console.error('[Yondr] Could not clear the app cache:', error);
    status.textContent = 'Could not clear the cache. Please try again.';
    clearButton.disabled = false;
  }
});
