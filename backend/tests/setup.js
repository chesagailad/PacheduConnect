/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: setup - handles backend functionality
 */

// Load test environment first
require('dotenv').config({ path: '.env.test' });
const { Sequelize } = require('sequelize');

// Handle ES module compatibility
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
    label: jest.fn(),
    splat: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
    DailyRotateFile: jest.fn()
  }
}));

// Mock bcryptjs to avoid ES module issues
jest.mock('bcryptjs', () => {
  const mockHash = jest.fn().mockResolvedValue('$2b$10$hashedpasswordfor.testing');
  const mockCompare = jest.fn().mockResolvedValue(true);
  const mockGenSalt = jest.fn().mockResolvedValue('$2b$10$salt');
  
  return {
    hash: mockHash,
    compare: mockCompare,
    genSalt: mockGenSalt,
    __mockHash: mockHash,
    __mockCompare: mockCompare,
    __mockGenSalt: mockGenSalt
  };
});

// Also mock bcrypt for backward compatibility
jest.mock('bcrypt', () => {
  const mockHash = jest.fn().mockResolvedValue('$2b$10$hashedpasswordfor.testing');
  const mockCompare = jest.fn().mockResolvedValue(true);
  const mockGenSalt = jest.fn().mockResolvedValue('$2b$10$salt');
  
  return {
    hash: mockHash,
    compare: mockCompare,
    genSalt: mockGenSalt,
    __mockHash: mockHash,
    __mockCompare: mockCompare,
    __mockGenSalt: mockGenSalt
  };
});

// Mock Redis for tests
jest.mock('ioredis', () => {
  return class MockRedis {
    constructor() {
      this.data = new Map();
      this.connected = true;
    }
    
    async get(key) {
      return this.data.get(key) || null;
    }
    
    async set(key, value, ...args) {
      this.data.set(key, value);
      return 'OK';
    }
    
    async setex(key, ttl, value) {
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
    
    async keys(pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Array.from(this.data.keys()).filter(key => regex.test(key));
    }
    
    async ttl(key) {
      return -1; // No expiration in mock
    }

    async on(event, callback) {
      if (event === 'connect') {
        callback();
      }
      return this;
    }

    async connect() {
      this.connected = true;
      return this;
    }

    async disconnect() {
      this.connected = false;
      return this;
    }
  };
});

// Mock session service
jest.mock('../src/chat-bot/services/sessionService', () => ({
  createSession: jest.fn((userId, sessionData) => Promise.resolve({
    id: `session:${userId}:${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    data: sessionData,
    conversationHistory: [],
    context: {}
  })),
  getSession: jest.fn((sessionId) => Promise.resolve({
    id: sessionId,
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    data: {},
    conversationHistory: [],
    context: {}
  })),
  updateSession: jest.fn((sessionId, updates) => Promise.resolve({
    id: sessionId,
    userId: 'test-user',
    ...updates,
    updatedAt: new Date().toISOString()
  })),
  addMessage: jest.fn((sessionId, message) => Promise.resolve({
    id: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: message.type || 'user',
    content: message.content,
    metadata: message.metadata || {}
  })),
  updateContext: jest.fn((sessionId, context) => Promise.resolve(context)),
  endSession: jest.fn((sessionId) => Promise.resolve(true)),
  getUserSessions: jest.fn((userId) => Promise.resolve([])),
  getSessionStats: jest.fn(() => Promise.resolve({
    total: 0,
    active: 0,
    ended: 0,
    recent: 0
  })),
  close: jest.fn(() => Promise.resolve())
}));

// Mock database connection
jest.mock('../src/utils/database', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    define: jest.fn(),
    model: jest.fn(),
    models: {},
    transaction: jest.fn().mockImplementation((callback) => {
      return Promise.resolve(callback({}));
    })
  };

  return {
    connectDB: jest.fn().mockResolvedValue(mockSequelize),
    getSequelize: jest.fn().mockReturnValue(mockSequelize),
    sequelize: mockSequelize
  };
});

// Global test database instance
let testSequelize;

// Only run database setup if Jest globals are available
if (typeof beforeAll !== 'undefined') {
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
}

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

// Mock security services
jest.mock('../src/services/pciComplianceService', () => ({
  encryptSensitiveData: jest.fn((data) => ({
    encrypted: true,
    data: 'encrypted-data',
    iv: 'test-iv'
  })),
  decryptSensitiveData: jest.fn((encryptedData) => ({
    decrypted: true,
    data: 'decrypted-data'
  })),
  maskSensitiveData: jest.fn((data) => ({
    creditCard: '4111********1111',
    ssn: '123-**-6789',
    phone: '+12-***-7890',
    email: 't***@example.com'
  }))
}));

jest.mock('../src/services/securityMonitoringService', () => ({
  performHealthCheck: jest.fn(() => ({
    status: 'healthy',
    metrics: { uptime: 100, errors: 0 },
    timestamp: new Date().toISOString()
  })),
  detectThreats: jest.fn(() => []),
  logSecurityEvent: jest.fn()
}));

jest.mock('../src/services/mfaService', () => ({
  generateTOTPSecret: jest.fn(() => ({
    secret: 'test-secret',
    otpauthUrl: 'otpauth://totp/test'
  })),
  generateQRCode: jest.fn(() => 'data:image/png;base64,test-qr-code'),
  generateBackupCodes: jest.fn(() => ['code1', 'code2', 'code3']),
  verifyTOTPToken: jest.fn(() => true),
  verifyBackupCode: jest.fn(() => true)
}));

jest.mock('../src/services/tokenService', () => ({
  generateTokens: jest.fn(() => ({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  })),
  refreshAccessToken: jest.fn(() => ({
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  })),
  blacklistToken: jest.fn(),
  verifyToken: jest.fn(() => ({ valid: true, payload: { userId: 'test-user' } }))
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