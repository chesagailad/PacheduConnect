const request = require('supertest');
const { getSequelize } = require('../../src/utils/database');
const createUserModel = require('../../src/models/User');
const createKYCModel = require('../../src/models/KYC');
const createTransactionModel = require('../../src/models/Transaction');

// Mock payment gateway service
jest.mock('../../src/services/paymentGateways', () => ({
  processPayment: jest.fn(),
  getSupportedGateways: jest.fn().mockReturnValue(['stripe', 'ozow', 'payfast', 'stitch'])
}));

// Mock SMS service
jest.mock('../../src/services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true })
}));

describe('Money Transfer System Tests', () => {
  let app, User, KYC, Transaction, sequelize, sender, recipient, authToken;

  beforeAll(async () => {
    // Setup test database
    sequelize = getSequelize();
    User = createUserModel(sequelize);
    KYC = createKYCModel(sequelize);
    Transaction = createTransactionModel(sequelize);
    
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
    await Transaction.destroy({ where: {} });

    // Create sender user
    sender = await User.create({
      name: 'John Sender',
      email: 'sender@example.com',
      passwordHash: 'hashed_password',
      phoneNumber: '+27123456789',
      balance: 10000.00
    });

    // Create recipient user
    recipient = await User.create({
      name: 'Jane Recipient',
      email: 'recipient@example.com',
      passwordHash: 'hashed_password',
      phoneNumber: '+27123456790',
      balance: 0.00
    });

    // Create KYC for sender
    await KYC.create({
      userId: sender.id,
      level: 'bronze',
      status: 'approved',
      monthlySendLimit: 5000.00,
      currentMonthSent: 0.00,
      resetDate: new Date()
    });

    // Generate auth token for sender
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: sender.id, email: sender.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('Transaction Creation (UC-031 to UC-036)', () => {
    test('UC-031: Should send money to recipient by email', async () => {
      const transactionData = {
        recipientEmail: 'recipient@example.com',
        amount: 1000.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('transaction');
      expect(response.body).toHaveProperty('transferFee');
      expect(response.body.message).toContain('Transaction created successfully');
    });

    test('UC-032: Should validate recipient existence', async () => {
      const transactionData = {
        recipientEmail: 'nonexistent@example.com',
        amount: 1000.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(404);

      expect(response.body.error).toContain('Recipient not found');
    });

    test('UC-033: Should validate amount and currency', async () => {
      // Test negative amount
      const negativeAmountData = {
        recipientEmail: 'recipient@example.com',
        amount: -100.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const negativeResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(negativeAmountData)
        .expect(400);

      expect(negativeResponse.body.error).toContain('Amount must be positive');

      // Test invalid currency
      const invalidCurrencyData = {
        recipientEmail: 'recipient@example.com',
        amount: 1000.00,
        currency: 'INVALID',
        description: 'Test transfer'
      };

      const invalidCurrencyResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCurrencyData)
        .expect(400);

      expect(invalidCurrencyResponse.body.error).toContain('Unsupported currency');
    });

    test('UC-034: Should calculate fees correctly', async () => {
      const transactionData = {
        recipientEmail: 'recipient@example.com',
        amount: 1000.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      const transferFee = response.body.transferFee;
      expect(transferFee).toHaveProperty('transferFeeAmount');
      expect(transferFee).toHaveProperty('totalAmount');
      expect(transferFee.totalAmount).toBeGreaterThan(transactionData.amount);
    });

    test('UC-035: Should validate KYC limits', async () => {
      // Update KYC to have used most of the limit
      await KYC.update(
        { currentMonthSent: 4500.00 },
        { where: { userId: sender.id } }
      );

      const transactionData = {
        recipientEmail: 'recipient@example.com',
        amount: 1000.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toContain('KYC limit exceeded');
    });

    test('UC-036: Should check user balance', async () => {
      // Update sender balance to insufficient amount
      await User.update(
        { balance: 100.00 },
        { where: { id: sender.id } }
      );

      const transactionData = {
        recipientEmail: 'recipient@example.com',
        amount: 1000.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toContain('Insufficient balance');
    });
  });

  describe('Payment Processing (UC-037 to UC-042)', () => {
    test('UC-037: Should process Stripe payment', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'pi_1234567890',
        amount: 1000.00,
        currency: 'USD',
        status: 'completed'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        recipientEmail: 'recipient@example.com',
        paymentMethodId: 'pm_1234567890',
        description: 'Test payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
    });

    test('UC-038: Should process Ozow EFT payment', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'ozow_1234567890',
        amount: 1000.00,
        currency: 'ZAR',
        status: 'completed'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        recipientEmail: 'recipient@example.com',
        bankAccount: '1234567890',
        bankCode: '123456',
        description: 'Test EFT payment'
      };

      const response = await request(app)
        .post('/api/payments/process/ozow')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
    });

    test('UC-039: Should process PayFast payment', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'payfast_1234567890',
        amount: 1000.00,
        currency: 'ZAR',
        status: 'completed'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        recipientEmail: 'recipient@example.com',
        description: 'Test PayFast payment'
      };

      const response = await request(app)
        .post('/api/payments/process/payfast')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.status).toBe('completed');
    });

    test('UC-040: Should process Stitch bank transfer', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'stitch_1234567890',
        amount: 1000.00,
        currency: 'ZAR',
        status: 'completed'
      });

      const paymentData = {
        amount: 1000.00,
        currency: 'ZAR',
        recipientEmail: 'recipient@example.com',
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
    });

    test('UC-041: Should get supported payment gateways', async () => {
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

    test('UC-042: Should validate payment method', async () => {
      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        recipientEmail: 'recipient@example.com',
        // Missing paymentMethodId for Stripe
        description: 'Test payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.message).toContain('Payment method');
    });
  });

  describe('Transaction Management (UC-043 to UC-047)', () => {
    let testTransaction;

    beforeEach(async () => {
      // Create test transaction
      testTransaction = await Transaction.create({
        userId: sender.id,
        recipientId: recipient.id,
        type: 'send',
        amount: 1000.00,
        currency: 'USD',
        status: 'pending',
        description: 'Test transaction'
      });
    });

    test('UC-043: Should track transaction status', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.id).toBe(testTransaction.id);
      expect(response.body.transaction.status).toBe('pending');
    });

    test('UC-044: Should view transaction history', async () => {
      // Create additional transactions
      await Transaction.create({
        userId: sender.id,
        recipientId: recipient.id,
        type: 'send',
        amount: 500.00,
        currency: 'USD',
        status: 'completed',
        description: 'Second transaction'
      });

      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(2);
    });

    test('UC-045: Should generate transaction receipt', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testTransaction.id}/receipt`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('receipt');
      expect(response.body.receipt).toHaveProperty('transactionId');
      expect(response.body.receipt).toHaveProperty('amount');
      expect(response.body.receipt).toHaveProperty('currency');
      expect(response.body.receipt).toHaveProperty('date');
    });

    test('UC-046: Should handle failed transactions', async () => {
      const paymentGatewayService = require('../../src/services/paymentGateways');
      paymentGatewayService.processPayment.mockRejectedValue(new Error('Payment failed'));

      const paymentData = {
        amount: 1000.00,
        currency: 'USD',
        recipientEmail: 'recipient@example.com',
        paymentMethodId: 'pm_1234567890',
        description: 'Test failed payment'
      };

      const response = await request(app)
        .post('/api/payments/process/stripe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.message).toContain('Payment failed');
    });

    test('UC-047: Should send transaction notifications', async () => {
      const smsService = require('../../src/services/smsService');

      // Complete a transaction
      await Transaction.update(
        { status: 'completed' },
        { where: { id: testTransaction.id } }
      );

      // Trigger notification
      await request(app)
        .post(`/api/transactions/${testTransaction.id}/notify`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        sender.phoneNumber,
        expect.stringContaining('Transaction completed')
      );

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        recipient.phoneNumber,
        expect.stringContaining('Money received')
      );
    });
  });

  describe('Transaction Validation', () => {
    test('Should prevent sending money to self', async () => {
      const transactionData = {
        recipientEmail: 'sender@example.com', // Same as sender
        amount: 1000.00,
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toContain('Cannot send money to yourself');
    });

    test('Should validate minimum transaction amount', async () => {
      const transactionData = {
        recipientEmail: 'recipient@example.com',
        amount: 5.00, // Below minimum
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toContain('Minimum amount');
    });

    test('Should validate maximum transaction amount', async () => {
      const transactionData = {
        recipientEmail: 'recipient@example.com',
        amount: 100000.00, // Above maximum
        currency: 'USD',
        description: 'Test transfer'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toContain('Maximum amount');
    });
  });
}); 