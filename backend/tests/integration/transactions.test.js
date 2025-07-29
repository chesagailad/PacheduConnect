/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: transactions.test - test file for backend functionality
 */

const request = require('supertest');
const app = require('../../src/app');
const { getModels } = require('../../src/models');
const { SUPPORTED_CURRENCIES } = require('../../src/utils/exchangeRate');

describe('POST /api/transactions - Validation Tests', () => {
  let authToken;
  let testUser;
  let recipientUser;

  beforeAll(async () => {
    const { User } = getModels();
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      balance: 1000
    });

    // Create recipient user
    recipientUser = await User.create({
      name: 'Recipient User',
      email: 'recipient@example.com',
      passwordHash: 'hashedpassword',
      balance: 0
    });

    // Mock authentication middleware
    authToken = 'mock-token';
  });

  afterAll(async () => {
    const { User } = getModels();
    await User.destroy({ where: { id: testUser.id } });
    await User.destroy({ where: { id: recipientUser.id } });
  });

  describe('Currency Validation', () => {
    test('should accept valid supported currency', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(201);
    });

    test('should accept currency in lowercase and normalize it', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: 'zar'
        });

      expect(response.status).toBe(201);
      expect(response.body.transaction.currency).toBe('ZAR');
    });

    test('should reject unsupported currency', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: 'EUR'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unsupported currency');
      expect(response.body.field).toBe('currency');
      expect(response.body.supportedCurrencies).toEqual(SUPPORTED_CURRENCIES);
      expect(response.body.received).toBe('EUR');
    });

    test('should reject empty currency string', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid currency format');
      expect(response.body.field).toBe('currency');
    });

    test('should reject non-string currency', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: 123
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid currency format');
      expect(response.body.field).toBe('currency');
    });

    test('should reject currency with only whitespace', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: '   '
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid currency format');
      expect(response.body.field).toBe('currency');
    });
  });

  describe('RecipientId Validation', () => {
    test('should accept valid UUID format', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: recipientUser.id,
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(201);
    });

    test('should reject invalid UUID format', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: 'invalid-uuid-format',
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid recipient ID format');
      expect(response.body.field).toBe('recipientId');
      expect(response.body.expectedFormat).toContain('UUID');
    });

    test('should reject empty recipientId string', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: '',
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid recipient ID format');
      expect(response.body.field).toBe('recipientId');
    });

    test('should reject non-string recipientId', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: 123,
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid recipient ID format');
      expect(response.body.field).toBe('recipientId');
    });

    test('should reject recipientId with only whitespace', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: '   ',
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid recipient ID format');
      expect(response.body.field).toBe('recipientId');
    });

    test('should reject malformed UUID', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: '123e4567-e89b-12d3-a456-42661417400', // Missing character
          amount: 100,
          currency: 'USD'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid recipient ID format');
      expect(response.body.field).toBe('recipientId');
    });
  });

  describe('Combined Validation', () => {
    test('should reject when both currency and recipientId are invalid', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientId: 'invalid-uuid',
          amount: 100,
          currency: 'INVALID'
        });

      // Should fail on first validation (currency)
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Unsupported currency');
      expect(response.body.field).toBe('currency');
    });
  });
}); 