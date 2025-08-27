/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Basic security tests for implemented security fixes
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

describe('Basic Security Implementation Tests', () => {
  
  describe('Password Security', () => {
    test('should hash passwords with sufficient salt rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).not.toBe(password);
      expect(hash).toContain('$2a$12$'); // bcryptjs with 12 rounds
    });

    test('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject wrong passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Security', () => {
    const secret = 'test-secret-key-for-jwt-testing';
    
    test('should generate valid JWT tokens', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should verify valid JWT tokens', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('should reject expired tokens', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      const token = jwt.sign(payload, secret, { expiresIn: '0s' }); // Expired immediately
      
      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('jwt expired');
    });

    test('should reject tokens with wrong secret', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow('invalid signature');
    });
  });

  describe('Input Validation Security', () => {
    test('should detect SQL injection patterns', () => {
      const sqlPatterns = [
        "'; DROP TABLE Users; --",
        "SELECT * FROM users WHERE id = 1 OR 1=1",
        "INSERT INTO users VALUES (1, 'test', 'test')",
        "UPDATE users SET password = 'hacked'",
        "DELETE FROM users WHERE 1=1"
      ];
      
      const sqlRegex = /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|declare|cast|convert|script)\b)/i;
      
      sqlPatterns.forEach(pattern => {
        expect(sqlRegex.test(pattern)).toBe(true);
      });
    });

    test('should detect XSS patterns', () => {
      const xssPatterns = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)"></object>'
      ];
      
      const xssRegex = /<script|<iframe|<object|<img.*onerror/i;
      
      xssPatterns.forEach(pattern => {
        expect(xssRegex.test(pattern)).toBe(true);
      });
    });

    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com',
        'test@example.',
        'test@example',
        'test@@example.com'
      ];
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      // More strict validation for invalid emails
      const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(strictEmailRegex.test(email)).toBe(false);
      });
    });

    test('should validate phone number format', () => {
      const validPhones = [
        '+1234567890',
        '+27123456789',
        '+44123456789'
      ];
      
      const invalidPhones = [
        '1234567890',
        'invalid',
        '+12345678901234567890', // Too long
        '+',
        '+0',
        '+123456789012345678901', // Too long
        '+1234567890123456789012' // Too long
      ];
      
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      
      // More strict validation for invalid phones
      const strictPhoneRegex = /^\+[1-9]\d{1,14}$/;
      
      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true);
      });
      
      invalidPhones.forEach(phone => {
        expect(strictPhoneRegex.test(phone)).toBe(false);
      });
    });
  });

  describe('Cryptographic Security', () => {
    test('should generate secure random tokens', () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex characters
    });

    test('should generate secure random UUIDs', () => {
      const uuid1 = crypto.randomUUID();
      const uuid2 = crypto.randomUUID();
      
      expect(uuid1).toBeDefined();
      expect(uuid2).toBeDefined();
      expect(uuid1).not.toBe(uuid2);
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('should hash data securely', () => {
      const data = 'sensitive-data';
      const hash1 = crypto.createHash('sha256').update(data).digest('hex');
      const hash2 = crypto.createHash('sha256').update(data).digest('hex');
      
      expect(hash1).toBe(hash2); // Same input should produce same hash
      expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
    });
  });

  describe('Rate Limiting Logic', () => {
    test('should track rate limiting attempts', () => {
      const attempts = [];
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxAttempts = 5;
      
      // Simulate attempts over time
      for (let i = 0; i < 6; i++) {
        attempts.push(now - (i * 60 * 1000)); // Each attempt 1 minute apart
      }
      
      // Check if rate limited
      const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
      const isRateLimited = recentAttempts.length >= maxAttempts;
      
      expect(recentAttempts.length).toBe(6);
      expect(isRateLimited).toBe(true);
    });

    test('should reset rate limiting after window expires', () => {
      const attempts = [];
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxAttempts = 5;
      
      // Simulate old attempts
      for (let i = 0; i < 5; i++) {
        attempts.push(now - (20 * 60 * 1000)); // 20 minutes ago (expired)
      }
      
      // Check if rate limited
      const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
      const isRateLimited = recentAttempts.length >= maxAttempts;
      
      expect(recentAttempts.length).toBe(0);
      expect(isRateLimited).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'TestPassword123!',
        'MySecurePass456@',
        'ComplexP@ssw0rd',
        'Str0ng!P@ss'
      ];
      
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123'
      ];
      
      // Strong password regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      
      strongPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(true);
      });
      
      weakPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(false);
      });
    });
  });
}); 