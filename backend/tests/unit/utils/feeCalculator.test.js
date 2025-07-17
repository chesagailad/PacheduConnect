const { calculateFee } = require('../../../src/utils/feeCalculator');

describe('Fee Calculator', () => {
  describe('calculateFee', () => {
    test('should calculate fee for small amount (under R500)', () => {
      const result = calculateFee(100, 'ZAR', 'USD');
      
      expect(result).toHaveProperty('fixedFee');
      expect(result).toHaveProperty('percentageFee');
      expect(result).toHaveProperty('totalFee');
      expect(result.totalFee).toBeGreaterThan(0);
    });

    test('should calculate fee for medium amount (R500-R5000)', () => {
      const result = calculateFee(2000, 'ZAR', 'USD');
      
      expect(result.totalFee).toBeGreaterThan(0);
      expect(typeof result.totalFee).toBe('number');
    });

    test('should calculate fee for large amount (over R5000)', () => {
      const result = calculateFee(10000, 'ZAR', 'USD');
      
      expect(result.totalFee).toBeGreaterThan(0);
      expect(result.percentageFee).toBeGreaterThan(0);
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

    test('should calculate correct percentage for different tiers', () => {
      const smallAmount = calculateFee(200, 'ZAR', 'USD');
      const largeAmount = calculateFee(20000, 'ZAR', 'USD');
      
      const smallPercentage = (smallAmount.percentageFee / 200) * 100;
      const largePercentage = (largeAmount.percentageFee / 20000) * 100;
      
      // Large amounts should have lower percentage fees
      expect(largePercentage).toBeLessThanOrEqual(smallPercentage);
    });

    test('should include regulatory fees for large amounts', () => {
      const result = calculateFee(50000, 'ZAR', 'USD');
      
      expect(result).toHaveProperty('regulatoryFee');
      expect(result.regulatoryFee).toBeGreaterThan(0);
    });

    test('should provide fee breakdown', () => {
      const result = calculateFee(1000, 'ZAR', 'USD');
      
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('serviceFee');
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

    test('should have reasonable fee percentages', () => {
      const result = calculateFee(1000, 'ZAR', 'USD');
      const percentage = (result.totalFee / 1000) * 100;
      
      // Fee should be reasonable (between 1% and 10%)
      expect(percentage).toBeGreaterThan(1);
      expect(percentage).toBeLessThan(10);
    });
  });
});