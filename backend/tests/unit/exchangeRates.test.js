const axios = require('axios');
const { getSequelize } = require('../../src/utils/database');

// Mock axios for external API calls
jest.mock('axios');

describe('Exchange Rate & Currency System Tests', () => {
  let exchangeRateService;

  beforeAll(async () => {
    // Import the exchange rate service
    exchangeRateService = require('../../src/utils/exchangeRate');
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Real-time Exchange Rates (UC-048 to UC-052)', () => {
    test('UC-048: Should integrate with XE API for live rates', async () => {
      // Mock successful XE API response
      axios.get.mockResolvedValue({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      const rate = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      
      expect(rate).toBeDefined();
      expect(rate.rate).toBe(0.054100);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('xecdapi.xe.com'),
        expect.objectContaining({
          auth: {
            username: expect.any(String),
            password: expect.any(String)
          }
        })
      );
    });

    test('UC-049: Should apply 1.5% margin to rates', async () => {
      // Mock XE API response with base rate
      axios.get.mockResolvedValue({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.053300, // Base rate without margin
          timestamp: new Date().toISOString()
        }
      });

      const rate = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      
      // Should apply 1.5% margin
      const expectedRate = 0.053300 * 1.015; // 1.5% margin
      expect(rate.rate).toBeCloseTo(expectedRate, 6);
    });

    test('UC-050: Should cache rates for 5 minutes', async () => {
      // Mock first API call
      axios.get.mockResolvedValueOnce({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      // First call - should hit API
      const rate1 = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call within 5 minutes - should use cache
      const rate2 = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      expect(axios.get).toHaveBeenCalledTimes(1); // Still only 1 call

      expect(rate1.rate).toBe(rate2.rate);
    });

    test('UC-051: Should fallback to static rates when API unavailable', async () => {
      // Mock API failure
      axios.get.mockRejectedValue(new Error('API unavailable'));

      const rate = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      
      expect(rate).toBeDefined();
      expect(rate.rate).toBeDefined();
      expect(rate.source).toBe('static'); // Should indicate fallback source
    });

    test('UC-052: Should support multiple currencies', async () => {
      const supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'MWK', 'MZN'];
      
      for (const fromCurrency of supportedCurrencies) {
        for (const toCurrency of supportedCurrencies) {
          if (fromCurrency !== toCurrency) {
            // Mock API response for each currency pair
            axios.get.mockResolvedValue({
              data: {
                from: fromCurrency,
                to: toCurrency,
                rate: 1.0, // Mock rate
                timestamp: new Date().toISOString()
              }
            });

            const rate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
            expect(rate).toBeDefined();
            expect(rate.from).toBe(fromCurrency);
            expect(rate.to).toBe(toCurrency);
          }
        }
      }
    });
  });

  describe('Currency Conversion (UC-053 to UC-056)', () => {
    test('UC-053: Should perform real-time currency conversion', async () => {
      // Mock exchange rate
      axios.get.mockResolvedValue({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      const amount = 10000; // ZAR 10,000
      const converted = await exchangeRateService.convertCurrency(amount, 'ZAR', 'USD');
      
      const expectedAmount = amount * 0.054100;
      expect(converted.amount).toBeCloseTo(expectedAmount, 2);
      expect(converted.fromCurrency).toBe('ZAR');
      expect(converted.toCurrency).toBe('USD');
    });

    test('UC-054: Should calculate fees in different currencies', async () => {
      // Mock exchange rates for fee calculation
      axios.get.mockResolvedValue({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      const amount = 10000; // ZAR 10,000
      const feeCalculation = await exchangeRateService.calculateFees(amount, 'ZAR', 'USD');
      
      expect(feeCalculation).toHaveProperty('transferFee');
      expect(feeCalculation).toHaveProperty('processingFee');
      expect(feeCalculation).toHaveProperty('exchangeMargin');
      expect(feeCalculation).toHaveProperty('totalFee');
      expect(feeCalculation).toHaveProperty('totalAmount');
    });

    test('UC-055: Should display exchange rates clearly', async () => {
      // Mock exchange rate
      axios.get.mockResolvedValue({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      const rateInfo = await exchangeRateService.getRateInfo('ZAR', 'USD');
      
      expect(rateInfo).toHaveProperty('rate');
      expect(rateInfo).toHaveProperty('formattedRate');
      expect(rateInfo).toHaveProperty('lastUpdated');
      expect(rateInfo).toHaveProperty('margin');
      expect(rateInfo.margin).toBe(1.5); // 1.5% margin
    });

    test('UC-056: Should validate conversion accuracy', async () => {
      // Mock exchange rate
      axios.get.mockResolvedValue({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      const amount = 10000;
      const converted = await exchangeRateService.convertCurrency(amount, 'ZAR', 'USD');
      
      // Reverse conversion should be close to original amount
      const reverseConverted = await exchangeRateService.convertCurrency(
        converted.amount, 
        'USD', 
        'ZAR'
      );
      
      // Allow for small rounding differences
      expect(reverseConverted.amount).toBeCloseTo(amount, -2);
    });
  });

  describe('Exchange Rate Edge Cases', () => {
    test('Should handle API rate limits', async () => {
      // Mock rate limit error
      axios.get.mockRejectedValue({
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        }
      });

      const rate = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      
      expect(rate).toBeDefined();
      expect(rate.source).toBe('static'); // Should fallback to static rates
    });

    test('Should handle network timeouts', async () => {
      // Mock timeout error
      axios.get.mockRejectedValue(new Error('Network timeout'));

      const rate = await exchangeRateService.getExchangeRate('ZAR', 'USD');
      
      expect(rate).toBeDefined();
      expect(rate.source).toBe('static');
    });

    test('Should handle invalid currency pairs', async () => {
      const invalidRate = await exchangeRateService.getExchangeRate('INVALID', 'USD');
      
      expect(invalidRate).toBeDefined();
      expect(invalidRate.rate).toBeNull();
      expect(invalidRate.error).toBeDefined();
    });

    test('Should handle zero amounts', async () => {
      const converted = await exchangeRateService.convertCurrency(0, 'ZAR', 'USD');
      
      expect(converted.amount).toBe(0);
      expect(converted.fromCurrency).toBe('ZAR');
      expect(converted.toCurrency).toBe('USD');
    });

    test('Should handle negative amounts', async () => {
      const converted = await exchangeRateService.convertCurrency(-1000, 'ZAR', 'USD');
      
      expect(converted.amount).toBeLessThan(0);
      expect(converted.error).toBeDefined();
    });
  });

  describe('Margin Application Logic', () => {
    test('Should apply margin correctly to different currency pairs', async () => {
      const testCases = [
        { from: 'ZAR', to: 'USD', baseRate: 0.054100 },
        { from: 'USD', to: 'ZAR', baseRate: 18.500000 },
        { from: 'ZAR', to: 'MWK', baseRate: 93.800000 },
        { from: 'USD', to: 'MWK', baseRate: 1735.000000 }
      ];

      for (const testCase of testCases) {
        axios.get.mockResolvedValue({
          data: {
            from: testCase.from,
            to: testCase.to,
            rate: testCase.baseRate,
            timestamp: new Date().toISOString()
          }
        });

        const rate = await exchangeRateService.getExchangeRate(testCase.from, testCase.to);
        const expectedRate = testCase.baseRate * 1.015; // 1.5% margin
        
        expect(rate.rate).toBeCloseTo(expectedRate, 6);
      }
    });

    test('Should not apply margin to same currency conversions', async () => {
      const rate = await exchangeRateService.getExchangeRate('USD', 'USD');
      
      expect(rate.rate).toBe(1.0);
      expect(rate.margin).toBe(0);
    });
  });

  describe('Cache Management', () => {
    test('Should expire cache after 5 minutes', async () => {
      // Mock first API call
      axios.get.mockResolvedValueOnce({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.054100,
          timestamp: new Date().toISOString()
        }
      });

      // First call
      await exchangeRateService.getExchangeRate('ZAR', 'USD');
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Mock second API call (different rate)
      axios.get.mockResolvedValueOnce({
        data: {
          from: 'ZAR',
          to: 'USD',
          rate: 0.055000, // Different rate
          timestamp: new Date().toISOString()
        }
      });

      // Simulate time passing (5 minutes + 1 second)
      const originalDate = Date;
      const futureTime = new Date(Date.now() + 5 * 60 * 1000 + 1000);
      global.Date = class extends Date {
        constructor() {
          return new originalDate(futureTime);
        }
      };

      // Second call after cache expiry
      await exchangeRateService.getExchangeRate('ZAR', 'USD');
      expect(axios.get).toHaveBeenCalledTimes(2);

      // Restore original Date
      global.Date = originalDate;
    });

    test('Should cache different currency pairs separately', async () => {
      // Mock different rates for different pairs
      axios.get
        .mockResolvedValueOnce({
          data: {
            from: 'ZAR',
            to: 'USD',
            rate: 0.054100,
            timestamp: new Date().toISOString()
          }
        })
        .mockResolvedValueOnce({
          data: {
            from: 'USD',
            to: 'ZAR',
            rate: 18.500000,
            timestamp: new Date().toISOString()
          }
        });

      // Call different currency pairs
      await exchangeRateService.getExchangeRate('ZAR', 'USD');
      await exchangeRateService.getExchangeRate('USD', 'ZAR');

      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
}); 