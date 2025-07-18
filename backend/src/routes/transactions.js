const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { getSequelize } = require('../utils/database');
const createTransactionModel = require('../models/Transaction');
const createUserModel = require('../models/User');
const createNotificationModel = require('../models/Notification');
const { calculateFee, validateTransferWithFees } = require('../utils/feeCalculator');
const { convertCurrency, getExchangeRate, getAllRates, calculateCommission, getFeeStructure, SUPPORTED_CURRENCIES } = require('../utils/exchangeRate');

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert currency with commission calculation
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
      note: conversion.commission.commissionAmount > 0 ? 
        `Commission of ${conversion.commission.commissionRate * 100}% applied to ZAR amount` : 
        'No commission applied'
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Calculate commission for ZAR transactions
router.post('/calculate-commission', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }
    
    const commission = calculateCommission(parseFloat(amount), currency.toUpperCase());
    
    res.json({
      commission,
      message: commission.commissionAmount > 0 ? 
        'Commission calculated for ZAR transaction' : 
        'No commission applicable for this currency'
    });
  } catch (error) {
    console.error('Error calculating commission:', error);
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
    const Transaction = createTransactionModel(getSequelize());
    const User = createUserModel(getSequelize());
    
    const {
      type,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      limit = 20,
      offset = 0
    } = req.query;
    
    const where = { userId: req.user.id };
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };
    if (minAmount) where.amount = { [Op.gte]: parseFloat(minAmount) };
    if (maxAmount) where.amount = { ...where.amount, [Op.lte]: parseFloat(maxAmount) };
    
    const transactions = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'recipient',
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
      hasMore: transactions.count > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate fee for a transaction
router.post('/calculate-fee', auth, async (req, res) => {
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
    const { recipientEmail, amount, currency = 'USD', description } = req.body;
    
    if (!recipientEmail || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    
    const sequelize = getSequelize();
    const User = createUserModel(sequelize);
    const Transaction = createTransactionModel(sequelize);
    const Notification = createNotificationModel(sequelize);
    const createKYCModel = require('../models/KYC');
    const KYC = createKYCModel(sequelize);
    
    // Check KYC status and limits
    const kyc = await KYC.findOne({ where: { userId: req.user.id } });
    if (!kyc) {
      return res.status(400).json({ error: 'KYC verification required' });
    }
    
    if (kyc.status !== 'approved') {
      return res.status(400).json({ 
        error: 'KYC verification pending or rejected',
        kycStatus: kyc.status,
        kycLevel: kyc.level
      });
    }
    
    // Check if user can send this amount
    if (!kyc.canSendAmount(parseFloat(amount))) {
      const remainingLimit = kyc.monthlySendLimit - kyc.currentMonthSent;
      return res.status(400).json({ 
        error: 'Monthly send limit exceeded',
        monthlyLimit: kyc.monthlySendLimit,
        currentMonthSent: kyc.currentMonthSent,
        remainingLimit: Math.max(0, remainingLimit),
        kycLevel: kyc.level
      });
    }
    
    // Find recipient
    const recipient = await User.findOne({ where: { email: recipientEmail } });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    if (recipient.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send money to yourself' });
    }
    
    // Calculate fee
    const feeInfo = calculateFee(parseFloat(amount), currency);
    const totalAmount = feeInfo.totalAmount;
    
    // Check sender's balance including fees
    const sentAmount = await Transaction.sum('amount', {
      where: {
        userId: req.user.id,
        type: 'send',
        status: 'completed'
      }
    });
    
    const receivedAmount = await Transaction.sum('amount', {
      where: {
        userId: req.user.id,
        type: 'receive',
        status: 'completed'
      }
    });
    
    const balance = (receivedAmount || 0) - (sentAmount || 0);
    
    if (balance < totalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        balance: balance.toFixed(2),
        required: totalAmount.toFixed(2),
        shortfall: (totalAmount - balance).toFixed(2)
      });
    }
    
    // Create transaction with fee information
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'send',
      amount: feeInfo.amount, // Original amount (without fee)
      currency,
      recipientId: recipient.id,
      senderId: req.user.id,
      status: 'completed',
      description: description || `Transfer to ${recipient.name}`,
      fee: feeInfo.fee, // Store fee amount
      totalAmount: feeInfo.totalAmount // Store total amount including fee
    });
    
    // Update KYC monthly sent amount
    kyc.addToMonthlySent(parseFloat(amount));
    await kyc.save();
    
    // Create notification for sender
    await Notification.create({
      userId: req.user.id,
      type: 'transaction',
      title: 'Money Sent',
      message: `You sent ${currency} ${feeInfo.amount} to ${recipient.name}. Fee: ${currency} ${feeInfo.fee}`,
      data: { 
        transactionId: transaction.id, 
        type: 'send',
        fee: feeInfo.fee,
        totalAmount: feeInfo.totalAmount
      }
    });
    
    // Create notification for recipient
    await Notification.create({
      userId: recipient.id,
      type: 'transaction',
      title: 'Money Received',
      message: `You received ${currency} ${feeInfo.amount} from ${req.user.name}.`,
      data: { 
        transactionId: transaction.id, 
        type: 'receive',
        amount: feeInfo.amount
      }
    });
    
    res.status(201).json({
      message: 'Transaction completed successfully',
      transaction: {
        id: transaction.id,
        amount: feeInfo.amount,
        fee: feeInfo.fee,
        totalAmount: feeInfo.totalAmount,
        currency,
        recipient: {
          id: recipient.id,
          name: recipient.name,
          email: recipient.email
        },
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      feeBreakdown: feeInfo
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 