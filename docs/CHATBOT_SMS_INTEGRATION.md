# Chatbot SMS Integration Guide

This document explains how to use the real-time SMS notifications feature integrated with the PacheduConnect chatbot.

## 🎯 Overview

The chatbot now supports real-time SMS notifications using SMSPortal integration, providing users with instant alerts for:

- 💰 **Transaction confirmations**
- 📊 **Exchange rate updates** 
- 🆘 **Support ticket escalations**
- 🔒 **Security alerts**
- 📋 **Document status updates**
- 💬 **Follow-up messages**

## 🚀 Features

### 1. **Automatic SMS Triggers**
- **Fee Calculations**: When users calculate transfer costs, rate details are sent via SMS
- **Escalations**: When users need human support, ticket details are sent immediately
- **Transaction Simulations**: Cost breakdowns and rate locks sent for reference

### 2. **User Opt-in System**
- Users can opt-in to SMS alerts through the chatbot
- Phone number validation for South African numbers
- Easy opt-out with "STOP" replies

### 3. **Smart Context Awareness**
- Chatbot remembers user preferences
- SMS content personalized based on conversation history
- Follow-up messages reference previous queries

## 📱 How to Use

### For Users:

1. **Enable SMS Alerts**:
   ```
   User: "I want SMS alerts"
   Bot: "Please share your phone number..."
   User: "0821234567"
   Bot: "SMS alerts activated!"
   ```

2. **Get Rate Alerts**:
   ```
   User: "How much to send R1000 to Zimbabwe?"
   Bot: [Shows calculation + "Rate details sent via SMS!"]
   SMS: "Rate Alert: 1 ZAR = 17.32 ZWL. Your ZAR 1000 = ZWL 17,320..."
   ```

3. **Escalation Notifications**:
   ```
   User: "I need to speak to a human"
   Bot: "Support ticket #PC123456 created..."
   SMS: "PacheduConnect Support: Your request #PC123456 has been escalated..."
   ```

4. **Test SMS System**:
   ```
   User: "Test SMS"
   Bot: "Test message sent!"
   SMS: "Hi! This is a test message from PacheduConnect..."
   ```

### For Developers:

## 🛠️ API Endpoints

### SMS Notification Endpoints

```javascript
// Transaction Alert
POST /api/notifications/sms/transaction-alert
{
  "phoneNumber": "+27821234567",
  "transactionData": {
    "amount": 1000,
    "currency": "ZAR", 
    "recipient": "John Doe",
    "reference": "PC123456",
    "status": "completed"
  }
}

// Exchange Rate Alert  
POST /api/notifications/sms/rate-alert
{
  "phoneNumber": "+27821234567",
  "rateData": {
    "fromCurrency": "ZAR",
    "toCurrency": "ZWL", 
    "rate": 17.32,
    "amount": 1000,
    "recipientAmount": "17,320.00"
  }
}

// Escalation Alert
POST /api/notifications/sms/escalation-alert
{
  "phoneNumber": "+27821234567",
  "escalationData": {
    "ticketNumber": "PC123456",
    "estimatedWaitTime": 2,
    "agentName": "Support Team"
  }
}

// Custom SMS
POST /api/notifications/sms/custom
{
  "phoneNumber": "+27821234567", 
  "message": "Your custom message here",
  "context": "chatbot-interaction"
}
```

## 🧪 Testing

### 1. **Test SMS Service**
```bash
cd backend
node test-chatbot-sms.js
```

### 2. **Test Individual Components**
```javascript
// Test transaction alert
const smsService = require('./src/services/smsService');

await smsService.sendTransactionAlert('+27821234567', {
  amount: 500,
  currency: 'ZAR',
  recipient: 'Jane Doe', 
  reference: 'PC789012',
  status: 'pending'
});
```

### 3. **Frontend Integration Testing**
```javascript
// Test from chatbot
const response = await fetch('/api/notifications/sms/rate-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+27821234567',
    rateData: { /* rate data */ }
  })
});
```

## 📋 SMS Templates

### Transaction Alert
```
PacheduConnect Alert: Your ZAR 1000 transfer to John Doe is completed. 
Reference: PC123456. Support: +27123456789
```

### Rate Alert  
```
Rate Alert: 1 ZAR = 17.32 ZWL. Your ZAR 1000 = ZWL 17,320.00. 
Lock rate at pacheduconnect.com
```

### Escalation Alert
```
PacheduConnect Support: Your request #PC123456 has been escalated. 
Agent Sarah will assist you in ~2 mins. We'll call you soon.
```

### Follow-up SMS
```
Follow-up: You asked about "How much to send R500?". 
Suggested next step: Visit our rates page. Need help? pacheduconnect.com/help
```

## 🔧 Configuration

### Environment Variables
```env
# SMSPortal Configuration (already configured)
SMSPORTAL_CLIENT_ID=your_client_id
SMSPORTAL_CLIENT_SECRET=your_client_secret

# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Phone Number Validation
- Supports South African numbers: `+27821234567` or `0821234567`
- Validates format: `^(\+27|0)[6-8][0-9]{8}$`
- Networks: MTN (083), Vodacom (082), Cell C (084)

## 🎨 Chatbot Integration

### Context Management
```javascript
// User phone and SMS preferences stored in conversation context
const [conversationContext, setConversationContext] = useState({
  userPhone: null,
  smsOptIn: false,
  lastAmount: null,
  lastCountry: null
});
```

### SMS Opt-in Flow
```javascript
// Automatic phone number detection
const phoneMatch = message.match(/(?:\+27|0)[6-8][0-9]{8}/);
if (phoneMatch && !conversationContext.userPhone) {
  setConversationContext(prev => ({ 
    ...prev, 
    userPhone: phoneMatch[0], 
    smsOptIn: true 
  }));
}
```

### Smart Notifications
```javascript
// Send SMS when appropriate
if (conversationContext.userPhone && conversationContext.smsOptIn) {
  await sendRateAlert({
    fromCurrency: 'ZAR',
    toCurrency: 'ZWL', 
    rate: 17.32,
    amount: 1000,
    recipientAmount: '17,320.00'
  });
}
```

## 🔐 Privacy & Security

### User Privacy
- ✅ Explicit opt-in required for SMS
- ✅ Easy opt-out with "STOP" replies  
- ✅ Phone numbers not stored permanently
- ✅ SMS content follows data privacy guidelines

### Security Features
- ✅ Phone number validation
- ✅ Rate limiting on SMS endpoints
- ✅ Secure SMSPortal OAuth 2.0 authentication
- ✅ Error handling and logging

## 📊 Usage Analytics

### Tracking SMS Success
```javascript
// All SMS sends are logged with:
logger.info(`Transaction alert SMS sent to ${phoneNumber}`, {
  messageId: result.messageId,
  reference: transactionData.reference,
  timestamp: new Date().toISOString()
});
```

### Metrics to Monitor
- SMS delivery rates
- User opt-in rates  
- Escalation SMS effectiveness
- Cost per SMS vs user engagement

## 🚨 Troubleshooting

### Common Issues

1. **SMS Not Received**
   - Check phone number format
   - Verify SMSPortal credits
   - Check network coverage
   
2. **Authentication Errors**
   - Verify SMSPortal credentials
   - Check client ID and secret
   - Ensure account is active

3. **Rate Limiting**
   - SMSPortal has sending limits
   - Implement queuing for high volume
   - Monitor usage vs limits

### Debug Commands
```bash
# Test authentication
node -e "require('./src/services/smsService').testAuth()"

# Test single SMS
node -e "require('./src/services/smsService').sendSMS('+27821234567', 'Test message')"

# Check logs
tail -f logs/app.log | grep SMS
```

## 🔄 Future Enhancements

### Planned Features
- 📅 Scheduled SMS reminders
- 🌍 Multi-language SMS templates  
- 📈 SMS analytics dashboard
- 🤖 AI-powered SMS personalization
- 📱 WhatsApp Business integration

### Integration Opportunities
- Link with user accounts for persistent preferences
- Connect with real transaction system for actual status updates
- Integrate with CRM for support ticket management
- Add SMS-based two-factor authentication

## 📞 Support

For SMS integration support:
- 📧 Email: dev@pacheduconnect.com
- 📱 SMS: Send "HELP" to any PacheduConnect SMS
- 💬 Chatbot: Ask about "SMS issues"
- 🌐 Docs: [SMS Portal Documentation](https://www.smsportal.com/docs)

---

**✨ The SMS integration makes the chatbot more powerful by extending conversations beyond the web interface, keeping users informed and engaged throughout their money transfer journey!**