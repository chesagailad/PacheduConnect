#!/usr/bin/env node

/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: ensure-bronze-kyc - handles backend functionality
 */

/**
 * Script to ensure all users have Bronze level KYC records
 * Run this script to fix any users who don't have KYC records
 */

require('dotenv').config();
const { ensureKYCForAllUsers, validateKYCRecords } = require('../src/utils/ensureKYCForAllUsers');

async function main() {
  try {
    console.log('🔧 Ensuring all users have Bronze level KYC records...\n');
    
    // First validate current state
    console.log('📊 Current KYC status:');
    await validateKYCRecords();
    
    // Ensure all users have KYC records
    console.log('\n🔧 Creating missing KYC records...');
    await ensureKYCForAllUsers();
    
    // Final validation
    console.log('\n✅ Final validation:');
    await validateKYCRecords();
    
    console.log('\n🎉 All users now have Bronze level KYC records!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main(); 