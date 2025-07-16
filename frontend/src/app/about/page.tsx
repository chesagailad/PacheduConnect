import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PacheduConnect</h1>
            </Link>
            <nav className="hidden lg:flex space-x-8">
              <Link href="/about" className="text-primary-600 font-medium">
                About Us
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                How It Works
              </Link>
              <Link href="/rates" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Exchange Rates
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Support
              </Link>
            </nav>
            <Link
              href="/auth"
              className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Connecting Hearts,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                Bridging Distance
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to make sending money to Zimbabwe faster, cheaper, and more reliable 
              than ever before. Because family shouldn't have to wait.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-6 text-lg text-gray-600">
                <p>
                  PacheduConnect was born from a simple but powerful need: the desire to help 
                  Zimbabweans in South Africa stay connected with their families back home.
                </p>
                <p>
                  Founded in 2020 by immigrants who understood the struggle of expensive, slow 
                  money transfers, we set out to revolutionize how money moves between South Africa 
                  and Zimbabwe.
                </p>
                <p>
                  Today, we're proud to serve over 50,000 customers who trust us with their 
                  hard-earned money, knowing it will reach their loved ones safely and quickly.
                </p>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">50K+</div>
                    <div className="text-sm text-gray-600">Happy Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">$50M+</div>
                    <div className="text-sm text-gray-600">Transferred Safely</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">2-5min</div>
                    <div className="text-sm text-gray-600">Average Transfer Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">99.9%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Mission & Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe that sending money home should be simple, affordable, and reliable.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Speed</h3>
              <p className="text-gray-600">
                We understand that when families need support, every minute counts. 
                That's why we've built the fastest transfer system in the market.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Trust</h3>
              <p className="text-gray-600">
                Your money is precious, and we treat it with the respect it deserves. 
                Licensed, regulated, and secured with bank-level encryption.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Affordability</h3>
              <p className="text-gray-600">
                We believe fair pricing shouldn't be a luxury. Our transparent, 
                low fees mean more money reaches your family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A diverse team of immigrants, tech enthusiasts, and financial experts 
              working together to solve real problems.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">TM</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Takudzwa Mhangami</h3>
              <p className="text-gray-600 mb-4">CEO & Co-Founder</p>
              <p className="text-sm text-gray-500">
                Former banking executive with 15+ years in financial services across Africa.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">PM</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Priscilla Mutendi</h3>
              <p className="text-gray-600 mb-4">CTO & Co-Founder</p>
              <p className="text-sm text-gray-500">
                Software engineer passionate about building technology that empowers communities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">RM</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rutendo Madhuku</h3>
              <p className="text-gray-600 mb-4">Head of Operations</p>
              <p className="text-sm text-gray-500">
                Operations expert ensuring every transfer is processed smoothly and securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Licenses & Security */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Licensed & Secure</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your trust is our foundation. We're fully licensed and regulated 
              to ensure your money is always safe.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">SARB Licensed</h3>
              <p className="text-sm text-gray-600">Licensed by South African Reserve Bank</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">256-bit SSL</h3>
              <p className="text-sm text-gray-600">Bank-level encryption for all transactions</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">PCI DSS</h3>
              <p className="text-sm text-gray-600">Payment Card Industry compliant</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ISO 27001</h3>
              <p className="text-sm text-gray-600">Information security certified</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Experience the difference of a money transfer service built by immigrants, for immigrants.
          </p>
          <Link
            href="/auth?mode=register"
            className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Get Started Today
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}