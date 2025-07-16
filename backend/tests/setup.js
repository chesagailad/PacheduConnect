const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env.test' });

// Mock Redis for tests
jest.mock('ioredis', () => {
  return class MockRedis {
    constructor() {
      this.data = new Map();
    }
    
    async get(key) {
      return this.data.get(key) || null;
    }
    
    async set(key, value, ...args) {
      this.data.set(key, value);
      return 'OK';
    }
    
    async del(key) {
      return this.data.delete(key) ? 1 : 0;
    }
    
    async flushall() {
      this.data.clear();
      return 'OK';
    }
    
    async exists(key) {
      return this.data.has(key) ? 1 : 0;
    }
    
    async ttl(key) {
      return -1; // No expiration in mock
    }
  };
});

// Global test database instance
let testSequelize;

beforeAll(async () => {
  // Setup test database
  testSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true }
  });
  
  // Set global test DB
  global.testDB = testSequelize;
});

afterAll(async () => {
  if (testSequelize) {
    await testSequelize.close();
  }
});

// Mock external services
jest.mock('../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'test-123' }),
  sendOTP: jest.fn().mockResolvedValue({ success: true, messageId: 'test-123' }),
  verifyOTP: jest.fn().mockResolvedValue({ success: true, valid: true })
}));

jest.mock('../src/services/paymentGateways', () => ({
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    transactionId: 'test-txn-123',
    status: 'completed'
  }),
  getAvailableGateways: jest.fn().mockResolvedValue({
    stripe: { supported: true, currencies: ['USD', 'ZAR'] },
    paypal: { supported: true, currencies: ['USD', 'EUR'] }
  })
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SMS_PORTAL_API_KEY = 'test-sms-api-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_test-stripe-key';

// Console suppression for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};