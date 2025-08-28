'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SendMoney: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    recipientEmail: '',
    amount: '',
    currency: 'USD',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
    { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' }
  ];

  const calculateFees = () => {
    const amount = parseFloat(form.amount) || 0;
    if (amount > 0) {
      const transferFee = amount * 0.03;
      const totalAmount = amount + transferFee;
      return { transferFee, totalAmount };
    }
    return { transferFee: 0, totalAmount: 0 };
  };

  const feeBreakdown = calculateFees();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Recipient email is required';
    }

    if (!form.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be positive';
      } else if (amount < 10) {
        newErrors.amount = 'Minimum amount is $10';
      } else if (amount > 50000) {
        newErrors.amount = 'Maximum amount is $50,000';
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (): boolean => {
    const trimmedEmail = form.recipientEmail.trim();
    const trimmedAmount = form.amount.trim();
    
    // Validate email format
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      return false;
    }
    
    // Validate amount
    if (!trimmedAmount) {
      return false;
    }
    
    const amountNum = parseFloat(trimmedAmount);
    if (isNaN(amountNum) || amountNum < 10 || amountNum > 50000) {
      return false;
    }
    
    return true;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const verifyRecipient = async () => {
    if (!form.recipientEmail || !isValidEmail(form.recipientEmail)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/recipients/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: form.recipientEmail })
      });

      const result = await response.json();
      setRecipientVerified(result.exists);
    } catch (error) {
      console.error('Error verifying recipient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMoney = async () => {
    const newErrors: Record<string, string> = {};

    if (!form.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Recipient email is required';
    }

    if (!form.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be positive';
      } else if (amount < 10) {
        newErrors.amount = 'Minimum amount is $10';
      } else if (amount > 50000) {
        newErrors.amount = 'Maximum amount is $50,000';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          fee: feeBreakdown.transferFee,
          totalAmount: feeBreakdown.totalAmount
        })
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/payment/success?transactionId=${result.transactionId}`);
      } else {
        setErrors({ submit: result.message || 'Transaction failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Transaction failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBlur = (field: string) => {
    const newErrors: Record<string, string> = { ...errors };

    if (field === 'recipientEmail') {
      if (!form.recipientEmail.trim()) {
        newErrors.recipientEmail = 'Recipient email is required';
      } else if (!isValidEmail(form.recipientEmail)) {
        newErrors.recipientEmail = 'Please enter a valid email address';
      } else {
        delete newErrors.recipientEmail;
      }
    }

    if (field === 'amount') {
      if (!form.amount.trim()) {
        newErrors.amount = 'Amount is required';
      } else {
        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.amount = 'Amount must be positive';
        } else if (amount < 10) {
          newErrors.amount = 'Minimum amount is $10';
        } else if (amount > 50000) {
          newErrors.amount = 'Maximum amount is $50,000';
        } else {
          delete newErrors.amount;
        }
      }
    }

    setErrors(newErrors);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Send Money</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Money Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Transfer Details</h2>
            
            {/* Recipient Email */}
            <div className="mb-4">
              <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <div className="flex gap-2">
                <input
                  id="recipient-email"
                  type="email"
                  placeholder="Recipient email"
                  value={form.recipientEmail}
                  onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                  onBlur={() => handleBlur('recipientEmail')}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.recipientEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  onClick={verifyRecipient}
                  disabled={loading || !form.recipientEmail || !isValidEmail(form.recipientEmail)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
              {errors.recipientEmail && (
                <p className="text-red-600 text-sm mt-1">{errors.recipientEmail}</p>
              )}
              {recipientVerified && (
                <p className="text-green-600 text-sm mt-1">✓ Recipient verified</p>
              )}
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                onBlur={() => handleBlur('amount')}
                min="10"
                max="50000"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Currency */}
            <div className="mb-4">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={form.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                id="message"
                placeholder="Add a message for the recipient"
                value={form.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMoney}
              disabled={loading || !isFormValid()}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Processing...' : 'Send'}
            </button>

            {errors.submit && (
              <p className="text-red-600 text-sm mt-2">{errors.submit}</p>
            )}
          </div>

          {/* Fee Calculator */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Fee Calculator</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer Amount:</span>
                  <span className="font-medium">
                    {form.amount ? `${currencies.find(c => c.code === form.currency)?.symbol}${parseFloat(form.amount).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer Fee:</span>
                  <span className="font-medium text-red-600">
                    ${feeBreakdown.transferFee.toFixed(2)}
                  </span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    ${feeBreakdown.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <h3 className="font-semibold text-blue-800 mb-2">Fee Structure</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 3% flat fee on all transfers</li>
                  <li>• No hidden charges</li>
                  <li>• Transparent pricing</li>
                  <li>• Instant processing available</li>
                </ul>
              </div>
            </div>

            {/* Transfer Limits */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Transfer Limits</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Minimum: $10</li>
                <li>• Maximum: $50,000</li>
                <li>• Daily limit: $10,000</li>
                <li>• Monthly limit: Based on KYC level</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMoney; 