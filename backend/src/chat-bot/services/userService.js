const { getSequelize } = require('../../../utils/database');

/**
 * Get user by email
 * @param {string} email 
 * @returns {object|null}
 */
async function getUserByEmail(email) {
  try {
    const sequelize = getSequelize();
    const { createUserModel } = require('../../../models/User');
    
    const User = createUserModel(sequelize);
    
    const user = await User.findOne({
      where: { email: email },
      attributes: ['id', 'name', 'email', 'phoneNumber', 'kycStatus', 'balance', 'createdAt']
    });
    
    return user ? user.toJSON() : null;
    
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 * @param {string} userId 
 * @returns {object|null}
 */
async function getUserById(userId) {
  try {
    const sequelize = getSequelize();
    const { createUserModel } = require('../../../models/User');
    
    const User = createUserModel(sequelize);
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'kycStatus', 'balance', 'createdAt']
    });
    
    return user ? user.toJSON() : null;
    
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Get user profile with additional details
 * @param {string} userId 
 * @returns {object|null}
 */
async function getUserProfile(userId) {
  try {
    const sequelize = getSequelize();
    const { createUserModel } = require('../../../models/User');
    const { createTransactionModel } = require('../../../models/Transaction');
    
    const User = createUserModel(sequelize);
    const Transaction = createTransactionModel(sequelize);
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phoneNumber', 'kycStatus', 'balance', 'createdAt'],
      include: [
        {
          model: Transaction,
          as: 'sentTransactions',
          attributes: ['id', 'status', 'amount', 'currency', 'createdAt'],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!user) {
      return null;
    }
    
    const userProfile = user.toJSON();
    
    // Calculate additional stats
    const transactionStats = await Transaction.findAll({
      where: { userId: userId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedTransactions']
      ],
      raw: true
    });
    
    const stats = transactionStats[0] || {};
    
    userProfile.stats = {
      totalTransactions: parseInt(stats.totalTransactions) || 0,
      totalAmount: parseFloat(stats.totalAmount) || 0,
      completedTransactions: parseInt(stats.completedTransactions) || 0
    };
    
    return userProfile;
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Get user's KYC status and details
 * @param {string} userId 
 * @returns {object}
 */
async function getUserKYCStatus(userId) {
  try {
    const sequelize = getSequelize();
    const { createUserModel } = require('../../../models/User');
    
    const User = createUserModel(sequelize);
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'kycStatus', 'kycSubmittedAt', 'kycApprovedAt', 'kycRejectedAt', 'kycRejectionReason']
    });
    
    if (!user) {
      return { status: 'not_found' };
    }
    
    const kycData = user.toJSON();
    
    // Add helpful status messages
    const statusMessages = {
      'pending': 'Your KYC documents are being reviewed. This usually takes 2-4 hours.',
      'approved': 'Your KYC verification is complete. You can now send money without limits.',
      'rejected': `Your KYC was rejected: ${kycData.kycRejectionReason || 'Please resubmit your documents.'}`,
      'not_submitted': 'Please submit your KYC documents to start sending money.',
      'incomplete': 'Please complete your KYC submission by uploading all required documents.'
    };
    
    return {
      status: kycData.kycStatus || 'not_submitted',
      message: statusMessages[kycData.kycStatus] || statusMessages['not_submitted'],
      submittedAt: kycData.kycSubmittedAt,
      approvedAt: kycData.kycApprovedAt,
      rejectedAt: kycData.kycRejectedAt,
      rejectionReason: kycData.kycRejectionReason
    };
    
  } catch (error) {
    console.error('Error getting KYC status:', error);
    return { status: 'error', message: 'Unable to check KYC status' };
  }
}

/**
 * Get user balance
 * @param {string} userId 
 * @returns {object}
 */
async function getUserBalance(userId) {
  try {
    const sequelize = getSequelize();
    const { createUserModel } = require('../../../models/User');
    
    const User = createUserModel(sequelize);
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance']
    });
    
    if (!user) {
      return { balance: 0, currency: 'ZAR' };
    }
    
    return {
      balance: parseFloat(user.balance) || 0,
      currency: 'ZAR', // Assuming ZAR as default currency
      formattedBalance: `R${(parseFloat(user.balance) || 0).toFixed(2)}`
    };
    
  } catch (error) {
    console.error('Error getting user balance:', error);
    return { balance: 0, currency: 'ZAR' };
  }
}

/**
 * Check if user can send money (KYC approved, sufficient balance, etc.)
 * @param {string} userId 
 * @param {number} amount 
 * @returns {object}
 */
async function canUserSendMoney(userId, amount = 0) {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return { canSend: false, reason: 'User not found' };
    }
    
    // Check KYC status
    if (user.kycStatus !== 'approved') {
      return { 
        canSend: false, 
        reason: 'KYC verification required',
        action: 'complete_kyc'
      };
    }
    
    // Check balance if amount specified
    if (amount > 0) {
      const balance = parseFloat(user.balance) || 0;
      if (balance < amount) {
        return { 
          canSend: false, 
          reason: `Insufficient balance. You have R${balance.toFixed(2)}, but need R${amount.toFixed(2)}`,
          action: 'add_funds'
        };
      }
    }
    
    return { canSend: true };
    
  } catch (error) {
    console.error('Error checking if user can send money:', error);
    return { canSend: false, reason: 'Unable to verify account status' };
  }
}

/**
 * Search users by name or email (for admin/support use)
 * @param {string} query 
 * @param {number} limit 
 * @returns {array}
 */
async function searchUsers(query, limit = 10) {
  try {
    const sequelize = getSequelize();
    const { createUserModel } = require('../../../models/User');
    
    const User = createUserModel(sequelize);
    
    const users = await User.findAll({
      where: {
        [sequelize.Op.or]: [
          { name: { [sequelize.Op.iLike]: `%${query}%` } },
          { email: { [sequelize.Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'email', 'phoneNumber', 'kycStatus', 'createdAt'],
      limit: limit,
      order: [['createdAt', 'DESC']]
    });
    
    return users.map(user => user.toJSON());
    
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

module.exports = {
  getUserByEmail,
  getUserById,
  getUserProfile,
  getUserKYCStatus,
  getUserBalance,
  canUserSendMoney,
  searchUsers
};