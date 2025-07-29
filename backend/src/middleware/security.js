/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: security - handles backend functionality
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');
const encryptionService = require('../utils/encryption');

/**
 * Middleware to encrypt sensitive data in request body
 */
const encryptSensitiveData = (req, res, next) => {
  try {
    // Check if request contains sensitive data
    const sensitiveFields = ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear', 'accountNumber', 'routingNumber'];
    const hasSensitiveData = sensitiveFields.some(field => req.body[field]);
    
    if (hasSensitiveData) {
      // Log data access attempt
      auditLogger.logDataAccess(
        auditLogger.eventTypes.CARD_DATA_ENCRYPTED,
        'payment_card',
        req.user?.id || 'anonymous',
        req.ip
      );
      
      // Encrypt sensitive fields
      const encryptedData = { ...req.body };
      
      if (req.body.cardNumber || req.body.cvv || req.body.expiryMonth || req.body.expiryYear) {
        const cardData = {
          cardNumber: req.body.cardNumber,
          cvv: req.body.cvv,
          expiryMonth: req.body.expiryMonth,
          expiryYear: req.body.expiryYear
        };
        
        const encryptedCardData = encryptionService.encryptCardData(cardData);
        Object.assign(encryptedData, encryptedCardData);
      }
      
      if (req.body.accountNumber || req.body.routingNumber) {
        const bankData = {
          accountNumber: req.body.accountNumber,
          routingNumber: req.body.routingNumber,
          accountType: req.body.accountType
        };
        
        const encryptedBankData = encryptionService.encryptBankData(bankData);
        Object.assign(encryptedData, encryptedBankData);
      }
      
      req.body = encryptedData;
      
      logger.info('Sensitive data encrypted', {
        userId: req.user?.id,
        ip: req.ip,
        endpoint: req.path
      });
    }
    
    next();
  } catch (error) {
    logger.error('Data encryption failed', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip
    });
    
    auditLogger.logSecurityAlert(
      'encryption_failure',
      { error: error.message, endpoint: req.path },
      'error',
      req.user,
      req.ip
    );
    
    res.status(500).json({ message: 'Data encryption failed' });
  }
};

/**
 * Middleware to decrypt sensitive data in response
 */
const decryptSensitiveData = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      if (data && typeof data === 'object') {
        // Decrypt sensitive data if present
        if (data.paymentMethods) {
          data.paymentMethods = data.paymentMethods.map(method => {
            if (method.type === 'card') {
              return encryptionService.decryptCardData(method);
            } else if (method.type === 'bank') {
              return encryptionService.decryptBankData(method);
            }
            return method;
          });
        }
        
        // Log data access
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          auditLogger.logDataAccess(
            auditLogger.eventTypes.CARD_DATA_DECRYPTED,
            'payment_methods',
            req.user?.id,
            req.ip
          );
        }
      }
      
      originalSend.call(this, data);
    } catch (error) {
      logger.error('Data decryption failed', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });
      
      auditLogger.logSecurityAlert(
        'decryption_failure',
        { error: error.message, endpoint: req.path },
        'error',
        req.user,
        req.ip
      );
      
      originalSend.call(this, { message: 'Data decryption failed' });
    }
  };
  
  next();
};

/**
 * Middleware to add secure headers
 */
const secureHeaders = (req, res, next) => {
  // PCI-DSS compliant security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Middleware to validate payment data
 */
const validatePaymentData = (req, res, next) => {
  const { cardNumber, cvv, expiryMonth, expiryYear, accountNumber, routingNumber } = req.body;
  
  // Validate card data if present
  if (cardNumber || cvv || expiryMonth || expiryYear) {
    if (!cardNumber || !cvv || !expiryMonth || !expiryYear) {
      return res.status(400).json({ message: 'All card fields are required' });
    }
    
    // Validate card number format (Luhn algorithm)
    if (!isValidCardNumber(cardNumber)) {
      auditLogger.logSecurityAlert(
        'invalid_card_number',
        { cardNumber: cardNumber?.substring(0, 4) + '****' },
        'warning',
        req.user,
        req.ip
      );
      return res.status(400).json({ message: 'Invalid card number' });
    }
    
    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: 'Invalid CVV' });
    }
    
    // Validate expiry date
    const currentDate = new Date();
    const expiryDate = new Date(expiryYear, expiryMonth - 1);
    if (expiryDate <= currentDate) {
      return res.status(400).json({ message: 'Card has expired' });
    }
  }
  
  // Validate bank account data if present
  if (accountNumber || routingNumber) {
    if (!accountNumber || !routingNumber) {
      return res.status(400).json({ message: 'Both account number and routing number are required' });
    }
    
    // Validate routing number (US format)
    if (!/^\d{9}$/.test(routingNumber)) {
      return res.status(400).json({ message: 'Invalid routing number' });
    }
  }
  
  next();
};

/**
 * Middleware to rate limit payment operations
 */
const paymentRateLimit = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const key = `payment_limit:${userId}`;
  
  // This would integrate with Redis for proper rate limiting
  // For now, we'll just log the attempt
  logger.info('Payment rate limit check', {
    userId,
    ip: req.ip,
    endpoint: req.path
  });
  
  next();
};

/**
 * Middleware to log payment operations
 */
const logPaymentOperations = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Log payment operations
      if (req.path.includes('/payments/process')) {
        auditLogger.logPaymentOperation(
          auditLogger.eventTypes.PAYMENT_INITIATED,
          {
            amount: req.body.amount,
            currency: req.body.currency,
            gateway: req.params.gateway,
            recipientEmail: req.body.recipientEmail
          },
          req.user,
          req.ip
        );
      }
      
      if (responseData.payment && responseData.payment.status === 'completed') {
        auditLogger.logPaymentOperation(
          auditLogger.eventTypes.PAYMENT_COMPLETED,
          {
            paymentId: responseData.payment.id,
            amount: responseData.payment.amount,
            gateway: responseData.payment.gateway
          },
          req.user,
          req.ip
        );
      }
      
      originalSend.call(this, data);
    } catch (error) {
      logger.error('Payment logging failed', { error: error.message });
      originalSend.call(this, data);
    }
  };
  
  next();
};

/**
 * Middleware to prevent data leakage
 */
const preventDataLeakage = (req, res, next) => {
  // Remove sensitive data from error responses
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      if (data && typeof data === 'object') {
        // Remove sensitive fields from error responses
        const sanitizedData = { ...data };
        const sensitiveFields = ['cardNumber', 'cvv', 'accountNumber', 'routingNumber', 'password', 'token'];
        
        sensitiveFields.forEach(field => {
          if (sanitizedData[field]) {
            sanitizedData[field] = '[REDACTED]';
          }
        });
        
        originalSend.call(this, sanitizedData);
      } else {
        originalSend.call(this, data);
      }
    } catch (error) {
      originalSend.call(this, data);
    }
  };
  
  next();
};

/**
 * Middleware to validate session security
 */
const validateSessionSecurity = (req, res, next) => {
  // Check for secure session
  if (req.user && !req.headers['x-session-validated']) {
    // Log potential session security issue
    auditLogger.logSecurityAlert(
      'session_validation_missing',
      { userId: req.user.id, endpoint: req.path },
      'warning',
      req.user,
      req.ip
    );
  }
  
  next();
};

/**
 * Luhn algorithm for card number validation
 */
function isValidCardNumber(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Middleware to enforce HTTPS in production
 */
const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.status(403).json({ message: 'HTTPS required' });
    }
  }
  
  next();
};

/**
 * Middleware to validate request origin
 */
const validateOrigin = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = req.get('origin');
  
  if (origin && !allowedOrigins.includes(origin)) {
    auditLogger.logSecurityAlert(
      'invalid_origin',
      { origin, allowedOrigins },
      'warning',
      req.user,
      req.ip
    );
    return res.status(403).json({ message: 'Invalid origin' });
  }
  
  next();
};

module.exports = {
  encryptSensitiveData,
  decryptSensitiveData,
  secureHeaders,
  validatePaymentData,
  paymentRateLimit,
  logPaymentOperations,
  preventDataLeakage,
  validateSessionSecurity,
  enforceHTTPS,
  validateOrigin
}; 