import './components/UpdateNotification.js';
import DataStore from './src/DataStore.js';
import ServiceWorkerManager from './src/ServiceWorkerManager.js';

const whenLoaded = Promise.all(
  [
    customElements.whenDefined("update-notification"),
  ],
);

whenLoaded.then(async () => {
  const exploreLinkCaption = document.querySelector("#linkExplore .btn-caption");
  await ServiceWorkerManager.register();
  DataStore.init();

  DataStore.addEventListener("change", evt => {
    switch ((evt as CustomEvent).detail.changeType) {
      case "init":
        if (DataStore.crossroads?.length > 0) {
          exploreLinkCaption.textContent = "Continue exploring";
        } else {
          exploreLinkCaption.textContent = "Start exploring";
        }
        break;
      default:
        // no action to take otherwise
        break;
    }
  });
});
