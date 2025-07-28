/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: nlpService.test - test file for backend functionality
 */

const nlpService = require('../../../src/chat-bot/services/nlpService');

describe('NLP Service', () => {
  describe('Intent Recognition', () => {
    test('should recognize greeting intent', async () => {
      const result = await nlpService.processMessage('hello');
      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize exchange rate intent', async () => {
      const result = await nlpService.processMessage('what is the exchange rate for USD to ZAR?');
      expect(result.intent).toBe('exchange_rate');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize send money intent', async () => {
      const result = await nlpService.processMessage('I want to send money to Zimbabwe');
      expect(result.intent).toBe('send_money');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize track transaction intent', async () => {
      const result = await nlpService.processMessage('track my transaction PC123456');
      expect(result.intent).toBe('track_transaction');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize KYC help intent', async () => {
      const result = await nlpService.processMessage('help with KYC verification');
      expect(result.intent).toBe('kyc_help');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize fees info intent', async () => {
      const result = await nlpService.processMessage('how much are the fees?');
      expect(result.intent).toBe('fees_info');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize support intent', async () => {
      const result = await nlpService.processMessage('I need help with my account');
      expect(result.intent).toBe('support');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should recognize goodbye intent', async () => {
      const result = await nlpService.processMessage('thank you, goodbye');
      expect(result.intent).toBe('goodbye');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle unknown intent with fallback', async () => {
      const result = await nlpService.processMessage('random gibberish text');
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Entity Extraction', () => {
    test('should extract currency entities', async () => {
      const result = await nlpService.processMessage('convert 100 USD to ZAR');
      const currencyEntities = result.entities.filter(e => e.entity === 'currency');
      expect(currencyEntities).toHaveLength(2);
      expect(currencyEntities[0].value).toBe('USD');
      expect(currencyEntities[1].value).toBe('ZAR');
    });

    test('should extract amount entities', async () => {
      const result = await nlpService.processMessage('send R1000 to Zimbabwe');
      const amountEntities = result.entities.filter(e => e.entity === 'amount');
      expect(amountEntities).toHaveLength(1);
      expect(amountEntities[0].value).toBe('1000');
    });

    test('should extract transaction ID entities', async () => {
      const result = await nlpService.processMessage('track transaction PC123456');
      const transactionEntities = result.entities.filter(e => e.entity === 'transaction_id');
      expect(transactionEntities).toHaveLength(1);
      expect(transactionEntities[0].value).toBe('PC123456');
    });

    test('should handle multiple entities in one message', async () => {
      const result = await nlpService.processMessage('send R500 USD to Zimbabwe');
      expect(result.entities).toHaveLength(3); // amount, currency, currency
    });

    test('should handle no entities gracefully', async () => {
      const result = await nlpService.processMessage('hello there');
      expect(result.entities).toHaveLength(0);
    });
  });

  describe('Confidence Scoring', () => {
    test('should return high confidence for exact pattern matches', async () => {
      const result = await nlpService.processMessage('hello');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should return lower confidence for partial matches', async () => {
      const result = await nlpService.processMessage('hi there how are you');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(0.9);
    });

    test('should consider context in confidence calculation', async () => {
      const context = { previousIntent: 'greeting' };
      const result = await nlpService.processMessage('goodbye', context);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Context Awareness', () => {
    test('should use conversation context for better intent recognition', async () => {
      const context = { 
        previousIntent: 'exchange_rate',
        entities: [{ entity: 'currency', value: 'USD' }]
      };
      const result = await nlpService.processMessage('what about ZAR?', context);
      expect(result.intent).toBe('exchange_rate');
    });

    test('should handle empty context gracefully', async () => {
      const result = await nlpService.processMessage('hello', {});
      expect(result.intent).toBe('greeting');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty message', async () => {
      const result = await nlpService.processMessage('');
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.3);
    });

    test('should handle very long messages', async () => {
      const longMessage = 'hello '.repeat(100);
      const result = await nlpService.processMessage(longMessage);
      expect(result.intent).toBe('greeting');
    });

    test('should handle special characters', async () => {
      const result = await nlpService.processMessage('hello! @#$%^&*()');
      expect(result.intent).toBe('greeting');
    });

    test('should handle numbers and symbols', async () => {
      const result = await nlpService.processMessage('send R1000 to Zimbabwe');
      expect(result.intent).toBe('send_money');
    });
  });

  describe('Performance', () => {
    test('should process messages quickly', async () => {
      const startTime = Date.now();
      await nlpService.processMessage('hello');
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle concurrent requests', async () => {
      const promises = Array(10).fill().map(() => 
        nlpService.processMessage('hello')
      );
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.intent).toBe('greeting');
      });
    });
  });
}); 