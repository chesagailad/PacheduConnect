/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: test-validation - test file for backend functionality
 */

/**
 * Test script to demonstrate input validation
 * Tests the enhanced convertWithRealisticRates function with various invalid inputs
 */

const { convertWithRealisticRates } = require('./demo-realistic-rates');

function testInputValidation() {
  console.log('🧪 Testing Input Validation for convertWithRealisticRates');
  console.log('=' .repeat(60));
  
  const testCases = [
    // Valid case first
    {
      name: 'Valid conversion',
      amount: 1000,
      from: 'ZAR',
      to: 'USD',
      shouldPass: true
    },
    
    // Invalid currency tests
    {
      name: 'Invalid fromCurrency - empty string',
      amount: 1000,
      from: '',
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid fromCurrency - null',
      amount: 1000,
      from: null,
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid fromCurrency - undefined',
      amount: 1000,
      from: undefined,
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid fromCurrency - number',
      amount: 1000,
      from: 123,
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Unsupported fromCurrency',
      amount: 1000,
      from: 'EUR',
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid toCurrency - empty string',
      amount: 1000,
      from: 'ZAR',
      to: '',
      shouldPass: false
    },
    {
      name: 'Unsupported toCurrency',
      amount: 1000,
      from: 'ZAR',
      to: 'GBP',
      shouldPass: false
    },
    
    // Invalid amount tests
    {
      name: 'Invalid amount - negative',
      amount: -100,
      from: 'ZAR',
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid amount - zero',
      amount: 0,
      from: 'ZAR',
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid amount - string',
      amount: '1000',
      from: 'ZAR',
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid amount - NaN',
      amount: NaN,
      from: 'ZAR',
      to: 'USD',
      shouldPass: false
    },
    {
      name: 'Invalid amount - Infinity',
      amount: Infinity,
      from: 'ZAR',
      to: 'USD',
      shouldPass: false
    },
    
    // Edge cases
    {
      name: 'Same currency conversion',
      amount: 1000,
      from: 'ZAR',
      to: 'ZAR',
      shouldPass: true
    },
    {
      name: 'Very small amount',
      amount: 0.01,
      from: 'ZAR',
      to: 'USD',
      shouldPass: true
    },
    {
      name: 'Very large amount',
      amount: 1000000,
      from: 'ZAR',
      to: 'USD',
      shouldPass: true
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = convertWithRealisticRates(testCase.amount, testCase.from, testCase.to);
      
      if (testCase.shouldPass) {
        console.log('✅ PASS - Conversion successful');
        console.log(`   ${testCase.amount} ${testCase.from} → ${result.convertedAmount} ${testCase.to}`);
        console.log(`   Rate: ${result.rate}, Commission: ${result.commission.commissionAmount} ${result.commission.currency}`);
        passedTests++;
      } else {
        console.log('❌ FAIL - Expected error but conversion succeeded');
        console.log(`   Result: ${result.convertedAmount} ${result.toCurrency}`);
      }
      
    } catch (error) {
      if (!testCase.shouldPass) {
        console.log('✅ PASS - Correctly caught error');
        console.log(`   Error: ${error.message}`);
        passedTests++;
      } else {
        console.log('❌ FAIL - Unexpected error');
        console.log(`   Error: ${error.message}`);
      }
    }
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All validation tests passed successfully!');
    console.log('✅ Input validation is working correctly');
  } else {
    console.log('⚠️  Some tests failed - review validation logic');
  }
  
  // Summary of what validation catches
  console.log(`\n📋 Validation Summary:`);
  console.log('✅ Validates fromCurrency is a non-empty string');
  console.log('✅ Validates toCurrency is a non-empty string');
  console.log('✅ Checks currencies are supported (ZAR, USD, MWK, MZN)');
  console.log('✅ Validates amount is a positive finite number');
  console.log('✅ Provides clear error messages with supported currencies');
  console.log('✅ Prevents runtime errors from invalid inputs');
  
  return passedTests === totalTests;
}

// Run the test if this file is executed directly
if (require.main === module) {
  try {
    const success = testInputValidation();
    if (success) {
      console.log('\n✅ Validation test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some validation tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

module.exports = { testInputValidation };