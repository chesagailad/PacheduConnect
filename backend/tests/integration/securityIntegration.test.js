/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Integration tests for all security services
 */

const request = require('supertest');
const app = require('../../src/app');
const pciComplianceService = require('../../src/services/pciComplianceService');
const enhancedKYCService = require('../../src/services/enhancedKYCService');
const securityMonitoringService = require('../../src/services/securityMonitoringService');
const advancedFraudDetectionService = require('../../src/services/advancedFraudDetectionService');
const tokenService = require('../../src/services/tokenService');
const mfaService = require('../../src/services/mfaService');

describe('Security Services Integration Tests', () => {
  let testUser;
  let authToken;
  let kycSession;

  beforeAll(async () => {
    // Setup test user
    testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      kycLevel: 'bronze',
      createdAt: new Date().toISOString()
    };

    // Generate test auth token
    authToken = tokenService.generateAccessToken(testUser);
  });

  describe('PCI-DSS Compliance Integration', () => {
    test('should encrypt and decrypt sensitive data correctly', async () => {
      const sensitiveData = {
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
        phone: '+1234567890'
      };

      const key = pciComplianceService.generateEncryptionKey('test-password', 'test-salt');
      const encrypted = pciComplianceService.encryptSensitiveData(JSON.stringify(sensitiveData), key);
      const decrypted = pciComplianceService.decryptSensitiveData(encrypted, key);

      expect(JSON.parse(decrypted)).toEqual(sensitiveData);
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

    test('should detect sensitive data in text', () => {
      const text = 'My credit card is 4111111111111111 and SSN is 123-45-6789';
      const detected = pciComplianceService.detectSensitiveData(text);

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'credit_card')).toBe(true);
      expect(detected.some(d => d.type === 'ssn')).toBe(true);
    });

    test('should validate PCI-DSS compliance', () => {
      const compliance = pciComplianceService.validateCompliance();
      
      expect(compliance.overallCompliance).toBe(true);
      expect(compliance.details.encryption.compliant).toBe(true);
      expect(compliance.details.accessControl.compliant).toBe(true);
      expect(compliance.details.auditLogging.compliant).toBe(true);
    });
  });

  describe('Enhanced KYC Integration', () => {
    test('should initiate KYC verification process', async () => {
      const userData = {
        userId: testUser.id,
        email: testUser.email,
        name: testUser.name
      };

      const kycResult = await enhancedKYCService.initiateKYCVerification(userData, 'silver');
      
      expect(kycResult.sessionId).toBeDefined();
      expect(kycResult.kycLevel).toBe('silver');
      expect(kycResult.requirements).toContain('document_verification');
      expect(kycResult.verificationUrl).toContain(kycResult.sessionId);

      kycSession = kycResult;
    });

    test('should verify identity with multiple providers', async () => {
      const identityData = {
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        nationality: 'US'
      };

      const result = await enhancedKYCService.verifyIdentity(kycSession.sessionId, identityData);
      
      expect(result.status).toBe('verified');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.providers).toContain('trulioo');
      expect(result.providers).toContain('onfido');
    });

    test('should verify document authenticity', async () => {
      const documentData = {
        documentType: 'passport',
        documentNumber: 'A12345678',
        documentImage: 'base64-encoded-image',
        country: 'US'
      };

      const result = await enhancedKYCService.verifyDocument(kycSession.sessionId, documentData);
      
      expect(result.status).toBe('verified');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.providers).toContain('jumio');
      expect(result.providers).toContain('onfido');
    });

    test('should get KYC verification status', async () => {
      const status = await enhancedKYCService.getKYCStatus(kycSession.sessionId);
      
      expect(status.sessionId).toBe(kycSession.sessionId);
      expect(status.userId).toBe(testUser.id);
      expect(status.kycLevel).toBe('silver');
      expect(status.overallProgress).toBeGreaterThan(0);
    });
  });

  describe('Security Monitoring Integration', () => {
    test('should monitor security events in real-time', (done) => {
      const testEvent = {
        type: 'failed_login_attempt',
        severity: 'MEDIUM',
        source: 'auth_service',
        userId: testUser.id,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { message: 'Invalid password attempt' }
      };

      securityMonitoringService.on('securityEvent', (event) => {
        expect(event.type).toBe('failed_login_attempt');
        expect(event.userId).toBe(testUser.id);
        expect(event.riskScore).toBeDefined();
        done();
      });

      securityMonitoringService.monitorEvent(testEvent);
    });

    test('should detect and handle threats', (done) => {
      const threatEvent = {
        type: 'sql_injection_attempt',
        severity: 'CRITICAL',
        source: 'api_gateway',
        userId: testUser.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        details: { message: 'SQL injection detected' }
      };

      securityMonitoringService.on('threatDetected', (threat) => {
        expect(threat.type).toBe('sqlInjection');
        expect(threat.severity).toBe('CRITICAL');
        expect(threat.responseActions).toBeDefined();
        done();
      });

      securityMonitoringService.monitorEvent(threatEvent);
    });

    test('should send alerts for critical threats', (done) => {
      const criticalEvent = {
        type: 'data_breach',
        severity: 'CRITICAL',
        source: 'database',
        userId: testUser.id,
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0',
        details: { message: 'Unauthorized data access detected' }
      };

      // Mock alert sending
      const originalSendAlerts = securityMonitoringService.sendAlerts;
      securityMonitoringService.sendAlerts = jest.fn().mockResolvedValue();

      securityMonitoringService.on('threatDetected', async (threat) => {
        expect(threat.type).toBe('dataBreach');
        expect(threat.severity).toBe('CRITICAL');
        
        // Verify alerts were sent
        expect(securityMonitoringService.sendAlerts).toHaveBeenCalled();
        
        securityMonitoringService.sendAlerts = originalSendAlerts;
        done();
      });

      securityMonitoringService.monitorEvent(criticalEvent);
    });

    test('should provide security dashboard data', () => {
      const dashboardData = securityMonitoringService.getDashboardData();
      
      expect(dashboardData.metrics).toBeDefined();
      expect(dashboardData.activeThreats).toBeDefined();
      expect(dashboardData.recentEvents).toBeDefined();
      expect(dashboardData.systemHealth).toBeDefined();
    });
  });

  describe('Advanced Fraud Detection Integration', () => {
    test('should analyze transaction for fraud', async () => {
      const transaction = {
        id: 'txn-123',
        amount: 5000,
        currency: 'USD',
        userId: testUser.id,
        ipAddress: '192.168.1.1',
        timestamp: new Date().toISOString(),
        device: {
          id: 'device-123',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'abc123'
        },
        location: {
          country: 'US',
          city: 'New York',
          ipAddress: '192.168.1.1',
          isp: 'Comcast'
        },
        sessionId: 'session-123'
      };

      const result = await advancedFraudDetectionService.analyzeTransaction(transaction, testUser);
      
      expect(result.analysisId).toBeDefined();
      expect(result.transactionId).toBe(transaction.id);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(1);
      expect(result.fraudProbability).toBeGreaterThanOrEqual(0);
      expect(result.fraudProbability).toBeLessThanOrEqual(1);
      expect(result.recommendation).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should perform comprehensive risk assessment', async () => {
      const transaction = {
        id: 'txn-456',
        amount: 15000,
        currency: 'USD',
        userId: testUser.id,
        ipAddress: '192.168.1.2',
        timestamp: new Date().toISOString(),
        device: {
          id: 'device-456',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'def456'
        },
        location: {
          country: 'US',
          city: 'Los Angeles',
          ipAddress: '192.168.1.2',
          isp: 'Verizon'
        },
        sessionId: 'session-456'
      };

      const riskAssessment = await advancedFraudDetectionService.performRiskAssessment(transaction, testUser);
      
      expect(riskAssessment.totalRiskScore).toBeGreaterThanOrEqual(0);
      expect(riskAssessment.totalRiskScore).toBeLessThanOrEqual(1);
      expect(riskAssessment.riskFactors.transaction).toBeDefined();
      expect(riskAssessment.riskFactors.user).toBeDefined();
      expect(riskAssessment.riskFactors.device).toBeDefined();
      expect(riskAssessment.riskFactors.location).toBeDefined();
      expect(riskAssessment.riskFactors.behavioral).toBeDefined();
      expect(riskAssessment.riskLevel).toBeDefined();
    });

    test('should apply machine learning models', async () => {
      const transaction = {
        id: 'txn-789',
        amount: 2500,
        currency: 'USD',
        userId: testUser.id,
        ipAddress: '192.168.1.3',
        timestamp: new Date().toISOString(),
        device: {
          id: 'device-789',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'ghi789'
        },
        location: {
          country: 'US',
          city: 'Chicago',
          ipAddress: '192.168.1.3',
          isp: 'AT&T'
        },
        sessionId: 'session-789'
      };

      const mlResult = await advancedFraudDetectionService.applyMLModels(transaction, testUser);
      
      expect(mlResult.score).toBeGreaterThanOrEqual(0);
      expect(mlResult.score).toBeLessThanOrEqual(1);
      expect(mlResult.models.transaction).toBeDefined();
      expect(mlResult.models.behavioral).toBeDefined();
      expect(mlResult.models.device).toBeDefined();
      expect(mlResult.models.location).toBeDefined();
      expect(mlResult.confidence).toBeGreaterThan(0);
    });

    test('should detect fraud patterns', () => {
      const transaction = {
        id: 'txn-999',
        amount: 50000,
        currency: 'USD',
        userId: testUser.id,
        ipAddress: '192.168.1.4',
        timestamp: new Date().toISOString(),
        device: {
          id: 'device-999',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'jkl999'
        },
        location: {
          country: 'US',
          city: 'Miami',
          ipAddress: '192.168.1.4',
          isp: 'Cox'
        },
        sessionId: 'session-999'
      };

      const patternAnalysis = advancedFraudDetectionService.analyzeFraudPatterns(transaction, testUser);
      
      expect(patternAnalysis.patterns).toBeDefined();
      expect(patternAnalysis.totalScore).toBeGreaterThanOrEqual(0);
      expect(patternAnalysis.totalScore).toBeLessThanOrEqual(1);
      expect(patternAnalysis.patternCount).toBeGreaterThanOrEqual(0);
      expect(patternAnalysis.highRiskPatterns).toBeGreaterThanOrEqual(0);
    });

    test('should generate appropriate recommendations', () => {
      const highRiskScore = 0.9;
      const mediumRiskScore = 0.6;
      const lowRiskScore = 0.2;

      const highRiskRecommendation = advancedFraudDetectionService.generateRecommendation(0.9, highRiskScore);
      const mediumRiskRecommendation = advancedFraudDetectionService.generateRecommendation(0.7, mediumRiskScore);
      const lowRiskRecommendation = advancedFraudDetectionService.generateRecommendation(0.3, lowRiskScore);

      expect(highRiskRecommendation.action).toBe('BLOCK');
      expect(mediumRiskRecommendation.action).toBe('REVIEW');
      expect(lowRiskRecommendation.action).toBe('APPROVE');
    });
  });

  describe('Cross-Service Integration', () => {
    test('should integrate fraud detection with security monitoring', (done) => {
      const highRiskTransaction = {
        id: 'txn-high-risk',
        amount: 100000,
        currency: 'USD',
        userId: testUser.id,
        ipAddress: '192.168.1.5',
        timestamp: new Date().toISOString(),
        device: {
          id: 'device-high-risk',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'high-risk-fingerprint'
        },
        location: {
          country: 'US',
          city: 'Las Vegas',
          ipAddress: '192.168.1.5',
          isp: 'CenturyLink'
        },
        sessionId: 'session-high-risk'
      };

      securityMonitoringService.on('securityEvent', (event) => {
        if (event.type === 'high_risk_transaction') {
          expect(event.details.transactionId).toBe(highRiskTransaction.id);
          expect(event.details.riskScore).toBeGreaterThan(0.7);
          done();
        }
      });

      advancedFraudDetectionService.analyzeTransaction(highRiskTransaction, testUser);
    });

    test('should integrate KYC with PCI compliance', async () => {
      const sensitiveDocumentData = {
        documentType: 'passport',
        documentNumber: 'A12345678',
        documentImage: 'base64-encoded-image-with-sensitive-data',
        country: 'US',
        personalInfo: {
          ssn: '123-45-6789',
          creditCard: '4111111111111111'
        }
      };

      // Verify that sensitive data is handled securely
      const key = pciComplianceService.generateEncryptionKey('test-password', 'test-salt');
      const encrypted = pciComplianceService.encryptSensitiveData(JSON.stringify(sensitiveDocumentData), key);
      
      // Decrypt and verify
      const decrypted = pciComplianceService.decryptSensitiveData(encrypted, key);
      const decryptedData = JSON.parse(decrypted);
      
      expect(decryptedData.documentNumber).toBe(sensitiveDocumentData.documentNumber);
      expect(decryptedData.personalInfo.ssn).toBe(sensitiveDocumentData.personalInfo.ssn);
    });

    test('should provide end-to-end security workflow', async () => {
      // 1. User registration with KYC
      const userData = {
        userId: 'e2e-user-123',
        email: 'e2e@example.com',
        name: 'E2E Test User'
      };

      const kycResult = await enhancedKYCService.initiateKYCVerification(userData, 'gold');
      expect(kycResult.sessionId).toBeDefined();

      // 2. Identity verification
      const identityResult = await enhancedKYCService.verifyIdentity(kycResult.sessionId, {
        firstName: 'E2E',
        lastName: 'Test',
        dateOfBirth: '1990-01-01',
        nationality: 'US'
      });
      expect(identityResult.status).toBe('verified');

      // 3. Document verification
      const documentResult = await enhancedKYCService.verifyDocument(kycResult.sessionId, {
        documentType: 'passport',
        documentNumber: 'E2E123456',
        documentImage: 'base64-encoded-image',
        country: 'US'
      });
      expect(documentResult.status).toBe('verified');

      // 4. Transaction with fraud detection
      const transaction = {
        id: 'e2e-txn-123',
        amount: 5000,
        currency: 'USD',
        userId: userData.userId,
        ipAddress: '192.168.1.100',
        timestamp: new Date().toISOString(),
        device: {
          id: 'e2e-device-123',
          userAgent: 'Mozilla/5.0',
          fingerprint: 'e2e-fingerprint'
        },
        location: {
          country: 'US',
          city: 'New York',
          ipAddress: '192.168.1.100',
          isp: 'Comcast'
        },
        sessionId: 'e2e-session-123'
      };

      const fraudResult = await advancedFraudDetectionService.analyzeTransaction(transaction, userData);
      expect(fraudResult.analysisId).toBeDefined();
      expect(fraudResult.recommendation.action).toBeDefined();

      // 5. Security monitoring
      const dashboardData = securityMonitoringService.getDashboardData();
      expect(dashboardData.metrics).toBeDefined();
      expect(dashboardData.systemHealth.status).toBe('healthy');

      // 6. PCI compliance validation
      const compliance = pciComplianceService.validateCompliance();
      expect(compliance.overallCompliance).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent transactions', async () => {
      const concurrentTransactions = [];
      const promises = [];

      // Create 10 concurrent transactions
      for (let i = 0; i < 10; i++) {
        const transaction = {
          id: `concurrent-txn-${i}`,
          amount: 1000 + (i * 100),
          currency: 'USD',
          userId: testUser.id,
          ipAddress: `192.168.1.${i + 1}`,
          timestamp: new Date().toISOString(),
          device: {
            id: `concurrent-device-${i}`,
            userAgent: 'Mozilla/5.0',
            fingerprint: `concurrent-fingerprint-${i}`
          },
          location: {
            country: 'US',
            city: 'New York',
            ipAddress: `192.168.1.${i + 1}`,
            isp: 'Comcast'
          },
          sessionId: `concurrent-session-${i}`
        };

        promises.push(advancedFraudDetectionService.analyzeTransaction(transaction, testUser));
      }

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.analysisId).toBeDefined();
        expect(result.riskScore).toBeGreaterThanOrEqual(0);
        expect(result.riskScore).toBeLessThanOrEqual(1);
      });
    });

    test('should handle high-volume security events', () => {
      const events = [];
      
      // Generate 50 security events
      for (let i = 0; i < 50; i++) {
        events.push({
          type: i % 2 === 0 ? 'failed_login_attempt' : 'suspicious_activity',
          severity: i % 3 === 0 ? 'LOW' : i % 3 === 1 ? 'MEDIUM' : 'HIGH',
          source: 'test_service',
          userId: testUser.id,
          ipAddress: `192.168.1.${i + 1}`,
          userAgent: 'Mozilla/5.0',
          details: { message: `Test event ${i}` }
        });
      }

      // Monitor all events
      events.forEach(event => {
        securityMonitoringService.monitorEvent(event);
      });

      const dashboardData = securityMonitoringService.getDashboardData();
      expect(dashboardData.metrics.totalEvents).toBeGreaterThanOrEqual(50);
    });
  });
}); 