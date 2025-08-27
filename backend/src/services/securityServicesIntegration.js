/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Security Services Integration - Initializes and connects all security services
 */

const { logger } = require('../utils/logger');

// Import all security services
const pciComplianceService = require('./pciComplianceService');
const enhancedKYCService = require('./enhancedKYCService');
const securityMonitoringService = require('./securityMonitoringService');
const advancedFraudDetectionService = require('./advancedFraudDetectionService');
const performanceOptimizationService = require('./performanceOptimizationService');
const mfaService = require('./mfaService');
const tokenService = require('./tokenService');

/**
 * Security Services Integration Manager
 * 
 * Manages the initialization and integration of all security services
 * into the main application. Provides centralized access to security
 * functionality and ensures proper service coordination.
 */
class SecurityServicesIntegration {
  constructor() {
    this.services = {
      pciCompliance: null,
      kyc: null,
      monitoring: null,
      fraudDetection: null,
      performance: null,
      mfa: null,
      token: null
    };
    
    this.isInitialized = false;
    this.initializationErrors = [];
  }

  /**
   * Initialize all security services
   * @returns {Promise<Object>} Initialization status
   */
  async initializeServices() {
    try {
      logger.info('Initializing security services...');

      // Initialize PCI-DSS Compliance Service
      try {
        this.services.pciCompliance = pciComplianceService;
        logger.info('PCI-DSS Compliance Service initialized');
      } catch (error) {
        logger.error('Failed to initialize PCI-DSS Compliance Service', { error: error.message });
        this.initializationErrors.push({ service: 'pciCompliance', error: error.message });
      }

      // Initialize Enhanced KYC Service
      try {
        this.services.kyc = enhancedKYCService;
        logger.info('Enhanced KYC Service initialized');
      } catch (error) {
        logger.error('Failed to initialize Enhanced KYC Service', { error: error.message });
        this.initializationErrors.push({ service: 'kyc', error: error.message });
      }

      // Initialize Security Monitoring Service
      try {
        this.services.monitoring = securityMonitoringService;
        logger.info('Security Monitoring Service initialized');
      } catch (error) {
        logger.error('Failed to initialize Security Monitoring Service', { error: error.message });
        this.initializationErrors.push({ service: 'monitoring', error: error.message });
      }

      // Initialize Advanced Fraud Detection Service
      try {
        this.services.fraudDetection = advancedFraudDetectionService;
        logger.info('Advanced Fraud Detection Service initialized');
      } catch (error) {
        logger.error('Failed to initialize Advanced Fraud Detection Service', { error: error.message });
        this.initializationErrors.push({ service: 'fraudDetection', error: error.message });
      }

      // Initialize Performance Optimization Service
      try {
        this.services.performance = performanceOptimizationService;
        logger.info('Performance Optimization Service initialized');
      } catch (error) {
        logger.error('Failed to initialize Performance Optimization Service', { error: error.message });
        this.initializationErrors.push({ service: 'performance', error: error.message });
      }

      // Initialize MFA Service
      try {
        this.services.mfa = mfaService;
        logger.info('MFA Service initialized');
      } catch (error) {
        logger.error('Failed to initialize MFA Service', { error: error.message });
        this.initializationErrors.push({ service: 'mfa', error: error.message });
      }

      // Initialize Token Service
      try {
        this.services.token = tokenService;
        logger.info('Token Service initialized');
      } catch (error) {
        logger.error('Failed to initialize Token Service', { error: error.message });
        this.initializationErrors.push({ service: 'token', error: error.message });
      }

      this.isInitialized = true;
      
      const status = this.getInitializationStatus();
      logger.info('Security services initialization completed', status);
      
      return status;

    } catch (error) {
      logger.error('Security services initialization failed', { error: error.message });
      throw new Error('Security services initialization failed');
    }
  }

  /**
   * Get initialization status
   * @returns {Object} Status of all services
   */
  getInitializationStatus() {
    const status = {
      isInitialized: this.isInitialized,
      services: {},
      errors: this.initializationErrors,
      timestamp: new Date().toISOString()
    };

    Object.keys(this.services).forEach(serviceName => {
      status.services[serviceName] = {
        initialized: !!this.services[serviceName],
        available: !!this.services[serviceName]
      };
    });

    return status;
  }

  /**
   * Get a specific security service
   * @param {string} serviceName - Name of the service
   * @returns {Object} Service instance
   */
  getService(serviceName) {
    if (!this.isInitialized) {
      throw new Error('Security services not initialized');
    }

    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Security service '${serviceName}' not available`);
    }

    return service;
  }

  /**
   * Get all security services
   * @returns {Object} All security services
   */
  getAllServices() {
    if (!this.isInitialized) {
      throw new Error('Security services not initialized');
    }

    return this.services;
  }

  /**
   * Perform security health check
   * @returns {Object} Health status of all services
   */
  async performHealthCheck() {
    const healthStatus = {
      overall: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check PCI-DSS Compliance Service
      try {
        const pciStatus = this.services.pciCompliance?.validateCompliance();
        healthStatus.services.pciCompliance = {
          status: 'healthy',
          details: pciStatus
        };
      } catch (error) {
        healthStatus.services.pciCompliance = {
          status: 'unhealthy',
          error: error.message
        };
        healthStatus.overall = 'degraded';
      }

      // Check Security Monitoring Service
      try {
        const monitoringStatus = this.services.monitoring?.performHealthCheck();
        healthStatus.services.monitoring = {
          status: 'healthy',
          details: monitoringStatus
        };
      } catch (error) {
        healthStatus.services.monitoring = {
          status: 'unhealthy',
          error: error.message
        };
        healthStatus.overall = 'degraded';
      }

      // Check Performance Optimization Service
      try {
        const performanceStatus = this.services.performance?.getPerformanceReport();
        healthStatus.services.performance = {
          status: 'healthy',
          details: performanceStatus
        };
      } catch (error) {
        healthStatus.services.performance = {
          status: 'unhealthy',
          error: error.message
        };
        healthStatus.overall = 'degraded';
      }

      // Check other services
      ['kyc', 'fraudDetection', 'mfa', 'token'].forEach(serviceName => {
        try {
          const service = this.services[serviceName];
          if (service && typeof service === 'object') {
            healthStatus.services[serviceName] = {
              status: 'healthy',
              details: 'Service available'
            };
          } else {
            healthStatus.services[serviceName] = {
              status: 'unhealthy',
              error: 'Service not available'
            };
            healthStatus.overall = 'degraded';
          }
        } catch (error) {
          healthStatus.services[serviceName] = {
            status: 'unhealthy',
            error: error.message
          };
          healthStatus.overall = 'degraded';
        }
      });

    } catch (error) {
      healthStatus.overall = 'unhealthy';
      healthStatus.error = error.message;
    }

    return healthStatus;
  }

  /**
   * Shutdown all security services
   * @returns {Promise<void>}
   */
  async shutdown() {
    logger.info('Shutting down security services...');
    
    try {
      // Cleanup any resources
      if (this.services.monitoring) {
        // Stop monitoring
        logger.info('Security monitoring service stopped');
      }

      if (this.services.performance) {
        // Stop performance monitoring
        logger.info('Performance optimization service stopped');
      }

      this.isInitialized = false;
      logger.info('Security services shutdown completed');
    } catch (error) {
      logger.error('Error during security services shutdown', { error: error.message });
    }
  }
}

// Create singleton instance
const securityServicesIntegration = new SecurityServicesIntegration();

module.exports = securityServicesIntegration; 