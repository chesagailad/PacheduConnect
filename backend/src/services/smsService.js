const axios = require('axios');
const { logger } = require('../utils/logger');

class SMSService {
  constructor() {
    this.clientId = process.env.SMSPORTAL_CLIENT_ID;
    this.clientSecret = process.env.SMSPORTAL_CLIENT_SECRET;
    this.apiKey = process.env.SMSPORTAL_API_KEY;
    this.baseURL = 'https://rest.smsportal.com/v1';
    this.tokenURL = 'https://rest.smsportal.com/Authentication';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.authMethod = this.apiKey ? 'api_key' : 'oauth';
  }

  async getAccessToken() {
    try {
      if (this.authMethod === 'api_key') {
        return null;
      }
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }
      // Patch: Use form data and Basic Auth as in the working test script
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(this.tokenURL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`
        }
      });
      this.accessToken = response.data.token;
      const expiresInMs = (response.data.expiresInMinutes ? response.data.expiresInMinutes * 60 * 1000 : 10 * 60 * 60 * 1000) - 60000;
      this.tokenExpiry = Date.now() + expiresInMs;
      logger.info('SMSPortal access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to obtain SMSPortal access token:', error.message);
      if (error.response) {
        logger.error('Token API Error:', error.response.data);
      }
      throw new Error('Failed to authenticate with SMSPortal');
    }
  }

  async sendSMS(phoneNumber, message) {
    try {
      const token = await this.getAccessToken();
      // Patch: Use the exact payload and headers as in the working test script
      const payload = {
        messages: [
          {
            content: message,
            destination: phoneNumber
          }
        ]
      };
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const response = await axios.post('https://rest.smsportal.com/BulkMessages', payload, { headers });
      logger.info(`SMS sent successfully to ${phoneNumber}`, {
        response: response.data
      });
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      logger.error('SMS sending failed:', error.message);
      if (error.response) {
        logger.error('SMSPortal API error:', error.response.data);
      }
      // Add detailed error logging
      if (error.response && error.response.data) {
        throw new Error('Failed to send SMS: ' + JSON.stringify(error.response.data));
      }
      throw new Error('Failed to send SMS: ' + error.message);
    }
  }

  async sendOTP(phoneNumber, otp) {
    const message = `Your PacheduConnect verification code is: ${otp}. Valid for 10 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendTestOTP(phoneNumber, otp) {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] SMS OTP would be sent to ${phoneNumber}: ${otp}`);
      return {
        success: true,
        messageId: 'dev-test-id',
        status: 'delivered'
      };
    }
    return this.sendOTP(phoneNumber, otp);
  }

<<<<<<< HEAD
  // Chatbot SMS Notification Templates
  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    if (typeof phoneNumber !== 'string') {
      throw new Error('Phone number must be a string');
    }
    const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      throw new Error('Invalid South African phone number format');
    }
  }

  /**
   * Validate required fields in data object
   */
  validateRequiredFields(data, requiredFields, dataType = 'data') {
    if (!data || typeof data !== 'object') {
      throw new Error(`${dataType} is required and must be an object`);
    }
    
    const missingFields = requiredFields.filter(field => {
      return !data.hasOwnProperty(field) || data[field] === null || data[field] === undefined || data[field] === '';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required ${dataType} fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Check message length and log warning if exceeds SMS limit
   */
  validateMessageLength(message) {
    if (message.length > 160) {
      console.warn(`SMS Warning: Message exceeds 160 characters (${message.length} chars). May be sent as multiple SMS or truncated.`);
    }
  }

  async sendTransactionAlert(phoneNumber, transactionData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(transactionData, ['amount', 'currency', 'recipient', 'reference', 'status'], 'transactionData');
    
    const { amount, currency, recipient, reference, status } = transactionData;
    const message = `PacheduConnect Alert: Your ${currency} ${amount} transfer to ${recipient} is ${status}. Reference: ${reference}. Support: +27123456789`;
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendExchangeRateAlert(phoneNumber, rateData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(rateData, ['fromCurrency', 'toCurrency', 'rate', 'amount', 'recipientAmount'], 'rateData');
    
    const { fromCurrency, toCurrency, rate, amount, recipientAmount } = rateData;
    const message = `Rate Alert: 1 ${fromCurrency} = ${rate} ${toCurrency}. Your ${fromCurrency} ${amount} = ${toCurrency} ${recipientAmount}. Lock rate at pacheduconnect.com`;
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendDocumentAlert(phoneNumber, docData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(docData, ['documentType', 'status'], 'docData');
    
    // Additional validation for rejected status
    if (docData.status === 'rejected' && !docData.nextSteps) {
      throw new Error('nextSteps is required when document status is rejected');
    }
    
    const { documentType, status, nextSteps } = docData;
    let message;
    if (status === 'approved') {
      message = `Good news! Your ${documentType} has been approved. You can now send up to R50,000/month. Start sending at pacheduconnect.com`;
    } else if (status === 'rejected') {
      message = `Document Update Required: Your ${documentType} needs attention. ${nextSteps}. Upload at pacheduconnect.com/profile`;
    } else {
      message = `Document Received: Your ${documentType} is being reviewed. You'll hear from us within 2-4 hours. Check status at pacheduconnect.com`;
    }
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendSecurityAlert(phoneNumber, alertData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(alertData, ['alertType'], 'alertData');
    
    // Additional validation based on alert type
    if (['login', 'password_change'].includes(alertData.alertType)) {
      this.validateRequiredFields(alertData, ['time'], 'alertData');
    }
    if (alertData.alertType === 'login' && !alertData.location) {
      throw new Error('location is required for login security alerts');
    }
    
    const { alertType, location, time } = alertData;
    let message;
    if (alertType === 'login') {
      message = `Security Alert: New login to your PacheduConnect account from ${location} at ${time}. If this wasn't you, secure your account immediately.`;
    } else if (alertType === 'password_change') {
      message = `Security Alert: Your PacheduConnect password was changed at ${time}. If this wasn't you, contact us immediately on +27123456789`;
    } else if (alertType === 'suspicious_activity') {
      message = `Security Alert: Suspicious activity detected on your account. We've temporarily secured it. Contact support: +27123456789`;
    } else {
      throw new Error(`Invalid alertType: ${alertType}. Must be 'login', 'password_change', or 'suspicious_activity'`);
    }
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendEscalationAlert(phoneNumber, escalationData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(escalationData, ['ticketNumber', 'estimatedWaitTime', 'agentName'], 'escalationData');
    
    const { ticketNumber, estimatedWaitTime, agentName } = escalationData;
    const message = `PacheduConnect Support: Your request #${ticketNumber} has been escalated. Agent ${agentName} will assist you in ~${estimatedWaitTime} mins. We'll call you soon.`;
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendPromoAlert(phoneNumber, promoData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(promoData, ['discount', 'validUntil', 'code'], 'promoData');
    
    const { discount, validUntil, code } = promoData;
    const message = `🎉 Special Offer: Send money home with ${discount}% OFF! Use code ${code}. Valid until ${validUntil}. Send now: pacheduconnect.com`;
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendMaintenanceAlert(phoneNumber, maintenanceData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(maintenanceData, ['service', 'startTime', 'duration', 'alternative'], 'maintenanceData');
    
    const { service, startTime, duration, alternative } = maintenanceData;
    const message = `Maintenance Notice: ${service} will be unavailable from ${startTime} for ${duration}. ${alternative}. We apologize for any inconvenience.`;
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  async sendChatbotFollowUp(phoneNumber, followUpData) {
    // Input validation
    this.validatePhoneNumber(phoneNumber);
    this.validateRequiredFields(followUpData, ['query', 'suggestedAction', 'helpUrl'], 'followUpData');
    
    const { query, suggestedAction, helpUrl } = followUpData;
    const message = `Follow-up: You asked about "${query}". Suggested next step: ${suggestedAction}. Need help? ${helpUrl} or reply HELP.`;
    
    // Check message length
    this.validateMessageLength(message);
    
    return this.sendSMS(phoneNumber, message);
  }

  // Test authentication
  async testAuth() {
    try {
      const token = await this.getAccessToken();
      return { success: true, token };
    } catch (error) {
      logger.error('SMSPortal authentication failed:', error.message);
      if (error.response) {
        logger.error('API Error:', error.response.data);
      }
      throw new Error('SMS service authentication failed');
    }
  }
}

module.exports = new SMSService(); 