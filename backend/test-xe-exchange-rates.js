/**
 * Test script for XE Currency Data API integration
 * Tests real-time exchange rates with margin and commission for Pachedu platform
 */

require('dotenv').config();
const { 
  convertCurrency, 
  getExchangeRate, 
  getAllRates, 
  calculateCommission,
  getFeeStructure,
  SUPPORTED_CURRENCIES,
  EXCHANGE_RATE_MARGIN,
  ZAR_COMMISSION_RATE
} = require('./src/utils/exchangeRate');

async function testXEIntegration() {
  console.log('🚀 Testing XE Currency Data API Integration for Pachedu');
  console.log('=' .repeat(70));
  
  try {
    // Test 1: Get platform fee structure
    console.log('\n📋 1. Platform Fee Structure');
    console.log('-'.repeat(40));
    const feeStructure = getFeeStructure();
    console.log('Supported Currencies:', feeStructure.supportedCurrencies);
    console.log('Exchange Rate Margin:', `${feeStructure.exchangeRateMargin * 100}%`);
    console.log('ZAR Commission Rate:', `${feeStructure.zarCommissionRate * 100}%`);
    console.log('Margin Description:', feeStructure.description.margin);
    console.log('Commission Description:', feeStructure.description.zarCommission);

    // Test 2: Get all exchange rates
    console.log('\n💱 2. All Exchange Rates (Real-time from XE)');
    console.log('-'.repeat(40));
    const allRates = await getAllRates();
    console.log('Source:', allRates.source);
    console.log('Timestamp:', allRates.timestamp);
    console.log('Applied Margin:', `${allRates.margin * 100}%`);
    console.log('ZAR Commission Rate:', `${allRates.zarCommissionRate * 100}%`);
    
    console.log('\nExchange Rate Matrix:');
    SUPPORTED_CURRENCIES.forEach(fromCurrency => {
      console.log(`\n${fromCurrency} →`);
      SUPPORTED_CURRENCIES.forEach(toCurrency => {
        if (fromCurrency !== toCurrency && allRates.rates[fromCurrency]) {
          const rate = allRates.rates[fromCurrency][toCurrency];
          if (rate) {
            console.log(`  ${toCurrency}: ${rate.toFixed(6)}`);
          }
        }
      });
    });

    // Test 3: Specific exchange rate queries
    console.log('\n🔍 3. Specific Exchange Rate Queries');
    console.log('-'.repeat(40));
    
    const testPairs = [
      ['ZAR', 'USD'],
      ['USD', 'ZAR'],
      ['ZAR', 'MWK'],
      ['USD', 'MZN']
    ];

    for (const [from, to] of testPairs) {
      try {
        const rate = await getExchangeRate(from, to);
        console.log(`${from} → ${to}: ${rate.rate.toFixed(6)} (${rate.source})`);
      } catch (error) {
        console.log(`${from} → ${to}: Error - ${error.message}`);
      }
    }

    // Test 4: Currency conversions with commission
    console.log('\n💰 4. Currency Conversions with Commission');
    console.log('-'.repeat(40));
    
    const testConversions = [
      { amount: 1000, from: 'ZAR', to: 'USD' },
      { amount: 100, from: 'USD', to: 'ZAR' },
      { amount: 5000, from: 'ZAR', to: 'MWK' },
      { amount: 500, from: 'USD', to: 'MZN' }
    ];

    for (const test of testConversions) {
      try {
        const conversion = await convertCurrency(test.amount, test.from, test.to);
        
        console.log(`\n${test.amount} ${test.from} → ${test.to}:`);
        console.log(`  Exchange Rate: ${conversion.rate.toFixed(6)}`);
        console.log(`  Converted Amount: ${conversion.convertedAmount.toFixed(2)} ${test.to}`);
        console.log(`  Margin Applied: ${conversion.margin * 100}%`);
        
        if (conversion.commission.commissionAmount > 0) {
          console.log(`  Commission: ${conversion.commission.commissionAmount.toFixed(2)} ${conversion.commission.currency} (${conversion.commission.commissionRate * 100}%)`);
          console.log(`  Total with Commission: ${conversion.commission.totalAmount.toFixed(2)} ${conversion.commission.currency}`);
        } else {
          console.log(`  Commission: None (not ZAR transaction)`);
        }
        
        console.log(`  Source: ${conversion.source}`);
      } catch (error) {
        console.log(`Error converting ${test.amount} ${test.from} to ${test.to}: ${error.message}`);
      }
    }

    // Test 5: Commission calculations
    console.log('\n💼 5. ZAR Commission Calculations');
    console.log('-'.repeat(40));
    
    const zarAmounts = [500, 1000, 2500, 5000, 10000];
    
    zarAmounts.forEach(amount => {
      const commission = calculateCommission(amount, 'ZAR');
      console.log(`ZAR ${amount.toFixed(2)}:`);
      console.log(`  Commission (${commission.commissionRate * 100}%): ZAR ${commission.commissionAmount.toFixed(2)}`);
      console.log(`  Total Amount: ZAR ${commission.totalAmount.toFixed(2)}`);
    });

    // Test 6: Non-ZAR commission (should be zero)
    console.log('\n🚫 6. Non-ZAR Commission (Should be Zero)');
    console.log('-'.repeat(40));
    
    const nonZarTests = [
      { amount: 1000, currency: 'USD' },
      { amount: 50000, currency: 'MWK' },
      { amount: 3000, currency: 'MZN' }
    ];

    nonZarTests.forEach(test => {
      const commission = calculateCommission(test.amount, test.currency);
      console.log(`${test.currency} ${test.amount}: Commission = ${commission.commissionAmount} (Rate: ${commission.commissionRate * 100}%)`);
    });

    // Test 7: Real-world scenario - Sending money from South Africa to Zimbabwe
    console.log('\n🌍 7. Real-world Scenario: ZAR 10,000 → USD (South Africa to Zimbabwe)');
    console.log('-'.repeat(40));
    
    const sendAmount = 10000;
    const conversion = await convertCurrency(sendAmount, 'ZAR', 'USD');
    
    console.log(`Sending: ZAR ${sendAmount.toFixed(2)}`);
    console.log(`Exchange Rate: ${conversion.rate.toFixed(6)} (includes ${conversion.margin * 100}% margin)`);
    console.log(`Converted Amount: USD ${conversion.convertedAmount.toFixed(2)}`);
    console.log(`Platform Commission: ZAR ${conversion.commission.commissionAmount.toFixed(2)} (${conversion.commission.commissionRate * 100}%)`);
    console.log(`Total Deducted from Sender: ZAR ${conversion.commission.totalAmount.toFixed(2)}`);
    console.log(`Net Amount Recipient Receives: USD ${conversion.convertedAmount.toFixed(2)}`);
    console.log(`Source: ${conversion.source}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('XE Currency Data API credentials')) {
      console.log('\n⚠️  Setup Instructions:');
      console.log('1. Sign up for XE Currency Data API: https://xecdapi.xe.com/');
      console.log('2. Set environment variables:');
      console.log('   XE_ACCOUNT_ID=your_account_id');
      console.log('   XE_API_KEY=your_api_key');
      console.log('3. Update your .env file with these credentials');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testXEIntegration()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testXEIntegration };