/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: reset-database-simple - handles backend functionality
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  // Create a new Sequelize instance for reset
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
  });
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Drop all tables
    console.log('🗑️  Dropping all tables...');
    await sequelize.drop({ force: true });
    console.log('✅ All tables dropped');
    
    // Close connection
    await sequelize.close();
    console.log('✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('🎉 Database reset completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  }); 