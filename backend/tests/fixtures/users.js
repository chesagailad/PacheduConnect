/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Test user fixtures for authentication tests
 */

const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

module.exports = {
  validUser: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+27123456789',
    password: 'SecurePassword123!',
    passwordHash: '$2b$10$hashedpasswordfor.testing' // Use consistent mock value
  },

  validUserZA: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '+27987654321',
    password: 'AnotherSecure123!',
    passwordHash: '$2b$10$hashedpasswordfor.testing' // Use consistent mock value
  },

  invalidUsers: {
    missingName: {
      email: 'missing.name@example.com',
      phoneNumber: '+27123456789',
      password: 'SecurePassword123!',
      passwordHash: '$2b$10$hashedpasswordfor.testing'
    },
    
    missingEmail: {
      name: 'Missing Email',
      phoneNumber: '+27123456789',
      password: 'SecurePassword123!',
      passwordHash: '$2b$10$hashedpasswordfor.testing'
    },
    
    invalidEmail: {
      name: 'Invalid Email',
      email: 'not-an-email',
      phoneNumber: '+27123456789',
      password: 'SecurePassword123!',
      passwordHash: '$2b$10$hashedpasswordfor.testing'
    },
    
    invalidPhoneNumber: {
      name: 'Invalid Phone',
      email: 'invalid.phone@example.com',
      phoneNumber: '123456789', // Missing country code
      password: 'SecurePassword123!',
      passwordHash: '$2b$10$hashedpasswordfor.testing'
    },
    
    shortPassword: {
      name: 'Short Password',
      email: 'short.password@example.com',
      phoneNumber: '+27123456789',
      password: '123',
      passwordHash: '$2b$10$hashedpasswordfor.testing'
    }
  },

  createUserWithHashedPassword: async (userData) => {
    // Use the mock value directly instead of calling bcrypt.hash
    return {
      ...userData,
      passwordHash: '$2b$10$hashedpasswordfor.testing'
    };
  },

  createMultipleUsers: async (count = 5) => {
    const users = [];
    for (let i = 0; i < count; i++) {
      const userData = {
        name: `Test User ${i + 1}`,
        email: `testuser${i + 1}@example.com`,
        phoneNumber: `+2712345678${i}`,
        password: `SecurePassword${i + 1}!`,
        passwordHash: '$2b$10$hashedpasswordfor.testing'
      };
      users.push(userData);
    }
    return users;
  }
};