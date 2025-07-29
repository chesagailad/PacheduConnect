/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Application entry point for testing - exports configured Express app for test suites
 */

// Import the configured Express app from server.js
const app = require('./server');

// Export the app for testing purposes
module.exports = app; 