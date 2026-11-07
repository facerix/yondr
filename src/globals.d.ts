import type ServiceWorkerManager from './ServiceWorkerManager.js';
import type { CurrencyClient } from './currencyClient.js';

declare global {
  interface Window {
    serviceWorkerManager?: typeof ServiceWorkerManager;
    currencyClient?: CurrencyClient;
  }
}
