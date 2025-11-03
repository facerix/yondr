import DataStore from '../src/DataStore.js';
import '../components/EditOptionModal.js';
import '../components/JobPath.js';
import { CurrencyClient } from '../src/currencyClient.js';
  
const whenLoaded = Promise.all(
  [
    customElements.whenDefined("edit-option-modal"),
    customElements.whenDefined("job-path"),
  ],
);

whenLoaded.then(() => {
  const btnAdd = document.querySelector("#btnAdd");
  const editOptionModal = document.querySelector("edit-option-modal");
  const url = new URL(window.location)
  const crossroadId = url.searchParams.get("crossroad");
  DataStore.init();
  window.currencyClient = new CurrencyClient();
  window.currencyClient.getExchangeRate("USD", "EUR").then(rate => {
    console.log(rate);
  });

  // DOM hooks
  const pathContainer = document.querySelector("#path-container");
  const crossroadName = document.querySelector("#crossroad-name");
  const startDate = document.querySelector("#start-date");
  const endDate = document.querySelector("#end-date");

  pathContainer.addEventListener("path-remove", evt => {
    const path = evt.detail.path;
    DataStore.deletePath(crossroadId, path.id);
    render();
  });

  const render = () => {
    pathContainer.innerHTML = "";
    const crossroad = DataStore.getCrossroadById(crossroadId);
    if (!crossroad) {
      return;
    }
    crossroadName.innerText = crossroad.name;
    startDate.innerText = crossroad.startDate;
    endDate.innerText = crossroad.endDate ?? "Present";
    crossroad.paths.forEach(path => {
      const pathElement = document.createElement("job-path");
      pathElement.data = path;
      pathContainer.append(pathElement);
    });
  }

  btnAdd.addEventListener("click", evt => {
    evt.preventDefault();
    editOptionModal.mode = "add";
    editOptionModal.open();
  });

  editOptionModal.addEventListener("option-save", evt => {
    const option = evt.detail.option;
    DataStore.addPath(crossroadId, option);
    render();
  });

  DataStore.addEventListener("change", evt => {
    switch (evt.detail.changeType) {
      case "init":
        // load crossroads and their paths
        render();
        break;
      case "add-path":
        const path = evt.detail.affectedRecords.path;
        const pathElement = document.createElement("job-path");
        pathElement.data = path;
        pathContainer.append(pathElement);
        break;
      // case "update":
      //   idea = evt.detail.affectedRecords;
      //   render();
      //   break;
      // case "delete":
      //   window.location = `/collection/?id=${DataStore.collectionId}`;
      //   break;
      default:
        // no action to take otherwise
        break;
    }
  });

});