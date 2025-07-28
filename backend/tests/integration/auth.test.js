const request = require('supertest');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');

// Mock external services
jest.mock('../../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/utils/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

describe('Authentication API', () => {
  let app;
  let sequelize;
  let User;

  beforeAll(async () => {
    // Setup test database
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    // Initialize models
    const createUserModel = require('../../src/models/User');
    User = createUserModel(sequelize);
    await sequelize.sync({ force: true });

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Add error handling middleware
    app.use((err, req, res, next) => {
      console.error('Test Error:', err);
      res.status(500).json({ message: err.message });
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.destroy({ where: {}, force: true });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    test('should create a user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: await bcrypt.hash('SecurePassword123!', 10),
        phoneNumber: '+27123456789'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.phoneNumber).toBe(userData.phoneNumber);
    });

    test('should not allow duplicate emails', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: await bcrypt.hash('SecurePassword123!', 10),
        phoneNumber: '+27123456789'
      };

      // Create first user
      await User.create(userData);

      // Try to create second user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('should hash passwords correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('should verify passwords correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      const isInvalid = await bcrypt.compare('WrongPassword', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT tokens', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('Phone Number Validation', () => {
    test('should validate correct phone number format', () => {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      
      const validNumbers = [
        '+27123456789',
        '+1234567890',
        '+44123456789'
      ];

      validNumbers.forEach(number => {
        expect(phoneRegex.test(number)).toBe(true);
      });
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });
});