// singleton class to manage the user's data

import { v4WithTimestamp } from "./uuid.js";
import { normalizePath, validateJobPath } from "./jobPathModel.js";

const normalizeCrossroad = (crossroad) => {
  const normalizedCrossroad = {
    ...crossroad,
  };
  if (!normalizedCrossroad.id) {
    normalizedCrossroad.id = v4WithTimestamp();
  }
  normalizedCrossroad.paths?.forEach((path, pathIndex) => {
    if (!path.id) {
      normalizedCrossroad.paths[pathIndex].id = v4WithTimestamp();
    }
    normalizedCrossroad.paths[pathIndex] = normalizePath(normalizedCrossroad.paths[pathIndex]);
  });
  return normalizedCrossroad;
}

let instance;
class DataStore extends EventTarget {
  #crossroads = [];
  #crossroadsById = new Map(); // map from uuid to crossroad object
  #currentPath = null;
  #userSettings = null;

  constructor() {
    if (instance) {
      throw new Error("New instance cannot be created!!");
    }
    super();

    instance = this;
  }

  #loadRecordsFromJson(json) {
    const crossroads = JSON.parse(json);
    crossroads.forEach((crossroad, index) => {
      // normalize crossroad (add expected fields)
      crossroads[index] = normalizeCrossroad(crossroad);
    });
    return crossroads;
  }

  // if we eventually allow other storage besides local (i.e. DB, cloud, etc), this will need to be more robust;
  // for now, just load the records from localStorage or set it up if not yet set
  async init() {
    let savedCrossroadsJson = window.localStorage.getItem("crossroads");
    if (!savedCrossroadsJson) {
      savedCrossroadsJson = "[]";
      window.localStorage.setItem("crossroads", savedCrossroadsJson);
    }
    this.#crossroads = this.#loadRecordsFromJson(savedCrossroadsJson);
    this.#currentPath = JSON.parse(window.localStorage.getItem("currentPath")) || null;
    this.#loadUserSettings();
    this.#reindex();

    setTimeout(() => {
      this.#emitChangeEvent("init", ["*"]);
    }, 0);
  }

  import(jsonData) {
    const newCrossroads = this.#loadRecordsFromJson(jsonData);
    Array.prototype.unshift.apply(this.#crossroads, newCrossroads);
    this.#reindex();

    setTimeout(() => {
      this.#emitChangeEvent("init", ["*"]);
    }, 0);
  }

  #saveCrossroads() {
    window.localStorage.setItem("crossroads", JSON.stringify(this.#crossroads));
  }

  #saveUserSettings() {
    window.localStorage.setItem("userSettings", JSON.stringify(this.#userSettings));
  }

  #loadUserSettings() {
    const saved = window.localStorage.getItem("userSettings");
    if (saved) {
      try {
        this.#userSettings = JSON.parse(saved);
      } catch (e) {
        console.error("Error loading user settings:", e);
        this.#userSettings = this.#getDefaultUserSettings();
      }
    } else {
      this.#userSettings = this.#getDefaultUserSettings();
    }
  }

  #getDefaultUserSettings() {
    return {
      fixedExpenses: 0,
      fixedExpensesCurrency: "USD",
      citizenship: null,
      taxFilingStatus: "single",
      currentLocation: null,
      currentLocationCurrency: "USD",
      currentLocationCostOfLiving: null,
      currentLocationCostOfLivingSpend: null // e.g., rent, food
    };
  }

  #emitChangeEvent(changeType, affectedRecords) {
    const changeEvent = new CustomEvent("change", {
      detail: {
        crossroads: this.#crossroads,
        changeType,
        affectedRecords
      },
    });
    this.dispatchEvent(changeEvent);
  }

  #reindex() {
    this.#crossroadsById = new Map();
    this.#crossroads.forEach(crossroad => {
      this.#crossroadsById.set(crossroad.id, crossroad);
    });
    this.#saveCrossroads();
  }

  get crossroads() {
    return this.#crossroads;
  }

  getCrossroadById(id) {
    return this.#crossroadsById.get(id);
  }

  getPathById(pathId) {
    for (const crossroad of this.#crossroads) {
      const path = crossroad.paths?.find(p => p.id === pathId);
      if (path) return path;
    }
    return null;
  }

  setCurrentPath(path) {
    this.#currentPath = path;
    window.localStorage.setItem("currentPath", JSON.stringify(path));
    this.#emitChangeEvent("set-current-path", path);
  }

  getCurrentPath() {
    return this.#currentPath;
  }

  clearCurrentPath() {
    this.#currentPath = null;
    window.localStorage.removeItem("currentPath");
    this.#emitChangeEvent("clear-current-path", null);
  }

  addCrossroad(crossroad) {
    const newCrossroad = {
      ...crossroad,
      id: v4WithTimestamp(),
      paths: crossroad.paths || [],
    };
    this.#crossroads.unshift(newCrossroad);
    this.#reindex();
    this.#emitChangeEvent("add-crossroad", newCrossroad);
  }

  updateCrossroad(crossroad) {
    const index = this.#crossroads.findIndex(cr => cr.id === crossroad.id);
    if (index > -1) {
      this.#crossroads[index] = crossroad;
      this.#reindex();
      this.#emitChangeEvent("update-crossroad", crossroad);
    }
  }

  deleteCrossroad(id) {
    if (this.#crossroadsById.has(id)) {
      this.#crossroads = this.#crossroads.filter(cr => cr.id !== id);
      this.#reindex();
      this.#emitChangeEvent("delete-crossroad", [id]);
    }
  }

  addPath(crossroadId, path) {
    const crossroad = this.getCrossroadById(crossroadId);
    if (crossroad) {
      const newPath = normalizePath({ ...validateJobPath(path), id: v4WithTimestamp() });
      crossroad.paths.unshift(newPath);
      this.#reindex();
      this.#emitChangeEvent("add-path", { crossroadId, path: newPath });
    }
  }

  updatePath(crossroadId, path) {
    const crossroad = this.getCrossroadById(crossroadId);
    if (crossroad) {
      const pathIndex = crossroad.paths.findIndex(p => p.id === path.id);
      if (pathIndex > -1) {
        const current = crossroad.paths[pathIndex];
        crossroad.paths[pathIndex] = normalizePath(validateJobPath({ ...current, ...path, timeline: path.timeline ?? current.timeline }));
        this.#reindex();
        this.#emitChangeEvent("update-path", { crossroadId, path: crossroad.paths[pathIndex] });
      }
    }
  }

  deletePath(crossroadId, pathId) {
    const crossroad = this.getCrossroadById(crossroadId);
    if (crossroad) {
      crossroad.paths = crossroad.paths.filter(p => p.id !== pathId);
      this.#reindex();
      this.#emitChangeEvent("delete-path", { crossroadId, pathId });
    }
  }

  #getRequiredPath(crossroadId, pathId) {
    const path = this.getCrossroadById(crossroadId)?.paths.find(item => item.id === pathId);
    if (!path) throw new Error(`Path ${pathId} was not found in crossroad ${crossroadId}.`);
    return path;
  }

  addTimelineEntry(crossroadId, pathId, entry) {
    const path = this.#getRequiredPath(crossroadId, pathId);
    this.updatePath(crossroadId, { ...path, timeline: [...path.timeline, { ...entry, id: v4WithTimestamp() }] });
  }

  updateTimelineEntry(crossroadId, pathId, entry) {
    const path = this.#getRequiredPath(crossroadId, pathId);
    if (!path.timeline.some(item => item.id === entry.id)) throw new Error(`Timeline entry ${entry.id} was not found.`);
    this.updatePath(crossroadId, { ...path, timeline: path.timeline.map(item => item.id === entry.id ? entry : item) });
  }

  deleteTimelineEntry(crossroadId, pathId, entryId) {
    const path = this.#getRequiredPath(crossroadId, pathId);
    if (!path.timeline.some(item => item.id === entryId)) throw new Error(`Timeline entry ${entryId} was not found.`);
    this.updatePath(crossroadId, { ...path, timeline: path.timeline.filter(item => item.id !== entryId) });
  }

  getUserSettings() {
    return { ...this.#userSettings };
  }

  updateUserSettings(settings) {
    this.#userSettings = { ...this.#userSettings, ...settings };
    this.#saveUserSettings();
    this.#emitChangeEvent("update-user-settings", settings);
  }
}

const singleton = Object.freeze(new DataStore());

export default singleton;
