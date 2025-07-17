require('dotenv').config();
const { Sequelize } = require('sequelize');

async function resetDatabase() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
  });

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Drop all tables and recreate them
    console.log('Dropping all tables...');
    await sequelize.drop();
    console.log('All tables dropped.');

    // Import models
    const createUserModel = require('../src/models/User');
    const createTransactionModel = require('../src/models/Transaction');
    const createNotificationModel = require('../src/models/Notification');
    const createPaymentModel = require('../src/models/Payment');
    const createBeneficiaryModel = require('../src/models/Beneficiary');
    const createKYCModel = require('../src/models/KYC');

    // Create models
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
    console.log('Creating tables with associations...');
    await sequelize.sync({ force: true });
    console.log('Database reset completed successfully!');

    await sequelize.close();
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 