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
    logging: false,
    sync: { force: true }
  });

  await testSequelize.authenticate();
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
