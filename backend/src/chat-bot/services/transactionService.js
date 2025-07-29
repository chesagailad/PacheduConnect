/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: transactionService - handles backend functionality
 */

const { getModels } = require('../../utils/database');

/**
 * Get transaction status by ID and user ID
 * @param {string} transactionId 
 * @param {string} userId 
 * @returns {object}
 */
async function getTransactionStatus(transactionId, userId) {
  try {
    const { Transaction, User } = getModels();
    
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
    const { Transaction, User } = getModels();
    
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
    const { Transaction } = getModels();
    
    const stats = await Transaction.findAll({
      where: { userId: userId },
      attributes: [
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'totalTransactions'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'totalAmount'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedTransactions'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pendingTransactions'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN status = 'failed' THEN 1 END")), 'failedTransactions']
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
        ? Math.round((parseInt(result.completedTransactions) / parseInt(result.totalTransactions)) * 100)
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
 * Get pending transactions for user
 * @param {string} userId 
 * @returns {array}
 */
async function getPendingTransactions(userId) {
  try {
    const { Transaction, User } = getModels();
    
    const transactions = await Transaction.findAll({
      where: { 
        userId: userId,
        status: 'pending'
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
    
    return transactions.map(transaction => ({
      id: transaction.id,
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
 * Get estimated completion time for delivery method
 * @param {string} deliveryMethod 
 * @returns {string}
 */
function getEstimatedCompletion(deliveryMethod) {
  const estimates = {
    'bank_transfer': '2-4 hours',
    'mobile_money': '5-15 minutes',
    'cash_pickup': '1-2 hours',
    'home_delivery': '3-6 hours'
  };
  
  return estimates[deliveryMethod] || '2-4 hours';
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
    const { Transaction, User } = getModels();
    
    const transactions = await Transaction.findAll({
      where: {
        userId: userId,
        [Transaction.sequelize.Op.or]: [
          { id: { [Transaction.sequelize.Op.iLike]: `%${keyword}%` } },
          { status: { [Transaction.sequelize.Op.iLike]: `%${keyword}%` } },
          { deliveryMethod: { [Transaction.sequelize.Op.iLike]: `%${keyword}%` } }
        ]
      },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['name', 'email'],
          where: {
            [User.sequelize.Op.or]: [
              { name: { [User.sequelize.Op.iLike]: `%${keyword}%` } },
              { email: { [User.sequelize.Op.iLike]: `%${keyword}%` } }
            ]
          },
          required: false
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
  searchTransactions
};