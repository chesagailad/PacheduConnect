const express = require('express');
const { sequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user's transactions with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      limit = 20, 
      offset = 0,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    
    // Build where clause
    const whereClause = { userId: req.user.id };
    
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize().Sequelize.Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[sequelize().Sequelize.Op.lte] = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      whereClause.amount = {};
      if (minAmount) whereClause.amount[sequelize().Sequelize.Op.gte] = parseFloat(minAmount);
      if (maxAmount) whereClause.amount[sequelize().Sequelize.Op.lte] = parseFloat(maxAmount);
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

    // Format transactions for frontend
    const formattedTransactions = transactions.rows.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      recipient: transaction.recipient?.name || transaction.recipientId,
      sender: transaction.sender?.name || transaction.senderId,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt
    }));

    return res.json({ 
      transactions: formattedTransactions,
      total: transactions.count,
      hasMore: transactions.count > parseInt(offset) + formattedTransactions.length
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
});

// Get transaction details by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    
    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id },
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
      return res.status(404).json({ message: 'Transaction not found' });
    }

    return res.json({
      id: transaction.id,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      recipient: transaction.recipient?.name || transaction.recipientId,
      sender: transaction.sender?.name || transaction.senderId,
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch transaction', error: err.message });
  }
});

// Get transaction statistics
router.get('/stats/summary', auth, async (req, res) => {
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

    // Get transaction counts by status
    const statusCounts = await Transaction.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startDate
        }
      },
      attributes: [
        'status',
        [sequelize().Sequelize.fn('COUNT', sequelize().Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Get total amounts by type
    const typeAmounts = await Transaction.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startDate
        }
      },
      attributes: [
        'type',
        [sequelize().Sequelize.fn('SUM', sequelize().Sequelize.col('amount')), 'total']
      ],
      group: ['type']
    });

    // Get recent activity
    const recentTransactions = await Transaction.count({
      where: {
        userId: req.user.id,
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startDate
        }
      }
    });

    return res.json({
      period,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      typeAmounts: typeAmounts.reduce((acc, item) => {
        acc[item.type] = parseFloat(item.dataValues.total) || 0;
        return acc;
      }, {}),
      recentTransactions
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
});

// Create a new transaction (send money)
router.post('/', auth, async (req, res) => {
  try {
    const { recipientEmail, amount, currency = 'USD', description } = req.body;
    
    if (!recipientEmail || !amount) {
      return res.status(400).json({ message: 'Recipient email and amount are required.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    const User = createUserModel(sequelize());
    const Transaction = createTransactionModel(sequelize());

    // Find recipient
    const recipient = await User.findOne({ where: { email: recipientEmail } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot send money to yourself.' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'send',
      amount,
      currency,
      recipientId: recipient.id,
      status: 'completed', // For demo purposes, set as completed immediately
      description
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
      message: 'Transaction completed successfully',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        recipient: recipient.name,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Transaction failed', error: err.message });
  }
});

// Cancel a pending transaction
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const Transaction = createTransactionModel(sequelize());
    
    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id, status: 'pending' }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Pending transaction not found' });
    }

    await transaction.update({ status: 'cancelled' });

    return res.json({ 
      message: 'Transaction cancelled successfully',
      transaction: {
        id: transaction.id,
        status: transaction.status
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel transaction', error: err.message });
  }
});

module.exports = router; 