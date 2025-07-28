/**
 * Fraud Prevention Middleware
 * 
 * This middleware integrates fraud detection into the request pipeline,
 * automatically screening transactions and user activities for suspicious behavior.
 * 
 * Features:
 * - Real-time transaction screening
 * - User behavior monitoring
 * - Device fingerprinting
 * - Rate limiting and velocity checks
 * - Automatic blocking of high-risk activities
 * 
 * @author PacheduConnect Security Team
 * @version 1.0.0
 */

const { detectFraud } = require('../services/fraudDetection');
const { logger } = require('../utils/logger');
const { redis } = require('../utils/redis');

/**
 * Fraud Prevention Configuration
 */
const FRAUD_MIDDLEWARE_CONFIG = {
  // Endpoints that require fraud screening
  SCREENED_ENDPOINTS: [
    '/api/transactions/create',
    '/api/payments/process',
    '/api/beneficiaries/add',
    '/api/kyc/upload'
  ],
  
  // Rate limiting for fraud screening
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // max 100 requests per window
  },
  
  // Device fingerprinting headers
  FINGERPRINT_HEADERS: [
    'user-agent',
    'x-forwarded-for',
    'x-real-ip',
    'accept-language',
    'accept-encoding'
  ]
};

/**
 * Extract Device Fingerprint from Request
 * 
 * Creates a device fingerprint from request headers and metadata
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Device fingerprint data
 */
function extractDeviceFingerprint(req) {
  const fingerprint = {
    userAgent: req.headers['user-agent'] || '',
    ip: req.headers['x-forwarded-for'] || 
        req.headers['x-real-ip'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress,
    language: req.headers['accept-language'] || '',
    encoding: req.headers['accept-encoding'] || '',
    timestamp: new Date().toISOString(),
    sessionId: req.session?.id || null
  };
  
  // Add additional fingerprinting data if available
  if (req.headers['x-device-id']) {
    fingerprint.deviceId = req.headers['x-device-id'];
  }
  
  if (req.headers['x-screen-resolution']) {
    fingerprint.screenResolution = req.headers['x-screen-resolution'];
  }
  
  return fingerprint;
}

/**
 * Extract User Data from Request
 * 
 * Extracts user information for fraud analysis
 * 
 * @param {Object} req - Express request object
 * @returns {Object} User data
 */
function extractUserData(req) {
  return {
    userId: req.user?.id || req.body?.userId,
    email: req.user?.email || req.body?.email,
    phone: req.user?.phone || req.body?.phone,
    location: req.body?.location || null,
    kycVerified: req.user?.kycStatus === 'VERIFIED',
    accountAge: req.user?.createdAt ? 
      (Date.now() - new Date(req.user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : null
  };
}

/**
 * Extract Transaction Data from Request
 * 
 * Extracts transaction information for fraud analysis
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Transaction data
 */
function extractTransactionData(req) {
  const transactionData = {
    transactionId: req.body?.transactionId || generateTransactionId(),
    userId: req.user?.id || req.body?.userId,
    amount: req.body?.amount || 0,
    currency: req.body?.currency || 'ZAR',
    recipientCountry: req.body?.recipientCountry || null,
    recipientEmail: req.body?.recipientEmail || null,
    paymentMethod: req.body?.paymentMethod || null,
    timestamp: new Date().toISOString()
  };
  
  // Add additional transaction metadata
  if (req.body?.description) {
    transactionData.description = req.body.description;
  }
  
  if (req.body?.beneficiaryId) {
    transactionData.beneficiaryId = req.body.beneficiaryId;
  }
  
  return transactionData;
}

/**
 * Generate Transaction ID
 * 
 * Creates a unique transaction identifier
 * 
 * @returns {string} Transaction ID
 */
function generateTransactionId() {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if Endpoint Requires Fraud Screening
 * 
 * Determines if the current endpoint should be screened for fraud
 * 
 * @param {string} path - Request path
 * @returns {boolean} True if screening required
 */
function requiresFraudScreening(path) {
  return FRAUD_MIDDLEWARE_CONFIG.SCREENED_ENDPOINTS.some(endpoint => 
    path.includes(endpoint)
  );
}

/**
 * Log Fraud Detection Event
 * 
 * Records fraud detection activities for audit and analysis
 * 
 * @param {Object} detectionResult - Fraud detection result
 * @param {Object} req - Express request object
 */
async function logFraudEvent(detectionResult, req) {
  try {
    const logEntry = {
      ...detectionResult,
      requestPath: req.path,
      requestMethod: req.method,
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };
    
    // Store in Redis for real-time monitoring
    await redis.lpush('fraud_events', JSON.stringify(logEntry));
    await redis.ltrim('fraud_events', 0, 999); // Keep last 1000 events
    
    // Log to application logs
    logger.info('Fraud detection event:', logEntry);
    
  } catch (error) {
    logger.error('Error logging fraud event:', error);
  }
}

/**
 * Main Fraud Prevention Middleware
 * 
 * Middleware function that screens requests for fraud
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function fraudPreventionMiddleware(req, res, next) {
  try {
    // Skip fraud screening for non-screened endpoints
    if (!requiresFraudScreening(req.path)) {
      return next();
    }
    
    // Skip if user is not authenticated (except for specific endpoints)
    if (!req.user && !req.path.includes('/auth')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for fraud screening'
      });
    }
    
    logger.info('Starting fraud screening for request:', {
      path: req.path,
      userId: req.user?.id,
      method: req.method
    });
    
    // Extract data for fraud analysis
    const deviceData = extractDeviceFingerprint(req);
    const userData = extractUserData(req);
    const transactionData = extractTransactionData(req);
    
    // Perform fraud detection
    const fraudResult = await detectFraud(transactionData, userData, deviceData);
    
    // Log the fraud detection event
    await logFraudEvent(fraudResult, req);
    
    // Handle different risk levels
    switch (fraudResult.action) {
      case 'BLOCK':
        logger.warn('Transaction blocked due to fraud risk:', {
          userId: transactionData.userId,
          riskScore: fraudResult.riskScore,
          riskFactors: fraudResult.riskFactors
        });
        
        return res.status(403).json({
          success: false,
          message: 'Transaction blocked due to security concerns',
          code: 'FRAUD_DETECTED',
          riskLevel: fraudResult.riskLevel,
          requiresReview: fraudResult.requiresReview
        });
        
      case 'REVIEW':
        logger.info('Transaction flagged for review:', {
          userId: transactionData.userId,
          riskScore: fraudResult.riskScore,
          riskFactors: fraudResult.riskFactors
        });
        
        // Add fraud data to request for manual review
        req.fraudData = fraudResult;
        
        // Continue with request but flag for review
        return next();
        
      case 'APPROVE':
        logger.info('Transaction approved by fraud detection:', {
          userId: transactionData.userId,
          riskScore: fraudResult.riskScore
        });
        
        // Add fraud data to request for logging
        req.fraudData = fraudResult;
        
        return next();
        
      default:
        logger.error('Unknown fraud action:', fraudResult.action);
        return res.status(500).json({
          success: false,
          message: 'Error in fraud detection system'
        });
    }
    
  } catch (error) {
    logger.error('Error in fraud prevention middleware:', error);
    
    // On error, block the request for security
    return res.status(500).json({
      success: false,
      message: 'Security system error - transaction blocked',
      code: 'FRAUD_SYSTEM_ERROR'
    });
  }
}

/**
 * Fraud Monitoring Middleware
 * 
 * Middleware for monitoring and logging fraud-related activities
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function fraudMonitoringMiddleware(req, res, next) {
  // Add fraud monitoring headers
  res.setHeader('X-Fraud-Screened', 'true');
  
  // Monitor response for additional fraud indicators
  const originalSend = res.send;
  res.send = function(data) {
    // Log suspicious response patterns
    if (typeof data === 'string' && data.includes('error')) {
      logger.warn('Suspicious response pattern detected:', {
        path: req.path,
        userId: req.user?.id,
        response: data.substring(0, 200)
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Fraud Analytics Middleware
 * 
 * Middleware for collecting fraud analytics data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function fraudAnalyticsMiddleware(req, res, next) {
  try {
    // Collect analytics data
    const analyticsData = {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      fraudData: req.fraudData || null
    };
    
    // Store analytics data
    await redis.lpush('fraud_analytics', JSON.stringify(analyticsData));
    await redis.ltrim('fraud_analytics', 0, 9999); // Keep last 10,000 records
    
  } catch (error) {
    logger.error('Error in fraud analytics middleware:', error);
  }
  
  next();
}

/**
 * Fraud Rate Limiting Middleware
 * 
 * Implements rate limiting specifically for fraud prevention
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function fraudRateLimitMiddleware(req, res, next) {
  try {
    const key = `fraud_rate_limit:${req.user?.id || req.ip}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, FRAUD_MIDDLEWARE_CONFIG.RATE_LIMIT.windowMs / 1000);
    }
    
    if (current > FRAUD_MIDDLEWARE_CONFIG.RATE_LIMIT.max) {
      logger.warn('Fraud rate limit exceeded:', {
        userId: req.user?.id,
        ip: req.ip,
        count: current
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests - please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    next();
    
  } catch (error) {
    logger.error('Error in fraud rate limit middleware:', error);
    next(); // Continue on error
  }
}

module.exports = {
  fraudPreventionMiddleware,
  fraudMonitoringMiddleware,
  fraudAnalyticsMiddleware,
  fraudRateLimitMiddleware,
  FRAUD_MIDDLEWARE_CONFIG
}; 