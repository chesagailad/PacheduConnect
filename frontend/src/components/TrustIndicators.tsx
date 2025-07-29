/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: TrustIndicators - handles frontend functionality
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TrustIndicatorsProps {
  className?: string;
}

export default function TrustIndicators({ className = '' }: TrustIndicatorsProps) {
  const indicators = [
    {
      icon: '🔒',
      title: 'Bank-Level Security',
      description: '256-bit SSL encryption'
    },
    {
      icon: '⚡',
      title: 'Instant Transfers',
      description: '2-4 hour delivery'
    },
    {
      icon: '💎',
      title: 'Best Rates',
      description: 'Guaranteed competitive rates'
    },
    {
      icon: '🛡️',
      title: 'Licensed & Regulated',
      description: 'FSCA approved'
    }
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

  return (
    <motion.div
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {indicators.map((indicator, index) => (
        <motion.div
          key={index}
          className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100 hover:bg-white/80 transition-all duration-200"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-2xl mb-2">{indicator.icon}</div>
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {indicator.title}
          </h4>
          <p className="text-xs text-gray-600">
            {indicator.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
} 