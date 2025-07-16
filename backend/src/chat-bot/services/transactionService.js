const { getSequelize } = require('../../../utils/database');

/**
 * Get transaction status by ID and user ID
 * @param {string} transactionId 
 * @param {string} userId 
 * @returns {object}
 */
async function getTransactionStatus(transactionId, userId) {
  try {
    const sequelize = getSequelize();
    
    // Import models
    const { createTransactionModel } = require('../../../models/Transaction');
    const { createUserModel } = require('../../../models/User');
    
    const Transaction = createTransactionModel(sequelize);
    const User = createUserModel(sequelize);
    
    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId: userId
      },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['name', 'email']
        }
      ]
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      recipientName: transaction.recipient?.name || 'Unknown',
      deliveryMethod: transaction.deliveryMethod,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      fees: transaction.fees,
      exchangeRate: transaction.exchangeRate
    };
    
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
}

/**
 * Get recent transactions for user
 * @param {string} userId 
 * @param {number} limit 
 * @returns {array}
 */
async function getRecentTransactions(userId, limit = 5) {
  try {
    const sequelize = getSequelize();
    const { createTransactionModel } = require('../../../models/Transaction');
    const { createUserModel } = require('../../../models/User');
    
    const Transaction = createTransactionModel(sequelize);
    const User = createUserModel(sequelize);
    
    const transactions = await Transaction.findAll({
      where: { userId: userId },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit
    });
    
    return transactions.map(transaction => ({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      recipientName: transaction.recipient?.name || 'Unknown',
      deliveryMethod: transaction.deliveryMethod,
      createdAt: transaction.createdAt
    }));
    
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return [];
  }
}

/**
 * Get transaction statistics for user
 * @param {string} userId 
 * @returns {object}
 */
async function getTransactionStats(userId) {
  try {
    const sequelize = getSequelize();
    const { createTransactionModel } = require('../../../models/Transaction');
    
    const Transaction = createTransactionModel(sequelize);
    
    const stats = await Transaction.findAll({
      where: { userId: userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedTransactions'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pendingTransactions'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'failed' THEN 1 END")), 'failedTransactions']
      ],
      raw: true
    });
    
    const result = stats[0] || {};
    
    return {
      totalTransactions: parseInt(result.totalTransactions) || 0,
      totalAmount: parseFloat(result.totalAmount) || 0,
      completedTransactions: parseInt(result.completedTransactions) || 0,
      pendingTransactions: parseInt(result.pendingTransactions) || 0,
      failedTransactions: parseInt(result.failedTransactions) || 0,
      successRate: result.totalTransactions > 0 
        ? ((result.completedTransactions / result.totalTransactions) * 100).toFixed(1)
        : 0
    };
    
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    return {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      successRate: 0
    };
  }
}

/**
 * Check if user has any pending transactions
 * @param {string} userId 
 * @returns {array}
 */
async function getPendingTransactions(userId) {
  try {
    const sequelize = getSequelize();
    const { createTransactionModel } = require('../../../models/Transaction');
    const { createUserModel } = require('../../../models/User');
    
    const Transaction = createTransactionModel(sequelize);
    const User = createUserModel(sequelize);
    
    const pendingTransactions = await Transaction.findAll({
      where: {
        userId: userId,
        status: ['pending', 'processing']
      },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return pendingTransactions.map(transaction => ({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      recipientName: transaction.recipient?.name || 'Unknown',
      deliveryMethod: transaction.deliveryMethod,
      createdAt: transaction.createdAt,
      estimatedCompletion: getEstimatedCompletion(transaction.deliveryMethod)
    }));
    
  } catch (error) {
    console.error('Error getting pending transactions:', error);
    return [];
  }
}

/**
 * Get estimated completion time based on delivery method
 * @param {string} deliveryMethod 
 * @returns {string}
 */
function getEstimatedCompletion(deliveryMethod) {
  const estimations = {
    'ecocash': 'Within 5 minutes',
    'bank_transfer': 'Within 2 hours',
    'cash_pickup': 'Within 1 hour',
    'home_delivery': 'Within 24 hours'
  };
  
  return estimations[deliveryMethod] || 'Processing';
}

/**
 * Search transactions by keyword
 * @param {string} userId 
 * @param {string} keyword 
 * @param {number} limit 
 * @returns {array}
 */
async function searchTransactions(userId, keyword, limit = 10) {
  try {
    const sequelize = getSequelize();
    const { createTransactionModel } = require('../../../models/Transaction');
    const { createUserModel } = require('../../../models/User');
    
    const Transaction = createTransactionModel(sequelize);
    const User = createUserModel(sequelize);
    
    const transactions = await Transaction.findAll({
      where: {
        userId: userId,
        [sequelize.Op.or]: [
          { id: { [sequelize.Op.iLike]: `%${keyword}%` } },
          { description: { [sequelize.Op.iLike]: `%${keyword}%` } },
          sequelize.literal(`EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = "Transaction"."recipientId" 
            AND (users.name ILIKE '%${keyword}%' OR users.email ILIKE '%${keyword}%')
          )`)
        ]
      },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit
    });
    
    return transactions.map(transaction => ({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      recipientName: transaction.recipient?.name || 'Unknown',
      deliveryMethod: transaction.deliveryMethod,
      createdAt: transaction.createdAt
    }));
    
  } catch (error) {
    console.error('Error searching transactions:', error);
    return [];
  }
}

module.exports = {
  getTransactionStatus,
  getRecentTransactions,
  getTransactionStats,
  getPendingTransactions,
  searchTransactions,
  getEstimatedCompletion
};