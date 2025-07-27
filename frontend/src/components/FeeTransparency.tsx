import React from 'react';

export default function FeeTransparency() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparent Fees, No Hidden Costs
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See exactly what you'll pay. No surprises, no hidden fees.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Fee Calculator */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Fee Calculator</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-500 font-medium">ZAR</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transfer amount:</span>
                  <span className="font-medium">R1,000.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Exchange rate:</span>
                  <span className="font-medium">1 ZAR = 0.154 USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transfer fee:</span>
                  <span className="font-medium text-green-600">R15.00</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Recipient gets:</span>
                    <span className="text-blue-600">$154.00 USD</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                  Send Money Now
                </button>
              </div>
            </div>
          </div>

          {/* Fee Comparison */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">How We Compare</h3>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">PacheduConnect</h4>
                  <span className="text-green-600 font-bold">Best Value</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer fee:</span>
                    <span className="font-medium">R15.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange rate margin:</span>
                    <span className="font-medium">0.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total cost for R1,000:</span>
                    <span className="font-medium text-green-600">R20.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Competitor A</h4>
                  <span className="text-red-600 font-bold">Expensive</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer fee:</span>
                    <span className="font-medium">R45.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange rate margin:</span>
                    <span className="font-medium">2.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total cost for R1,000:</span>
                    <span className="font-medium text-red-600">R70.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Competitor B</h4>
                  <span className="text-red-600 font-bold">Expensive</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer fee:</span>
                    <span className="font-medium">R35.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exchange rate margin:</span>
                    <span className="font-medium">1.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total cost for R1,000:</span>
                    <span className="font-medium text-red-600">R53.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Save up to 71% compared to competitors
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 