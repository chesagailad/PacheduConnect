/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: auditLogger - handles backend functionality
 */

const { logger } = require('./logger');
const crypto = require('crypto');

class AuditLogger {
  constructor() {
    this.auditLevels = {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      CRITICAL: 'critical'
    };
    
    this.eventTypes = {
      // Payment events
      PAYMENT_INITIATED: 'payment_initiated',
      PAYMENT_COMPLETED: 'payment_completed',
      PAYMENT_FAILED: 'payment_failed',
      PAYMENT_CANCELLED: 'payment_cancelled',
      
      // Card data events
      CARD_DATA_ACCESSED: 'card_data_accessed',
      CARD_DATA_ENCRYPTED: 'card_data_encrypted',
      CARD_DATA_DECRYPTED: 'card_data_decrypted',
      CARD_DATA_STORED: 'card_data_stored',
      CARD_DATA_DELETED: 'card_data_deleted',
      
      // Bank account events
      BANK_DATA_ACCESSED: 'bank_data_accessed',
      BANK_DATA_ENCRYPTED: 'bank_data_encrypted',
      BANK_DATA_DECRYPTED: 'bank_data_decrypted',
      BANK_DATA_STORED: 'bank_data_stored',
      BANK_DATA_DELETED: 'bank_data_deleted',
      
      // Authentication events
      USER_LOGIN: 'user_login',
      USER_LOGOUT: 'user_logout',
      LOGIN_FAILED: 'login_failed',
      PASSWORD_CHANGED: 'password_changed',
      PASSWORD_RESET: 'password_reset',
      
      // Authorization events
      ACCESS_GRANTED: 'access_granted',
      ACCESS_DENIED: 'access_denied',
      PERMISSION_CHANGED: 'permission_changed',
      
      // System events
      SYSTEM_STARTUP: 'system_startup',
      SYSTEM_SHUTDOWN: 'system_shutdown',
      CONFIGURATION_CHANGED: 'configuration_changed',
      SECURITY_ALERT: 'security_alert'
    };
  }

  /**
   * Log a payment operation with full audit trail
   */
  logPaymentOperation(eventType, data, user = null, ip = null) {
    const auditData = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: user?.id || 'anonymous',
      userEmail: user?.email || 'anonymous',
      ipAddress: ip || 'unknown',
      sessionId: this.generateSessionId(),
      data: this.sanitizePaymentData(data),
      severity: this.getEventSeverity(eventType),
      compliance: {
        pciDss: true,
        gdpr: true,
        sox: true
      }
    };

    logger.info('Payment Audit Event', auditData);
    
    // Store in audit database if needed
    this.storeAuditRecord(auditData);
    
    return auditData.sessionId;
  }

  /**
   * Log sensitive data access
   */
  logDataAccess(eventType, dataType, userId, ip, success = true) {
    const auditData = {
      timestamp: new Date().toISOString(),
      eventType,
      dataType,
      userId,
      ipAddress: ip || 'unknown',
      sessionId: this.generateSessionId(),
      success,
      severity: success ? this.auditLevels.INFO : this.auditLevels.WARNING,
      compliance: {
        pciDss: true,
        gdpr: true
      }
    };

    logger.info('Data Access Audit Event', auditData);
    this.storeAuditRecord(auditData);
    
    return auditData.sessionId;
  }

  /**
   * Log authentication events
   */
  logAuthentication(eventType, user = null, ip = null, success = true, details = {}) {
    const auditData = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: user?.id || 'anonymous',
      userEmail: user?.email || 'anonymous',
      ipAddress: ip || 'unknown',
      sessionId: this.generateSessionId(),
      success,
      details: this.sanitizeAuthDetails(details),
      severity: success ? this.auditLevels.INFO : this.auditLevels.WARNING,
      compliance: {
        pciDss: true,
        gdpr: true
      }
    };

    logger.info('Authentication Audit Event', auditData);
    this.storeAuditRecord(auditData);
    
    return auditData.sessionId;
  }

  /**
   * Log security alerts
   */
  logSecurityAlert(alertType, details, severity = 'warning', user = null, ip = null) {
    const auditData = {
      timestamp: new Date().toISOString(),
      eventType: this.eventTypes.SECURITY_ALERT,
      alertType,
      userId: user?.id || 'system',
      userEmail: user?.email || 'system',
      ipAddress: ip || 'unknown',
      sessionId: this.generateSessionId(),
      details,
      severity: this.auditLevels[severity.toUpperCase()] || this.auditLevels.WARNING,
      compliance: {
        pciDss: true,
        gdpr: true
      }
    };

    logger.warn('Security Alert', auditData);
    this.storeAuditRecord(auditData);
    
    // Trigger security notifications if critical
    if (severity === 'critical') {
      this.triggerSecurityNotification(auditData);
    }
    
    return auditData.sessionId;
  }

  /**
   * Log system configuration changes
   */
  logConfigurationChange(component, oldValue, newValue, user = null) {
    const auditData = {
      timestamp: new Date().toISOString(),
      eventType: this.eventTypes.CONFIGURATION_CHANGED,
      component,
      oldValue: this.sanitizeConfigValue(oldValue),
      newValue: this.sanitizeConfigValue(newValue),
      userId: user?.id || 'system',
      userEmail: user?.email || 'system',
      sessionId: this.generateSessionId(),
      severity: this.auditLevels.INFO,
      compliance: {
        pciDss: true,
        sox: true
      }
    };

    logger.info('Configuration Change Audit Event', auditData);
    this.storeAuditRecord(auditData);
    
    return auditData.sessionId;
  }

  /**
   * Generate a unique session ID for tracking
   */
  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get event severity level
   */
  getEventSeverity(eventType) {
    const criticalEvents = [
      this.eventTypes.PAYMENT_FAILED,
      this.eventTypes.CARD_DATA_ACCESSED,
      this.eventTypes.BANK_DATA_ACCESSED,
      this.eventTypes.ACCESS_DENIED,
      this.eventTypes.SECURITY_ALERT
    ];
    
    const warningEvents = [
      this.eventTypes.LOGIN_FAILED,
      this.eventTypes.PAYMENT_CANCELLED
    ];
    
    if (criticalEvents.includes(eventType)) {
      return this.auditLevels.CRITICAL;
    } else if (warningEvents.includes(eventType)) {
      return this.auditLevels.WARNING;
    } else {
      return this.auditLevels.INFO;
    }
  }

  /**
   * Sanitize payment data for logging (remove sensitive info)
   */
  sanitizePaymentData(data) {
    if (!data) return {};
    
    const sanitized = { ...data };
    
    // Remove sensitive payment fields
    const sensitiveFields = [
      'cardNumber', 'cvv', 'expiryMonth', 'expiryYear',
      'accountNumber', 'routingNumber', 'password',
      'token', 'secret', 'key'
    ];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    // Mask amounts if needed
    if (sanitized.amount) {
      sanitized.amount = `$${parseFloat(sanitized.amount).toFixed(2)}`;
    }
    
    return sanitized;
  }

  /**
   * Sanitize authentication details
   */
  sanitizeAuthDetails(details) {
    if (!details) return {};
    
    const sanitized = { ...details };
    
    // Remove sensitive auth fields
    const sensitiveFields = ['password', 'token', 'secret', 'otp'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize configuration values
   */
  sanitizeConfigValue(value) {
    if (!value) return value;
    
    const sensitiveConfigs = ['password', 'secret', 'key', 'token'];
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    
    for (const sensitive of sensitiveConfigs) {
      if (valueStr.toLowerCase().includes(sensitive)) {
        return '[REDACTED]';
      }
    }
    
    return value;
  }

  /**
   * Store audit record in database (placeholder)
   */
  storeAuditRecord(auditData) {
    // TODO: Implement database storage for audit records
    // This would store records in a separate audit table
    // with proper indexing for compliance reporting
  }

  /**
   * Trigger security notifications
   */
  triggerSecurityNotification(auditData) {
    // TODO: Implement security notification system
    // This could send alerts to security team, SIEM, etc.
    logger.critical('Security Alert Triggered', auditData);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate, endDate, eventTypes = []) {
    // TODO: Implement compliance reporting
    // This would generate reports for PCI-DSS, GDPR, SOX compliance
    return {
      period: { startDate, endDate },
      totalEvents: 0,
      criticalEvents: 0,
      securityAlerts: 0,
      dataAccessEvents: 0,
      paymentEvents: 0
    };
  }

  /**
   * Search audit logs
   */
  searchAuditLogs(criteria) {
    // TODO: Implement audit log search functionality
    // This would allow searching through audit logs for compliance
    return [];
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger; 