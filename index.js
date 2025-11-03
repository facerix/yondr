import './components/UpdateNotification.js';
import DataStore from './src/DataStore.js';
import ServiceWorkerManager from './src/ServiceWorkerManager.js';

const whenLoaded = Promise.all(
  [
    customElements.whenDefined("update-notification"),
  ],
);

whenLoaded.then(async () => {
  await ServiceWorkerManager.register();
  DataStore.init();

  DataStore.addEventListener("change", evt => {
    switch (evt.detail.changeType) {
      case "init":
        if (DataStore.crossroads?.length > 0) {
          setTimeout(() => {
            window.location.href = '/explore';
          }, 500);
        }
        break;
      default:
        // no action to take otherwise
        break;
    }
  });
});
