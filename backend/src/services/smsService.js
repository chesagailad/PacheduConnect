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