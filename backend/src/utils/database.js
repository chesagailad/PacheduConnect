const { Sequelize } = require('sequelize');
const { logger } = require('./logger');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');
const createNotificationModel = require('../models/Notification');
const createPaymentModel = require('../models/Payment');
const createBeneficiaryModel = require('../models/Beneficiary');
const createKYCModel = require('../models/KYC');

let sequelize = null;

async function connectDB() {
  try {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
    });

    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Register models
    const User = createUserModel(sequelize);
    const Transaction = createTransactionModel(sequelize);
    const Notification = createNotificationModel(sequelize);
    const Payment = createPaymentModel(sequelize);
    const Beneficiary = createBeneficiaryModel(sequelize);
    const KYC = createKYCModel(sequelize);

    // Set up associations
    User.hasMany(Transaction, { as: 'sentTransactions', foreignKey: 'senderId' });
    User.hasMany(Transaction, { as: 'receivedTransactions', foreignKey: 'recipientId' });
    User.hasMany(Transaction, { as: 'userTransactions', foreignKey: 'userId' });
    User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
    User.hasMany(Payment, { as: 'payments', foreignKey: 'userId' });
    User.hasMany(Beneficiary, { as: 'beneficiaries', foreignKey: 'userId' });
    User.hasOne(KYC, { as: 'kyc', foreignKey: 'userId' });
    
    Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Transaction.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
    Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    KYC.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // Sync models with database
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully.');

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
}

function getSequelize() {
  if (!sequelize) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return sequelize;
}

module.exports = {
  connectDB,
  getSequelize
};
