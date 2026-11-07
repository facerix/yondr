/* web component for a crossroad summary */

const CSS = `
:host {
  display: block;
  border: 1px solid rgba(124, 0, 40, 0.3);
  border-radius: 4px;
  padding: 1em;
  background: rgba(124, 0, 40, 0.01);
  transition: background-color 0.2s ease;
}

.crossroad-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5em;

  text-decoration: none;
  color: inherit;
}

.action-buttons {
  position: relative;

  .action-buttons-inner {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: 0.25em;
  }
}

.close-btn, .edit-btn {
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

h3 {
  margin: 0;
  font-weight: 400;
  font-size: 1.5em;
  color: #7c0028;
}

.date-range {
  display: flex;
  gap: 0.5em;
}

.startDate, .endDate {
  font-size: 1em;
  color: rgba(124, 0, 40, 0.5);
}

.path-summary {
  margin: 0;
  font-size: 1em;
  color: rgba(124, 0, 40, 0.5);
}
`;

const TEMPLATE = `
<span class="action-buttons">
  <span class="action-buttons-inner">
    <button class="edit-btn">
      <img src="/images/edit.svg" alt="edit" />
    </button>
    <button class="close-btn">
        <img src="/images/close.svg" alt="close" />
    </button>
  </span>
</span>
<h3></h3>
<div class="date-range">
  <span class="startDate"></span>&ndash;<span class="endDate"></span>
</div>
<p class="path-summary">Paths: <span class="path-summary-list"></span></p>
`;

// Convert yyyy-mm-dd date string to Date object using locale timezone
// Creates a date at midnight in the user's local timezone
const dateStringToDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const formatDate = (dateString) => {
  let localDate = null;
  if (!dateString) return '';
  // If already in yyyy-mm-dd format, convert to Date using locale timezone
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    localDate = dateStringToDate(dateString);
  } else {
    // Fallback for other formats (for backwards compatibility)
    localDate = dateString instanceof Date ? dateString : new Date(dateString);
  }
  return localDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

class CrossroadSummary extends HTMLElement {
  #ready = false;
  #data = null;
  #container = null;
  #boundHandleRemove = null;
  #boundHandleEdit = null;

  constructor() {
    super();
  }

  connectedCallback() {
    // Create shadow root
    const shadow = this.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    styles.innerHTML = CSS;
    shadow.appendChild(styles);

    const container = document.createElement('a');
    container.className = 'crossroad-summary';
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
      this.#container = this.shadowRoot.querySelector('.crossroad-summary');
      this.setupEventListeners();
      this.#ready = true;
    }
  }

  #handleEdit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.dispatchEvent(new CustomEvent('crossroad-summary-edit', { 
      detail: { id: this.#data.id },
      bubbles: true,
      composed: true 
    }));
  }

  #handleRemove(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.dispatchEvent(new CustomEvent('crossroad-summary-remove', { 
      detail: { id: this.#data.id },
      bubbles: true,
      composed: true 
    }));
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

  setupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    if (closeBtn) {
      this.#boundHandleRemove = this.#handleRemove.bind(this);
      closeBtn.addEventListener('click', this.#boundHandleRemove);
    }
    const editBtn = this.shadowRoot.querySelector('.edit-btn');
    if (editBtn) {
      this.#boundHandleEdit = this.#handleEdit.bind(this);
      editBtn.addEventListener('click', this.#boundHandleEdit);
    }
  }

  cleanupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.#boundHandleRemove);
      this.#boundHandleRemove = null;
    }
    const editBtn = this.shadowRoot.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.removeEventListener('click', this.#boundHandleEdit);
      this.#boundHandleEdit = null;
    }
  }

  render() {
    if (!this.#container) return;
    this.#container.href = `/plan/?crossroad=${this.#data.id}`;
    this.#container.querySelector('h3').textContent = this.#data.name;
    this.#container.querySelector('.startDate').textContent = formatDate(this.#data.startDate);
    this.#container.querySelector('.endDate').textContent = this.#data.endDate ? formatDate(this.#data.endDate) : 'Present';

    const pathSummary = this.#data.paths?.length > 0 ? this.#data.paths.map(path => path.name).join(', ') : 'None yet';
    this.#container.querySelector('.path-summary-list').innerText = pathSummary;
  }
}

customElements.define('crossroad-summary', CrossroadSummary);
export {};

declare global {
  interface HTMLElementTagNameMap {
    "crossroad-summary": CrossroadSummary;
  }
}
