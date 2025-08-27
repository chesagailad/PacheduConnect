/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Security tests for implemented security fixes
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getSequelize } = require('../../src/utils/database');
const createUserModel = require('../../src/models/User');
const tokenService = require('../../src/services/tokenService');
const mfaService = require('../../src/services/mfaService');

describe('Security Implementation Tests', () => {
  let app;
  let User;
  let testUser;

  beforeAll(async () => {
    // Import the app
    app = require('../../src/app');
    
    // Setup database
    const sequelize = getSequelize();
    User = createUserModel(sequelize);
    
    // Create test user
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      passwordHash: passwordHash,
      role: 'user',
      isVerified: true
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await testUser.destroy();
    }
  });

  describe('JWT Authentication Security', () => {
    test('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { 
          userId: testUser.id, 
          email: testUser.email,
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-format');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_FORMAT_INVALID');
    });

    test('should reject tokens with wrong algorithm', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { algorithm: 'HS512' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation Security', () => {
    test('should reject SQL injection attempts', async () => {
      const sqlInjectionPayload = {
        email: "'; DROP TABLE Users; --",
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(sqlInjectionPayload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_INPUT');
    });

    test('should reject XSS attempts', async () => {
      const xssPayload = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(xssPayload);

      // Should either reject or sanitize the input
      expect(response.status).toBe(400);
    });

    test('should enforce strong password requirements', async () => {
      const weakPasswordPayload = {
        name: 'Test User',
        email: 'test2@example.com',
        phoneNumber: '+1234567890',
        password: 'weak',
        confirmPassword: 'weak',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordPayload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting Security', () => {
    test('should enforce rate limiting on login attempts', async () => {
      const loginPayload = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginPayload);

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          // Should be rate limited after 5 attempts
          expect(response.status).toBe(429);
          expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
        }
      }
    });
  });

  describe('MFA Security', () => {
    test('should generate valid TOTP secret', () => {
      const totpConfig = mfaService.generateTOTPSecret(testUser.id, testUser.email);
      
      expect(totpConfig.secret).toBeDefined();
      expect(totpConfig.secret.length).toBeGreaterThan(20);
      expect(totpConfig.otpauthUrl).toContain('PacheduConnect');
    });

    test('should verify valid TOTP token', () => {
      const secret = mfaService.generateTOTPSecret(testUser.id, testUser.email).secret;
      const token = require('speakeasy').totp({
        secret: secret,
        encoding: 'base32'
      });

      const isValid = mfaService.verifyTOTPToken(token, secret, testUser.id);
      expect(isValid).toBe(true);
    });

    test('should reject invalid TOTP token', () => {
      const secret = mfaService.generateTOTPSecret(testUser.id, testUser.email).secret;
      const isValid = mfaService.verifyTOTPToken('123456', secret, testUser.id);
      expect(isValid).toBe(false);
    });

    test('should generate backup codes', () => {
      const backupCodes = mfaService.generateBackupCodes(testUser.id);
      
      expect(backupCodes).toBeDefined();
      expect(backupCodes.length).toBe(10);
      expect(backupCodes[0].length).toBe(8);
    });
  });

  describe('Token Service Security', () => {
    test('should generate secure access tokens', () => {
      const accessToken = tokenService.generateAccessToken(testUser);
      
      expect(accessToken.token).toBeDefined();
      expect(accessToken.tokenId).toBeDefined();
      expect(accessToken.expiresAt).toBeDefined();
    });

    test('should blacklist tokens', () => {
      const accessToken = tokenService.generateAccessToken(testUser);
      
      tokenService.blacklistToken(accessToken.tokenId);
      const isBlacklisted = tokenService.isTokenBlacklisted(accessToken.tokenId);
      
      expect(isBlacklisted).toBe(true);
    });

    test('should revoke user tokens', () => {
      const accessToken1 = tokenService.generateAccessToken(testUser);
      const accessToken2 = tokenService.generateAccessToken(testUser);
      
      const revokedCount = tokenService.revokeUserTokens(testUser.id);
      
      expect(revokedCount).toBeGreaterThan(0);
    });
  });

  describe('Account Security', () => {
    test('should lock account after multiple failed attempts', async () => {
      const loginPayload = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginPayload);
      }

      // Check if account is locked
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.accountLocked).toBe(true);
      expect(updatedUser.failedLoginAttempts).toBe(5);
    });

    test('should reset failed attempts on successful login', async () => {
      const loginPayload = {
        email: testUser.email,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginPayload);

      expect(response.status).toBe(200);

      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.accountLocked).toBe(false);
    });
  });

  describe('Password Security', () => {
    test('should hash passwords with sufficient salt rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).not.toBe(password);
      expect(hash).toContain('$2b$12$'); // bcrypt with 12 rounds
    });

    test('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });
  });
}); 