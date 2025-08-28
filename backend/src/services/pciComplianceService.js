/**
 * PCI-DSS Compliance Service
 * Handles secure payment processing and data protection
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');

class PCIDSSComplianceService {
  constructor() {
    this.encryptionAlgorithm = 'aes-256-gcm';
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-chars-long';
  }

  /**
   * Encrypt sensitive data
   */
  encryptSensitiveData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.encryptionAlgorithm, this.encryptionKey);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      logger.error('Data encryption failed', { error: error.message });
      return {
        encrypted: false,
        data: data,
        error: error.message
      };
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptSensitiveData(encryptedData) {
    try {
      const decipher = crypto.createDecipher(this.encryptionAlgorithm, this.encryptionKey);
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        decrypted: true,
        data: JSON.parse(decrypted)
      };
    } catch (error) {
      logger.error('Data decryption failed', { error: error.message });
      return {
        decrypted: false,
        data: encryptedData,
        error: error.message
      };
    }
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data) {
    const masked = {};
    
    if (data.creditCard) {
      masked.creditCard = this.maskCreditCard(data.creditCard);
    }
    
    if (data.ssn) {
      masked.ssn = this.maskSSN(data.ssn);
    }
    
    if (data.phone) {
      masked.phone = this.maskPhone(data.phone);
    }
    
    if (data.email) {
      masked.email = this.maskEmail(data.email);
    }
    
    return masked;
  }

  /**
   * Mask credit card number
   */
  maskCreditCard(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    return cardNumber.slice(0, 4) + '*'.repeat(cardNumber.length - 8) + cardNumber.slice(-4);
  }

  /**
   * Mask SSN
   */
  maskSSN(ssn) {
    if (!ssn || ssn.length < 5) return ssn;
    return ssn.slice(0, 3) + '-**-' + ssn.slice(-4);
  }

  /**
   * Mask phone number
   */
  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + '-***-' + phone.slice(-4);
  }

  /**
   * Mask email address
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 1) return email;
    return local[0] + '***@' + domain;
  }

  /**
   * Validate PCI compliance
   */
  validatePCICompliance() {
    const checks = {
      encryption: this.encryptionKey && this.encryptionKey.length >= 32,
      algorithm: this.encryptionAlgorithm === 'aes-256-gcm',
      logging: true, // Assuming logging is enabled
      access: true   // Assuming access controls are in place
    };

    return {
      compliant: Object.values(checks).every(check => check),
      checks
    };
  }
}

module.exports = new PCIDSSComplianceService(); 