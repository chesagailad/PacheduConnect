const feeService = require('../../../src/chat-bot/services/feeService');

describe('ChatbotFeeService', () => {
  describe('calculateTransferFees', () => {
    test('should calculate fees for standard transfer', () => {
      const result = feeService.calculateTransferFees(100, 'USD', 'USD', 'standard');
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(100);
      expect(result.transferFee).toBe(3); // 3% of 100
      expect(result.processingFee).toBe(0.5); // 0.5% of 100
      expect(result.exchangeMargin).toBe(0); // Same currency
      expect(result.regulatoryFee).toBe(0); // Below $50,000 threshold
      expect(result.totalFee).toBe(3.5); // 3 + 0.5
      expect(result.totalAmount).toBe(103.5); // 100 + 3.5
    });

    test('should calculate fees for express transfer', () => {
      const result = feeService.calculateTransferFees(100, 'USD', 'USD', 'express');
      
      expect(result.success).toBe(true);
      expect(result.transferFee).toBe(3); // 3% of 100
      expect(result.processingFee).toBe(1); // 1% of 100 for express
      expect(result.totalFee).toBe(4); // 3 + 1
      expect(result.totalAmount).toBe(104); // 100 + 4
    });

    test('should calculate fees with currency conversion', () => {
      const result = feeService.calculateTransferFees(100, 'USD', 'ZAR', 'standard');
      
      expect(result.success).toBe(true);
      expect(result.transferFee).toBe(3); // 3% of 100
      expect(result.processingFee).toBe(0.5); // 0.5% of 100
      expect(result.exchangeMargin).toBe(0.5); // 0.5% for currency conversion
      expect(result.totalFee).toBe(4); // 3 + 0.5 + 0.5
      expect(result.totalAmount).toBe(104); // 100 + 4
    });

    test('should calculate fees for large amounts with regulatory fee', () => {
      const result = feeService.calculateTransferFees(100000, 'USD', 'USD', 'standard');
      
      expect(result.success).toBe(true);
      expect(result.transferFee).toBe(3000); // 3% of 100000
      expect(result.processingFee).toBe(500); // 0.5% of 100000
      expect(result.regulatoryFee).toBe(25); // Capped at $25 for amounts ≥ $50,000
      expect(result.totalFee).toBe(3525); // 3000 + 500 + 25
      expect(result.totalAmount).toBe(103525); // 100000 + 3525
    });

    test('should handle invalid amount', () => {
      const result = feeService.calculateTransferFees(-100, 'USD', 'USD');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transfer amount must be positive');
    });

    test('should handle unsupported currency', () => {
      const result = feeService.calculateTransferFees(100, 'INVALID', 'USD');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported currency');
    });

    test('should handle invalid speed', () => {
      const result = feeService.calculateTransferFees(100, 'USD', 'USD', 'invalid');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid processing speed');
    });
  });

  describe('generateFeeExplanation', () => {
    test('should generate English explanation', () => {
      const result = feeService.generateFeeExplanation(100, 'USD', 'USD', 'standard', 'en');
      
      expect(result.success).toBe(true);
      expect(result.explanation.title).toBe('Transfer Fee Breakdown');
      expect(result.explanation.summary).toContain('USD 100');
      expect(result.explanation.total).toContain('Total Fee: USD 3.5');
      expect(result.explanation.totalAmount).toContain('Total Amount (including fees): USD 103.5');
    });

    test('should generate Shona explanation', () => {
      const result = feeService.generateFeeExplanation(100, 'USD', 'USD', 'standard', 'sn');
      
      expect(result.success).toBe(true);
      expect(result.explanation.title).toBe('Kubhadhara Mari Yekutuma');
      expect(result.explanation.summary).toContain('USD 100');
      expect(result.explanation.total).toContain('Mari Yese: USD 3.5');
    });

    test('should generate Ndebele explanation', () => {
      const result = feeService.generateFeeExplanation(100, 'USD', 'USD', 'standard', 'nd');
      
      expect(result.success).toBe(true);
      expect(result.explanation.title).toBe('Ukukhokha Imali Yokuthumela');
      expect(result.explanation.summary).toContain('USD 100');
      expect(result.explanation.total).toContain('Imali Yonke: USD 3.5');
    });

    test('should handle currency conversion in explanation', () => {
      const result = feeService.generateFeeExplanation(100, 'USD', 'ZAR', 'standard', 'en');
      
      expect(result.success).toBe(true);
      expect(result.explanation.breakdown).toContain('Exchange Margin');
      expect(result.explanation.total).toContain('Total Fee: USD 4');
    });

    test('should handle express processing in explanation', () => {
      const result = feeService.generateFeeExplanation(100, 'USD', 'USD', 'express', 'en');
      
      expect(result.success).toBe(true);
      expect(result.explanation.breakdown).toContain('1%');
      expect(result.explanation.note).toContain('Express processing');
    });
  });

  describe('compareFees', () => {
    test('should compare fees for different amounts', () => {
      const amounts = [100, 500, 1000];
      const result = feeService.compareFees(amounts, 'USD', 'en');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].amount).toBe(100);
      expect(result.data[0].fee).toBe(3.5); // 3% + 0.5%
      expect(result.data[1].amount).toBe(500);
      expect(result.data[1].fee).toBe(17.5); // 3% + 0.5%
      expect(result.data[2].amount).toBe(1000);
      expect(result.data[2].fee).toBe(35); // 3% + 0.5%
    });

    test('should calculate effective fee percentages', () => {
      const amounts = [100, 500, 1000];
      const result = feeService.compareFees(amounts, 'USD', 'en');
      
      expect(result.data[0].feePercentage).toBe('3.50'); // 3.5/100 * 100
      expect(result.data[1].feePercentage).toBe('3.50'); // 17.5/500 * 100
      expect(result.data[2].feePercentage).toBe('3.50'); // 35/1000 * 100
    });
  });

  describe('validateTransferBalance', () => {
    test('should validate sufficient balance', () => {
      const result = feeService.validateTransferBalance(200, 100, 'USD');
      
      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Sufficient balance');
      expect(result.data.userBalance).toBe(200);
      expect(result.data.transferAmount).toBe(100);
      expect(result.data.totalRequired).toBe(103.5); // 100 + 3.5 fees
    });

    test('should detect insufficient balance', () => {
      const result = feeService.validateTransferBalance(100, 100, 'USD');
      
      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Insufficient balance');
      expect(result.data.shortfall).toBe(3.5); // 103.5 - 100
    });

    test('should handle zero balance', () => {
      const result = feeService.validateTransferBalance(0, 100, 'USD');
      
      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.data.shortfall).toBe(103.5); // 103.5 - 0
    });
  });

  describe('getSupportedOptions', () => {
    test('should return supported currencies and speeds', () => {
      const result = feeService.getSupportedOptions();
      
      expect(result.currencies).toContain('USD');
      expect(result.currencies).toContain('ZAR');
      expect(result.currencies).toContain('EUR');
      expect(result.speeds).toContain('standard');
      expect(result.speeds).toContain('express');
      expect(result.feeStructure.transferFee).toBe('3% flat rate');
      expect(result.feeStructure.processingFee).toBe('0.5% standard, 1% express');
    });
  });

  describe('getFeeStats', () => {
    test('should return fee statistics', () => {
      const result = feeService.getFeeStats();
      
      expect(result.totalCalculations).toBe(0); // Would be tracked in production
      expect(result.averageFee).toBe('3.5%');
      expect(result.mostPopularAmount).toBe('$1000');
      expect(result.supportedCurrencies).toBe(6);
      expect(result.feeStructure).toBe('Flat 3% + variable processing fees');
    });
  });
}); 