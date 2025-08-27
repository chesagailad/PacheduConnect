/**
 * Test Database Setup
 * Handles database initialization for tests
 */

const { Sequelize } = require('sequelize');

let testSequelize = null;

async function setupTestDatabase() {
  if (testSequelize) {
    return testSequelize;
  }

  testSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });

  await testSequelize.authenticate();
  
  // Enable foreign key constraints for SQLite
  await testSequelize.query('PRAGMA foreign_keys = ON');
  
  // Explicitly sync models with force: true to recreate tables
  await testSequelize.sync({ force: true });
  
  return testSequelize;
}

async function teardownTestDatabase() {
  if (testSequelize) {
    await testSequelize.close();
    testSequelize = null;
  }
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  getTestSequelize: () => testSequelize
};
