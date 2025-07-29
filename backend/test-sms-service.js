/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: test-sms-service - test file for backend functionality
 */

require('dotenv').config();
const smsService = require('./src/services/smsService');

async function testSMSService() {
  try {
    console.log('Testing SMS service...');
    
    // Test sending SMS directly (skip account endpoint test)
    console.log('Testing SMS sending...');
    const smsResult = await smsService.sendOTP('+27838755929', '123456');
    console.log('SMS result:', smsResult);
    
    console.log('✅ SMS test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSMSService(); 