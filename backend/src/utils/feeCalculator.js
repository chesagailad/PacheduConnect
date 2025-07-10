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
 * @param {string} currency - Currency code (USD, EUR, etc.)
 * @returns {object} Fee breakdown
 */
function calculateFee(amount, currency = 'USD') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  // Get fee configuration for currency
  const feeConfig = FEE_CONFIG[currency] || FEE_CONFIG.default;
  
  let fee = 0;
  let feeType = feeConfig.type;
  
  // Check if large amount fee applies
  if (amount >= FEE_CONFIG.large.threshold) {
    const largeConfig = FEE_CONFIG.large;
    fee = (amount * largeConfig.value) / 100;
    fee = Math.max(fee, largeConfig.minFee);
    fee = Math.min(fee, largeConfig.maxFee);
    feeType = 'large_percentage';
  } else {
    // Apply standard fee calculation
    if (feeConfig.type === 'percentage') {
      fee = (amount * feeConfig.value) / 100;
    } else if (feeConfig.type === 'flat') {
      fee = feeConfig.value;
    } else if (feeConfig.type === 'tiered') {
      fee = calculateTieredFee(amount, feeConfig.tiers);
    }
    
    // Apply min/max constraints
    fee = Math.max(fee, feeConfig.minFee);
    fee = Math.min(fee, feeConfig.maxFee);
  }
  
  const totalAmount = amount + fee;
  
  return {
    amount: parseFloat(amount.toFixed(2)),
    fee: parseFloat(fee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    feeType,
    feePercentage: feeConfig.value,
    currency
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