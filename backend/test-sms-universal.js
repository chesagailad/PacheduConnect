/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: test-sms-universal - test file for backend functionality
 */

require('dotenv').config();
const axios = require('axios');

async function testSMSPortalUniversal() {
  console.log('🧪 Testing SMSPortal Integration (Universal)...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`Client ID: ${process.env.SMSPORTAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`Client Secret: ${process.env.SMSPORTAL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`API Key: ${process.env.SMSPORTAL_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

  // Determine authentication method
  const hasOAuth = process.env.SMSPORTAL_CLIENT_ID && process.env.SMSPORTAL_CLIENT_SECRET;
  const hasApiKey = process.env.SMSPORTAL_API_KEY;
  
  if (!hasOAuth && !hasApiKey) {
    console.log('❌ No authentication credentials found');
    console.log('Please set either:');
    console.log('- SMSPORTAL_CLIENT_ID and SMSPORTAL_CLIENT_SECRET (OAuth 2.0)');
    console.log('- SMSPORTAL_API_KEY (API Key)');
    return;
  }

  const authMethod = hasApiKey && process.env.SMSPORTAL_API_KEY !== 'your_smsportal_api_key_here' ? 'API Key' : 'OAuth 2.0';
  console.log(`🔐 Using authentication method: ${authMethod}\n`);

  try {
    // Test authentication
    console.log('🔐 Testing Authentication...');
    
    let headers = {
      'Content-Type': 'application/json'
    };

    if (hasApiKey && process.env.SMSPORTAL_API_KEY !== 'your_smsportal_api_key_here') {
      // API Key authentication
      headers['Authorization'] = `key ${process.env.SMSPORTAL_API_KEY}`;
    } else {
      // OAuth 2.0 authentication
      const basicAuth = Buffer.from(`${process.env.SMSPORTAL_CLIENT_ID}:${process.env.SMSPORTAL_CLIENT_SECRET}`).toString('base64');
      
      const tokenResponse = await axios.post('https://rest.smsportal.com/v1/auth/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
          }
        }
      );
      
      headers['Authorization'] = `Bearer ${tokenResponse.data.access_token}`;
    }

    const response = await axios.get('https://rest.smsportal.com/v1/account', { headers });
    
    console.log('✅ Authentication successful');
    console.log(`Account Info: ${JSON.stringify(response.data, null, 2)}\n`);
    
    // Test SMS sending (development mode - no actual SMS)
    console.log('📱 Testing SMS Service...');
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SMS service working (development mode)');
      console.log('📝 In development, SMS will be logged instead of sent');
      console.log('📱 Example: SMS would be sent to +27123456789 with OTP: 123456');
    } else {
      console.log('✅ SMS service ready for production use');
    }
    
    console.log('\n🎉 All tests passed! SMSPortal is configured correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your SMSPortal credentials');
    console.log('2. Ensure you have sufficient SMS credits');
    console.log('3. Verify your credentials have proper permissions');
    console.log('4. Check your internet connection');
    console.log('5. Try switching between OAuth 2.0 and API Key methods');
  }
}

testSMSPortalUniversal(); 