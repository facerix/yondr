/* web component for editing a crossroad */

import { v4WithTimestamp } from "../src/uuid.js";
import { dateToDateString } from "../src/utils.js";

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
  max-width: 500px;
  width: 90vw;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
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
  input[type="date"] {
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

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75em;
  margin-bottom: 1.5em;

  input[type="checkbox"] {
    width: 1.2em;
    height: 1.2em;
    cursor: pointer;
    accent-color: var(--primary-color);

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: 2px double var(--focus-color);
      outline-offset: 2px;
    }
  }

  label {
    margin: 0;
    cursor: pointer;
    font-weight: 500;
    color: var(--primary-color);
  }
}

.end-date-group {
  opacity: 1;
  transition: opacity 0.2s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
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
      <h2 class="modal-title">Edit Crossroad</h2>
      <button class="close-btn" aria-label="Close modal">&times;</button>
    </div>

    <form class="edit-form">
      <div class="form-group">
        <label for="title">Title</label>
        <input type="text" id="title" name="title" required />
      </div>

      <div class="form-group">
        <label for="startDate">Start Date</label>
        <input type="date" id="startDate" name="startDate" required />
      </div>

      <div class="checkbox-group">
        <input type="checkbox" id="isActive" name="isActive" />
        <label for="isActive">Currently Active</label>
      </div>

      <div class="end-date-group">
        <div class="form-group">
          <label for="endDate">End Date</label>
          <input type="date" id="endDate" name="endDate" />
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

class EditCrossroadModal extends HTMLElement {
  #data = null;
  #mode = "edit";
  #isOpen = false;
  #boundHandleClose = null;
  #boundHandleSubmit = null;
  #boundHandleActiveChange = null;

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
    const activeCheckbox = this.shadowRoot.querySelector("#isActive");

    this.#boundHandleClose = this.#handleClose.bind(this);
    this.#boundHandleSubmit = this.#handleSubmit.bind(this);
    this.#boundHandleActiveChange = this.#handleActiveChange.bind(this);

    closeBtn.addEventListener("click", this.#boundHandleClose);
    cancelBtn.addEventListener("click", this.#boundHandleClose);
    form.addEventListener("submit", this.#boundHandleSubmit);
    activeCheckbox.addEventListener("change", this.#boundHandleActiveChange);

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
    const activeCheckbox = this.shadowRoot.querySelector("#isActive");

    if (closeBtn) {
      closeBtn.removeEventListener("click", this.#boundHandleClose);
    }
    if (cancelBtn) {
      cancelBtn.removeEventListener("click", this.#boundHandleClose);
    }
    if (form) {
      form.removeEventListener("submit", this.#boundHandleSubmit);
    }
    if (activeCheckbox) {
      activeCheckbox.removeEventListener("change", this.#boundHandleActiveChange);
    }
  }

  #handleClose() {
    this.close();
  }

  #handleSubmit(evt) {
    evt.preventDefault();
    const formData = new FormData(this.shadowRoot.querySelector(".edit-form"));
    const startDateValue = formData.get("startDate");
    const endDateValue = formData.get("endDate");
    const data = {
      name: formData.get("title"),
      startDate: startDateValue || null,
      endDate: formData.get("isActive") ? null : (endDateValue || null),
    };

    // Include id and paths only in edit mode
    if (this.#mode === "edit" && this.#data) {
      data.id = this.#data.id;
      data.paths = this.#data.paths || [];
    } else {
      // In add mode, paths should be an empty array
      data.id = v4WithTimestamp();
      data.paths = [];
    }

    this.dispatchEvent(new CustomEvent("crossroad-save", { detail: { mode: this.#mode, crossroad: data } }));
    this.close();
  }

  #handleActiveChange() {
    const isActive = this.shadowRoot.querySelector("#isActive").checked;
    const endDateGroup = this.shadowRoot.querySelector(".end-date-group");
    const endDateInput = this.shadowRoot.querySelector("#endDate");

    if (isActive) {
      endDateGroup.classList.add("disabled");
      endDateInput.value = "";
    } else {
      endDateGroup.classList.remove("disabled");
    }
  }

  set data(crossroadData) {
    this.#data = crossroadData;
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
    const titleInput = this.shadowRoot.querySelector("#title");
    const startDateInput = this.shadowRoot.querySelector("#startDate");
    const endDateInput = this.shadowRoot.querySelector("#endDate");
    const isActiveCheckbox = this.shadowRoot.querySelector("#isActive");

    // Convert date to yyyy-mm-dd format for date input
    const formatDate = (date) => {
      if (!date) return "";
      // If already in yyyy-mm-dd format, return as-is
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Convert Date object or other formats to yyyy-mm-dd
      return dateToDateString(date);
    };

    if (this.#mode === "add") {
      // Add mode defaults
      titleInput.value = "";
      startDateInput.value = formatDate(new Date());
      endDateInput.value = "";
      isActiveCheckbox.checked = true;
    } else if (this.#data) {
      // Edit mode - populate from data
      titleInput.value = this.#data.name || "";
      startDateInput.value = formatDate(this.#data.startDate) || "";
      endDateInput.value = formatDate(this.#data.endDate) || "";
      isActiveCheckbox.checked = !this.#data.endDate;
    }

    // Update the disabled state of the end date group
    this.#handleActiveChange();
    // Update the header text based on mode
    this.#updateHeader();
  }

  #updateHeader() {
    const titleElement = this.shadowRoot.querySelector(".modal-title");
    if (titleElement) {
      titleElement.textContent =
        this.#mode === "add" ? "Add Crossroad" : "Edit Crossroad";
    }
  }

  open() {
    this.#isOpen = true;
    const overlay = this.shadowRoot.querySelector(".modal-overlay");
    overlay.classList.add("visible");
    // Focus the title input for better UX
    setTimeout(() => {
      this.shadowRoot.querySelector("#title").focus();
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

customElements.define("edit-crossroad-modal", EditCrossroadModal);
