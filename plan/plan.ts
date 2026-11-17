import DataStore from '../src/DataStore.js';
import '../components/EditOptionModal.js';
import '../components/JobPath.js';
import RadioGroup from '../components/RadioGroup.js';
import '../components/UserSettingsModal.js';
import { CurrencyClient } from '../src/currencyClient.js';
import { compareJob, type LivingModeType, type RangeModeType } from '../src/jobComparison.js';
import { arrangePlanPaths, isClosedStatus, type JobPathType } from '../src/jobPathModel.js';
  
const whenLoaded = Promise.all(
  [
    customElements.whenDefined("edit-option-modal"),
    customElements.whenDefined("job-path"),
    customElements.whenDefined("radio-group"),
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
  const closedSection = document.querySelector<HTMLElement>("#closed-section");
  const closedPathContainer = document.querySelector("#closed-path-container");
  const noOptionsMessage = document.querySelector<HTMLElement>("#no-options-message");
  const crossroadName = document.querySelector("#crossroad-name");
  const showCurrentMode = document.querySelector<HTMLInputElement>("#show-current");
  const rangeMode = document.querySelector<HTMLSelectElement>("#range-mode");
  const livingMode = document.querySelector<RadioGroup>("#living-mode");
  const comparisonHint = document.querySelector("#comparison-hint");
  showCurrentMode.addEventListener("change", () => render());
  rangeMode.addEventListener("change", () => render());
  livingMode.addEventListener("change", () => render());
  const startDate = document.querySelector("#start-date");
  const endDate = document.querySelector("#end-date");

  // Card events bubble from both the ranked and closed sections.
  const pathsRegion = document.querySelector("#paths-region");

  pathsRegion.addEventListener("path-remove", async (evt) => {
    const path = (evt as CustomEvent).detail.path;
    DataStore.deletePath(crossroadId, path.id);
    await render();
  });

  pathsRegion.addEventListener("path-edit", evt => {
    const path = (evt as CustomEvent).detail.path;
    editOptionModal.mode = "edit";
    editOptionModal.data = path;
    editOptionModal.open();
  });

  pathsRegion.addEventListener('timeline-add', evt => {
    DataStore.addTimelineEntry(crossroadId, (evt as CustomEvent).detail.pathId, (evt as CustomEvent).detail.entry);
    render();
  });
  pathsRegion.addEventListener('timeline-update', evt => {
    DataStore.updateTimelineEntry(crossroadId, (evt as CustomEvent).detail.pathId, (evt as CustomEvent).detail.entry);
    render();
  });
  pathsRegion.addEventListener('timeline-delete', evt => {
    DataStore.deleteTimelineEntry(crossroadId, (evt as CustomEvent).detail.pathId, (evt as CustomEvent).detail.entryId);
    render();
  });

  async function calculateComparisons(allPaths: JobPathType[], rankedPaths: JobPathType[]) {
    const settings = DataStore.getUserSettings();
    const comparisonSettings = {
      rangeMode: rangeMode.value as RangeModeType,
      livingMode: livingMode.value as LivingModeType,
    };
    const currencyClient = new CurrencyClient();
    const comparisons = await Promise.all(allPaths.map(path => compareJob(path, settings, comparisonSettings, currencyClient)));
    await Promise.all(comparisons.map(async (item, index) => {
      if (!item) return;
      const currency = allPaths[index].currency || 'USD';
      const rate = currency === 'USD' ? 1 : await currencyClient.getExchangeRate(currency, 'USD');
      item.referenceCompensation = item.compensation * rate;
      item.referenceBottomLine = item.bottomLine == null ? null : item.bottomLine * rate;
    }));
    const comparisonsById = new Map(allPaths.map((path, index) => [path.id, comparisons[index]]));
    // Bar scales and the best badge reflect only ranked (open) jobs.
    const rankedComparisons = rankedPaths.map(path => comparisonsById.get(path.id));
    const maxCompensation = Math.max(0, ...rankedComparisons.map(item => item?.referenceCompensation ?? 0));
    const maxBottomLine = Math.max(0, ...rankedComparisons.map(item => item?.referenceBottomLine ?? 0));
    const bestBottomLinePaths = new Set();
    rankedComparisons.forEach((item, index) => {
      if (item?.referenceBottomLine != null && item.referenceBottomLine === maxBottomLine && maxBottomLine > 0) {
        bestBottomLinePaths.add(rankedPaths[index].id);
      }
    });
    return { comparisons: comparisonsById, maxCompensation, maxBottomLine, bestBottomLinePaths };
  }

  const render = async () => {
    pathContainer.innerHTML = "";
    closedPathContainer.innerHTML = "";
    const crossroad = DataStore.getCrossroadById(crossroadId);
    if (!crossroad) {
      return;
    }
    crossroadName.textContent = crossroad.name;
    startDate.textContent = crossroad.startDate;
    endDate.textContent = crossroad.endDate ?? "Present";
    
    // The current path (if any) sits in the same flat list as the options as its
    // first card, so every option can be compared side by side.
    const currentPath = DataStore.getCurrentPath();
    const showCurrent = !!showCurrentMode.checked;
    const allPaths: JobPathType[] = currentPath && showCurrent ? [currentPath, ...crossroad.paths] : crossroad.paths;

    const openPaths = allPaths.filter(path => !isClosedStatus(path.status));
    const { comparisons, maxCompensation, maxBottomLine, bestBottomLinePaths } = await calculateComparisons(allPaths, openPaths);
    // Rank by USD-normalized bottom line so mixed currencies compare fairly.
    const { active, inactive } = arrangePlanPaths(allPaths, path => comparisons.get(path.id)?.referenceBottomLine);
    const settings = DataStore.getUserSettings();
    comparisonHint.textContent = livingMode.value === 'commute'
      ? `Using current living costs${settings.currentLocation ? ` in ${settings.currentLocation}` : ''}. ${settings.currentLocationCostOfLivingSpend == null ? 'Set current living costs in settings to see bottom lines.' : ''}`
      : 'Using each job location’s estimated living costs. Missing estimates show no bottom line.';

    const createPathElement = (path: JobPathType) => {
      const isCurrent = path === currentPath;
      const pathElement = document.createElement("job-path");
      // Set max values before pathData to avoid rendering with incorrect defaults
      pathElement.comparison = comparisons.get(path.id);
      pathElement.maxCompensation = maxCompensation;
      pathElement.maxBottomLine = maxBottomLine;
      pathElement.pathData = path;
      pathElement.isCurrent = isCurrent;
      pathElement.readonly = isCurrent;
      pathElement.hasBestBottomLine = bestBottomLinePaths.has(path.id);
      return pathElement;
    };
    pathContainer.append(...active.map(createPathElement));
    closedPathContainer.append(...inactive.map(createPathElement));
    closedSection.hidden = inactive.length === 0;
    noOptionsMessage.hidden = crossroad.paths.length > 0;
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
