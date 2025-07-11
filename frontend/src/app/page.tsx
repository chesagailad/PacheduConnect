'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Country data with flags and exchange rates
const countries = [
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', rate: 0.0028, delivery: '2-5 minutes' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', rate: 0.054, delivery: '5-10 minutes' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', rate: 0.0012, delivery: '10-15 minutes' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', rate: 0.016, delivery: '15-30 minutes' },
];

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [sendAmount, setSendAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [fees, setFees] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate exchange rate and fees
  useEffect(() => {
    if (sendAmount && !isNaN(parseFloat(sendAmount))) {
      setIsCalculating(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const amount = parseFloat(sendAmount);
        const exchangeRate = selectedCountry.rate;
        const calculated = amount * exchangeRate;
        const fee = Math.max(15, amount * 0.02); // 2% fee, minimum R15
        const total = amount + fee;
        
        setCalculatedAmount(calculated);
        setFees(fee);
        setTotalAmount(total);
        setIsCalculating(false);
      }, 800);
    }
  }, [sendAmount, selectedCountry]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)"
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <motion.header 
        className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pachedu
              </h1>
            </motion.div>
            
            <nav className="hidden md:flex space-x-8">
              {['About', 'Services', 'Contact'].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href={`/${item.toLowerCase()}`} 
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                  >
                    {item}
                  </Link>
                </motion.div>
              ))}
            </nav>
            
            <motion.div 
              className="flex space-x-4"
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href="/auth"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Login / Register
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Content */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="space-y-6">
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight"
                variants={itemVariants}
              >
                Send Money to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Africa
                </span>
                <br />
                <span className="text-gray-600 text-4xl md:text-5xl">
                  from South Africa
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 leading-relaxed"
                variants={itemVariants}
              >
                Fast, secure, and reliable money transfers. Connect with your loved ones 
                through the most trusted remittance platform in Southern Africa.
              </motion.p>
            </div>

            {/* Country Selection */}
            <motion.div variants={itemVariants} className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700">
                Where would you like to send money?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {countries.map((country) => (
                  <motion.button
                    key={country.code}
                    onClick={() => setSelectedCountry(country)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedCountry.code === country.code
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-2xl mb-2">{country.flag}</div>
                    <div className="text-sm font-medium text-gray-700">{country.name}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href="/send-money"
                  className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Send Money Now
                </Link>
              </motion.div>
              
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href="/download-app"
                  className="block border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-all duration-200"
                >
                  Download App
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column - Calculator */}
          <motion.div 
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Real-time Calculator
            </h2>
            
            {/* Amount Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Send (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R
                  </span>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Calculation Results */}
              <AnimatePresence>
                {sendAmount && !isNaN(parseFloat(sendAmount)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"
                  >
                    {isCalculating ? (
                      <div className="flex items-center justify-center py-4">
                        <motion.div
                          className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="ml-2 text-gray-600">Calculating...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Exchange Rate:</span>
                          <span className="font-semibold">1 ZAR = {selectedCountry.rate.toFixed(4)} {selectedCountry.code}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">You'll Send:</span>
                          <span className="font-bold text-lg text-green-600">
                            {calculatedAmount.toFixed(2)} {selectedCountry.code}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fees:</span>
                          <span className="font-semibold text-red-600">R {fees.toFixed(2)}</span>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-semibold">Total Cost:</span>
                            <span className="font-bold text-xl text-blue-600">R {totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="text-center text-sm text-gray-500 mt-3">
                          Estimated delivery: {selectedCountry.delivery}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div 
          className="mt-24"
          variants={containerVariants}
        >
          <motion.h2 
            className="text-3xl font-bold text-center text-gray-900 mb-12"
            variants={itemVariants}
          >
            Why Choose Pachedu?
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Transfer money in minutes, not days",
                color: "from-yellow-400 to-orange-500"
              },
              {
                icon: "🔒",
                title: "Secure & Safe",
                description: "Bank-grade security for your money",
                color: "from-green-400 to-blue-500"
              },
              {
                icon: "💎",
                title: "Best Rates",
                description: "Competitive exchange rates",
                color: "from-purple-400 to-pink-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 text-3xl`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
} 