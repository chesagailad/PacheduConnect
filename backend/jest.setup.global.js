/**
 * Global Jest Setup
 */

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.env for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SMS_PORTAL_API_KEY = 'test-sms-api-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_test-stripe-key';
process.env.DATABASE_URL = 'sqlite::memory:';

// Global test utilities
global.testUtils = {
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+27123456789',
    passwordHash: '$2b$10$hashedpasswordfor.testing',
    ...overrides
  }),
  
  createTestTransaction: (overrides = {}) => ({
    amount: 100,
    currency: 'USD',
    recipientId: 'test-recipient',
    description: 'Test transaction',
    ...overrides
  })
};
