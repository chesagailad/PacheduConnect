/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: users - handles backend functionality
 */

const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

module.exports = {
  validUser: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+27123456789',
    password: 'SecurePassword123!',
    passwordHash: null // Will be set dynamically
  },

  validUserZA: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '+27987654321',
    password: 'AnotherSecure123!',
    passwordHash: null
  },

  invalidUsers: {
    missingName: {
      email: 'missing.name@example.com',
      phoneNumber: '+27123456789',
      password: 'SecurePassword123!'
    },
    
    missingEmail: {
      name: 'Missing Email',
      phoneNumber: '+27123456789',
      password: 'SecurePassword123!'
    },
    
    invalidEmail: {
      name: 'Invalid Email',
      email: 'not-an-email',
      phoneNumber: '+27123456789',
      password: 'SecurePassword123!'
    },
    
    invalidPhoneNumber: {
      name: 'Invalid Phone',
      email: 'invalid.phone@example.com',
      phoneNumber: '123456789', // Missing country code
      password: 'SecurePassword123!'
    },
    
    shortPassword: {
      name: 'Short Password',
      email: 'short.password@example.com',
      phoneNumber: '+27123456789',
      password: '123'
    }
  },

  createUserWithHashedPassword: async (userData) => {
    const hashedPassword = await hashPassword(userData.password);
    return {
      ...userData,
      passwordHash: hashedPassword
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
      };
      users.push(await module.exports.createUserWithHashedPassword(userData));
    }
    return users;
  }
};