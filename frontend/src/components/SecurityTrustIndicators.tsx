/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: SecurityTrustIndicators - handles frontend functionality
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SecurityTrustIndicatorsProps {
  className?: string;
}

export default function SecurityTrustIndicators({ className = '' }: SecurityTrustIndicatorsProps) {
  const securityFeatures = [
    {
      icon: '🔒',
      title: 'Bank-Level Encryption',
      description: '256-bit SSL encryption protects all your data',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '🛡️',
      title: 'FSCA Licensed',
      description: 'Fully regulated by the Financial Sector Conduct Authority',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '🔐',
      title: 'Two-Factor Authentication',
      description: 'Extra security layer for your account',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '📱',
      title: 'Mobile Security',
      description: 'Biometric login and secure mobile app',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: '💳',
      title: 'PCI DSS Compliant',
      description: 'Payment card industry security standards',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: '🌐',
      title: 'Global Security',
      description: 'ISO 27001 certified information security',
      color: 'from-indigo-500 to-indigo-600'
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
    <motion.section
      className={`py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🛡️ Your Security is Our Priority
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            We use industry-leading security measures to protect your money and personal information
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                {feature.icon}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-12 text-center"
          variants={itemVariants}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-400 mb-2">$50M+</div>
                <div className="text-gray-300">Total Transferred</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-success-400 mb-2">99.9%</div>
                <div className="text-gray-300">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-warning-400 mb-2">0</div>
                <div className="text-gray-300">Security Breaches</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="text-center mt-8"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>FSCA Licensed</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>PCI DSS Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
} 