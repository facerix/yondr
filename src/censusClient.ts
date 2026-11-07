// provides a simple client for the U.S. Census Bureau API
// Uses American Community Survey (ACS) data to estimate cost of living
// API documentation: https://www.census.gov/data/developers/guidance/api-user-guide.html

export class CensusClient {
  baseUrl: string;
  cachedData = {};
  localStorageKey = 'censusCostOfLiving';
  lastUpdated = null;

  constructor() {
    this.baseUrl = 'https://api.census.gov/data';
    this.loadFromLocalStorage();
  }

  loadFromLocalStorage() {
    const stored = window.localStorage.getItem(this.localStorageKey) || '{}';
    const parsed = JSON.parse(stored);
    this.cachedData = parsed.data || {};
    this.lastUpdated = parsed.lastUpdated || null;
  }

  saveToLocalStorage() {
    const data = {
      data: this.cachedData,
      lastUpdated: this.getCurrentDate()
    };
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    this.lastUpdated = data.lastUpdated;
  }

  getCurrentDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  isDataStale(location) {
    if (!this.lastUpdated) {
      return true;
    }
    // Census data is updated annually, cache for 365 days
    const cacheDays = 365;
    const lastUpdatedDate = new Date(this.lastUpdated);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= cacheDays;
  }

  cacheLocationData(location, data) {
    const normalizedLocation = this.normalizeLocation(location);
    this.cachedData[normalizedLocation] = {
      costOfLivingIndex: data.costOfLivingIndex,
      medianRent: data.medianRent,
      medianIncome: data.medianIncome,
      lastUpdated: this.getCurrentDate()
    };
    this.saveToLocalStorage();
  }

  normalizeLocation(location) {
    // Normalize location string for consistent caching
    // Remove state/country for better matching
    return location.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
  }

  /**
   * Estimates cost of living index from Census data
   * Uses median rent and median income relative to national averages
   * NYC is used as baseline (index 100)
   */
  estimateCostOfLivingIndex(medianRent, medianIncome) {
    if (!medianRent || !medianIncome) {
      return null;
    }

    // National averages (approximate, from 2020-2023 ACS data)
    const nationalMedianRent = 1400; // Approximate national median rent
    const nationalMedianIncome = 70000; // Approximate national median income
    
    // NYC baseline (index 100)
    const nycRent = 2400;
    const nycIncome = 70000;

    // Calculate rent ratio (weighted 60%) and income ratio (weighted 40%)
    // Higher rent + lower income relative to NYC = higher cost of living
    const rentRatio = (medianRent / nycRent) * 100;
    const incomeRatio = (nycIncome / medianIncome) * 100; // Inverted: lower income = higher COL
    
    // Weighted average
    const estimatedIndex = Math.round((rentRatio * 0.6) + (incomeRatio * 0.4));
    
    return estimatedIndex;
  }

  /**
   * Fetches cost of living data for a U.S. city using Census Bureau API
   * @param {string} location - City name with state, e.g., "San Francisco, CA" or "New York, NY"
   * @returns {Promise<{costOfLivingIndex: number, medianRent: number, medianIncome: number}>}
   */
  async getCostOfLiving(location) {
    if (!location || !location.trim()) {
      throw new Error('Location is required');
    }

    const normalizedLocation = this.normalizeLocation(location);

    // Check cache first
    if (this.cachedData[normalizedLocation] && !this.isDataStale(normalizedLocation)) {
      return {
        costOfLivingIndex: this.cachedData[normalizedLocation].costOfLivingIndex,
        medianRent: this.cachedData[normalizedLocation].medianRent,
        medianIncome: this.cachedData[normalizedLocation].medianIncome
      };
    }

    try {
      // Parse location to extract city and state
      const locationParts = location.split(',').map(s => s.trim());
      if (locationParts.length < 2) {
        throw new Error('Location must include city and state (e.g., "San Francisco, CA")');
      }

      const cityName = locationParts[0];
      const stateAbbr = locationParts[1].toUpperCase();

      // Use ACS 5-year estimates for more reliable data
      // Variables: B25064_001E (median gross rent), B19013_001E (median household income)
      const year = new Date().getFullYear() - 1; // Use last year's data
      const dataset = 'acs/acs5';
      
      // For metro areas, we'd need to use MSA codes, which is more complex
      // For now, we'll try to get data for the city directly
      // Note: This is a simplified approach - actual implementation may need geocoding
      
      // Using a simpler approach: we'll need the city's FIPS code
      // For production, you'd want to geocode the city name to get its FIPS code first
      // This is a placeholder that shows the structure
      
      // For now, return null to indicate we need the static dataset fallback
      // In a full implementation, you'd:
      // 1. Geocode city name to get FIPS code
      // 2. Query Census API with proper geographic identifiers
      // 3. Calculate cost of living index from the returned data
      
      console.warn('Census API requires geocoding for full implementation. Using static dataset fallback.');
      return null;
      
    } catch (error) {
      console.error('Error fetching cost of living data from Census API:', error);
      throw error;
    }
  }
}

