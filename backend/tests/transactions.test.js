const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const transactionRoutes = require('../src/routes/transactions');
const authMiddleware = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/transactions', authMiddleware, transactionRoutes);

// Helper function to create auth token
const createAuthToken = (userId = 1) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
};

describe('Transaction Endpoints', () => {
  let authToken;

  beforeEach(() => {
    authToken = createAuthToken();
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction successfully', async () => {
      const transactionData = {
        recipientId: 1,
        amountSAR: 1000,
        amountZWL: 18000,
        exchangeRate: 18.0,
        payoutMethod: 'ecocash',
        description: 'Test transaction'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('status', 'pending');
      expect(response.body.transaction).toHaveProperty('amountSAR', transactionData.amountSAR);
    });

    it('should fail without authentication', async () => {
      const transactionData = {
        recipientId: 1,
        amountSAR: 1000,
        amountZWL: 18000,
        exchangeRate: 18.0,
        payoutMethod: 'ecocash'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail with invalid amount', async () => {
      const transactionData = {
        recipientId: 1,
        amountSAR: -100, // Invalid negative amount
        amountZWL: 18000,
        exchangeRate: 18.0,
        payoutMethod: 'ecocash'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail with missing required fields', async () => {
      const transactionData = {
        amountSAR: 1000,
        // Missing recipientId, amountZWL, exchangeRate, payoutMethod
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/transactions', () => {
    it('should get user transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get specific transaction by id', async () => {
      // First create a transaction
      const transactionData = {
        recipientId: 1,
        amountSAR: 1000,
        amountZWL: 18000,
        exchangeRate: 18.0,
        payoutMethod: 'ecocash'
      };

      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      const transactionId = createResponse.body.transaction.id;

      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('id', transactionId);
    });

    it('should fail for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/transactions/:id/cancel', () => {
    it('should cancel a pending transaction', async () => {
      // Create a transaction first
      const transactionData = {
        recipientId: 1,
        amountSAR: 1000,
        amountZWL: 18000,
        exchangeRate: 18.0,
        payoutMethod: 'ecocash'
      };

      const createResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      const transactionId = createResponse.body.transaction.id;

      const response = await request(app)
        .put(`/api/transactions/${transactionId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.transaction).toHaveProperty('status', 'cancelled');
    });

    it('should fail to cancel completed transaction', async () => {
      // This would require mocking a completed transaction
      const response = await request(app)
        .put('/api/transactions/1/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});