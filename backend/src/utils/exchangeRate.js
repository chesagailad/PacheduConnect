/**
 * Exchange rate utility for PacheduConnect
 * Fetches real-time rates from XE Currency Data API with margin and commission
 */

const axios = require('axios');

// Supported currencies for Pachedu platform
const SUPPORTED_CURRENCIES = ['ZAR', 'USD', 'MWK', 'MZN'];

// XE API Configuration
const XE_API_BASE_URL = 'https://xecdapi.xe.com/v1';
const XE_ACCOUNT_ID = process.env.XE_ACCOUNT_ID;
const XE_API_KEY = process.env.XE_API_KEY;

// Platform configuration
const EXCHANGE_RATE_MARGIN = 0.015; // 1.5% margin
const ZAR_COMMISSION_RATE = 0.035; // 3.5% commission on ZAR amounts

// Cache for exchange rates to avoid excessive API calls
let rateCache = {
  rates: {},
  lastUpdated: null,
  cacheDuration: 300000 // 5 minutes in milliseconds for real-time rates
};

/**
 * Validate XE API credentials
 */
function validateXECredentials() {
  if (!XE_ACCOUNT_ID || !XE_API_KEY) {
    throw new Error('XE Currency Data API credentials not configured. Please set XE_ACCOUNT_ID and XE_API_KEY environment variables.');
  }
}

/**
 * Create XE API authentication header
 */
function getXEAuthHeader() {
  validateXECredentials();
  const credentials = Buffer.from(`${XE_ACCOUNT_ID}:${XE_API_KEY}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Fetch real-time exchange rates from XE Currency Data API
 * @param {string} baseCurrency - Base currency for conversion
 * @returns {object} Exchange rates object
 */
async function fetchExchangeRatesFromXE(baseCurrency = 'USD') {
  try {
    const targetCurrencies = SUPPORTED_CURRENCIES.filter(curr => curr !== baseCurrency).join(',');
    
    const response = await axios.get(`${XE_API_BASE_URL}/convert_from.json`, {
      params: {
        from: baseCurrency,
        to: targetCurrencies,
        amount: 1,
        margin: EXCHANGE_RATE_MARGIN * 100, // XE expects margin as percentage
        decimal_places: 6
      },
      headers: {
        'Authorization': getXEAuthHeader(),
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.to) {
      const rates = { [baseCurrency]: 1 };
      
      // Process XE API response
      response.data.to.forEach(conversion => {
        rates[conversion.quotecurrency] = conversion.mid;
      });

      return {
        base: baseCurrency,
        rates,
        timestamp: response.data.timestamp || new Date().toISOString(),
        source: 'XE Currency Data API'
      };
    }
    
    throw new Error('Invalid response from XE Currency Data API');
  } catch (error) {
    console.error('Failed to fetch exchange rates from XE API:', error.message);
    
    // Fallback to static rates if XE API fails
    return getFallbackRates(baseCurrency);
  }
}

/**
 * Get fallback exchange rates when XE API is unavailable
 * @param {string} baseCurrency - Base currency
 * @returns {object} Fallback rates
 */
function getFallbackRates(baseCurrency = 'USD') {
  console.warn('Using fallback exchange rates due to XE API unavailability');
  
  // Static fallback rates with margin already applied (approximate values)
  const fallbackRates = {
    USD: {
      USD: 1,
      ZAR: 18.50, // ~18.30 + 1.5% margin
      MWK: 1735.0, // ~1710 + 1.5% margin
      MZN: 64.2 // ~63.25 + 1.5% margin
    },
    ZAR: {
      ZAR: 1,
      USD: 0.0541, // ~0.0533 + 1.5% margin
      MWK: 93.8, // ~92.4 + 1.5% margin
      MZN: 3.47 // ~3.42 + 1.5% margin
    },
    MWK: {
      MWK: 1,
      USD: 0.000577, // ~0.000568 + 1.5% margin
      ZAR: 0.01066, // ~0.0105 + 1.5% margin
      MZN: 0.037 // ~0.0365 + 1.5% margin
    },
    MZN: {
      MZN: 1,
      USD: 0.0156, // ~0.0154 + 1.5% margin
      ZAR: 0.288, // ~0.284 + 1.5% margin
      MWK: 27.0 // ~26.6 + 1.5% margin
    }
  };

  return {
    base: baseCurrency,
    rates: fallbackRates[baseCurrency] || fallbackRates.USD,
    timestamp: new Date().toISOString(),
    source: 'Fallback rates'
  };
}

/**
 * Get all exchange rates for all supported currencies
 * @returns {object} Complete rate matrix
 */
async function getAllExchangeRates() {
  const allRates = {};
  
  // Fetch rates for each supported currency as base
  for (const baseCurrency of SUPPORTED_CURRENCIES) {
    try {
      const ratesData = await fetchExchangeRatesFromXE(baseCurrency);
      allRates[baseCurrency] = ratesData.rates;
    } catch (error) {
      console.error(`Failed to fetch rates for ${baseCurrency}:`, error.message);
      const fallback = getFallbackRates(baseCurrency);
      allRates[baseCurrency] = fallback.rates;
    }
  }
  
  return allRates;
}

/**
 * Get cached exchange rates or fetch new ones
 * @returns {object} Exchange rates matrix
 */
async function getExchangeRates() {
  const now = Date.now();
  
  // Return cached rates if they're still valid
  if (rateCache.lastUpdated && (now - rateCache.lastUpdated) < rateCache.cacheDuration) {
    return rateCache.rates;
  }
  
  // Fetch new rates
  const allRates = await getAllExchangeRates();
  rateCache.rates = allRates;
  rateCache.lastUpdated = now;
  
  return allRates;
}

/**
 * Calculate commission fee for ZAR transactions
 * @param {number} amount - Amount being sent
 * @param {string} currency - Currency of the amount
 * @returns {object} Commission details
 */
function calculateCommission(amount, currency) {
  // Input validation
  if (typeof amount !== 'number' || amount < 0 || !isFinite(amount)) {
    throw new Error('Invalid amount: must be a non-negative finite number');
  }
  
  if (!currency || typeof currency !== 'string') {
    throw new Error('Invalid currency: must be a non-empty string');
  }
  
  // Normalize currency code to uppercase
  currency = currency.toUpperCase();
  
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error(`Unsupported currency '${currency}'. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  
  if (currency === 'ZAR') {
    const commissionAmount = amount * ZAR_COMMISSION_RATE;
    return {
      commissionRate: ZAR_COMMISSION_RATE,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      totalAmount: parseFloat((amount + commissionAmount).toFixed(2)),
      currency: 'ZAR'
    };
  }
  
  return {
    commissionRate: 0,
    commissionAmount: 0,
    totalAmount: parseFloat(amount.toFixed(2)),
    currency
  };
}

/**
 * Convert amount from one currency to another with commission
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {object} Conversion result with commission details
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  // Enhanced input validation
  if (!fromCurrency || typeof fromCurrency !== 'string') {
    throw new Error('Invalid fromCurrency: must be a non-empty string');
  }
  
  if (!toCurrency || typeof toCurrency !== 'string') {
    throw new Error('Invalid toCurrency: must be a non-empty string');
  }
  
  if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
    throw new Error('Invalid amount: must be a positive finite number');
  }
  
  // Normalize currency codes to uppercase
  fromCurrency = fromCurrency.toUpperCase();
  toCurrency = toCurrency.toUpperCase();
  
  // Validate supported currencies
  if (!SUPPORTED_CURRENCIES.includes(fromCurrency)) {
    throw new Error(`Unsupported fromCurrency '${fromCurrency}'. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  
  if (!SUPPORTED_CURRENCIES.includes(toCurrency)) {
    throw new Error(`Unsupported toCurrency '${toCurrency}'. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  
  if (fromCurrency === toCurrency) {
    const commission = calculateCommission(amount, fromCurrency);
    return {
      originalAmount: parseFloat(amount.toFixed(2)),
      convertedAmount: parseFloat(amount.toFixed(2)),
      fromCurrency,
      toCurrency,
      rate: 1.000000,
      commission,
      margin: 0.000, // No margin for same currency
      timestamp: new Date().toISOString(),
      source: 'Same currency conversion'
    };
  }
  
  const allRates = await getExchangeRates();
  
  if (!allRates[fromCurrency] || !allRates[fromCurrency][toCurrency]) {
    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }
  
  const rate = allRates[fromCurrency][toCurrency];
  const convertedAmount = amount * rate;
  
  // Calculate commission (only applies to ZAR amounts being sent)
  const commission = calculateCommission(amount, fromCurrency);
  
  return {
    originalAmount: parseFloat(amount.toFixed(2)),
    convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    fromCurrency,
    toCurrency,
    rate: parseFloat(rate.toFixed(6)),
    commission,
    margin: EXCHANGE_RATE_MARGIN,
    timestamp: new Date().toISOString(),
    source: 'XE Currency Data API'
  };
}

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {object} Rate information
 */
async function getExchangeRate(fromCurrency, toCurrency) {
  // Enhanced input validation
  if (!fromCurrency || typeof fromCurrency !== 'string') {
    throw new Error('Invalid fromCurrency: must be a non-empty string');
  }
  
  if (!toCurrency || typeof toCurrency !== 'string') {
    throw new Error('Invalid toCurrency: must be a non-empty string');
  }
  
  // Normalize currency codes to uppercase
  fromCurrency = fromCurrency.toUpperCase();
  toCurrency = toCurrency.toUpperCase();
  
  // Validate supported currencies
  if (!SUPPORTED_CURRENCIES.includes(fromCurrency)) {
    throw new Error(`Unsupported fromCurrency '${fromCurrency}'. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  
  if (!SUPPORTED_CURRENCIES.includes(toCurrency)) {
    throw new Error(`Unsupported toCurrency '${toCurrency}'. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  
  if (fromCurrency === toCurrency) {
    return {
      rate: 1.000000,
      fromCurrency,
      toCurrency,
      margin: 0.000,
      timestamp: new Date().toISOString(),
      source: 'Same currency rate'
    };
  }
  
  const allRates = await getExchangeRates();
  
  if (!allRates[fromCurrency] || !allRates[fromCurrency][toCurrency]) {
    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }
  
  const rate = allRates[fromCurrency][toCurrency];
  
  return {
    rate: parseFloat(rate.toFixed(6)),
    fromCurrency,
    toCurrency,
    margin: EXCHANGE_RATE_MARGIN,
    timestamp: new Date().toISOString(),
    source: 'XE Currency Data API'
  };
}

/**
 * Get all available rates for supported currencies
 * @returns {object} All currencies and rates
 */
async function getAllRates() {
  const allRates = await getExchangeRates();
  
  return {
    supportedCurrencies: SUPPORTED_CURRENCIES,
    rates: allRates,
    margin: EXCHANGE_RATE_MARGIN,
    zarCommissionRate: ZAR_COMMISSION_RATE,
    timestamp: new Date().toISOString(),
    source: 'XE Currency Data API',
    cacheDuration: rateCache.cacheDuration
  };
}

/**
 * Validate if a currency is supported by Pachedu platform
 * @param {string} currency - Currency code to validate
 * @returns {boolean} True if supported
 */
function isCurrencySupported(currency) {
  // Input validation
  if (!currency || typeof currency !== 'string') {
    return false;
  }
  
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
}

/**
 * Get platform fee structure
 * @returns {object} Fee information
 */
function getFeeStructure() {
  return {
    exchangeRateMargin: EXCHANGE_RATE_MARGIN,
    zarCommissionRate: ZAR_COMMISSION_RATE,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    description: {
      margin: 'Exchange rate margin added to all conversions',
      zarCommission: 'Commission fee applied to ZAR amounts being sent'
    }
  };
}

module.exports = {
  convertCurrency,
  getExchangeRate,
  getAllRates,
  isCurrencySupported,
  getExchangeRates,
  calculateCommission,
  getFeeStructure,
  SUPPORTED_CURRENCIES,
  EXCHANGE_RATE_MARGIN,
  ZAR_COMMISSION_RATE
}; 