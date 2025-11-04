// Static cost of living index dataset
// Index values are relative to NYC (100) as baseline
// Data sources: Various public sources (Numbeo, Expatistan, C2ER, etc.)
// Updated: 2024

export const costOfLivingData = {
  // United States Cities (75 major metro areas)
  // All US cities use USD currency
  us: [
    { city: "New York, NY", index: 100.0, region: "Northeast", currency: "USD" },
    { city: "San Francisco, CA", index: 95.3, region: "West", currency: "USD" },
    { city: "Boston, MA", index: 87.3, region: "Northeast", currency: "USD" },
    { city: "Washington, DC", index: 85.8, region: "South", currency: "USD" },
    { city: "Seattle, WA", index: 83.5, region: "West", currency: "USD" },
    { city: "Los Angeles, CA", index: 83.2, region: "West", currency: "USD" },
    { city: "San Diego, CA", index: 82.5, region: "West", currency: "USD" },
    { city: "San Jose, CA", index: 81.2, region: "West", currency: "USD" },
    { city: "Oakland, CA", index: 80.8, region: "West", currency: "USD" },
    { city: "Miami, FL", index: 80.1, region: "South", currency: "USD" },
    { city: "Chicago, IL", index: 78.5, region: "Midwest", currency: "USD" },
    { city: "Philadelphia, PA", index: 76.2, region: "Northeast", currency: "USD" },
    { city: "Portland, OR", index: 75.8, region: "West", currency: "USD" },
    { city: "Denver, CO", index: 75.3, region: "West", currency: "USD" },
    { city: "Austin, TX", index: 74.2, region: "South", currency: "USD" },
    { city: "Atlanta, GA", index: 73.8, region: "South", currency: "USD" },
    { city: "Sacramento, CA", index: 73.5, region: "West", currency: "USD" },
    { city: "Minneapolis, MN", index: 73.2, region: "Midwest", currency: "USD" },
    { city: "Baltimore, MD", index: 72.8, region: "South", currency: "USD" },
    { city: "Tampa, FL", index: 72.5, region: "South", currency: "USD" },
    { city: "Nashville, TN", index: 72.1, region: "South", currency: "USD" },
    { city: "Raleigh, NC", index: 71.8, region: "South", currency: "USD" },
    { city: "Charlotte, NC", index: 71.5, region: "South", currency: "USD" },
    { city: "Dallas, TX", index: 71.2, region: "South", currency: "USD" },
    { city: "Houston, TX", index: 70.8, region: "South", currency: "USD" },
    { city: "Phoenix, AZ", index: 70.5, region: "West", currency: "USD" },
    { city: "Las Vegas, NV", index: 70.2, region: "West", currency: "USD" },
    { city: "Orlando, FL", index: 69.8, region: "South", currency: "USD" },
    { city: "Kansas City, MO", index: 69.5, region: "Midwest", currency: "USD" },
    { city: "St. Louis, MO", index: 69.2, region: "Midwest", currency: "USD" },
    { city: "Columbus, OH", index: 68.8, region: "Midwest", currency: "USD" },
    { city: "Cincinnati, OH", index: 68.5, region: "Midwest", currency: "USD" },
    { city: "Cleveland, OH", index: 68.2, region: "Midwest", currency: "USD" },
    { city: "Pittsburgh, PA", index: 67.8, region: "Northeast", currency: "USD" },
    { city: "Detroit, MI", index: 67.5, region: "Midwest", currency: "USD" },
    { city: "Milwaukee, WI", index: 67.2, region: "Midwest", currency: "USD" },
    { city: "Indianapolis, IN", index: 66.8, region: "Midwest", currency: "USD" },
    { city: "Louisville, KY", index: 66.5, region: "South", currency: "USD" },
    { city: "Memphis, TN", index: 66.2, region: "South", currency: "USD" },
    { city: "New Orleans, LA", index: 65.8, region: "South", currency: "USD" },
    { city: "Birmingham, AL", index: 65.5, region: "South", currency: "USD" },
    { city: "Jacksonville, FL", index: 65.2, region: "South", currency: "USD" },
    { city: "Richmond, VA", index: 64.8, region: "South", currency: "USD" },
    { city: "Norfolk, VA", index: 64.5, region: "South", currency: "USD" },
    { city: "Virginia Beach, VA", index: 64.2, region: "South", currency: "USD" },
    { city: "Raleigh-Durham, NC", index: 71.8, region: "South", currency: "USD" },
    { city: "Greensboro, NC", index: 64.5, region: "South", currency: "USD" },
    { city: "Columbia, SC", index: 64.2, region: "South", currency: "USD" },
    { city: "Charleston, SC", index: 64.8, region: "South", currency: "USD" },
    { city: "Savannah, GA", index: 64.5, region: "South", currency: "USD" },
    { city: "Tallahassee, FL", index: 64.2, region: "South", currency: "USD" },
    { city: "Gainesville, FL", index: 63.8, region: "South", currency: "USD" },
    { city: "Tucson, AZ", index: 68.5, region: "West", currency: "USD" },
    { city: "Albuquerque, NM", index: 68.2, region: "West", currency: "USD" },
    { city: "El Paso, TX", index: 64.8, region: "West", currency: "USD" },
    { city: "San Antonio, TX", index: 68.5, region: "South", currency: "USD" },
    { city: "Oklahoma City, OK", index: 66.2, region: "South", currency: "USD" },
    { city: "Tulsa, OK", index: 65.8, region: "South", currency: "USD" },
    { city: "Little Rock, AR", index: 64.5, region: "South", currency: "USD" },
    { city: "Wichita, KS", index: 64.2, region: "Midwest", currency: "USD" },
    { city: "Omaha, NE", index: 67.5, region: "Midwest", currency: "USD" },
    { city: "Des Moines, IA", index: 66.8, region: "Midwest", currency: "USD" },
    { city: "Fargo, ND", index: 65.5, region: "Midwest", currency: "USD" },
    { city: "Sioux Falls, SD", index: 65.2, region: "Midwest", currency: "USD" },
    { city: "Minneapolis-St. Paul, MN", index: 73.2, region: "Midwest", currency: "USD" },
    { city: "Madison, WI", index: 68.5, region: "Midwest", currency: "USD" },
    { city: "Ann Arbor, MI", index: 72.5, region: "Midwest", currency: "USD" },
    { city: "Grand Rapids, MI", index: 66.2, region: "Midwest", currency: "USD" },
    { city: "Buffalo, NY", index: 68.5, region: "Northeast", currency: "USD" },
    { city: "Rochester, NY", index: 67.8, region: "Northeast", currency: "USD" },
    { city: "Albany, NY", index: 67.2, region: "Northeast", currency: "USD" },
    { city: "Hartford, CT", index: 74.5, region: "Northeast", currency: "USD" },
    { city: "Providence, RI", index: 73.8, region: "Northeast", currency: "USD" },
    { city: "Burlington, VT", index: 72.2, region: "Northeast", currency: "USD" },
    { city: "Portland, ME", index: 71.5, region: "Northeast", currency: "USD" },
  ],
  
  // International Cities (25 major cities)
  international: [
    { city: "Zurich, Switzerland", index: 132.5, country: "Switzerland", currency: "CHF" },
    { city: "Geneva, Switzerland", index: 125.8, country: "Switzerland", currency: "CHF" },
    { city: "London, United Kingdom", index: 118.5, country: "United Kingdom", currency: "GBP" },
    { city: "Tokyo, Japan", index: 115.2, country: "Japan", currency: "JPY" },
    { city: "Osaka, Japan", index: 95.8, country: "Japan", currency: "JPY" },
    { city: "Singapore", index: 112.3, country: "Singapore", currency: "SGD" },
    { city: "Hong Kong", index: 108.5, country: "Hong Kong", currency: "HKD" },
    { city: "Paris, France", index: 102.8, country: "France", currency: "EUR" },
    { city: "Sydney, Australia", index: 98.5, country: "Australia", currency: "AUD" },
    { city: "Melbourne, Australia", index: 92.3, country: "Australia", currency: "AUD" },
    { city: "Amsterdam, Netherlands", index: 96.8, country: "Netherlands", currency: "EUR" },
    { city: "Copenhagen, Denmark", index: 94.5, country: "Denmark", currency: "DKK" },
    { city: "Stockholm, Sweden", index: 93.2, country: "Sweden", currency: "SEK" },
    { city: "Oslo, Norway", index: 105.8, country: "Norway", currency: "NOK" },
    { city: "Vienna, Austria", index: 89.5, country: "Austria", currency: "EUR" },
    { city: "Dublin, Ireland", index: 97.2, country: "Ireland", currency: "EUR" },
    { city: "Toronto, Canada", index: 88.5, country: "Canada", currency: "CAD" },
    { city: "Vancouver, Canada", index: 92.8, country: "Canada", currency: "CAD" },
    { city: "Montreal, Canada", index: 82.5, country: "Canada", currency: "CAD" },
    { city: "Berlin, Germany", index: 78.5, country: "Germany", currency: "EUR" },
    { city: "Munich, Germany", index: 88.2, country: "Germany", currency: "EUR" },
    { city: "Barcelona, Spain", index: 75.8, country: "Spain", currency: "EUR" },
    { city: "Madrid, Spain", index: 73.5, country: "Spain", currency: "EUR" },
    { city: "Rome, Italy", index: 82.3, country: "Italy", currency: "EUR" },
    { city: "Milan, Italy", index: 85.8, country: "Italy", currency: "EUR" },
  ]
};

/**
 * Lookup cost of living index for a city
 * @param {string} location - City name, e.g., "San Francisco, CA" or "London, United Kingdom"
 * @returns {{index: number, city: string, currency: string}|null} - Cost of living index, canonical city name, and currency, or null if not found
 */
export function lookupCostOfLiving(location) {
  if (!location) return null;
  
  const normalizedLocation = location.trim();
  
  // Search US cities - exact match
  const usMatch = costOfLivingData.us.find(
    item => item.city.toLowerCase() === normalizedLocation.toLowerCase()
  );
  if (usMatch) return { index: usMatch.index, city: usMatch.city, currency: usMatch.currency || "USD" };
  
  // Search international cities - exact match
  const intlMatch = costOfLivingData.international.find(
    item => item.city.toLowerCase() === normalizedLocation.toLowerCase()
  );
  if (intlMatch) return { index: intlMatch.index, city: intlMatch.city, currency: intlMatch.currency || "USD" };
  
  // Try fuzzy matching (partial match) - check if user input matches city name
  const userCityName = normalizedLocation.toLowerCase().split(',')[0].trim();
  
  const fuzzyUsMatch = costOfLivingData.us.find(
    item => {
      const cityName = item.city.toLowerCase().split(',')[0].trim();
      return userCityName === cityName || 
             userCityName.includes(cityName) || 
             cityName.includes(userCityName);
    }
  );
  if (fuzzyUsMatch) return { index: fuzzyUsMatch.index, city: fuzzyUsMatch.city, currency: fuzzyUsMatch.currency || "USD" };
  
  const fuzzyIntlMatch = costOfLivingData.international.find(
    item => {
      const cityName = item.city.toLowerCase().split(',')[0].trim();
      return userCityName === cityName || 
             userCityName.includes(cityName) || 
             cityName.includes(userCityName);
    }
  );
  if (fuzzyIntlMatch) return { index: fuzzyIntlMatch.index, city: fuzzyIntlMatch.city, currency: fuzzyIntlMatch.currency || "USD" };
  
  return null;
}

/**
 * Get all available cities (for autocomplete suggestions)
 * @returns {Array} - Array of city objects with city name and index
 */
export function getAllCities() {
  return [
    ...costOfLivingData.us.map(item => ({ ...item, type: 'us' })),
    ...costOfLivingData.international.map(item => ({ ...item, type: 'international' }))
  ];
}

