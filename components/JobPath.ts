/* web component for a job/relocation path */

import DataStore from "../src/DataStore.js";
import { CurrencyClient } from "../src/currencyClient.js";
import "./PopoverInfo.js";
import { formatEquityGrant, formatEquityTerms, formatJobOptionName, hasConcreteSalary, sortTimeline, validateHttpUrl } from '../src/jobPathModel.js';
import { renderNoteMarkdown } from '../src/noteMarkdown.js';

const CSS = `
:host {
  display: block;
  --primary-color: #7c0028;
  --border-color: rgba(124, 0, 40, 0.3);
  --focus-color: rgba(124, 0, 40, 0.5);
  --text-muted: rgba(124, 0, 40, 0.5);
  --best-color: #007c54; /* was #517c00 */
  --background-subtle: rgba(124, 0, 40, 0.01);
}

:host([is-current]) .container {
  border: 2px solid var(--primary-color);
  box-shadow: 0 2px 6px rgba(124, 0, 40, 0.2);
}

:host([is-current]) .current-badge {
  display: inline;
}

:host([has-best-bottom-line]) {
  .container {
    border: 2px solid var(--best-color);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    background: rgba(34, 197, 94, 0.03);
  }

  .best-badge {
    display: inline;
  }
  
  .bottom-line-value {
    color: var(--best-color);
    font-weight: 600;
  }

  .bottom-line-track {
    background-color: var(--best-color);
  }

  .bottom-line-fill {
    background-color: var(--best-color);
  }
}


* {
  box-sizing: border-box;
}

.container {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1em;
  background: var(--background-subtle);
  transition: background-color 0.2s ease;
  font-family: Futura, "Trebuchet MS", Arial, sans-serif;
}

.current-badge {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 1;
  transform: rotate(-90deg) translateX(-100%);
  transform-origin: top left;
}

.best-badge {
  display: none;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: var(--best-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 1;
}

.action-buttons {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25em;
  align-items: center;
}

.edit-btn,
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn img,
.close-btn img {
  width: 1.5em;
  height: 1.5em;
  filter: brightness(0) saturate(100%) invert(28%) sepia(100%) saturate(1000%) hue-rotate(326deg) brightness(96%) contrast(101%);
}

.edit-btn:hover,
.close-btn:hover {
  cursor: pointer;
}

.edit-btn:focus,
.close-btn:focus {
  outline: none;
}

.edit-btn:active,
.close-btn:active {
  transform: scale(0.98);
}

.edit-btn:focus-visible,
.close-btn:focus-visible {
  outline: 2px double var(--focus-color);
  outline-offset: -4px;
}

.header {
  display: flex;
  flex-direction: column;
  padding-right: 3.5rem;
}

:host([is-current]) .header {
  padding-left: 2rem;
}

:host([has-best-bottom-line]) .action-buttons {
  top: 3rem;
}

:host([readonly]) .action-buttons {
  display: none;
}

h3 {
  font-size: 1.5em;
  font-weight: 400;
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
  color: var(--primary-color);
}

.location {
  color: var(--text-muted);
  margin: 0 0 1rem 0;
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  flex-wrap: wrap;
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
  font-size: 0.95em;
  font-weight: 500;
  color: var(--primary-color);
}

.metric-value {
  font-size: 0.95em;
  font-weight: 500;
}

.progress-track {
  width: 100%;
  height: 0.5rem;
  background-color: rgba(124, 0, 40, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease-out;
}

.bottom-line {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.bottom-line-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.bottom-line-label {
  font-weight: 500;
  color: var(--primary-color);
}

.bottom-line-value {
  font-weight: 500;
  font-size: 1.125rem;
  color: var(--primary-color);
}

.bottom-line-track {
  width: 100%;
  height: 0.625rem;
  background-color: rgba(124, 0, 40, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bottom-line-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease-out;
}

.job-meta, .latest-note { margin: 0.25em 0 0.75em; color: var(--primary-color); }
.equity { overflow-wrap: anywhere; }
.equity .metric-row { align-items: flex-start; gap: 0.75em; }
.equity .metric-value { text-align: right; }
.equity small { display: block; color: var(--text-muted); }
.job-link { overflow-wrap: anywhere; }
.timeline { margin-top: 1em; border-top: 1px solid var(--border-color); padding-top: 0.75em; }
.timeline ol { padding-left: 1.4em; }
.timeline li { margin: 0.5em 0; overflow-wrap: anywhere; }
.note-body { margin: 0.25em 0; color: #333; }
.note-body p { margin: 0.25em 0; }
.note-body ul { margin: 0.25em 0; padding-left: 1.4em; }
.timeline-form { display: grid; gap: 0.5em; }
.timeline-form textarea { min-height: 4em; resize: vertical; }
.timeline-form input, .timeline-form textarea { width: 100%; box-sizing: border-box; }
.timeline button { margin-right: 0.5em; }
[hidden] { display: none !important; }
`;

const TEMPLATE = `
  <div class="current-badge">Current</div>
  <div class="best-badge">Best</div>
  <div class="action-buttons">
    <button class="edit-btn" title="Edit path">
      <img src="/images/edit.svg" alt="edit" />
    </button>
    <button class="close-btn" title="Remove path">
      <img src="/images/close.svg" alt="close" />
    </button>
  </div>

  <div class="header">
    <h3></h3>
    <p class="location"></p>
    <p class="job-meta"></p>
    <a class="job-link" hidden target="_blank" rel="noopener noreferrer">Job listing</a>
    <p class="latest-note"></p>
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

    <div class="metric equity" hidden>
      <div class="metric-row">
        <span class="metric-label">Equity</span>
        <span class="metric-value equity-summary"></span>
      </div>
      <small class="equity-details"></small>
    </div>

    <div class="metric">
      <div class="metric-row">
        <span class="metric-label">Fixed Expenses</span>
        <span class="metric-value" data-field="expenses"></span>
      </div>
    </div>

    <div class="metric">
      <div class="metric-row">
        <span class="metric-label">Total Taxes</span>
        <span class="metric-value" data-field="taxes"></span>
      </div>
    </div>

    <div class="metric">
      <div class="metric-row">
        <span class="metric-label">Est. Cost of Living Spend</span>
        <span class="metric-value" data-field="costOfLivingSpend"></span>
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
  <details class="timeline">
    <summary>Timeline and notes</summary>
    <ol></ol>
    <form class="timeline-form" hidden>
      <label>Date <input type="date" name="date" required /></label>
      <label>Title <input type="text" name="title" required /></label>
      <label>Note <textarea name="note" required></textarea></label>
      <small>Markdown supported: **bold**, *italic*, links, headings, and lists.</small>
      <label>Link (optional) <input type="url" name="url" placeholder="https://…" /></label>
      <p class="timeline-error" role="alert"></p>
      <div><button type="submit">Save note</button><button type="button" class="cancel-note">Cancel</button></div>
    </form>
    <button type="button" class="add-note">Add note</button>
  </details>
`;

class JobPath extends HTMLElement {
  #ready = false;
  #pathData = null;
  #maxCompensation = 0;
  #maxBottomLine = 0;
  #container = null;
  #boundHandleRemove = null;
  #boundHandleEdit = null;
  #editingEntryId = null;
  #isCurrent = false;
  #readonly = false;
  #hasBestBottomLine = false;
  #comparison = null;
  #currencyClient = null;
  constructor() {
      super();
      this.#currencyClient = new CurrencyClient();
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
      this.#container = this.shadowRoot.querySelector('.container');
      this.setupEventListeners();

      this.#ready = true;
    }
  }

  async #transformPathData(path, maxCompensation, maxBottomLine) {
    const concrete = hasConcreteSalary(path);
    // Calculate compensation (baseSalary + bonuses)
    const baseSalary = parseFloat(path.baseSalary) || 0;
    const bonuses = parseFloat(path.bonuses) || 0;
    const compensation = baseSalary + bonuses;
    
    // Get fixed expenses from user settings (global)
    const userSettings = DataStore.getUserSettings();
    const fixedExpenses = parseFloat(userSettings.fixedExpenses) || 0;
    const fixedExpensesCurrency = userSettings.fixedExpensesCurrency || "USD";
    
    // Format currency for display - use job location currency
    const currency = path.currency || "USD";
    
    // Convert fixed expenses to job currency if necessary
    let convertedFixedExpenses = fixedExpenses;
    if (fixedExpensesCurrency !== currency && fixedExpenses > 0) {
      try {
        const exchangeRate = await this.#currencyClient.getExchangeRate(fixedExpensesCurrency, currency);
        convertedFixedExpenses = fixedExpenses * exchangeRate;
      } catch (error) {
        console.error(`Error converting fixed expenses from ${fixedExpensesCurrency} to ${currency}:`, error);
        // Fall back to original value if conversion fails
        convertedFixedExpenses = fixedExpenses;
      }
    }
    
    // Convert compensation to job currency if baseSalary/bonuses are in different currency
    // For now, assume compensation is already in job currency (stored with the path)
    // This is a simplification - if needed, we could add currency fields to baseSalary/bonuses
    
    // Get US tax (stored in USD, needs conversion to job currency if different)
    const usTax = parseFloat(path.usTax) || 0;
    let convertedTax = usTax;
    // US tax is stored in USD, so convert to job currency if needed
    if (currency !== "USD" && usTax > 0) {
      try {
        const exchangeRate = await this.#currencyClient.getExchangeRate("USD", currency);
        convertedTax = usTax * exchangeRate;
      } catch (error) {
        console.error(`Error converting US tax from USD to ${currency}:`, error);
        // Fall back to original value if conversion fails
        convertedTax = usTax;
      }
    }
    
    // Get cost of living spend from stored path data (calculated when path was saved)
    const costOfLivingSpend = path.costOfLivingSpend !== null && path.costOfLivingSpend !== undefined 
      ? parseFloat(path.costOfLivingSpend) 
      : null;
    
    // Use yearNetIncome as bottomLine, or calculate from compensation - convertedFixedExpenses
    const yearNetIncome = parseFloat(path.yearNetIncome) || 0;
    const bottomLine = path.yearNetIncome !== null && path.yearNetIncome !== undefined && path.yearNetIncome !== ''
      ? yearNetIncome : Math.max(0, compensation - convertedFixedExpenses);
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0
      }).format(amount);
    };
    
    // Calculate percentages using the passed max values
    const compensationPercentage = maxCompensation > 0 ? (compensation / maxCompensation) * 100 : 0;
    const bottomLinePercentage = maxBottomLine > 0 ? (bottomLine / maxBottomLine) * 100 : 0;
    
    return {
      name: formatJobOptionName(path),
      location: path.location,
      compensation: concrete ? formatCurrency(compensation) : this.#formatSalaryRange(path, formatCurrency),
      expenses: formatCurrency(convertedFixedExpenses),
      taxes: concrete ? formatCurrency(convertedTax) : '—',
      bottomLine: concrete ? formatCurrency(bottomLine) : '—',
      costOfLiving: path.costOfLiving || "—",
      costOfLivingSpend: costOfLivingSpend !== null ? formatCurrency(costOfLivingSpend) : "—",
      compensationPercentage: concrete ? compensationPercentage.toFixed(1) : '0',
      bottomLinePercentage: concrete ? bottomLinePercentage.toFixed(1) : '0'
    };
  }

  #formatSalaryRange(path, formatCurrency) {
    if (path.salaryMin != null && path.salaryMin !== '' && path.salaryMax != null && path.salaryMax !== '') {
      return `${formatCurrency(Number(path.salaryMin))}–${formatCurrency(Number(path.salaryMax))} range`;
    }
    if (path.salaryMin != null && path.salaryMin !== '') return `From ${formatCurrency(Number(path.salaryMin))}`;
    if (path.salaryMax != null && path.salaryMax !== '') return `Up to ${formatCurrency(Number(path.salaryMax))}`;
    return 'Not yet known';
  }

  async render() {
    if (!this.#container || !this.#pathData) return;
    
    const transformed = await this.#transformPathData(this.#pathData, this.#maxCompensation, this.#maxBottomLine);
    
    this.#container.querySelector('h3').textContent = transformed.name;
    const locationEl = this.#container.querySelector('.location');
    
    locationEl.textContent = transformed.location || '';
    if (transformed.costOfLiving && transformed.costOfLiving !== '—') {
      locationEl.append(document.createTextNode(` (${transformed.costOfLiving})`));
    }
    const path = this.#pathData;
    const meta = [path.workPolicy === 'in-office' ? 'In office' : path.workPolicy === 'hybrid' ? `Hybrid · ${path.officeDays ?? '?'} office days/week` : path.workPolicy === 'remote' ? 'Remote' : '', this.#readonly ? '' : (path.status || 'Interested')].filter(Boolean);
    this.#container.querySelector('.job-meta').textContent = meta.join(' · ');
    const equityElement = this.#container.querySelector('.equity');
    equityElement.hidden = !path.equity?.type;
    if (path.equity?.type) {
      equityElement.querySelector('.equity-summary').textContent = formatEquityGrant(path.equity);
      const details = [formatEquityTerms(path.equity), path.equity.vestingStart ? `Starts ${path.equity.vestingStart}` : '', path.equity.notes || '', 'Excluded from cash totals'].filter(Boolean);
      equityElement.querySelector('.equity-details').textContent = details.join(' · ');
    }
    const listing = this.#container.querySelector('.job-link');
    try {
      listing.href = validateHttpUrl(path.listingUrl);
      listing.hidden = !path.listingUrl;
    } catch { listing.hidden = true; listing.removeAttribute('href'); }
    const entries = sortTimeline(path.timeline || []);
    this.#container.querySelector('.latest-note').textContent = entries.length ? `Latest: ${entries[0].date} · ${entries[0].title || entries[0].note.split('\n')[0]}` : '';
    this.#renderTimeline(entries);
    this.#container.querySelector('.timeline').hidden = this.#readonly && entries.length === 0;
    const comparison = this.#comparison;
    const format = value => new Intl.NumberFormat(undefined, { style: 'currency', currency: path.currency || 'USD', maximumFractionDigits: 0 }).format(value);
    this.#container.querySelector('[data-field="compensation"]').textContent = comparison?.projected ? `${format(comparison.compensation)} projected` : transformed.compensation;
    this.#container.querySelector('[data-field="compensation-fill"]').style.width = comparison && this.#maxCompensation > 0 ? `${Math.min(100, comparison.referenceCompensation / this.#maxCompensation * 100)}%` : '0%';
    this.#container.querySelector('.metric .progress-track').hidden = !comparison;
    this.#container.querySelector('[data-field="costOfLivingSpend"]').textContent = comparison?.livingCost == null ? '—' : format(comparison.livingCost);
    this.#container.querySelector('[data-field="costOfLivingSpend"]').previousElementSibling.textContent = comparison?.livingMode === 'commute' ? 'Current Living Costs' : 'Est. Cost of Living Spend';
    this.#container.querySelector('[data-field="expenses"]').textContent = comparison ? format(comparison.fixedExpenses) : transformed.expenses;
    this.#container.querySelector('[data-field="taxes"]').textContent = comparison ? format(comparison.tax) : transformed.taxes;
    this.#container.querySelector('[data-field="bottomLine"]').textContent = comparison?.bottomLine == null ? '—' : `${format(comparison.bottomLine)}${comparison.projected ? ' projected' : ''}`;
    this.#container.querySelector('[data-field="bottomLine-fill"]').style.width = comparison?.referenceBottomLine != null && this.#maxBottomLine > 0 ? `${Math.min(100, comparison.referenceBottomLine / this.#maxBottomLine * 100)}%` : '0%';
    this.#container.querySelector('.bottom-line').hidden = !comparison;
    this.#container.querySelector('.bottom-line-label').textContent = comparison?.livingMode === 'commute' ? 'Bottom Line · Commute' : 'Bottom Line · Relocate';
  }

  #renderTimeline(entries) {
    const list = this.#container.querySelector('.timeline ol');
    list.replaceChildren();
    for (const entry of entries) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${entry.date} · ${entry.title || entry.note.split('\n')[0]}`;
      item.append(label);
      const body = document.createElement('div');
      body.className = 'note-body';
      body.innerHTML = renderNoteMarkdown(entry.note);
      item.append(body);
      if (entry.url) {
        try {
          const link = document.createElement('a');
          link.href = validateHttpUrl(entry.url);
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = 'Link';
          item.append(link);
        } catch { /* Invalid legacy links are not opened. */ }
      }
      if (!this.#readonly) {
        for (const [text, action] of [['Edit', 'edit'], ['Delete', 'delete']]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = text;
          button.addEventListener('click', () => action === 'edit' ? this.#openNoteForm(entry) : this.#emitTimeline('timeline-delete', { entryId: entry.id }));
          item.append(button);
        }
      }
      list.append(item);
    }
    this.#container.querySelector('.add-note').hidden = this.#readonly;
  }

  #openNoteForm(entry = null) {
    const form = this.#container.querySelector('.timeline-form');
    this.#editingEntryId = entry?.id || null;
    form.hidden = false;
    this.#container.querySelector('.add-note').hidden = true;
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    form.elements.date.value = entry?.date || localDate;
    form.elements.title.value = entry?.title || entry?.note?.split('\n')[0] || '';
    form.elements.note.value = entry?.note || '';
    form.elements.url.value = entry?.url || '';
    form.querySelector('.timeline-error').textContent = '';
    form.elements.note.focus();
  }

  #emitTimeline(type, payload) {
    this.dispatchEvent(new CustomEvent(type, { detail: { pathId: this.#pathData.id, ...payload }, bubbles: true, composed: true }));
  }

  #handleRemove() {
    this.dispatchEvent(new CustomEvent('path-remove', {
      detail: { path: this.#pathData },
      bubbles: true,
      composed: true 
    }));
  }

  #handleEdit() {
    this.dispatchEvent(new CustomEvent('path-edit', {
      detail: { path: this.#pathData },
      bubbles: true,
      composed: true 
    }));
  }

  setupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const editBtn = this.shadowRoot.querySelector('.edit-btn');
    this.#boundHandleRemove = this.#handleRemove.bind(this);
    this.#boundHandleEdit = this.#handleEdit.bind(this);
    if (closeBtn) {
      closeBtn.addEventListener('click', this.#boundHandleRemove);
    }
    if (editBtn) {
      editBtn.addEventListener('click', this.#boundHandleEdit);
    }
    this.#container.querySelector('.add-note').addEventListener('click', () => this.#openNoteForm());
    this.#container.querySelector('.cancel-note').addEventListener('click', () => {
      this.#container.querySelector('.timeline-form').hidden = true;
      this.#container.querySelector('.add-note').hidden = false;
    });
    this.#container.querySelector('.timeline-form').addEventListener('submit', evt => {
      evt.preventDefault();
      const form = evt.currentTarget;
      const entry = { id: this.#editingEntryId, date: form.elements.date.value, title: form.elements.title.value.trim(), note: form.elements.note.value.trim(), url: form.elements.url.value.trim() };
      try { validateHttpUrl(entry.url); } catch (error) { form.querySelector('.timeline-error').textContent = error.message; return; }
      this.#emitTimeline(this.#editingEntryId ? 'timeline-update' : 'timeline-add', { entry });
      form.hidden = true;
    });
  }

  cleanupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const editBtn = this.shadowRoot.querySelector('.edit-btn');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.#boundHandleRemove);
    }
    if (editBtn) {
      editBtn.removeEventListener('click', this.#boundHandleEdit);
    }
  }

  set pathData(data) {
    this.#pathData = data;
    this.render();
  }

  set comparison(value) {
    this.#comparison = value;
    this.render();
  }

  get pathData() {
    return this.#pathData;
  }

  set maxCompensation(value) {
    this.#maxCompensation = parseFloat(String(value)) || 0;
    this.render();
  }

  get maxCompensation() {
    return this.#maxCompensation;
  }

  set maxBottomLine(value) {
    this.#maxBottomLine = parseFloat(String(value)) || 0;
    this.render();
  }

  get maxBottomLine() {
    return this.#maxBottomLine;
  }

  set isCurrent(value) {
    this.#isCurrent = Boolean(value);
    if (this.#isCurrent) {
      this.setAttribute('is-current', '');
    } else {
      this.removeAttribute('is-current');
    }
  }

  get isCurrent() {
    return this.#isCurrent;
  }

  set readonly(value) {
    this.#readonly = Boolean(value);
    if (this.#readonly) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
    if (this.#pathData) this.render();
  }

  get readonly() {
    return this.#readonly;
  }

  set hasBestBottomLine(value) {
    this.#hasBestBottomLine = Boolean(value);
    if (this.#hasBestBottomLine) {
      this.setAttribute('has-best-bottom-line', '');
    } else {
      this.removeAttribute('has-best-bottom-line');
    }
  }

  get hasBestBottomLine() {
    return this.#hasBestBottomLine;
  }

}

// Register the custom element
customElements.define('job-path', JobPath);

export default JobPath;

declare global {
  interface HTMLElementTagNameMap {
    "job-path": JobPath;
  }
}
