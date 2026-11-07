/* web component for managing the user's current path */
import DataStore from '/src/DataStore.js';
import '/components/ConfirmationModal.js';
import '/components/EditOptionModal.js';

const CSS = `
:host {
  margin-bottom: 2em;
  border-bottom: 1px solid #7c0028;
  padding-bottom: 3em;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1em;
}

#current-path-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 1em;
}

#no-current-path {
  margin: 0 3rem;
  text-align: center;
}

.edit-actions {
  display: flex;
  flex-direction: row;
  gap: 0.5em;
}

.add-btn {
  border: 1px dashed rgb(244, 12, 64) !important;
  padding: 1em;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  font-family: Futura, "Trebuchet MS", Arial, sans-serif;
  font-size: 1rem;
  font-weight: 400;

  &:hover {
    outline: 2px double #7c0028;
    background-color: #ddbfc67a;
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px double rgba(124, 0, 40, 0.5);
    outline-offset: -4px;
  }
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  background: none;
  border: none;

  img {
    width: 1.5em;
    height: 1.5em;
    filter: brightness(0) saturate(100%) invert(28%) sepia(100%) saturate(1000%) hue-rotate(326deg) brightness(96%) contrast(101%);
  }

  &:hover {
    cursor: pointer;
  }

  &:focus {
    outline: none;
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px double rgba(124, 0, 40, 0.5);
    outline-offset: -4px;
  }
}

.u-hidden {
  display: none;
}
`;

const TEMPLATE = `
<div id="no-current-path">
  <p>If you're currently working, you can set your current job information here. If you do so, it'll automatically be added as the first path every time you start a new crossroad.</p>
</div>
<div id="current-path-container">
  <div id="path-summary">
    <strong id="path-name"></strong>
    <br>
    <em id="bottom-line"></em>
  </div>
  <button class="btn add-btn">
    <img src="/images/pin-plus.svg" alt="add" />
    <span class="btn-caption">Set Current Path</span>
  </button>
  <div class="edit-actions">
    <button class="btn edit-btn">
      <img src="/images/edit.svg" alt="edit" />
      <span class="btn-caption">Update</span>
    </button>
    <button class="btn clear-btn">
      <img src="/images/restart.svg" alt="clear" />
      <span class="btn-caption">Clear</span>
    </button>
  </div>
</div>
<confirmation-modal></confirmation-modal>
<edit-option-modal></edit-option-modal>
`;


class CurrentPath extends HTMLElement {
  #ready = false;
  #data = null;
  #container = null;
  #boundHandleEdit = null;
  #boundHandleClear = null;
  #boundHandleSave = null;
  #editOptionModal = null;
  #confirmationModal = null;
  #confirmationAction = null; // "clear"
  #boundHandleConfirm = null;

  constructor() {
    super();
  }

  connectedCallback() {
    // Create shadow root
    const shadow = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    styles.innerHTML = CSS;
    shadow.appendChild(styles);

    const container = document.createElement('div');
    container.id = 'current-path-root';
    container.innerHTML = TEMPLATE;
    shadow.appendChild(container);

    // Set data-id on the host element so it can be found by querySelector
    this.dataset.id = this.#data?.id;

    this.#init();
    this.render();
  }

  disconnectedCallback() {
    this.cleanupEventListeners();
  }

  #init() {
    if (!this.#ready) {
      this.#container = this.shadowRoot.querySelector('#current-path-root');
      this.#confirmationModal = this.shadowRoot.querySelector('confirmation-modal');
      this.#editOptionModal = this.shadowRoot.querySelector('edit-option-modal');
      this.setupEventListeners();
      this.#ready = true;
    }
  }

  setupEventListeners() {
    const addBtn = this.shadowRoot.querySelector('.add-btn');
    const editBtn = this.shadowRoot.querySelector('.edit-btn');
    const clearBtn = this.shadowRoot.querySelector('.clear-btn');
    if (addBtn && editBtn && clearBtn) {
      this.#boundHandleEdit = this.#handleEdit.bind(this);
      addBtn.addEventListener('click', this.#boundHandleEdit);
      editBtn.addEventListener('click', this.#boundHandleEdit);
      this.#boundHandleClear = this.#handleClear.bind(this);
      clearBtn.addEventListener('click', this.#boundHandleClear);
    }

    this.#boundHandleSave = this.#handleSave.bind(this);
    this.#editOptionModal.addEventListener('option-save', this.#boundHandleSave);

    this.#boundHandleConfirm = this.#handleConfirm.bind(this);
    this.#confirmationModal.addEventListener('confirm', this.#boundHandleConfirm);
  }

  cleanupEventListeners() {
    const addBtn = this.shadowRoot.querySelector('.add-btn');
    const editBtn = this.shadowRoot.querySelector('.edit-btn');
    const clearBtn = this.shadowRoot.querySelector('.clear-btn');
    if (addBtn && editBtn && clearBtn) {
      addBtn.removeEventListener('click', this.#boundHandleEdit);
      editBtn.removeEventListener('click', this.#boundHandleEdit);
      clearBtn.removeEventListener('click', this.#boundHandleClear);
      this.#boundHandleEdit = null;
      this.#boundHandleClear = null;
    }
    this.#editOptionModal.removeEventListener('option-save', this.#boundHandleSave);
    this.#boundHandleSave = null;
  }

  #handleConfirm(evt) {
    if (this.#confirmationAction === "clear") {
      DataStore.clearCurrentPath();
    }
    this.#confirmationAction = null;
    this.render();
  }

  #handleClear(evt) {
    this.#confirmationAction = "clear";
    this.#confirmationModal.showModal("Clear current path?");
  }

  #handleEdit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.#data) {
      this.#editOptionModal.data = this.#data;
      this.#editOptionModal.mode = "edit";
    } else {
      this.#editOptionModal.data = null;
      this.#editOptionModal.mode = "add";
    }
    this.#editOptionModal.open();
  }

  #handleSave(evt) {
    this.#data = evt.detail.option;
    DataStore.setCurrentPath(this.#data);
    this.render();
  }

  set data(data) {
    this.#data = data;
    if (data?.id) {
      this.dataset.id = data.id;
    }
    this.render();
  }

  get data() {
    return this.#data;
  }

  render() {
    const addBtn = this.#container.querySelector('.add-btn');
    const noCurrentPath = this.#container.querySelector('#no-current-path');
    const editActions = this.#container.querySelector('.edit-actions');
    const pathNameElement = this.#container.querySelector('#path-name');
    const bottomLineElement = this.#container.querySelector('#bottom-line');

    // abort is not initialized yet
    if (!this.#container) return;

    if (!this.#data) {
      // "add" mode: no current path set
      addBtn.classList.remove('u-hidden');
      noCurrentPath.classList.remove('u-hidden');
      editActions.classList.add('u-hidden');
      pathNameElement.textContent = '';
      bottomLineElement.textContent = '';
      return;
    }

    // "edit" mode: current path set
    addBtn.classList.add('u-hidden');
    noCurrentPath.classList.add('u-hidden');
    editActions.classList.remove('u-hidden');
    const { name, currency, yearNetIncome } = this.#data;
    
    const bottomLine = new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(yearNetIncome);
    pathNameElement.textContent = name;
    bottomLineElement.textContent = `Bottom Line: ${ bottomLine }`;
  }
}

customElements.define('current-path', CurrentPath);
declare global {
  interface HTMLElementTagNameMap {
    "current-path": CurrentPath;
  }
}
