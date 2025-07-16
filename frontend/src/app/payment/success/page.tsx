'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

const API_URL = API_CONFIG.BASE_URL;

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchParams) {
      setLoading(false);
      return;
    }
    
    const paymentId = searchParams.get('payment_id');
    const transactionId = searchParams.get('transaction_id');
    const reference = searchParams.get('reference');

    if (paymentId || transactionId || reference) {
      verifyPayment(paymentId, transactionId, reference);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (paymentId: string | null, transactionId: string | null, reference: string | null) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      // Try to get payment status
      let paymentStatus = null;
      if (paymentId) {
        const response = await fetch(`${API_URL}/api/payments/status/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          paymentStatus = await response.json();
        }
      }

      setPaymentDetails(paymentStatus);
      setLoading(false);
    } catch (err: any) {
      logger.apiError('Failed to verify payment', err, { 
        transactionId, 
        paymentId, 
        sessionId 
      });
    }
  };

  const handleViewTransactions = () => {
    router.push('/transactions');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Your payment has been processed successfully.</p>
          </div>

          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {paymentDetails.payment.currency} {parseFloat(paymentDetails.payment.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600 capitalize">
                    {paymentDetails.payment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold capitalize">
                    {paymentDetails.payment.gateway}
                  </span>
                </div>
                {paymentDetails.payment.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-semibold">{paymentDetails.payment.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{paymentDetails.payment.gatewayTransactionId}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleViewTransactions}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
            >
              View Transaction History
            </button>
            <button
              onClick={handleGoToDashboard}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>A confirmation email has been sent to your registered email address.</p>
            <p className="mt-1">If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 