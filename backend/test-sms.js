require('dotenv').config();
const smsService = require('./src/services/smsService');

async function testSMSPortal() {
  console.log('🧪 Testing SMSPortal Integration...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`Client ID: ${process.env.SMSPORTAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`Client Secret: ${process.env.SMSPORTAL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

  if (!process.env.SMSPORTAL_CLIENT_ID || !process.env.SMSPORTAL_CLIENT_SECRET) {
    console.log('❌ Missing required environment variables');
    console.log('Please set SMSPORTAL_CLIENT_ID and SMSPORTAL_CLIENT_SECRET in your .env file');
    return;
  }

  try {
    // Test authentication
    console.log('🔐 Testing Authentication...');
    const authResult = await smsService.testAuth();
    console.log('✅ Authentication successful');
    console.log(`Account Info: ${JSON.stringify(authResult.account, null, 2)}\n`);
    
    // Test SMS sending (development mode - no actual SMS)
    console.log('📱 Testing SMS Service...');
    const result = await smsService.sendTestOTP('+27123456789', '123456');
    console.log('✅ SMS service working');
    console.log(`Result: ${JSON.stringify(result, null, 2)}\n`);
    
    console.log('🎉 All tests passed! SMSPortal is configured correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your SMSPortal Client ID and Client Secret');
    console.log('2. Ensure you have sufficient SMS credits');
    console.log('3. Verify your credentials have proper permissions');
    console.log('4. Check your internet connection');
  }
}

testSMSPortal(); 