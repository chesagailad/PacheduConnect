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

  const calculateFee = (amount: number) => {
    // Flat 3% fee on sending amount
    return (amount * 0.03);
  };

  const currentFee = calculateFee(selectedAmount);
  const totalCost = selectedAmount + currentFee;

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
                    min="100"
                    max="10000"
                    step="100"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>R100</span>
                    <span className="font-semibold text-primary-600">
                      R{selectedAmount.toLocaleString()}
                    </span>
                    <span>R10,000</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Amount:</span>
                    <span className="font-semibold">R{selectedAmount.toLocaleString()}</span>
                  </div>
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