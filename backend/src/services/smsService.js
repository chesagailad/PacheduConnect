const axios = require('axios');
const { logger } = require('../utils/logger');

class SMSService {
  constructor() {
    this.clientId = process.env.SMSPORTAL_CLIENT_ID;
    this.clientSecret = process.env.SMSPORTAL_CLIENT_SECRET;
    this.baseURL = 'https://rest.smsportal.com/v1';
    this.tokenURL = 'https://rest.smsportal.com/v1/auth';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');

      // HTTP Basic Auth header
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(this.tokenURL, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`
        }
      });

      this.accessToken = response.data.access_token;
      // Set token expiry (subtract 60 seconds for safety)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

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
      
      const payload = {
        messages: [
          {
            content: message,
            destination: phoneNumber,
            scheduled: null
          }
        ]
      };

      const response = await axios.post(`${this.baseURL}/bulkmessages`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`SMS sent successfully to ${phoneNumber}`, {
        messageId: response.data.messages[0].id,
        status: response.data.messages[0].status
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: response.data.messages[0].status
      };
    } catch (error) {
      logger.error('SMS sending failed:', error.message);
      
      if (error.response) {
        logger.error('SMSPortal API error:', error.response.data);
      }

      throw new Error('Failed to send SMS');
    }
  }

  async sendOTP(phoneNumber, otp) {
    const message = `Your PacheduConnect verification code is: ${otp}. Valid for 10 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }

  // For development/testing purposes
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

  // Chatbot SMS Notification Templates
  async sendTransactionAlert(phoneNumber, transactionData) {
    const { amount, currency, recipient, reference, status } = transactionData;
    const message = `PacheduConnect Alert: Your ${currency} ${amount} transfer to ${recipient} is ${status}. Reference: ${reference}. Support: +27123456789`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendExchangeRateAlert(phoneNumber, rateData) {
    const { fromCurrency, toCurrency, rate, amount, recipientAmount } = rateData;
    const message = `Rate Alert: 1 ${fromCurrency} = ${rate} ${toCurrency}. Your ${fromCurrency} ${amount} = ${toCurrency} ${recipientAmount}. Lock rate at pacheduconnect.com`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendDocumentAlert(phoneNumber, docData) {
    const { documentType, status, nextSteps } = docData;
    let message;
    if (status === 'approved') {
      message = `Good news! Your ${documentType} has been approved. You can now send up to R50,000/month. Start sending at pacheduconnect.com`;
    } else if (status === 'rejected') {
      message = `Document Update Required: Your ${documentType} needs attention. ${nextSteps}. Upload at pacheduconnect.com/profile`;
    } else {
      message = `Document Received: Your ${documentType} is being reviewed. You'll hear from us within 2-4 hours. Check status at pacheduconnect.com`;
    }
    return this.sendSMS(phoneNumber, message);
  }

  async sendSecurityAlert(phoneNumber, alertData) {
    const { alertType, location, time } = alertData;
    let message;
    if (alertType === 'login') {
      message = `Security Alert: New login to your PacheduConnect account from ${location} at ${time}. If this wasn't you, secure your account immediately.`;
    } else if (alertType === 'password_change') {
      message = `Security Alert: Your PacheduConnect password was changed at ${time}. If this wasn't you, contact us immediately on +27123456789`;
    } else if (alertType === 'suspicious_activity') {
      message = `Security Alert: Suspicious activity detected on your account. We've temporarily secured it. Contact support: +27123456789`;
    }
    return this.sendSMS(phoneNumber, message);
  }

  async sendEscalationAlert(phoneNumber, escalationData) {
    const { ticketNumber, estimatedWaitTime, agentName } = escalationData;
    const message = `PacheduConnect Support: Your request #${ticketNumber} has been escalated. Agent ${agentName} will assist you in ~${estimatedWaitTime} mins. We'll call you soon.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendPromoAlert(phoneNumber, promoData) {
    const { discount, validUntil, code } = promoData;
    const message = `🎉 Special Offer: Send money home with ${discount}% OFF! Use code ${code}. Valid until ${validUntil}. Send now: pacheduconnect.com`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendMaintenanceAlert(phoneNumber, maintenanceData) {
    const { service, startTime, duration, alternative } = maintenanceData;
    const message = `Maintenance Notice: ${service} will be unavailable from ${startTime} for ${duration}. ${alternative}. We apologize for any inconvenience.`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendChatbotFollowUp(phoneNumber, followUpData) {
    const { query, suggestedAction, helpUrl } = followUpData;
    const message = `Follow-up: You asked about "${query}". Suggested next step: ${suggestedAction}. Need help? ${helpUrl} or reply HELP.`;
    return this.sendSMS(phoneNumber, message);
  }

  // Test authentication
  async testAuth() {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      logger.info('SMSPortal authentication successful');
      return {
        success: true,
        account: response.data
      };
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