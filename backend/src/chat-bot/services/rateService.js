/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: rateService - handles backend functionality
 */

const axios = require('axios');

// Cache for exchange rates
const rateCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {number} - Exchange rate
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  
  // Check cache first
  if (rateCache.has(cacheKey)) {
    const cached = rateCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rate;
    }
  }
  
  try {
    // Try multiple sources for exchange rates
    let rate = await fetchFromExchangeAPI(fromCurrency, toCurrency);
    
    if (!rate) {
      rate = await fetchFromBackupAPI(fromCurrency, toCurrency);
    }
    
    if (!rate) {
      // Use fallback rates if APIs are down
      rate = getFallbackRate(fromCurrency, toCurrency);
    }
    
    // Cache the result
    rateCache.set(cacheKey, {
      rate: rate,
      timestamp: Date.now()
    });
    
    return rate;
    
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Try to return cached rate even if expired
    if (rateCache.has(cacheKey)) {
      return rateCache.get(cacheKey).rate;
    }
    
    // Last resort - use fallback
    return getFallbackRate(fromCurrency, toCurrency);
  }
}

/**
 * Fetch from primary exchange rate API
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {number|null}
 */
async function fetchFromExchangeAPI(fromCurrency, toCurrency) {
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      return null;
    }
    
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`,
      { timeout: 5000 }
    );
    
    if (response.data && response.data.conversion_rate) {
      return response.data.conversion_rate;
    }
    
    return null;
  } catch (error) {
    console.error('Exchange API error:', error.message);
    return null;
  }
}

/**
 * Fetch from backup API (fixer.io or similar)
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {number|null}
 */
async function fetchFromBackupAPI(fromCurrency, toCurrency) {
  try {
    // Using a free API that doesn't require key for basic requests
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      { timeout: 5000 }
    );
    
    if (response.data && response.data.rates && response.data.rates[toCurrency]) {
      return response.data.rates[toCurrency];
    }
    
    return null;
  } catch (error) {
    console.error('Backup API error:', error.message);
    return null;
  }
}

/**
 * Get fallback rates when APIs are unavailable
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {number}
 */
function getFallbackRate(fromCurrency, toCurrency) {
  // Static fallback rates (should be updated regularly)
  const fallbackRates = {
    'ZAR_USD': 0.054,
    'USD_ZAR': 18.50,
    'ZAR_EUR': 0.049,
    'EUR_ZAR': 20.30,
    'ZAR_GBP': 0.043,
    'GBP_ZAR': 23.20,
    'USD_EUR': 0.90,
    'EUR_USD': 1.11,
    'USD_GBP': 0.80,
    'GBP_USD': 1.25
  };
  
  const key = `${fromCurrency}_${toCurrency}`;
  const reverseKey = `${toCurrency}_${fromCurrency}`;
  
  if (fallbackRates[key]) {
    return fallbackRates[key];
  }
  
  if (fallbackRates[reverseKey]) {
    return 1 / fallbackRates[reverseKey];
  }
  
  // If no fallback available, return 1 (same currency assumed)
  return 1;
}

/**
 * Get multiple exchange rates at once
 * @param {string} baseCurrency 
 * @param {array} targetCurrencies 
 * @returns {object}
 */
async function getMultipleRates(baseCurrency, targetCurrencies) {
  const rates = {};
  
  const promises = targetCurrencies.map(async (currency) => {
    try {
      const rate = await getExchangeRate(baseCurrency, currency);
      rates[currency] = rate;
    } catch (error) {
      console.error(`Error getting rate for ${baseCurrency}/${currency}:`, error);
      rates[currency] = null;
    }
  });
  
  await Promise.all(promises);
  return rates;
}

/**
 * Calculate amount with exchange rate
 * @param {number} amount 
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {object}
 */
async function convertAmount(amount, fromCurrency, toCurrency) {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = amount * rate;
  
  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: convertedAmount,
    convertedCurrency: toCurrency,
    exchangeRate: rate,
    timestamp: new Date()
  };
}

/**
 * Get rate trend (simplified - would use historical data in production)
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {object}
 */
function getRateTrend(fromCurrency, toCurrency) {
  // Simplified trend calculation
  // In production, this would analyze historical data
  const currentRate = getFallbackRate(fromCurrency, toCurrency);
  const randomChange = (Math.random() - 0.5) * 0.02; // ±1% random change
  
  return {
    current: currentRate,
    change: randomChange,
    changePercent: (randomChange / currentRate) * 100,
    trend: randomChange > 0 ? 'up' : randomChange < 0 ? 'down' : 'stable'
  };
}

/**
 * Clear rate cache
 */
function clearCache() {
  rateCache.clear();
}

/**
 * Get cache stats
 * @returns {object}
 */
function getCacheStats() {
  return {
    size: rateCache.size,
    entries: Array.from(rateCache.keys())
  };
}

module.exports = {
  getExchangeRate,
  getMultipleRates,
  convertAmount,
  getRateTrend,
  clearCache,
  getCacheStats
};