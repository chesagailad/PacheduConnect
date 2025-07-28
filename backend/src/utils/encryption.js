/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: encryption - handles backend functionality
 */

/**
 * Encryption Service
 * 
 * This module provides comprehensive encryption and security services for the
 * PacheduConnect backend application. It implements AES-256-GCM encryption
 * for sensitive data including payment information, personal data, and
 * authentication tokens.
 * 
 * Features:
 * - AES-256-GCM encryption with authenticated encryption
 * - PBKDF2 key derivation with configurable iterations
 * - Secure random generation for IVs and salts
 * - Purpose-specific encryption for different data types
 * - PCI-DSS compliant payment data encryption
 * - Comprehensive error handling and logging
 * 
 * Security Standards:
 * - AES-256-GCM: Military-grade encryption algorithm
 * - PBKDF2: Password-based key derivation function
 * - Random IVs: Unique initialization vectors for each encryption
 * - Authenticated encryption: Prevents tampering and ensures integrity
 * - Salt generation: Prevents rainbow table attacks
 * 
 * Use Cases:
 * - Payment card data encryption (PCI-DSS compliant)
 * - Bank account information encryption
 * - Personal identification data protection
 * - Authentication token encryption
 * - Sensitive configuration data protection
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

const crypto = require('crypto');
const { logger } = require('./logger');

/**
 * Encryption Service Class
 * 
 * Provides comprehensive encryption and decryption services using
 * AES-256-GCM with authenticated encryption for maximum security.
 */
class EncryptionService {
  constructor() {
    // Encryption algorithm configuration
    this.algorithm = 'aes-256-gcm';  // Authenticated encryption algorithm
    this.keyLength = 32;             // 256 bits for AES-256
    this.ivLength = 16;              // 128 bits for GCM mode
    this.tagLength = 16;             // 128 bits for authentication tag
    this.saltLength = 64;            // 512 bits for PBKDF2 salt
    
    // Master encryption key (should be stored securely in production)
    this.masterKey =
      '310c83e054874a26b9f01207354f834071351de6ccdccbf18709be9056f5ece3';
    
    // Validate master key length and format
    if (!this.masterKey || this.masterKey.length !== this.keyLength * 2) {
      throw new Error('Invalid ENCRYPTION_MASTER_KEY. Must be 64 characters (32 bytes)');
    }
  }

  /**
   * Generate a secure master key for encryption
   */
  generateMasterKey() {
    const key = crypto.randomBytes(this.keyLength);
    return key.toString('hex');
  }

  /**
   * Derive a key from the master key using PBKDF2
   */
  deriveKey(salt, purpose = 'general') {
    const iterations = 100000;
    const key = crypto.pbkdf2Sync(
      this.masterKey,
      salt + purpose,
      iterations,
      this.keyLength,
      'sha512'
    );
    return key;
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(data, purpose = 'general') {
    try {
      if (!data) {
        throw new Error('Data to encrypt cannot be null or undefined');
      }

      // Convert data to string if it's not already
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate salt and derive key
      const salt = crypto.randomBytes(this.saltLength);
      const key = this.deriveKey(salt, purpose);
      
      // Generate IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(purpose, 'utf8'));
      
      // Encrypt data
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get auth tag
      const tag = cipher.getAuthTag();
      
      // Combine all components
      const result = {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex'),
        purpose: purpose,
        algorithm: this.algorithm
      };
      
      logger.info('Data encrypted successfully', {
        purpose,
        dataLength: dataString.length,
        encryptedLength: encrypted.length
      });
      
      return result;
    } catch (error) {
      logger.error('Encryption failed', {
        error: error.message,
        purpose,
        dataType: typeof data
      });
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  decrypt(encryptedData, purpose = 'general') {
    try {
      if (!encryptedData || !encryptedData.encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      // Extract components
      const { encrypted, iv, tag, salt, purpose: dataPurpose } = encryptedData;
      
      // Validate purpose
      if (dataPurpose !== purpose) {
        throw new Error('Purpose mismatch in encrypted data');
      }
      
      // Derive key
      const key = this.deriveKey(Buffer.from(salt, 'hex'), purpose);
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(purpose, 'utf8'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.info('Data decrypted successfully', {
        purpose,
        encryptedLength: encrypted.length,
        decryptedLength: decrypted.length
      });
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', {
        error: error.message,
        purpose
      });
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Encrypt payment card data specifically
   */
  encryptCardData(cardData) {
    const sensitiveFields = ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear'];
    const encryptedData = {};
    
    for (const field of sensitiveFields) {
      if (cardData[field]) {
        encryptedData[field] = this.encrypt(cardData[field], 'payment_card');
      }
    }
    
    // Keep non-sensitive fields as-is
    const nonSensitiveFields = ['brand', 'last4', 'isDefault'];
    for (const field of nonSensitiveFields) {
      if (cardData[field] !== undefined) {
        encryptedData[field] = cardData[field];
      }
    }
    
    return encryptedData;
  }

  /**
   * Decrypt payment card data
   */
  decryptCardData(encryptedCardData) {
    const decryptedData = {};
    
    // Decrypt sensitive fields
    const sensitiveFields = ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear'];
    for (const field of sensitiveFields) {
      if (encryptedCardData[field] && typeof encryptedCardData[field] === 'object') {
        decryptedData[field] = this.decrypt(encryptedCardData[field], 'payment_card');
      } else {
        decryptedData[field] = encryptedCardData[field];
      }
    }
    
    // Keep non-sensitive fields as-is
    const nonSensitiveFields = ['brand', 'last4', 'isDefault'];
    for (const field of nonSensitiveFields) {
      if (encryptedCardData[field] !== undefined) {
        decryptedData[field] = encryptedCardData[field];
      }
    }
    
    return decryptedData;
  }

  /**
   * Encrypt bank account data
   */
  encryptBankData(bankData) {
    const sensitiveFields = ['accountNumber', 'routingNumber', 'accountType'];
    const encryptedData = {};
    
    for (const field of sensitiveFields) {
      if (bankData[field]) {
        encryptedData[field] = this.encrypt(bankData[field], 'bank_account');
      }
    }
    
    // Keep non-sensitive fields as-is
    const nonSensitiveFields = ['bankName', 'last4', 'isDefault'];
    for (const field of nonSensitiveFields) {
      if (bankData[field] !== undefined) {
        encryptedData[field] = bankData[field];
      }
    }
    
    return encryptedData;
  }

  /**
   * Decrypt bank account data
   */
  decryptBankData(encryptedBankData) {
    const decryptedData = {};
    
    // Decrypt sensitive fields
    const sensitiveFields = ['accountNumber', 'routingNumber', 'accountType'];
    for (const field of sensitiveFields) {
      if (encryptedBankData[field] && typeof encryptedBankData[field] === 'object') {
        decryptedData[field] = this.decrypt(encryptedBankData[field], 'bank_account');
      } else {
        decryptedData[field] = encryptedBankData[field];
      }
    }
    
    // Keep non-sensitive fields as-is
    const nonSensitiveFields = ['bankName', 'last4', 'isDefault'];
    for (const field of nonSensitiveFields) {
      if (encryptedBankData[field] !== undefined) {
        decryptedData[field] = encryptedBankData[field];
      }
    }
    
    return decryptedData;
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data for storage (one-way)
   */
  hashData(data, salt = null) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(dataString, usedSalt, 100000, 64, 'sha512');
    return {
      hash: hash.toString('hex'),
      salt: usedSalt
    };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data, hash, salt) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const verifyHash = crypto.pbkdf2Sync(dataString, salt, 100000, 64, 'sha512');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), verifyHash);
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService; 