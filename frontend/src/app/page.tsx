/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: page - handles frontend functionality
 */

/**
 * PacheduConnect Home Page
 * 
 * This is the main landing page for the PacheduConnect remittance platform.
 * It showcases the platform's features, benefits, and provides a clear
 * call-to-action for users to start sending money to Zimbabwe.
 * 
 * Page Sections:
 * - Header: Navigation and branding
 * - Hero: Main value proposition and CTA
 * - Exchange Rate Calculator: Real-time rate display
 * - Trust Indicators: Security and reliability badges
 * - Customer Testimonials: Social proof and reviews
 * - Fee Transparency: Clear pricing structure
 * - Step-by-Step Process: How the service works
 * - Security Trust Indicators: Safety and compliance
 * 
 * Features:
 * - Responsive design for all devices
 * - Smooth animations with Framer Motion
 * - SEO-optimized content structure
 * - Accessibility-compliant markup
 * - Performance-optimized components
 * - Clear user journey and conversion funnel
 * 
 * User Experience:
 * - Clear value proposition
 * - Trust-building elements
 * - Easy navigation and CTAs
 * - Mobile-first responsive design
 * - Fast loading and smooth interactions
 * 
 * @author PacheduConnect Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ExchangeRateCalculator from '../components/ExchangeRateCalculator';
import TrustIndicators from '../components/TrustIndicators';
import CustomerTestimonials from '../components/CustomerTestimonials';
import FeeTransparency from '../components/FeeTransparency';
import StepByStepProcess from '../components/StepByStepProcess';
import SecurityTrustIndicators from '../components/SecurityTrustIndicators';

export default function Home() {
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
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
      {/* Header */}
      <motion.header 
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div className="flex items-center space-x-2" variants={itemVariants}>
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Pachedu</span>
            </motion.div>

            <motion.nav className="hidden md:flex items-center space-x-8" variants={itemVariants}>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">
                How it Works
              </Link>
              <Link href="#fees" className="text-gray-600 hover:text-primary-600 transition-colors">
                Fees
              </Link>
              <Link href="#security" className="text-gray-600 hover:text-primary-600 transition-colors">
                Security
              </Link>
              <Link href="/auth" className="text-gray-600 hover:text-primary-600 transition-colors">
                Login
              </Link>
            </motion.nav>

            <motion.div variants={itemVariants}>
              <Link href="/auth" className="btn-primary">
                Send Money Now
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="py-20 lg:py-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
              variants={itemVariants}
            >
              Send Money to{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Zimbabwe
              </span>
              <br />
              from South Africa
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8"
              variants={itemVariants}
            >
              Fast, secure, and reliable money transfers. Get the best rates and send money to your loved ones in minutes.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
              <Link href="/auth" className="btn-primary text-lg px-8 py-4">
                Send Money Now
              </Link>
              <Link href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
                Learn More
              </Link>
            </motion.div>
          </div>

          {/* Key Benefits */}
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-16"
            variants={containerVariants}
          >
            <motion.div className="text-center" variants={itemVariants}>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Transfers</h3>
              <p className="text-gray-600">Money delivered in 2-4 hours</p>
            </motion.div>
            
            <motion.div className="text-center" variants={itemVariants}>
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Rates</h3>
              <p className="text-gray-600">Guaranteed competitive exchange rates</p>
            </motion.div>
            
            <motion.div className="text-center" variants={itemVariants}>
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bank-Level Security</h3>
              <p className="text-gray-600">256-bit SSL encryption protection</p>
            </motion.div>
          </motion.div>

          {/* Exchange Rate Calculator and Trust Indicators */}
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <TrustIndicators />
            </div>
            
            <div className="lg:col-span-5">
              <ExchangeRateCalculator />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Customer Testimonials */}
      <CustomerTestimonials />

      {/* Fee Transparency */}
      <FeeTransparency />

      {/* How It Works */}
      <StepByStepProcess />

      {/* Security Trust Indicators */}
      <SecurityTrustIndicators />

      {/* Footer CTA */}
      <motion.section 
        className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            variants={itemVariants}
          >
            Ready to Send Money Home?
          </motion.h2>
          
          <motion.p 
            className="text-xl mb-8 opacity-90"
            variants={itemVariants}
          >
            Join thousands of customers who trust Pachedu for their money transfers to Zimbabwe
          </motion.p>
          
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={itemVariants}>
            <Link href="/auth" className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl">
              Get Started Now
            </Link>
            <Link href="#security" className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white hover:text-primary-600 transition-all duration-200">
              Learn About Security
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
} 