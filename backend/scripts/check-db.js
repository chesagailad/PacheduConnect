/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: check-db - handles backend functionality
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkDatabase() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
  });

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Import models
    const createUserModel = require('../src/models/User');
    const User = createUserModel(sequelize);

    // Check if users exist
    const userCount = await User.count();
    console.log(`Number of users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('No users found. Creating a test user...');
      
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash('test123', 10);
      
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: passwordHash,
        phoneNumber: '+27838755929'
      });
      
      console.log('Test user created:', {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        phoneNumber: testUser.phoneNumber
      });
    } else {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'phoneNumber'],
        limit: 5
      });
      
      console.log('Existing users:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.phoneNumber || 'No phone'}`);
      });
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase(); 