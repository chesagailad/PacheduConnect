'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FeeTransparencyProps {
  className?: string;
}

export default function FeeTransparency({ className = '' }: FeeTransparencyProps) {
  const [selectedAmount, setSelectedAmount] = useState(1000);

  const feeStructure = [
    { range: 'R0 - R500', fee: 'R15', percentage: '3%' },
    { range: 'R501 - R1000', fee: 'R25', percentage: '2.5%' },
    { range: 'R1001 - R5000', fee: 'R35', percentage: '1.5%' },
    { range: 'R5001+', fee: 'R50', percentage: '1%' }
  ];

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
    if (amount <= 500) return 15;
    if (amount <= 1000) return 25;
    if (amount <= 5000) return 35;
    return 50;
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
            No hidden fees, no surprises. See exactly what you'll pay
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
                    <span className="text-gray-600">Transfer Fee:</span>
                    <span className="font-semibold text-warning-600">R{currentFee}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Cost:</span>
                      <span className="text-primary-600">R{totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fee Table */}
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Fee Structure
              </h3>
              
              <div className="space-y-4">
                {feeStructure.map((tier, index) => (
                  <motion.div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      selectedAmount >= parseInt(tier.range.split(' - ')[0].replace('R', '')) &&
                      selectedAmount <= parseInt(tier.range.split(' - ')[1].replace('R', ''))
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    variants={itemVariants}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{tier.range}</h4>
                        <p className="text-sm text-gray-600">Flat fee: {tier.fee}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary-600">{tier.fee}</span>
                        <p className="text-xs text-gray-500">{tier.percentage}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-success-50 rounded-xl border border-success-200">
                <div className="flex items-start space-x-3">
                  <div className="text-success-600 text-xl">✅</div>
                  <div>
                    <h4 className="font-semibold text-success-800">No Hidden Fees</h4>
                    <p className="text-sm text-success-700 mt-1">
                      What you see is what you pay. No additional charges or surprise fees.
                    </p>
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