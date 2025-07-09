const express = require('express');
const bcrypt = require('bcrypt');
const { sequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const User = createUserModel(sequelize());
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const User = createUserModel(sequelize());
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        where: { email, id: { [sequelize().Sequelize.Op.ne]: req.user.id } }
      });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const Transaction = createTransactionModel(sequelize());
    
    // Get total transactions count
    const totalTransactions = await Transaction.count({
      where: { userId: req.user.id }
    });

    // Get transactions by type
    const sentTransactions = await Transaction.count({
      where: { userId: req.user.id, type: 'send' }
    });

    const receivedTransactions = await Transaction.count({
      where: { userId: req.user.id, type: 'receive' }
    });

    // Get total amount sent and received
    const sentAmount = await Transaction.sum('amount', {
      where: { userId: req.user.id, type: 'send', status: 'completed' }
    });

    const receivedAmount = await Transaction.sum('amount', {
      where: { userId: req.user.id, type: 'receive', status: 'completed' }
    });

    // Get this month's transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthTransactions = await Transaction.count({
      where: {
        userId: req.user.id,
        createdAt: {
          [sequelize().Sequelize.Op.gte]: startOfMonth
        }
      }
    });

    return res.json({
      totalTransactions,
      sentTransactions,
      receivedTransactions,
      sentAmount: sentAmount || 0,
      receivedAmount: receivedAmount || 0,
      thisMonthTransactions,
      netAmount: (receivedAmount || 0) - (sentAmount || 0)
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
});

// Get user's recent activity
router.get('/activity', auth, async (req, res) => {
  try {
    const Transaction = createTransactionModel(sequelize());
    const User = createUserModel(sequelize());
    
    const activities = await Transaction.findAll({
      where: { userId: req.user.id },
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
      limit: 10
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      amount: parseFloat(activity.amount),
      currency: activity.currency,
      status: activity.status,
      description: activity.description,
      recipient: activity.recipient?.name,
      sender: activity.sender?.name,
      createdAt: activity.createdAt
    }));

    return res.json({ activities: formattedActivities });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch activity', error: err.message });
  }
});

// Search users (for sending money)
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const User = createUserModel(sequelize());
    const users = await User.findAll({
      where: {
        [sequelize().Sequelize.Op.or]: [
          { name: { [sequelize().Sequelize.Op.iLike]: `%${q}%` } },
          { email: { [sequelize().Sequelize.Op.iLike]: `%${q}%` } }
        ],
        id: { [sequelize().Sequelize.Op.ne]: req.user.id } // Exclude current user
      },
      attributes: ['id', 'name', 'email'],
      limit: 10
    });

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to search users', error: err.message });
  }
});

module.exports = router; 