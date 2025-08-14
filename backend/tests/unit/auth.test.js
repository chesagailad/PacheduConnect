const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getSequelize } = require('../../src/utils/database');
const createUserModel = require('../../src/models/User');
const createKYCModel = require('../../src/models/KYC');

// Mock SMS service
jest.mock('../../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true })
}));

describe('Authentication System Tests', () => {
  let app, User, KYC, sequelize;

  beforeAll(async () => {
    // Setup test database
    sequelize = getSequelize();
    User = createUserModel(sequelize);
    KYC = createKYCModel(sequelize);
    
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
    await KYC.destroy({ where: {} });
  });

  describe('User Registration (UC-001 to UC-005)', () => {
    test('UC-001: Should register new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phoneNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.phoneNumber).toBe(userData.phoneNumber);
    });

    test('UC-002: Should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        phoneNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    test('UC-002: Should validate password strength', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        phoneNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    test('UC-002: Should validate phone number format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phoneNumber: '1234567890' // Missing country code
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('phone number');
    });

    test('UC-003: Should prevent duplicate email registration', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phoneNumber: '+27123456789'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.message).toContain('already registered');
    });

    test('UC-004: Should send welcome SMS after registration', async () => {
      const smsService = require('../../src/services/smsService');
      
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phoneNumber: '+27123456789'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        userData.phoneNumber,
        expect.stringContaining('Welcome to PacheduConnect')
      );
    });

    test('UC-005: Should create Bronze KYC level automatically', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phoneNumber: '+27123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Check if KYC record was created
      const user = await User.findOne({ where: { email: userData.email } });
      const kyc = await KYC.findOne({ where: { userId: user.id } });

      expect(kyc).toBeTruthy();
      expect(kyc.level).toBe('bronze');
      expect(kyc.status).toBe('approved');
      expect(kyc.monthlySendLimit).toBe(5000.00);
    });
  });

  describe('User Login (UC-006 to UC-010)', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      const passwordHash = await bcrypt.hash('SecurePass123!', 10);
      testUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        phoneNumber: '+27123456789'
      });
    });

    test('UC-006: Should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    test('UC-007: Should handle invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials.');
    });

    test('UC-007: Should handle invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials.');
    });

    test('UC-008: Should generate valid JWT token', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.token;
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
      expect(decoded.email).toBe(loginData.email);
    });

    test('UC-009: Should handle session timeout', async () => {
      // Create token with short expiry
      const shortToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1s' }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${shortToken}`)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    test('UC-010: Should handle password reset with OTP', async () => {
      const resetData = {
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(resetData)
        .expect(200);

      expect(response.body.message).toContain('OTP sent');
    });
  });

  describe('Biometric Authentication (UC-011 to UC-014)', () => {
    let testUser;

    beforeEach(async () => {
      const passwordHash = await bcrypt.hash('SecurePass123!', 10);
      testUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        phoneNumber: '+27123456789'
      });
    });

    test('UC-011: Should setup biometric authentication', async () => {
      const biometricData = {
        biometricType: 'fingerprint',
        biometricData: 'encrypted_biometric_data'
      };

      const response = await request(app)
        .post('/api/auth/biometric/setup')
        .set('Authorization', `Bearer ${generateToken(testUser.id)}`)
        .send(biometricData)
        .expect(200);

      expect(response.body.message).toContain('Biometric setup successful');
    });

    test('UC-012: Should authenticate with biometric data', async () => {
      const biometricData = {
        biometricType: 'fingerprint',
        biometricData: 'encrypted_biometric_data'
      };

      const response = await request(app)
        .post('/api/auth/biometric/login')
        .send(biometricData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('UC-013: Should fallback to password authentication', async () => {
      const biometricData = {
        biometricType: 'fingerprint',
        biometricData: 'invalid_biometric_data'
      };

      const response = await request(app)
        .post('/api/auth/biometric/login')
        .send(biometricData)
        .expect(400);

      expect(response.body.message).toContain('fallback');
    });

    test('UC-014: Should secure biometric data storage', async () => {
      const biometricData = {
        biometricType: 'fingerprint',
        biometricData: 'sensitive_biometric_data'
      };

      await request(app)
        .post('/api/auth/biometric/setup')
        .set('Authorization', `Bearer ${generateToken(testUser.id)}`)
        .send(biometricData)
        .expect(200);

      // Verify biometric data is encrypted in database
      const user = await User.findByPk(testUser.id);
      expect(user.biometricData).not.toBe('sensitive_biometric_data');
      expect(user.biometricData).toMatch(/^encrypted_/);
    });
  });

  // Helper function to generate JWT token
  function generateToken(userId) {
    return jwt.sign(
      { userId, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}); 