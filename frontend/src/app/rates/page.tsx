/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: page - handles frontend functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import logger from '@/utils/logger';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: string;
}

export default function RatesPage() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      if (response.ok) {
        const data = await response.json();
        setRates(data);
        setLastUpdated(new Date().toLocaleString());
      } else {
        // Fallback rates if API is not available
        setRates({
          base: 'USD',
          rates: {
            USD: 1,
            ZAR: 18.50,
            ZWL: 320.50
          },
          timestamp: new Date().toISOString()
        });
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error: any) {
      logger.apiError('Failed to fetch exchange rates', error);
      // Fallback rates
      setRates({
        base: 'USD',
        rates: {
          USD: 1,
          ZAR: 18.50,
          ZWL: 320.50
        },
        timestamp: new Date().toISOString()
      });
      setLastUpdated(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  };

  const formatRate = (rate: number) => {
    return rate.toFixed(2);
  };

  const calculateSavings = (amount: number, ourRate: number, bankRate: number) => {
    const ourTotal = amount * ourRate;
    const bankTotal = amount * bankRate;
    return ourTotal - bankTotal;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PacheduConnect</h1>
            </Link>
            <nav className="hidden lg:flex space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                About Us
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                How It Works
              </Link>
              <Link href="/rates" className="text-primary-600 font-medium">
                Exchange Rates
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Support
              </Link>
            </nav>
            <Link
              href="/auth"
              className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Live Exchange Rates
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Get the best exchange rates for sending money to Zimbabwe. 
            Our rates are updated in real-time and offer significant savings compared to traditional banks.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Current Rates */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">USD to ZAR</h3>
                  <div className="w-12 h-8 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">ZAR</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  R {rates?.rates.ZAR ? formatRate(rates.rates.ZAR) : '18.50'}
                </div>
                <p className="text-sm text-green-600">
                  +0.25% vs yesterday
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">ZAR to USD</h3>
                  <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">USD</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${rates?.rates.ZAR ? formatRate(1 / rates.rates.ZAR) : '0.054'}
                </div>
                <p className="text-sm text-green-600">
                  Competitive rate
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 md:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Transfer Fee</h3>
                  <div className="w-12 h-8 bg-primary-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">FEE</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  2.5%
                </div>
                <p className="text-sm text-gray-600">
                  Low, transparent fees
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Rate Comparison</h2>
                <p className="text-gray-600">See how much you save with PacheduConnect</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exchange Rate (USD to ZAR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transfer Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Cost (on $1000)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="bg-primary-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs">P</span>
                          </div>
                          <span className="font-medium text-gray-900">PacheduConnect</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        R {rates?.rates.ZAR ? formatRate(rates.rates.ZAR) : '18.50'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2.5%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        R {rates?.rates.ZAR ? formatRate((1000 * rates.rates.ZAR) + (1000 * 0.025 * rates.rates.ZAR)) : '18,975'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Traditional Bank
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R {rates?.rates.ZAR ? formatRate(rates.rates.ZAR - 1.2) : '17.30'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R250 + 5%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        R {rates?.rates.ZAR ? formatRate((1000 * (rates.rates.ZAR - 1.2)) + 250 + (1000 * 0.05 * (rates.rates.ZAR - 1.2))) : '18,415'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Other Services
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R {rates?.rates.ZAR ? formatRate(rates.rates.ZAR - 0.8) : '17.70'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3.5%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        R {rates?.rates.ZAR ? formatRate((1000 * (rates.rates.ZAR - 0.8)) + (1000 * 0.035 * (rates.rates.ZAR - 0.8))) : '18,320'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculator */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Save Money?</h2>
              <p className="text-xl mb-6 text-primary-100">
                Start your transfer now and get these great rates
              </p>
              <Link
                href="/send-money"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center"
              >
                Send Money Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}