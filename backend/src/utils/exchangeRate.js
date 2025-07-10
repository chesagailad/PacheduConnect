/**
 * Exchange rate utility for PacheduConnect
 * Fetches rates from a free API and provides currency conversion
 */

const axios = require('axios');

// Cache for exchange rates to avoid excessive API calls
let rateCache = {
  rates: {},
  lastUpdated: null,
  cacheDuration: 3600000 // 1 hour in milliseconds
};

/**
 * Fetch exchange rates from a free API
 * @returns {object} Exchange rates object
 */
async function fetchExchangeRates() {
  try {
    // Using exchangerate-api.com (free tier)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (response.data && response.data.rates) {
      return {
        base: response.data.base,
        rates: response.data.rates,
        timestamp: response.data.time_last_updated_utc
      };
    }
    
    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error.message);
    
    // Fallback to static rates if API fails
    return {
      base: 'USD',
      rates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        ZAR: 15.5,
        CAD: 1.25,
        AUD: 1.35,
        JPY: 110,
        CHF: 0.92
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get cached exchange rates or fetch new ones
 * @returns {object} Exchange rates
 */
async function getExchangeRates() {
  const now = Date.now();
  
  // Return cached rates if they're still valid
  if (rateCache.lastUpdated && (now - rateCache.lastUpdated) < rateCache.cacheDuration) {
    return rateCache.rates;
  }
  
  // Fetch new rates
  const ratesData = await fetchExchangeRates();
  rateCache.rates = ratesData.rates;
  rateCache.lastUpdated = now;
  
  return ratesData.rates;
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {object} Conversion result
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      convertedAmount: amount,
      fromCurrency,
      toCurrency,
      rate: 1,
      timestamp: new Date().toISOString()
    };
  }
  
  const rates = await getExchangeRates();
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }
  
  // Convert to USD first (base currency), then to target currency
  const usdAmount = amount / rates[fromCurrency];
  const convertedAmount = usdAmount * rates[toCurrency];
  const rate = rates[toCurrency] / rates[fromCurrency];
  
  return {
    originalAmount: parseFloat(amount.toFixed(2)),
    convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    fromCurrency,
    toCurrency,
    rate: parseFloat(rate.toFixed(6)),
    timestamp: new Date().toISOString()
  };
}

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {object} Rate information
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return {
      rate: 1,
      fromCurrency,
      toCurrency,
      timestamp: new Date().toISOString()
    };
  }
  
  const rates = await getExchangeRates();
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }
  
  const rate = rates[toCurrency] / rates[fromCurrency];
  
  return {
    rate: parseFloat(rate.toFixed(6)),
    fromCurrency,
    toCurrency,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get all available currencies and their rates
 * @returns {object} All currencies and rates
 */
async function getAllRates() {
  const rates = await getExchangeRates();
  
  return {
    base: 'USD',
    rates,
    timestamp: new Date().toISOString(),
    supportedCurrencies: Object.keys(rates)
  };
}

/**
 * Validate if a currency is supported
 * @param {string} currency - Currency code to validate
 * @returns {boolean} True if supported
 */
async function isCurrencySupported(currency) {
  const rates = await getExchangeRates();
  return currency in rates;
}

module.exports = {
  convertCurrency,
  getExchangeRate,
  getAllRates,
  isCurrencySupported,
  getExchangeRates
}; 