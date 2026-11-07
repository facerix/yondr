import DataStore from '../src/DataStore.js';
import '../components/EditOptionModal.js';
import '../components/JobPath.js';
import '../components/UserSettingsModal.js';
import { CurrencyClient } from '../src/currencyClient.js';
import { compareJob } from '../src/jobComparison.js';
  
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
  const url = new URL(window.location.href)
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
  userSettingsModal.addEventListener("settings-save", (evt) => {
    const settings = (evt as CustomEvent).detail.settings;
    DataStore.updateUserSettings(settings);
  });

  // DOM hooks
  const pathContainer = document.querySelector("#path-container");
  const crossroadName = document.querySelector("#crossroad-name");
  const rangeMode = document.querySelector<HTMLSelectElement>("#range-mode");
  const livingMode = document.querySelector<HTMLSelectElement>("#living-mode");
  const comparisonHint = document.querySelector("#comparison-hint");
  rangeMode.addEventListener("change", () => render());
  livingMode.addEventListener("change", () => render());
  const startDate = document.querySelector("#start-date");
  const endDate = document.querySelector("#end-date");

  pathContainer.addEventListener("path-remove", async (evt) => {
    const path = (evt as CustomEvent).detail.path;
    DataStore.deletePath(crossroadId, path.id);
    await render();
  });

  pathContainer.addEventListener("path-edit", evt => {
    const path = (evt as CustomEvent).detail.path;
    editOptionModal.mode = "edit";
    editOptionModal.data = path;
    editOptionModal.open();
  });

  pathContainer.addEventListener('timeline-add', evt => {
    DataStore.addTimelineEntry(crossroadId, (evt as CustomEvent).detail.pathId, (evt as CustomEvent).detail.entry);
    render();
  });
  pathContainer.addEventListener('timeline-update', evt => {
    DataStore.updateTimelineEntry(crossroadId, (evt as CustomEvent).detail.pathId, (evt as CustomEvent).detail.entry);
    render();
  });
  pathContainer.addEventListener('timeline-delete', evt => {
    DataStore.deleteTimelineEntry(crossroadId, (evt as CustomEvent).detail.pathId, (evt as CustomEvent).detail.entryId);
    render();
  });

  async function calculateComparisons(allPaths) {
    const settings = DataStore.getUserSettings();
    const currencyClient = new CurrencyClient();
    const comparisons = await Promise.all(allPaths.map(path => compareJob(path, settings, {
      rangeMode: rangeMode.value, livingMode: livingMode.value,
    }, currencyClient)));
    await Promise.all(comparisons.map(async (item, index) => {
      if (!item) return;
      const currency = allPaths[index].currency || 'USD';
      const rate = currency === 'USD' ? 1 : await currencyClient.getExchangeRate(currency, 'USD');
      item.referenceCompensation = item.compensation * rate;
      item.referenceBottomLine = item.bottomLine == null ? null : item.bottomLine * rate;
    }));
    const maxCompensation = Math.max(0, ...comparisons.map(item => item?.referenceCompensation ?? 0));
    const maxBottomLine = Math.max(0, ...comparisons.map(item => item?.referenceBottomLine ?? 0));
    const bestBottomLinePaths = new Set();
    comparisons.forEach((item, index) => {
      if (item?.referenceBottomLine != null && item.referenceBottomLine === maxBottomLine && maxBottomLine > 0) {
        bestBottomLinePaths.add(allPaths[index].id);
      }
    });
    return { comparisons: new Map(allPaths.map((path, index) => [path.id, comparisons[index]])), maxCompensation, maxBottomLine, bestBottomLinePaths };
  }

  const render = async () => {
    pathContainer.innerHTML = "";
    const crossroad = DataStore.getCrossroadById(crossroadId);
    if (!crossroad) {
      return;
    }
    crossroadName.textContent = crossroad.name;
    startDate.textContent = crossroad.startDate;
    endDate.textContent = crossroad.endDate ?? "Present";
    
    // Show current path first, if it exists
    const currentPath = DataStore.getCurrentPath();
    // Include current path in allPaths for comparison
    const allPaths = currentPath ? [currentPath, ...crossroad.paths] : crossroad.paths;
    
    // Calculate max values once for all paths
    const { comparisons, maxCompensation, maxBottomLine, bestBottomLinePaths } = await calculateComparisons(allPaths);
    const settings = DataStore.getUserSettings();
    comparisonHint.textContent = livingMode.value === 'commute'
      ? `Using current living costs${settings.currentLocation ? ` in ${settings.currentLocation}` : ''}. ${settings.currentLocationCostOfLivingSpend == null ? 'Set current living costs in settings to see bottom lines.' : ''}`
      : 'Using each job location’s estimated living costs. Missing estimates show no bottom line.';
    
    if (currentPath) {
      const currentPathElement = document.createElement("job-path");
      // Set max values before pathData to avoid rendering with incorrect defaults
      currentPathElement.comparison = comparisons.get(currentPath.id);
      currentPathElement.maxCompensation = maxCompensation;
      currentPathElement.maxBottomLine = maxBottomLine;
      currentPathElement.pathData = currentPath;
      currentPathElement.isCurrent = true;
      currentPathElement.readonly = true;
      currentPathElement.hasBestBottomLine = bestBottomLinePaths.has(currentPath.id);
      pathContainer.append(currentPathElement);
    }
    
    // Group paths by place while preserving the first-seen order.
    const groups = new Map();
    crossroad.paths.forEach(path => {
      const key = (path.location || '').trim().toLocaleLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(path);
    });
    groups.forEach(paths => {
      const section = document.createElement('section');
      section.className = 'location-group';
      const heading = document.createElement('h3');
      heading.textContent = paths[0].location || 'Location not specified';
      const cards = document.createElement('div');
      cards.className = 'location-cards';
      section.append(heading, cards);
      pathContainer.append(section);
      paths.forEach(path => {
        const pathElement = document.createElement("job-path");
        pathElement.comparison = comparisons.get(path.id);
        pathElement.maxCompensation = maxCompensation;
        pathElement.maxBottomLine = maxBottomLine;
        pathElement.pathData = path;
        pathElement.isCurrent = currentPath && path.id === currentPath.id;
        pathElement.hasBestBottomLine = bestBottomLinePaths.has(path.id);
        cards.append(pathElement);
      });
      const addHere = document.createElement('button');
      addHere.type = 'button';
      addHere.className = 'btn add-here';
      addHere.textContent = 'Add another job here';
      addHere.addEventListener('click', () => {
        editOptionModal.mode = 'add';
        editOptionModal.prefillLocation(paths[0]);
        editOptionModal.open();
      });
      section.append(addHere);
    });
  }

  btnAdd.addEventListener("click", evt => {
    evt.preventDefault();
    editOptionModal.mode = "add";
    editOptionModal.open();
  });

  editOptionModal.addEventListener("option-save", async (evt) => {
    const option = (evt as CustomEvent).detail.option;
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
    switch ((evt as CustomEvent).detail.changeType) {
      case "init":
        // load crossroads and their paths
        await render();
        break;
      case "update-user-settings":
        // Re-render paths when user settings change (affects fixed expenses)
        await render();
        break;
      // case "update":
      //   idea = (evt as CustomEvent).detail.affectedRecords;
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
