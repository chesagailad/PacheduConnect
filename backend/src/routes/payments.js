const express = require('express');
const { sequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user's payment methods
router.get('/methods', auth, async (req, res) => {
  try {
    // For demo purposes, return mock payment methods
    // In a real app, this would query a PaymentMethod table
    const paymentMethods = [
      {
        id: '1',
        type: 'card',
        last4: '1234',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        id: '2',
        type: 'bank',
        accountType: 'checking',
        last4: '5678',
        bankName: 'Demo Bank',
        isDefault: false
      }
    ];

    return res.json({ paymentMethods });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment methods', error: err.message });
  }
});

// Add a new payment method
router.post('/methods', auth, async (req, res) => {
  try {
    const { type, cardNumber, expiryMonth, expiryYear, cvv, bankName, accountNumber, routingNumber } = req.body;
    
    if (!type) {
      return res.status(400).json({ message: 'Payment method type is required' });
    }

    // In a real app, this would validate and store payment method securely
    // For demo purposes, we'll just return a success response
    const newPaymentMethod = {
      id: Date.now().toString(),
      type,
      last4: type === 'card' ? cardNumber.slice(-4) : accountNumber.slice(-4),
      brand: type === 'card' ? 'Visa' : undefined,
      bankName: type === 'bank' ? bankName : undefined,
      expiryMonth: type === 'card' ? expiryMonth : undefined,
      expiryYear: type === 'card' ? expiryYear : undefined,
      isDefault: false
    };

    return res.status(201).json({ 
      message: 'Payment method added successfully',
      paymentMethod: newPaymentMethod
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add payment method', error: err.message });
  }
});

// Remove a payment method
router.delete('/methods/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, this would remove the payment method from the database
    return res.json({ message: 'Payment method removed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to remove payment method', error: err.message });
  }
});

// Set default payment method
router.patch('/methods/:id/default', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, this would update the default payment method
    return res.json({ message: 'Default payment method updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update default payment method', error: err.message });
  }
});

// Process a payment
router.post('/process', auth, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'USD', 
      paymentMethodId, 
      description,
      recipientEmail 
    } = req.body;
    
    if (!amount || !paymentMethodId || !recipientEmail) {
      return res.status(400).json({ message: 'Amount, payment method, and recipient are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const User = createUserModel(sequelize());
    const Transaction = createTransactionModel(sequelize());

    // Find recipient
    const recipient = await User.findOne({ where: { email: recipientEmail } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot send money to yourself' });
    }

    // In a real app, this would integrate with a payment processor
    // For demo purposes, we'll simulate a successful payment
    const paymentResult = {
      success: true,
      transactionId: `pay_${Date.now()}`,
      amount,
      currency,
      status: 'completed'
    };

    if (!paymentResult.success) {
      return res.status(400).json({ message: 'Payment failed', error: paymentResult.error });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'send',
      amount,
      currency,
      recipientId: recipient.id,
      status: 'completed',
      description,
      paymentMethodId
    });

    // Create corresponding receive transaction for recipient
    await Transaction.create({
      userId: recipient.id,
      type: 'receive',
      amount,
      currency,
      senderId: req.user.id,
      status: 'completed',
      description
    });

    return res.status(201).json({
      message: 'Payment processed successfully',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        recipient: recipient.name,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      payment: paymentResult
    });
  } catch (err) {
    return res.status(500).json({ message: 'Payment processing failed', error: err.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      startDate,
      endDate,
      status
    } = req.query;

    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    
    // Build where clause for payments (send transactions)
    const whereClause = { 
      userId: req.user.id,
      type: 'send'
    };
    
    if (status) whereClause.status = status;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize().Sequelize.Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[sequelize().Sequelize.Op.lte] = new Date(endDate);
    }

    const payments = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
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

    const formattedPayments = payments.rows.map(payment => ({
      id: payment.id,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      recipient: payment.recipient?.name || payment.recipientId,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt
    }));

    return res.json({
      payments: formattedPayments,
      total: payments.count,
      hasMore: payments.count > parseInt(offset) + formattedPayments.length
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment history', error: err.message });
  }
});

// Get payment statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const Transaction = createTransactionModel(sequelize());
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get total payments amount
    const totalPayments = await Transaction.sum('amount', {
      where: {
        userId: req.user.id,
        type: 'send',
        status: 'completed',
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startDate
        }
      }
    });

    // Get payment count
    const paymentCount = await Transaction.count({
      where: {
        userId: req.user.id,
        type: 'send',
        status: 'completed',
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startDate
        }
      }
    });

    // Get average payment amount
    const avgPayment = await Transaction.findOne({
      where: {
        userId: req.user.id,
        type: 'send',
        status: 'completed',
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize().Sequelize.fn('AVG', sequelize().Sequelize.col('amount')), 'average']
      ]
    });

    return res.json({
      period,
      totalPayments: totalPayments || 0,
      paymentCount,
      averagePayment: parseFloat(avgPayment?.dataValues?.average) || 0
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment statistics', error: err.message });
  }
});

module.exports = router; 