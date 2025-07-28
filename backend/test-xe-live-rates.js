/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: test-xe-live-rates - test file for backend functionality
 */

/**
 * Focused test for XE API live rates
 * Tests the actual API response structure and rates for ZAR → USD
 */

require('dotenv').config();
const axios = require('axios');

// XE API Configuration
const XE_API_BASE_URL = 'https://xecdapi.xe.com/v1';
const XE_ACCOUNT_ID = process.env.XE_ACCOUNT_ID;
const XE_API_KEY = process.env.XE_API_KEY;

function getXEAuthHeader() {
  const credentials = Buffer.from(`${XE_ACCOUNT_ID}:${XE_API_KEY}`).toString('base64');
  return `Basic ${credentials}`;
}

async function testLiveRates() {
  console.log('🔍 Testing XE API Live Rates - Focused Test');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Account Information
    console.log('\n📋 1. Account Information');
    console.log('-'.repeat(30));
    
    try {
      const accountResponse = await axios.get(`${XE_API_BASE_URL}/account_info.json`, {
        headers: { 'Authorization': getXEAuthHeader() },
        timeout: 10000
      });
      
      console.log('Account ID:', accountResponse.data.id);
      console.log('Organization:', accountResponse.data.organization);
      console.log('Package:', accountResponse.data.package);
      console.log('Requests Remaining:', accountResponse.data.package_limit_remaining);
      console.log('Monthly Limit:', accountResponse.data.package_limit);
    } catch (error) {
      console.log('Account info error:', error.response?.data || error.message);
    }

    // Test 2: Available Currencies
    console.log('\n💱 2. Available Currencies');
    console.log('-'.repeat(30));
    
    try {
      const currenciesResponse = await axios.get(`${XE_API_BASE_URL}/currencies.json`, {
        headers: { 'Authorization': getXEAuthHeader() },
        timeout: 10000
      });
      
      const supportedCurrencies = ['ZAR', 'USD', 'MWK', 'MZN'];
      const availableCurrencies = currenciesResponse.data.currencies;
      
      supportedCurrencies.forEach(currency => {
        const found = availableCurrencies.find(c => c.iso === currency);
        if (found) {
          console.log(`✅ ${currency}: ${found.currency_name} (${found.is_obsolete ? 'Obsolete' : 'Active'})`);
        } else {
          console.log(`❌ ${currency}: Not found in available currencies`);
        }
      });
      
    } catch (error) {
      console.log('Currencies error:', error.response?.data || error.message);
    }

    // Test 3: ZAR to USD Conversion (Real-world test)
    console.log('\n💰 3. ZAR → USD Conversion Test');
    console.log('-'.repeat(30));
    
    try {
      const conversionResponse = await axios.get(`${XE_API_BASE_URL}/convert_from.json`, {
        params: {
          from: 'ZAR',
          to: 'USD',
          amount: 1000,
          margin: 1.5, // 1.5% margin
          decimal_places: 6
        },
        headers: { 'Authorization': getXEAuthHeader() },
        timeout: 10000
      });
      
      console.log('Raw API Response:');
      console.log(JSON.stringify(conversionResponse.data, null, 2));
      
      if (conversionResponse.data.to && conversionResponse.data.to.length > 0) {
        const conversion = conversionResponse.data.to[0];
        console.log('\nParsed Conversion:');
        console.log(`Amount: ${conversionResponse.data.amount} ${conversionResponse.data.from}`);
        console.log(`Rate: ${conversion.mid}`);
        console.log(`Converted: ${conversion.mid * conversionResponse.data.amount} ${conversion.quotecurrency}`);
        console.log(`Timestamp: ${conversionResponse.data.timestamp}`);
      }
      
    } catch (error) {
      console.log('Conversion error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('❌ Authentication failed - check credentials');
      } else if (error.response?.status === 403) {
        console.log('❌ Access forbidden - check account permissions');
      }
    }

    // Test 4: Multiple Currency Conversion
    console.log('\n🌍 4. Multiple Currency Test');
    console.log('-'.repeat(30));
    
    try {
      const multiResponse = await axios.get(`${XE_API_BASE_URL}/convert_from.json`, {
        params: {
          from: 'USD',
          to: 'ZAR,EUR,GBP', // Test with common currencies first
          amount: 100,
          margin: 1.5,
          decimal_places: 6
        },
        headers: { 'Authorization': getXEAuthHeader() },
        timeout: 10000
      });
      
      console.log('Multiple currency conversion:');
      multiResponse.data.to.forEach(conversion => {
        console.log(`USD → ${conversion.quotecurrency}: ${conversion.mid}`);
      });
      
    } catch (error) {
      console.log('Multiple conversion error:', error.response?.data || error.message);
    }

    // Test 5: African Currencies Specific Test
    console.log('\n🌍 5. African Currencies Test');
    console.log('-'.repeat(30));
    
    const africanCurrencies = ['MWK', 'MZN'];
    
    for (const currency of africanCurrencies) {
      try {
        console.log(`\nTesting USD → ${currency}:`);
        
        const response = await axios.get(`${XE_API_BASE_URL}/convert_from.json`, {
          params: {
            from: 'USD',
            to: currency,
            amount: 100,
            decimal_places: 6
          },
          headers: { 'Authorization': getXEAuthHeader() },
          timeout: 10000
        });
        
        if (response.data.to && response.data.to.length > 0) {
          const conversion = response.data.to[0];
          console.log(`  Rate: ${conversion.mid}`);
          console.log(`  100 USD = ${conversion.mid * 100} ${currency}`);
        } else {
          console.log(`  ❌ No conversion data returned for ${currency}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error for ${currency}:`, error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testLiveRates()
    .then(() => {
      console.log('\n✅ Live rate test completed!');
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
    });
}

module.exports = { testLiveRates };