'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.push('/send-money');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600">Your payment was cancelled. No charges were made to your account.</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">What happened?</h2>
            <ul className="text-sm text-yellow-700 space-y-1 text-left">
              <li>• You cancelled the payment process</li>
              <li>• Your payment was not completed</li>
              <li>• No money was transferred</li>
              <li>• You can try again anytime</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleTryAgain}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={handleGoToDashboard}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>If you're having trouble with payments, please contact our support team.</p>
            <p className="mt-1">We're here to help you complete your transaction.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 