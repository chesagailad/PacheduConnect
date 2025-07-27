require('dotenv').config();
const axios = require('axios');

async function debugSMSPortal() {
  console.log('🔍 Debugging SMSPortal Authentication...\n');
  
  const clientId = process.env.SMSPORTAL_CLIENT_ID;
  const clientSecret = process.env.SMSPORTAL_CLIENT_SECRET;
  
  console.log('📋 Credentials:');
  console.log(`Client ID: ${clientId}`);
  console.log(`Client Secret: ${clientSecret ? '***' + clientSecret.slice(-4) : 'Missing'}\n`);
  
  if (!clientId || !clientSecret) {
    console.log('❌ Missing credentials');
    return;
  }
  
  try {
    // Test 1: Basic auth header
    console.log('🔐 Test 1: Creating Basic Auth header...');
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log(`Basic Auth: Basic ${basicAuth.substring(0, 20)}...\n`);
    
    // Test 2: Token request
    console.log('🔐 Test 2: Requesting access token...');
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    
    console.log('Request URL: https://rest.smsportal.com/v1/auth/token');
    console.log('Request Headers:', {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth.substring(0, 20)}...`
    });
    console.log('Request Body:', formData.toString());
    
    const response = await axios.post('https://rest.smsportal.com/v1/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      timeout: 10000
    });
    
    console.log('✅ Token request successful!');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Test 3: Use token to get account info
    if (response.data.access_token) {
      console.log('\n🔐 Test 3: Testing account endpoint...');
      
      const accountResponse = await axios.get('https://rest.smsportal.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Account request successful!');
      console.log('Account Info:', JSON.stringify(accountResponse.data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Error Message:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Headers:', error.response.headers);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    }
    
    console.log('\n🔧 Possible issues:');
    console.log('1. Invalid credentials');
    console.log('2. Network connectivity issues');
    console.log('3. SMSPortal API endpoint changed');
    console.log('4. Account suspended or insufficient credits');
  }
}

debugSMSPortal().catch(console.error); 