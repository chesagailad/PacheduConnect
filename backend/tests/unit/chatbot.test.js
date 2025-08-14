const request = require('supertest');
const { getSequelize } = require('../../src/utils/database');
const createUserModel = require('../../src/models/User');

// Mock external services
jest.mock('../../src/chat-bot/services/openaiService', () => ({
  analyzeIntent: jest.fn(),
  extractEntities: jest.fn(),
  generateResponse: jest.fn(),
  analyzeSentiment: jest.fn()
}));

jest.mock('../../src/chat-bot/services/languageService', () => ({
  detectLanguage: jest.fn(),
  translateResponse: jest.fn()
}));

jest.mock('../../src/chat-bot/services/analyticsService', () => ({
  trackEvent: jest.fn(),
  trackNLPProcessing: jest.fn(),
  trackResponseGeneration: jest.fn()
}));

jest.mock('../../src/chat-bot/services/sessionService', () => ({
  createSession: jest.fn(),
  getSession: jest.fn(),
  addMessage: jest.fn(),
  updateContext: jest.fn(),
  getSessionsByUserId: jest.fn()
}));

describe('Chatbot System Tests', () => {
  let app, User, sequelize, testUser, authToken;

  beforeAll(async () => {
    // Setup test database
    sequelize = getSequelize();
    User = createUserModel(sequelize);
    
    // Sync models
    await sequelize.sync({ force: true });
    
    // Import app after database setup
    app = require('../../src/app');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.destroy({ where: {} });

    // Create test user
    testUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed_password',
      phoneNumber: '+27123456789'
    });

    // Generate auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('Basic Chatbot Functionality (UC-071 to UC-075)', () => {
    test('UC-071: Should open and close chatbot widget', async () => {
      const response = await request(app)
        .post('/api/chatbot/toggle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isOpen: true })
        .expect(200);

      expect(response.body).toHaveProperty('isOpen', true);
      expect(response.body).toHaveProperty('sessionId');
    });

    test('UC-072: Should send and receive messages', async () => {
      const messageData = {
        content: 'Hello, how can I help you?',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.content).toBe(messageData.content);
      expect(response.body.message.sender).toBe('bot');
    });

    test('UC-073: Should handle quick reply buttons', async () => {
      const quickReplyData = {
        content: 'How do I send money?',
        quickReplies: [
          'Send money',
          'Check rates',
          'KYC help',
          'Contact support'
        ]
      };

      const response = await request(app)
        .post('/api/chatbot/quick-reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quickReplyData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.type).toBe('quick-reply');
      expect(response.body.message.quickReplies).toHaveLength(4);
    });

    test('UC-074: Should maintain conversation history', async () => {
      const sessionService = require('../../src/chat-bot/services/sessionService');
      sessionService.getSession.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        messages: [
          { content: 'Hello', sender: 'user', timestamp: new Date() },
          { content: 'Hi there!', sender: 'bot', timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/chatbot/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('messages');
      expect(response.body.messages).toHaveLength(2);
    });

    test('UC-075: Should handle offline chatbot', async () => {
      // Mock network failure
      const openaiService = require('../../src/chat-bot/services/openaiService');
      openaiService.analyzeIntent.mockRejectedValue(new Error('Network error'));

      const messageData = {
        content: 'Hello',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('offline');
      expect(response.body.message.content).toContain('try again later');
    });
  });

  describe('Advanced Chatbot Features (UC-076 to UC-080)', () => {
    test('UC-076: Should integrate OpenAI NLP', async () => {
      const openaiService = require('../../src/chat-bot/services/openaiService');
      openaiService.analyzeIntent.mockResolvedValue({
        intent: 'send_money',
        confidence: 0.95
      });
      openaiService.extractEntities.mockResolvedValue({
        amount: 1000,
        currency: 'USD',
        recipient: 'john@example.com'
      });
      openaiService.generateResponse.mockResolvedValue({
        content: 'I can help you send money. Please provide the recipient details.',
        type: 'text'
      });

      const messageData = {
        content: 'I want to send $1000 to john@example.com',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(openaiService.analyzeIntent).toHaveBeenCalledWith(messageData.content);
      expect(openaiService.extractEntities).toHaveBeenCalledWith(messageData.content);
      expect(response.body.message.content).toContain('send money');
    });

    test('UC-077: Should support multiple languages', async () => {
      const languageService = require('../../src/chat-bot/services/languageService');
      languageService.detectLanguage.mockResolvedValue('shona');
      languageService.translateResponse.mockResolvedValue({
        content: 'Ndinokubatsira sei?',
        language: 'shona'
      });

      const messageData = {
        content: 'How can you help me?',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(languageService.detectLanguage).toHaveBeenCalledWith(messageData.content);
      expect(languageService.translateResponse).toHaveBeenCalled();
      expect(response.body.message.language).toBe('shona');
    });

    test('UC-078: Should process voice input', async () => {
      const voiceData = {
        audioBuffer: Buffer.from('mock audio data'),
        language: 'en'
      };

      const response = await request(app)
        .post('/api/chatbot/voice')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voiceData)
        .expect(200);

      expect(response.body).toHaveProperty('transcription');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message.sender).toBe('bot');
    });

    test('UC-079: Should provide context-aware responses', async () => {
      const sessionService = require('../../src/chat-bot/services/sessionService');
      sessionService.getSession.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        context: {
          lastIntent: 'send_money',
          pendingAmount: 1000,
          pendingCurrency: 'USD'
        }
      });

      const messageData = {
        content: 'Yes, proceed with the transfer',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('transfer');
      expect(response.body.message.content).toContain('1000');
      expect(response.body.message.content).toContain('USD');
    });

    test('UC-080: Should track transactions via chat', async () => {
      const messageData = {
        content: 'Track my transaction PC123456789',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('PC123456789');
      expect(response.body.message.content).toContain('tracking');
    });
  });

  describe('Chatbot Services (UC-081 to UC-085)', () => {
    test('UC-081: Should provide KYC assistance', async () => {
      const messageData = {
        content: 'I need help with KYC verification',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('KYC');
      expect(response.body.message.content).toContain('documents');
      expect(response.body.message.content).toContain('verification');
    });

    test('UC-082: Should answer exchange rate queries', async () => {
      const messageData = {
        content: 'What is the exchange rate for ZAR to USD?',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('exchange rate');
      expect(response.body.message.content).toContain('ZAR');
      expect(response.body.message.content).toContain('USD');
    });

    test('UC-083: Should calculate fees via chat', async () => {
      const messageData = {
        content: 'Calculate fees for sending R10,000',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('R10,000');
      expect(response.body.message.content).toContain('fee');
      expect(response.body.message.content).toContain('3%');
    });

    test('UC-084: Should escalate to live agent', async () => {
      const messageData = {
        content: 'I need to speak to a human agent',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body.message.content).toContain('live agent');
      expect(response.body.message.content).toContain('connecting');
      expect(response.body).toHaveProperty('escalation');
    });

    test('UC-085: Should create support tickets', async () => {
      const ticketData = {
        subject: 'Payment Issue',
        description: 'My payment failed to process',
        priority: 'high',
        category: 'payment'
      };

      const response = await request(app)
        .post('/api/chatbot/support-ticket')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData)
        .expect(200);

      expect(response.body).toHaveProperty('ticketId');
      expect(response.body.message).toContain('support ticket created');
    });
  });

  describe('Chatbot Analytics', () => {
    test('Should track conversation events', async () => {
      const analyticsService = require('../../src/chat-bot/services/analyticsService');
      
      const messageData = {
        content: 'Hello',
        type: 'text'
      };

      await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'message_sent',
        expect.objectContaining({
          userId: testUser.id,
          content: messageData.content,
          type: messageData.type
        })
      );
    });

    test('Should track NLP processing', async () => {
      const analyticsService = require('../../src/chat-bot/services/analyticsService');
      
      const messageData = {
        content: 'I want to send money',
        type: 'text'
      };

      await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(analyticsService.trackNLPProcessing).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          intent: expect.any(String),
          confidence: expect.any(Number)
        })
      );
    });

    test('Should track response generation', async () => {
      const analyticsService = require('../../src/chat-bot/services/analyticsService');
      
      const messageData = {
        content: 'Help me with KYC',
        type: 'text'
      };

      await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(analyticsService.trackResponseGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          responseType: expect.any(String),
          responseTime: expect.any(Number)
        })
      );
    });
  });

  describe('Chatbot Error Handling', () => {
    test('Should handle invalid message format', async () => {
      const invalidMessageData = {
        // Missing required content field
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMessageData)
        .expect(400);

      expect(response.body.error).toContain('content');
    });

    test('Should handle authentication errors', async () => {
      const messageData = {
        content: 'Hello',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .send(messageData)
        .expect(401);

      expect(response.body.error).toContain('authentication');
    });

    test('Should handle session errors', async () => {
      const sessionService = require('../../src/chat-bot/services/sessionService');
      sessionService.getSession.mockRejectedValue(new Error('Session not found'));

      const messageData = {
        content: 'Hello',
        type: 'text'
      };

      const response = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(500);

      expect(response.body.error).toContain('session');
    });
  });
}); 