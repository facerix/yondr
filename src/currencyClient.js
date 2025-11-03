// provides a simple client for the Frankfurter API at https://frankfurter.dev/

export class CurrencyClient {
  cachedRates = {};
  localStorageKey = 'currencyRates';
  lastUpdated = null;

  constructor() {
    this.baseUrl = 'https://api.frankfurter.dev';
    this.apiVersion = 'v1';
    this.loadFromLocalStorage();
  }

  loadFromLocalStorage() {
    const stored = window.localStorage.getItem(this.localStorageKey) || '{}';
    this.cachedRates = JSON.parse(stored);
    this.lastUpdated = this.cachedRates.lastUpdated || null;
  }

  saveToLocalStorage() {
    const data = {
      rates: this.cachedRates,
      lastUpdated: this.getCurrentDate()
    };
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    this.lastUpdated = data.lastUpdated;
  }

  getCurrentDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  isDataStale() {
    if (!this.lastUpdated) {
      return true;
    }
    return this.lastUpdated < this.getCurrentDate();
  }

  cacheRate(from, to, rate) {
    if (!this.cachedRates[from]) {
      this.cachedRates[from] = {};
    }
    this.cachedRates[from][to] = rate;
    this.saveToLocalStorage();
  }

  async getExchangeRate(from, to) {
    // Check if we have a cached rate and it's not stale
    if (this.cachedRates[from] && this.cachedRates[from][to] && !this.isDataStale()) {
      return this.cachedRates[from][to];
    }
    
    // Fetch fresh data from API
    const url = `${this.baseUrl}/${this.apiVersion}/latest?base=${from}&symbols=${to}`;
    const response = await fetch(url);
    const data = await response.json();
    this.cacheRate(from, to, data.rates[to]);
    return this.cachedRates[from][to];
  }
}