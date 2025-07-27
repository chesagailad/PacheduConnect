/**
 * Fee calculation utility for PacheduConnect
 * Supports percentage, flat, and tiered fee structures
 */

const FEE_CONFIG = {
  // Default fee structure
  default: {
    type: 'percentage',
    value: 2.5, // 2.5% fee
    minFee: 1.00, // Minimum $1 fee
    maxFee: 50.00 // Maximum $50 fee
  },
  
  // Currency-specific fees
  USD: {
    type: 'percentage',
    value: 2.5,
    minFee: 1.00,
    maxFee: 50.00
  },
  
  EUR: {
    type: 'percentage',
    value: 2.0,
    minFee: 0.50,
    maxFee: 40.00
  },
  
  GBP: {
    type: 'percentage',
    value: 2.0,
    minFee: 0.50,
    maxFee: 35.00
  },
  
  // Special fee for large amounts
  large: {
    threshold: 1000, // Amount above which different fee applies
    type: 'percentage',
    value: 1.5, // Lower percentage for large amounts
    minFee: 5.00,
    maxFee: 100.00
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
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR'];
  if (!supportedCurrencies.includes(fromCurrency) || !supportedCurrencies.includes(toCurrency)) {
    throw new Error('Unsupported currency');
  }
  
  // Get fee configuration for currency
  const feeConfig = FEE_CONFIG[toCurrency] || FEE_CONFIG.default;
  
  let serviceFee = 0;
  let processingFee = 0;
  let exchangeMargin = 0;
  let regulatoryFee = 0;
  let feeType = feeConfig.type;
  
  // Calculate service fee
  if (amount >= FEE_CONFIG.large.threshold) {
    const largeConfig = FEE_CONFIG.large;
    serviceFee = (amount * largeConfig.value) / 100;
    serviceFee = Math.max(serviceFee, largeConfig.minFee);
    serviceFee = Math.min(serviceFee, largeConfig.maxFee);
    feeType = 'large_percentage';
  } else {
    // Apply standard fee calculation
    if (feeConfig.type === 'percentage') {
      serviceFee = (amount * feeConfig.value) / 100;
    } else if (feeConfig.type === 'flat') {
      serviceFee = feeConfig.value;
    } else if (feeConfig.type === 'tiered') {
      serviceFee = calculateTieredFee(amount, feeConfig.tiers);
    }
    
    // Apply min/max constraints
    serviceFee = Math.max(serviceFee, feeConfig.minFee);
    serviceFee = Math.min(serviceFee, feeConfig.maxFee);
  }

  // Calculate processing fee (base 1.5% for express, 0.5% for standard)
  processingFee = speed === 'express' ? (amount * 1.5) / 100 : (amount * 0.5) / 100;
  
  // Calculate exchange margin if different currencies
  if (fromCurrency !== toCurrency) {
    exchangeMargin = (amount * 0.5) / 100; // 0.5% exchange margin
  }

  // Calculate regulatory fee for large amounts (50000 and above)
  if (amount >= 50000) {
    regulatoryFee = Math.min((amount * 0.1) / 100, 25); // 0.1% capped at $25
  }

  const fixedFee = serviceFee;
  const percentageFee = processingFee + exchangeMargin;
  const totalFee = fixedFee + percentageFee + regulatoryFee;
  const totalAmount = amount + totalFee;
  
  return {
    amount: parseFloat(amount.toFixed(2)),
    fixedFee: parseFloat(fixedFee.toFixed(2)),
    percentageFee: parseFloat(percentageFee.toFixed(2)),
    regulatoryFee: parseFloat(regulatoryFee.toFixed(2)),
    totalFee: parseFloat(totalFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    feeType,
    feePercentage: feeConfig.value,
    fromCurrency,
    toCurrency,
    speed,
    breakdown: {
      serviceFee: parseFloat(serviceFee.toFixed(2)),
      processingFee: parseFloat(processingFee.toFixed(2)),
      exchangeMargin: parseFloat(exchangeMargin.toFixed(2)),
      regulatoryFee: parseFloat(regulatoryFee.toFixed(2))
    }
  };
}

/**
 * Calculate tiered fee structure
 * @param {number} amount - Transaction amount
 * @param {array} tiers - Tier configuration
 * @returns {number} Calculated fee
 */
function calculateTieredFee(amount, tiers) {
  let totalFee = 0;
  let remainingAmount = amount;
  
  for (const tier of tiers) {
    if (remainingAmount <= 0) break;
    
    const tierAmount = Math.min(remainingAmount, tier.max - (tier.min || 0));
    const tierFee = (tierAmount * tier.rate) / 100;
    
    totalFee += tierFee;
    remainingAmount -= tierAmount;
  }
  
  return totalFee;
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
      feeAmount: feeInfo.fee,
      totalAmount: feeInfo.totalAmount,
      feeRate: `${feeInfo.feePercentage}%`,
      effectiveRate: `${((feeInfo.fee / feeInfo.amount) * 100).toFixed(2)}%`
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
    feeAmount: feeInfo.fee,
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