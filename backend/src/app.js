/**
 * Application Entry Point for Testing
 * 
 * This file serves as the entry point for testing the Express application.
 * It imports the configured Express app from server.js and exports it for
 * use in test suites and external testing frameworks.
 * 
 * The separation of app configuration from server startup allows for:
 * - Clean testing without starting the actual server
 * - Integration testing with supertest
 * - Modular testing of middleware and routes
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Import the configured Express app from server.js
const app = require('./server');

// Export the app for testing purposes
module.exports = app; 