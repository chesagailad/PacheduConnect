'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface PaymentGateway {
  name: string;
  description: string;
  currencies: string[];
  fees: { percentage: number; fixed: number };
  supported: boolean;
}

interface PaymentGateways {
  [key: string]: PaymentGateway;
}

interface PaymentProcessorProps {
  amount: number;
  currency: string;
  recipientEmail: string;
  description?: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function PaymentProcessor({
  amount,
  currency,
  recipientEmail,
  description,
  onSuccess,
  onError,
  onCancel
}: PaymentProcessorProps) {
  const router = useRouter();
  const [gateways, setGateways] = useState<PaymentGateways>({});
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    bankAccount: '',
    bankCode: ''
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGateways(data.gateways);
        
        // Auto-select first available gateway for the currency
        const availableGateways = Object.keys(data.gateways).filter(
          gateway => data.gateways[gateway].currencies.includes(currency)
        );
        if (availableGateways.length > 0) {
          setSelectedGateway(availableGateways[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch gateways:', err);
    }
  };

  const handleGatewayChange = (gateway: string) => {
    setSelectedGateway(gateway);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const calculateFees = () => {
    if (!selectedGateway || !gateways[selectedGateway]) return { fee: 0, total: amount };
    
    const gateway = gateways[selectedGateway];
    const fee = (amount * gateway.fees.percentage / 100) + gateway.fees.fixed;
    return { fee, total: amount + fee };
  };

  const validateForm = () => {
    if (!selectedGateway) {
      setError('Please select a payment method');
      return false;
    }

    if (selectedGateway === 'stripe') {
      if (!paymentData.cardNumber || !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.cvv) {
        setError('Please fill in all card details');
        return false;
      }
    } else if (selectedGateway === 'stitch') {
      if (!paymentData.bankAccount || !paymentData.bankCode) {
        setError('Please provide bank account and bank code');
        return false;
      }
    }

    return true;
  };

  const processPayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const { fee, total } = calculateFees();

      const paymentPayload: any = {
        amount: total,
        currency: currency,
        recipientEmail: recipientEmail,
        description: description || `Payment to ${recipientEmail}`,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      };

      // Add gateway-specific data
      if (selectedGateway === 'stripe') {
        paymentPayload.paymentMethodId = 'pm_demo'; // In real app, this would be a Stripe Payment Method ID
      } else if (selectedGateway === 'stitch') {
        paymentPayload.bankAccount = paymentData.bankAccount;
        paymentPayload.bankCode = paymentData.bankCode;
      }

      const response = await fetch(`${API_URL}/api/payments/process/${selectedGateway}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.payment.redirectUrl) {
          // Redirect to payment gateway
          window.location.href = data.payment.redirectUrl;
        } else if (data.payment.formData) {
          // Submit form data to payment gateway
          submitPaymentForm(data.payment.formData);
        } else {
          // Payment completed immediately
          onSuccess?.(data);
        }
      } else {
        setError(data.message || 'Payment failed');
        onError?.(data.message || 'Payment failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment processing failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitPaymentForm = (formData: any) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = formData.redirectUrl || 'https://www.payfast.co.za/eng/process';

    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const availableGateways = Object.keys(gateways).filter(
    gateway => gateways[gateway].currencies.includes(currency)
  );

  const { fee, total } = calculateFees();

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">{currency} {amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Fee:</span>
            <span className="font-semibold">{currency} {fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-900 font-bold">Total:</span>
            <span className="text-gray-900 font-bold">{currency} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="space-y-2">
          {availableGateways.map(gateway => (
            <label key={gateway} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="gateway"
                value={gateway}
                checked={selectedGateway === gateway}
                onChange={() => handleGatewayChange(gateway)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{gateways[gateway].name}</div>
                <div className="text-sm text-gray-500">{gateways[gateway].description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedGateway === 'stripe' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Card Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={paymentData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <input
                  type="text"
                  name="expiryMonth"
                  value={paymentData.expiryMonth}
                  onChange={handleInputChange}
                  placeholder="MM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="text"
                  name="expiryYear"
                  value={paymentData.expiryYear}
                  onChange={handleInputChange}
                  placeholder="YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={paymentData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedGateway === 'stitch' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                name="bankAccount"
                value={paymentData.bankAccount}
                onChange={handleInputChange}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Code
              </label>
              <input
                type="text"
                name="bankCode"
                value={paymentData.bankCode}
                onChange={handleInputChange}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={processPayment}
          loading={loading}
          disabled={loading || !selectedGateway}
          className="flex-1"
        >
          Pay {currency} {total.toFixed(2)}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="px-4"
        >
          Cancel
        </Button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>By proceeding, you agree to our terms of service and privacy policy.</p>
        <p className="mt-1">Your payment is secured with bank-level encryption.</p>
      </div>
    </div>
  );
} 