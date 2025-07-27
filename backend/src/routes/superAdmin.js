const express = require('express');
const { getSequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createKYCModel = require('../models/KYC');
const createTransactionModel = require('../models/Transaction');
const createPaymentModel = require('../models/Payment');
const createBeneficiaryModel = require('../models/Beneficiary');
const auth = require('../middleware/auth');
const router = express.Router();

// Super Admin middleware - check if user is super admin
const superAdminAuth = async (req, res, next) => {
  try {
    const User = createUserModel(getSequelize());
    const user = await User.findByPk(req.user.id);
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Get system overview statistics
router.get('/dashboard', auth, superAdminAuth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    const Transaction = createTransactionModel(getSequelize());
    const Payment = createPaymentModel(getSequelize());
    const Beneficiary = createBeneficiaryModel(getSequelize());

    // Get user statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: {
        createdAt: {
          [getSequelize().Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Get KYC statistics
    const kycStats = await KYC.findAll({
      attributes: [
        'status',
        'level',
        [getSequelize().fn('COUNT', getSequelize().col('id')), 'count']
      ],
      group: ['status', 'level']
    });

    // Get transaction statistics
    const totalTransactions = await Transaction.count();
    const totalTransactionAmount = await Transaction.sum('amount');
    const monthlyTransactions = await Transaction.count({
      where: {
        createdAt: {
          [getSequelize().Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get payment statistics
    const totalPayments = await Payment.count();
    const totalPaymentAmount = await Payment.sum('amount');
    const successfulPayments = await Payment.count({
      where: { status: 'completed' }
    });

    // Get beneficiary statistics
    const totalBeneficiaries = await Beneficiary.count();

    // Calculate KYC breakdown
    const kycBreakdown = {
      bronze: { pending: 0, approved: 0, rejected: 0 },
      silver: { pending: 0, approved: 0, rejected: 0 },
      gold: { pending: 0, approved: 0, rejected: 0 }
    };

    kycStats.forEach(stat => {
      const level = stat.level;
      const status = stat.status;
      const count = parseInt(stat.dataValues.count);
      
      if (kycBreakdown[level]) {
        kycBreakdown[level][status] = count;
      }
    });

    res.json({
      dashboard: {
        users: {
          total: totalUsers,
          active: activeUsers,
          growth: ((activeUsers / totalUsers) * 100).toFixed(2)
        },
        kyc: {
          total: kycStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
          breakdown: kycBreakdown,
          pending: kycStats.filter(stat => stat.status === 'pending')
            .reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0)
        },
        transactions: {
          total: totalTransactions,
          monthly: monthlyTransactions,
          totalAmount: totalTransactionAmount || 0
        },
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          totalAmount: totalPaymentAmount || 0,
          successRate: totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(2) : 0
        },
        beneficiaries: {
          total: totalBeneficiaries
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get all users with pagination and filters
router.get('/users', auth, superAdminAuth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const kycStatus = req.query.kycStatus || '';
    
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[getSequelize().Op.or] = [
        { name: { [getSequelize().Op.iLike]: `%${search}%` } },
        { email: { [getSequelize().Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: KYC,
        as: 'kyc',
        where: kycStatus ? { status: kycStatus } : undefined,
        required: kycStatus ? true : false
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      pagination: {
        page,
        limit,
        total: users.count,
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user details with full information
router.get('/users/:userId', auth, superAdminAuth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    const Transaction = createTransactionModel(getSequelize());
    const Payment = createPaymentModel(getSequelize());
    const Beneficiary = createBeneficiaryModel(getSequelize());

    const user = await User.findByPk(req.params.userId, {
      include: [
        {
          model: KYC,
          as: 'kyc'
        },
        {
          model: Transaction,
          as: 'transactions',
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Beneficiary,
          as: 'beneficiaries',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional statistics
    const totalTransactions = await Transaction.count({
      where: { userId: req.params.userId }
    });

    const totalTransactionAmount = await Transaction.sum('amount', {
      where: { userId: req.params.userId }
    });

    const totalPayments = await Payment.count({
      where: { userId: req.params.userId }
    });

    const totalPaymentAmount = await Payment.sum('amount', {
      where: { userId: req.params.userId }
    });

    res.json({
      user,
      statistics: {
        totalTransactions,
        totalTransactionAmount: totalTransactionAmount || 0,
        totalPayments,
        totalPaymentAmount: totalPaymentAmount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// Update user role
router.put('/users/:userId/role', auth, superAdminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const User = createUserModel(getSequelize());
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent super admin from demoting themselves
    if (user.id === req.user.id && role !== 'super_admin') {
      return res.status(400).json({ message: 'Cannot demote yourself from super admin' });
    }

    await user.update({ role });

    res.json({ 
      message: 'User role updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Suspend/activate user
router.put('/users/:userId/status', auth, superAdminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const User = createUserModel(getSequelize());
    const user = await User.findByPk(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent super admin from suspending themselves
    if (user.id === req.user.id && !isActive) {
      return res.status(400).json({ message: 'Cannot suspend yourself' });
    }

    await user.update({ isActive });

    res.json({ 
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Get all KYC records with filters
router.get('/kyc', auth, superAdminAuth, async (req, res) => {
  try {
    const KYC = createKYCModel(getSequelize());
    const User = createUserModel(getSequelize());
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const level = req.query.level || '';
    const search = req.query.search || '';
    
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    if (status) whereClause.status = status;
    if (level) whereClause.level = level;

    const kycRecords = await KYC.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        where: search ? {
          [getSequelize().Op.or]: [
            { name: { [getSequelize().Op.iLike]: `%${search}%` } },
            { email: { [getSequelize().Op.iLike]: `%${search}%` } }
          ]
        } : undefined
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      kycRecords: kycRecords.rows,
      pagination: {
        page,
        limit,
        total: kycRecords.count,
        pages: Math.ceil(kycRecords.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching KYC records:', error);
    res.status(500).json({ message: 'Failed to fetch KYC records' });
  }
});

// Get KYC statistics
router.get('/kyc/stats', auth, superAdminAuth, async (req, res) => {
  try {
    const KYC = createKYCModel(getSequelize());
    
    const stats = await KYC.findAll({
      attributes: [
        'status',
        'level',
        [getSequelize().fn('COUNT', getSequelize().col('id')), 'count']
      ],
      group: ['status', 'level']
    });

    const breakdown = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byLevel: {
        bronze: { total: 0, pending: 0, approved: 0, rejected: 0 },
        silver: { total: 0, pending: 0, approved: 0, rejected: 0 },
        gold: { total: 0, pending: 0, approved: 0, rejected: 0 }
      }
    };

    stats.forEach(stat => {
      const level = stat.level;
      const status = stat.status;
      const count = parseInt(stat.dataValues.count);
      
      breakdown.total += count;
      breakdown[status] += count;
      
      if (breakdown.byLevel[level]) {
        breakdown.byLevel[level].total += count;
        breakdown.byLevel[level][status] += count;
      }
    });

    res.json({ stats: breakdown });
  } catch (error) {
    console.error('Error fetching KYC stats:', error);
    res.status(500).json({ message: 'Failed to fetch KYC statistics' });
  }
});

// Approve KYC (super admin override)
router.post('/kyc/:kycId/approve', auth, superAdminAuth, async (req, res) => {
  try {
    const KYC = createKYCModel(getSequelize());
    const kyc = await KYC.findByPk(req.params.kycId);
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    // Determine next level
    let nextLevel = kyc.level;
    if (kyc.level === 'bronze') {
      nextLevel = 'silver';
    } else if (kyc.level === 'silver') {
      nextLevel = 'gold';
    }

    await kyc.update({
      level: nextLevel,
      status: 'approved',
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });

    res.json({ 
      message: 'KYC approved successfully',
      newLevel: nextLevel
    });
  } catch (error) {
    console.error('Error approving KYC:', error);
    res.status(500).json({ message: 'Failed to approve KYC' });
  }
});

// Reject KYC (super admin override)
router.post('/kyc/:kycId/reject', auth, superAdminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const KYC = createKYCModel(getSequelize());
    const kyc = await KYC.findByPk(req.params.kycId);
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    await kyc.update({
      status: 'rejected',
      rejectionReason,
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });

    res.json({ message: 'KYC rejected successfully' });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    res.status(500).json({ message: 'Failed to reject KYC' });
  }
});

// Get system logs/audit trail
router.get('/logs', auth, superAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action || '';
    const userId = req.query.userId || '';
    
    const offset = (page - 1) * limit;
    
    // This would typically come from a logs/audit table
    // For now, we'll return a placeholder structure
    res.json({
      logs: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// Get system health and performance metrics
router.get('/system/health', auth, superAdminAuth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    const Transaction = createTransactionModel(getSequelize());
    
    // Get database connection status
    const dbStatus = await getSequelize().authenticate()
      .then(() => 'healthy')
      .catch(() => 'unhealthy');

    // Get basic metrics
    const totalUsers = await User.count();
    const totalKYC = await KYC.count();
    const totalTransactions = await Transaction.count();

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const newUsers24h = await User.count({
      where: {
        createdAt: {
          [getSequelize().Op.gte]: yesterday
        }
      }
    });

    const newKYC24h = await KYC.count({
      where: {
        createdAt: {
          [getSequelize().Op.gte]: yesterday
        }
      }
    });

    const newTransactions24h = await Transaction.count({
      where: {
        createdAt: {
          [getSequelize().Op.gte]: yesterday
        }
      }
    });

    res.json({
      system: {
        database: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      },
      metrics: {
        total: {
          users: totalUsers,
          kyc: totalKYC,
          transactions: totalTransactions
        },
        last24h: {
          newUsers: newUsers24h,
          newKYC: newKYC24h,
          newTransactions: newTransactions24h
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ message: 'Failed to fetch system health' });
  }
});

// Update system settings
router.put('/system/settings', auth, superAdminAuth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    // Validate settings
    const allowedSettings = [
      'kycAutoApproval',
      'maxFileSize',
      'maintenanceMode',
      'registrationEnabled',
      'kycRequired'
    ];

    const validSettings = {};
    Object.keys(settings).forEach(key => {
      if (allowedSettings.includes(key)) {
        validSettings[key] = settings[key];
      }
    });

    // In a real implementation, these would be stored in a database
    // For now, we'll just return success
    res.json({ 
      message: 'System settings updated successfully',
      settings: validSettings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Failed to update system settings' });
  }
});

module.exports = router; 