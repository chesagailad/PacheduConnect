const axios = require('axios');
const logger = require('../../utils/logger');

class IntegrationService {
  constructor() {
    this.bankingApis = new Map();
    this.complianceServices = new Map();
    this.thirdPartyServices = new Map();
    this.webhookEndpoints = new Map();
    
    this.setupIntegrations();
  }

  /**
   * Setup integration configurations
   */
  setupIntegrations() {
    // Banking API configurations
    this.bankingApis.set('ecocash', {
      baseUrl: process.env.ECOCASH_API_URL || 'https://api.ecocash.co.zw',
      apiKey: process.env.ECOCASH_API_KEY,
      endpoints: {
        balance: '/v1/balance',
        transfer: '/v1/transfer',
        status: '/v1/transaction/{id}/status'
      }
    });

    this.bankingApis.set('onemoney', {
      baseUrl: process.env.ONEMONEY_API_URL || 'https://api.onemoney.co.zw',
      apiKey: process.env.ONEMONEY_API_KEY,
      endpoints: {
        balance: '/api/balance',
        transfer: '/api/transfer',
        status: '/api/transaction/{id}'
      }
    });

    this.bankingApis.set('innbucks', {
      baseUrl: process.env.INNBUCKS_API_URL || 'https://api.innbucks.co.zw',
      apiKey: process.env.INNBUCKS_API_KEY,
      endpoints: {
        balance: '/balance',
        transfer: '/transfer',
        status: '/transaction/{id}'
      }
    });

    // Compliance service configurations
    this.complianceServices.set('kyc_verification', {
      baseUrl: process.env.KYC_API_URL || 'https://api.kyc.zw',
      apiKey: process.env.KYC_API_KEY,
      endpoints: {
        verify: '/v1/verify',
        validate: '/v1/validate',
        report: '/v1/report'
      }
    });

    this.complianceServices.set('aml_screening', {
      baseUrl: process.env.AML_API_URL || 'https://api.aml.zw',
      apiKey: process.env.AML_API_KEY,
      endpoints: {
        screen: '/v1/screen',
        check: '/v1/check',
        report: '/v1/report'
      }
    });

    // Third-party service configurations
    this.thirdPartyServices.set('exchange_rates', {
      baseUrl: process.env.XE_API_URL || 'https://api.xe.com',
      apiKey: process.env.XE_API_KEY,
      endpoints: {
        rates: '/v1/convert_from.json',
        currencies: '/v1/currencies.json'
      }
    });

    this.thirdPartyServices.set('sms_gateway', {
      baseUrl: process.env.SMSPORTAL_API_URL || 'https://api.smsportal.com',
      apiKey: process.env.SMSPORTAL_API_KEY,
      endpoints: {
        send: '/v1/send',
        status: '/v1/status/{id}'
      }
    });

    // Webhook configurations
    this.webhookEndpoints.set('transaction_webhook', {
      url: process.env.TRANSACTION_WEBHOOK_URL,
      secret: process.env.WEBHOOK_SECRET,
      events: ['transaction.completed', 'transaction.failed', 'transaction.pending']
    });

    this.webhookEndpoints.set('kyc_webhook', {
      url: process.env.KYC_WEBHOOK_URL,
      secret: process.env.WEBHOOK_SECRET,
      events: ['kyc.approved', 'kyc.rejected', 'kyc.pending']
    });
  }

  /**
   * Check banking account balance
   * @param {string} provider - Banking provider
   * @param {string} accountId - Account ID
   * @param {object} credentials - Account credentials
   * @returns {object} Balance information
   */
  async checkBankingBalance(provider, accountId, credentials = {}) {
    try {
      const apiConfig = this.bankingApis.get(provider);
      if (!apiConfig) {
        throw new Error(`Unsupported banking provider: ${provider}`);
      }

      const response = await axios.get(`${apiConfig.baseUrl}${apiConfig.endpoints.balance}`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          account_id: accountId,
          ...credentials
        }
      });

      logger.info('Banking balance checked', {
        provider,
        accountId,
        balance: response.data.balance
      });

      return {
        success: true,
        provider,
        accountId,
        balance: response.data.balance,
        currency: response.data.currency,
        lastUpdated: response.data.last_updated
      };
    } catch (error) {
      logger.error('Banking balance check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initiate banking transfer
   * @param {string} provider - Banking provider
   * @param {object} transferData - Transfer data
   * @returns {object} Transfer result
   */
  async initiateBankingTransfer(provider, transferData) {
    try {
      const apiConfig = this.bankingApis.get(provider);
      if (!apiConfig) {
        throw new Error(`Unsupported banking provider: ${provider}`);
      }

      const response = await axios.post(`${apiConfig.baseUrl}${apiConfig.endpoints.transfer}`, {
        from_account: transferData.fromAccount,
        to_account: transferData.toAccount,
        amount: transferData.amount,
        currency: transferData.currency,
        reference: transferData.reference,
        description: transferData.description
      }, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('Banking transfer initiated', {
        provider,
        transactionId: response.data.transaction_id,
        amount: transferData.amount,
        currency: transferData.currency
      });

      return {
        success: true,
        provider,
        transactionId: response.data.transaction_id,
        status: response.data.status,
        amount: transferData.amount,
        currency: transferData.currency,
        reference: transferData.reference
      };
    } catch (error) {
      logger.error('Banking transfer failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check transaction status
   * @param {string} provider - Banking provider
   * @param {string} transactionId - Transaction ID
   * @returns {object} Transaction status
   */
  async checkTransactionStatus(provider, transactionId) {
    try {
      const apiConfig = this.bankingApis.get(provider);
      if (!apiConfig) {
        throw new Error(`Unsupported banking provider: ${provider}`);
      }

      const url = apiConfig.endpoints.status.replace('{id}', transactionId);
      const response = await axios.get(`${apiConfig.baseUrl}${url}`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('Transaction status checked', {
        provider,
        transactionId,
        status: response.data.status
      });

      return {
        success: true,
        provider,
        transactionId,
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      logger.error('Transaction status check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify KYC documents
   * @param {object} kycData - KYC verification data
   * @returns {object} KYC verification result
   */
  async verifyKYC(kycData) {
    try {
      const apiConfig = this.complianceServices.get('kyc_verification');
      if (!apiConfig) {
        throw new Error('KYC verification service not configured');
      }

      const response = await axios.post(`${apiConfig.baseUrl}${apiConfig.endpoints.verify}`, {
        document_type: kycData.documentType,
        document_number: kycData.documentNumber,
        full_name: kycData.fullName,
        date_of_birth: kycData.dateOfBirth,
        nationality: kycData.nationality,
        document_image: kycData.documentImage,
        selfie_image: kycData.selfieImage
      }, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('KYC verification completed', {
        documentType: kycData.documentType,
        status: response.data.status,
        confidence: response.data.confidence
      });

      return {
        success: true,
        verificationId: response.data.verification_id,
        status: response.data.status,
        confidence: response.data.confidence,
        details: response.data.details
      };
    } catch (error) {
      logger.error('KYC verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform AML screening
   * @param {object} screeningData - AML screening data
   * @returns {object} AML screening result
   */
  async performAMLScreening(screeningData) {
    try {
      const apiConfig = this.complianceServices.get('aml_screening');
      if (!apiConfig) {
        throw new Error('AML screening service not configured');
      }

      const response = await axios.post(`${apiConfig.baseUrl}${apiConfig.endpoints.screen}`, {
        full_name: screeningData.fullName,
        date_of_birth: screeningData.dateOfBirth,
        nationality: screeningData.nationality,
        passport_number: screeningData.passportNumber,
        address: screeningData.address
      }, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('AML screening completed', {
        fullName: screeningData.fullName,
        status: response.data.status,
        riskLevel: response.data.risk_level
      });

      return {
        success: true,
        screeningId: response.data.screening_id,
        status: response.data.status,
        riskLevel: response.data.risk_level,
        matches: response.data.matches || [],
        details: response.data.details
      };
    } catch (error) {
      logger.error('AML screening failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get exchange rates from external API
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {object} Exchange rate information
   */
  async getExchangeRates(fromCurrency, toCurrency) {
    try {
      const apiConfig = this.thirdPartyServices.get('exchange_rates');
      if (!apiConfig) {
        throw new Error('Exchange rates service not configured');
      }

      const response = await axios.get(`${apiConfig.baseUrl}${apiConfig.endpoints.rates}`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          from: fromCurrency,
          to: toCurrency
        }
      });

      logger.info('Exchange rates retrieved', {
        fromCurrency,
        toCurrency,
        rate: response.data.to[0].mid
      });

      return {
        success: true,
        fromCurrency,
        toCurrency,
        rate: response.data.to[0].mid,
        timestamp: response.data.timestamp,
        source: 'xe'
      };
    } catch (error) {
      logger.error('Exchange rates retrieval failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send SMS notification
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   * @returns {object} SMS sending result
   */
  async sendSMS(phoneNumber, message) {
    try {
      const apiConfig = this.thirdPartyServices.get('sms_gateway');
      if (!apiConfig) {
        throw new Error('SMS gateway not configured');
      }

      const response = await axios.post(`${apiConfig.baseUrl}${apiConfig.endpoints.send}`, {
        phone_number: phoneNumber,
        message: message,
        sender_id: 'Pachedu'
      }, {
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('SMS sent successfully', {
        phoneNumber,
        messageId: response.data.message_id,
        status: response.data.status
      });

      return {
        success: true,
        messageId: response.data.message_id,
        status: response.data.status,
        phoneNumber,
        message
      };
    } catch (error) {
      logger.error('SMS sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send webhook notification
   * @param {string} webhookType - Webhook type
   * @param {object} data - Webhook data
   * @returns {object} Webhook result
   */
  async sendWebhook(webhookType, data) {
    try {
      const webhookConfig = this.webhookEndpoints.get(webhookType);
      if (!webhookConfig) {
        throw new Error(`Webhook type not configured: ${webhookType}`);
      }

      const payload = {
        event: data.event,
        timestamp: new Date().toISOString(),
        data: data.payload,
        signature: this.generateWebhookSignature(data, webhookConfig.secret)
      };

      const response = await axios.post(webhookConfig.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': payload.signature
        },
        timeout: 10000
      });

      logger.info('Webhook sent successfully', {
        webhookType,
        event: data.event,
        status: response.status
      });

      return {
        success: true,
        webhookType,
        event: data.event,
        status: response.status
      };
    } catch (error) {
      logger.error('Webhook sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate webhook signature
   * @param {object} data - Webhook data
   * @param {string} secret - Webhook secret
   * @returns {string} Webhook signature
   */
  generateWebhookSignature(data, secret) {
    const crypto = require('crypto');
    const payload = JSON.stringify(data);
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Get integration status
   * @returns {object} Integration status
   */
  async getIntegrationStatus() {
    const status = {
      banking: {},
      compliance: {},
      thirdParty: {},
      webhooks: {}
    };

    // Check banking APIs
    for (const [provider, config] of this.bankingApis) {
      try {
        const response = await axios.get(`${config.baseUrl}/health`, {
          headers: { 'Authorization': `Bearer ${config.apiKey}` },
          timeout: 5000
        });
        status.banking[provider] = {
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'unknown'
        };
      } catch (error) {
        status.banking[provider] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }

    // Check compliance services
    for (const [service, config] of this.complianceServices) {
      try {
        const response = await axios.get(`${config.baseUrl}/health`, {
          headers: { 'Authorization': `Bearer ${config.apiKey}` },
          timeout: 5000
        });
        status.compliance[service] = {
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'unknown'
        };
      } catch (error) {
        status.compliance[service] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }

    // Check third-party services
    for (const [service, config] of this.thirdPartyServices) {
      try {
        const response = await axios.get(`${config.baseUrl}/health`, {
          headers: { 'Authorization': `Bearer ${config.apiKey}` },
          timeout: 5000
        });
        status.thirdParty[service] = {
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'unknown'
        };
      } catch (error) {
        status.thirdParty[service] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }

    // Check webhook endpoints
    for (const [webhook, config] of this.webhookEndpoints) {
      status.webhooks[webhook] = {
        url: config.url,
        events: config.events,
        configured: !!config.url
      };
    }

    return status;
  }

  /**
   * Get integration statistics
   * @returns {object} Integration statistics
   */
  getIntegrationStats() {
    return {
      totalIntegrations: this.bankingApis.size + this.complianceServices.size + this.thirdPartyServices.size,
      bankingProviders: Array.from(this.bankingApis.keys()),
      complianceServices: Array.from(this.complianceServices.keys()),
      thirdPartyServices: Array.from(this.thirdPartyServices.keys()),
      webhookEndpoints: Array.from(this.webhookEndpoints.keys())
    };
  }
}

module.exports = new IntegrationService(); 