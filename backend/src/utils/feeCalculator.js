/**
 * Fee calculation utility for PacheduConnect
 * Flat 3% fee on sending amount across all currencies
 */

const FEE_CONFIG = {
  // Flat 3% fee for all currencies
  default: {
    type: 'percentage',
    value: 3.0, // 3% flat fee
    minFee: 0.01, // Minimum fee
    maxFee: null // No maximum fee limit
  },
  
  // Currency-specific fees (all set to 3%)
  USD: {
    type: 'percentage',
    value: 3.0,
    minFee: 0.01,
    maxFee: null
  },
  
  EUR: {
    type: 'percentage',
    value: 3.0,
    minFee: 0.01,
    maxFee: null
  },
  
  GBP: {
    type: 'percentage',
    value: 3.0,
    minFee: 0.01,
    maxFee: null
  },
  
  ZAR: {
    type: 'percentage',
    value: 3.0,
    minFee: 0.01,
    maxFee: null
  },
  
  MWK: {
    type: 'percentage',
    value: 3.0,
    minFee: 0.01,
    maxFee: null
  },
  
  MZN: {
    type: 'percentage',
    value: 3.0,
    minFee: 0.01,
    maxFee: null
  }
};

/**
 * Calculate transaction fee based on amount and currency
 * @param {number} amount - Transaction amount
 * @param {string} fromCurrency - Source currency code (ZAR, USD, etc.)
 * @param {string} toCurrency - Target currency code (USD, EUR, etc.)
 * @param {string} speed - Processing speed ('standard' or 'express')
 * @returns {object} Fee breakdown
 */
function calculateFee(amount, fromCurrency = 'USD', toCurrency = 'USD', speed = 'standard') {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Validate currencies
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'MWK', 'MZN'];
  if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
    throw new Error('Unsupported currency');
  }
  
  // Get fee configuration for currency (default to 3% for all)
  const feeConfig = FEE_CONFIG[fromCurrency] || FEE_CONFIG.default;
  
  let transferFee = 0;
  let processingFee = 0;
  let exchangeMargin = 0;
  let regulatoryFee = 0;
  let feeType = 'flat_percentage';
  
  // Calculate transfer fee (3% of sending amount)
  transferFee = (amount * feeConfig.value) / 100;
  transferFee = Math.max(transferFee, feeConfig.minFee);
  
  // No maximum fee limit - let it scale with amount
  
  // Calculate processing fee (base 0.5% for standard, 1% for express)
  processingFee = speed === 'express' ? (amount * 1.0) / 100 : (amount * 0.5) / 100;
  
  // Calculate exchange margin if different currencies
  if (fromCurrency !== toCurrency) {
    exchangeMargin = (amount * 0.5) / 100; // 0.5% exchange margin
  }

  // Calculate regulatory fee for large amounts (50000 and above)
  if (amount >= 50000) {
    regulatoryFee = Math.min((amount * 0.1) / 100, 25); // 0.1% capped at $25
  }

  const totalFee = transferFee + processingFee + exchangeMargin + regulatoryFee;
  const totalAmount = amount + totalFee;
  
  return {
    amount: parseFloat(amount.toFixed(2)),
    transferFee: parseFloat(transferFee.toFixed(2)),
    processingFee: parseFloat(processingFee.toFixed(2)),
    exchangeMargin: parseFloat(exchangeMargin.toFixed(2)),
    regulatoryFee: parseFloat(regulatoryFee.toFixed(2)),
    totalFee: parseFloat(totalFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    feeType,
    feePercentage: feeConfig.value,
    fromCurrency,
    toCurrency,
    speed,
    breakdown: {
      transferFee: parseFloat(transferFee.toFixed(2)),
      processingFee: parseFloat(processingFee.toFixed(2)),
      exchangeMargin: parseFloat(exchangeMargin.toFixed(2)),
      regulatoryFee: parseFloat(regulatoryFee.toFixed(2))
    }
  };
}

/**
 * Get fee breakdown for display
 * @param {number} amount - Transaction amount
 * @param {string} currency - Currency code
 * @returns {object} Detailed fee breakdown
 */
function getFeeBreakdown(amount, currency = 'USD') {
  const feeInfo = calculateFee(amount, currency);
  
  return {
    ...feeInfo,
    breakdown: {
      transferAmount: feeInfo.amount,
      feeAmount: feeInfo.transferFee,
      totalAmount: feeInfo.totalAmount,
      feeRate: `${feeInfo.feePercentage}%`,
      effectiveRate: `${((feeInfo.transferFee / feeInfo.amount) * 100).toFixed(2)}%`
    }
  };
}

/**
 * Validate if user has sufficient balance including fees
 * @param {number} userBalance - User's current balance
 * @param {number} transferAmount - Amount to transfer
 * @param {string} currency - Currency code
 * @returns {object} Validation result
 */
function validateTransferWithFees(userBalance, transferAmount, currency = 'USD') {
  const feeInfo = calculateFee(transferAmount, currency);
  const totalRequired = feeInfo.totalAmount;
  const hasSufficientBalance = userBalance >= totalRequired;
  
  return {
    isValid: hasSufficientBalance,
    userBalance: parseFloat(userBalance.toFixed(2)),
    transferAmount: feeInfo.amount,
    feeAmount: feeInfo.transferFee,
    totalRequired: feeInfo.totalAmount,
    shortfall: hasSufficientBalance ? 0 : totalRequired - userBalance,
    currency
  };
}

module.exports = {
  calculateFee,
  getFeeBreakdown,
  validateTransferWithFees,
  FEE_CONFIG
}; 