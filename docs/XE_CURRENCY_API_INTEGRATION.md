# XE Currency Data API Integration

## Overview

PacheduConnect now integrates with **XE Currency Data API** to provide real-time exchange rates for supported African currencies. This integration includes automatic margin application and a flat 3% transfer fee on all sending amounts.

## Features

### 🌍 Supported Currencies
- **ZAR** (South African Rand)
- **USD** (US Dollar) - Used for Zimbabwe transactions
- **MWK** (Malawian Kwacha)
- **MZN** (Mozambican Metical)

### 💰 Fee Structure
- **Exchange Rate Margin**: 1.5% (0.015) added to all exchange rates
- **Transfer Fee**: 3% flat fee on all sending amounts
- **Real-time Rates**: Updated every 5 minutes via XE Currency Data API

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# XE Currency Data API Configuration
XE_ACCOUNT_ID=your_xe_account_id
XE_API_KEY=your_xe_api_key
```

### Getting XE API Credentials

1. Visit [XE Currency Data API](https://xecdapi.xe.com/)
2. Sign up for an appropriate plan:
   - **Lite**: 10,000 requests/month ($799/year)
   - **Prime**: 150,000 requests/month ($4,499/year)
   - **Enterprise**: Custom pricing for unlimited requests
3. Obtain your Account ID and API Key from the dashboard

## API Endpoints

### Exchange Rates

#### Get All Exchange Rates
```http
GET /api/transactions/exchange-rates
```

**Response:**
```json
{
  "supportedCurrencies": ["ZAR", "USD", "MWK", "MZN"],
  "rates": {
    "ZAR": {
      "USD": 0.0541,
      "MWK": 93.8,
      "MZN": 3.47
    },
    "USD": {
      "ZAR": 18.50,
      "MWK": 1735.0,
      "MZN": 64.2
    }
  },
  "margin": 0.015,
  "transferFeeRate": 0.03,
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "XE Currency Data API"
}
```

#### Get Specific Exchange Rate
```http
GET /api/transactions/exchange-rate/:from/:to
```

**Example:**
```http
GET /api/transactions/exchange-rate/ZAR/USD
```

**Response:**
```json
{
  "rate": {
    "rate": 0.054100,
    "fromCurrency": "ZAR",
    "toCurrency": "USD",
    "margin": 0.015,
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "XE Currency Data API"
  },
  "message": "Exchange rate retrieved successfully from XE Currency Data API"
}
```

### Currency Conversion

#### Convert Currency with Transfer Fee
```http
POST /api/transactions/convert-currency
Content-Type: application/json

{
  "amount": 10000,
  "fromCurrency": "ZAR",
  "toCurrency": "USD"
}
```

**Response:**
```json
{
  "conversion": {
    "originalAmount": 10000.00,
    "convertedAmount": 541.00,
    "fromCurrency": "ZAR",
    "toCurrency": "USD",
    "rate": 0.054100,
    "transferFee": {
      "transferFeeRate": 0.03,
      "transferFeeAmount": 300.00,
      "totalAmount": 10300.00,
      "currency": "ZAR"
    },
    "margin": 0.015,
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "XE Currency Data API"
  },
  "message": "Currency converted successfully with XE real-time rates",
  "note": "Transfer fee of 3% applied to sending amount"
}
```

### Transfer Fee Calculation

#### Calculate Transfer Fee for Transactions
```http
POST /api/transactions/calculate-transfer-fee
Content-Type: application/json

{
  "amount": 5000,
  "currency": "ZAR"
}
```

**Response:**
```json
{
  "transferFee": {
    "transferFeeRate": 0.03,
    "transferFeeAmount": 150.00,
    "totalAmount": 5150.00,
    "currency": "ZAR"
  },
  "message": "Transfer fee calculated for transaction"
}
```

### Fee Structure

#### Get Platform Fee Structure
```http
GET /api/transactions/fee-structure
```

**Response:**
```json
{
  "exchangeRateMargin": 0.015,
  "transferFeeRate": 0.03,
  "supportedCurrencies": ["ZAR", "USD", "MWK", "MZN"],
  "description": {
    "margin": "Exchange rate margin added to all conversions",
    "transferFee": "Flat 3% fee applied to all sending amounts"
  },
  "message": "Pachedu platform fee structure"
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
// Convert currency with transfer fee
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const response = await fetch('/api/transactions/convert-currency', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, fromCurrency, toCurrency })
  });
  
  const result = await response.json();
  return result.conversion;
};

// Calculate transfer fee
const calculateTransferFee = async (amount, currency) => {
  const response = await fetch('/api/transactions/calculate-transfer-fee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency })
  });
  
  const result = await response.json();
  return result.transferFee;
};

// Example usage
const conversion = await convertCurrency(5000, 'ZAR', 'USD');
console.log('Conversion:', conversion);
// Output: {
//   originalAmount: 5000.00,
//   convertedAmount: 270.50,
//   transferFee: { transferFeeAmount: 150.00, totalAmount: 5150.00 }
// }
```

### Real-world Transaction Example

**Scenario**: Sending ZAR 5,000 from South Africa to Zimbabwe

```
Original Amount: ZAR 5,000.00
Exchange Rate: 0.054100 (includes 1.5% margin)
Converted Amount: USD 270.50
Transfer Fee: ZAR 150.00 (3% of sending amount)
Total Cost to Sender: ZAR 5,150.00
Amount Recipient Receives: USD 270.50
```

## Error Handling

The API includes comprehensive error handling:

```javascript
try {
  const conversion = await convertCurrency(amount, fromCurrency, toCurrency);
  // Handle successful conversion
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
    console.error('Invalid input:', error.response.data.error);
  } else if (error.response?.status === 500) {
    // Handle server errors
    console.error('Server error:', error.response.data.error);
  }
}
```

## Rate Limiting

- **XE API**: 10,000 requests/month (Lite plan)
- **Cache Duration**: 5 minutes for exchange rates
- **Fallback**: Static rates when XE API unavailable

## Security

- **Authentication**: HTTP Basic Auth with XE credentials
- **HTTPS**: All API calls use secure connections
- **Validation**: Input validation for all parameters
- **Error Sanitization**: Sensitive data removed from error responses

## Monitoring

Monitor API usage and performance:

```javascript
// Check API health
const healthCheck = async () => {
  const response = await fetch('/api/transactions/exchange-rates');
  const data = await response.json();
  console.log('API Status:', data.source);
  console.log('Last Updated:', data.timestamp);
};
```

## Support

For issues with the XE Currency Data API integration:

1. Check XE API credentials in environment variables
2. Verify network connectivity to XE API
3. Review rate limiting and usage quotas
4. Check fallback rates when API is unavailable

## Changelog

### v2.0.0 (Latest)
- **Simplified Fee Structure**: Flat 3% transfer fee on all sending amounts
- **Removed Commission System**: Transfer fee and commission are now the same
- **Enhanced Error Handling**: Better validation and error messages
- **Improved Documentation**: Updated examples and usage guides