/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: feeCalculator.test - test file for backend functionality
 */

const { calculateFee, getFeeBreakdown, validateTransferWithFees } = require('../../src/utils/feeCalculator');

describe('Fee Calculator Tests', () => {
  describe('calculateFee function', () => {
    test('should calculate 3% fee for USD', () => {
      const result = calculateFee(100, 'USD', 'USD', 'standard');
      
      expect(result.transferFee).toBe(3.0); // 3% of 100
      expect(result.processingFee).toBe(0.5); // 0.5% standard processing
      expect(result.feePercentage).toBe(3.0);
      expect(result.totalAmount).toBe(103.5); // 100 + 3 + 0.5
      expect(result.fromCurrency).toBe('USD');
      expect(result.toCurrency).toBe('USD');
    });

    test('should calculate 3% fee for ZAR', () => {
      const result = calculateFee(1000, 'ZAR', 'ZAR', 'standard');
      
      expect(result.transferFee).toBe(30.0); // 3% of 1000
      expect(result.processingFee).toBe(5.0); // 0.5% standard processing
      expect(result.feePercentage).toBe(3.0);
      expect(result.totalAmount).toBe(1035.0); // 1000 + 30 + 5
      expect(result.fromCurrency).toBe('ZAR');
      expect(result.toCurrency).toBe('ZAR');
    });

    test('should calculate 3% fee for MWK', () => {
      const result = calculateFee(500, 'MWK', 'MWK', 'standard');
      
      expect(result.transferFee).toBe(15.0); // 3% of 500
      expect(result.processingFee).toBe(2.5); // 0.5% standard processing
      expect(result.feePercentage).toBe(3.0);
      expect(result.totalAmount).toBe(517.5); // 500 + 15 + 2.5
      expect(result.fromCurrency).toBe('MWK');
      expect(result.toCurrency).toBe('MWK');
    });

    test('should calculate 3% fee for MZN', () => {
      const result = calculateFee(200, 'MZN', 'MZN', 'standard');
      
      expect(result.transferFee).toBe(6.0); // 3% of 200
      expect(result.processingFee).toBe(1.0); // 0.5% standard processing
      expect(result.feePercentage).toBe(3.0);
      expect(result.totalAmount).toBe(207.0); // 200 + 6 + 1
      expect(result.fromCurrency).toBe('MZN');
      expect(result.toCurrency).toBe('MZN');
    });

    test('should apply minimum fee for small amounts', () => {
      const result = calculateFee(0.1, 'USD', 'USD', 'standard');
      
      expect(result.transferFee).toBe(0.01); // Minimum fee
      expect(result.feePercentage).toBe(3.0);
      expect(result.totalAmount).toBe(0.11); // 0.1 + 0.01
    });

    test('should handle express processing fee', () => {
      const result = calculateFee(100, 'USD', 'USD', 'express');
      
      expect(result.transferFee).toBe(3.0); // 3% transfer fee
      expect(result.processingFee).toBe(1.0); // 1% express processing fee
      expect(result.totalFee).toBe(4.0); // 3 + 1
      expect(result.totalAmount).toBe(104.0);
    });

    test('should handle standard processing fee', () => {
      const result = calculateFee(100, 'USD', 'USD', 'standard');
      
      expect(result.transferFee).toBe(3.0); // 3% transfer fee
      expect(result.processingFee).toBe(0.5); // 0.5% standard processing fee
      expect(result.totalFee).toBe(3.5); // 3 + 0.5
      expect(result.totalAmount).toBe(103.5);
    });

    test('should calculate exchange margin for different currencies', () => {
      const result = calculateFee(100, 'USD', 'ZAR', 'standard');
      
      expect(result.transferFee).toBe(3.0); // 3% transfer fee
      expect(result.processingFee).toBe(0.5); // 0.5% standard processing
      expect(result.exchangeMargin).toBe(0.5); // 0.5% exchange margin
      expect(result.totalFee).toBe(4.0); // 3 + 0.5 + 0.5
      expect(result.totalAmount).toBe(104.0);
    });

    test('should calculate regulatory fee for large amounts', () => {
      const result = calculateFee(100000, 'USD', 'USD', 'standard');
      
      expect(result.transferFee).toBe(3000.0); // 3% transfer fee
      expect(result.processingFee).toBe(500.0); // 0.5% standard processing
      expect(result.regulatoryFee).toBe(25.0); // Capped at $25
      expect(result.totalFee).toBe(3525.0); // 3000 + 500 + 25
      expect(result.totalAmount).toBe(103525.0);
    });

    test('should throw error for negative amount', () => {
      expect(() => calculateFee(-100, 'USD', 'USD')).toThrow('Amount must be positive');
    });

    test('should throw error for zero amount', () => {
      expect(() => calculateFee(0, 'USD', 'USD')).toThrow('Amount must be positive');
    });

    test('should throw error for unsupported currency', () => {
      expect(() => calculateFee(100, 'INVALID', 'USD')).toThrow('Unsupported currency');
    });
  });

  describe('getFeeBreakdown function', () => {
    test('should return detailed fee breakdown', () => {
      const result = getFeeBreakdown(100, 'USD');
      
      expect(result.amount).toBe(100.0);
      expect(result.transferFee).toBe(3.0);
      expect(result.totalAmount).toBe(103.5); // Includes processing fee
      expect(result.breakdown.feeRate).toBe('3%');
      expect(result.breakdown.effectiveRate).toBe('3.00%');
    });

    test('should handle different currencies', () => {
      const result = getFeeBreakdown(500, 'ZAR');
      
      expect(result.amount).toBe(500.0);
      expect(result.transferFee).toBe(15.0);
      expect(result.totalAmount).toBe(520.0); // Includes processing fee
      expect(result.breakdown.feeRate).toBe('3%');
      expect(result.breakdown.effectiveRate).toBe('3.00%');
    });
  });

  describe('validateTransferWithFees function', () => {
    test('should validate sufficient balance', () => {
      const result = validateTransferWithFees(200, 100, 'USD');
      
      expect(result.isValid).toBe(true);
      expect(result.userBalance).toBe(200.0);
      expect(result.transferAmount).toBe(100.0);
      expect(result.feeAmount).toBe(3.0);
      expect(result.totalRequired).toBe(103.5); // Includes processing fee
    });

    test('should reject insufficient balance', () => {
      const result = validateTransferWithFees(100, 100, 'USD');
      
      expect(result.isValid).toBe(false);
      expect(result.userBalance).toBe(100.0);
      expect(result.transferAmount).toBe(100.0);
      expect(result.feeAmount).toBe(3.0);
      expect(result.totalRequired).toBe(103.5); // Includes processing fee
    });

    test('should handle different currencies', () => {
      const result = validateTransferWithFees(1000, 500, 'ZAR');
      
      expect(result.isValid).toBe(true);
      expect(result.userBalance).toBe(1000.0);
      expect(result.transferAmount).toBe(500.0);
      expect(result.feeAmount).toBe(15.0);
      expect(result.totalRequired).toBe(520.0); // Includes processing fee
    });
  });

  describe('Fee Configuration', () => {
    test('should use consistent 3% fee for all currencies', () => {
      const currencies = ['USD', 'ZAR', 'MWK', 'MZN'];
      
      currencies.forEach(currency => {
        const result = calculateFee(100, currency, currency, 'standard');
        expect(result.feePercentage).toBe(3.0);
        expect(result.transferFee).toBe(3.0);
      });
    });

    test('should apply minimum fee correctly', () => {
      const result = calculateFee(0.01, 'USD', 'USD', 'standard');
      expect(result.transferFee).toBe(0.01); // Minimum fee
    });
  });
}); 