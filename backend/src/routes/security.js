/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Security API routes - Exposes security services functionality
 */

const express = require('express');
const Joi = require('joi');
const { auth, requireRole } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/inputValidation');
const securityServicesIntegration = require('../services/securityServicesIntegration');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Security API Routes
 * 
 * Provides endpoints for:
 * - Security services health checks
 * - PCI-DSS compliance validation
 * - KYC verification status
 * - Fraud detection analysis
 * - Security monitoring dashboard
 * - Performance optimization status
 */

// Health check for all security services
router.get('/health', auth, async (req, res) => {
  try {
    const healthStatus = await securityServicesIntegration.performHealthCheck();
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('Security health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Security health check failed',
      error: error.message
    });
  }
});

// Get security services status
router.get('/status', auth, async (req, res) => {
  try {
    const status = securityServicesIntegration.getInitializationStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get security services status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get security services status',
      error: error.message
    });
  }
});

// PCI-DSS Compliance endpoints
router.get('/pci-compliance/status', auth, requireRole(['admin', 'super-admin']), async (req, res) => {
  try {
    const pciService = securityServicesIntegration.getService('pciCompliance');
    const complianceStatus = pciService.validateCompliance();
    
    res.json({
      success: true,
      data: complianceStatus
    });
  } catch (error) {
    logger.error('PCI-DSS compliance check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'PCI-DSS compliance check failed',
      error: error.message
    });
  }
});

router.get('/pci-compliance/report', auth, requireRole(['admin', 'super-admin']), async (req, res) => {
  try {
    const pciService = securityServicesIntegration.getService('pciCompliance');
    const complianceReport = pciService.getComplianceReport();
    
    res.json({
      success: true,
      data: complianceReport
    });
  } catch (error) {
    logger.error('PCI-DSS compliance report generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'PCI-DSS compliance report generation failed',
      error: error.message
    });
  }
});

// KYC Verification endpoints
router.post('/kyc/initiate', auth, validateBody({
  kycLevel: Joi.string().valid('bronze', 'silver', 'gold', 'platinum').required(),
  userData: Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    name: Joi.string().required()
  }).required()
}), async (req, res) => {
  try {
    const { kycLevel, userData } = req.body;
    const kycService = securityServicesIntegration.getService('kyc');
    
    const kycResult = await kycService.initiateKYCVerification(userData, kycLevel);
    
    res.json({
      success: true,
      data: kycResult
    });
  } catch (error) {
    logger.error('KYC verification initiation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'KYC verification initiation failed',
      error: error.message
    });
  }
});

router.get('/kyc/status/:sessionId', auth, validateParams({
  sessionId: Joi.string().required()
}), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const kycService = securityServicesIntegration.getService('kyc');
    
    const kycStatus = await kycService.getKYCStatus(sessionId);
    
    res.json({
      success: true,
      data: kycStatus
    });
  } catch (error) {
    logger.error('KYC status check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'KYC status check failed',
      error: error.message
    });
  }
});

// Fraud Detection endpoints
router.post('/fraud/analyze', auth, validateBody({
  transaction: Joi.object({
    id: Joi.string().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().required(),
    ipAddress: Joi.string().ip().required(),
    device: Joi.object().required(),
    location: Joi.object().required()
  }).required(),
  user: Joi.object({
    id: Joi.string().required(),
    kycLevel: Joi.string().required(),
    createdAt: Joi.string().isoDate().required()
  }).required()
}), async (req, res) => {
  try {
    const { transaction, user } = req.body;
    const fraudService = securityServicesIntegration.getService('fraudDetection');
    
    const fraudAnalysis = await fraudService.analyzeTransaction(transaction, user);
    
    res.json({
      success: true,
      data: fraudAnalysis
    });
  } catch (error) {
    logger.error('Fraud analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Fraud analysis failed',
      error: error.message
    });
  }
});

// Security Monitoring endpoints
router.get('/monitoring/dashboard', auth, requireRole(['admin', 'super-admin']), async (req, res) => {
  try {
    const monitoringService = securityServicesIntegration.getService('monitoring');
    const dashboardData = monitoringService.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Security monitoring dashboard failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Security monitoring dashboard failed',
      error: error.message
    });
  }
});

router.get('/monitoring/incidents', auth, requireRole(['admin', 'super-admin']), async (req, res) => {
  try {
    const monitoringService = securityServicesIntegration.getService('monitoring');
    const incidents = monitoringService.getActiveIncidents();
    
    res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    logger.error('Security incidents retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Security incidents retrieval failed',
      error: error.message
    });
  }
});

// Performance Optimization endpoints
router.get('/performance/status', auth, requireRole(['admin', 'super-admin']), async (req, res) => {
  try {
    const performanceService = securityServicesIntegration.getService('performance');
    const performanceReport = performanceService.getPerformanceReport();
    
    res.json({
      success: true,
      data: performanceReport
    });
  } catch (error) {
    logger.error('Performance status check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Performance status check failed',
      error: error.message
    });
  }
});

// MFA endpoints
router.post('/mfa/setup', auth, async (req, res) => {
  try {
    const mfaService = securityServicesIntegration.getService('mfa');
    const { secret, qrCode } = await mfaService.generateTOTPSecret(req.user.id);
    
    res.json({
      success: true,
      data: {
        secret,
        qrCode
      }
    });
  } catch (error) {
    logger.error('MFA setup failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'MFA setup failed',
      error: error.message
    });
  }
});

router.post('/mfa/verify', auth, validateBody({
  token: Joi.string().required(),
  type: Joi.string().valid('totp', 'sms', 'backup').required()
}), async (req, res) => {
  try {
    const { token, type } = req.body;
    const mfaService = securityServicesIntegration.getService('mfa');
    
    let isValid = false;
    
    switch (type) {
      case 'totp':
        isValid = await mfaService.verifyTOTPToken(req.user.id, token);
        break;
      case 'sms':
        isValid = await mfaService.verifySMSCode(req.user.id, token);
        break;
      case 'backup':
        isValid = await mfaService.verifyBackupCode(req.user.id, token);
        break;
    }
    
    res.json({
      success: true,
      data: {
        isValid
      }
    });
  } catch (error) {
    logger.error('MFA verification failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'MFA verification failed',
      error: error.message
    });
  }
});

// Token Management endpoints
router.post('/tokens/refresh', auth, validateBody({
  refreshToken: Joi.string().required()
}), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokenService = securityServicesIntegration.getService('token');
    
    const newTokens = await tokenService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: newTokens
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
});

router.post('/tokens/revoke', auth, async (req, res) => {
  try {
    const tokenService = securityServicesIntegration.getService('token');
    await tokenService.revokeUserTokens(req.user.id);
    
    res.json({
      success: true,
      message: 'All user tokens revoked successfully'
    });
  } catch (error) {
    logger.error('Token revocation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Token revocation failed',
      error: error.message
    });
  }
});

// Security metrics endpoint
router.get('/metrics', auth, requireRole(['admin', 'super-admin']), async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Get metrics from each service
    try {
      const pciService = securityServicesIntegration.getService('pciCompliance');
      metrics.services.pciCompliance = pciService.getComplianceReport();
    } catch (error) {
      metrics.services.pciCompliance = { error: error.message };
    }

    try {
      const monitoringService = securityServicesIntegration.getService('monitoring');
      metrics.services.monitoring = monitoringService.getMetrics();
    } catch (error) {
      metrics.services.monitoring = { error: error.message };
    }

    try {
      const performanceService = securityServicesIntegration.getService('performance');
      metrics.services.performance = performanceService.getPerformanceReport();
    } catch (error) {
      metrics.services.performance = { error: error.message };
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Security metrics retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Security metrics retrieval failed',
      error: error.message
    });
  }
});

module.exports = router; 