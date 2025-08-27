/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Multi-Factor Authentication service with TOTP and SMS verification
 */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { logger } = require('../utils/logger');
const { getSequelize } = require('../utils/database');

/**
 * MFA Service Class
 * 
 * Provides comprehensive multi-factor authentication including:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - SMS-based verification codes
 * - QR code generation for authenticator apps
 * - Backup codes for account recovery
 * - Rate limiting for MFA attempts
 * - Comprehensive logging and monitoring
 */
class MFAService {
  constructor() {
    this.mfaAttempts = new Map();
    this.backupCodes = new Map();
  }

  /**
   * Generate TOTP secret for a user
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Object} TOTP configuration
   */
  generateTOTPSecret(userId, email) {
    try {
      const secret = speakeasy.generateSecret({
        name: `PacheduConnect (${email})`,
        issuer: 'PacheduConnect',
        length: 32
      });

      logger.info('TOTP secret generated', {
        userId: userId,
        email: email,
        secretLength: secret.base32.length
      });

      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        qrCode: null // Will be generated separately
      };
    } catch (error) {
      logger.error('Failed to generate TOTP secret', {
        userId: userId,
        error: error.message
      });
      throw new Error('Failed to generate TOTP secret');
    }
  }

  /**
   * Generate QR code for authenticator app setup
   * @param {string} otpauthUrl - OTP Auth URL
   * @returns {string} QR code data URL
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1
      });

      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Failed to generate QR code', {
        error: error.message
      });
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   * @param {string} token - TOTP token from authenticator app
   * @param {string} secret - User's TOTP secret
   * @param {string} userId - User ID for rate limiting
   * @returns {boolean} True if token is valid
   */
  verifyTOTPToken(token, secret, userId) {
    try {
      // Check rate limiting
      if (this.isRateLimited(userId, 'totp')) {
        logger.warn('TOTP rate limit exceeded', {
          userId: userId,
          token: token
        });
        throw new Error('Too many TOTP attempts');
      }

      // Verify token with 2-minute window (4 tokens: current, previous, next, next+1)
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2,
        step: 30
      });

      if (verified) {
        logger.info('TOTP token verified successfully', {
          userId: userId,
          token: token
        });
        
        // Reset rate limiting on successful verification
        this.resetRateLimit(userId, 'totp');
        return true;
      } else {
        // Increment failed attempts
        this.incrementFailedAttempts(userId, 'totp');
        
        logger.warn('TOTP token verification failed', {
          userId: userId,
          token: token
        });
        return false;
      }
    } catch (error) {
      logger.error('TOTP verification error', {
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate SMS verification code
   * @param {string} userId - User ID
   * @param {string} phoneNumber - User's phone number
   * @returns {string} Generated verification code
   */
  generateSMSCode(userId, phoneNumber) {
    try {
      // Check rate limiting
      if (this.isRateLimited(userId, 'sms')) {
        logger.warn('SMS rate limit exceeded', {
          userId: userId,
          phoneNumber: phoneNumber
        });
        throw new Error('Too many SMS code requests');
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code with expiration (10 minutes)
      const expiration = Date.now() + (10 * 60 * 1000);
      this.smsCodes.set(`${userId}-${phoneNumber}`, {
        code: code,
        expiration: expiration,
        attempts: 0
      });

      logger.info('SMS verification code generated', {
        userId: userId,
        phoneNumber: phoneNumber,
        codeLength: code.length,
        expiresAt: new Date(expiration).toISOString()
      });

      return code;
    } catch (error) {
      logger.error('Failed to generate SMS code', {
        userId: userId,
        phoneNumber: phoneNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify SMS code
   * @param {string} code - SMS verification code
   * @param {string} userId - User ID
   * @param {string} phoneNumber - User's phone number
   * @returns {boolean} True if code is valid
   */
  verifySMSCode(code, userId, phoneNumber) {
    try {
      const key = `${userId}-${phoneNumber}`;
      const storedData = this.smsCodes.get(key);

      if (!storedData) {
        logger.warn('SMS code not found', {
          userId: userId,
          phoneNumber: phoneNumber
        });
        return false;
      }

      // Check if code is expired
      if (Date.now() > storedData.expiration) {
        logger.warn('SMS code expired', {
          userId: userId,
          phoneNumber: phoneNumber
        });
        this.smsCodes.delete(key);
        return false;
      }

      // Check if too many attempts
      if (storedData.attempts >= 3) {
        logger.warn('Too many SMS code attempts', {
          userId: userId,
          phoneNumber: phoneNumber,
          attempts: storedData.attempts
        });
        this.smsCodes.delete(key);
        return false;
      }

      // Increment attempts
      storedData.attempts++;

      if (storedData.code === code) {
        logger.info('SMS code verified successfully', {
          userId: userId,
          phoneNumber: phoneNumber
        });
        
        // Remove code after successful verification
        this.smsCodes.delete(key);
        return true;
      } else {
        logger.warn('SMS code verification failed', {
          userId: userId,
          phoneNumber: phoneNumber,
          attempts: storedData.attempts
        });
        return false;
      }
    } catch (error) {
      logger.error('SMS verification error', {
        userId: userId,
        phoneNumber: phoneNumber,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   * @param {string} userId - User ID
   * @returns {Array} Array of backup codes
   */
  generateBackupCodes(userId) {
    try {
      const codes = [];
      for (let i = 0; i < 10; i++) {
        // Generate 8-character alphanumeric codes
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
      }

      // Store hashed backup codes
      this.backupCodes.set(userId, {
        codes: codes.map(code => this.hashCode(code)),
        used: new Set(),
        createdAt: Date.now()
      });

      logger.info('Backup codes generated', {
        userId: userId,
        codeCount: codes.length
      });

      return codes;
    } catch (error) {
      logger.error('Failed to generate backup codes', {
        userId: userId,
        error: error.message
      });
      throw new Error('Failed to generate backup codes');
    }
  }

  /**
   * Verify backup code
   * @param {string} code - Backup code to verify
   * @param {string} userId - User ID
   * @returns {boolean} True if code is valid and unused
   */
  verifyBackupCode(code, userId) {
    try {
      const userBackupCodes = this.backupCodes.get(userId);
      
      if (!userBackupCodes) {
        logger.warn('No backup codes found for user', {
          userId: userId
        });
        return false;
      }

      const hashedCode = this.hashCode(code);
      const codeIndex = userBackupCodes.codes.indexOf(hashedCode);

      if (codeIndex === -1) {
        logger.warn('Invalid backup code', {
          userId: userId
        });
        return false;
      }

      if (userBackupCodes.used.has(codeIndex)) {
        logger.warn('Backup code already used', {
          userId: userId,
          codeIndex: codeIndex
        });
        return false;
      }

      // Mark code as used
      userBackupCodes.used.add(codeIndex);

      logger.info('Backup code verified successfully', {
        userId: userId,
        codeIndex: codeIndex
      });

      return true;
    } catch (error) {
      logger.error('Backup code verification error', {
        userId: userId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check if MFA is required for transaction
   * @param {number} amount - Transaction amount
   * @param {string} currency - Transaction currency
   * @param {Object} user - User object
   * @returns {boolean} True if MFA is required
   */
  isMFARequired(amount, currency, user) {
    // MFA required for transactions over $1000 USD equivalent
    const mfaThreshold = 1000;
    
    // Convert amount to USD for comparison
    let usdAmount = amount;
    if (currency !== 'USD') {
      // In production, use real-time exchange rates
      const exchangeRates = {
        'ZAR': 0.055, // 1 ZAR = 0.055 USD (approximate)
        'EUR': 1.08,
        'GBP': 1.26,
        'MWK': 0.001,
        'MZN': 0.016
      };
      usdAmount = amount * (exchangeRates[currency] || 1);
    }

    // MFA required for high-value transactions
    if (usdAmount >= mfaThreshold) {
      return true;
    }

    // MFA required for new users (first 30 days)
    const userAge = Date.now() - new Date(user.createdAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (userAge < thirtyDays) {
      return true;
    }

    // MFA required for suspicious activity (to be implemented)
    // This would integrate with fraud detection system

    return false;
  }

  /**
   * Rate limiting for MFA attempts
   * @param {string} userId - User ID
   * @param {string} type - MFA type ('totp', 'sms')
   * @returns {boolean} True if rate limited
   */
  isRateLimited(userId, type) {
    const key = `${userId}-${type}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = type === 'totp' ? 5 : 3;

    if (!this.mfaAttempts.has(key)) {
      return false;
    }

    const attempts = this.mfaAttempts.get(key);
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

    return recentAttempts.length >= maxAttempts;
  }

  /**
   * Increment failed MFA attempts
   * @param {string} userId - User ID
   * @param {string} type - MFA type
   */
  incrementFailedAttempts(userId, type) {
    const key = `${userId}-${type}`;
    const now = Date.now();

    if (!this.mfaAttempts.has(key)) {
      this.mfaAttempts.set(key, []);
    }

    this.mfaAttempts.get(key).push(now);
  }

  /**
   * Reset rate limiting for successful verification
   * @param {string} userId - User ID
   * @param {string} type - MFA type
   */
  resetRateLimit(userId, type) {
    const key = `${userId}-${type}`;
    this.mfaAttempts.delete(key);
  }

  /**
   * Hash backup code for secure storage
   * @param {string} code - Backup code
   * @returns {string} Hashed code
   */
  hashCode(code) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Clean up expired data
   */
  cleanup() {
    const now = Date.now();
    
    // Clean up expired SMS codes
    for (const [key, data] of this.smsCodes.entries()) {
      if (now > data.expiration) {
        this.smsCodes.delete(key);
      }
    }

    // Clean up old MFA attempts (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    for (const [key, attempts] of this.mfaAttempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => now - timestamp < oneHour);
      if (recentAttempts.length === 0) {
        this.mfaAttempts.delete(key);
      } else {
        this.mfaAttempts.set(key, recentAttempts);
      }
    }

    // Clean up old backup codes (older than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    for (const [userId, data] of this.backupCodes.entries()) {
      if (now - data.createdAt > oneYear) {
        this.backupCodes.delete(userId);
      }
    }
  }

  /**
   * Get MFA statistics
   * @returns {Object} MFA statistics
   */
  getStats() {
    return {
      activeSmsCodes: this.smsCodes.size,
      activeMfaAttempts: this.mfaAttempts.size,
      activeBackupCodes: this.backupCodes.size
    };
  }
}

// Initialize SMS codes storage
MFAService.prototype.smsCodes = new Map();

// Export singleton instance
module.exports = new MFAService(); 