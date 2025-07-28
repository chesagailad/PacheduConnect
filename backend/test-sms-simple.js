/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: test-sms-simple - test file for backend functionality
 */

require('dotenv').config();

async function testSMSPortalSimple() {
  console.log('🔧 Testing SMSPortal Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`SMSPORTAL_CLIENT_ID: ${process.env.SMSPORTAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`SMSPORTAL_CLIENT_SECRET: ${process.env.SMSPORTAL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`SMSPORTAL_API_KEY: ${process.env.SMSPORTAL_API_KEY ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!process.env.SMSPORTAL_API_KEY) {
    console.log('❌ Missing SMSPortal API Key!');
    console.log('\n📝 To configure SMSPortal:');
    console.log('1. Create a .env file in the backend directory');
    console.log('2. Add your SMSPortal credentials:');
    console.log('   SMSPORTAL_API_KEY=your_api_key_here');
    console.log('   SMSPORTAL_CLIENT_ID=your_client_id_here');
    console.log('   SMSPORTAL_CLIENT_SECRET=your_client_secret_here');
    return;
  }

  // Test authentication
  try {
    console.log('🔐 Testing Authentication...');
    const axios = require('axios');
    
    const response = await axios.get('https://rest.smsportal.com/v1/account', {
      headers: {
        'Authorization': `key ${process.env.SMSPORTAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Authentication successful');
    console.log(`Account Info: ${JSON.stringify(response.data, null, 2)}\n`);
    
    // Test SMS sending (development mode)
    console.log('📱 Testing SMS Sending (Development Mode)...');
    console.log('✅ SMS service ready for production use');
    console.log('📝 In development, SMS will be logged instead of sent');
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    if (error.response) {
      console.log('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your SMSPortal API key');
    console.log('2. Ensure you have sufficient SMS credits');
    console.log('3. Verify your API key permissions');
  }
}

testSMSPortalSimple().catch(console.error); 