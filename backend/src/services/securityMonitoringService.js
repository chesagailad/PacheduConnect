/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: Real-time Security Monitoring Service
 */

const EventEmitter = require('events');
const { logger } = require('../utils/logger');
const pciComplianceService = require('./pciComplianceService');

/**
 * Real-time Security Monitoring Service
 * 
 * Provides comprehensive security monitoring:
 * - Real-time threat detection
 * - Security event correlation
 * - Automated incident response
 * - Performance monitoring
 * - Security metrics and reporting
 */
class SecurityMonitoringService extends EventEmitter {
  constructor() {
    super();
    
    this.securityEvents = [];
    this.activeThreats = new Map();
    this.incidentQueue = [];
    this.metrics = {
      totalEvents: 0,
      threatsDetected: 0,
      incidentsCreated: 0,
      alertsSent: 0,
      responseTime: 0
    };
    
    this.threatPatterns = {
      bruteForce: {
        pattern: /failed_login_attempt/i,
        threshold: 5,
        timeWindow: 15 * 60 * 1000, // 15 minutes
        severity: 'HIGH'
      },
      sqlInjection: {
        pattern: /sql_injection_attempt/i,
        threshold: 1,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        severity: 'CRITICAL'
      },
      xssAttack: {
        pattern: /xss_attempt/i,
        threshold: 1,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        severity: 'CRITICAL'
      },
      suspiciousActivity: {
        pattern: /suspicious_activity/i,
        threshold: 3,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        severity: 'MEDIUM'
      },
      dataBreach: {
        pattern: /data_breach|unauthorized_access/i,
        threshold: 1,
        timeWindow: 1 * 60 * 1000, // 1 minute
        severity: 'CRITICAL'
      }
    };
    
    this.alertChannels = {
      email: process.env.SECURITY_EMAIL,
      slack: process.env.SLACK_WEBHOOK_URL,
      sms: process.env.SECURITY_SMS_NUMBER,
      webhook: process.env.SECURITY_WEBHOOK_URL
    };
    
    this.startMonitoring();
  }

  /**
   * Start real-time security monitoring
   */
  startMonitoring() {
    logger.info('Security monitoring service started');
    
    // Set up periodic health checks
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Set up metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 60 * 1000); // Every minute
    
    // Set up incident processing
    setInterval(() => {
      this.processIncidentQueue();
    }, 30 * 1000); // Every 30 seconds
  }

  /**
   * Monitor security event in real-time
   * @param {Object} event - Security event
   */
  monitorEvent(event) {
    try {
      const enrichedEvent = this.enrichEvent(event);
      this.securityEvents.push(enrichedEvent);
      this.metrics.totalEvents++;
      
      // Check for threats
      const threats = this.detectThreats(enrichedEvent);
      
      if (threats.length > 0) {
        threats.forEach(threat => {
          this.handleThreat(threat);
        });
      }
      
      // Emit event for real-time processing
      this.emit('securityEvent', enrichedEvent);
      
      // Log event
      logger.info('Security event monitored', {
        eventId: enrichedEvent.id,
        type: enrichedEvent.type,
        severity: enrichedEvent.severity,
        source: enrichedEvent.source
      });
      
    } catch (error) {
      logger.error('Failed to monitor security event', {
        error: error.message,
        event: event
      });
    }
  }

  /**
   * Enrich security event with additional context
   * @param {Object} event - Original event
   * @returns {Object} Enriched event
   */
  enrichEvent(event) {
    return {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity || 'INFO',
      source: event.source,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      details: event.details,
      riskScore: this.calculateRiskScore(event),
      context: this.getEventContext(event),
      metadata: {
        processedAt: new Date().toISOString(),
        enrichmentVersion: '1.0'
      }
    };
  }

  /**
   * Detect threats based on security events
   * @param {Object} event - Security event
   * @returns {Array} Detected threats
   */
  detectThreats(event) {
    const threats = [];
    
    Object.entries(this.threatPatterns).forEach(([threatType, pattern]) => {
      if (pattern.pattern.test(event.type) || pattern.pattern.test(event.details?.message)) {
        const threat = this.createThreat(threatType, event, pattern);
        threats.push(threat);
      }
    });
    
    return threats;
  }

  /**
   * Create threat object
   * @param {string} threatType - Type of threat
   * @param {Object} event - Triggering event
   * @param {Object} pattern - Threat pattern
   * @returns {Object} Threat object
   */
  createThreat(threatType, event, pattern) {
    const threatId = this.generateThreatId();
    
    return {
      id: threatId,
      type: threatType,
      severity: pattern.severity,
      source: event.source,
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: new Date().toISOString(),
      triggerEvent: event,
      pattern: pattern,
      status: 'ACTIVE',
      responseActions: this.getResponseActions(threatType, pattern.severity)
    };
  }

  /**
   * Handle detected threat
   * @param {Object} threat - Threat object
   */
  async handleThreat(threat) {
    try {
      this.metrics.threatsDetected++;
      this.activeThreats.set(threat.id, threat);
      
      // Log threat detection
      logger.warn('Security threat detected', {
        threatId: threat.id,
        type: threat.type,
        severity: threat.severity,
        source: threat.source,
        userId: threat.userId,
        ipAddress: threat.ipAddress
      });
      
      // Create incident
      const incident = await this.createIncident(threat);
      
      // Send alerts
      await this.sendAlerts(threat, incident);
      
      // Execute response actions
      await this.executeResponseActions(threat);
      
      // Emit threat event
      this.emit('threatDetected', threat);
      
    } catch (error) {
      logger.error('Failed to handle threat', {
        threatId: threat.id,
        error: error.message
      });
    }
  }

  /**
   * Create security incident
   * @param {Object} threat - Threat object
   * @returns {Object} Incident object
   */
  async createIncident(threat) {
    const incident = {
      id: this.generateIncidentId(),
      threatId: threat.id,
      type: threat.type,
      severity: threat.severity,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: threat.source,
      userId: threat.userId,
      ipAddress: threat.ipAddress,
      description: this.generateIncidentDescription(threat),
      responseActions: threat.responseActions,
      timeline: [{
        timestamp: new Date().toISOString(),
        action: 'INCIDENT_CREATED',
        details: 'Security incident created from threat detection'
      }]
    };
    
    this.incidentQueue.push(incident);
    this.metrics.incidentsCreated++;
    
    logger.info('Security incident created', {
      incidentId: incident.id,
      threatId: threat.id,
      type: incident.type,
      severity: incident.severity
    });
    
    return incident;
  }

  /**
   * Send security alerts
   * @param {Object} threat - Threat object
   * @param {Object} incident - Incident object
   */
  async sendAlerts(threat, incident) {
    try {
      const alertMessage = this.generateAlertMessage(threat, incident);
      
      // Send to all configured channels
      const alertPromises = [];
      
      if (this.alertChannels.email) {
        alertPromises.push(this.sendEmailAlert(alertMessage));
      }
      
      if (this.alertChannels.slack) {
        alertPromises.push(this.sendSlackAlert(alertMessage));
      }
      
      if (this.alertChannels.sms) {
        alertPromises.push(this.sendSMSAlert(alertMessage));
      }
      
      if (this.alertChannels.webhook) {
        alertPromises.push(this.sendWebhookAlert(alertMessage));
      }
      
      await Promise.allSettled(alertPromises);
      this.metrics.alertsSent++;
      
      logger.info('Security alerts sent', {
        threatId: threat.id,
        incidentId: incident.id,
        channels: Object.keys(this.alertChannels).filter(channel => this.alertChannels[channel])
      });
      
    } catch (error) {
      logger.error('Failed to send security alerts', {
        threatId: threat.id,
        error: error.message
      });
    }
  }

  /**
   * Execute response actions for threat
   * @param {Object} threat - Threat object
   */
  async executeResponseActions(threat) {
    try {
      const startTime = Date.now();
      
      for (const action of threat.responseActions) {
        await this.executeAction(action, threat);
      }
      
      const responseTime = Date.now() - startTime;
      this.metrics.responseTime = (this.metrics.responseTime + responseTime) / 2;
      
      logger.info('Response actions executed', {
        threatId: threat.id,
        actions: threat.responseActions.map(a => a.type),
        responseTime
      });
      
    } catch (error) {
      logger.error('Failed to execute response actions', {
        threatId: threat.id,
        error: error.message
      });
    }
  }

  /**
   * Execute individual response action
   * @param {Object} action - Response action
   * @param {Object} threat - Threat object
   */
  async executeAction(action, threat) {
    try {
      switch (action.type) {
        case 'BLOCK_IP':
          await this.blockIP(threat.ipAddress, action.duration);
          break;
        case 'LOCK_ACCOUNT':
          await this.lockAccount(threat.userId, action.duration);
          break;
        case 'ENABLE_MFA':
          await this.enableMFA(threat.userId);
          break;
        case 'INCREASE_MONITORING':
          await this.increaseMonitoring(threat.userId);
          break;
        case 'NOTIFY_ADMIN':
          await this.notifyAdmin(threat);
          break;
        default:
          logger.warn('Unknown response action type', {
            actionType: action.type,
            threatId: threat.id
          });
      }
    } catch (error) {
      logger.error('Failed to execute response action', {
        actionType: action.type,
        threatId: threat.id,
        error: error.message
      });
    }
  }

  /**
   * Get response actions for threat type and severity
   * @param {string} threatType - Threat type
   * @param {string} severity - Threat severity
   * @returns {Array} Response actions
   */
  getResponseActions(threatType, severity) {
    const actions = [];
    
    switch (severity) {
      case 'CRITICAL':
        actions.push(
          { type: 'BLOCK_IP', duration: 24 * 60 * 60 * 1000 }, // 24 hours
          { type: 'LOCK_ACCOUNT', duration: 24 * 60 * 60 * 1000 }, // 24 hours
          { type: 'NOTIFY_ADMIN', immediate: true }
        );
        break;
      case 'HIGH':
        actions.push(
          { type: 'BLOCK_IP', duration: 60 * 60 * 1000 }, // 1 hour
          { type: 'ENABLE_MFA', immediate: true },
          { type: 'NOTIFY_ADMIN', immediate: true }
        );
        break;
      case 'MEDIUM':
        actions.push(
          { type: 'INCREASE_MONITORING', duration: 60 * 60 * 1000 }, // 1 hour
          { type: 'NOTIFY_ADMIN', immediate: false }
        );
        break;
      case 'LOW':
        actions.push(
          { type: 'INCREASE_MONITORING', duration: 30 * 60 * 1000 } // 30 minutes
        );
        break;
    }
    
    return actions;
  }

  /**
   * Calculate risk score for event
   * @param {Object} event - Security event
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(event) {
    let score = 0;
    
    // Base score based on event type
    switch (event.type) {
      case 'failed_login':
        score += 10;
        break;
      case 'suspicious_activity':
        score += 20;
        break;
      case 'sql_injection_attempt':
        score += 80;
        break;
      case 'xss_attempt':
        score += 70;
        break;
      case 'data_breach':
        score += 100;
        break;
    }
    
    // Adjust based on frequency
    const recentEvents = this.getRecentEvents(event.userId, 60 * 60 * 1000); // 1 hour
    score += recentEvents.length * 5;
    
    // Adjust based on IP reputation
    if (this.isKnownMaliciousIP(event.ipAddress)) {
      score += 30;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Get event context
   * @param {Object} event - Security event
   * @returns {Object} Event context
   */
  getEventContext(event) {
    return {
      userAgent: event.userAgent,
      referrer: event.referrer,
      location: event.location,
      deviceInfo: event.deviceInfo,
      sessionInfo: event.sessionInfo
    };
  }

  /**
   * Generate incident description
   * @param {Object} threat - Threat object
   * @returns {string} Incident description
   */
  generateIncidentDescription(threat) {
    const descriptions = {
      bruteForce: `Brute force attack detected from IP ${threat.ipAddress}`,
      sqlInjection: `SQL injection attempt detected from IP ${threat.ipAddress}`,
      xssAttack: `XSS attack attempt detected from IP ${threat.ipAddress}`,
      suspiciousActivity: `Suspicious activity detected from user ${threat.userId}`,
      dataBreach: `Potential data breach detected from IP ${threat.ipAddress}`
    };
    
    return descriptions[threat.type] || `Security threat detected: ${threat.type}`;
  }

  /**
   * Generate alert message
   * @param {Object} threat - Threat object
   * @param {Object} incident - Incident object
   * @returns {Object} Alert message
   */
  generateAlertMessage(threat, incident) {
    return {
      subject: `🚨 Security Alert: ${threat.type.toUpperCase()} Detected`,
      body: `
🚨 SECURITY ALERT

Incident ID: ${incident.id}
Threat Type: ${threat.type}
Severity: ${threat.severity}
Source: ${threat.source}
User ID: ${threat.userId || 'Unknown'}
IP Address: ${threat.ipAddress}
Timestamp: ${threat.timestamp}

Description: ${incident.description}

Response Actions: ${threat.responseActions.map(a => a.type).join(', ')}

Please review and take appropriate action immediately.
      `.trim(),
      priority: threat.severity === 'CRITICAL' ? 'high' : 'normal'
    };
  }

  /**
   * Send email alert
   * @param {Object} alertMessage - Alert message
   */
  async sendEmailAlert(alertMessage) {
    // In production, this would use a proper email service
    logger.info('Email alert sent', {
      to: this.alertChannels.email,
      subject: alertMessage.subject,
      priority: alertMessage.priority
    });
  }

  /**
   * Send Slack alert
   * @param {Object} alertMessage - Alert message
   */
  async sendSlackAlert(alertMessage) {
    // In production, this would use Slack webhook
    logger.info('Slack alert sent', {
      webhook: this.alertChannels.slack,
      message: alertMessage.body
    });
  }

  /**
   * Send SMS alert
   * @param {Object} alertMessage - Alert message
   */
  async sendSMSAlert(alertMessage) {
    // In production, this would use SMS service
    logger.info('SMS alert sent', {
      to: this.alertChannels.sms,
      message: alertMessage.body
    });
  }

  /**
   * Send webhook alert
   * @param {Object} alertMessage - Alert message
   */
  async sendWebhookAlert(alertMessage) {
    // In production, this would make HTTP request
    logger.info('Webhook alert sent', {
      url: this.alertChannels.webhook,
      payload: alertMessage
    });
  }

  /**
   * Block IP address
   * @param {string} ipAddress - IP address to block
   * @param {number} duration - Block duration in milliseconds
   */
  async blockIP(ipAddress, duration) {
    // In production, this would update firewall rules
    logger.info('IP address blocked', {
      ipAddress,
      duration,
      expiresAt: new Date(Date.now() + duration).toISOString()
    });
  }

  /**
   * Lock user account
   * @param {string} userId - User ID to lock
   * @param {number} duration - Lock duration in milliseconds
   */
  async lockAccount(userId, duration) {
    // In production, this would update user status in database
    logger.info('User account locked', {
      userId,
      duration,
      expiresAt: new Date(Date.now() + duration).toISOString()
    });
  }

  /**
   * Enable MFA for user
   * @param {string} userId - User ID
   */
  async enableMFA(userId) {
    // In production, this would enable MFA for the user
    logger.info('MFA enabled for user', { userId });
  }

  /**
   * Increase monitoring for user
   * @param {string} userId - User ID
   */
  async increaseMonitoring(userId) {
    // In production, this would increase monitoring level
    logger.info('Increased monitoring for user', { userId });
  }

  /**
   * Notify admin
   * @param {Object} threat - Threat object
   */
  async notifyAdmin(threat) {
    // In production, this would notify administrators
    logger.info('Admin notified of threat', {
      threatId: threat.id,
      type: threat.type,
      severity: threat.severity
    });
  }

  /**
   * Process incident queue
   */
  processIncidentQueue() {
    while (this.incidentQueue.length > 0) {
      const incident = this.incidentQueue.shift();
      this.emit('incidentProcessed', incident);
    }
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      activeThreats: this.activeThreats.size,
      pendingIncidents: this.incidentQueue.length
    };
    
    logger.info('Security monitoring health check', health);
    this.emit('healthCheck', health);
  }

  /**
   * Collect metrics
   */
  collectMetrics() {
    const metrics = {
      ...this.metrics,
      activeThreats: this.activeThreats.size,
      pendingIncidents: this.incidentQueue.length,
      eventRate: this.calculateEventRate(),
      threatRate: this.calculateThreatRate()
    };
    
    this.emit('metricsCollected', metrics);
  }

  /**
   * Calculate event rate
   * @returns {number} Events per minute
   */
  calculateEventRate() {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentEvents = this.securityEvents.filter(event => 
      new Date(event.timestamp).getTime() > oneMinuteAgo
    );
    return recentEvents.length;
  }

  /**
   * Calculate threat rate
   * @returns {number} Threats per minute
   */
  calculateThreatRate() {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentThreats = Array.from(this.activeThreats.values()).filter(threat =>
      new Date(threat.timestamp).getTime() > oneMinuteAgo
    );
    return recentThreats.length;
  }

  /**
   * Get recent events for user
   * @param {string} userId - User ID
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array} Recent events
   */
  getRecentEvents(userId, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.securityEvents.filter(event =>
      event.userId === userId && new Date(event.timestamp).getTime() > cutoff
    );
  }

  /**
   * Check if IP is known malicious
   * @param {string} ipAddress - IP address
   * @returns {boolean} Is malicious
   */
  isKnownMaliciousIP(ipAddress) {
    // In production, this would check against threat intelligence feeds
    return false;
  }

  /**
   * Generate event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Generate threat ID
   * @returns {string} Threat ID
   */
  generateThreatId() {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Generate incident ID
   * @returns {string} Incident ID
   */
  generateIncidentId() {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Get security dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboardData() {
    return {
      metrics: this.metrics,
      activeThreats: Array.from(this.activeThreats.values()),
      recentEvents: this.securityEvents.slice(-50), // Last 50 events
      pendingIncidents: this.incidentQueue,
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
  }
}

// Export singleton instance
module.exports = new SecurityMonitoringService(); 