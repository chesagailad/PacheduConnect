const express = require('express');
const auth = require('../middleware/auth');
const { getSequelize } = require('../utils/database');
const createTransactionModel = require('../models/Transaction');
const createUserModel = require('../models/User');
const createNotificationModel = require('../models/Notification');
const { calculateFee, validateTransferWithFees } = require('../utils/feeCalculator');
const { convertCurrency, getExchangeRate, getAllRates } = require('../utils/exchangeRate');

const router = express.Router();

// Get all exchange rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const rates = await getAllRates();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert currency
router.post('/convert-currency', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'Both fromCurrency and toCurrency are required' });
    }
    
    const conversion = await convertCurrency(parseFloat(amount), fromCurrency, toCurrency);
    
    res.json({
      conversion,
      message: 'Currency converted successfully'
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get specific exchange rate
router.get('/exchange-rate/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    
    const rate = await getExchangeRate(from, to);
    
    res.json({
      rate,
      message: 'Exchange rate retrieved successfully'
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
    if (startDate) where.createdAt = { [getSequelize().Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [getSequelize().Op.lte]: new Date(endDate) };
    if (minAmount) where.amount = { [getSequelize().Op.gte]: parseFloat(minAmount) };
    if (maxAmount) where.amount = { ...where.amount, [getSequelize().Op.lte]: parseFloat(maxAmount) };
    
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