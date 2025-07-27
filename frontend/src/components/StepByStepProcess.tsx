'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StepByStepProcessProps {
  className?: string;
}

export default function StepByStepProcess({ className = '' }: StepByStepProcessProps) {
  const steps = [
    {
      number: '1',
      title: 'Create Account',
      description: 'Sign up in under 2 minutes with your ID or passport',
      icon: '👤',
      color: 'from-blue-500 to-blue-600'
    },
    {
      number: '2',
      title: 'Add Recipient',
      description: 'Enter your loved one\'s details and delivery method',
      icon: '👥',
      color: 'from-purple-500 to-purple-600'
    },
    {
      number: '3',
      title: 'Send Money',
      description: 'Choose your amount and payment method',
      icon: '💸',
      color: 'from-green-500 to-green-600'
    },
    {
      number: '4',
      title: 'Money Delivered',
      description: 'Recipient gets money in 2-4 hours',
      icon: '✅',
      color: 'from-success-500 to-success-600'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.section
      className={`py-16 bg-gradient-to-br from-gray-50 to-white ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🚀 How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Send money to Zimbabwe in just 4 simple steps
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              variants={itemVariants}
            >
              {/* Step Card */}
              <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 hover:shadow-medium transition-all duration-300 h-full">
                {/* Step Number */}
                <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg mb-4`}>
                  {step.number}
                </div>

                {/* Step Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Step Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full absolute -top-1 right-0"></div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-12"
          variants={itemVariants}
        >
          <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of customers who trust Pachedu for their money transfers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Send Money Now
              </button>
              <button className="btn-secondary">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
} 