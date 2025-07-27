/**
 * Test Script for SMS Service Input Validation
 * This script tests the new validation methods added to smsService.js
 */

const smsService = require('./src/services/smsService');

console.log('🧪 Testing SMS Service Input Validation...\n');

// Test 1: Phone Number Validation
console.log('📱 Testing Phone Number Validation...');
try {
  // This should fail - missing phone number
  await smsService.sendTransactionAlert(null, {
    amount: 500,
    currency: 'ZAR',
    recipient: 'John Doe',
    reference: 'TXN123',
    status: 'completed'
  });
} catch (error) {
  console.log('✅ Correctly caught null phone number:', error.message);
}

try {
  // This should fail - invalid phone number format
  await smsService.sendTransactionAlert('123456789', {
    amount: 500,
    currency: 'ZAR',
    recipient: 'John Doe',
    reference: 'TXN123',
    status: 'completed'
  });
} catch (error) {
  console.log('✅ Correctly caught invalid phone format:', error.message);
}

// Test 2: Required Fields Validation
console.log('\n📋 Testing Required Fields Validation...');
try {
  // This should fail - missing required fields
  await smsService.sendExchangeRateAlert('+27838755929', {
    fromCurrency: 'ZAR',
    // Missing: toCurrency, rate, amount, recipientAmount
  });
} catch (error) {
  console.log('✅ Correctly caught missing required fields:', error.message);
}

// Test 3: Message Length Warning
console.log('\n📏 Testing Message Length Validation...');
try {
  // This should trigger a length warning
  await smsService.sendDocumentAlert('+27838755929', {
    documentType: 'Very Long Document Type Name That Could Potentially Make The Message Too Long',
    status: 'rejected',
    nextSteps: 'Please resubmit your documents with much clearer photos and ensure all details are visible and legible for processing'
  });
} catch (error) {
  console.log('📝 Note: This may show a length warning above');
}

// Test 4: Conditional Validation
console.log('\n🔧 Testing Conditional Validation...');
try {
  // This should fail - rejected document without nextSteps
  await smsService.sendDocumentAlert('+27838755929', {
    documentType: 'ID Document',
    status: 'rejected'
    // Missing nextSteps for rejected status
  });
} catch (error) {
  console.log('✅ Correctly caught missing nextSteps for rejected status:', error.message);
}

// Test 5: Security Alert Type Validation
console.log('\n🔒 Testing Security Alert Validation...');
try {
  // This should fail - invalid alert type
  await smsService.sendSecurityAlert('+27838755929', {
    alertType: 'invalid_type',
    time: '2024-12-01 10:30'
  });
} catch (error) {
  console.log('✅ Correctly caught invalid security alert type:', error.message);
}

// Test 6: Valid SMS (should work in development mode)
console.log('\n✅ Testing Valid SMS...');
try {
  // This should work (in development, it will log instead of send)
  const result = await smsService.sendTransactionAlert('+27838755929', {
    amount: 500,
    currency: 'ZAR',
    recipient: 'John Doe',
    reference: 'TXN123456',
    status: 'completed'
  });
  console.log('✅ Valid SMS processed successfully');
} catch (error) {
  console.log('❌ Unexpected error with valid data:', error.message);
}

console.log('\n🎉 SMS Validation Tests Completed!');
console.log('\n💡 Validation Features Added:');
console.log('- Phone number format validation (South African numbers)');
console.log('- Required field validation for all methods');
console.log('- Message length warnings (>160 characters)');
console.log('- Conditional validation (e.g., nextSteps for rejected documents)');
console.log('- Alert type validation for security alerts');
console.log('- Comprehensive error messages');

async function runTests() {
  try {
    console.log('Running validation tests...');
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

runTests().catch(console.error);