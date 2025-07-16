'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaymentProcessor from '../../components/PaymentProcessor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface FeeBreakdown {
  amount: number;
  fee: number;
  totalAmount: number;
  feeType: string;
  feePercentage: number;
  currency: string;
}

export default function SendMoneyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    recipientEmail: '',
    amount: '',
    currency: 'USD',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<{ name: string; email: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }
    // Fetch user balance
    fetchUserBalance();
  }, [router]);

  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.balance);
      }
    } catch (err) {
      console.log('Could not fetch balance');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
    setFeeBreakdown(null);
  };

  const validateForm = () => {
    if (!form.recipientEmail) {
      setError('Recipient email is required');
      return false;
    }
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (!form.currency) {
      setError('Please select a currency');
      return false;
    }

    return true;
  };

  const calculateFee = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get exchange rate and transfer fee information
      const [feeRes, conversionRes] = await Promise.all([
        fetch(`${API_URL}/api/transactions/calculate-commission`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: parseFloat(form.amount),
            currency: form.currency
          })
        }),
        fetch(`${API_URL}/api/transactions/convert-currency`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: parseFloat(form.amount),
            fromCurrency: form.currency,
            toCurrency: form.currency === 'ZAR' ? 'USD' : 'ZAR'
          })
        })
      ]);

      if (feeRes.ok && conversionRes.ok) {
        const feeData = await feeRes.json();
        const conversionData = await conversionRes.json();
        
        // Combine the data for display
        const combinedData = {
          transferFee: feeData.transferFee,
          conversion: conversionData.conversion,
          feeBreakdown: {
            amount: parseFloat(form.amount),
            fee: feeData.transferFee.transferFeeAmount,
            totalAmount: feeData.transferFee.totalCost,
            feeType: 'transfer_fee',
            feePercentage: feeData.transferFee.transferFeeRate * 100,
            currency: form.currency
          }
        };
        
        setFeeBreakdown(combinedData);
      }
    } catch (err) {
      console.error('Failed to calculate fee:', err);
    }
  };

  const verifyRecipient = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/users/search?email=${form.recipientEmail}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setRecipientInfo(data[0]);
          await calculateFee();
          setShowPreview(true);
        } else {
          setError('Recipient not found. Please check the email address.');
        }
      } else {
        setError('Recipient not found. Please check the email address.');
      }
    } catch (err: any) {
      setError('Failed to verify recipient');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setSuccess('Payment processed successfully!');
    setShowPayment(false);
    setShowPreview(false);
    setForm({ recipientEmail: '', amount: '', currency: 'USD', description: '' });
    setRecipientInfo(null);
    setFeeBreakdown(null);
    
    // Refresh user balance
    fetchUserBalance();
    
    // Redirect to transactions page after a short delay
    setTimeout(() => {
      router.push('/transactions');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(`Payment failed: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const proceedToPayment = () => {
    setShowPayment(true);
  };

  const backToForm = () => {
    setShowPreview(false);
    setRecipientInfo(null);
    setFeeBreakdown(null);
  };

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={handlePaymentCancel}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to payment details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          </div>
          
          <PaymentProcessor
            amount={parseFloat(form.amount)}
            currency={form.currency}
            recipientEmail={form.recipientEmail}
            description={form.description}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Money</h1>
          <p className="text-gray-600">Transfer money to friends and family securely</p>
        </div>

        {userBalance !== null && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Available Balance: <span className="font-semibold">${userBalance.toFixed(2)}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {!showPreview ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={form.recipientEmail}
                  onChange={handleChange}
                  placeholder="Enter recipient's email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="flex">
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="ZAR">ZAR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What's this payment for?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-6">
              <button
                onClick={verifyRecipient}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Preview</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Recipient</p>
                    <p className="font-semibold">{recipientInfo?.name}</p>
                    <p className="text-sm text-gray-500">{recipientInfo?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold">{form.currency} {parseFloat(form.amount).toFixed(2)}</p>
                  </div>
                </div>
                
                {form.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-semibold">{form.description}</p>
                  </div>
                )}
              </div>

              {feeBreakdown && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Transaction Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Send Amount:</span>
                      <span>{form.currency} {parseFloat(form.amount).toFixed(2)}</span>
                    </div>
                    
                    {feeBreakdown.transferFee && feeBreakdown.transferFee.transferFeeAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transfer Fee:</span>
                        <span>{form.currency} {feeBreakdown.transferFee.transferFeeAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {feeBreakdown.conversion && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Exchange Rate:</span>
                        <span>
                          $1 = {form.currency === 'ZAR' ? 'R' : '$'}{feeBreakdown.conversion.exchangeRate.toFixed(6)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-semibold">Total Cost:</span>
                      <span className="font-semibold">
                        {form.currency} {feeBreakdown.transferFee ? feeBreakdown.transferFee.totalCost.toFixed(2) : parseFloat(form.amount).toFixed(2)}
                      </span>
                    </div>
                    
                    {feeBreakdown.conversion && (
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Recipient Gets:</span>
                        <span>
                          {feeBreakdown.conversion.toCurrency === 'USD' ? '$' : 'R'}{feeBreakdown.conversion.recipientGets.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {userBalance !== null && feeBreakdown && (
                <div className={`p-4 rounded-lg mb-4 ${
                  userBalance >= (feeBreakdown.transferFee ? feeBreakdown.transferFee.totalCost : parseFloat(form.amount))
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    userBalance >= (feeBreakdown.transferFee ? feeBreakdown.transferFee.totalCost : parseFloat(form.amount)) ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {userBalance >= (feeBreakdown.transferFee ? feeBreakdown.transferFee.totalCost : parseFloat(form.amount))
                      ? '✓ Sufficient balance available'
                      : '⚠ Insufficient balance. Please add funds to your account.'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={proceedToPayment}
                disabled={!!(userBalance !== null && feeBreakdown && userBalance < (feeBreakdown.transferFee ? feeBreakdown.transferFee.totalCost : parseFloat(form.amount)))}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Proceed to Payment
              </button>
              <button
                onClick={backToForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 