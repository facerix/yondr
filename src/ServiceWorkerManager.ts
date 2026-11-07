// Singleton module for service worker registration
// Provides centralized management of service worker lifecycle
import { isDevelopmentMode } from './utils.js';

class ServiceWorkerManager {
  static instance: ServiceWorkerManager;
  #isRegistered = false;
  #registration = null;
  #listenersSetup = false;
  #developmentMode = isDevelopmentMode();
  #swFile = this.#developmentMode ? '/sw-dev.js' : '/sw.js';

  constructor() {
    // Prevent multiple instances
    if (ServiceWorkerManager.instance) {
      return ServiceWorkerManager.instance;
    }
    ServiceWorkerManager.instance = this;
  }

  /**
   * Register the service worker if supported and not already registered
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async register() {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn(`[Yondr] Service Workers not supported in this browser`);
      return null;
    }

    // Check if there's already an active registration
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      console.log(`[Yondr] Service Worker already registered`);
      this.#registration = existingRegistration;
      this.#isRegistered = true;
      // Only set up update listeners if not already done
      if (!this.#listenersSetup) {
        this.#setupUpdateListeners();
      }
      return this.#registration;
    }

    // Don't register multiple times in the same instance
    if (this.#isRegistered) {
      console.log(`[Yondr] Service Worker already registered in this instance`);
      return this.#registration;
    }

    try {
      // Wait for page to load before registering
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          window.addEventListener('load', resolve, { once: true });
        });
      }

      // Register the service worker
      this.#registration = await navigator.serviceWorker.register(this.#swFile);
      this.#isRegistered = true;

      console.log(`[Yondr] Service Worker registered successfully:`, this.#registration.scope);

      // Set up event listeners for service worker updates
      this.#setupUpdateListeners();

      return this.#registration;
    } catch (error) {
      console.error(`[Yondr] Service Worker registration failed:`, error);
      return null;
    }
  }

  /**
   * Set up listeners for service worker updates
   * @private
   */
  #setupUpdateListeners() {
    if (!this.#registration || this.#listenersSetup) return;

    // Listen for updates to the service worker
    this.#registration.addEventListener('updatefound', () => {
      const newWorker = this.#registration.installing;
      console.log(`[Yondr] New service worker installing...`);

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log(`[Yondr] New service worker available. Consider refreshing the page.`);
          // Dispatch event with the actual new worker
          this.#dispatchUpdateEvent(newWorker);
        }
      });
    });
    
    this.#listenersSetup = true;
  }

  /**
   * Dispatch a custom event when a service worker update is available
   * @private
   */
  #dispatchUpdateEvent(pendingWorker) {
    const event = new CustomEvent('sw-update-available', {
      detail: {
        registration: this.#registration,
        pendingWorker: pendingWorker || this.#registration.waiting
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get the current registration
   * @returns {ServiceWorkerRegistration|null}
   */
  getRegistration() {
    return this.#registration;
  }

  /**
   * Check if service worker is registered
   * @returns {boolean}
   */
  isRegistered() {
    return this.#isRegistered;
  }

  /**
   * Get cache information from the service worker
   * @returns {Promise<Object>}
   */
  async getCacheInfo() {
    if (!this.#registration || !this.#registration.active) {
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.#registration.active.postMessage(
        { type: 'GET_CACHE_INFO' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Force service worker to skip waiting and activate
   * @returns {Promise<void>}
   */
  async skipWaiting() {
    if (!this.#registration || !this.#registration.waiting) {
      return;
    }

    this.#registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Wait for the new service worker to take control
    return new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    });
  }

  /**
   * Handle update now request from UpdateNotification component
   * @param {ServiceWorker} pendingWorker - The pending service worker
   * @returns {Promise<void>}
   */
  async handleUpdateNow(pendingWorker) {
    console.log(`[Yondr] Handling update now request`);
    
    try {
      // Skip waiting and activate the new service worker
      await this.skipWaiting();
      
      // Reload the page to use the new service worker
      window.location.reload();
    } catch (error) {
      console.error(`[Yondr] Failed to update service worker:`, error);
    }
  }
}

// Create and export singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;
