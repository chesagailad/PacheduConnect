# XE Currency Data API Integration

## Overview

PacheduConnect now integrates with **XE Currency Data API** to provide real-time exchange rates for supported African currencies. This integration includes automatic margin application and commission calculation for ZAR transactions.

## Features

### 🌍 Supported Currencies
- **ZAR** (South African Rand)
- **USD** (US Dollar) - Used for Zimbabwe transactions
- **MWK** (Malawian Kwacha)
- **MZN** (Mozambican Metical)

### 💰 Fee Structure
- **Exchange Rate Margin**: 1.5% (0.015) added to all exchange rates
- **ZAR Commission**: 3.5% platform fee on ZAR amounts being sent
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
  "zarCommissionRate": 0.035,
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

#### Convert Currency with Commission
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
    "commission": {
      "commissionRate": 0.035,
      "commissionAmount": 350.00,
      "totalAmount": 10350.00,
      "currency": "ZAR"
    },
    "margin": 0.015,
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "XE Currency Data API"
  },
  "message": "Currency converted successfully with XE real-time rates",
  "note": "Commission of 3.5% applied to ZAR amount"
}
```

### Commission Calculation

#### Calculate Commission for ZAR Transactions
```http
POST /api/transactions/calculate-commission
Content-Type: application/json

{
  "amount": 5000,
  "currency": "ZAR"
}
```

**Response:**
```json
{
  "commission": {
    "commissionRate": 0.035,
    "commissionAmount": 175.00,
    "totalAmount": 5175.00,
    "currency": "ZAR"
  },
  "message": "Commission calculated for ZAR transaction"
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
  "zarCommissionRate": 0.035,
  "supportedCurrencies": ["ZAR", "USD", "MWK", "MZN"],
  "description": {
    "margin": "Exchange rate margin added to all conversions",
    "zarCommission": "Commission fee applied to ZAR amounts being sent"
  },
  "message": "Pachedu platform fee structure"
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
const { 
  convertCurrency, 
  getExchangeRate, 
  calculateCommission 
} = require('./src/utils/exchangeRate');

// Convert ZAR to USD with commission
async function sendMoneyToZimbabwe() {
  try {
    const amount = 10000; // ZAR
    const conversion = await convertCurrency(amount, 'ZAR', 'USD');
    
    console.log(`Sending: ZAR ${amount}`);
    console.log(`Recipient receives: USD ${conversion.convertedAmount}`);
    console.log(`Platform commission: ZAR ${conversion.commission.commissionAmount}`);
    console.log(`Total cost: ZAR ${conversion.commission.totalAmount}`);
  } catch (error) {
    console.error('Conversion failed:', error.message);
  }
}

// Get current exchange rate
async function getCurrentRate() {
  try {
    const rate = await getExchangeRate('ZAR', 'USD');
    console.log(`1 ZAR = ${rate.rate} USD (includes 1.5% margin)`);
  } catch (error) {
    console.error('Rate fetch failed:', error.message);
  }
}
```

### Frontend Integration

```javascript
// Convert currency with commission calculation
async function convertWithCommission(amount, from, to) {
  try {
    const response = await fetch('/api/transactions/convert-currency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount, fromCurrency: from, toCurrency: to })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.conversion;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
}

// Usage example
const conversion = await convertWithCommission(5000, 'ZAR', 'USD');
console.log('Conversion result:', conversion);
```

## Implementation Details

### Rate Calculation Process

1. **Fetch from XE API**: Real-time rates retrieved from XE Currency Data API
2. **Apply Margin**: 1.5% margin automatically added via XE API `margin` parameter
3. **Calculate Commission**: 3.5% commission calculated for ZAR transactions only
4. **Cache Results**: Rates cached for 5 minutes to optimize API usage

### Fallback Mechanism

If XE API is unavailable, the system falls back to pre-configured static rates with margin already applied:

```javascript
const fallbackRates = {
  USD: {
    ZAR: 18.50,    // ~18.30 + 1.5% margin
    MWK: 1735.0,   // ~1710 + 1.5% margin
    MZN: 64.2      // ~63.25 + 1.5% margin
  }
  // ... other currency pairs
};
```

### Error Handling

The system handles various error scenarios:

- **Invalid Credentials**: Clear error message with setup instructions
- **Unsupported Currency**: Returns list of supported currencies
- **API Unavailability**: Automatic fallback to static rates
- **Rate Limits**: Graceful handling of XE API rate limits

## Testing

### Run the Test Suite

```bash
# Test XE API integration
node backend/test-xe-exchange-rates.js
```

### Test Scenarios

The test suite covers:

1. **Platform Fee Structure**: Validates margin and commission rates
2. **Real-time Rates**: Fetches live data from XE API
3. **Currency Conversions**: Tests all supported currency pairs
4. **Commission Calculations**: Verifies ZAR commission logic
5. **Error Handling**: Tests unsupported currencies and API failures
6. **Real-world Scenarios**: End-to-end transaction simulation

## Monitoring and Maintenance

### API Usage Monitoring

- Monitor XE API request count to avoid package limits
- Track rate cache hit/miss ratios
- Log fallback usage frequency

### Rate Accuracy Verification

- Compare XE rates with other sources periodically
- Monitor significant rate discrepancies
- Validate margin application accuracy

### Performance Optimization

- **Caching**: 5-minute cache reduces API calls by ~90%
- **Batch Requests**: Fetch multiple currency pairs efficiently
- **Error Resilience**: Fallback rates ensure service availability

## Compliance and Security

### Data Protection

- XE API credentials stored securely in environment variables
- Rate data cached temporarily (5 minutes) only
- No sensitive customer data sent to XE API

### Financial Compliance

- Transparent fee structure disclosed to users
- Margin and commission clearly separated in responses
- Real-time rate updates ensure fair pricing

## Troubleshooting

### Common Issues

1. **"XE Currency Data API credentials not configured"**
   - Set `XE_ACCOUNT_ID` and `XE_API_KEY` environment variables
   - Verify credentials are valid in XE dashboard

2. **"API package limit reached"**
   - Check XE API usage in dashboard
   - Consider upgrading to higher tier plan
   - Implement request rate limiting

3. **"Unsupported currency"**
   - Only ZAR, USD, MWK, MZN are supported
   - Update frontend to restrict currency selection

4. **Fallback rates being used frequently**
   - Check XE API service status
   - Verify network connectivity
   - Review API credentials validity

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=true
LOG_LEVEL=debug
```

This will provide detailed logs of:
- XE API requests and responses
- Rate calculations
- Cache operations
- Error details

## Support

For technical support:
- Review this documentation
- Check the test suite results
- Contact PacheduConnect development team
- Refer to [XE API Documentation](https://xecdapi.xe.com/docs/v1/)

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Author**: PacheduConnect Development Team