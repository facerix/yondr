/* web component for editing an option */

import { v4WithTimestamp } from "../src/uuid.js";
import { calculateUSIncomeTax2025 } from "../src/utils.js";
import DataStore from "../src/DataStore.js";
import { CurrencyClient } from "../src/currencyClient.js";
import { lookupCostOfLiving } from "../src/costOfLivingData.js";
import "../components/LocationInputGroup.js";
import "../components/PopoverInfo.js";

const CSS = `
:host {
  --modal-backdrop: rgba(0, 0, 0, 0.5);
  --modal-bg: #ffffff;
  --primary-color: #7c0028;
  --border-color: rgba(124, 0, 40, 0.2);
  --focus-color: rgba(124, 0, 40, 0.5);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.modal {
  background-color: var(--modal-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 2em;
  width: 80vw;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1em;

  h2 {
    margin: 0;
    font-size: 1.5em;
    color: var(--primary-color);
    font-weight: 400;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0;
  width: 1.5em;
  height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover,
  &:focus-visible {
    opacity: 0.7;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px double var(--focus-color);
    outline-offset: 2px;
  }
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
    white-space: nowrap;
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

    &[readonly] {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.8;

      &:hover {
        border-color: var(--border-color);
      }
    }
  }

  .read-only-value {
    font-size: 1em;
    color: var(--primary-color);
    font-weight: 500;
    padding: 0.5rem;
    border: 1px inset var(--border-color);
    border-radius: 4px;
    background-color: rgba(240, 140, 140, 0.1);
  }

  .label-with-info {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
}

.flex-1 {
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 1em;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5em;
  margin-top: 1.5em;
}

.btn {
  padding: 0.75em 1.5em;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px double var(--focus-color);
    outline-offset: 2px;
  }
}

.btn-cancel {
  background-color: transparent;
  color: var(--primary-color);

  &:hover {
    background-color: rgba(124, 0, 40, 0.05);
    border-color: var(--primary-color);
  }
}

.btn-save {
  background-color: var(--primary-color);
  color: white;
  border: none;

  &:hover {
    opacity: 0.9;
    box-shadow: 0 2px 4px rgba(124, 0, 40, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
}
`;

const TEMPLATE = `
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Edit Option</h2>
      <button class="close-btn" aria-label="Close modal">&times;</button>
    </div>

    <form class="edit-form">
      <div class="form-group-row">
        <div class="form-group flex-1">
          <label for="optionName">Option Name</label>
          <input type="text" id="optionName" name="optionName" autocomplete="off" required />
        </div>
      </div>

      <location-input-group id="locationGroup"></location-input-group>

      <div class="form-group-row">
        <div class="form-group flex-1">
          <label for="baseSalary">Base salary</label>
          <input type="number" step="0.01" min="0" id="baseSalary" name="baseSalary" autocomplete="off" required />
        </div>

        <div class="form-group flex-1">
          <label for="bonuses">Total Bonuses (not equity)</label>
          <input type="number" step="0.01" min="0" id="bonuses" name="bonuses" autocomplete="off" value="0" />
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group flex-1">
          <label class="label-with-info">
            Fixed expenses
            <popover-info 
              content="Fixed expenses are managed in User Settings. Click the person icon in the header to update them."
              aria-label="Information about fixed expenses">
            </popover-info>
          </label>
          <div class="read-only-value" id="fixedExpenses"></div>
        </div>

        <div class="form-group flex-1">
          <label class="label-with-info">
            Est. cost of living
            <popover-info 
              content="The estimated cost of living is calculated based on the cost of living index for this location and the user's current spend, as defined in User Settings."
              aria-label="Information about estimated cost of living">
            </popover-info>
          </label>
          <div class="read-only-value" id="estimatedCostOfLivingDisplay"></div>
        </div>

        <div class="form-group flex-1">
          <label for="taxableIncome">Taxable income</label>
          <div class="read-only-value" id="taxableIncomeDisplay"></div>
          <input type="hidden" id="taxableIncome" name="taxableIncome" value="0" />
        </div>

        <div class="form-group flex-1">
          <label for="usTax">US tax</label>
          <div class="read-only-value" id="usTaxDisplay"></div>
          <input type="hidden" id="usTax" name="usTax" value="0" />
        </div>

        <div class="form-group flex-1">
          <label for="yearNetIncome">Year net income</label>
          <div class="read-only-value" id="yearNetIncomeDisplay"></div>
          <input type="hidden" id="yearNetIncome" name="yearNetIncome" value="0" />
        </div>
      </div>  

      <!-- <div class="form-group">
        <label for="nonUsTax">Non-US tax</label>
        <input type="number" step="0.01" min="0" id="nonUsTax" name="nonUsTax" value="0" />
      </div> -->

      <div class="modal-footer">
        <button type="button" class="btn btn-cancel">Cancel</button>
        <button type="submit" class="btn btn-save">Save</button>
      </div>
    </form>
  </div>
</div>
`;

class EditOptionModal extends HTMLElement {
  #data = null;
  #mode = "edit";
  #isOpen = false;
  #boundHandleClose = null;
  #boundHandleSubmit = null;
  #boundUpdateTaxableIncome = null;
  #locationInputGroup = null;
  #currencyClient = null;

  constructor() {
    super();
    this.#currencyClient = new CurrencyClient();
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
    const closeBtn = this.shadowRoot.querySelector(".close-btn");
    const cancelBtn = this.shadowRoot.querySelector(".btn-cancel");
    const form = this.shadowRoot.querySelector(".edit-form");

    this.#boundHandleClose = this.#handleClose.bind(this);
    this.#boundHandleSubmit = this.#handleSubmit.bind(this);
    this.#boundUpdateTaxableIncome = this.#updateTaxableIncome.bind(this);

    // Get reference to location input group
    this.#locationInputGroup = this.shadowRoot.querySelector("#locationGroup");

    closeBtn.addEventListener("click", this.#boundHandleClose);
    cancelBtn.addEventListener("click", this.#boundHandleClose);
    form.addEventListener("submit", this.#boundHandleSubmit);

    // Attach change handler to fields that affect taxable income
    const baseSalaryInput = this.shadowRoot.querySelector("#baseSalary");
    const bonusesInput = this.shadowRoot.querySelector("#bonuses");

    baseSalaryInput.addEventListener("input", this.#boundUpdateTaxableIncome);
    bonusesInput.addEventListener("input", this.#boundUpdateTaxableIncome);
    
    // Listen for currency changes in location input group to update tax calculations
    if (this.#locationInputGroup) {
      this.#locationInputGroup.addEventListener("location-change", this.#boundUpdateTaxableIncome);
      // Also listen directly to currency select changes
      const currencySelect = this.#locationInputGroup.shadowRoot?.querySelector("#currency");
      if (currencySelect) {
        currencySelect.addEventListener("change", this.#boundUpdateTaxableIncome);
      }
      // Listen for cost of living changes to update estimated cost of living
      const costOfLivingInput = this.#locationInputGroup.shadowRoot?.querySelector("#costOfLiving");
      if (costOfLivingInput) {
        costOfLivingInput.addEventListener("input", this.#boundUpdateTaxableIncome);
      }
    }

    // Close modal when clicking the overlay (outside the modal)
    const overlay = this.shadowRoot.querySelector(".modal-overlay");
    overlay.addEventListener("click", (evt) => {
      if (evt.target === overlay) {
        this.#handleClose();
      }
    });
  }

  #cleanup() {
    const closeBtn = this.shadowRoot.querySelector(".close-btn");
    const cancelBtn = this.shadowRoot.querySelector(".btn-cancel");
    const form = this.shadowRoot.querySelector(".edit-form");
    const baseSalaryInput = this.shadowRoot.querySelector("#baseSalary");
    const bonusesInput = this.shadowRoot.querySelector("#bonuses");

    if (closeBtn) {
      closeBtn.removeEventListener("click", this.#boundHandleClose);
    }
    if (cancelBtn) {
      cancelBtn.removeEventListener("click", this.#boundHandleClose);
    }
    if (form) {
      form.removeEventListener("submit", this.#boundHandleSubmit);
    }
    if (baseSalaryInput) {
      baseSalaryInput.removeEventListener("input", this.#boundUpdateTaxableIncome);
    }
    if (bonusesInput) {
      bonusesInput.removeEventListener("input", this.#boundUpdateTaxableIncome);
    }
    if (this.#locationInputGroup) {
      this.#locationInputGroup.removeEventListener("location-change", this.#boundUpdateTaxableIncome);
      const currencySelect = this.#locationInputGroup.shadowRoot?.querySelector("#currency");
      if (currencySelect) {
        currencySelect.removeEventListener("change", this.#boundUpdateTaxableIncome);
      }
      const costOfLivingInput = this.#locationInputGroup.shadowRoot?.querySelector("#costOfLiving");
      if (costOfLivingInput) {
        costOfLivingInput.removeEventListener("input", this.#boundUpdateTaxableIncome);
      }
    }
  }

  #handleClose() {
    this.close();
  }

  async #updateTaxableIncome() {
    const baseSalaryInput = this.shadowRoot.querySelector("#baseSalary");
    const bonusesInput = this.shadowRoot.querySelector("#bonuses");
    const taxableIncomeInput = this.shadowRoot.querySelector("#taxableIncome");
    const taxableIncomeDisplay = this.shadowRoot.querySelector("#taxableIncomeDisplay");
    const usTaxInput = this.shadowRoot.querySelector("#usTax");
    const usTaxDisplay = this.shadowRoot.querySelector("#usTaxDisplay");
    const yearNetIncomeInput = this.shadowRoot.querySelector("#yearNetIncome");
    const yearNetIncomeDisplay = this.shadowRoot.querySelector("#yearNetIncomeDisplay");
    const estimatedCostOfLivingDisplay = this.shadowRoot.querySelector("#estimatedCostOfLivingDisplay");
    
    // Calculate and update estimated cost of living (async) - get the value for subtraction
    const estimatedCostOfLivingValue = await this.#updateEstimatedCostOfLiving(estimatedCostOfLivingDisplay);

    const baseSalary = parseFloat(baseSalaryInput.value) || 0;
    const bonuses = parseFloat(bonusesInput.value) || 0;
    
    // Get fixed expenses from user settings
    const userSettings = DataStore.getUserSettings();
    const fixedExpenses = parseFloat(userSettings.fixedExpenses) || 0;
    const fixedExpensesCurrency = userSettings.fixedExpensesCurrency || "USD";
    
    // Get job currency from location input group
    const jobCurrency = this.#locationInputGroup?.currency || "USD";
    
    // Convert baseSalary and bonuses to USD if job currency is not USD
    let baseSalaryUSD = baseSalary;
    let bonusesUSD = bonuses;
    if (jobCurrency !== "USD" && (baseSalary > 0 || bonuses > 0)) {
      try {
        const exchangeRate = await this.#currencyClient.getExchangeRate(jobCurrency, "USD");
        baseSalaryUSD = baseSalary * exchangeRate;
        bonusesUSD = bonuses * exchangeRate;
      } catch (error) {
        console.error(`Error converting income from ${jobCurrency} to USD:`, error);
        // Fall back to original values if conversion fails
        baseSalaryUSD = baseSalary;
        bonusesUSD = bonuses;
      }
    }
    
    // Convert fixed expenses to USD if they're in a different currency
    let fixedExpensesUSD = fixedExpenses;
    if (fixedExpensesCurrency !== "USD" && fixedExpenses > 0) {
      try {
        const exchangeRate = await this.#currencyClient.getExchangeRate(fixedExpensesCurrency, "USD");
        fixedExpensesUSD = fixedExpenses * exchangeRate;
      } catch (error) {
        console.error(`Error converting fixed expenses from ${fixedExpensesCurrency} to USD:`, error);
        // Fall back to original value if conversion fails
        fixedExpensesUSD = fixedExpenses;
      }
    }

    // Taxable income = base salary + bonuses - fixed expenses (pre-tax)
    // All values are now in USD for tax calculation
    const taxableIncomeUSD = Math.max(0, baseSalaryUSD + bonusesUSD - fixedExpensesUSD);
    
    // Determine tax based on citizenship
    // For US citizens (or default), use US tax calculation
    const filingStatus = userSettings.taxFilingStatus || "single";
    const usTaxUSD = userSettings.citizenship === "US" || !userSettings.citizenship 
      ? calculateUSIncomeTax2025(filingStatus, taxableIncomeUSD)
      : 0; // Non-US tax calculation not yet implemented
    
    // Convert taxable income and year net income back to job currency for display
    // Note: usTax is always stored in USD (since it's US tax)
    let taxableIncomeDisplayValue = taxableIncomeUSD;
    let yearNetIncomeUSD = taxableIncomeUSD - usTaxUSD;
    let yearNetIncomeDisplayValue = yearNetIncomeUSD;
    
    if (jobCurrency !== "USD") {
      try {
        const exchangeRate = await this.#currencyClient.getExchangeRate("USD", jobCurrency);
        taxableIncomeDisplayValue = taxableIncomeUSD * exchangeRate;
        yearNetIncomeDisplayValue = yearNetIncomeUSD * exchangeRate;
      } catch (error) {
        console.error(`Error converting tax values from USD to ${jobCurrency}:`, error);
        // Fall back to USD values if conversion fails
        taxableIncomeDisplayValue = taxableIncomeUSD;
        yearNetIncomeDisplayValue = yearNetIncomeUSD;
      }
    }
    
    // Subtract estimated cost of living from year net income (both should be in job currency)
    if (estimatedCostOfLivingValue !== null && estimatedCostOfLivingValue > 0) {
      yearNetIncomeDisplayValue = Math.max(0, yearNetIncomeDisplayValue - estimatedCostOfLivingValue);
    }
    
    // Store values for display
    // taxableIncome is stored in job currency (hidden input for form submission)
    taxableIncomeInput.value = taxableIncomeDisplayValue.toFixed(2);
    // Display taxable income with job currency formatting (read-only, localized)
    if (taxableIncomeDisplay) {
      const formattedTaxableIncome = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: jobCurrency,
        maximumFractionDigits: 0
      }).format(taxableIncomeDisplayValue);
      taxableIncomeDisplay.textContent = formattedTaxableIncome;
    }
    // usTax is stored in USD (it's US tax, so should always be in USD)
    // Store the USD value in hidden input for form submission
    usTaxInput.value = usTaxUSD.toFixed(2);
    // Display US tax with USD formatting (read-only, localized)
    if (usTaxDisplay) {
      const formattedUsTax = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(usTaxUSD);
      usTaxDisplay.textContent = formattedUsTax;
    }
    // Store year net income in job currency (hidden input for form submission)
    yearNetIncomeInput.value = yearNetIncomeDisplayValue.toFixed(2);
    // Display year net income with job currency formatting (read-only, localized)
    if (yearNetIncomeDisplay) {
      const formattedYearNetIncome = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: jobCurrency,
        maximumFractionDigits: 0
      }).format(yearNetIncomeDisplayValue);
      yearNetIncomeDisplay.textContent = formattedYearNetIncome;
    }
  }

  async #updateEstimatedCostOfLiving(displayElement) {
    if (!displayElement) return null;
    
    const userSettings = DataStore.getUserSettings();
    const currentLocationCostOfLivingSpend = parseFloat(userSettings.currentLocationCostOfLivingSpend) || 0;
    const currentLocationCostOfLivingIndex = parseFloat(userSettings.currentLocationCostOfLiving) || null;
    const optionCostOfLivingIndex = parseFloat(this.#locationInputGroup?.costOfLiving) || null;
    
    // Get job currency for display
    const jobCurrency = this.#locationInputGroup?.currency || userSettings.fixedExpensesCurrency || "USD";
    
    // Calculate estimated cost of living if we have all required values
    if (currentLocationCostOfLivingSpend > 0 && currentLocationCostOfLivingIndex > 0 && optionCostOfLivingIndex > 0) {
      // Get current location currency by looking up the location
      const currentLocation = userSettings.currentLocation || null;
      let currentLocationCurrency = "USD"; // Default fallback
      if (currentLocation) {
        const locationData = lookupCostOfLiving(currentLocation);
        if (locationData && locationData.currency) {
          currentLocationCurrency = locationData.currency;
        }
      }
      
      // Convert user's cost of living spend to job currency if currencies differ
      let userSpendInJobCurrency = currentLocationCostOfLivingSpend;
      if (currentLocationCurrency !== jobCurrency && currentLocationCostOfLivingSpend > 0) {
        try {
          const exchangeRate = await this.#currencyClient.getExchangeRate(currentLocationCurrency, jobCurrency);
          userSpendInJobCurrency = currentLocationCostOfLivingSpend * exchangeRate;
        } catch (error) {
          console.error(`Error converting cost of living spend from ${currentLocationCurrency} to ${jobCurrency}:`, error);
          // Fall back to original value if conversion fails
          userSpendInJobCurrency = currentLocationCostOfLivingSpend;
        }
      }
      
      // Calculate estimated cost of living
      const ratio = optionCostOfLivingIndex / currentLocationCostOfLivingIndex;
      const estimatedCostOfLiving = userSpendInJobCurrency * ratio;
      
      const formattedEstimatedCostOfLiving = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: jobCurrency,
        maximumFractionDigits: 0
      }).format(estimatedCostOfLiving);
      
      displayElement.textContent = formattedEstimatedCostOfLiving;
      return estimatedCostOfLiving; // Return the numeric value for use in calculations
    } else {
      displayElement.textContent = "—";
      return null;
    }
  }

  async #handleSubmit(evt) {
    evt.preventDefault();
    const formData = new FormData(this.shadowRoot.querySelector(".edit-form"));
    const nameValue = formData.get("optionName");
    const baseSalaryValue = formData.get("baseSalary");
    const bonusesValue = formData.get("bonuses");
    const taxableIncomeValue = formData.get("taxableIncome");
    const usTaxValue = formData.get("usTax");
    const yearNetIncomeValue = formData.get("yearNetIncome");
    
    // Get values from location input group (job location, not current location)
    const locationValue = this.#locationInputGroup?.location || "";
    const costOfLivingValue = this.#locationInputGroup?.costOfLiving || null;
    const currencyValue = this.#locationInputGroup?.currency || "USD";
    
    // Get fixed expenses currency from user settings
    const userSettings = DataStore.getUserSettings();
    
    // Calculate cost of living spend if we have all required values
    let costOfLivingSpendValue = null;
    const currentLocationCostOfLivingSpend = parseFloat(userSettings.currentLocationCostOfLivingSpend) || 0;
    const currentLocationCostOfLivingIndex = parseFloat(userSettings.currentLocationCostOfLiving) || null;
    const optionCostOfLivingIndex = parseFloat(costOfLivingValue) || null;
    
    if (currentLocationCostOfLivingSpend > 0 && currentLocationCostOfLivingIndex > 0 && optionCostOfLivingIndex > 0) {
      // Get current location currency by looking up the location
      const currentLocation = userSettings.currentLocation || null;
      let currentLocationCurrency = "USD"; // Default fallback
      if (currentLocation) {
        const locationData = lookupCostOfLiving(currentLocation);
        if (locationData && locationData.currency) {
          currentLocationCurrency = locationData.currency;
        }
      }
      
      // Convert user's cost of living spend to job currency if currencies differ
      let userSpendInJobCurrency = currentLocationCostOfLivingSpend;
      if (currentLocationCurrency !== currencyValue && currentLocationCostOfLivingSpend > 0) {
        try {
          const exchangeRate = await this.#currencyClient.getExchangeRate(currentLocationCurrency, currencyValue);
          userSpendInJobCurrency = currentLocationCostOfLivingSpend * exchangeRate;
        } catch (error) {
          console.error(`Error converting cost of living spend from ${currentLocationCurrency} to ${currencyValue}:`, error);
          // Fall back to original value if conversion fails
          userSpendInJobCurrency = currentLocationCostOfLivingSpend;
        }
      }
      
      // Calculate estimated cost of living spend
      const ratio = optionCostOfLivingIndex / currentLocationCostOfLivingIndex;
      costOfLivingSpendValue = userSpendInJobCurrency * ratio;
    }
    
    const data = {
      name: nameValue,
      location: locationValue,
      currency: currencyValue,
      baseSalary: baseSalaryValue,
      bonuses: bonusesValue,
      costOfLiving: costOfLivingValue || null,
      costOfLivingSpend: costOfLivingSpendValue,
      taxableIncome: taxableIncomeValue,
      usTax: usTaxValue,
      yearNetIncome: yearNetIncomeValue,
    };

    // Include id only in edit mode
    if (this.#mode === "edit" && this.#data) {
      data.id = this.#data.id;
    } else {
      data.id = v4WithTimestamp();
    }

    this.dispatchEvent(new CustomEvent("option-save", { 
      detail: { option: data },
      bubbles: true,
      composed: true 
    }));
    this.close();
  }

  set data(optionData) {
    this.#data = optionData;
    this.#populateForm();
  }

  get data() {
    return this.#data;
  }

  set mode(mode) {
    if (mode === "add" || mode === "edit") {
      this.#mode = mode;
      this.#populateForm();
    }
  }

  get mode() {
    return this.#mode;
  }

  #populateForm() {
    const nameInput = this.shadowRoot.querySelector("#optionName");
    const baseSalaryInput = this.shadowRoot.querySelector("#baseSalary");
    const bonusesInput = this.shadowRoot.querySelector("#bonuses");
    const taxableIncomeInput = this.shadowRoot.querySelector("#taxableIncome");
    const taxableIncomeDisplay = this.shadowRoot.querySelector("#taxableIncomeDisplay");
    const usTaxInput = this.shadowRoot.querySelector("#usTax");
    const usTaxDisplay = this.shadowRoot.querySelector("#usTaxDisplay");
    // const nonUsTaxInput = this.shadowRoot.querySelector("#nonUsTax");
    const yearNetIncomeInput = this.shadowRoot.querySelector("#yearNetIncome");
    const yearNetIncomeDisplay = this.shadowRoot.querySelector("#yearNetIncomeDisplay");
    const fixedExpensesDisplay = this.shadowRoot.querySelector("#fixedExpenses");
    const estimatedCostOfLivingDisplay = this.shadowRoot.querySelector("#estimatedCostOfLivingDisplay");

    // Get fixed expenses from user settings and format as currency
    const userSettings = DataStore.getUserSettings();
    const fixedExpenses = parseFloat(userSettings.fixedExpenses) || 0;
    const currency = userSettings.fixedExpensesCurrency || "USD";
    const formattedExpenses = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0
    }).format(fixedExpenses);
    fixedExpensesDisplay.textContent = formattedExpenses;

    if (this.#mode === "add") {
      // Add mode defaults
      nameInput.value = "";
      baseSalaryInput.value = 0;
      bonusesInput.value = 0;
      taxableIncomeInput.value = 0;
      if (taxableIncomeDisplay) {
        const defaultCurrency = userSettings.fixedExpensesCurrency || "USD";
        taxableIncomeDisplay.textContent = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: defaultCurrency,
          maximumFractionDigits: 0
        }).format(0);
      }
      usTaxInput.value = 0;
      if (usTaxDisplay) {
        usTaxDisplay.textContent = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0
        }).format(0);
      }
      // nonUsTaxInput.value = 0;
      yearNetIncomeInput.value = 0;
      if (yearNetIncomeDisplay) {
        const defaultCurrency = userSettings.fixedExpensesCurrency || "USD";
        yearNetIncomeDisplay.textContent = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: defaultCurrency,
          maximumFractionDigits: 0
        }).format(0);
      }
      
      // Reset location input group
      if (this.#locationInputGroup) {
        this.#locationInputGroup.location = "";
        this.#locationInputGroup.costOfLiving = "";
        // Get currency from user settings
        this.#locationInputGroup.currency = userSettings.fixedExpensesCurrency || "USD";
      }
    } else if (this.#data) {
      // Edit mode - populate from data
      nameInput.value = this.#data.name || "";
      baseSalaryInput.value = this.#data.baseSalary || 0;
      bonusesInput.value = this.#data.bonuses || 0;
      const taxableIncomeValue = parseFloat(this.#data.taxableIncome) || 0;
      taxableIncomeInput.value = taxableIncomeValue.toFixed(2);
      if (taxableIncomeDisplay) {
        const jobCurrency = this.#data.currency || userSettings.fixedExpensesCurrency || "USD";
        taxableIncomeDisplay.textContent = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: jobCurrency,
          maximumFractionDigits: 0
        }).format(taxableIncomeValue);
      }
      const usTaxValue = parseFloat(this.#data.usTax) || 0;
      usTaxInput.value = usTaxValue.toFixed(2);
      if (usTaxDisplay) {
        usTaxDisplay.textContent = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0
        }).format(usTaxValue);
      }
      // nonUsTaxInput.value = this.#data.nonUsTax || 0;
      const yearNetIncomeValue = parseFloat(this.#data.yearNetIncome) || 0;
      yearNetIncomeInput.value = yearNetIncomeValue.toFixed(2);
      if (yearNetIncomeDisplay) {
        const jobCurrency = this.#data.currency || userSettings.fixedExpensesCurrency || "USD";
        yearNetIncomeDisplay.textContent = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: jobCurrency,
          maximumFractionDigits: 0
        }).format(yearNetIncomeValue);
      }
      
      // Populate location input group
      if (this.#locationInputGroup) {
        this.#locationInputGroup.location = this.#data.location || "";
        this.#locationInputGroup.costOfLiving = this.#data.costOfLiving || "";
        // Get currency from user settings or fallback to data
        this.#locationInputGroup.currency = this.#data.currency || userSettings.fixedExpensesCurrency || "USD";
      }
    }

    // Update the header text based on mode
    this.#updateHeader();
    // Update estimated cost of living (async)
    this.#updateEstimatedCostOfLiving(estimatedCostOfLivingDisplay);
    // Update taxable income calculation after populating form
    this.#updateTaxableIncome();
  }

  #updateHeader() {
    const titleElement = this.shadowRoot.querySelector(".modal-title");
    if (titleElement) {
      titleElement.textContent =
        this.#mode === "add" ? "Add Option" : "Edit Option";
    }
  }

  open() {
    this.#isOpen = true;
    // Refresh fixed expenses from user settings when opening
    const fixedExpensesDisplay = this.shadowRoot.querySelector("#fixedExpenses");
    if (fixedExpensesDisplay) {
      const userSettings = DataStore.getUserSettings();
      const fixedExpenses = parseFloat(userSettings.fixedExpenses) || 0;
      const currency = userSettings.fixedExpensesCurrency || "USD";
      const formattedExpenses = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0
      }).format(fixedExpenses);
      fixedExpensesDisplay.textContent = formattedExpenses;
    }
    // Refresh estimated cost of living when opening (async)
    const estimatedCostOfLivingDisplay = this.shadowRoot.querySelector("#estimatedCostOfLivingDisplay");
    if (estimatedCostOfLivingDisplay) {
      this.#updateEstimatedCostOfLiving(estimatedCostOfLivingDisplay);
    }
    const overlay = this.shadowRoot.querySelector(".modal-overlay");
    overlay.classList.add("visible");
    // Focus the name input for better UX
    setTimeout(() => {
      this.shadowRoot.querySelector("#optionName").focus();
    }, 100);
  }

  close() {
    this.#isOpen = false;
    const overlay = this.shadowRoot.querySelector(".modal-overlay");
    overlay.classList.remove("visible");
  }

  isOpen() {
    return this.#isOpen;
  }
}

customElements.define("edit-option-modal", EditOptionModal);
