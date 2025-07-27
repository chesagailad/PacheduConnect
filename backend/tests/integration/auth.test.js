const request = require('supertest');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');

// Import the necessary modules
const authRoutes = require('../../src/routes/auth');
const createUserModel = require('../../src/models/User');
const userFixtures = require('../fixtures/users');

// Mock external services
jest.mock('../../src/services/smsService');
jest.mock('../../src/utils/redis');

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

    // Mock database utility
    jest.doMock('../../src/utils/database', () => ({
      getSequelize: () => sequelize
    }));

    // Initialize models
    User = createUserModel(sequelize);
    await sequelize.sync({ force: true });

    // Setup Express app with routes
    app = express();
    app.use(express.json());
    
    // Add error handling middleware
    app.use((err, req, res, next) => {
      console.error('Test Error:', err);
      res.status(500).json({ message: err.message });
    });
    
    app.use('/api/auth', authRoutes);
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

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        phoneNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      if (response.status !== 201) {
        console.error('Registration failed. Status:', response.status);
        console.error('Response body:', JSON.stringify(response.body, null, 2));
        console.error('Response text:', response.text);
      }

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.passwordHash).toBeUndefined();
      
      // Verify user was created in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).toBeDefined();
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe',
        email: 'john@example.com'
        // Missing password and phoneNumber
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    test('should return 400 for invalid email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePassword123!',
        phoneNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    test('should return 400 for invalid phone number format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        phoneNumber: '123456789' // Missing country code
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('valid phone number');
    });

    test('should return 409 for duplicate email', async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      await User.create(userData);

      const duplicateUser = {
        name: 'Jane Doe',
        email: userData.email, // Same email
        password: 'AnotherPassword123!',
        phoneNumber: '+27987654321'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      testUser = await User.create(userData);
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: userFixtures.validUser.email,
        password: userFixtures.validUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user.passwordHash).toBeUndefined();

      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUser.id);
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    test('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: userFixtures.validUser.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return 401 for invalid password', async () => {
      const loginData = {
        email: userFixtures.validUser.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /api/auth/verify-phone', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      // Create and authenticate a test user
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      testUser = await User.create(userData);
      
      authToken = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    test('should send OTP for phone verification', async () => {
      const response = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: '+27123456789'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('OTP sent');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/verify-phone')
        .send({
          phoneNumber: '+27123456789'
        });

      expect(response.status).toBe(401);
    });

    test('should return 400 for invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/verify-phone')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: 'invalid-phone'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let testUser;

    beforeEach(async () => {
      const userData = await userFixtures.createUserWithHashedPassword(userFixtures.validUser);
      testUser = await User.create(userData);
    });

    test('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');
    });

    test('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    test('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(6).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});