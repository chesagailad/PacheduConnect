# PacheduConnect API Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Transactions](#transactions-endpoints)
  - [Beneficiaries](#beneficiaries-endpoints)
  - [KYC](#kyc-endpoints)
  - [Payments](#payments-endpoints)
  - [Admin](#admin-endpoints)
  - [Webhooks](#webhooks-endpoints)

## 🌐 Overview

The PacheduConnect API is a RESTful service that enables cross-border remittance operations between South Africa and Zimbabwe. The API provides endpoints for user management, transaction processing, KYC verification, and payment gateway integrations.

### Features
- **User Authentication**: JWT-based authentication with refresh tokens
- **Transaction Management**: Send and receive money with real-time tracking
- **KYC Integration**: Document upload and verification workflow
- **Payment Processing**: Multiple payment gateway integrations
- **Real-time Exchange Rates**: Live currency conversion
- **SMS Notifications**: Transaction updates and OTP delivery
- **Admin Management**: User and transaction oversight

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Format
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Expiration
- **Access Token**: 24 hours
- **Refresh Token**: 30 days (when implemented)

## 🌍 Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000/api` |
| Staging | `https://staging-api.pacheduconnect.com/api` |
| Production | `https://api.pacheduconnect.com/api` |

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Common Error Codes
| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email/password |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INVALID_TOKEN` | Malformed or invalid token |
| `USER_NOT_FOUND` | User does not exist |
| `EMAIL_EXISTS` | Email already registered |
| `INVALID_PHONE` | Invalid phone number format |
| `INSUFFICIENT_FUNDS` | Insufficient balance for transaction |
| `TRANSACTION_LIMIT_EXCEEDED` | Transaction amount exceeds limits |
| `KYC_REQUIRED` | KYC verification required |
| `DOCUMENT_INVALID` | Uploaded document is invalid |

## 🚦 Rate Limiting

The API implements rate limiting to prevent abuse:

- **General Endpoints**: 100 requests per 15 minutes
- **Authentication Endpoints**: 10 requests per 15 minutes
- **Payment Endpoints**: 10 requests per 15 minutes
- **KYC Endpoints**: 20 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📡 Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phoneNumber": "+27831234567"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+27831234567"
  }
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `phoneNumber`: Required, international format with country code

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+27831234567"
  }
}
```

#### POST /auth/send-otp
Send OTP for password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully",
  "maskedPhone": "+27***67"
}
```

#### POST /auth/verify-otp
Verify OTP and reset password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Users Endpoints

#### GET /users/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+27831234567",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /users/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phoneNumber": "+27831234568"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "phoneNumber": "+27831234568"
  }
}
```

#### GET /users/balance
Get user account balance.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "balance": {
    "ZAR": 15000.00,
    "USD": 1000.00,
    "ZWL": 500000.00
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### Transactions Endpoints

#### GET /transactions
Get user transaction history.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: `send` | `receive` (optional)
- `status`: `pending` | `completed` | `failed` (optional)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `limit`: Number (default: 20, max: 100)
- `offset`: Number (default: 0)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "send",
      "amount": 1000.00,
      "currency": "ZAR",
      "status": "completed",
      "description": "Transfer to John Smith",
      "recipient": {
        "id": "uuid",
        "name": "John Smith",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /transactions/send
Send money to a recipient.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "recipientId": "uuid",
  "amount": 1000.00,
  "currency": "ZAR",
  "description": "Monthly transfer",
  "paymentMethod": "bank_transfer"
}
```

**Response (201):**
```json
{
  "message": "Transaction initiated successfully",
  "transaction": {
    "id": "uuid",
    "type": "send",
    "amount": 1000.00,
    "currency": "ZAR",
    "status": "pending",
    "fee": 25.00,
    "exchangeRate": 0.055,
    "recipientAmount": 18.18,
    "recipientCurrency": "USD",
    "estimatedDelivery": "2024-01-02T00:00:00.000Z"
  }
}
```

#### GET /transactions/{id}
Get specific transaction details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "transaction": {
    "id": "uuid",
    "type": "send",
    "amount": 1000.00,
    "currency": "ZAR",
    "status": "completed",
    "description": "Monthly transfer",
    "fee": 25.00,
    "exchangeRate": 0.055,
    "recipientAmount": 18.18,
    "recipientCurrency": "USD",
    "recipient": {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com"
    },
    "paymentMethod": "bank_transfer",
    "trackingNumber": "PC123456789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:05:00.000Z"
  }
}
```

#### GET /transactions/exchange-rates
Get current exchange rates.

**Response (200):**
```json
{
  "rates": {
    "ZAR": {
      "USD": 0.055,
      "ZWL": 1000.00,
      "EUR": 0.050
    },
    "USD": {
      "ZAR": 18.18,
      "ZWL": 18180.00,
      "EUR": 0.91
    }
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

#### POST /transactions/convert-currency
Convert currency amount.

**Request Body:**
```json
{
  "amount": 1000.00,
  "fromCurrency": "ZAR",
  "toCurrency": "USD"
}
```

**Response (200):**
```json
{
  "conversion": {
    "originalAmount": 1000.00,
    "originalCurrency": "ZAR",
    "convertedAmount": 55.00,
    "convertedCurrency": "USD",
    "exchangeRate": 0.055,
    "fee": 2.75,
    "totalAmount": 52.25
  }
}
```

### Beneficiaries Endpoints

#### GET /beneficiaries
Get user's saved beneficiaries.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "beneficiaries": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "phoneNumber": "+263771234567",
      "bankName": "CBZ Bank",
      "accountNumber": "1234567890",
      "accountType": "savings",
      "swiftCode": "COBZZWX",
      "country": "Zimbabwe",
      "address": "123 Main St, Harare",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /beneficiaries
Add a new beneficiary.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phoneNumber": "+263771234568",
  "bankName": "Stanbic Bank",
  "accountNumber": "0987654321",
  "accountType": "checking",
  "swiftCode": "SBICZWX",
  "country": "Zimbabwe",
  "address": "456 Oak St, Bulawayo"
}
```

**Response (201):**
```json
{
  "message": "Beneficiary added successfully",
  "beneficiary": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+263771234568",
    "bankName": "Stanbic Bank",
    "accountNumber": "0987654321",
    "accountType": "checking",
    "swiftCode": "SBICZWX",
    "country": "Zimbabwe",
    "address": "456 Oak St, Bulawayo",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /beneficiaries/{id}
Update beneficiary information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "phoneNumber": "+263771234569"
}
```

**Response (200):**
```json
{
  "message": "Beneficiary updated successfully",
  "beneficiary": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phoneNumber": "+263771234569"
  }
}
```

#### DELETE /beneficiaries/{id}
Delete a beneficiary.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Beneficiary deleted successfully"
}
```

### KYC Endpoints

#### GET /kyc/status
Get user's KYC verification status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "kyc": {
    "level": "silver",
    "status": "pending",
    "documents": [
      {
        "type": "id_document",
        "status": "approved",
        "uploadedAt": "2024-01-01T00:00:00.000Z",
        "approvedAt": "2024-01-01T01:00:00.000Z"
      },
      {
        "type": "proof_of_address",
        "status": "pending",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "limits": {
      "daily": 50000,
      "monthly": 500000,
      "single": 10000
    }
  }
}
```

#### POST /kyc/upload
Upload KYC document.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `documentType`: `id_document` | `proof_of_address` | `proof_of_income`
- `file`: Document file (PDF, JPG, PNG, max 10MB)

**Response (201):**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "uuid",
    "type": "id_document",
    "status": "pending",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /kyc/limits
Get KYC level limits.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "limits": {
    "bronze": {
      "daily": 10000,
      "monthly": 100000,
      "single": 5000
    },
    "silver": {
      "daily": 50000,
      "monthly": 500000,
      "single": 10000
    },
    "gold": {
      "daily": 100000,
      "monthly": 1000000,
      "single": 25000
    }
  }
}
```

### Payments Endpoints

#### POST /payments/initiate
Initiate a payment transaction.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 1000.00,
  "currency": "ZAR",
  "paymentMethod": "ozow",
  "recipientId": "uuid",
  "description": "Monthly transfer"
}
```

**Response (201):**
```json
{
  "message": "Payment initiated successfully",
  "payment": {
    "id": "uuid",
    "amount": 1000.00,
    "currency": "ZAR",
    "status": "pending",
    "paymentUrl": "https://pay.ozow.com/checkout/...",
    "reference": "PC123456789",
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

#### GET /payments/{id}/status
Get payment status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "payment": {
    "id": "uuid",
    "status": "completed",
    "amount": 1000.00,
    "currency": "ZAR",
    "completedAt": "2024-01-01T00:05:00.000Z",
    "transactionId": "uuid"
  }
}
```

### Admin Endpoints

#### GET /admin/users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `status`: `active` | `suspended` | `all` (optional)
- `kycLevel`: `bronze` | `silver` | `gold` (optional)
- `limit`: Number (default: 20)
- `offset`: Number (default: 0)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+27831234567",
      "role": "user",
      "kycLevel": "silver",
      "kycStatus": "approved",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

#### GET /admin/transactions
Get all transactions (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `status`: `pending` | `completed` | `failed` (optional)
- `type`: `send` | `receive` (optional)
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `limit`: Number (default: 20)
- `offset`: Number (default: 0)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "send",
      "amount": 1000.00,
      "currency": "ZAR",
      "status": "completed",
      "sender": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "recipient": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:05:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

#### PUT /admin/users/{id}/kyc
Update user KYC status (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "level": "gold",
  "status": "approved",
  "notes": "All documents verified successfully"
}
```

**Response (200):**
```json
{
  "message": "KYC status updated successfully",
  "kyc": {
    "level": "gold",
    "status": "approved",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Webhooks Endpoints

#### POST /webhooks/ozow
Ozow payment webhook.

**Request Body:**
```json
{
  "SiteCode": "site_code",
  "CountryCode": "ZA",
  "CurrencyCode": "ZAR",
  "Amount": 1000.00,
  "TransactionReference": "PC123456789",
  "BankReference": "BR123456789",
  "Optional1": "user_id",
  "Optional2": "recipient_id",
  "Optional3": "transaction_id",
  "Optional4": "",
  "Optional5": "",
  "IsTest": false,
  "Customer": "John Doe",
  "BankReference": "BR123456789",
  "HashCheck": "hash_signature"
}
```

**Response (200):**
```json
{
  "status": "success"
}
```

#### POST /webhooks/stripe
Stripe payment webhook.

**Request Body:**
```json
{
  "id": "evt_123456789",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "pi_123456789",
      "object": "payment_intent",
      "amount": 100000,
      "currency": "zar",
      "status": "succeeded"
    }
  },
  "livemode": false,
  "pending_webhooks": 0,
  "request": {
    "id": "req_123456789",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}
```

**Response (200):**
```json
{
  "status": "success"
}
```

## 📊 SDKs and Libraries

### JavaScript/Node.js
```bash
npm install pachedu-connect-sdk
```

```javascript
import { PacheduConnect } from 'pachedu-connect-sdk';

const client = new PacheduConnect({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Send money
const transaction = await client.transactions.send({
  recipientId: 'uuid',
  amount: 1000.00,
  currency: 'ZAR',
  description: 'Monthly transfer'
});
```

### Python
```bash
pip install pachedu-connect-python
```

```python
from pachedu_connect import PacheduConnect

client = PacheduConnect(
    api_key='your-api-key',
    environment='production'
)

# Send money
transaction = client.transactions.send(
    recipient_id='uuid',
    amount=1000.00,
    currency='ZAR',
    description='Monthly transfer'
)
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Environment Variables
```bash
# Copy from env.example
cp env.example .env

# Required variables
DATABASE_URL=postgresql://user:password@localhost:5432/pachedu_db
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://localhost:6379
```

### Running the API
```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev:backend
```

## 📞 Support

For API support and questions:
- **Email**: api-support@pacheduconnect.com
- **Documentation**: https://docs.pacheduconnect.com
- **Status Page**: https://status.pacheduconnect.com

## 📄 License

This API documentation is licensed under the MIT License. 