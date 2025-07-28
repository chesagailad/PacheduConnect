'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ExchangeRateCalculatorProps {
  className?: string;
}

export default function ExchangeRateCalculator({ className = '' }: ExchangeRateCalculatorProps) {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('ZAR');
  const [toCurrency, setToCurrency] = useState('ZWD');
  const [exchangeRate, setExchangeRate] = useState(0.0025);
  const [fee, setFee] = useState(0);
  const [total, setTotal] = useState(0);

  // Mock exchange rate data
  const rates = {
    'ZAR-ZWD': 0.0025,
    'USD-ZWD': 0.00015,
    'EUR-ZWD': 0.00018,
  };

  useEffect(() => {
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const currentRate = rates[rateKey as keyof typeof rates] || 0.0025;
    
    setExchangeRate(currentRate);
    
    const numAmount = parseFloat(amount) || 0;
    // Flat 3% fee on sending amount
    const currentFee = numAmount * 0.03;
    setFee(currentFee);
    
    const calculatedTotal = (numAmount * currentRate);
    setTotal(Math.max(0, calculatedTotal));
  }, [amount, fromCurrency, toCurrency]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-soft border border-gray-100 p-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        className="text-xl font-semibold text-gray-900 mb-6"
        variants={itemVariants}
      >
        💱 Live Exchange Rate Calculator
      </motion.h3>

      <div className="space-y-4">
        <motion.div variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Send
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="input-field"
            min="0"
            step="0.01"
          />
        </motion.div>

        <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="select-field"
            >
              <option value="ZAR">🇿🇦 South African Rand (ZAR)</option>
              <option value="USD">🇺🇸 US Dollar (USD)</option>
              <option value="EUR">🇪🇺 Euro (EUR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="select-field"
            >
              <option value="ZWD">🇿🇼 Zimbabwe Dollar (ZWD)</option>
            </select>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 border border-primary-100"
          variants={itemVariants}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exchange Rate:</span>
              <span className="font-semibold text-primary-600">
                1 {fromCurrency} = {(exchangeRate * 1000).toFixed(2)} {toCurrency}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transfer Fee (3%):</span>
              <span className="font-semibold text-warning-600">
                {fee.toFixed(2)} {fromCurrency}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between text-base font-semibold">
                <span className="text-gray-800">Recipient Gets:</span>
                <span className="text-success-600">
                  {total.toFixed(2)} {toCurrency}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gray-50 rounded-xl p-4"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Simple 3% flat fee • Rates updated every 5 minutes • Delivery in 2-4 hours</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
} 