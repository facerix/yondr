/* web component for location, cost of living, and currency input group */

import { CensusClient } from "../src/censusClient.js";
import { lookupCostOfLiving } from "../src/costOfLivingData.js";

const CSS = `
:host {
  --primary-color: #7c0028;
  --border-color: rgba(124, 0, 40, 0.2);
  --focus-color: rgba(124, 0, 40, 0.5);
}

.form-group-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;
  width: 100%;
  width: -webkit-fill-available;
}

.form-group {
  margin-bottom: 1.5em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;

  label {
    font-weight: 500;
    color: var(--primary-color);
    font-size: 0.95em;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  input[type="text"],
  input[type="number"],
  select {
    padding: 0.75em;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1em;
    font-family: inherit;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: rgba(124, 0, 40, 0.4);
    }

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(124, 0, 40, 0.1);
    }
  }
}

.flex-1 {
  flex: 1;
}

.input-wrapper {
  position: relative;

  input {
    width: 100%;
    width: -webkit-fill-available;
  }
}

.input-wrapper .loading-spinner {
  position: absolute;
  top: 0.75rem;
  right: 0.5em;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  pointer-events: none;
  visibility: hidden;
}

.input-wrapper .loading-spinner.visible {
  opacity: 1;
  visibility: visible;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.input-wrapper input[disabled] {
  padding-right: 2.5em;
}

.label-with-hint {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.hint-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  cursor: help;
  position: relative;
  color: var(--primary-color);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.hint-icon:hover,
.hint-icon:focus-visible {
  opacity: 1;
  outline: none;
}

.hint-icon:focus-visible {
  outline: 2px double var(--primary-color);
  outline-offset: 2px;
  border-radius: 2px;
}

.hint-icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.hint-popover {
  position: absolute;
  bottom: calc(100% + 0.5em);
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-color);
  color: white;
  padding: 0.75em 1em;
  border-radius: 4px;
  font-size: 0.875em;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.hint-popover::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--primary-color);
}

.hint-icon:hover .hint-popover,
.hint-icon:focus-visible .hint-popover {
  opacity: 1;
  visibility: visible;
}
`;

const TEMPLATE = `
  <div class="form-group-row">
    <div class="form-group flex-1">
      <label for="location">Location</label>
      <input type="text" id="location" required />
    </div>

    <div class="form-group">
      <label for="costOfLiving" class="label-with-hint">
        Cost of Living Index
        <span class="hint-icon" tabindex="0" role="button" aria-label="Cost of living index explanation">
          <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
          <span class="hint-popover">NYC has a cost of living index of 100</span>
        </span>
      </label>
      <div class="input-wrapper">
        <input type="number" step="0.1" min="0" id="costOfLiving" autocomplete="off" placeholder="Auto-filled from location" />
        <div class="loading-spinner" id="costOfLivingSpinner"></div>
      </div>
    </div>

    <div class="form-group">
      <label for="currency">Currency</label>
      <select id="currency" required>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="CAD">CAD</option>
        <option value="AUD">AUD</option>
        <option value="NZD">NZD</option>
        <option value="CHF">CHF</option>
        <option value="JPY">JPY</option>
        <option value="SGD">SGD</option>
        <option value="HKD">HKD</option>
        <option value="DKK">DKK</option>
        <option value="SEK">SEK</option>
        <option value="NOK">NOK</option>
      </select>
    </div>
  </div>
`;

class LocationInputGroup extends HTMLElement {
  #location = null;
  #costOfLiving = null;
  #currency = null;
  #censusClient = null;
  #isFetchingCostOfLiving = false;
  #boundHandleLocationChange = null;

  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    styles.innerHTML = CSS;
    shadow.appendChild(styles);

    const container = document.createElement("div");
    container.innerHTML = TEMPLATE;
    shadow.appendChild(container);

    this.#init();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #init() {
    // Initialize Census client for US cities
    this.#censusClient = new CensusClient();

    const locationInput = this.shadowRoot.querySelector("#location");
    this.#boundHandleLocationChange = this.#handleLocationChange.bind(this);

    // Auto-fetch cost of living when location changes (with debounce)
    let locationTimeout;
    locationInput.addEventListener("input", () => {
      clearTimeout(locationTimeout);
      locationTimeout = setTimeout(() => {
        this.#boundHandleLocationChange();
      }, 1000); // Wait 1 second after user stops typing
    });

    // Track manual entry for cost of living
    const costOfLivingInput = this.shadowRoot.querySelector("#costOfLiving");
    costOfLivingInput.addEventListener("input", () => {
      if (costOfLivingInput.value) {
        costOfLivingInput.dataset.manualEntry = "true";
      }
    });

    // Emit change events when values change
    locationInput.addEventListener("input", () => {
      this.#emitChange();
    });
    costOfLivingInput.addEventListener("input", () => {
      this.#emitChange();
    });
    const currencyInput = this.shadowRoot.querySelector("#currency");
    currencyInput.addEventListener("change", () => {
      this.#emitChange();
    });

    // Populate initial values if set
    this.#populateFields();
  }

  #cleanup() {
    // Cleanup if needed
  }

  async #handleLocationChange() {
    const locationInput = this.shadowRoot.querySelector("#location");
    const costOfLivingInput = this.shadowRoot.querySelector("#costOfLiving");
    const location = locationInput.value.trim();

    if (!location || this.#isFetchingCostOfLiving) {
      return;
    }

    // Only fetch if cost of living field is empty or user hasn't manually entered a value
    if (costOfLivingInput.value && costOfLivingInput.dataset.manualEntry === "true") {
      return;
    }

    this.#isFetchingCostOfLiving = true;
    costOfLivingInput.value = "";
    costOfLivingInput.placeholder = "Looking up...";
    costOfLivingInput.disabled = true;
    
    // Show loading spinner
    const spinner = this.shadowRoot.querySelector("#costOfLivingSpinner");
    if (spinner) {
      spinner.classList.add("visible");
    }

    try {
      // First, try static dataset (fast, works offline)
      let costOfLivingResult = lookupCostOfLiving(location);
      let costOfLivingIndex = costOfLivingResult ? costOfLivingResult.index : null;
      let canonicalCity = costOfLivingResult ? costOfLivingResult.city : null;
      let currency = costOfLivingResult ? costOfLivingResult.currency : null;
      
      // If not found in static dataset and it looks like a US city, try Census API
      if (!costOfLivingIndex && location.includes(',')) {
        const locationParts = location.split(',').map(s => s.trim());
        // Check if it looks like a US location (has 2-letter state code or US state name)
        const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
        const statePart = locationParts[1]?.toUpperCase();
        
        if (statePart && (usStates.includes(statePart) || statePart.length === 2)) {
          try {
            const censusData = await this.#censusClient.getCostOfLiving(location);
            if (censusData && censusData.costOfLivingIndex !== null) {
              costOfLivingIndex = censusData.costOfLivingIndex;
              // Assume USD for US cities from Census API
              if (!currency) currency = "USD";
            }
          } catch (error) {
            // Census API not available or failed, continue with static dataset result
            console.debug('Census API not available:', error);
          }
        }
      }
      
      if (costOfLivingIndex !== null) {
        costOfLivingInput.value = costOfLivingIndex.toFixed(1);
        costOfLivingInput.placeholder = "Auto-filled from database";
        costOfLivingInput.dataset.manualEntry = "false";
        
        // Autocomplete location field with canonical city name if we found a match
        if (canonicalCity && canonicalCity.toLowerCase() !== location.toLowerCase()) {
          locationInput.value = canonicalCity;
        }
        
        // Auto-update currency field if we found a match and currency is available
        if (currency) {
          const currencyInput = this.shadowRoot.querySelector("#currency");
          const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF", "JPY", "SGD", "HKD", "DKK", "SEK", "NOK"];
          if (supportedCurrencies.includes(currency)) {
            currencyInput.value = currency;
          } else {
            console.debug(`Currency ${currency} not in dropdown, keeping current selection`);
          }
        }
      } else {
        costOfLivingInput.placeholder = "Not found - enter manually";
      }
    } catch (error) {
      console.error("Error fetching cost of living:", error);
      costOfLivingInput.placeholder = "Error - enter manually";
    } finally {
      this.#isFetchingCostOfLiving = false;
      costOfLivingInput.disabled = false;
      
      // Hide loading spinner
      const spinner = this.shadowRoot.querySelector("#costOfLivingSpinner");
      if (spinner) {
        spinner.classList.remove("visible");
      }
    }

    this.#emitChange();
  }

  #emitChange() {
    const locationInput = this.shadowRoot.querySelector("#location");
    const costOfLivingInput = this.shadowRoot.querySelector("#costOfLiving");
    const currencyInput = this.shadowRoot.querySelector("#currency");

    this.dispatchEvent(new CustomEvent("location-change", {
      detail: {
        location: locationInput.value,
        costOfLiving: costOfLivingInput.value,
        currency: currencyInput.value
      },
      bubbles: true,
      composed: true
    }));
  }

  #populateFields() {
    const locationInput = this.shadowRoot.querySelector("#location");
    const costOfLivingInput = this.shadowRoot.querySelector("#costOfLiving");
    const currencyInput = this.shadowRoot.querySelector("#currency");

    if (locationInput && this.#location !== null) {
      locationInput.value = this.#location;
    }
    if (costOfLivingInput && this.#costOfLiving !== null) {
      costOfLivingInput.value = this.#costOfLiving;
      costOfLivingInput.dataset.manualEntry = this.#costOfLiving ? "true" : "false";
      costOfLivingInput.placeholder = "Auto-filled from location";
    }
    if (currencyInput && this.#currency !== null) {
      currencyInput.value = this.#currency;
    }
  }

  // Getters for form data
  get location() {
    const locationInput = this.shadowRoot?.querySelector("#location");
    return locationInput ? locationInput.value : this.#location;
  }

  get costOfLiving() {
    const costOfLivingInput = this.shadowRoot?.querySelector("#costOfLiving");
    return costOfLivingInput ? costOfLivingInput.value : this.#costOfLiving;
  }

  get currency() {
    const currencyInput = this.shadowRoot?.querySelector("#currency");
    return currencyInput ? currencyInput.value : this.#currency;
  }

  // Setters for initial values
  set location(value) {
    this.#location = value;
    if (this.shadowRoot) {
      this.#populateFields();
    }
  }

  set costOfLiving(value) {
    this.#costOfLiving = value;
    if (this.shadowRoot) {
      this.#populateFields();
    }
  }

  set currency(value) {
    this.#currency = value;
    if (this.shadowRoot) {
      this.#populateFields();
    }
  }
}

customElements.define("location-input-group", LocationInputGroup);

export default LocationInputGroup;

