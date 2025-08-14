const request = require('supertest');
const { getSequelize } = require('../../src/utils/database');
const createUserModel = require('../../src/models/User');
const createKYCModel = require('../../src/models/KYC');

// Mock payment gateway services
jest.mock('../../src/services/paymentGateways', () => ({
  processPayment: jest.fn(),
  getSupportedGateways: jest.fn().mockReturnValue(['stripe', 'ozow', 'payfast', 'stitch']),
  validatePaymentMethod: jest.fn(),
  getGatewayConfig: jest.fn()
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn()
    },
    paymentMethods: {
      create: jest.fn(),
      retrieve: jest.fn()
    }
  }));
});

describe('Payment Gateway Integration Tests', () => {
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
      phoneNumber: '+27123456789',
      balance: 10000.00
    });

    // Create KYC for user
    await KYC.create({
      userId: testUser.id,
      level: 'bronze',
      status: 'approved',
      monthlySendLimit: 5000.00,
      currentMonthSent: 0.00,
      resetDate: new Date()
    });

    // Generate auth token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('Stripe Integration (UC-057 to UC-061)', () => {
    test('UC-057: Should process Stripe card payment', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'pi_1234567890',
        amount: 1000.00,
        currency: 'USD',
        status: 'completed',
        gateway: 'stripe'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        paymentMethodId: 'pm_1234567890',
        description: 'Test Stripe payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.gateway).toBe('stripe');
    });

    test('UC-058: Should handle Stripe payment failure', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockRejectedValue(new Error('Card declined'));

      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        paymentMethodId: 'pm_1234567890',
        description: 'Test failed payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.error).toContain('Card declined');
    });

    test('UC-059: Should validate Stripe payment method', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.validatePaymentMethod.mockResolvedValue({
        valid: true,
        brand: 'visa',
        last4: '4242'
      });

      const paymentData = {
        paymentMethodId: 'pm_1234567890'
      };

      const response = await request(app)
        .post('/api/payments/validate/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.brand).toBe('visa');
    });

    test('UC-060: Should get Stripe payment intent', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        description: 'Test payment intent'
      };

      const response = await request(app)
        .post('/api/payments/create-intent/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body).toHaveProperty('paymentIntentId');
    });

    test('UC-061: Should confirm Stripe payment', async () => {
      const paymentData = {
        paymentIntentId: 'pi_1234567890',
        paymentMethodId: 'pm_1234567890'
      };

      const response = await request(app)
        .post('/api/payments/confirm/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Ozow EFT Integration (UC-062 to UC-065)', () => {
    test('UC-062: Should process Ozow EFT payment', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'ozow_1234567890',
        amount: 1000.00,
        currency: 'ZAR',
        status: 'completed',
        gateway: 'ozow'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        bankAccount: '1234567890',
        bankCode: '123456',
        description: 'Test Ozow EFT payment'
      };

      const response = await request(app)
        .post('/api/payments/process/ozow')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.gateway).toBe('ozow');
    });

    test('UC-063: Should validate Ozow bank details', async () => {
      const paymentData = {
        bankAccount: '1234567890',
        bankCode: '123456'
      };

      const response = await request(app)
        .post('/api/payments/validate/ozow')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('bankName');
    });

    test('UC-064: Should handle Ozow payment failure', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockRejectedValue(new Error('Insufficient funds'));

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        bankAccount: '1234567890',
        bankCode: '123456',
        description: 'Test failed Ozow payment'
      };

      const response = await request(app)
        .post('/api/payments/process/ozow')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.error).toContain('Insufficient funds');
    });

    test('UC-065: Should get Ozow payment status', async () => {
      const response = await request(app)
        .get('/api/payments/status/ozow/ozow_1234567890')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('transactionId');
    });
  });

  describe('PayFast Integration (UC-066 to UC-068)', () => {
    test('UC-066: Should process PayFast payment', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'payfast_1234567890',
        amount: 1000.00,
        currency: 'ZAR',
        status: 'completed',
        gateway: 'payfast'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        description: 'Test PayFast payment'
      };

      const response = await request(app)
        .post('/api/payments/process/payfast')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.gateway).toBe('payfast');
    });

    test('UC-067: Should generate PayFast payment form', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        description: 'Test PayFast payment form'
      };

      const response = await request(app)
        .post('/api/payments/generate-form/payfast')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('formHtml');
      expect(response.body).toHaveProperty('merchantId');
      expect(response.body).toHaveProperty('paymentId');
    });

    test('UC-068: Should handle PayFast webhook', async () => {
      const webhookData = {
        payment_status: 'COMPLETE',
        m_payment_id: 'payfast_1234567890',
        amount_gross: '1000.00',
        signature: 'valid_signature'
      };

      const response = await request(app)
        .post('/api/payments/webhook/payfast')
        .send(webhookData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'processed');
    });
  });

  describe('Stitch Integration (UC-069 to UC-070)', () => {
    test('UC-069: Should process Stitch bank transfer', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'stitch_1234567890',
        amount: 1000.00,
        currency: 'ZAR',
        status: 'completed',
        gateway: 'stitch'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        bankAccount: '1234567890',
        bankCode: '123456',
        description: 'Test Stitch payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stitch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.gateway).toBe('stitch');
    });

    test('UC-070: Should validate Stitch bank account', async () => {
      const paymentData = {
        bankAccount: '1234567890',
        bankCode: '123456'
      };

      const response = await request(app)
        .post('/api/payments/validate/stitch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('accountHolder');
    });
  });

  describe('Gateway Configuration', () => {
    test('Should get supported payment gateways', async () => {
      const response = await request(app)
        .get('/api/payments/gateways')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('gateways');
      expect(response.body.gateways).toContain('stripe');
      expect(response.body.gateways).toContain('ozow');
      expect(response.body.gateways).toContain('payfast');
      expect(response.body.gateways).toContain('stitch');
    });

    test('Should get gateway configuration', async () => {
      const response = await request(app)
        .get('/api/payments/config/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('publicKey');
      expect(response.body).toHaveProperty('supportedCurrencies');
    });

    test('Should validate payment method for all gateways', async () => {
      const gateways = ['stripe', 'ozow', 'payfast', 'stitch'];
      
      for (const gateway of gateways) {
        const response = await request(app)
          .post(`/api/payments/validate/${gateway}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ test: true })
          .expect(200);

        expect(response.body).toHaveProperty('valid');
      }
    });
  });

  describe('Payment Processing Edge Cases', () => {
    test('Should handle invalid payment method', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        // Missing paymentMethodId
        description: 'Test invalid payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.error).toContain('Payment method');
    });

    test('Should handle unsupported currency', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'INVALID',
        paymentMethodId: 'pm_1234567890',
        description: 'Test unsupported currency'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.error).toContain('Unsupported currency');
    });

    test('Should handle amount validation', async () => {
      const paymentData = {
        amount: -100.00, // Negative amount
        currency: 'USD',
        paymentMethodId: 'pm_1234567890',
        description: 'Test negative amount'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.error).toContain('Amount must be positive');
    });

    test('Should handle network timeouts', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        paymentMethodId: 'pm_1234567890',
        description: 'Test timeout'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(408);

      expect(response.body.error).toContain('Network timeout');
    });
  });

  describe('Payment Security', () => {
    test('Should validate payment signatures', async () => {
      const webhookData = {
        payment_status: 'COMPLETE',
        m_payment_id: 'payfast_1234567890',
        amount_gross: '1000.00',
        signature: 'invalid_signature' // Invalid signature
      };

      const response = await request(app)
        .post('/api/payments/webhook/payfast')
        .send(webhookData)
        .expect(400);

      expect(response.body.error).toContain('Invalid signature');
    });

    test('Should prevent duplicate payments', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        paymentMethodId: 'pm_1234567890',
        description: 'Test duplicate payment'
      };

      // First payment
      await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      // Duplicate payment
      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(409);

      expect(response.body.error).toContain('Duplicate payment');
    });

    test('Should validate payment amounts', async () => {
      const paymentData = {
        amount: 0.01, // Below minimum
        currency: 'USD',
        paymentMethodId: 'pm_1234567890',
        description: 'Test minimum amount'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.error).toContain('Minimum amount');
    });
  });
}); 