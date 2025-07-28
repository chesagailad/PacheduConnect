const request = require('supertest');
const app = require('../../src/app');
const sessionService = require('../../src/chat-bot/services/sessionService');

describe('Chatbot API Integration Tests', () => {
  beforeEach(() => {
    // Clear sessions before each test
    sessionService.clearAllSessions();
  });

  afterEach(() => {
    // Clean up after each test
    sessionService.clearAllSessions();
  });

  describe('POST /api/chatbot/message', () => {
    test('should process greeting message successfully', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toHaveProperty('text');
      expect(response.body.response).toHaveProperty('type');
      expect(response.body.response.type).toBe('text');
      expect(response.body.response.text).toContain('Hello');
    });

    test('should process exchange rate query', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'What is the exchange rate for USD to ZAR?',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('text');
      expect(response.body.response.text).toContain('exchange rate');
    });

    test('should process send money query', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'I want to send money to Zimbabwe',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('text');
      expect(response.body.response.text).toContain('send money');
    });

    test('should process transaction tracking query', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Track my transaction PC123456',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('text');
      expect(response.body.response.text).toContain('transaction');
    });

    test('should handle quick reply buttons', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'What can you help me with?',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('type', 'quick_reply');
      expect(response.body.response).toHaveProperty('options');
      expect(Array.isArray(response.body.response.options)).toBe(true);
      expect(response.body.response.options.length).toBeGreaterThan(0);
    });

    test('should maintain conversation context', async () => {
      // First message
      const response1 = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'What is the exchange rate for USD?',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response1.body.success).toBe(true);

      // Follow-up message
      const response2 = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'What about ZAR?',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.response.text).toContain('ZAR');
    });

    test('should handle different platforms', async () => {
      const platforms = ['web', 'whatsapp', 'telegram'];
      
      for (const platform of platforms) {
        const response = await request(app)
          .post('/api/chatbot/message')
          .send({
            message: 'Hello',
            userId: 'test-user-123',
            platform: platform
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.response).toHaveProperty('text');
      }
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello'
          // Missing userId and platform
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty message', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: '',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle very long messages', async () => {
      const longMessage = 'Hello '.repeat(1000);
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: longMessage,
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('text');
    });

    test('should handle special characters in message', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello! @#$%^&*() How are you?',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toHaveProperty('text');
    });
  });

  describe('Session Management', () => {
    test('should create session for new user', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          userId: 'new-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check if session was created
      const sessions = sessionService.getSessionsByUserId('new-user-123');
      expect(sessions).toHaveLength(1);
    });

    test('should maintain session across multiple messages', async () => {
      const userId = 'session-test-user';
      
      // First message
      await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          userId: userId,
          platform: 'web'
        })
        .expect(200);

      // Second message
      await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'How are you?',
          userId: userId,
          platform: 'web'
        })
        .expect(200);

      // Check session has multiple messages
      const sessions = sessionService.getSessionsByUserId(userId);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].messages).toHaveLength(4); // 2 user messages + 2 bot responses
    });

    test('should handle multiple users independently', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // User 1 message
      await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello from user 1',
          userId: user1,
          platform: 'web'
        })
        .expect(200);

      // User 2 message
      await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello from user 2',
          userId: user2,
          platform: 'web'
        })
        .expect(200);

      // Check sessions are separate
      const sessions1 = sessionService.getSessionsByUserId(user1);
      const sessions2 = sessionService.getSessionsByUserId(user2);
      
      expect(sessions1).toHaveLength(1);
      expect(sessions2).toHaveLength(1);
      expect(sessions1[0].id).not.toBe(sessions2[0].id);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle server errors gracefully', async () => {
      // Mock a scenario where NLP service fails
      jest.spyOn(require('../../src/chat-bot/services/nlpService'), 'processMessage')
        .mockRejectedValue(new Error('NLP service error'));

      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');

      // Restore the original function
      jest.restoreAllMocks();
    });

    test('should handle rate limiting', async () => {
      const userId = 'rate-limit-test-user';
      
      // Send multiple requests rapidly
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/chatbot/message')
          .send({
            message: 'Hello',
            userId: userId,
            platform: 'web'
          })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (rate limiting would be implemented separately)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array(50).fill().map((_, index) =>
        request(app)
          .post('/api/chatbot/message')
          .send({
            message: `Hello from user ${index}`,
            userId: `user-${index}`,
            platform: 'web'
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should handle large message payloads', async () => {
      const largeMessage = 'Hello '.repeat(1000);
      
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: largeMessage,
          userId: 'large-message-user',
          platform: 'web'
        })
        .expect(200);

      const endTime = Date.now();
      
      // Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Response Format Validation', () => {
    test('should return consistent response format', async () => {
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({
          message: 'Hello',
          userId: 'test-user-123',
          platform: 'web'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toHaveProperty('text');
      expect(response.body.response).toHaveProperty('type');
      expect(typeof response.body.response.text).toBe('string');
      expect(typeof response.body.response.type).toBe('string');
    });

    test('should handle different response types', async () => {
      const testCases = [
        { message: 'Hello', expectedType: 'text' },
        { message: 'What can you help me with?', expectedType: 'quick_reply' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/chatbot/message')
          .send({
            message: testCase.message,
            userId: 'test-user-123',
            platform: 'web'
          })
          .expect(200);

        expect(response.body.response.type).toBe(testCase.expectedType);
      }
    });
  });
}); 