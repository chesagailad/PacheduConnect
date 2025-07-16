'use client';

import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { API_CONFIG } from '@/config/api';

const API_URL = API_CONFIG.BASE_URL;

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

export default function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      convertCurrency();
      fetchExchangeRate();
    }
  }, [amount, fromCurrency, toCurrency]);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/exchange-rates`);
      if (res.ok) {
        const data: CurrencyRates = await res.json();
        setCurrencies(data.supportedCurrencies || ['USD', 'EUR', 'GBP', 'ZAR', 'CAD', 'AUD', 'JPY', 'CHF']);
      }
    } catch (err: any) {
      logger.apiError('Failed to fetch currencies', err);
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
    } catch (err: any) {
      setError('Failed to convert currency');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
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
    } catch (err: any) {
      logger.apiError('Failed to fetch exchange rate', err, { fromCurrency, toCurrency, amount });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R', CAD: 'C$', AUD: 'A$', JPY: '¥', CHF: 'CHF' };
    return `${symbols[currency] || ''}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Converter</h3>
      
      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-gray-700 mb-2 font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter amount"
            step="0.01"
            min="0"
          />
        </div>

        {/* Currency Selection */}
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
            <label className="block text-gray-700 mb-2 font-medium">To Currency</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exchange Rate Display */}
        {exchangeRate && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-800 font-medium">Exchange Rate:</span>
              <span className="text-blue-900 font-semibold">
                1 {exchangeRate.fromCurrency} = {exchangeRate.rate.toFixed(6)} {exchangeRate.toCurrency}
              </span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Last updated: {formatDate(exchangeRate.timestamp)}
            </p>
          </div>
        )}

        {/* Conversion Result */}
        {conversion && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Original Amount:</span>
                <span className="text-green-900 font-semibold">
                  {formatCurrency(conversion.originalAmount, conversion.fromCurrency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Converted Amount:</span>
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
            <p className="text-gray-600 mt-2">Converting currency...</p>
          </div>
        )}
      </div>
    </div>
  );
} 