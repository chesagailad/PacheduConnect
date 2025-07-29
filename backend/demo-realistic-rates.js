/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: demo-realistic-rates - handles backend functionality
 */

/**
 * Demo with Realistic Exchange Rates
 * Shows how the system will work with real XE API data (non-trial)
 */

require('dotenv').config();

// Simulate realistic exchange rates with margin already applied
const realisticRates = {
  ZAR: {
    USD: 0.055123,    // ~0.0543 + 1.5% margin (realistic ZAR/USD rate)
    MWK: 95.847,      // ~94.45 + 1.5% margin  
    MZN: 3.523        // ~3.47 + 1.5% margin
  },
  USD: {
    ZAR: 18.142,      // ~17.87 + 1.5% margin
    MWK: 1739.15,     // ~1713.5 + 1.5% margin
    MZN: 63.91        // ~62.98 + 1.5% margin
  },
  MWK: {
    ZAR: 0.01044,     // ~0.01029 + 1.5% margin
    USD: 0.000575,    // ~0.000566 + 1.5% margin
    MZN: 0.03675      // ~0.0362 + 1.5% margin
  },
  MZN: {
    ZAR: 0.284,       // ~0.280 + 1.5% margin
    USD: 0.01565,     // ~0.01542 + 1.5% margin
    MWK: 27.22        // ~26.82 + 1.5% margin
  }
};

function calculateCommission(amount, currency) {
  if (currency === 'ZAR') {
    const commissionAmount = amount * 0.035; // 3.5%
    return {
      commissionRate: 0.035,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      totalAmount: parseFloat((amount + commissionAmount).toFixed(2)),
      currency: 'ZAR'
    };
  }
  
  return {
    commissionRate: 0,
    commissionAmount: 0,
    totalAmount: parseFloat(amount.toFixed(2)),
    currency
  };
}

function convertWithRealisticRates(amount, fromCurrency, toCurrency) {
  // Input validation for currency parameters
  const supportedCurrencies = Object.keys(realisticRates);
  
  if (!fromCurrency || typeof fromCurrency !== 'string') {
    throw new Error('Invalid fromCurrency: must be a non-empty string');
  }
  
  if (!toCurrency || typeof toCurrency !== 'string') {
    throw new Error('Invalid toCurrency: must be a non-empty string');
  }
  
  if (!supportedCurrencies.includes(fromCurrency)) {
    throw new Error(`Unsupported fromCurrency '${fromCurrency}'. Supported currencies: ${supportedCurrencies.join(', ')}`);
  }
  
  if (!supportedCurrencies.includes(toCurrency)) {
    throw new Error(`Unsupported toCurrency '${toCurrency}'. Supported currencies: ${supportedCurrencies.join(', ')}`);
  }
  
  // Additional validation for amount
  if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
    throw new Error('Invalid amount: must be a positive number');
  }
  
  // Handle same currency conversion
  if (fromCurrency === toCurrency) {
    const commission = calculateCommission(amount, fromCurrency);
    return {
      originalAmount: parseFloat(amount.toFixed(2)),
      convertedAmount: parseFloat(amount.toFixed(2)),
      fromCurrency,
      toCurrency,
      rate: 1.000000,
      commission,
      margin: 0.000, // No margin for same currency
      timestamp: new Date().toISOString(),
      source: 'Same currency conversion'
    };
  }
  
  // Check if specific rate is available
  if (!realisticRates[fromCurrency] || !realisticRates[fromCurrency][toCurrency]) {
    throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
  }
  
  const rate = realisticRates[fromCurrency][toCurrency];
  const convertedAmount = amount * rate;
  const commission = calculateCommission(amount, fromCurrency);
  
  return {
    originalAmount: parseFloat(amount.toFixed(2)),
    convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    fromCurrency,
    toCurrency,
    rate: parseFloat(rate.toFixed(6)),
    commission,
    margin: 0.015,
    timestamp: new Date().toISOString(),
    source: 'XE Currency Data API (Simulated Real Rates)'
  };
}

async function demoRealisticRates() {
  console.log('🌟 PacheduConnect - Realistic Rate Demonstration');
  console.log('=' .repeat(60));
  console.log('This shows how the system performs with real XE API rates');
  console.log('(once upgraded from free trial to paid plan)');
  
  // Real-world transaction scenarios
  const scenarios = [
    {
      title: 'South Africa → Zimbabwe Remittance',
      amount: 10000,
      from: 'ZAR',
      to: 'USD',
      description: 'Typical family remittance'
    },
    {
      title: 'South Africa → Malawi Transfer', 
      amount: 5000,
      from: 'ZAR',
      to: 'MWK',
      description: 'Business payment'
    },
    {
      title: 'South Africa → Mozambique Transfer',
      amount: 2500,
      from: 'ZAR',
      to: 'MZN', 
      description: 'Personal transfer'
    },
    {
      title: 'USD → ZAR (Reverse Transfer)',
      amount: 500,
      from: 'USD',
      to: 'ZAR',
      description: 'No commission scenario'
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`\n💰 ${index + 1}. ${scenario.title}`);
    console.log('-'.repeat(50));
    console.log(`Description: ${scenario.description}`);
    
    try {
      const conversion = convertWithRealisticRates(scenario.amount, scenario.from, scenario.to);
      
      console.log(`\n📊 Transaction Details:`);
      console.log(`  Amount Sending: ${conversion.originalAmount.toFixed(2)} ${scenario.from}`);
      console.log(`  Exchange Rate: ${conversion.rate} (includes 1.5% margin)`);
      console.log(`  Amount Converting To: ${conversion.convertedAmount.toFixed(2)} ${scenario.to}`);
      
      if (conversion.commission.commissionAmount > 0) {
        console.log(`\n💼 Platform Fees:`);
        console.log(`  Commission Rate: ${(conversion.commission.commissionRate * 100).toFixed(1)}%`);
        console.log(`  Commission Amount: ${conversion.commission.commissionAmount.toFixed(2)} ${conversion.commission.currency}`);
        console.log(`  Total Deducted: ${conversion.commission.totalAmount.toFixed(2)} ${conversion.commission.currency}`);
        
        console.log(`\n✅ Summary:`);
        console.log(`  Customer Pays: ${conversion.commission.totalAmount.toFixed(2)} ${scenario.from}`);
        console.log(`  Recipient Gets: ${conversion.convertedAmount.toFixed(2)} ${scenario.to}`);
        console.log(`  Platform Revenue: ${conversion.commission.commissionAmount.toFixed(2)} ${scenario.from}`);
      } else {
        console.log(`\n💰 No Commission Applied (${scenario.from} not charged)`);
        console.log(`\n✅ Summary:`);
        console.log(`  Customer Pays: ${conversion.originalAmount.toFixed(2)} ${scenario.from}`);
        console.log(`  Recipient Gets: ${conversion.convertedAmount.toFixed(2)} ${scenario.to}`);
        console.log(`  Platform Revenue: Margin only (embedded in rate)`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  });

  // Rate comparison table
  console.log(`\n📈 Current Rate Matrix (Realistic with 1.5% Margin)`);
  console.log('-'.repeat(60));
  console.log('FROM\\TO    USD       ZAR       MWK       MZN');
  console.log('-'.repeat(60));
  
  Object.keys(realisticRates).forEach(fromCurrency => {
    let row = `${fromCurrency.padEnd(8)}`;
    ['USD', 'ZAR', 'MWK', 'MZN'].forEach(toCurrency => {
      if (fromCurrency === toCurrency) {
        row += '1.000000  ';
      } else if (realisticRates[fromCurrency][toCurrency]) {
        const rate = realisticRates[fromCurrency][toCurrency];
        if (rate < 0.001) {
          row += rate.toFixed(8).padEnd(10);
        } else if (rate < 1) {
          row += rate.toFixed(6).padEnd(10);
        } else {
          row += rate.toFixed(3).padEnd(10);
        }
      } else {
        row += 'N/A       ';
      }
    });
    console.log(row);
  });

  console.log(`\n🎯 Platform Economics (per ZAR 10,000 transaction):`);
  console.log('-'.repeat(50));
  
  const bigTransaction = convertWithRealisticRates(10000, 'ZAR', 'USD');
  const marginRevenue = 10000 * 0.015; // 1.5% margin on original amount
  const commissionRevenue = bigTransaction.commission.commissionAmount;
  const totalRevenue = marginRevenue + commissionRevenue;
  
  console.log(`  Exchange Rate Margin Revenue: ZAR ${marginRevenue.toFixed(2)}`);
  console.log(`  Commission Revenue: ZAR ${commissionRevenue.toFixed(2)}`); 
  console.log(`  Total Platform Revenue: ZAR ${totalRevenue.toFixed(2)}`);
  console.log(`  Revenue Percentage: ${((totalRevenue / 10000) * 100).toFixed(2)}%`);

  console.log(`\n⚡ Next Steps to Activate Real Rates:`);
  console.log('-'.repeat(40));
  console.log('1. Upgrade XE API account from FREE TRIAL to paid plan');
  console.log('2. Recommended: Lite plan ($799/year, 10,000 requests/month)');
  console.log('3. With 5-min caching: supports ~2,000 rate queries/hour');
  console.log('4. Real-time rates will replace demo data automatically');
  console.log('5. No code changes needed - integration ready!');
  
  console.log(`\n✅ Integration Status: PRODUCTION READY`);
  console.log('All systems functional, awaiting XE account upgrade.');
}

// Run the demo
if (require.main === module) {
  demoRealisticRates()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
    });
}

module.exports = { demoRealisticRates, convertWithRealisticRates };