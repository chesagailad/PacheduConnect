const express = require('express');
const { sequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');
const createPaymentModel = require('../models/Payment');
const auth = require('../middleware/auth');
const paymentGatewayService = require('../services/paymentGateways');
const { v4: uuidv4 } = require('uuid');
const auditLogger = require('../utils/auditLogger');
const encryptionService = require('../utils/encryption');
const {
  encryptSensitiveData,
  decryptSensitiveData,
  secureHeaders,
  validatePaymentData,
  paymentRateLimit,
  logPaymentOperations,
  preventDataLeakage,
  validateSessionSecurity,
  enforceHTTPS,
  validateOrigin
} = require('../middleware/security');

const router = express.Router();

// Apply security middleware to all payment routes
router.use(secureHeaders);
router.use(enforceHTTPS);
router.use(validateOrigin);
router.use(validateSessionSecurity);
router.use(preventDataLeakage);
router.use(logPaymentOperations);

// Get available payment gateways
router.get('/gateways', auth, async (req, res) => {
  try {
    const gateways = paymentGatewayService.getSupportedGateways();
    const gatewayConfigs = {};
    
    gateways.forEach(gateway => {
      const config = paymentGatewayService.getGatewayConfig(gateway);
      if (config) {
        gatewayConfigs[gateway] = config;
      }
    });

    return res.json({ 
      gateways: gatewayConfigs,
      message: 'Available payment gateways retrieved successfully'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment gateways', error: err.message });
  }
});

// Get user's payment methods
router.get('/methods', auth, decryptSensitiveData, async (req, res) => {
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
        isDefault: true,
        // Encrypted sensitive data
        cardNumber: encryptionService.encrypt('4111111111111111', 'payment_card'),
        cvv: encryptionService.encrypt('123', 'payment_card')
      },
      {
        id: '2',
        type: 'bank',
        accountType: 'checking',
        last4: '5678',
        bankName: 'Demo Bank',
        isDefault: false,
        // Encrypted sensitive data
        accountNumber: encryptionService.encrypt('1234567890', 'bank_account'),
        routingNumber: encryptionService.encrypt('123456789', 'bank_account')
      }
    ];

    return res.json({ paymentMethods });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment methods', error: err.message });
  }
});

// Add a new payment method
router.post('/methods', auth, encryptSensitiveData, validatePaymentData, paymentRateLimit, async (req, res) => {
  try {
    const { type, cardNumber, expiryMonth, expiryYear, cvv, bankName, accountNumber, routingNumber } = req.body;
    
    if (!type) {
      return res.status(400).json({ message: 'Payment method type is required' });
    }

    // Log payment method addition
    auditLogger.logPaymentOperation(
      auditLogger.eventTypes.CARD_DATA_STORED,
      { type, hasCardData: !!(cardNumber || cvv), hasBankData: !!(accountNumber || routingNumber) },
      req.user,
      req.ip
    );

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
    
    // Log payment method deletion
    auditLogger.logPaymentOperation(
      auditLogger.eventTypes.CARD_DATA_DELETED,
      { paymentMethodId: id },
      req.user,
      req.ip
    );
    
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

// Process a payment with specified gateway
router.post('/process/:gateway', auth, encryptSensitiveData, validatePaymentData, paymentRateLimit, async (req, res) => {
  try {
    const { gateway } = req.params;
    const { 
      amount, 
      currency = 'USD', 
      paymentMethodId, 
      description,
      recipientEmail,
      bankAccount,
      bankCode,
      returnUrl,
      cancelUrl
    } = req.body;
    
    if (!amount || !recipientEmail) {
      return res.status(400).json({ message: 'Amount and recipient are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Validate gateway
    if (!paymentGatewayService.getSupportedGateways().includes(gateway)) {
      return res.status(400).json({ message: 'Unsupported payment gateway' });
    }

    const User = createUserModel(sequelize());
    const Transaction = createTransactionModel(sequelize());
    const Payment = createPaymentModel(sequelize());

    // Find recipient
    const recipient = await User.findOne({ where: { email: recipientEmail } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot send money to yourself' });
    }

    // Get user info
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate unique reference
    const reference = `PAY_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      reference,
      customerEmail: user.email,
      customerName: user.name,
      description: description || `Payment to ${recipient.name}`,
      returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`
    };

    // Add gateway-specific data
    if (gateway === 'stripe') {
      paymentData.paymentMethodId = paymentMethodId;
      paymentData.metadata = {
        userId: req.user.id,
        recipientId: recipient.id,
        email: user.email
      };
    } else if (gateway === 'stitch') {
      if (!bankAccount || !bankCode) {
        return res.status(400).json({ message: 'Bank account and bank code are required for Stitch payments' });
      }
      paymentData.bankAccount = bankAccount;
      paymentData.bankCode = bankCode;
    }

    // Validate payment data
    try {
      paymentGatewayService.validatePaymentData(paymentData, gateway);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Process payment through gateway
    const paymentResult = await paymentGatewayService.processPayment(gateway, paymentData);

    if (!paymentResult.success) {
      // Log payment failure
      auditLogger.logPaymentOperation(
        auditLogger.eventTypes.PAYMENT_FAILED,
        {
          amount: paymentData.amount,
          currency: paymentData.currency,
          gateway,
          error: paymentResult.error
        },
        req.user,
        req.ip
      );
      
      return res.status(400).json({ 
        message: 'Payment failed', 
        error: paymentResult.error,
        gateway: gateway
      });
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user.id,
      gateway,
      gatewayTransactionId: paymentResult.transactionId,
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      status: paymentResult.status,
      paymentMethod: paymentMethodId || 'direct',
      customerId: paymentResult.customerId,
      description: paymentData.description,
      metadata: paymentResult.metadata
    });

    // Create transaction record if payment is completed
    let transaction = null;
    if (paymentResult.status === 'completed' || paymentResult.status === 'succeeded') {
      transaction = await Transaction.create({
        userId: req.user.id,
        type: 'send',
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        recipientId: recipient.id,
        status: 'completed',
        description: paymentData.description
      });

      // Create corresponding receive transaction for recipient
      await Transaction.create({
        userId: recipient.id,
        type: 'receive',
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        senderId: req.user.id,
        status: 'completed',
        description: paymentData.description
      });

      // Update payment with transaction ID
      await payment.update({ transactionId: transaction.id, processedAt: new Date() });
    }

    return res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        gateway: payment.gateway,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        gatewayTransactionId: payment.gatewayTransactionId,
        redirectUrl: paymentResult.redirectUrl,
        formData: paymentResult.formData
      },
      transaction: transaction ? {
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        recipient: recipient.name,
        status: transaction.status,
        createdAt: transaction.createdAt
      } : null
    });
  } catch (err) {
    console.error('Payment processing error:', err);
    return res.status(500).json({ message: 'Payment processing failed', error: err.message });
  }
});

// Get payment status
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const Payment = createPaymentModel(sequelize());
    const Transaction = createTransactionModel(sequelize());

    const payment = await Payment.findOne({
      where: { 
        id: paymentId,
        userId: req.user.id
      },
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: ['id', 'type', 'amount', 'currency', 'status', 'description', 'createdAt']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    return res.json({
      payment: {
        id: payment.id,
        gateway: payment.gateway,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        gatewayTransactionId: payment.gatewayTransactionId,
        description: payment.description,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt
      },
      transaction: payment.transaction ? {
        id: payment.transaction.id,
        type: payment.transaction.type,
        amount: parseFloat(payment.transaction.amount),
        currency: payment.transaction.currency,
        status: payment.transaction.status,
        description: payment.transaction.description,
        createdAt: payment.transaction.createdAt
      } : null
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment status', error: err.message });
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
      status,
      gateway
    } = req.query;

    const Payment = createPaymentModel(sequelize());
    const Transaction = createTransactionModel(sequelize());
    
    // Build where clause
    const whereClause = { 
      userId: req.user.id
    };
    
    if (status) whereClause.status = status;
    if (gateway) whereClause.gateway = gateway;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize().Sequelize.Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[sequelize().Sequelize.Op.lte] = new Date(endDate);
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: ['id', 'type', 'amount', 'currency', 'status', 'description', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedPayments = payments.rows.map(payment => ({
      id: payment.id,
      gateway: payment.gateway,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      status: payment.status,
      gatewayTransactionId: payment.gatewayTransactionId,
      description: payment.description,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
      transaction: payment.transaction ? {
        id: payment.transaction.id,
        type: payment.transaction.type,
        amount: parseFloat(payment.transaction.amount),
        currency: payment.transaction.currency,
        status: payment.transaction.status,
        description: payment.transaction.description,
        createdAt: payment.transaction.createdAt
      } : null
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
    const { period = 'month', gateway } = req.query;
    const Payment = createPaymentModel(sequelize());
    
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

    const whereClause = {
      userId: req.user.id,
      status: 'completed',
      createdAt: {
        [sequelize().Sequelize.Op.gte]: startDate
      }
    };

    if (gateway) {
      whereClause.gateway = gateway;
    }

    // Get total payments amount
    const totalPayments = await Payment.sum('amount', { where: whereClause });

    // Get payment count
    const paymentCount = await Payment.count({ where: whereClause });

    // Get average payment amount
    const avgPayment = await Payment.findOne({
      where: whereClause,
      attributes: [
        [sequelize().Sequelize.fn('AVG', sequelize().Sequelize.col('amount')), 'average']
      ]
    });

    // Get gateway breakdown
    const gatewayBreakdown = await Payment.findAll({
      where: whereClause,
      attributes: [
        'gateway',
        [sequelize().Sequelize.fn('COUNT', sequelize().Sequelize.col('id')), 'count'],
        [sequelize().Sequelize.fn('SUM', sequelize().Sequelize.col('amount')), 'total']
      ],
      group: ['gateway']
    });

    return res.json({
      period,
      totalPayments: totalPayments || 0,
      paymentCount,
      averagePayment: parseFloat(avgPayment?.dataValues?.average) || 0,
      gatewayBreakdown: gatewayBreakdown.map(item => ({
        gateway: item.gateway,
        count: parseInt(item.dataValues.count),
        total: parseFloat(item.dataValues.total) || 0
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch payment statistics', error: err.message });
  }
});

module.exports = router; 