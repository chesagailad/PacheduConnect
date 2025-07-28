# API Security Documentation for PacheduConnect

## Overview

This document outlines the comprehensive API security framework for the PacheduConnect remittance platform, ensuring secure communication, data protection, and regulatory compliance for financial services.

## API Security Standards

### Authentication & Authorization

#### JWT Token Authentication
```javascript
// JWT Token Structure
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "user|admin|super_admin",
    "permissions": ["read", "write", "admin"],
    "iat": 1516239022,
    "exp": 1516325422,
    "iss": "pacheduconnect.com",
    "aud": "pachedu-api"
  },
  "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret)"
}
```

#### Multi-Factor Authentication (MFA)
```javascript
// MFA Implementation
const mfaService = {
  // Generate TOTP secret
  generateSecret: () => {
    return crypto.randomBytes(20).toString('hex');
  },
  
  // Generate TOTP code
  generateTOTP: (secret) => {
    return speakeasy.totp({
      secret: secret,
      encoding: 'hex',
      window: 2
    });
  },
  
  // Verify TOTP code
  verifyTOTP: (token, secret) => {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'hex',
      token: token,
      window: 2
    });
  }
};
```

### API Rate Limiting

#### Tiered Rate Limiting
```javascript
// Rate limiting configuration
const rateLimitConfig = {
  // Public endpoints
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP'
  },
  
  // Authenticated endpoints
  authenticated: {
    windowMs: 15 * 60 * 1000,
    max: 1000, // 1000 requests per window
    message: 'Rate limit exceeded for authenticated user'
  },
  
  // Payment endpoints
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 payment requests per hour
    message: 'Payment rate limit exceeded'
  },
  
  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000,
    max: 500, // 500 requests per window
    message: 'Admin rate limit exceeded'
  }
};
```

### Input Validation & Sanitization

#### Comprehensive Validation Schema
```javascript
// Joi validation schemas
const validationSchemas = {
  // User registration
  userRegistration: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-Z\s]+$/)
      .required(),
    email: Joi.string()
      .email()
      .max(255)
      .required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required(),
    phoneNumber: Joi.string()
      .pattern(/^\+[1-9]\d{1,14}$/)
      .required()
  }),
  
  // Transaction creation
  transaction: Joi.object({
    amount: Joi.number()
      .positive()
      .max(100000)
      .precision(2)
      .required(),
    currency: Joi.string()
      .valid('ZAR', 'USD', 'EUR', 'GBP')
      .required(),
    recipientEmail: Joi.string()
      .email()
      .required(),
    description: Joi.string()
      .max(500)
      .pattern(/^[a-zA-Z0-9\s\-_.,!?]+$/)
      .required(),
    paymentMethod: Joi.string()
      .valid('stripe', 'ozow', 'payfast', 'stitch')
      .required()
  }),
  
  // Payment processing
  payment: Joi.object({
    transactionId: Joi.string()
      .uuid()
      .required(),
    paymentMethod: Joi.string()
      .valid('stripe', 'ozow', 'payfast', 'stitch')
      .required(),
    cardData: Joi.object({
      number: Joi.string()
        .pattern(/^\d{13,19}$/)
        .required(),
      expiryMonth: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .required(),
      expiryYear: Joi.number()
        .integer()
        .min(new Date().getFullYear())
        .max(new Date().getFullYear() + 10)
        .required(),
      cvv: Joi.string()
        .pattern(/^\d{3,4}$/)
        .required()
    }).when('paymentMethod', {
      is: 'stripe',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
  })
};
```

### Data Encryption

#### API Request/Response Encryption
```javascript
// Encryption service for API data
const apiEncryption = {
  // Encrypt sensitive data
  encrypt: (data, purpose = 'api') => {
    const salt = crypto.randomBytes(64);
    const key = crypto.pbkdf2Sync(
      process.env.ENCRYPTION_MASTER_KEY,
      salt + purpose,
      100000,
      32,
      'sha512'
    );
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from(purpose, 'utf8'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
      purpose,
      algorithm: 'aes-256-gcm'
    };
  },
  
  // Decrypt sensitive data
  decrypt: (encryptedData) => {
    const key = crypto.pbkdf2Sync(
      process.env.ENCRYPTION_MASTER_KEY,
      encryptedData.salt + encryptedData.purpose,
      100000,
      32,
      'sha512'
    );
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from(encryptedData.purpose, 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
};
```

## API Endpoints Security

### Authentication Endpoints

#### POST /api/auth/register
```javascript
// Registration endpoint with security measures
router.post('/register', async (req, res) => {
  try {
    // Input validation
    const { error, value } = validationSchemas.userRegistration.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    
    // Rate limiting
    const rateLimitKey = `register:${req.ip}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 3600); // 1 hour
    }
    if (attempts > 5) {
      return res.status(429).json({
        error: 'Too many registration attempts'
      });
    }
    
    // Check for existing user
    const existingUser = await User.findOne({ where: { email: value.email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }
    
    // Password hashing
    const passwordHash = await bcrypt.hash(value.password, 12);
    
    // Create user
    const user = await User.create({
      name: value.name,
      email: value.email,
      passwordHash,
      phoneNumber: value.phoneNumber
    });
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Audit logging
    await auditLogger.logSecurityEvent('USER_REGISTRATION', 'INFO', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed'
    });
  }
});
```

#### POST /api/auth/login
```javascript
// Login endpoint with security measures
router.post('/login', async (req, res) => {
  try {
    // Input validation
    const { error, value } = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }).validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid input'
      });
    }
    
    // Rate limiting for login attempts
    const rateLimitKey = `login:${req.ip}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 3600); // 1 hour
    }
    if (attempts > 5) {
      return res.status(429).json({
        error: 'Too many login attempts'
      });
    }
    
    // Find user
    const user = await User.findOne({
      where: { email: value.email },
      scope: 'withPassword'
    });
    
    if (!user) {
      await auditLogger.logSecurityEvent('FAILED_LOGIN', 'WARN', {
        email: value.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(value.password, user.passwordHash);
    if (!isValidPassword) {
      await auditLogger.logSecurityEvent('FAILED_LOGIN', 'WARN', {
        userId: user.id,
        email: value.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Audit logging
    await auditLogger.logSecurityEvent('SUCCESSFUL_LOGIN', 'INFO', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});
```

### Transaction Endpoints

#### POST /api/transactions/create
```javascript
// Transaction creation with fraud detection
router.post('/create', auth, async (req, res) => {
  try {
    // Input validation
    const { error, value } = validationSchemas.transaction.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    
    // Fraud detection
    const deviceFingerprint = extractDeviceFingerprint(req);
    const userData = extractUserData(req);
    const transactionData = {
      ...value,
      userId: req.user.id
    };
    
    const fraudResult = await detectFraud(transactionData, userData, deviceFingerprint);
    
    if (fraudResult.riskLevel === 'HIGH') {
      await auditLogger.logSecurityEvent('FRAUD_DETECTED', 'HIGH', {
        userId: req.user.id,
        transactionData: value,
        riskScore: fraudResult.riskScore,
        riskFactors: fraudResult.riskFactors
      });
      
      return res.status(403).json({
        error: 'Transaction blocked due to security concerns',
        code: 'FRAUD_DETECTED'
      });
    }
    
    if (fraudResult.riskLevel === 'MEDIUM') {
      // Require additional verification
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await redis.setex(`verification:${verificationToken}`, 300, JSON.stringify({
        transactionData: value,
        userId: req.user.id,
        fraudResult
      }));
      
      return res.status(202).json({
        message: 'Additional verification required',
        verificationToken,
        requiresVerification: true
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      amount: value.amount,
      currency: value.currency,
      recipientEmail: value.recipientEmail,
      description: value.description,
      status: 'PENDING',
      riskScore: fraudResult.riskScore,
      riskFactors: fraudResult.riskFactors
    });
    
    // Audit logging
    await auditLogger.logTransaction(req.user.id, transaction.id, 'CREATE', {
      amount: value.amount,
      currency: value.currency,
      riskScore: fraudResult.riskScore
    });
    
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    logger.error('Transaction creation error:', error);
    res.status(500).json({
      error: 'Transaction creation failed'
    });
  }
});
```

### Payment Endpoints

#### POST /api/payments/process
```javascript
// Payment processing with security measures
router.post('/process', auth, async (req, res) => {
  try {
    // Input validation
    const { error, value } = validationSchemas.payment.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    
    // Verify transaction ownership
    const transaction = await Transaction.findOne({
      where: { id: value.transactionId, userId: req.user.id }
    });
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }
    
    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Transaction cannot be processed'
      });
    }
    
    // Encrypt sensitive payment data
    let encryptedPaymentData = null;
    if (value.cardData) {
      encryptedPaymentData = apiEncryption.encrypt(value.cardData, 'payment');
    }
    
    // Process payment through gateway
    const paymentResult = await processPayment({
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: value.paymentMethod,
      encryptedPaymentData
    });
    
    if (paymentResult.success) {
      // Update transaction status
      await transaction.update({
        status: 'COMPLETED',
        paymentId: paymentResult.paymentId,
        processedAt: new Date()
      });
      
      // Audit logging
      await auditLogger.logTransaction(req.user.id, transaction.id, 'PAYMENT_SUCCESS', {
        paymentMethod: value.paymentMethod,
        paymentId: paymentResult.paymentId
      });
      
      res.json({
        message: 'Payment processed successfully',
        paymentId: paymentResult.paymentId,
        transaction: {
          id: transaction.id,
          status: transaction.status,
          processedAt: transaction.processedAt
        }
      });
    } else {
      // Update transaction status
      await transaction.update({
        status: 'FAILED',
        failureReason: paymentResult.error
      });
      
      // Audit logging
      await auditLogger.logTransaction(req.user.id, transaction.id, 'PAYMENT_FAILED', {
        paymentMethod: value.paymentMethod,
        error: paymentResult.error
      });
      
      res.status(400).json({
        error: 'Payment processing failed',
        details: paymentResult.error
      });
    }
  } catch (error) {
    logger.error('Payment processing error:', error);
    res.status(500).json({
      error: 'Payment processing failed'
    });
  }
});
```

## Security Headers

### HTTP Security Headers
```javascript
// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https://api.stripe.com; " +
    "frame-src 'self' https://js.stripe.com;"
  );
  
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=()'
  );
  
  next();
};
```

## API Monitoring & Logging

### Request Logging
```javascript
// Comprehensive request logging
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};
```

### Error Handling
```javascript
// Global error handler
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  const errorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
};
```

## API Documentation

### OpenAPI Specification
```yaml
openapi: 3.0.0
info:
  title: PacheduConnect API
  version: 1.0.0
  description: Secure API for remittance platform
  contact:
    name: PacheduConnect Support
    email: support@pacheduconnect.com
  license:
    name: Proprietary
    url: https://pacheduconnect.com/license

servers:
  - url: https://api.pacheduconnect.com/v1
    description: Production server
  - url: https://staging-api.pacheduconnect.com/v1
    description: Staging server

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          maxLength: 100
        email:
          type: string
          format: email
        phoneNumber:
          type: string
          pattern: '^\+[1-9]\d{1,14}$'
        role:
          type: string
          enum: [user, admin, super_admin]
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - email
        - role

    Transaction:
      type: object
      properties:
        id:
          type: string
          format: uuid
        amount:
          type: number
          minimum: 0.01
          maximum: 100000
        currency:
          type: string
          enum: [ZAR, USD, EUR, GBP]
        recipientEmail:
          type: string
          format: email
        description:
          type: string
          maxLength: 500
        status:
          type: string
          enum: [PENDING, COMPLETED, FAILED, CANCELLED]
        riskScore:
          type: number
          minimum: 0
          maximum: 1
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - amount
        - currency
        - recipientEmail
        - status

paths:
  /auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 2
                  maxLength: 100
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                  maxLength: 128
                phoneNumber:
                  type: string
                  pattern: '^\+[1-9]\d{1,14}$'
              required:
                - name
                - email
                - password
                - phoneNumber
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
        '400':
          description: Validation error
        '409':
          description: Email already registered
        '429':
          description: Rate limit exceeded

  /transactions:
    post:
      summary: Create new transaction
      tags: [Transactions]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                amount:
                  type: number
                  minimum: 0.01
                  maximum: 100000
                currency:
                  type: string
                  enum: [ZAR, USD, EUR, GBP]
                recipientEmail:
                  type: string
                  format: email
                description:
                  type: string
                  maxLength: 500
                paymentMethod:
                  type: string
                  enum: [stripe, ozow, payfast, stitch]
              required:
                - amount
                - currency
                - recipientEmail
                - description
                - paymentMethod
      responses:
        '201':
          description: Transaction created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  transaction:
                    $ref: '#/components/schemas/Transaction'
        '400':
          description: Validation error
        '403':
          description: Fraud detected
        '429':
          description: Rate limit exceeded
```

## Conclusion

This API security documentation ensures that the PacheduConnect API maintains the highest standards of security, compliance, and reliability required for financial services operations. Regular security audits and continuous monitoring are essential to maintain these standards.

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Next Review**: 2024-04-01  
**Owner**: PacheduConnect Security Team 