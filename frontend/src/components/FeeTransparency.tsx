/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: FeeTransparency - handles frontend functionality
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FeeTransparencyProps {
  className?: string;
}

export default function FeeTransparency({ className = '' }: FeeTransparencyProps) {
  const [selectedAmount, setSelectedAmount] = useState(1000);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Fee calculation constants
  const FEE_RATE = 0.03; // 3% flat fee
  const MIN_AMOUNT = 10; // Minimum transfer amount in ZAR
  const MAX_AMOUNT = 50000; // Maximum transfer amount in ZAR
  const MIN_FEE = 0.01; // Minimum fee amount

  interface FeeCalculationResult {
    isValid: boolean;
    fee: number;
    error?: string;
    totalCost?: number;
  }

  const calculateFee = (amount: number): FeeCalculationResult => {
    // Input validation
    if (typeof amount !== 'number' || isNaN(amount)) {
      return {
        isValid: false,
        fee: 0,
        error: 'Invalid amount: must be a valid number'
      };
    }

    if (amount < 0) {
      return {
        isValid: false,
        fee: 0,
        error: 'Amount must be positive'
      };
    }

    if (amount === 0) {
      return {
        isValid: false,
        fee: 0,
        error: 'Amount must be greater than zero'
      };
    }

    if (amount < MIN_AMOUNT) {
      return {
        isValid: false,
        fee: 0,
        error: `Minimum transfer amount is R ${MIN_AMOUNT.toLocaleString()}`
      };
    }

    if (amount > MAX_AMOUNT) {
      return {
        isValid: false,
        fee: 0,
        error: `Maximum transfer amount is R ${MAX_AMOUNT.toLocaleString()}`
      };
    }

    // Calculate fee with minimum fee protection
    let fee = amount * FEE_RATE;
    fee = Math.max(fee, MIN_FEE);

    return {
      isValid: true,
      fee: parseFloat(fee.toFixed(2)),
      totalCost: parseFloat((amount + fee).toFixed(2))
    };
  };

  const feeResult = calculateFee(selectedAmount);
  const currentFee = feeResult.fee;
  const totalCost = feeResult.totalCost || (selectedAmount + currentFee);

  return (
    <motion.section
      className={`py-16 bg-white ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            💰 Transparent Fee Structure
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple, transparent pricing. 3% flat fee on all transfers
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Fee Calculator */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 border border-primary-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Fee Calculator
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Amount (ZAR)
                  </label>
                  <input
                    type="range"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step="100"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>R{MIN_AMOUNT.toLocaleString()}</span>
                    <span className="font-semibold text-primary-600">
                      R{selectedAmount.toLocaleString()}
                    </span>
                    <span>R{MAX_AMOUNT.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Amount:</span>
                    <span className="font-semibold">R{selectedAmount.toLocaleString()}</span>
                  </div>
                  
                  {!feeResult.isValid ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-700 text-sm font-medium">{feeResult.error}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transfer Fee (3%):</span>
                        <span className="font-semibold text-warning-600">R{currentFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Cost:</span>
                          <span className="text-primary-600">R{totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fee Structure */}
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Simple 3% Flat Fee
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary-200 bg-primary-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">All Transfer Amounts</h4>
                      <p className="text-sm text-gray-600">Flat fee: 3% of sending amount</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary-600">3%</span>
                      <p className="text-xs text-gray-500">Flat rate</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Example 1</h4>
                    <p className="text-xs text-gray-600 mb-1">Send R500</p>
                    <p className="text-xs text-gray-600">Fee: R15 (3%)</p>
                    <p className="text-xs text-gray-600">Total: R515</p>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Example 2</h4>
                    <p className="text-xs text-gray-600 mb-1">Send R3,000</p>
                    <p className="text-xs text-gray-600">Fee: R90 (3%)</p>
                    <p className="text-xs text-gray-600">Total: R3,090</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-success-50 rounded-xl border border-success-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-success-600 text-xl">✅</div>
                    <div>
                      <h4 className="font-semibold text-success-800">Simple & Transparent</h4>
                      <p className="text-sm text-success-700 mt-1">
                        No hidden fees, no surprises. Just a simple 3% fee on your sending amount.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
} 