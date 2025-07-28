/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: 20250714112622-test-user-and-data - test file for backend functionality
 */

'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Static UUIDs for referential integrity
    const userId = '11111111-1111-1111-1111-111111111111';
    const beneficiary1Id = '22222222-2222-2222-2222-222222222222';
    const beneficiary2Id = '33333333-3333-3333-3333-333333333333';
    const transaction1Id = '44444444-4444-4444-4444-444444444444';
    const transaction2Id = '55555555-5555-5555-5555-555555555555';
    const now = new Date();
    const passwordHash = await bcrypt.hash('password123', 10);

    // Insert test user
    await queryInterface.bulkInsert('Users', [
      {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        passwordHash,
        role: 'user',
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // Insert beneficiaries
    await queryInterface.bulkInsert('Beneficiaries', [
      {
        id: beneficiary1Id,
        userId: userId,
        name: 'Alice Beneficiary',
        email: 'alice@example.com',
        phoneNumber: '+1111111111',
        bankName: 'Test Bank',
        accountNumber: '123456789',
        accountType: 'savings',
        country: 'USA',
        address: '123 Main St, City',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beneficiary2Id,
        userId: userId,
        name: 'Bob Beneficiary',
        email: 'bob@example.com',
        phoneNumber: '+2222222222',
        bankName: 'Sample Bank',
        accountNumber: '987654321',
        accountType: 'checking',
        country: 'Canada',
        address: '456 Maple Ave, Town',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // Insert transactions
    await queryInterface.bulkInsert('Transactions', [
      {
        id: transaction1Id,
        userId: userId,
        type: 'send',
        amount: 100.00,
        currency: 'USD',
        recipientId: null,
        senderId: userId,
        status: 'completed',
        description: 'Test send transaction',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: transaction2Id,
        userId: userId,
        type: 'receive',
        amount: 250.00,
        currency: 'USD',
        recipientId: userId,
        senderId: null,
        status: 'pending',
        description: 'Test receive transaction',
        createdAt: now,
        updatedAt: now,
      }
    ]);

    const adminId = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const superAdminId = 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const user2Id = 'ccccccc1-cccc-cccc-cccc-cccccccccccc';
    const beneficiary3Id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const beneficiary4Id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    const transaction3Id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const transaction4Id = '11111111-2222-3333-4444-555555555555';
    const adminPasswordHash = await bcrypt.hash('adminpass123', 10);
    const superAdminPasswordHash = await bcrypt.hash('superadminpass123', 10);
    const user2PasswordHash = await bcrypt.hash('password456', 10);

    // Insert admin and super-admin users, and another test user
    await queryInterface.bulkInsert('Users', [
      {
        id: adminId,
        name: 'Admin User',
        email: 'admin@example.com',
        phoneNumber: '+1987654321',
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: superAdminId,
        name: 'Super Admin',
        email: 'superadmin@example.com',
        phoneNumber: '+1122334455',
        passwordHash: superAdminPasswordHash,
        role: 'super_admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: user2Id,
        name: 'Second User',
        email: 'user2@example.com',
        phoneNumber: '+1098765432',
        passwordHash: user2PasswordHash,
        role: 'user',
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // Insert more beneficiaries for user2
    await queryInterface.bulkInsert('Beneficiaries', [
      {
        id: beneficiary3Id,
        userId: user2Id,
        name: 'Charlie Beneficiary',
        email: 'charlie@example.com',
        phoneNumber: '+3333333333',
        bankName: 'Bank C',
        accountNumber: '333333333',
        accountType: 'savings',
        country: 'UK',
        address: '789 King St, London',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: beneficiary4Id,
        userId: user2Id,
        name: 'Dana Beneficiary',
        email: 'dana@example.com',
        phoneNumber: '+4444444444',
        bankName: 'Bank D',
        accountNumber: '444444444',
        accountType: 'checking',
        country: 'Australia',
        address: '101 Queen St, Sydney',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // Insert more transactions for user2
    await queryInterface.bulkInsert('Transactions', [
      {
        id: transaction3Id,
        userId: user2Id,
        type: 'send',
        amount: 500.00,
        currency: 'GBP',
        recipientId: null,
        senderId: user2Id,
        status: 'completed',
        description: 'User2 send transaction',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: transaction4Id,
        userId: user2Id,
        type: 'receive',
        amount: 750.00,
        currency: 'AUD',
        recipientId: user2Id,
        senderId: null,
        status: 'pending',
        description: 'User2 receive transaction',
        createdAt: now,
        updatedAt: now,
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transactions', {
      id: [
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
      ]
    });
    await queryInterface.bulkDelete('Beneficiaries', {
      id: [
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
      ]
    });
    await queryInterface.bulkDelete('Users', {
      id: '11111111-1111-1111-1111-111111111111'
    });
  }
};
