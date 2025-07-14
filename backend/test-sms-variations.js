require('dotenv').config();
const axios = require('axios');

// Test different SMSPortal authentication methods
async function testSMSPortalAuth() {
  const client_id = process.env.SMSPORTAL_CLIENT_ID;
  const client_secret = process.env.SMSPORTAL_CLIENT_SECRET;
  const phoneNumber = '+27838755929';
  const testOTP = '123456';

  console.log('Testing SMSPortal authentication variations...');
  console.log('Client ID:', client_id ? '***' + client_id.slice(-4) : 'NOT SET');
  console.log('Client Secret:', client_secret ? '***' + client_secret.slice(-4) : 'NOT SET');
  console.log('Phone Number:', phoneNumber);
  console.log('Test OTP:', testOTP);
  console.log('---\n');

  // Test 1: Basic Auth with form data
  console.log('Test 1: Basic Auth with form data');
  try {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    
    const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    const response1 = await axios.post('https://rest.smsportal.com/Authentication', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      }
    });
    
    console.log('✅ Success! Full response:', JSON.stringify(response1.data, null, 2));
    const token = response1.data.token;
    console.log('Token:', token ? '***' + token.slice(-10) : 'NONE');
    
    // Try to send SMS with this token
    if (token) {
      const smsResponse = await axios.post('https://rest.smsportal.com/BulkMessages', {
        messages: [{
          content: `Test SMS: Your OTP is ${testOTP}`,
          destination: phoneNumber
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ SMS sent successfully:', smsResponse.data);
    } else {
      console.log('⚠️ No token received, cannot send SMS');
    }
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  console.log('---\n');

  // Test 2: JSON payload with Basic Auth
  console.log('Test 2: JSON payload with Basic Auth');
  try {
    const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    const response2 = await axios.post('https://rest.smsportal.com/Authentication', {
      grant_type: 'client_credentials'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      }
    });
    
    console.log('✅ Success! Full response:', JSON.stringify(response2.data, null, 2));
    const token = response2.data.token;
    console.log('Token:', token ? '***' + token.slice(-10) : 'NONE');
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  console.log('---\n');

  // Test 3: No auth header, just JSON
  console.log('Test 3: No auth header, just JSON');
  try {
    const response3 = await axios.post('https://rest.smsportal.com/Authentication', {
      client_id,
      client_secret,
      grant_type: 'client_credentials'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Full response:', JSON.stringify(response3.data, null, 2));
    const token = response3.data.token;
    console.log('Token:', token ? '***' + token.slice(-10) : 'NONE');
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
  console.log('---\n');

  // Test 4: Different endpoint variations
  console.log('Test 4: Different endpoint variations');
  const endpoints = [
    'https://rest.smsportal.com/Authentication',
    'https://rest.smsportal.com/v1/Authentication',
    'https://rest.smsportal.com/v1/auth',
    'https://rest.smsportal.com/auth'
  ];

  for (const endpoint of endpoints) {
    console.log(`Trying endpoint: ${endpoint}`);
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      
      const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`
        }
      });
      
      console.log('✅ Success! Full response:', JSON.stringify(response.data, null, 2));
      const token = response.data.token;
      console.log('Token:', token ? '***' + token.slice(-10) : 'NONE');
      break;
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data || error.message);
    }
  }
  console.log('---\n');

  // Test 5: API Key method (if available)
  console.log('Test 5: API Key method');
  const apiKey = process.env.SMSPORTAL_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.post('https://rest.smsportal.com/BulkMessages', {
        messages: [{
          content: `Test SMS via API Key: Your OTP is ${testOTP}`,
          destination: phoneNumber
        }]
      }, {
        headers: {
          'Authorization': `key ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API Key method successful:', response.data);
    } catch (error) {
      console.log('❌ API Key method failed:', error.response?.data || error.message);
    }
  } else {
    console.log('⚠️ No API key configured');
  }
  console.log('---\n');
}

// Run the tests
testSMSPortalAuth().catch(console.error); 