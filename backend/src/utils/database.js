const { Sequelize } = require('sequelize');
const { logger } = require('./logger');
const createUserModel = require('../models/User');
const createTransactionModel = require('../models/Transaction');

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

    // Test connection
    await sequelize.authenticate();
    
    // Register models (if they exist)
    try {
      const User = createUserModel(sequelize);
      const Transaction = createTransactionModel(sequelize);

      // Set up associations
      User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
      Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
      Transaction.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
      Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    } catch (error) {
      logger.warn('Models not found, skipping model registration:', error.message);
    }

    logger.info('Database connected successfully');
    global.sequelize = sequelize;
    return sequelize;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

async function disconnectDB() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    global.sequelize = null;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  sequelize: () => sequelize
}; 