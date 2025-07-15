require('dotenv').config({ path: '.env.test' });
const { connectDB } = require('../src/utils/database');
const { connectRedis } = require('../src/utils/redis');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'sqlite::memory:';

// Setup test database before all tests
beforeAll(async () => {
  try {
    await connectDB();
    await connectRedis();
  } catch (error) {
    console.error('Test setup failed:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  if (global.sequelize) {
    await global.sequelize.close();
  }
  if (global.redis) {
    await global.redis.quit();
  }
});

// Clear database before each test
beforeEach(async () => {
  if (global.sequelize) {
    await global.sequelize.sync({ force: true });
  }
});