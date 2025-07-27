require('dotenv').config();
const smsService = require('./src/services/smsService');

async function testChatbotSMS() {
  console.log('🤖 Testing Chatbot SMS Notifications...\n');

  // Test phone number (use your own for testing)
const testPhone = '+27838755929'; // Replace with your phone number
  
  try {
    // Test 1: Transaction Alert
    console.log('📱 Testing Transaction Alert...');
    const transactionData = {
      amount: 1000,
      currency: 'ZAR',
      recipient: 'John Doe',
      reference: 'PC123456',
      status: 'completed'
    };
    
    await smsService.sendTransactionAlert(testPhone, transactionData);
    console.log('✅ Transaction alert sent successfully');
    
    // Wait 2 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Exchange Rate Alert
    console.log('\n📊 Testing Exchange Rate Alert...');
    const rateData = {
      fromCurrency: 'ZAR',
      toCurrency: 'ZWL',
      rate: 17.32,
      amount: 1000,
      recipientAmount: '17,320.00'
    };
    
    await smsService.sendExchangeRateAlert(testPhone, rateData);
    console.log('✅ Rate alert sent successfully');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Escalation Alert
    console.log('\n🆘 Testing Escalation Alert...');
    const escalationData = {
      ticketNumber: 'PC789012',
      estimatedWaitTime: 2,
      agentName: 'Sarah from Support'
    };
    
    await smsService.sendEscalationAlert(testPhone, escalationData);
    console.log('✅ Escalation alert sent successfully');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Follow-up SMS
    console.log('\n💬 Testing Follow-up SMS...');
    const followUpData = {
      query: 'How much to send R500 to Zimbabwe?',
      suggestedAction: 'Visit our rates page',
      helpUrl: 'pacheduconnect.com/rates'
    };
    
    await smsService.sendChatbotFollowUp(testPhone, followUpData);
    console.log('✅ Follow-up SMS sent successfully');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Custom SMS (like test message)
    console.log('\n🧪 Testing Custom SMS...');
    await smsService.sendSMS(testPhone, 'Hi! This is a test message from PacheduConnect chatbot. Your SMS alerts are working perfectly! 🎉');
    console.log('✅ Custom SMS sent successfully');

    console.log('\n🎉 All SMS tests completed successfully!');
    console.log('📱 Check your phone for the test messages.');
    
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
    
    if (error.message.includes('Failed to authenticate')) {
      console.log('\n💡 Fix: Check your SMSPortal credentials in .env file:');
      console.log('   SMSPORTAL_CLIENT_ID=your_client_id');
      console.log('   SMSPORTAL_CLIENT_SECRET=your_client_secret');
    }
  }
}

// Test authentication first
async function testAuth() {
  console.log('🔐 Testing SMSPortal Authentication...\n');
  
  try {
    const authResult = await smsService.testAuth();
    console.log('✅ Authentication successful!');
    console.log('Account info:', authResult.account);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 PacheduConnect Chatbot SMS Integration Test\n');
  console.log('=' .repeat(50));
  
  // Check if credentials are configured
  if (!process.env.SMSPORTAL_CLIENT_ID || !process.env.SMSPORTAL_CLIENT_SECRET) {
    console.log('❌ SMSPortal credentials not configured!');
    console.log('\nPlease set up your .env file with:');
    console.log('SMSPORTAL_CLIENT_ID=your_client_id');
    console.log('SMSPORTAL_CLIENT_SECRET=your_client_secret');
    process.exit(1);
  }
  
  // Test authentication first
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed with SMS tests - authentication failed');
    process.exit(1);
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // Run SMS tests
  await testChatbotSMS();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test completed! Check your phone for messages.');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testChatbotSMS, testAuth };