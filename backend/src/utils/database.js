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

    // Register models
    const User = createUserModel(sequelize);
    const Transaction = createTransactionModel(sequelize);

    // Set up associations
    User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
    Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
    Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    await sequelize.sync(); // Sync all models
    
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

module.exports = { sequelize: getSequelize, connectDB }; 