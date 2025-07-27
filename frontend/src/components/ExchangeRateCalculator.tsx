'use client';

import React, { useState, useEffect } from 'react';

interface ExchangeRate {
  rate: number;
  change: number;
  lastUpdated: string;
}

export default function ExchangeRateCalculator() {
  const [sendAmount, setSendAmount] = useState<number>(100);
  const [receiveAmount, setReceiveAmount] = useState<number>(15.4);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>({
    rate: 0.154,
    change: 2.3,
    lastUpdated: '2 min ago'
  });

  // Simulate real-time rate updates
  useEffect(() => {
    const interval = setInterval(() => {
      setExchangeRate(prev => ({
        ...prev,
        rate: prev.rate + (Math.random() - 0.5) * 0.001,
        lastUpdated: 'Just now'
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate receive amount when send amount changes
  useEffect(() => {
    const calculated = sendAmount * exchangeRate.rate;
    setReceiveAmount(Number(calculated.toFixed(2)));
  }, [sendAmount, exchangeRate.rate]);

  const handleSendAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSendAmount(numValue);
  };

  const transferFee = 15;
  const totalCost = sendAmount + transferFee;

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Live Exchange Rate</h3>
      
      {/* Exchange Rate Display */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-600">Current Rate</span>
          <span className="text-xs text-gray-500">Updated {exchangeRate.lastUpdated}</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          1 ZAR = {exchangeRate.rate.toFixed(3)} USD
        </div>
        <div className={`text-sm font-medium ${exchangeRate.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {exchangeRate.change >= 0 ? '+' : ''}{exchangeRate.change.toFixed(1)}% from yesterday
        </div>
      </div>

      {/* Calculator */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">You Send</label>
          <div className="relative">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => handleSendAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-500 font-medium">ZAR</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Gets</label>
          <div className="relative">
            <input
              type="number"
              value={receiveAmount}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              readOnly
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-500 font-medium">USD</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Transfer fee:</span>
            <span className="font-medium">R{transferFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Total cost:</span>
            <span className="font-medium text-gray-900">R{totalCost.toFixed(2)}</span>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
          Send Money Now
        </button>
      </div>
    </div>
  );
} 