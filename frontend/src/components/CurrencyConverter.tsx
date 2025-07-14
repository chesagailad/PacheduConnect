'use client';

import React, { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ExchangeRate {
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  timestamp: string;
}

interface Conversion {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: string;
}

interface CurrencyRates {
  base: string;
  rates: Record<string, number>;
  timestamp: string;
  supportedCurrencies: string[];
}

interface TransferCosts {
  transferFee: number;
  exchangeFee: number;
  totalFees: number;
  totalCost: number;
  netAmount: number;
  feePercentage: number;
}

interface CountryInfo {
  name: string;
  currency: string;
  currencyName: string;
  transferFee: number;
  exchangeFee: number;
  minAmount: number;
  maxAmount: number;
  deliveryTime: string;
}

const COUNTRY_DATA: Record<string, CountryInfo> = {
  'Zimbabwe': {
    name: 'Zimbabwe',
    currency: 'USD',
    currencyName: 'US Dollar',
    transferFee: 15.00,
    exchangeFee: 2.5,
    minAmount: 50,
    maxAmount: 10000,
    deliveryTime: '2-4 hours'
  },
  'Malawi': {
    name: 'Malawi',
    currency: 'MWK',
    currencyName: 'Malawi Kwacha',
    transferFee: 12.00,
    exchangeFee: 3.0,
    minAmount: 100,
    maxAmount: 8000,
    deliveryTime: '1-3 hours'
  },
  'Zambia': {
    name: 'Zambia',
    currency: 'ZMW',
    currencyName: 'Zambian Kwacha',
    transferFee: 14.00,
    exchangeFee: 2.8,
    minAmount: 80,
    maxAmount: 9000,
    deliveryTime: '2-4 hours'
  },
  'Botswana': {
    name: 'Botswana',
    currency: 'BWP',
    currencyName: 'Botswana Pula',
    transferFee: 18.00,
    exchangeFee: 2.2,
    minAmount: 120,
    maxAmount: 12000,
    deliveryTime: '1-2 hours'
  },
  'Namibia': {
    name: 'Namibia',
    currency: 'NAD',
    currencyName: 'Namibian Dollar',
    transferFee: 16.00,
    exchangeFee: 2.4,
    minAmount: 100,
    maxAmount: 11000,
    deliveryTime: '1-3 hours'
  },
  'Mozambique': {
    name: 'Mozambique',
    currency: 'MZN',
    currencyName: 'Mozambican Metical',
    transferFee: 13.00,
    exchangeFee: 2.7,
    minAmount: 90,
    maxAmount: 8500,
    deliveryTime: '2-4 hours'
  }
};

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('ZAR');
  const [toCountry, setToCountry] = useState<string>('Zimbabwe');
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [transferCosts, setTransferCosts] = useState<TransferCosts | null>(null);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (amount && fromCurrency && toCountry) {
      convertCurrency();
      fetchExchangeRate();
      calculateTransferCosts();
    }
  }, [amount, fromCurrency, toCountry]);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/exchange-rates`);
      if (res.ok) {
        const data: CurrencyRates = await res.json();
        setCurrencies(data.supportedCurrencies || ['USD', 'EUR', 'GBP', 'ZAR', 'CAD', 'AUD', 'JPY', 'CHF']);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setCurrencies(['USD', 'EUR', 'GBP', 'ZAR', 'CAD', 'AUD', 'JPY', 'CHF']);
    }
  };

  const convertCurrency = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setConversion(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const toCurrency = COUNTRY_DATA[toCountry]?.currency || 'USD';
      const res = await fetch(`${API_URL}/api/transactions/convert-currency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          fromCurrency,
          toCurrency
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConversion(data.conversion);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Conversion failed');
      }
    } catch (err) {
      setError('Failed to convert currency');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    const toCurrency = COUNTRY_DATA[toCountry]?.currency || 'USD';
    if (fromCurrency === toCurrency) {
      setExchangeRate({
        rate: 1,
        fromCurrency,
        toCurrency,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions/exchange-rate/${fromCurrency}/${toCurrency}`);
      if (res.ok) {
        const data = await res.json();
        setExchangeRate(data.rate);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
    }
  };

  const calculateTransferCosts = () => {
    if (!amount || !toCountry || !COUNTRY_DATA[toCountry]) return;

    const amountNum = parseFloat(amount);
    const countryInfo = COUNTRY_DATA[toCountry];
    
    // Calculate fees
    const transferFee = countryInfo.transferFee;
    const exchangeFee = (amountNum * countryInfo.exchangeFee) / 100;
    const totalFees = transferFee + exchangeFee;
    const totalCost = amountNum + totalFees;
    const netAmount = amountNum - totalFees;
    const feePercentage = (totalFees / amountNum) * 100;

    setTransferCosts({
      transferFee,
      exchangeFee,
      totalFees,
      totalCost,
      netAmount,
      feePercentage
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { 
      USD: '$', EUR: '€', GBP: '£', ZAR: 'R', CAD: 'C$', AUD: 'A$', JPY: '¥', CHF: 'CHF',
      MWK: 'MK', ZMW: 'K', BWP: 'P', NAD: 'N$', MZN: 'MT'
    };
    return `${symbols[currency] || ''}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCountryFlag = (countryName: string) => {
    const flags: Record<string, string> = {
      'Zimbabwe': '🇿🇼',
      'Malawi': '🇲🇼',
      'Zambia': '🇿🇲',
      'Botswana': '🇧🇼',
      'Namibia': '🇳🇦',
      'Mozambique': '🇲🇿'
    };
    return flags[countryName] || '🌍';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Currency Converter</h3>
      
      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-gray-700 mb-2 font-medium">Amount to Send</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter amount (e.g., 1000)"
            step="0.01"
            min="0"
          />
        </div>

        {/* Currency and Country Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">From Currency</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-medium">To Country</label>
            <select
              value={toCountry}
              onChange={(e) => setToCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.keys(COUNTRY_DATA).map((country) => (
                <option key={country} value={country}>
                  {getCountryFlag(country)} {country} ({COUNTRY_DATA[country].currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Country Information */}
        {toCountry && COUNTRY_DATA[toCountry] && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">{getCountryFlag(toCountry)}</span>
              <div>
                <h4 className="font-semibold text-blue-900">{COUNTRY_DATA[toCountry].name}</h4>
                <p className="text-blue-700 text-sm">{COUNTRY_DATA[toCountry].currencyName} ({COUNTRY_DATA[toCountry].currency})</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Delivery Time:</span>
                <p className="text-blue-600">{COUNTRY_DATA[toCountry].deliveryTime}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Transfer Limit:</span>
                <p className="text-blue-600">{formatCurrency(COUNTRY_DATA[toCountry].minAmount, fromCurrency)} - {formatCurrency(COUNTRY_DATA[toCountry].maxAmount, fromCurrency)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Rate Display */}
        {exchangeRate && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-green-800 font-medium">Exchange Rate:</span>
              <span className="text-green-900 font-semibold">
                1 {exchangeRate.fromCurrency} = {exchangeRate.rate.toFixed(6)} {exchangeRate.toCurrency}
              </span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              Last updated: {formatDate(exchangeRate.timestamp)}
            </p>
          </div>
        )}

        {/* Transfer Cost Breakdown */}
        {transferCosts && conversion && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Transfer Cost Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700">Amount to Send:</span>
                <span className="font-semibold text-purple-900">
                  {formatCurrency(parseFloat(amount), fromCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-purple-700">Transfer Fee:</span>
                <span className="font-semibold text-purple-900">
                  {formatCurrency(transferCosts.transferFee, fromCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-purple-700">Exchange Fee ({COUNTRY_DATA[toCountry]?.exchangeFee}%):</span>
                <span className="font-semibold text-purple-900">
                  {formatCurrency(transferCosts.exchangeFee, fromCurrency)}
                </span>
              </div>
              
              <div className="border-t border-purple-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">Total Fees:</span>
                  <span className="font-semibold text-purple-900">
                    {formatCurrency(transferCosts.totalFees, fromCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">Total Cost:</span>
                  <span className="font-semibold text-purple-900 text-lg">
                    {formatCurrency(transferCosts.totalCost, fromCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">Fee Percentage:</span>
                  <span className="font-semibold text-purple-900">
                    {transferCosts.feePercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversion Result */}
        {conversion && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">Conversion Result</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Amount Sent:</span>
                <span className="text-green-900 font-semibold">
                  {formatCurrency(conversion.originalAmount, conversion.fromCurrency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Amount Received:</span>
                <span className="text-green-900 font-semibold text-lg">
                  {formatCurrency(conversion.convertedAmount, conversion.toCurrency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Rate Used:</span>
                <span className="text-green-900 font-semibold">
                  {conversion.rate.toFixed(6)}
                </span>
              </div>
            </div>
            <p className="text-green-600 text-sm mt-2">
              Conversion time: {formatDate(conversion.timestamp)}
            </p>
          </div>
        )}

        {/* Example Calculations */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-3">💡 Example Calculations</h4>
          <div className="space-y-2 text-sm">
            <p className="text-yellow-800">
              <strong>R1000 to Zimbabwe (USD):</strong> R1000 + R15 transfer fee + R25 exchange fee = R1040 total cost
            </p>
            <p className="text-yellow-800">
              <strong>R1000 to Malawi (MWK):</strong> R1000 + R12 transfer fee + R30 exchange fee = R1042 total cost
            </p>
            <p className="text-yellow-700 text-xs">
              * Fees and rates may vary. This is for demonstration purposes only.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Calculating transfer costs...</p>
          </div>
        )}
      </div>
    </div>
  );
} 