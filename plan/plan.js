import DataStore from '../src/DataStore.js';
import '../components/EditOptionModal.js';
import '../components/JobPath.js';
import '../components/UserSettingsModal.js';
import { CurrencyClient } from '../src/currencyClient.js';
  
const whenLoaded = Promise.all(
  [
    customElements.whenDefined("edit-option-modal"),
    customElements.whenDefined("job-path"),
    customElements.whenDefined("user-settings-modal"),
  ],
);

whenLoaded.then(() => {
  const btnAdd = document.querySelector("#btnAdd");
  const btnSettings = document.querySelector("#btnSettings");
  const editOptionModal = document.querySelector("edit-option-modal");
  const userSettingsModal = document.querySelector("user-settings-modal");
  const url = new URL(window.location)
  const crossroadId = url.searchParams.get("crossroad");
  DataStore.init();
  window.currencyClient = new CurrencyClient();
  window.currencyClient.getExchangeRate("USD", "EUR").then(rate => {
    console.log(rate);
  });

  // Load user settings into modal
  const userSettings = DataStore.getUserSettings();
  userSettingsModal.loadSettings(userSettings);

  // Settings button handler
  btnSettings.addEventListener("click", () => {
    const currentSettings = DataStore.getUserSettings();
    userSettingsModal.loadSettings(currentSettings);
    userSettingsModal.open();
  });

  // Save user settings
  userSettingsModal.addEventListener("settings-save", async (evt) => {
    const settings = evt.detail.settings;
    DataStore.updateUserSettings(settings);
    // Re-render paths to update with new fixed expenses
    await render();
  });

  // DOM hooks
  const pathContainer = document.querySelector("#path-container");
  const crossroadName = document.querySelector("#crossroad-name");
  const startDate = document.querySelector("#start-date");
  const endDate = document.querySelector("#end-date");

  pathContainer.addEventListener("path-remove", async (evt) => {
    const path = evt.detail.path;
    DataStore.deletePath(crossroadId, path.id);
    await render();
  });

  pathContainer.addEventListener("path-edit", evt => {
    const path = evt.detail.path;
    editOptionModal.mode = "edit";
    editOptionModal.data = path;
    editOptionModal.open();
  });

  // Calculate max compensation and max bottom line across all paths
  async function calculateMaxValues(allPaths) {
    const currencyClient = new CurrencyClient();
    const userSettings = DataStore.getUserSettings();
    const fixedExpenses = parseFloat(userSettings.fixedExpenses) || 0;
    const fixedExpensesCurrency = userSettings.fixedExpensesCurrency || "USD";
    
    // Calculate all compensations (baseSalary + bonuses)
    const allCompensations = allPaths.map(p => {
      const bs = parseFloat(p.baseSalary) || 0;
      const bn = parseFloat(p.bonuses) || 0;
      return bs + bn;
    });
    const maxCompensation = Math.max(...allCompensations, 0);
    
    // Calculate all bottom lines (requires async currency conversion)
    const allBottomLines = await Promise.all(allPaths.map(async (p) => {
      const yn = parseFloat(p.yearNetIncome) || 0;
      if (yn > 0) {
        return yn;
      }
      // Need to convert fixed expenses for each path's currency
      const pathCurrency = p.currency || "USD";
      let pathConvertedExpenses = fixedExpenses;
      if (fixedExpensesCurrency !== pathCurrency && fixedExpenses > 0) {
        try {
          const exchangeRate = await currencyClient.getExchangeRate(fixedExpensesCurrency, pathCurrency);
          pathConvertedExpenses = fixedExpenses * exchangeRate;
        } catch (error) {
          console.error(`Error converting fixed expenses for path ${p.name}:`, error);
          pathConvertedExpenses = fixedExpenses;
        }
      }
      const pathCompensation = (parseFloat(p.baseSalary) || 0) + (parseFloat(p.bonuses) || 0);
      return Math.max(0, pathCompensation - pathConvertedExpenses);
    }));
    const maxBottomLine = Math.max(...allBottomLines, 0);
    
    // Find the path ID(s) with the best bottom line
    const bestBottomLinePaths = new Set();
    allBottomLines.forEach((bottomLine, index) => {
      if (bottomLine === maxBottomLine && maxBottomLine > 0) {
        bestBottomLinePaths.add(allPaths[index].id);
      }
    });
    
    return { maxCompensation, maxBottomLine, bestBottomLinePaths };
  }

  const render = async () => {
    pathContainer.innerHTML = "";
    const crossroad = DataStore.getCrossroadById(crossroadId);
    if (!crossroad) {
      return;
    }
    crossroadName.innerText = crossroad.name;
    startDate.innerText = crossroad.startDate;
    endDate.innerText = crossroad.endDate ?? "Present";
    
    // Show current path first, if it exists
    const currentPath = DataStore.getCurrentPath();
    // Include current path in allPaths for comparison
    const allPaths = currentPath ? [currentPath, ...crossroad.paths] : crossroad.paths;
    
    // Calculate max values once for all paths
    const { maxCompensation, maxBottomLine, bestBottomLinePaths } = await calculateMaxValues(allPaths);
    
    if (currentPath) {
      const currentPathElement = document.createElement("job-path");
      // Set max values before pathData to avoid rendering with incorrect defaults
      currentPathElement.maxCompensation = maxCompensation;
      currentPathElement.maxBottomLine = maxBottomLine;
      currentPathElement.pathData = currentPath;
      currentPathElement.isCurrent = true;
      currentPathElement.readonly = true;
      currentPathElement.hasBestBottomLine = bestBottomLinePaths.has(currentPath.id);
      pathContainer.append(currentPathElement);
    }
    
    // Show all explicitly added paths
    crossroad.paths.forEach(path => {
      const pathElement = document.createElement("job-path");
      // Set max values before pathData to avoid rendering with incorrect defaults
      pathElement.maxCompensation = maxCompensation;
      pathElement.maxBottomLine = maxBottomLine;
      pathElement.pathData = path;
      // Check if this path is the current path by comparing IDs
      pathElement.isCurrent = currentPath && path.id === currentPath.id;
      pathElement.hasBestBottomLine = bestBottomLinePaths.has(path.id);
      pathContainer.append(pathElement);
    });
  }

  btnAdd.addEventListener("click", evt => {
    evt.preventDefault();
    editOptionModal.mode = "add";
    editOptionModal.open();
  });

  editOptionModal.addEventListener("option-save", async (evt) => {
    const option = evt.detail.option;
    if (option.id && DataStore.getCrossroadById(crossroadId)?.paths.some(p => p.id === option.id)) {
      // Update existing path
      DataStore.updatePath(crossroadId, option);
    } else {
      // Add new path
      DataStore.addPath(crossroadId, option);
    }
    await render();
  });

  DataStore.addEventListener("change", async (evt) => {
    switch (evt.detail.changeType) {
      case "init":
        // load crossroads and their paths
        await render();
        break;
      case "add-path":
        await render();
        break;
      case "update-user-settings":
        // Re-render paths when user settings change (affects fixed expenses)
        await render();
        break;
      // case "update":
      //   idea = evt.detail.affectedRecords;
      //   await render();
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