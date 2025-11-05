import { h } from '/src/utils.js';
import '/components/ConfirmationModal.js';
import '/components/CrossroadSummary.js';
import '/components/CurrentPath.js';
import '/components/EditCrossroadModal.js';
import '/components/UserSettingsModal.js';
import '/components/UpdateNotification.js';
import DataStore from '/src/DataStore.js';
import ServiceWorkerManager from '/src/ServiceWorkerManager.js';

const whenLoaded = Promise.all(
  [
    customElements.whenDefined("confirmation-modal"),
    customElements.whenDefined("crossroad-summary"),
    customElements.whenDefined("current-path"),
    customElements.whenDefined("edit-crossroad-modal"),
    customElements.whenDefined("edit-option-modal"),
    customElements.whenDefined("user-settings-modal"),
    customElements.whenDefined("update-notification"),
  ],
);

const crossroadSummary = (crossroad) => {
  const dummy = document.createElement("crossroad-summary");
  dummy.data = crossroad;
  return dummy;
}

whenLoaded.then(() => {
  let activeCrossroadId = null;
  let currentPath = null;
  let confirmationAction = null;
  let potentialCurrentPath = null; // "currentPathOverwrite" | "deleteCrossroad"
  const preloaderContainer = document.querySelector('.preloader-container');
  const mainContents = document.querySelector('main.contents');
  const currentCrossroads = document.querySelector("#current-crossroads");
  const previousCrossroads = document.querySelector("#previous-crossroads");
  const previousSection = document.querySelector(".previous-section");
  const btnAdd = document.querySelector("#btnAdd");
  const btnSettings = document.querySelector("#btnSettings");
  const currentPathElement = document.querySelector("current-path");

  // Create the edit modal
  const confirmationModal = document.querySelector("confirmation-modal");
  const editCrossroadModal = document.querySelector("edit-crossroad-modal");
  const userSettingsModal = document.querySelector("user-settings-modal");

  btnAdd.addEventListener("click", evt => {
    evt.preventDefault();
    editCrossroadModal.mode = "add";
    editCrossroadModal.open();
  });

  // Settings button handler
  btnSettings.addEventListener("click", () => {
    const currentSettings = DataStore.getUserSettings();
    userSettingsModal.loadSettings(currentSettings);
    userSettingsModal.open();
  });

  // Save user settings
  userSettingsModal.addEventListener("settings-save", (evt) => {
    const settings = evt.detail.settings;
    DataStore.updateUserSettings(settings);
  });

  DataStore.init();
  ServiceWorkerManager.register();

  // Set up update notification
  const updateNotification = document.querySelector('update-notification');

  // Make ServiceWorkerManager available globally for the component
  window.serviceWorkerManager = ServiceWorkerManager;

  // Listen for service worker updates
  window.addEventListener('sw-update-available', (event) => {
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  // Handle edit modal events
  editCrossroadModal.addEventListener("crossroad-save", (evt) => {
    if (evt.detail.mode === "add") {
      DataStore.addCrossroad(evt.detail.crossroad);
    } else {
      DataStore.updateCrossroad(evt.detail.crossroad);
    }
  });

  // Listen for crossroad-summary-edit events and open the modal
  mainContents.addEventListener("crossroad-summary-edit", (evt) => {
    const crossroad = DataStore.getCrossroadById(evt.detail.id);
    if (crossroad) {
      editCrossroadModal.mode = "edit";
      editCrossroadModal.data = crossroad;
      editCrossroadModal.open();
    }
  });

  // Listen for crossroad-summary-remove events and delete the crossroad
  mainContents.addEventListener("crossroad-summary-remove", (evt) => {
    activeCrossroadId = evt.detail.id;
    confirmationAction = "deleteCrossroad";
    confirmationModal.showModal("Are you sure you want to delete this crossroad?");
  });
  confirmationModal.addEventListener("confirm", () => {
    switch (confirmationAction) {
      case "currentPathOverwrite":
        DataStore.setCurrentPath(potentialCurrentPath);
        potentialCurrentPath = null;
        break;
      case "deleteCrossroad":
        DataStore.deleteCrossroad(activeCrossroadId);
        activeCrossroadId = null;
        break;
      default:
        // no action to take otherwise
        break;
    }
  });
  confirmationModal.addEventListener("cancel", () => {
    potentialCurrentPath = null;
    activeCrossroadId = null;
    confirmationAction = null;
  });

  DataStore.addEventListener("change", evt => {
    let crossroadElement;
    switch (evt.detail.changeType) {
      case "init":
        currentPathElement.data = DataStore.getCurrentPath();
        const activeCrossroads = DataStore.crossroads.filter(crossroad => crossroad.endDate === null);
        const completedCrossroads = DataStore.crossroads.filter(crossroad => crossroad.endDate !== null);
        if (activeCrossroads?.length) {
          activeCrossroads.forEach(crossroad => {
            currentCrossroads.appendChild(crossroadSummary(crossroad));
          });
        }
        if (completedCrossroads?.length) {
          previousSection.classList.remove('u-hidden');
          completedCrossroads.forEach(crossroad => {
            previousCrossroads.appendChild(crossroadSummary(crossroad));
          });
        }
        preloaderContainer.classList.add('u-hidden');
        mainContents.classList.remove('u-hidden');
        break;
      case "add-crossroad":
        setTimeout(() => {
          window.location = `/plan/?crossroad=${evt.detail.affectedRecords.id}`;
        }, 500);
        break;
      case "update-crossroad":
        crossroadElement = currentCrossroads.querySelector(`[data-id="${evt.detail.affectedRecords.id}"]`);
        if (crossroadElement) {
          crossroadElement.data = evt.detail.affectedRecords;

          // TODO: move between current and previous sections if needed
        }
        break;
      case "delete-crossroad":
        const deleteId = Array.isArray(evt.detail.affectedRecords) 
          ? evt.detail.affectedRecords[0] 
          : evt.detail.affectedRecords.id;
        crossroadElement = currentCrossroads.querySelector(`[data-id="${deleteId}"]`);
        if (crossroadElement) {
          crossroadElement.remove();
        }
        break;
      case "set-current-path":
        currentPathElement.data = evt.detail.affectedRecords;
        break;
      case "clear-current-path":
        currentPathElement.data = null;
        break;
      default:
        // no action to take otherwise
        break;
    }
  });
});