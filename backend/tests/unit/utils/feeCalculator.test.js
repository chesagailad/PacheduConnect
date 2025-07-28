const { calculateFee } = require('../../../src/utils/feeCalculator');

describe('Fee Calculator', () => {
  describe('calculateFee', () => {
    test('should calculate fee for small amount (under R500)', () => {
      const result = calculateFee(100, 'ZAR', 'USD');
      
      expect(result).toHaveProperty('transferFee');
      expect(result).toHaveProperty('totalFee');
      expect(result).toHaveProperty('feePercentage');
      expect(result.totalFee).toBeGreaterThan(0);
      expect(result.feePercentage).toBe(3.0);
    });

    test('should calculate fee for medium amount (R500-R5000)', () => {
      const result = calculateFee(2000, 'ZAR', 'USD');
      
      expect(result.totalFee).toBeGreaterThan(0);
      expect(typeof result.totalFee).toBe('number');
      expect(result.feePercentage).toBe(3.0);
    });

    test('should calculate fee for large amount (over R5000)', () => {
      const result = calculateFee(10000, 'ZAR', 'USD');
      
      expect(result.totalFee).toBeGreaterThan(0);
      expect(result.transferFee).toBeGreaterThan(0);
      expect(result.feePercentage).toBe(3.0);
    });

    test('should return higher fees for same-day processing', () => {
      const standardFee = calculateFee(1000, 'ZAR', 'USD', 'standard');
      const expressFee = calculateFee(1000, 'ZAR', 'USD', 'express');
      
      expect(expressFee.totalFee).toBeGreaterThan(standardFee.totalFee);
    });

    test('should handle different currency pairs', () => {
      const zarToUsd = calculateFee(1000, 'ZAR', 'USD');
      const zarToGbp = calculateFee(1000, 'ZAR', 'GBP');
      
      expect(zarToUsd).toHaveProperty('totalFee');
      expect(zarToGbp).toHaveProperty('totalFee');
      expect(typeof zarToUsd.totalFee).toBe('number');
      expect(typeof zarToGbp.totalFee).toBe('number');
    });

    test('should throw error for negative amounts', () => {
      expect(() => {
        calculateFee(-100, 'ZAR', 'USD');
      }).toThrow('Amount must be positive');
    });

    test('should throw error for zero amount', () => {
      expect(() => {
        calculateFee(0, 'ZAR', 'USD');
      }).toThrow('Amount must be positive');
    });

    test('should throw error for unsupported currencies', () => {
      expect(() => {
        calculateFee(1000, 'XXX', 'USD');
      }).toThrow('Unsupported currency');
    });

    test('should calculate correct percentage for flat fee structure', () => {
      const smallAmount = calculateFee(200, 'ZAR', 'USD');
      const largeAmount = calculateFee(20000, 'ZAR', 'USD');
      
      // Both should have 3% flat fee
      expect(smallAmount.feePercentage).toBe(3.0);
      expect(largeAmount.feePercentage).toBe(3.0);
      
      // Transfer fee should be 3% of amount
      expect(smallAmount.transferFee).toBe(6); // 200 * 0.03
      expect(largeAmount.transferFee).toBe(600); // 20000 * 0.03
    });

    test('should include regulatory fees for large amounts', () => {
      const result = calculateFee(50000, 'ZAR', 'USD');
      
      expect(result).toHaveProperty('regulatoryFee');
      expect(result.regulatoryFee).toBeGreaterThanOrEqual(0);
    });

    test('should provide fee breakdown', () => {
      const result = calculateFee(1000, 'ZAR', 'USD');
      
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('transferFee');
      expect(result.breakdown).toHaveProperty('processingFee');
      expect(result.breakdown).toHaveProperty('exchangeMargin');
    });
  });

  describe('Fee Structure Validation', () => {
    test('should maintain consistent fee structure', () => {
      const amounts = [100, 500, 1000, 5000, 10000, 50000];
      const fees = amounts.map(amount => calculateFee(amount, 'ZAR', 'USD'));
      
      // Total fees should increase with amount
      for (let i = 1; i < fees.length; i++) {
        expect(fees[i].totalFee).toBeGreaterThanOrEqual(fees[i-1].totalFee);
      }
    });

    test('should apply flat 3% fee across all amounts', () => {
      const amounts = [100, 500, 1000, 5000, 10000];
      const fees = amounts.map(amount => calculateFee(amount, 'ZAR', 'USD'));
      
      // All should have 3% fee percentage
      fees.forEach(fee => {
        expect(fee.feePercentage).toBe(3.0);
      });
    });
  });
});