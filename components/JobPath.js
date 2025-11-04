/* web component for a job/relocation path */

const CSS = `
:host {
  --primary: #007bff;
  --green-500: #22c55e;
  --green-600: #16a34a;
  --green-400: #4ade80;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-600: #4b5563;
  --gray-700: #374151;
}

* {
  box-sizing: border-box;
}

.container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--gray-600);
}

@media (prefers-color-scheme: dark) {
  .close-btn:hover {
    color: #e5e7eb;
  }
}

.header {
  display: flex;
  flex-direction: column;
  padding-right: 1.5rem;
}

h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
}

.location {
  color: var(--gray-600);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

@media (prefers-color-scheme: dark) {
  .location {
    color: #d1d5db;
  }
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
}

.progress-track {
  width: 100%;
  height: 0.5rem;
  background-color: var(--gray-200);
  border-radius: 9999px;
  overflow: hidden;
}

@media (prefers-color-scheme: dark) {
  .progress-track {
    background-color: var(--gray-700);
  }
}

.progress-fill {
  height: 100%;
  background-color: var(--primary);
  border-radius: 9999px;
  transition: width 0.3s ease-out;
}

.bottom-line {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-200);
}

@media (prefers-color-scheme: dark) {
  .bottom-line {
    border-top-color: var(--gray-700);
  }
}

.bottom-line-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.bottom-line-label {
  font-weight: 500;
}

.bottom-line-value {
  font-weight: 700;
  font-size: 1.125rem;
}

.bottom-line-value.highlight {
  color: var(--green-600);
}

@media (prefers-color-scheme: dark) {
  .bottom-line-value.highlight {
    color: var(--green-400);
  }
}

.bottom-line-track {
  width: 100%;
  height: 0.625rem;
  background-color: var(--gray-200);
  border-radius: 9999px;
  overflow: hidden;
}

@media (prefers-color-scheme: dark) {
  .bottom-line-track {
    background-color: var(--gray-700);
  }
}

.bottom-line-fill {
  height: 100%;
  background-color: var(--green-500);
  border-radius: 9999px;
  transition: width 0.3s ease-out;
}
`;

const TEMPLATE = `
  <button class="close-btn" title="Remove path">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>

  <div class="header">
    <h3></h3>
    <p class="location"></p>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="metric-row">
        <span class="metric-label">Compensation</span>
        <span class="metric-value" data-field="compensation"></span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" data-field="compensation-fill"></div>
      </div>
    </div>

    <div class="metric">
      <div class="metric-row">
        <span class="metric-label">Cost of Living Index</span>
        <span class="metric-value" data-field="costOfLiving"></span>
      </div>
    </div>

    <div class="metric">
      <div class="metric-row">
        <span class="metric-label">Fixed Expenses</span>
        <span class="metric-value" data-field="expenses"></span>
      </div>
    </div>

    <div class="bottom-line">
      <div class="bottom-line-row">
        <span class="bottom-line-label">Bottom Line</span>
        <span class="bottom-line-value" data-field="bottomLine"></span>
      </div>
      <div class="bottom-line-track">
        <div class="bottom-line-fill" data-field="bottomLine-fill"></div>
      </div>
    </div>
  </div>
`;

class JobPath extends HTMLElement {
  #ready = false;
  #pathData = null;
  #allPaths = null;
  #container = null;
  #boundHandleRemove = null;
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
    container.className = 'container';
    container.innerHTML = TEMPLATE;
    shadow.appendChild(container);

    this.#init();
    this.render();
  }

  disconnectedCallback() {
    this.cleanupEventListeners();
  }

  #init() {
    if (!this.#ready) {
      // connect event handlers
      this.setupEventListeners();
      this.#container = this.shadowRoot.querySelector('.container');

      this.#ready = true;
    }
  }

  #transformPathData(path, allPaths) {
    // Calculate compensation (baseSalary + bonuses)
    const baseSalary = parseFloat(path.baseSalary) || 0;
    const bonuses = parseFloat(path.bonuses) || 0;
    const compensation = baseSalary + bonuses;
    
    // Use yearNetIncome as bottomLine, or calculate from compensation - fixedExpenses
    const yearNetIncome = parseFloat(path.yearNetIncome) || 0;
    const fixedExpenses = parseFloat(path.fixedExpenses) || 0;
    const bottomLine = yearNetIncome || Math.max(0, compensation - fixedExpenses);
    
    // Format currency for display
    const currency = path.currency || "USD";
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0
      }).format(amount);
    };
    
    // Calculate percentages relative to all paths
    const allCompensations = allPaths.map(p => {
      const bs = parseFloat(p.baseSalary) || 0;
      const bn = parseFloat(p.bonuses) || 0;
      return bs + bn;
    });
    const allBottomLines = allPaths.map(p => {
      const yn = parseFloat(p.yearNetIncome) || 0;
      const bs = parseFloat(p.baseSalary) || 0;
      const bn = parseFloat(p.bonuses) || 0;
      const fe = parseFloat(p.fixedExpenses) || 0;
      return yn || Math.max(0, (bs + bn) - fe);
    });
    
    const maxCompensation = Math.max(...allCompensations, compensation);
    const maxBottomLine = Math.max(...allBottomLines, bottomLine);
    
    const compensationPercentage = maxCompensation > 0 ? (compensation / maxCompensation) * 100 : 0;
    const bottomLinePercentage = maxBottomLine > 0 ? (bottomLine / maxBottomLine) * 100 : 0;
    
    return {
      name: path.name,
      location: path.location,
      compensation: formatCurrency(compensation),
      expenses: formatCurrency(fixedExpenses),
      bottomLine: formatCurrency(bottomLine),
      costOfLiving: path.costOfLiving || "—",
      compensationPercentage: compensationPercentage.toFixed(1),
      bottomLinePercentage: bottomLinePercentage.toFixed(1)
    };
  }

  render() {
    if (!this.#container || !this.#pathData || !this.#allPaths) return;
    
    const transformed = this.#transformPathData(this.#pathData, this.#allPaths);
    
    this.#container.querySelector('h3').textContent = transformed.name;
    this.#container.querySelector('.location').textContent = transformed.location;
    this.#container.querySelector('[data-field="compensation"]').textContent = transformed.compensation;
    this.#container.querySelector('[data-field="compensation-fill"]').style.width = transformed.compensationPercentage + '%';
    this.#container.querySelector('[data-field="costOfLiving"]').textContent = transformed.costOfLiving;
    this.#container.querySelector('[data-field="expenses"]').textContent = transformed.expenses;
    this.#container.querySelector('[data-field="bottomLine"]').textContent = transformed.bottomLine;
    this.#container.querySelector('[data-field="bottomLine-fill"]').style.width = transformed.bottomLinePercentage + '%';
  }

  #handleRemove() {
    this.dispatchEvent(new CustomEvent('path-remove', {
      detail: { path: this.#pathData },
      bubbles: true,
      composed: true 
    }));
  }

  setupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    this.#boundHandleRemove = this.#handleRemove.bind(this);
    if (closeBtn) {
      closeBtn.addEventListener('click', this.#boundHandleRemove);
    }   
  }

  cleanupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.#boundHandleRemove);
    }
  }

  set pathData(data) {
    this.#pathData = data;
    this.render();
  }

  get pathData() {
    return this.#pathData;
  }

  set allPaths(paths) {
    this.#allPaths = paths;
    this.render();
  }

  get allPaths() {
    return this.#allPaths;
  }

}

// Register the custom element
customElements.define('job-path', JobPath);

export default JobPath;
