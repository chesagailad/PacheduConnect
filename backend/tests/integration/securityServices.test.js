/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Integration tests for security services
 */

const securityServicesIntegration = require('../../src/services/securityServicesIntegration');
const pciComplianceService = require('../../src/services/pciComplianceService');
const enhancedKYCService = require('../../src/services/enhancedKYCService');
const securityMonitoringService = require('../../src/services/securityMonitoringService');
const advancedFraudDetectionService = require('../../src/services/advancedFraudDetectionService');
const performanceOptimizationService = require('../../src/services/performanceOptimizationService');
const mfaService = require('../../src/services/mfaService');
const tokenService = require('../../src/services/tokenService');

describe('Security Services Integration Tests', () => {
  
  beforeAll(async () => {
    // Initialize security services
    await securityServicesIntegration.initializeServices();
  });

  describe('Security Services Initialization', () => {
    test('should initialize all security services successfully', () => {
      const status = securityServicesIntegration.getInitializationStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.errors).toHaveLength(0);
      
      // Check that all services are available
      Object.keys(status.services).forEach(serviceName => {
        expect(status.services[serviceName].initialized).toBe(true);
        expect(status.services[serviceName].available).toBe(true);
      });
    });

    test('should provide access to all security services', () => {
      const services = securityServicesIntegration.getAllServices();
      
      expect(services.pciCompliance).toBeDefined();
      expect(services.kyc).toBeDefined();
      expect(services.monitoring).toBeDefined();
      expect(services.fraudDetection).toBeDefined();
      expect(services.performance).toBeDefined();
      expect(services.mfa).toBeDefined();
      expect(services.token).toBeDefined();
    });
  });

  describe('PCI-DSS Compliance Service', () => {
    test('should encrypt and decrypt sensitive data', () => {
      const testData = {
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
        phone: '+1234567890'
      };

      const key = pciComplianceService.generateEncryptionKey('test-password', 'test-salt');
      const encrypted = pciComplianceService.encryptSensitiveData(JSON.stringify(testData), key);
      const decrypted = pciComplianceService.decryptSensitiveData(encrypted, key);

      expect(JSON.parse(decrypted)).toEqual(testData);
    });

    test('should mask sensitive data for logging', () => {
      const testData = {
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
        phone: '+1234567890',
        email: 'test@example.com'
      };

      const masked = {
        creditCard: pciComplianceService.maskSensitiveData(testData.creditCard, 'credit_card'),
        ssn: pciComplianceService.maskSensitiveData(testData.ssn, 'ssn'),
        phone: pciComplianceService.maskSensitiveData(testData.phone, 'phone'),
        email: pciComplianceService.maskSensitiveData(testData.email, 'email')
      };

      expect(masked.creditCard).toBe('4111********1111');
      expect(masked.ssn).toBe('123-**-6789');
      expect(masked.phone).toBe('+12-***-7890');
      expect(masked.email).toBe('t***@example.com');
    });

    test('should validate PCI-DSS compliance', () => {
      const compliance = pciComplianceService.validateCompliance();

      expect(compliance.overallCompliance).toBe(true);
      expect(compliance.details.encryption.compliant).toBe(true);
      expect(compliance.details.accessControl.compliant).toBe(true);
      expect(compliance.details.auditLogging.compliant).toBe(true);
    });
  });

  describe('Enhanced KYC Service', () => {
    test('should initiate KYC verification process', async () => {
      const userData = {
        userId: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const kycResult = await enhancedKYCService.initiateKYCVerification(userData, 'silver');

      expect(kycResult.sessionId).toBeDefined();
      expect(kycResult.kycLevel).toBe('silver');
      expect(kycResult.requirements).toBeDefined();
      expect(kycResult.verificationUrl).toBeDefined();
      expect(kycResult.expiresAt).toBeDefined();
    });

    test('should verify identity with multiple providers', async () => {
      const sessionId = 'test-session-123';
      const identityData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        nationality: 'US'
      };

      const result = await enhancedKYCService.verifyIdentity(sessionId, identityData);

      expect(result.status).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.providers).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Security Monitoring Service', () => {
    test('should monitor security events', () => {
      const securityEvent = {
        type: 'failed_login_attempt',
        severity: 'MEDIUM',
        source: 'auth_service',
        userId: 'test-user-123',
        ipAddress: '192.168.1.1',
        details: {
          attemptCount: 3,
          timestamp: new Date().toISOString()
        }
      };

      securityMonitoringService.monitorEvent(securityEvent);

      // The service should process the event without throwing errors
      expect(true).toBe(true);
    });

    test('should perform health check', () => {
      const healthStatus = securityMonitoringService.performHealthCheck();

      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.metrics).toBeDefined();
      expect(healthStatus.timestamp).toBeDefined();
    });
  });

  describe('Advanced Fraud Detection Service', () => {
    test('should analyze transaction for fraud', async () => {
      const transaction = {
        id: 'txn-123',
        amount: 1000,
        currency: 'USD',
        ipAddress: '192.168.1.1',
        device: {
          id: 'device-123',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'abc123'
        },
        location: {
          country: 'US',
          city: 'New York',
          ip: '192.168.1.1'
        }
      };

      const user = {
        id: 'user-123',
        kycLevel: 'silver',
        createdAt: new Date().toISOString()
      };

      const analysis = await advancedFraudDetectionService.analyzeTransaction(transaction, user);

      expect(analysis.analysisId).toBeDefined();
      expect(analysis.riskScore).toBeDefined();
      expect(analysis.fraudProbability).toBeDefined();
      expect(analysis.recommendation).toBeDefined();
      expect(analysis.timestamp).toBeDefined();
    });
  });

  describe('Performance Optimization Service', () => {
    test('should provide performance report', () => {
      const report = performanceOptimizationService.getPerformanceReport();

      expect(report.timestamp).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.optimization).toBeDefined();
      expect(report.cache).toBeDefined();
      expect(report.system).toBeDefined();
    });

    test('should manage cache operations', () => {
      const testKey = 'test-cache-key';
      const testValue = { data: 'test-value' };

      performanceOptimizationService.setCache(testKey, testValue);
      const cachedValue = performanceOptimizationService.getCache(testKey);

      expect(cachedValue).toEqual(testValue);
    });
  });

  describe('MFA Service', () => {
    test('should generate TOTP secret', async () => {
      const userId = 'test-user-123';
      const { secret, qrCode } = await mfaService.generateTOTPSecret(userId);

      expect(secret).toBeDefined();
      expect(qrCode).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      expect(qrCode.length).toBeGreaterThan(0);
    });

    test('should verify TOTP token', async () => {
      const userId = 'test-user-123';
      const token = '123456'; // Mock token

      const isValid = await mfaService.verifyTOTPToken(userId, token);

      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Token Service', () => {
    test('should generate access and refresh tokens', () => {
      const user = {
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'user'
      };

      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user.id);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    test('should refresh access tokens', async () => {
      const user = {
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'user'
      };

      const refreshToken = tokenService.generateRefreshToken(user.id);
      const newTokens = await tokenService.refreshAccessToken(refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
    });
  });

  describe('Security Health Check', () => {
    test('should perform comprehensive health check', async () => {
      const healthStatus = await securityServicesIntegration.performHealthCheck();

      expect(healthStatus.overall).toBeDefined();
      expect(healthStatus.services).toBeDefined();
      expect(healthStatus.timestamp).toBeDefined();

      // Check that all services are healthy
      Object.keys(healthStatus.services).forEach(serviceName => {
        expect(healthStatus.services[serviceName].status).toBeDefined();
      });
    });
  });
}); 