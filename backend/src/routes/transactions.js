/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: transactions - handles backend functionality
 */

const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { getSequelize, getModels } = require('../utils/database');
const { calculateFee, validateTransferWithFees } = require('../utils/feeCalculator');
const { convertCurrency, getExchangeRate, getAllRates, calculateTransferFee, getFeeStructure, SUPPORTED_CURRENCIES } = require('../utils/exchangeRate');

const router = express.Router();

// Get all exchange rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const rates = await getAllRates();
    res.json({
      ...rates,
      message: 'Exchange rates fetched successfully from XE Currency Data API'
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch exchange rates',
      supportedCurrencies: SUPPORTED_CURRENCIES,
      fallbackMessage: 'Using fallback rates due to API unavailability'
    });
  }
});

// Get platform fee structure
router.get('/fee-structure', async (req, res) => {
  try {
    const feeStructure = getFeeStructure();
    res.json({
      ...feeStructure,
      message: 'Pachedu platform fee structure'
    });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({ error: 'Failed to fetch fee structure' });
  }
});

// Convert currency with transfer fee
router.post('/convert-currency', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'Both fromCurrency and toCurrency are required' });
    }
    
    if (!SUPPORTED_CURRENCIES.includes(fromCurrency.toUpperCase()) || 
        !SUPPORTED_CURRENCIES.includes(toCurrency.toUpperCase())) {
      return res.status(400).json({ 
        error: 'Unsupported currency', 
        supportedCurrencies: SUPPORTED_CURRENCIES 
      });
    }
    
    const conversion = await convertCurrency(parseFloat(amount), fromCurrency.toUpperCase(), toCurrency.toUpperCase());
    
    res.json({
      conversion,
      message: 'Currency converted successfully with XE real-time rates',
      note: conversion.transferFee.transferFeeAmount > 0 ? 
        `Transfer fee of ${conversion.transferFee.transferFeeRate * 100}% applied to sending amount` : 
        'No transfer fee applied'
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Calculate transfer fee for transactions
router.post('/calculate-transfer-fee', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }
    
    const transferFee = calculateTransferFee(parseFloat(amount), currency.toUpperCase());
    
    res.json({
      transferFee,
      message: transferFee.transferFeeAmount > 0 ? 
        'Transfer fee calculated for transaction' : 
        'No transfer fee applicable for this currency'
    });
  } catch (error) {
    console.error('Error calculating transfer fee:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get specific exchange rate
router.get('/exchange-rate/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    
    if (!SUPPORTED_CURRENCIES.includes(from.toUpperCase()) || 
        !SUPPORTED_CURRENCIES.includes(to.toUpperCase())) {
      return res.status(400).json({ 
        error: 'Unsupported currency pair', 
        supportedCurrencies: SUPPORTED_CURRENCIES 
      });
    }
    
    const rate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());
    
    res.json({
      rate,
      message: 'Exchange rate retrieved successfully from XE Currency Data API'
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user transactions with filters
router.get('/', auth, async (req, res) => {
  try {
    const { User, Transaction } = getModels();
    const userId = req.user.id;
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId };
    
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }
    
    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      transactions: transactions.rows,
      total: transactions.count,
      page: parseInt(page),
      totalPages: Math.ceil(transactions.count / limit),
      message: 'Transactions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate fee for transaction
router.post('/calculate-fee', async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const feeInfo = calculateFee(parseFloat(amount), currency);
    
    res.json({
      feeBreakdown: feeInfo,
      message: 'Fee calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating fee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send money
router.post('/', auth, async (req, res) => {
  try {
    const { User, Transaction } = getModels();
    const userId = req.user.id;
    const { recipientId, amount, currency, description, deliveryMethod } = req.body;
    
    if (!recipientId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    // Validate currency format and support
    if (typeof currency !== 'string' || currency.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid currency format. Currency must be a non-empty string.',
        field: 'currency',
        received: currency
      });
    }
    
    const normalizedCurrency = currency.toUpperCase().trim();
    if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
      return res.status(400).json({ 
        error: `Unsupported currency '${currency}'. Please use one of the supported currencies.`,
        field: 'currency',
        supportedCurrencies: SUPPORTED_CURRENCIES,
        received: currency
      });
    }
    
    // Validate recipientId format (UUID)
    if (typeof recipientId !== 'string' || recipientId.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid recipient ID format. Recipient ID must be a valid UUID string.',
        field: 'recipientId',
        received: recipientId
      });
    }
    
    // UUID format validation (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId.trim())) {
      return res.status(400).json({ 
        error: 'Invalid recipient ID format. Recipient ID must be a valid UUID.',
        field: 'recipientId',
        received: recipientId,
        expectedFormat: 'UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)'
      });
    }
    
    // Check if recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Calculate transfer fee
    const transferFee = calculateTransferFee(parseFloat(amount), normalizedCurrency);
    const totalAmount = transferFee.totalAmount;
    
    // Check user balance
    const user = await User.findByPk(userId);
    if (user.balance < totalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: totalAmount,
        available: user.balance
      });
    }
    
    // Validate delivery method
    const supportedDeliveryMethods = ['bank_transfer', 'mobile_money', 'cash_pickup', 'home_delivery'];
    let validatedDeliveryMethod = 'bank_transfer'; // Default value
    
    if (deliveryMethod !== null && deliveryMethod !== undefined) {
      if (typeof deliveryMethod !== 'string' || deliveryMethod.trim() === '') {
        return res.status(400).json({ 
          error: 'Invalid delivery method format. Delivery method must be a non-empty string.',
          field: 'deliveryMethod',
          received: deliveryMethod,
          supportedMethods: supportedDeliveryMethods
        });
      }
      
      const normalizedDeliveryMethod = deliveryMethod.toLowerCase().trim();
      if (!supportedDeliveryMethods.includes(normalizedDeliveryMethod)) {
        return res.status(400).json({ 
          error: `Unsupported delivery method '${deliveryMethod}'. Please use one of the supported delivery methods.`,
          field: 'deliveryMethod',
          supportedMethods: supportedDeliveryMethods,
          received: deliveryMethod
        });
      }
      
      validatedDeliveryMethod = normalizedDeliveryMethod;
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      userId,
      recipientId,
      type: 'send',
      amount: parseFloat(amount),
      currency: normalizedCurrency,
      status: 'pending',
      description: description || 'Money transfer',
      deliveryMethod: validatedDeliveryMethod,
      fees: transferFee.transferFeeAmount
    });
    
    // Update user balance
    await user.update({ balance: user.balance - totalAmount });
    
    res.status(201).json({
      transaction,
      transferFee,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { User, Transaction } = getModels();
    const { id } = req.params;
    const userId = req.user.id;
    
    const transaction = await Transaction.findOne({
      where: { id, userId },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      transaction,
      message: 'Transaction retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 