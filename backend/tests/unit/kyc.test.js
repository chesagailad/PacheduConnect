const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { getSequelize } = require('../../src/utils/database');
const createUserModel = require('../../src/models/User');
const createKYCModel = require('../../src/models/KYC');

// Mock SMS service
jest.mock('../../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true })
}));

describe('KYC System Tests', () => {
  let app, User, KYC, sequelize, testUser, authToken;

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

  describe('KYC Levels & Limits (UC-015 to UC-019)', () => {
    test('UC-015: Should create Bronze level KYC with R5,000 limit', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 0.00,
        resetDate: new Date()
      });

      expect(kyc.level).toBe('bronze');
      expect(kyc.status).toBe('approved');
      expect(kyc.monthlySendLimit).toBe(5000.00);
      expect(kyc.currentMonthSent).toBe(0.00);
    });

    test('UC-016: Should create Silver level KYC with R25,000 limit', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'silver',
        status: 'pending',
        monthlySendLimit: 25000.00,
        currentMonthSent: 0.00,
        resetDate: new Date()
      });

      expect(kyc.level).toBe('silver');
      expect(kyc.status).toBe('pending');
      expect(kyc.monthlySendLimit).toBe(25000.00);
    });

    test('UC-017: Should create Gold level KYC with R50,000 limit', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'gold',
        status: 'pending',
        monthlySendLimit: 50000.00,
        currentMonthSent: 0.00,
        resetDate: new Date()
      });

      expect(kyc.level).toBe('gold');
      expect(kyc.status).toBe('pending');
      expect(kyc.monthlySendLimit).toBe(50000.00);
    });

    test('UC-018: Should track monthly limits and reset', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 3000.00,
        resetDate: new Date()
      });

      // Check if can send amount
      const canSend = kyc.canSendAmount(2000.00);
      expect(canSend).toBe(true);

      // Check if exceeds limit
      const cannotSend = kyc.canSendAmount(3000.00);
      expect(cannotSend).toBe(false);
    });

    test('UC-019: Should validate limits before transactions', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 4000.00,
        resetDate: new Date()
      });

      // Test valid transaction
      const validTransaction = kyc.canSendAmount(1000.00);
      expect(validTransaction).toBe(true);

      // Test invalid transaction
      const invalidTransaction = kyc.canSendAmount(2000.00);
      expect(invalidTransaction).toBe(false);
    });
  });

  describe('Document Upload & Verification (UC-020 to UC-025)', () => {
    test('UC-020: Should upload ID document', async () => {
      const uploadDir = path.join(__dirname, '../../uploads/kyc');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const response = await request(app)
        .post('/api/kyc/upload-bronze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('idDocument', path.join(__dirname, '../fixtures/clear-id.jpg'))
        .field('homeAddress', '123 Test Street, Johannesburg')
        .expect(200);

      expect(response.body.message).toContain('Documents uploaded successfully');
    });

    test('UC-021: Should upload selfie with ID', async () => {
      const response = await request(app)
        .post('/api/kyc/upload-bronze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('selfieWithId', path.join(__dirname, '../fixtures/clear-id.jpg'))
        .field('homeAddress', '123 Test Street, Johannesburg')
        .expect(200);

      expect(response.body.message).toContain('Documents uploaded successfully');
    });

    test('UC-022: Should upload proof of address', async () => {
      const response = await request(app)
        .post('/api/kyc/upload-silver')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('proofOfAddress', path.join(__dirname, '../fixtures/clear-id.jpg'))
        .field('jobTitle', 'Software Engineer')
        .expect(200);

      expect(response.body.message).toContain('Documents uploaded successfully');
    });

    test('UC-023: Should validate file size and format', async () => {
      // Test invalid file type
      const response = await request(app)
        .post('/api/kyc/upload-bronze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('idDocument', path.join(__dirname, '../fixtures/invalid.txt'))
        .field('homeAddress', '123 Test Street, Johannesburg')
        .expect(400);

      expect(response.body.message).toContain('Only image and PDF files are allowed');
    });

    test('UC-024: Should assess document quality', async () => {
      // Test blurry document
      const response = await request(app)
        .post('/api/kyc/upload-bronze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('idDocument', path.join(__dirname, '../fixtures/blurry-id.jpg'))
        .field('homeAddress', '123 Test Street, Johannesburg')
        .expect(400);

      expect(response.body.message).toContain('Document quality');
    });

    test('UC-025: Should allow admin document review', async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        phoneNumber: '+27123456789',
        role: 'admin'
      });

      const adminToken = require('jsonwebtoken').sign(
        { userId: adminUser.id, email: adminUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      // Create KYC record
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'silver',
        status: 'pending',
        idDocument: 'test-document.jpg',
        proofOfAddress: 'test-address.jpg'
      });

      const response = await request(app)
        .post(`/api/kyc/approve/${kyc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('KYC approved successfully');
    });
  });

  describe('KYC Workflow (UC-026 to UC-030)', () => {
    test('UC-026: Should check KYC status', async () => {
      await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 0.00,
        resetDate: new Date()
      });

      const response = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.kyc).toHaveProperty('level', 'bronze');
      expect(response.body.kyc).toHaveProperty('status', 'approved');
    });

    test('UC-027: Should handle level upgrade requests', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 0.00,
        resetDate: new Date()
      });

      const response = await request(app)
        .post('/api/kyc/upgrade-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetLevel: 'silver' })
        .expect(200);

      expect(response.body.message).toContain('Upgrade request submitted');
    });

    test('UC-028: Should handle admin approval workflow', async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        phoneNumber: '+27123456789',
        role: 'admin'
      });

      const adminToken = require('jsonwebtoken').sign(
        { userId: adminUser.id, email: adminUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      // Create pending KYC
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'silver',
        status: 'pending',
        idDocument: 'test-document.jpg',
        proofOfAddress: 'test-address.jpg'
      });

      const response = await request(app)
        .post(`/api/kyc/approve/${kyc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('KYC approved successfully');
      expect(response.body.newLevel).toBe('gold');
    });

    test('UC-029: Should send SMS notifications for KYC status changes', async () => {
      const smsService = require('../../src/services/smsService');
      
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        phoneNumber: '+27123456789',
        role: 'admin'
      });

      const adminToken = require('jsonwebtoken').sign(
        { userId: adminUser.id, email: adminUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      // Create pending KYC
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'silver',
        status: 'pending',
        idDocument: 'test-document.jpg',
        proofOfAddress: 'test-address.jpg'
      });

      await request(app)
        .post(`/api/kyc/approve/${kyc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        testUser.phoneNumber,
        expect.stringContaining('KYC has been approved')
      );
    });

    test('UC-030: Should handle KYC rejection with reason', async () => {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        phoneNumber: '+27123456789',
        role: 'admin'
      });

      const adminToken = require('jsonwebtoken').sign(
        { userId: adminUser.id, email: adminUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      // Create pending KYC
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'silver',
        status: 'pending',
        idDocument: 'test-document.jpg',
        proofOfAddress: 'test-address.jpg'
      });

      const rejectionData = {
        reason: 'Documents are unclear and cannot be verified'
      };

      const response = await request(app)
        .post(`/api/kyc/reject/${kyc.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.message).toContain('KYC rejected successfully');

      // Verify KYC status was updated
      const updatedKyc = await KYC.findByPk(kyc.id);
      expect(updatedKyc.status).toBe('rejected');
      expect(updatedKyc.rejectionReason).toBe(rejectionData.reason);
    });
  });

  describe('KYC Limit Validation', () => {
    test('Should validate monthly limits correctly', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 3000.00,
        resetDate: new Date()
      });

      // Test various amounts
      expect(kyc.canSendAmount(1000.00)).toBe(true);  // Within limit
      expect(kyc.canSendAmount(2500.00)).toBe(false); // Exceeds limit
      expect(kyc.canSendAmount(2000.00)).toBe(true);  // Exactly at limit
    });

    test('Should reset monthly limits on new month', async () => {
      const kyc = await KYC.create({
        userId: testUser.id,
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00,
        currentMonthSent: 5000.00,
        resetDate: new Date('2024-01-01')
      });

      // Simulate new month
      const newMonthDate = new Date('2024-02-01');
      const originalDate = Date;
      global.Date = class extends Date {
        constructor() {
          return new originalDate(newMonthDate);
        }
      };

      expect(kyc.canSendAmount(1000.00)).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });
  });
}); 