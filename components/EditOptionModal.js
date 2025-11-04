/* web component for editing an option */

import { v4WithTimestamp } from "../src/uuid.js";
import { calculateUSIncomeTax2025 } from "../src/utils.js";
import "../components/LocationInputGroup.js";

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

        <div class="form-group flex-1">
          <label for="fixedExpenses">Fixed expenses (pre-tax)</label>
          <input type="number" step="0.01" min="0" id="fixedExpenses" name="fixedExpenses" autocomplete="off" value="0" />
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group flex-1">
          <label for="taxableIncome">Taxable income</label>
          <input type="number" step="0.01" min="0" id="taxableIncome" name="taxableIncome" value="0" />
        </div>

        <div class="form-group flex-1">
          <label for="usTax">US tax</label>
          <input type="number" step="0.01" min="0" id="usTax" name="usTax" value="0" />
        </div>

        <div class="form-group flex-1">
          <label for="yearNetIncome">Year net income</label>
          <input type="number" step="0.01" min="0" id="yearNetIncome" name="yearNetIncome" value="0" />
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
    const fixedExpensesInput = this.shadowRoot.querySelector("#fixedExpenses");

    baseSalaryInput.addEventListener("input", this.#boundUpdateTaxableIncome);
    bonusesInput.addEventListener("input", this.#boundUpdateTaxableIncome);
    fixedExpensesInput.addEventListener("input", this.#boundUpdateTaxableIncome);

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
    const fixedExpensesInput = this.shadowRoot.querySelector("#fixedExpenses");

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
    if (fixedExpensesInput) {
      fixedExpensesInput.removeEventListener("input", this.#boundUpdateTaxableIncome);
    }
  }

  #handleClose() {
    this.close();
  }

  #updateTaxableIncome() {
    const baseSalaryInput = this.shadowRoot.querySelector("#baseSalary");
    const bonusesInput = this.shadowRoot.querySelector("#bonuses");
    const fixedExpensesInput = this.shadowRoot.querySelector("#fixedExpenses");
    const taxableIncomeInput = this.shadowRoot.querySelector("#taxableIncome");
    const usTaxInput = this.shadowRoot.querySelector("#usTax");
    const yearNetIncomeInput = this.shadowRoot.querySelector("#yearNetIncome");

    const baseSalary = parseFloat(baseSalaryInput.value) || 0;
    const bonuses = parseFloat(bonusesInput.value) || 0;
    const fixedExpenses = parseFloat(fixedExpensesInput.value) || 0;

    // Taxable income = base salary + bonuses - fixed expenses (pre-tax)
    const taxableIncome = Math.max(0, baseSalary + bonuses - fixedExpenses);
    const usTax = calculateUSIncomeTax2025("married_jointly", taxableIncome);
    taxableIncomeInput.value = taxableIncome.toFixed(2);
    usTaxInput.value = usTax.toFixed(2);
    yearNetIncomeInput.value = (taxableIncome - usTax).toFixed(2);
  }

  #handleSubmit(evt) {
    evt.preventDefault();
    const formData = new FormData(this.shadowRoot.querySelector(".edit-form"));
    const nameValue = formData.get("optionName");
    const baseSalaryValue = formData.get("baseSalary");
    const bonusesValue = formData.get("bonuses");
    const fixedExpensesValue = formData.get("fixedExpenses");
    const taxableIncomeValue = formData.get("taxableIncome");
    const usTaxValue = formData.get("usTax");
    const yearNetIncomeValue = formData.get("yearNetIncome");
    
    // Get values from location input group
    const locationValue = this.#locationInputGroup?.location || "";
    const costOfLivingValue = this.#locationInputGroup?.costOfLiving || null;
    const currencyValue = this.#locationInputGroup?.currency || "USD";
    
    const data = {
      name: nameValue,
      location: locationValue,
      currency: currencyValue,
      baseSalary: baseSalaryValue,
      bonuses: bonusesValue,
      fixedExpenses: fixedExpensesValue,
      costOfLiving: costOfLivingValue || null,
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
    const fixedExpensesInput = this.shadowRoot.querySelector("#fixedExpenses");
    const taxableIncomeInput = this.shadowRoot.querySelector("#taxableIncome");
    const usTaxInput = this.shadowRoot.querySelector("#usTax");
    // const nonUsTaxInput = this.shadowRoot.querySelector("#nonUsTax");
    const yearNetIncomeInput = this.shadowRoot.querySelector("#yearNetIncome");

    if (this.#mode === "add") {
      // Add mode defaults
      nameInput.value = "";
      baseSalaryInput.value = 0;
      bonusesInput.value = 0;
      fixedExpensesInput.value = 0;
      taxableIncomeInput.value = 0;
      usTaxInput.value = 0;
      // nonUsTaxInput.value = 0;
      yearNetIncomeInput.value = 0;
      
      // Reset location input group
      if (this.#locationInputGroup) {
        this.#locationInputGroup.location = "";
        this.#locationInputGroup.costOfLiving = "";
        this.#locationInputGroup.currency = "USD";
      }
    } else if (this.#data) {
      // Edit mode - populate from data
      nameInput.value = this.#data.name || "";
      baseSalaryInput.value = this.#data.baseSalary || 0;
      bonusesInput.value = this.#data.bonuses || 0;
      fixedExpensesInput.value = this.#data.fixedExpenses || 0;
      taxableIncomeInput.value = this.#data.taxableIncome || 0;
      usTaxInput.value = this.#data.usTax || 0;
      // nonUsTaxInput.value = this.#data.nonUsTax || 0;
      yearNetIncomeInput.value = this.#data.yearNetIncome || 0;
      
      // Populate location input group
      if (this.#locationInputGroup) {
        this.#locationInputGroup.location = this.#data.location || "";
        this.#locationInputGroup.costOfLiving = this.#data.costOfLiving || "";
        this.#locationInputGroup.currency = this.#data.currency || "USD";
      }
    }

    // Update the header text based on mode
    this.#updateHeader();
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
