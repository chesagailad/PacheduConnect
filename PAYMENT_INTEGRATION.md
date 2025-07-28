/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: PAYMENT_INTEGRATION - handles application functionality
 */

# Payment Gateway Integration

PacheduConnect now supports multiple payment gateways for secure payment processing.

## Supported Gateways

1. **Stripe** - Global payments (USD, EUR, GBP, ZAR)
2. **Ozow** - South African EFT payments (ZAR)
3. **PayFast** - South African payments (ZAR)
4. **Stitch** - South African open banking (ZAR)

## Backend Features

- Payment gateway service with unified interface
- Payment model for storing transaction data
- Webhook handlers for all gateways
- Comprehensive API endpoints
- Fee calculation and validation

## Frontend Features

- Payment processor component
- Gateway selection interface
- Real-time fee calculation
- Payment form validation
- Success/error handling

## API Endpoints

- `GET /api/payments/gateways` - Get available gateways
- `POST /api/payments/process/:gateway` - Process payment
- `GET /api/payments/status/:paymentId` - Get payment status
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/stats` - Get payment statistics

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
OZOW_PRIVATE_KEY=your_private_key
PAYFAST_MERCHANT_KEY=your_merchant_key
STITCH_CLIENT_SECRET=your_client_secret
```

## Usage

1. Select payment gateway
2. Enter payment details
3. Process payment through gateway
4. Handle webhook callbacks
5. Update transaction status

The system automatically handles payment processing, webhooks, and transaction creation. 