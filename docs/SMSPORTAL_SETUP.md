# SMSPortal Integration Setup

This document explains how to set up SMSPortal as the SMS provider for PacheduConnect's OTP functionality.

## Overview

SMSPortal is a South African SMS gateway that provides reliable SMS delivery services. We've integrated it into our authentication system for sending OTP (One-Time Password) messages for password reset functionality using OAuth 2.0 authentication.

## Prerequisites

1. A SMSPortal account (sign up at https://www.smsportal.com/)
2. OAuth 2.0 credentials from your SMSPortal dashboard
3. Sufficient SMS credits in your account

## Configuration

### 1. Get SMSPortal OAuth 2.0 Credentials

1. Log in to your SMSPortal account
2. Navigate to **API Settings** or **OAuth 2.0** in your dashboard
3. Create a new OAuth 2.0 application or use an existing one
4. Note down your:
   - Client ID
   - Client Secret

**Note**: SMSPortal uses OAuth 2.0 with Client Credentials flow, so you only need Client ID and Client Secret. No API Key is required.

### 2. Environment Variables

Add the following variables to your `.env` file:

```env
# SMSPortal Configuration (OAuth 2.0)
SMSPORTAL_CLIENT_ID=your_smsportal_client_id
SMSPORTAL_CLIENT_SECRET=your_smsportal_client_secret
```

### 3. API Endpoints

The following endpoints are available for SMS OTP functionality:

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "maskedPhone": "***-***-1234"
}
```

#### Reset Password with OTP
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Features

### Security Features
- **Phone Number Masking**: Only shows last 4 digits of phone number
- **Rate Limiting**: Maximum 3 OTP attempts per user
- **OTP Expiration**: OTPs expire after 10 minutes
- **No User Enumeration**: Doesn't reveal if email exists or has phone number
- **OAuth 2.0 Authentication**: Secure token-based authentication

### Development Mode
In development mode (`NODE_ENV=development`), SMS messages are logged to console instead of being sent:

```
[DEV] SMS OTP would be sent to +27123456789: 123456
```

### Production Mode
In production mode, actual SMS messages are sent via SMSPortal's REST API using OAuth 2.0 tokens.

## SMSPortal API Details

### Authentication
The service automatically handles OAuth 2.0 authentication with SMSPortal using your client credentials:

1. **Token Request**: `POST /v1/auth/token`
   - Uses Client ID and Client Secret
   - Returns access token with expiry
   - Tokens are automatically refreshed

2. **API Calls**: All SMS API calls use Bearer token authentication
   - `Authorization: Bearer <access_token>`

### Message Format
OTP messages follow this format:
```
Your PacheduConnect verification code is: 123456. Valid for 10 minutes.
```

### API Endpoints Used
- **Authentication**: `POST /v1/auth/token`
- **Send SMS**: `POST /v1/bulkmessages`
- **Account Info**: `GET /v1/account`

## Error Handling

The service includes comprehensive error handling for:
- OAuth 2.0 authentication failures
- Token expiration and refresh
- Network timeouts
- Invalid phone numbers
- Insufficient credits
- API rate limits

## Testing

### Test SMSPortal Integration
```bash
# Run the SMSPortal test script
cd backend
node test-sms.js
```

### Test with curl
```bash
# Send OTP
curl -X POST http://localhost:5001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password (use OTP from console logs in dev mode)
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"newpass123"}'
```

### Test in Frontend
1. Go to `/auth` page
2. Click "Forgot Password?"
3. Enter your email
4. Check console logs for OTP (in dev mode)
5. Enter OTP and new password

## Troubleshooting

### Common Issues

1. **OAuth 2.0 Authentication Failed**
   - Check your SMSPortal Client ID and Client Secret
   - Ensure your OAuth 2.0 application is properly configured
   - Verify your account has sufficient credits
   - Check that your account is active

2. **Token Expiration Issues**
   - The service automatically handles token refresh
   - Check logs for token refresh errors
   - Verify network connectivity to SMSPortal

3. **SMS Not Delivered**
   - Check phone number format (should be international format)
   - Verify recipient phone number is valid
   - Check SMSPortal dashboard for delivery status

4. **Rate Limiting**
   - Wait 10 minutes before requesting new OTP
   - Check SMSPortal account limits

### Debug Mode
Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will show detailed API requests and responses in the logs.

## Cost Considerations

- SMSPortal charges per SMS sent
- OTP messages are typically short (under 160 characters)
- Consider implementing SMS cost monitoring
- Set up alerts for low credit balance

## Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **OAuth 2.0 Security**: Client Secret should be kept secure
3. **Rate Limiting**: Implement additional rate limiting at application level
4. **Monitoring**: Set up alerts for failed SMS deliveries
5. **Logging**: Log SMS events for audit purposes
6. **Testing**: Use test phone numbers in development

## Support

For SMSPortal-specific issues:
- Contact SMSPortal support: https://www.smsportal.com/support
- Check SMSPortal documentation: https://docs.smsportal.com/docs/rest

For application-specific issues:
- Check application logs
- Verify environment variables
- Test with the provided test script 