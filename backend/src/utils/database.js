const { Sequelize } = require('sequelize');
const { logger } = require('./logger');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');

let sequelize;

const connectDB = async () => {
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

    // Set up associations
    User.hasMany(Transaction, { as: 'sentTransactions', foreignKey: 'senderId' });
    User.hasMany(Transaction, { as: 'receivedTransactions', foreignKey: 'recipientId' });
    User.hasMany(Transaction, { as: 'transactions', foreignKey: 'userId' });
    
    Transaction.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
    Transaction.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
    Transaction.belongsTo(User, { as: 'user', foreignKey: 'userId' });

    // Sync models with database
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully.');

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return sequelize;
};

const closeDB = async () => {
  if (sequelize) {
    await sequelize.close();
    logger.info('Database connection closed.');
  }
};

module.exports = {
  connectDB,
  getSequelize,
  closeDB,
}; 