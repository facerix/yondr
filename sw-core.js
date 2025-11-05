// Service Worker Core - Shared Caching Logic
// This module contains reusable caching strategies and utilities
// used by both production and development service workers

// Single source of truth for service worker version
const SW_VERSION = '1.2.0';

/**
 * Configuration helper
 * Creates cache configuration based on environment (dev vs production) and provides shared resource lists
 */
const CacheConfig = {
  create({ isDev = false, prefix = 'yondr-cache-' }) {
    const version = `${SW_VERSION}${isDev ? '-dev' : ''}`;
    return {
      version,
      name: `${prefix}v${version}`,        // Versioned cache (HTML/CSS/JS/components)
      staticName: `${prefix}static`,        // Static cache (images/fonts - never expire)
      runtimeName: `${prefix}runtime`,      // Runtime cache (dynamically cached pages)
      prefix,
      isDev
    };
  },
  
  /**
   * Core resources that need version control
   * These are cached during installation and invalidated on version changes
   */
  getCoreResources() {
    return [
      '/',
      '/about.html',
      '/index.html',
      '/index.js',
      '/main.css',
      '/manifest.json',
      '/components/ConfirmationModal.js',
      '/components/CrossroadSummary.js',
      '/components/CurrentPath.js',
      '/components/EditCrossroadModal.js',
      '/components/EditOptionModal.js',
      '/components/JobPath.js',
      '/components/LocationInputGroup.js',
      '/components/UpdateNotification.js',
      '/components/UserSettingsModal.js',
      '/explore/index.html',
      '/explore/explore.js',
      '/plan/index.html',
      '/plan/plan.js',
      '/src/censusClient.js',
      '/src/costOfLivingData.js',
      '/src/currencyClient.js',
      '/src/DataStore.js',
      '/src/utils.js',
      '/src/ServiceWorkerManager.js',
      '/src/uuid.js',
    ];
  },
  
  /**
   * Static assets that rarely/never change
   * These can be cached long-term in a separate cache
   */
  getStaticAssets() {
    return [
      // Logos and favicons
      '/icon512_maskable.png',
      '/icon512_rounded.png',
      '/logo.png',
      
      // SVG images
      '/hero.svg',
      '/images/close.svg',
      '/images/continue.svg',
      '/images/edit.svg',
      '/images/footsteps.svg',
      '/images/import.png',
      '/images/import.svg',
      '/images/map-no-pins.svg',
      '/images/pin-plus-filled.svg',
      '/images/pin-plus.svg',
      '/images/restart.svg',
      '/images/ripples.svg',
      '/images/sign.svg',
      
      // Fonts
      '/fonts/riesling/stylesheet.css',
      '/fonts/riesling/riesling-webfont.woff',
    ];
  },
  
  /**
   * Development-specific resources
   * API clients and other dev tools
   */
  getDevResources() {
    return [
      // '/api/collectionsClient.js',
      // '/api/recordsClient.js',
    ];
  }
};

/**
 * Core caching utilities and strategies
 */
const ServiceWorkerCore = {
  /**
   * Utility function to detect if a request is for HTML, CSS, or JS files
   * @param {Request} request - The fetch request
   * @returns {boolean} - True if the request is for HTML, CSS, or JS
   */
  isRefreshableResource(request) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();
    
    // Check file extension
    const hasRefreshableExtension = pathname.endsWith('.html') || 
                                   pathname.endsWith('.css') || 
                                   pathname.endsWith('.js');
    
    // Check request destination for HTML documents
    const isDocument = request.destination === 'document';
    
    // Check for root path (likely HTML)
    const isRootPath = pathname === '/' || pathname === '';
    
    return hasRefreshableExtension || isDocument || isRootPath;
  },

  /**
   * Detect if a request is for a static asset that can be cached long-term
   * @param {Request} request - The fetch request
   * @returns {boolean} - True if the request is for a static asset
   */
  isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();
    
    // Static assets: images, fonts, favicons
    return pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|otf|webp)$/);
  },

  /**
   * Cache-first with background refresh strategy
   * Serves from cache immediately, then updates cache in background
   * @param {Request} request - The fetch request
   * @param {string} cacheName - Name of the cache to use
   * @param {string} logPrefix - Prefix for log messages
   * @returns {Promise<Response>} - The response from cache or network
   */
  async cacheFirstWithRefresh(request, cacheName, logPrefix = '[SW]') {
    const cache = await caches.open(cacheName);
    
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // console.log(`${logPrefix} Serving from cache: ${request.url}`);
      
      // Start background refresh (don't await it)
      this.refreshCacheInBackground(request, cache, logPrefix).catch(error => {
        console.warn(`${logPrefix} Background refresh failed for ${request.url}:`, error);
      });
      
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    console.log(`${logPrefix} Fetching from network: ${request.url}`);
    try {
      const response = await fetch(request);
      
      // Cache valid responses
      if (response && response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        await cache.put(request, responseToCache);
        console.log(`${logPrefix} Cached new resource: ${request.url}`);
      }
      
      return response;
    } catch (error) {
      console.error(`${logPrefix} Network fetch failed for ${request.url}:`, error);
      throw error;
    }
  },

  /**
   * Refresh cache in background without blocking the response
   * @param {Request} request - The fetch request
   * @param {Cache} cache - The cache instance
   * @param {string} logPrefix - Prefix for log messages
   */
  async refreshCacheInBackground(request, cache, logPrefix = '[SW]') {
    try {
      // console.log(`${logPrefix} Background refresh for: ${request.url}`);
      const response = await fetch(request);
      
      if (response && response.status === 200 && response.type === 'basic') {
        await cache.put(request, response.clone());
        // console.log(`${logPrefix} Background refresh completed for: ${request.url}`);
      } else {
        console.warn(`${logPrefix} Background refresh got invalid response for ${request.url}:`, response.status);
      }
    } catch (error) {
      // Log error but don't throw - this is background operation
      console.warn(`${logPrefix} Background refresh network error for ${request.url}:`, error.message);
    }
  },

  /**
   * Standard cache-first strategy for non-refreshable resources
   * @param {Request} request - The fetch request
   * @param {string} cacheName - Name of the cache to use
   * @param {string} logPrefix - Prefix for log messages
   * @returns {Promise<Response>} - The response from cache or network
   */
  async cacheFirst(request, cacheName, logPrefix = '[SW]') {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // console.log(`${logPrefix} Serving from cache: ${request.url}`);
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    // console.log(`${logPrefix} Fetching from network: ${request.url}`);
    const response = await fetch(request);
    
    // Cache valid responses
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
      console.log(`${logPrefix} Cached new resource: ${request.url}`);
    }
    
    return response;
  },

  /**
   * Handle service worker installation with multi-cache support
   * @param {Object} cacheNames - Object containing cache names (name, staticName)
   * @param {string[]} coreResources - Array of core resource URLs to cache
   * @param {string[]} staticAssets - Array of static asset URLs to cache
   * @param {string} logPrefix - Prefix for log messages
   * @param {boolean} skipWaiting - Whether to call skipWaiting() after installation
   */
  async handleInstall(cacheNames, coreResources, staticAssets, logPrefix = '[SW]', skipWaiting = false) {
    console.log(`${logPrefix} Service Worker installing...`);
    
    // Validate inputs
    if (!cacheNames || !cacheNames.name) {
      throw new Error(`${logPrefix} Invalid cacheNames object: ${JSON.stringify(cacheNames)}`);
    }
    if (!Array.isArray(coreResources) || coreResources.length === 0) {
      throw new Error(`${logPrefix} Invalid coreResources: must be a non-empty array`);
    }
    
    try {
      // Cache core resources in versioned cache
      const versionedCache = await caches.open(cacheNames.name);
      console.log(`${logPrefix} Caching ${coreResources.length} core resources to: ${cacheNames.name}`);
      
      // Cache core resources individually to get better error reporting
      let coreCachedCount = 0;
      const failedResources = [];
      for (const url of coreResources) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await versionedCache.put(url, response);
            coreCachedCount++;
          } else {
            console.warn(`${logPrefix} Failed to cache core resource ${url}: ${response.status}`);
            failedResources.push({ url, status: response.status });
          }
        } catch (error) {
          console.warn(`${logPrefix} Failed to cache core resource ${url}:`, error.message);
          failedResources.push({ url, error: error.message });
        }
      }
      
      console.log(`${logPrefix} ✓ Cached ${coreCachedCount}/${coreResources.length} core resources`);
      if (failedResources.length > 0) {
        console.warn(`${logPrefix} Failed core resources:`, failedResources);
      }
      
      // Cache static assets in static cache
      const staticCache = await caches.open(cacheNames.staticName);
      console.log(`${logPrefix} Caching ${staticAssets.length} static assets to: ${cacheNames.staticName}`);
      
      // Cache static assets individually to avoid failing on missing files
      let cachedCount = 0;
      for (const url of staticAssets) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await staticCache.put(url, response);
            cachedCount++;
          } else {
            console.warn(`${logPrefix} Failed to cache ${url}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`${logPrefix} Failed to cache ${url}:`, error.message);
        }
      }
      console.log(`${logPrefix} ✓ Cached ${cachedCount}/${staticAssets.length} static assets`);
      
      if (skipWaiting) {
        await self.skipWaiting();
      }
    } catch (error) {
      console.error(`${logPrefix} Failed to cache resources:`, error);
      throw error;
    }
  },

  /**
   * Handle service worker activation with multi-cache support
   * @param {Object} cacheNames - Object containing cache names to keep (name, staticName, runtimeName)
   * @param {string} cachePrefix - Prefix to identify caches to clean up
   * @param {string} logPrefix - Prefix for log messages
   */
  async handleActivate(cacheNames, cachePrefix, logPrefix = '[SW]') {
    console.log(`${logPrefix} Service Worker activating...`);
    
    const existingCaches = await caches.keys();
    const cachesToKeep = [cacheNames.name, cacheNames.staticName, cacheNames.runtimeName];
    
    await Promise.all(
      existingCaches.map(cacheName => {
        // Delete old caches that match our prefix but aren't in the keep list
        if (cacheName.startsWith(cachePrefix) && !cachesToKeep.includes(cacheName)) {
          console.log(`${logPrefix} Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        }
      })
    );
    
    console.log(`${logPrefix} Service Worker activated`);
    console.log(`${logPrefix} Active caches: ${cachesToKeep.join(', ')}`);
    await self.clients.claim();
  },

  /**
   * Handle standard fetch events with multi-cache support
   * @param {Request} request - The fetch request
   * @param {Object} cacheNames - Object containing cache names (name, staticName, runtimeName)
   * @param {string} logPrefix - Prefix for log messages
   * @returns {Promise<Response>} - The response
   */
  async handleFetch(request, cacheNames, logPrefix = '[SW]') {
    // Only handle GET requests
    if (request.method !== 'GET') {
      return fetch(request);
    }

    // Determine which cache to use based on resource type
    let cacheName;
    if (this.isStaticAsset(request)) {
      // Static assets go to static cache (long-term)
      cacheName = cacheNames.staticName;
    } else {
      // Everything else goes to versioned cache
      cacheName = cacheNames.name;
    }

    // Use cache-first with refresh for HTML, CSS, and JS files
    if (this.isRefreshableResource(request)) {
      return this.cacheFirstWithRefresh(request, cacheName, logPrefix);
    } else {
      // Use standard cache-first for other resources (images, fonts, etc.)
      return this.cacheFirst(request, cacheName, logPrefix);
    }
  },

  /**
   * Handle message events from the main thread
   * @param {MessageEvent} event - The message event
   * @param {string} cacheName - Name of the current cache
   * @param {string} cacheVersion - Version of the current cache
   * @param {string} logPrefix - Prefix for log messages
   */
  handleMessage(event, cacheName, cacheVersion, logPrefix = '[SW]') {
    console.log(`${logPrefix} Received message:`, event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
      event.ports[0].postMessage({
        cacheName: cacheName,
        version: cacheVersion
      });
    }
  }
};

// Make available to service worker
self.CacheConfig = CacheConfig;
self.ServiceWorkerCore = ServiceWorkerCore;

