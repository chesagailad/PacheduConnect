import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Pachedu</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-primary-600">
                About
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-primary-600">
                Services
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-primary-600">
                Contact
              </Link>
            </nav>
            <div className="flex space-x-4">
              <Link
                href="/auth"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium"
              >
                Login / Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Send Money to{' '}
            <span className="text-primary-600">Zimbabwe</span>
            <br />
            <span className="text-secondary-600">from South Africa</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Fast, secure, and reliable money transfers. Connect with your loved ones 
            through the most trusted remittance platform in Southern Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/send-money"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Send Money Now
            </Link>
            <Link
              href="/download-app"
              className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Download App
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Transfer money in minutes, not days</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Safe</h3>
            <p className="text-gray-600">Bank-grade security for your money</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Best Rates</h3>
            <p className="text-gray-600">Competitive exchange rates</p>
          </div>
        </div>
      </main>
    </div>
  );
} 