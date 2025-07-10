const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const crypto = require('crypto');

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      stripe: this.stripeGateway,
      ozow: this.ozowGateway,
      payfast: this.payfastGateway,
      stitch: this.stitchGateway
    };
  }

  // Stripe Payment Gateway
  async stripeGateway(paymentData) {
    try {
      const {
        amount,
        currency = 'usd',
        paymentMethodId,
        customerId,
        description,
        metadata = {}
      } = paymentData;

      // Create or retrieve customer
      let customer;
      if (customerId) {
        customer = await stripe.customers.retrieve(customerId);
      } else {
        customer = await stripe.customers.create({
          payment_method: paymentMethodId,
          email: metadata.email,
          metadata
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customer.id,
        payment_method: paymentMethodId,
        confirm: true,
        description,
        metadata: {
          ...metadata,
          gateway: 'stripe'
        },
        return_url: `${process.env.FRONTEND_URL}/payment/success`
      });

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: paymentIntent.status,
        customerId: customer.id,
        gateway: 'stripe',
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'stripe'
      };
    }
  }

  // Ozow Payment Gateway (South African)
  async ozowGateway(paymentData) {
    try {
      const {
        amount,
        currency = 'ZAR',
        reference,
        customerEmail,
        customerName,
        description,
        returnUrl,
        cancelUrl
      } = paymentData;

      const siteCode = process.env.OZOW_SITE_CODE;
      const privateKey = process.env.OZOW_PRIVATE_KEY;
      const environment = process.env.OZOW_ENVIRONMENT || 'sandbox';

      const baseUrl = environment === 'production' 
        ? 'https://pay.ozow.com' 
        : 'https://pay.ozow.com';

      const payload = {
        SiteCode: siteCode,
        CountryCode: 'ZA',
        CurrencyCode: currency,
        Amount: amount.toFixed(2),
        TransactionReference: reference,
        BankReference: reference,
        Optional1: description,
        Optional2: customerEmail,
        Optional3: customerName,
        Optional4: '',
        Optional5: '',
        IsTest: environment === 'sandbox',
        Customer: customerEmail,
        BankReference: reference,
        CancelUrl: cancelUrl,
        ErrorUrl: `${returnUrl}?status=error`,
        SuccessUrl: `${returnUrl}?status=success`,
        NotifyUrl: `${process.env.BACKEND_URL}/api/webhooks/ozow`
      };

      // Generate signature
      const signature = this.generateOzowSignature(payload, privateKey);
      payload.HashCheck = signature;

      // Make API call to Ozow
      const response = await axios.post(`${baseUrl}/api/payment`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.Success) {
        return {
          success: true,
          transactionId: reference,
          amount: amount,
          currency: currency,
          status: 'pending',
          gateway: 'ozow',
          redirectUrl: response.data.RedirectUrl,
          metadata: {
            siteCode,
            bankReference: reference
          }
        };
      } else {
        return {
          success: false,
          error: response.data.ErrorMessage || 'Ozow payment failed',
          gateway: 'ozow'
        };
      }
    } catch (error) {
      console.error('Ozow payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'ozow'
      };
    }
  }

  // PayFast Payment Gateway
  async payfastGateway(paymentData) {
    try {
      const {
        amount,
        currency = 'ZAR',
        reference,
        customerEmail,
        customerName,
        description,
        returnUrl,
        cancelUrl
      } = paymentData;

      const merchantId = process.env.PAYFAST_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_PASSPHRASE;
      const environment = process.env.PAYFAST_ENVIRONMENT || 'sandbox';

      const baseUrl = environment === 'production'
        ? 'https://www.payfast.co.za'
        : 'https://sandbox.payfast.co.za';

      const payload = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: `${process.env.BACKEND_URL}/api/webhooks/payfast`,
        name_first: customerName.split(' ')[0] || customerName,
        name_last: customerName.split(' ').slice(1).join(' ') || '',
        email_address: customerEmail,
        m_payment_id: reference,
        amount: amount.toFixed(2),
        item_name: description,
        item_description: description,
        custom_str1: reference,
        custom_str2: customerEmail,
        custom_str3: customerName
      };

      // Generate signature
      const signature = this.generatePayFastSignature(payload, passphrase);
      payload.signature = signature;

      return {
        success: true,
        transactionId: reference,
        amount: amount,
        currency: currency,
        status: 'pending',
        gateway: 'payfast',
        redirectUrl: `${baseUrl}/eng/process`,
        formData: payload,
        metadata: {
          merchantId,
          merchantKey
        }
      };
    } catch (error) {
      console.error('PayFast payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'payfast'
      };
    }
  }

  // Stitch Payment Gateway (Real-time Payments)
  async stitchGateway(paymentData) {
    try {
      const {
        amount,
        currency = 'ZAR',
        reference,
        customerEmail,
        customerName,
        description,
        bankAccount,
        bankCode
      } = paymentData;

      const clientId = process.env.STITCH_CLIENT_ID;
      const clientSecret = process.env.STITCH_CLIENT_SECRET;
      const environment = process.env.STITCH_ENVIRONMENT || 'sandbox';

      const baseUrl = environment === 'production'
        ? 'https://api.stitch.money'
        : 'https://api.stitch.money';

      // Get access token
      const tokenResponse = await axios.post(`${baseUrl}/connect/oauth/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'payments'
      });

      const accessToken = tokenResponse.data.access_token;

      // Create payment request
      const paymentResponse = await axios.post(`${baseUrl}/api/v1/payments`, {
        amount: {
          currency: currency,
          quantity: amount.toFixed(2)
        },
        reference: reference,
        beneficiaryReference: reference,
        beneficiary: {
          bankAccount: {
            accountNumber: bankAccount,
            bankCode: bankCode
          },
          name: customerName,
          email: customerEmail
        },
        description: description
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (paymentResponse.data.status === 'pending') {
        return {
          success: true,
          transactionId: reference,
          amount: amount,
          currency: currency,
          status: 'pending',
          gateway: 'stitch',
          paymentId: paymentResponse.data.id,
          metadata: {
            stitchPaymentId: paymentResponse.data.id,
            beneficiaryReference: reference
          }
        };
      } else {
        return {
          success: false,
          error: 'Stitch payment failed',
          gateway: 'stitch'
        };
      }
    } catch (error) {
      console.error('Stitch payment error:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'stitch'
      };
    }
  }

  // Generate Ozow signature
  generateOzowSignature(payload, privateKey) {
    const concatenatedString = Object.keys(payload)
      .sort()
      .map(key => payload[key])
      .join('');

    return crypto
      .createHmac('sha512', privateKey)
      .update(concatenatedString)
      .digest('hex');
  }

  // Generate PayFast signature
  generatePayFastSignature(payload, passphrase) {
    const concatenatedString = Object.keys(payload)
      .sort()
      .map(key => `${key}=${encodeURIComponent(payload[key])}`)
      .join('&');

    return crypto
      .createHash('md5')
      .update(concatenatedString + passphrase)
      .digest('hex');
  }

  // Process payment with specified gateway
  async processPayment(gateway, paymentData) {
    if (!this.gateways[gateway]) {
      throw new Error(`Unsupported payment gateway: ${gateway}`);
    }

    return await this.gateways[gateway].call(this, paymentData);
  }

  // Get supported gateways
  getSupportedGateways() {
    return Object.keys(this.gateways);
  }

  // Validate payment data
  validatePaymentData(paymentData, gateway) {
    const requiredFields = {
      stripe: ['amount', 'paymentMethodId'],
      ozow: ['amount', 'reference', 'customerEmail'],
      payfast: ['amount', 'reference', 'customerEmail'],
      stitch: ['amount', 'reference', 'customerEmail', 'bankAccount', 'bankCode']
    };

    const fields = requiredFields[gateway] || [];
    const missingFields = fields.filter(field => !paymentData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for ${gateway}: ${missingFields.join(', ')}`);
    }

    return true;
  }

  // Get gateway configuration
  getGatewayConfig(gateway) {
    const configs = {
      stripe: {
        name: 'Stripe',
        description: 'International card payments',
        currencies: ['USD', 'EUR', 'GBP', 'ZAR'],
        fees: { percentage: 2.9, fixed: 0.30 },
        supported: true
      },
      ozow: {
        name: 'Ozow',
        description: 'South African instant EFT',
        currencies: ['ZAR'],
        fees: { percentage: 1.5, fixed: 0 },
        supported: true
      },
      payfast: {
        name: 'PayFast',
        description: 'South African payment gateway',
        currencies: ['ZAR'],
        fees: { percentage: 3.5, fixed: 2.00 },
        supported: true
      },
      stitch: {
        name: 'Stitch',
        description: 'Real-time payments',
        currencies: ['ZAR'],
        fees: { percentage: 1.0, fixed: 0 },
        supported: true
      }
    };

    return configs[gateway] || null;
  }
}

module.exports = new PaymentGatewayService(); 