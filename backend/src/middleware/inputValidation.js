/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Comprehensive input validation middleware with security enhancements
 */

const Joi = require('joi');
const { logger } = require('../utils/logger');
const xss = require('xss');

/**
 * Input Validation Middleware
 * 
 * Provides comprehensive input validation and sanitization to prevent:
 * - SQL injection attacks
 * - XSS (Cross-Site Scripting) attacks
 * - NoSQL injection attacks
 * - Command injection attacks
 * - Path traversal attacks
 * - Buffer overflow attempts
 */

/**
 * Sanitize input data to prevent XSS attacks
 * @param {*} data - Data to sanitize
 * @returns {*} Sanitized data
 */
function sanitizeData(data) {
  if (typeof data === 'string') {
    return xss(data, {
      whiteList: {}, // No HTML allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
    });
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Validate and sanitize request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      // Validate request body
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        logger.warn('Request body validation failed', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          errors: validationErrors
        });

        return res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validationErrors
        });
      }

      // Sanitize validated data
      req.body = sanitizeData(value);
      next();
    } catch (error) {
      logger.error('Input validation error', {
        path: req.path,
        method: req.method,
        error: error.message
      });
      
      return res.status(500).json({
        message: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Validate and sanitize request query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        logger.warn('Request query validation failed', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          errors: validationErrors
        });

        return res.status(400).json({
          message: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          errors: validationErrors
        });
      }

      req.query = sanitizeData(value);
      next();
    } catch (error) {
      logger.error('Query validation error', {
        path: req.path,
        method: req.method,
        error: error.message
      });
      
      return res.status(500).json({
        message: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Validate and sanitize request parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateParams(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        logger.warn('Request params validation failed', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          errors: validationErrors
        });

        return res.status(400).json({
          message: 'Parameter validation failed',
          code: 'PARAM_VALIDATION_ERROR',
          errors: validationErrors
        });
      }

      req.params = sanitizeData(value);
      next();
    } catch (error) {
      logger.error('Parameter validation error', {
        path: req.path,
        method: req.method,
        error: error.message
      });
      
      return res.status(500).json({
        message: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Common validation schemas for reuse
 */
const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Email validation
  email: Joi.string().email().max(255).required(),
  
  // Password validation (strong password requirements)
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters'
    }),
  
  // Phone number validation
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in international format (e.g., +1234567890)'
    }),
  
  // Amount validation (positive decimal)
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(999999.99)
    .required(),
  
  // Currency code validation
  currency: Joi.string()
    .length(3)
    .uppercase()
    .valid('USD', 'EUR', 'GBP', 'ZAR', 'MWK', 'MZN')
    .required(),
  
  // Transaction ID validation
  transactionId: Joi.string()
    .pattern(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)
    .required(),
  
  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'amount', 'status').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().max('now'),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).max('now')
  }),
  
  // File upload validation
  fileUpload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/jpg', 'application/pdf').required(),
    size: Joi.number().max(5 * 1024 * 1024).required() // 5MB max
  })
};

/**
 * Specific validation schemas for different endpoints
 */
const endpointSchemas = {
  // User registration
  userRegistration: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: commonSchemas.email,
    phoneNumber: commonSchemas.phoneNumber,
    password: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    acceptTerms: Joi.boolean().valid(true).required()
  }),
  
  // User login
  userLogin: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  }),
  
  // Transaction creation
  transactionCreate: Joi.object({
    amount: commonSchemas.amount,
    currency: commonSchemas.currency,
    recipientId: commonSchemas.uuid,
    description: Joi.string().max(500).optional(),
    deliveryMethod: Joi.string().valid('ecocash', 'bank', 'cash', 'home').required(),
    deliveryAddress: Joi.string().max(500).when('deliveryMethod', {
      is: 'home',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),
  
  // KYC document upload
  kycUpload: Joi.object({
    documentType: Joi.string().valid('id', 'passport', 'drivers_license', 'utility_bill').required(),
    documentNumber: Joi.string().max(50).required(),
    expiryDate: Joi.date().iso().min('now').optional(),
    countryOfIssue: Joi.string().length(2).uppercase().required()
  }),
  
  // Password reset
  passwordReset: Joi.object({
    email: commonSchemas.email,
    token: Joi.string().length(64).required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  }),
  
  // Beneficiary creation
  beneficiaryCreate: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().max(255).optional(),
    phoneNumber: commonSchemas.phoneNumber,
    relationship: Joi.string().valid('family', 'friend', 'business', 'other').required(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().pattern(/^\d{8,17}$/).optional(),
      bankCode: Joi.string().length(3).optional(),
      accountName: Joi.string().max(100).optional()
    }).optional()
  })
};

/**
 * Rate limiting validation for sensitive operations
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
function validateRateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old attempts
    if (attempts.has(key)) {
      const userAttempts = attempts.get(key).filter(timestamp => timestamp > windowStart);
      attempts.set(key, userAttempts);
    }
    
    const userAttempts = attempts.get(key) || [];
    
    if (userAttempts.length >= maxAttempts) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        attempts: userAttempts.length,
        maxAttempts: maxAttempts
      });
      
      return res.status(429).json({
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userAttempts.push(now);
    attempts.set(key, userAttempts);
    
    next();
  };
}

/**
 * SQL injection prevention middleware
 * @returns {Function} Express middleware function
 */
function preventSqlInjection(req, res, next) {
  const sqlPatterns = [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|declare|cast|convert|script)\b)/i,
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(select|insert|update|delete|drop|create|alter)\b)/i,
    /(--|\/\*|\*\/|xp_|sp_|@@|char\(|nchar\(|varchar\(|nvarchar\(|cast\(|convert\()/i
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return true; // SQL injection detected
        }
      }
    }
    return false;
  };
  
  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (checkObject(value)) return true;
      } else if (checkValue(value)) {
        return true;
      }
    }
    return false;
  };
  
  // Check request body, query, and params
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(400).json({
      message: 'Invalid input detected',
      code: 'INVALID_INPUT'
    });
  }
  
  next();
}

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validateRateLimit,
  preventSqlInjection,
  sanitizeData,
  commonSchemas,
  endpointSchemas
}; 