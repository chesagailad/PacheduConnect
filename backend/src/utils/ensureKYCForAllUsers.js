/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: ensureKYCForAllUsers - handles backend functionality
 */

const { getSequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createKYCModel = require('../models/KYC');

/**
 * Ensures all users have a Bronze level KYC record
 * This script can be run to fix any users who don't have KYC records
 */
async function ensureKYCForAllUsers() {
  try {
    const sequelize = getSequelize();
    const User = createUserModel(sequelize);
    const KYC = createKYCModel(sequelize);

    console.log('Checking for users without KYC records...');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'name', 'email']
    });

    console.log(`Found ${users.length} total users`);

    let createdCount = 0;
    let existingCount = 0;

    for (const user of users) {
      // Check if user already has a KYC record
      const existingKYC = await KYC.findOne({
        where: { userId: user.id }
      });

      if (!existingKYC) {
        // Create Bronze level KYC record for user
        await KYC.create({
          userId: user.id,
          level: 'bronze',
          status: 'approved', // Bronze level is auto-approved
          monthlySendLimit: 5000.00,
          currentMonthSent: 0.00,
          resetDate: new Date()
        });

        console.log(`✅ Created Bronze KYC record for user: ${user.email}`);
        createdCount++;
      } else {
        console.log(`ℹ️  User ${user.email} already has KYC record (${existingKYC.level} level)`);
        existingCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Existing KYC records: ${existingCount}`);
    console.log(`- New KYC records created: ${createdCount}`);
    console.log(`- All users now have Bronze level KYC records`);

  } catch (error) {
    console.error('Error ensuring KYC records:', error);
    throw error;
  }
}

/**
 * Updates all existing KYC records to ensure they start with Bronze level
 * This is useful if some users have incorrect default levels
 */
async function updateKYCToBronzeDefault() {
  try {
    const sequelize = getSequelize();
    const KYC = createKYCModel(sequelize);

    console.log('Updating KYC records to ensure Bronze level default...');

    // Find KYC records that don't have a level set or have incorrect defaults
    const kycRecords = await KYC.findAll({
      where: {
        level: null
      }
    });

    console.log(`Found ${kycRecords.length} KYC records without level`);

    let updatedCount = 0;

    for (const kyc of kycRecords) {
      await kyc.update({
        level: 'bronze',
        status: 'approved',
        monthlySendLimit: 5000.00
      });

      console.log(`✅ Updated KYC record for user ID: ${kyc.userId}`);
      updatedCount++;
    }

    console.log(`\n📊 Updated ${updatedCount} KYC records to Bronze level`);

  } catch (error) {
    console.error('Error updating KYC records:', error);
    throw error;
  }
}

/**
 * Validates that all users have proper KYC records
 */
async function validateKYCRecords() {
  try {
    const sequelize = getSequelize();
    const User = createUserModel(sequelize);
    const KYC = createKYCModel(sequelize);

    console.log('Validating KYC records...');

    const users = await User.findAll({
      attributes: ['id', 'name', 'email']
    });

    let validCount = 0;
    let invalidCount = 0;

    for (const user of users) {
      const kyc = await KYC.findOne({
        where: { userId: user.id }
      });

      if (kyc && kyc.level === 'bronze') {
        validCount++;
      } else {
        console.log(`❌ User ${user.email} missing or invalid KYC record`);
        invalidCount++;
      }
    }

    console.log('\n📊 Validation Results:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Valid KYC records: ${validCount}`);
    console.log(`- Invalid/missing KYC records: ${invalidCount}`);

    return invalidCount === 0;
  } catch (error) {
    console.error('Error validating KYC records:', error);
    throw error;
  }
}

// Export functions for use in other scripts
module.exports = {
  ensureKYCForAllUsers,
  updateKYCToBronzeDefault,
  validateKYCRecords
};

// If this script is run directly
if (require.main === module) {
  const { connectDB } = require('../utils/database');
  
  async function main() {
    try {
      await connectDB();
      console.log('🔗 Connected to database');
      
      console.log('\n🔍 Validating current KYC records...');
      const isValid = await validateKYCRecords();
      
      if (!isValid) {
        console.log('\n🔧 Fixing KYC records...');
        await ensureKYCForAllUsers();
        await updateKYCToBronzeDefault();
        
        console.log('\n✅ Final validation...');
        await validateKYCRecords();
      } else {
        console.log('\n✅ All users already have proper Bronze level KYC records');
      }
      
      console.log('\n🎉 KYC validation complete!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  }

  main();
} 