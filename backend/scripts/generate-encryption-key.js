#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Generate a secure encryption key for PCI-DSS compliance
 * This script generates a 64-character (32-byte) hex string for AES-256 encryption
 */

function generateEncryptionKey() {
  try {
    // Generate 32 random bytes (256 bits)
    const keyBytes = crypto.randomBytes(32);
    
    // Convert to hex string (64 characters)
    const keyHex = keyBytes.toString('hex');
    
    console.log('🔐 Secure Encryption Key Generated');
    console.log('=====================================');
    console.log('');
    console.log('Key (64 characters):');
    console.log(keyHex);
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Copy the key above');
    console.log('2. Add it to your .env file as:');
    console.log(`   ENCRYPTION_MASTER_KEY=${keyHex}`);
    console.log('');
    console.log('⚠️  Security Notes:');
    console.log('- Keep this key secure and confidential');
    console.log('- Never commit it to version control');
    console.log('- Use different keys for different environments');
    console.log('- Rotate keys regularly for compliance');
    console.log('');
    console.log('🔒 PCI-DSS Compliance:');
    console.log('- This key meets AES-256 requirements');
    console.log('- Suitable for encrypting cardholder data');
    console.log('- Complies with PCI-DSS Requirement 3.4');
    console.log('');
    
    // Validate the key
    if (keyHex.length !== 64) {
      throw new Error('Generated key is not 64 characters long');
    }
    
    if (!/^[0-9a-f]{64}$/.test(keyHex)) {
      throw new Error('Generated key contains invalid characters');
    }
    
    console.log('✅ Key validation passed');
    console.log('');
    
    return keyHex;
    
  } catch (error) {
    console.error('❌ Error generating encryption key:', error.message);
    process.exit(1);
  }
}

/**
 * Generate additional security keys
 */
function generateAdditionalKeys() {
  console.log('🔑 Additional Security Keys');
  console.log('============================');
  console.log('');
  
  // JWT Secret (32 bytes)
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  console.log('JWT Secret:');
  console.log(jwtSecret);
  console.log('');
  
  // API Key (32 bytes)
  const apiKey = crypto.randomBytes(32).toString('hex');
  console.log('API Key:');
  console.log(apiKey);
  console.log('');
  
  // Session Secret (32 bytes)
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  console.log('Session Secret:');
  console.log(sessionSecret);
  console.log('');
  
  return { jwtSecret, apiKey, sessionSecret };
}

/**
 * Generate a complete .env template with secure keys
 */
function generateEnvTemplate() {
  const encryptionKey = generateEncryptionKey();
  const additionalKeys = generateAdditionalKeys();
  
  console.log('📄 Complete .env Template');
  console.log('==========================');
  console.log('');
  console.log('# Copy this to your .env file:');
  console.log('');
  console.log('# Database Configuration');
  console.log('DATABASE_URL=postgresql://pachedu_user:password@localhost:5432/pachedu_db');
  console.log('');
  console.log('# JWT Configuration');
  console.log(`JWT_SECRET=${additionalKeys.jwtSecret}`);
  console.log('');
  console.log('# Redis Configuration');
  console.log('REDIS_URL=redis://localhost:6379');
  console.log('');
  console.log('# Server Configuration');
  console.log('PORT=5001');
  console.log('NODE_ENV=development');
  console.log('');
  console.log('# Frontend URL');
  console.log('FRONTEND_URL=http://localhost:3000');
  console.log('');
  console.log('# CORS Configuration');
  console.log('ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001');
  console.log('');
  console.log('# SMS Configuration (SMSPortal)');
  console.log('SMSPORTAL_CLIENT_ID=your_smsportal_client_id');
  console.log('SMSPORTAL_CLIENT_SECRET=your_smsportal_client_secret');
  console.log('SMSPORTAL_API_KEY=your_smsportal_api_key');
  console.log('');
  console.log('# Payment Gateway Configuration');
  console.log('STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key');
  console.log('STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key');
  console.log('STITCH_CLIENT_ID=your_stitch_client_id');
  console.log('STITCH_CLIENT_SECRET=your_stitch_client_secret');
  console.log('');
  console.log('# Encryption Configuration (PCI-DSS Compliance)');
  console.log(`ENCRYPTION_MASTER_KEY=${encryptionKey}`);
  console.log('');
  console.log('# Security Configuration');
  console.log('MIN_PASSWORD_LENGTH=12');
  console.log('SESSION_TIMEOUT=86400');
  console.log('MAX_LOGIN_ATTEMPTS=5');
  console.log('ACCOUNT_LOCKOUT_DURATION=30');
  console.log('');
  console.log('# Audit Logging Configuration');
  console.log('AUDIT_LOG_LEVEL=info');
  console.log('AUDIT_LOG_RETENTION_DAYS=365');
  console.log('');
  console.log('# Rate Limiting Configuration');
  console.log('RATE_LIMIT_WINDOW_MS=900000');
  console.log('RATE_LIMIT_MAX_REQUESTS=100');
  console.log('PAYMENT_RATE_LIMIT_MAX_REQUESTS=10');
  console.log('');
  console.log('# Compliance Configuration');
  console.log('PCI_DSS_COMPLIANCE=true');
  console.log('GDPR_COMPLIANCE=true');
  console.log('SOX_COMPLIANCE=true');
  console.log('');
}

/**
 * Validate an existing encryption key
 */
function validateKey(key) {
  if (!key) {
    console.error('❌ No key provided for validation');
    return false;
  }
  
  if (key.length !== 64) {
    console.error('❌ Key must be exactly 64 characters long');
    return false;
  }
  
  if (!/^[0-9a-f]{64}$/.test(key)) {
    console.error('❌ Key must contain only hexadecimal characters (0-9, a-f)');
    return false;
  }
  
  console.log('✅ Key validation passed');
  return true;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate') && args[1]) {
    validateKey(args[1]);
  } else if (args.includes('--template')) {
    generateEnvTemplate();
  } else if (args.includes('--additional')) {
    generateAdditionalKeys();
  } else {
    generateEncryptionKey();
  }
}

module.exports = {
  generateEncryptionKey,
  generateAdditionalKeys,
  validateKey
}; 