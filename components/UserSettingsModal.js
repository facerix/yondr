/* web component for editing user settings */

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
  max-width: 600px;
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

.section-title {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--primary-color);
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  border-top: 1px solid var(--border-color);
  padding-top: 1em;

  &:first-child {
    margin-top: 0;
    border-top: none;
    padding-top: 0;
  }
}
`;

const TEMPLATE = `
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">User Settings</h2>
      <button class="close-btn" aria-label="Close modal">&times;</button>
    </div>

    <form class="settings-form">
      <div class="section-title">Current Location & Cost of Living</div>
      <location-input-group id="currentLocationGroup"></location-input-group>
      <div class="form-group-row">
        <div class="form-group flex-1">
          <label for="currentLocationCostOfLivingSpend">Cost of living spend (e.g., rent, food)</label>
          <input type="number" step="0.01" min="0" id="currentLocationCostOfLivingSpend" name="currentLocationCostOfLivingSpend" autocomplete="off" value="0" />
        </div>
      </div>

      <div class="section-title">Tax Calculation</div>
      <div class="form-group-row">
        <div class="form-group flex-1">
          <label for="citizenship">Citizenship</label>
          <select id="citizenship" name="citizenship">
            <option value="">Not specified</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="NZ">New Zealand</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="NL">Netherlands</option>
            <option value="BE">Belgium</option>
            <option value="CH">Switzerland</option>
            <option value="AT">Austria</option>
            <option value="SE">Sweden</option>
            <option value="NO">Norway</option>
            <option value="DK">Denmark</option>
            <option value="FI">Finland</option>
            <option value="IE">Ireland</option>
            <option value="PT">Portugal</option>
            <option value="GR">Greece</option>
            <option value="PL">Poland</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
            <option value="SG">Singapore</option>
            <option value="HK">Hong Kong</option>
            <option value="MX">Mexico</option>
            <option value="BR">Brazil</option>
            <option value="AR">Argentina</option>
            <option value="IN">India</option>
            <option value="CN">China</option>
            <option value="RU">Russia</option>
            <option value="ZA">South Africa</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label for="taxFilingStatus">Tax Filing Status (US)</label>
          <select id="taxFilingStatus" name="taxFilingStatus">
            <option value="single" selected>Single</option>
            <option value="married_jointly">Married Filing Jointly</option>
            <option value="married_separately">Married Filing Separately</option>
            <option value="head_of_household">Head of Household</option>
          </select>
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group flex-1">
          <label for="fixedExpenses">Fixed pre-tax expenses (e.g. spousal/child support, insurance, etc)</label>
          <input type="number" step="0.01" min="0" id="fixedExpenses" name="fixedExpenses" autocomplete="off" value="0" required />
        </div>
        <div class="form-group">
          <label for="fixedExpensesCurrency">Currency</label>
          <select id="fixedExpensesCurrency" name="fixedExpensesCurrency" required>
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

      <div class="modal-footer">
        <button type="button" class="btn btn-cancel">Cancel</button>
        <button type="submit" class="btn btn-save">Save</button>
      </div>
    </form>
  </div>
</div>
`;

class UserSettingsModal extends HTMLElement {
  #isOpen = false;
  #boundHandleClose = null;
  #boundHandleSubmit = null;
  #currentLocationGroup = null;

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
    const form = this.shadowRoot.querySelector(".settings-form");

    this.#boundHandleClose = this.#handleClose.bind(this);
    this.#boundHandleSubmit = this.#handleSubmit.bind(this);

    // Get reference to location input group
    this.#currentLocationGroup = this.shadowRoot.querySelector("#currentLocationGroup");

    closeBtn.addEventListener("click", this.#boundHandleClose);
    cancelBtn.addEventListener("click", this.#boundHandleClose);
    form.addEventListener("submit", this.#boundHandleSubmit);

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
    const form = this.shadowRoot.querySelector(".settings-form");

    if (closeBtn) {
      closeBtn.removeEventListener("click", this.#boundHandleClose);
    }
    if (cancelBtn) {
      cancelBtn.removeEventListener("click", this.#boundHandleClose);
    }
    if (form) {
      form.removeEventListener("submit", this.#boundHandleSubmit);
    }
  }

  #handleClose() {
    this.close();
  }

  #handleSubmit(evt) {
    evt.preventDefault();
    const formData = new FormData(this.shadowRoot.querySelector(".settings-form"));
    const fixedExpensesValue = formData.get("fixedExpenses");
    const fixedExpensesCurrencyValue = formData.get("fixedExpensesCurrency");
    const citizenshipValue = formData.get("citizenship") || null;
    const taxFilingStatusValue = formData.get("taxFilingStatus") || "single";
    
    // Get values from location input group
    const currentLocationValue = this.#currentLocationGroup?.location || null;
    const currentLocationCostOfLivingValue = this.#currentLocationGroup?.costOfLiving || null;
    const currentLocationCostOfLivingSpendValue = formData.get("currentLocationCostOfLivingSpend") || null;
    
    const settings = {
      fixedExpenses: fixedExpensesValue ? parseFloat(fixedExpensesValue) : 0,
      fixedExpensesCurrency: fixedExpensesCurrencyValue,
      citizenship: citizenshipValue || null,
      taxFilingStatus: taxFilingStatusValue,
      currentLocation: currentLocationValue || null,
      currentLocationCostOfLiving: currentLocationCostOfLivingValue || null,
      currentLocationCostOfLivingSpend: currentLocationCostOfLivingSpendValue ? parseFloat(currentLocationCostOfLivingSpendValue) : null
    };

    this.dispatchEvent(new CustomEvent("settings-save", { 
      detail: { settings },
      bubbles: true,
      composed: true 
    }));
    this.close();
  }

  #populateForm(settings) {
    const fixedExpensesInput = this.shadowRoot.querySelector("#fixedExpenses");
    const fixedExpensesCurrencyInput = this.shadowRoot.querySelector("#fixedExpensesCurrency");
    const citizenshipInput = this.shadowRoot.querySelector("#citizenship");
    const taxFilingStatusInput = this.shadowRoot.querySelector("#taxFilingStatus");
    const currentLocationCostOfLivingSpendInput = this.shadowRoot.querySelector("#currentLocationCostOfLivingSpend");

    if (settings) {
      fixedExpensesInput.value = settings.fixedExpenses || 0;
      fixedExpensesCurrencyInput.value = settings.fixedExpensesCurrency || "USD";
      citizenshipInput.value = settings.citizenship || "";
      taxFilingStatusInput.value = settings.taxFilingStatus || "single";
      
      if (this.#currentLocationGroup) {
        this.#currentLocationGroup.location = settings.currentLocation || "";
        this.#currentLocationGroup.costOfLiving = settings.currentLocationCostOfLiving || "";
        this.#currentLocationGroup.currency = settings.fixedExpensesCurrency || "USD";
      }
      
      currentLocationCostOfLivingSpendInput.value = settings.currentLocationCostOfLivingSpend || 0;
    } else {
      // Defaults
      fixedExpensesInput.value = 0;
      fixedExpensesCurrencyInput.value = "USD";
      citizenshipInput.value = "";
      taxFilingStatusInput.value = "single";
      
      if (this.#currentLocationGroup) {
        this.#currentLocationGroup.location = "";
        this.#currentLocationGroup.costOfLiving = "";
        this.#currentLocationGroup.currency = "USD";
      }
      
      currentLocationCostOfLivingSpendInput.value = 0;
    }
  }

  loadSettings(settings) {
    this.#populateForm(settings);
  }

  open() {
    this.#isOpen = true;
    const overlay = this.shadowRoot.querySelector(".modal-overlay");
    overlay.classList.add("visible");
    // Focus the first input for better UX
    setTimeout(() => {
      this.shadowRoot.querySelector("#fixedExpenses").focus();
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

customElements.define("user-settings-modal", UserSettingsModal);

export default UserSettingsModal;

