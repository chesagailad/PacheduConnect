/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: fix-database - handles backend functionality
 */

const { connectDB, getSequelize } = require('../src/utils/database');
const createUserModel = require('../src/models/User');
const createKYCModel = require('../src/models/KYC');
const createTransactionModel = require('../src/models/Transaction');
const createPaymentModel = require('../src/models/Payment');
const createBeneficiaryModel = require('../src/models/Beneficiary');
const createNotificationModel = require('../src/models/Notification');

async function fixDatabase() {
  try {
    console.log('🔄 Starting database fix process...');
    
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await connectDB();
    const sequelize = getSequelize();
    
    // Force drop all tables to start fresh
    console.log('🗑️  Dropping all existing tables...');
    await sequelize.drop({ force: true });
    
    // Create all models
    console.log('🏗️  Creating models...');
    const User = createUserModel(sequelize);
    const KYC = createKYCModel(sequelize);
    const Transaction = createTransactionModel(sequelize);
    const Payment = createPaymentModel(sequelize);
    const Beneficiary = createBeneficiaryModel(sequelize);
    const Notification = createNotificationModel(sequelize);
    
    // Set up associations
    console.log('🔗 Setting up associations...');
    
    // User associations
    User.hasOne(KYC, { foreignKey: 'userId', as: 'kyc' });
    User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
    User.hasMany(Beneficiary, { foreignKey: 'userId', as: 'beneficiaries' });
    User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
    
    // KYC associations
    KYC.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    KYC.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });
    
    // Transaction associations
    Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Transaction.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
    
    // Payment associations
    Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
    
    // Beneficiary associations
    Beneficiary.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Notification associations
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Sync all models with force: true to recreate tables
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('✅ Database fixed successfully!');
    console.log('📊 Tables created:');
    console.log('  - Users');
    console.log('  - KYC');
    console.log('  - Transactions');
    console.log('  - Payments');
    console.log('  - Beneficiaries');
    console.log('  - Notifications');
    
    // Test database connection
    console.log('🧪 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection test successful!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    throw error;
  } finally {
    const sequelize = getSequelize();
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixDatabase()
    .then(() => {
      console.log('🎉 Database fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabase }; 