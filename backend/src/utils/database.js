/**
 * Database Connection Manager
 * 
 * This module manages PostgreSQL database connections for the PacheduConnect backend.
 * It provides Sequelize ORM configuration, model registration, and association setup
 * for all database entities including users, transactions, payments, and KYC data.
 * 
 * Features:
 * - PostgreSQL connection with Sequelize ORM
 * - Connection pooling for performance optimization
 * - SSL configuration for production environments
 * - Model registration and association setup
 * - Database synchronization and migration support
 * - Comprehensive error handling and logging
 * 
 * Database Models:
 * - User: User accounts and authentication data
 * - Transaction: Money transfer transactions
 * - Payment: Payment processing records
 * - Notification: User notification system
 * - Beneficiary: Recipient information
 * - KYC: Know Your Customer verification data
 * 
 * Associations:
 * - User has many Transactions (sent/received)
 * - User has many Payments, Notifications, Beneficiaries
 * - User has one KYC record
 * - Transaction belongs to User (sender/recipient)
 * - Payment belongs to Transaction and User
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

const { Sequelize } = require('sequelize');
const { logger } = require('./logger');

// Import model factory functions
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');
const createNotificationModel = require('../models/Notification');
const createPaymentModel = require('../models/Payment');
const createBeneficiaryModel = require('../models/Beneficiary');
const createKYCModel = require('../models/KYC');

/**
 * Sequelize Instance
 * 
 * Singleton Sequelize instance for the application.
 * Initialized as null and set during connection establishment.
 */
let sequelize = null;

/**
 * Connect to PostgreSQL Database
 * 
 * Establishes a connection to the PostgreSQL database with comprehensive
 * configuration for development and production environments. Sets up
 * connection pooling, SSL configuration, and model associations.
 * 
 * @returns {Promise<Sequelize>} Connected Sequelize instance
 * @throws {Error} If connection fails or database is unavailable
 */
async function connectDB() {
  try {
    // Create Sequelize instance with production-ready configuration
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,        // Maximum number of connection pool instances
        min: 0,        // Minimum number of connection pool instances
        acquire: 30000, // Maximum time (ms) to acquire connection
        idle: 10000,   // Maximum time (ms) connection can be idle
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
    });

    // Test the database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Register all database models
    const User = createUserModel(sequelize);
    const Transaction = createTransactionModel(sequelize);
    const Notification = createNotificationModel(sequelize);
    const Payment = createPaymentModel(sequelize);
    const Beneficiary = createBeneficiaryModel(sequelize);
    const KYC = createKYCModel(sequelize);

    // Set up model associations for relational queries
    // User associations
    User.hasMany(Transaction, { as: 'sentTransactions', foreignKey: 'senderId' });
    User.hasMany(Transaction, { as: 'receivedTransactions', foreignKey: 'recipientId' });
    User.hasMany(Transaction, { as: 'userTransactions', foreignKey: 'userId' });
    User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
    User.hasMany(Payment, { as: 'payments', foreignKey: 'userId' });
    User.hasMany(Beneficiary, { as: 'beneficiaries', foreignKey: 'userId' });
    User.hasOne(KYC, { as: 'kyc', foreignKey: 'userId' });
    
    // Transaction associations
    Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Transaction.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
    
    // Other model associations
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
    Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    KYC.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // Synchronize models with database schema
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully.');

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}

/**
 * Get Sequelize Instance
 * 
 * Returns the singleton Sequelize instance. Throws an error
 * if the database is not connected, ensuring proper initialization.
 * 
 * @returns {Sequelize} Connected Sequelize instance
 * @throws {Error} If database is not connected
 */
function getSequelize() {
  if (!sequelize) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return sequelize;
}

/**
 * Get Database Models
 * 
 * Returns all registered database models for use in other modules.
 * Creates fresh model instances to ensure proper initialization.
 * 
 * @returns {Object} Object containing all database models
 * @throws {Error} If database is not connected
 */
function getModels() {
  if (!sequelize) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  
  // Create fresh model instances
  const User = createUserModel(sequelize);
  const Transaction = createTransactionModel(sequelize);
  const Notification = createNotificationModel(sequelize);
  const Payment = createPaymentModel(sequelize);
  const Beneficiary = createBeneficiaryModel(sequelize);
  const KYC = createKYCModel(sequelize);
  
  return { User, Transaction, Notification, Payment, Beneficiary, KYC };
}

// Export database management functions
module.exports = {
  connectDB,
  getSequelize,
  getModels
}; 