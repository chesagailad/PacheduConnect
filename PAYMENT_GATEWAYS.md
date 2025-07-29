/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: PAYMENT_GATEWAYS - handles application functionality
 */

# Payment Gateway Integration

PacheduConnect now supports multiple payment gateways for secure and flexible payment processing. This document outlines the implemented payment gateways, their features, and how to use them.

## Supported Payment Gateways

### 1. Stripe
- **Type**: Global payment processor
- **Currencies**: USD, EUR, GBP, ZAR
- **Payment Methods**: Credit/Debit cards
- **Features**: 
  - Real-time payment processing
  - Advanced fraud protection
  - Webhook support for payment status updates
  - PCI DSS compliant

### 2. Ozow (formerly Zapper)
- **Type**: South African payment processor
- **Currencies**: ZAR
- **Payment Methods**: EFT (Electronic Funds Transfer)
- **Features**:
  - Instant EFT payments
  - Bank-level security
  - Real-time transaction status
  - South African bank integration

### 3. PayFast
- **Type**: South African payment processor
- **Currencies**: ZAR
- **Payment Methods**: Credit cards, EFT, Instant EFT
- **Features**:
  - Multiple payment options
  - Secure payment processing
  - Comprehensive reporting
  - South African market focus

### 4. Stitch
- **Type**: South African payment processor
- **Currencies**: ZAR
- **Payment Methods**: Bank transfers, card payments
- **Features**:
  - Open banking integration
  - Real-time payments
  - Advanced security
  - South African bank network

## Backend Implementation

### Payment Gateway Service (`backend/src/services/paymentGateways.js`)

The payment gateway service provides a unified interface for all payment gateways:

```javascript
// Initialize payment gateway service
const paymentGatewayService = require('../services/paymentGateways');

// Get supported gateways
const gateways = paymentGatewayService.getSupportedGateways();

// Process payment
const result = await paymentGatewayService.processPayment('stripe', paymentData);
```

### Payment Model (`backend/src/models/Payment.js`)

Stores payment information including:
- Gateway used
- Transaction IDs
- Payment status
- Amount and currency
- Metadata

### API Endpoints

#### Get Available Gateways
```
GET /api/payments/gateways
Authorization: Bearer <token>
```

#### Process Payment
```
POST /api/payments/process/:gateway
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "recipientEmail": "recipient@example.com",
  "description": "Payment for services",
  "paymentMethodId": "pm_1234567890", // For Stripe
  "bankAccount": "1234567890", // For Stitch
  "bankCode": "123456" // For Stitch
}
```

#### Get Payment Status
```
GET /api/payments/status/:paymentId
Authorization: Bearer <token>
```

#### Get Payment History
```
GET /api/payments/history?limit=20&offset=0&status=completed&gateway=stripe
Authorization: Bearer <token>
```

#### Get Payment Statistics
```
GET /api/payments/stats?period=month&gateway=stripe
Authorization: Bearer <token>
```

### Webhook Handlers

The system includes webhook handlers for all payment gateways:

- **Stripe**: `/api/webhooks/stripe`
- **Ozow**: `/api/webhooks/ozow`
- **PayFast**: `/api/webhooks/payfast`
- **Stitch**: `/api/webhooks/stitch`

Webhooks automatically update payment status and create transactions when payments are completed.

## Frontend Implementation

### Payment Processor Component (`frontend/src/components/PaymentProcessor.tsx`)

A comprehensive React component that handles:
- Gateway selection
- Payment form rendering
- Fee calculation
- Payment processing
- Error handling

### Integration with Send Money Page

The send money page now includes:
1. Recipient verification
2. Fee calculation
3. Payment gateway selection
4. Payment processing
5. Success/error handling

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Ozow Configuration
OZOW_SITE_CODE=your_site_code
OZOW_PRIVATE_KEY=your_private_key
OZOW_API_KEY=your_api_key

# PayFast Configuration
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_TEST_MODE=true

# Stitch Configuration
STITCH_CLIENT_ID=your_client_id
STITCH_CLIENT_SECRET=your_client_secret
STITCH_WEBHOOK_SECRET=your_webhook_secret

# General Configuration
FRONTEND_URL=http://localhost:3000
```

## Usage Examples

### Processing a Stripe Payment

```javascript
const paymentData = {
  amount: 100.00,
  currency: 'USD',
  paymentMethodId: 'pm_1234567890',
  customerEmail: 'customer@example.com',
  description: 'Payment for services'
};

const result = await paymentGatewayService.processPayment('stripe', paymentData);
```

### Processing an Ozow Payment

```javascript
const paymentData = {
  amount: 1000.00,
  currency: 'ZAR',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  description: 'Payment for services',
  returnUrl: 'https://yourapp.com/payment/success',
  cancelUrl: 'https://yourapp.com/payment/cancel'
};

const result = await paymentGatewayService.processPayment('ozow', paymentData);
```

### Processing a Stitch Payment

```javascript
const paymentData = {
  amount: 1000.00,
  currency: 'ZAR',
  bankAccount: '1234567890',
  bankCode: '123456',
  customerEmail: 'customer@example.com',
  description: 'Payment for services'
};

const result = await paymentGatewayService.processPayment('stitch', paymentData);
```

## Security Features

1. **Signature Verification**: All webhooks are verified using cryptographic signatures
2. **Input Validation**: All payment data is validated before processing
3. **Error Handling**: Comprehensive error handling and logging
4. **Rate Limiting**: API endpoints are protected with rate limiting
5. **HTTPS Only**: All payment communications use HTTPS

## Testing

### Test Cards (Stripe)

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

### Test Bank Accounts (Stitch)

- Use any valid South African bank account number
- Bank codes can be found in the Stitch documentation

## Monitoring and Logging

The system includes comprehensive logging for:
- Payment processing attempts
- Webhook events
- Error conditions
- Success transactions

All logs are stored and can be monitored for:
- Payment success rates
- Error patterns
- Performance metrics
- Security events

## Support

For payment gateway issues:
1. Check the logs for detailed error messages
2. Verify environment variables are correctly set
3. Test with payment gateway test credentials
4. Contact the respective payment gateway support

## Future Enhancements

Planned features:
- Additional payment gateways (PayPal, Square, etc.)
- Recurring payments
- Payment links
- Advanced fraud detection
- Multi-currency support
- Payment analytics dashboard 