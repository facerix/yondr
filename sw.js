// Service Worker for Yondr App - Production Version
// Import shared caching core
importScripts('/sw-core.js');

// Configure cache using shared config helper
const cacheConfig = CacheConfig.create('1.0.0');
const CACHE_VERSION = cacheConfig.version;
const CACHE_NAMES = cacheConfig; // Object with name, staticName, runtimeName
const CACHE_PREFIX = cacheConfig.prefix;
const LOG_PREFIX = `[Yondr ${CACHE_VERSION}]`;

// Get shared resource lists
const coreResources = CacheConfig.getCoreResources();
const staticAssets = CacheConfig.getStaticAssets();

console.log(`${LOG_PREFIX} Configuration loaded:`, {
  version: CACHE_VERSION,
  versionedCache: CACHE_NAMES.name,
  staticCache: CACHE_NAMES.staticName,
  coreResources: coreResources.length,
  staticAssets: staticAssets.length
});

// Install event - cache resources in appropriate caches
self.addEventListener('install', event => {
  event.waitUntil(
    ServiceWorkerCore.handleInstall(
      CACHE_NAMES,
      coreResources,
      staticAssets,
      LOG_PREFIX,
      false // Don't skip waiting - let user decide when to update
    )
  );
});

// Activate event - clean up old caches (but keep static cache)
self.addEventListener('activate', event => {
  event.waitUntil(
    ServiceWorkerCore.handleActivate(CACHE_NAMES, CACHE_PREFIX, LOG_PREFIX)
  );
});

// Fetch event - serve with appropriate caching strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    ServiceWorkerCore.handleFetch(event.request, CACHE_NAMES, LOG_PREFIX)
      .catch(error => {
        console.error(`${LOG_PREFIX} Fetch failed for ${event.request.url}:`, error);
        throw error;
      })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', event => {
  ServiceWorkerCore.handleMessage(event, CACHE_NAMES.name, CACHE_VERSION, LOG_PREFIX);
});