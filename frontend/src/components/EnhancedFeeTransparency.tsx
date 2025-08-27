import React, { useState, useEffect } from 'react';

export interface FeeBreakdown {
  transferFee: number;
  exchangeRateMargin: number;
  processingFee: number;
  complianceFee: number;
  deliveryFee: number;
  totalFees: number;
  exchangeRate: number;
  amountToSend: number;
  amountToReceive: number;
  currencyFrom: string;
  currencyTo: string;
}

export interface EnhancedFeeTransparencyProps {
  amount: number;
  currencyFrom: string;
  currencyTo: string;
  onFeeChange?: (fees: FeeBreakdown) => void;
  showDetails?: boolean;
  className?: string;
}

export const EnhancedFeeTransparency: React.FC<EnhancedFeeTransparencyProps> = ({
  amount,
  currencyFrom,
  currencyTo,
  onFeeChange,
  showDetails = true,
  className = '',
}) => {
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  useEffect(() => {
    calculateFees();
  }, [amount, currencyFrom, currencyTo]);

  const calculateFees = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to get real-time fees and exchange rates
      const response = await fetch('/api/fees/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          amount,
          currencyFrom,
          currencyTo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeeBreakdown(data);
        if (onFeeChange) {
          onFeeChange(data);
        }
      } else {
        // Fallback calculation for demo purposes
        const fallbackFees = calculateFallbackFees();
        setFeeBreakdown(fallbackFees);
        if (onFeeChange) {
          onFeeChange(fallbackFees);
        }
      }
    } catch (error) {
      console.error('Error calculating fees:', error);
      // Fallback calculation
      const fallbackFees = calculateFallbackFees();
      setFeeBreakdown(fallbackFees);
      if (onFeeChange) {
        onFeeChange(fallbackFees);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFallbackFees = (): FeeBreakdown => {
    const transferFee = Math.max(amount * 0.02, 2); // 2% or $2 minimum
    const exchangeRateMargin = amount * 0.005; // 0.5%
    const processingFee = 1.50; // Fixed processing fee
    const complianceFee = amount * 0.001; // 0.1% for compliance
    const deliveryFee = 0; // Free delivery for most countries
    
    const totalFees = transferFee + exchangeRateMargin + processingFee + complianceFee + deliveryFee;
    const exchangeRate = 1.0; // 1:1 for demo
    const amountToReceive = amount - totalFees;

    return {
      transferFee,
      exchangeRateMargin,
      processingFee,
      complianceFee,
      deliveryFee,
      totalFees,
      exchangeRate,
      amountToSend: amount,
      amountToReceive,
      currencyFrom,
      currencyTo,
    };
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!feeBreakdown) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Fee Breakdown & Total Cost
        </h3>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">You Send</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(feeBreakdown.amountToSend, feeBreakdown.currencyFrom)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Fees</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(feeBreakdown.totalFees, feeBreakdown.currencyFrom)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">They Receive</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(feeBreakdown.amountToReceive, feeBreakdown.currencyTo)}
            </p>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Transfer Fee</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(feeBreakdown.transferFee, feeBreakdown.currencyFrom)}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({formatPercentage(feeBreakdown.transferFee, feeBreakdown.amountToSend)}%)
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Exchange Rate Margin</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(feeBreakdown.exchangeRateMargin, feeBreakdown.currencyFrom)}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({formatPercentage(feeBreakdown.exchangeRateMargin, feeBreakdown.amountToSend)}%)
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Processing Fee</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(feeBreakdown.processingFee, feeBreakdown.currencyFrom)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Compliance Fee</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(feeBreakdown.complianceFee, feeBreakdown.currencyFrom)}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                ({formatPercentage(feeBreakdown.complianceFee, feeBreakdown.amountToSend)}%)
              </span>
            </div>
          </div>

          {feeBreakdown.deliveryFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivery Fee</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(feeBreakdown.deliveryFee, feeBreakdown.currencyFrom)}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Total Fees</span>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(feeBreakdown.totalFees, feeBreakdown.currencyFrom)}
              </span>
            </div>
          </div>
        </div>

        {/* Exchange Rate Information */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800">Exchange Rate</span>
            <span className="text-sm font-medium text-blue-900">
              1 {feeBreakdown.currencyFrom.toUpperCase()} = {feeBreakdown.exchangeRate.toFixed(4)} {feeBreakdown.currencyTo.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Rate locked for 15 minutes • No hidden fees
          </p>
        </div>

        {/* Detailed Breakdown Toggle */}
        {showDetails && (
          <div className="mt-4">
            <button
              onClick={() => setShowFullBreakdown(!showFullBreakdown)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {showFullBreakdown ? 'Hide' : 'Show'} detailed breakdown
              <svg 
                className={`w-4 h-4 ml-1 transition-transform ${showFullBreakdown ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFullBreakdown && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Fee Details</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <p><strong>Transfer Fee:</strong> Covers the cost of processing your international money transfer</p>
                  <p><strong>Exchange Rate Margin:</strong> Small markup on the interbank exchange rate</p>
                  <p><strong>Processing Fee:</strong> Fixed fee for transaction processing and verification</p>
                  <p><strong>Compliance Fee:</strong> Covers regulatory compliance and anti-money laundering checks</p>
                  {feeBreakdown.deliveryFee > 0 && (
                    <p><strong>Delivery Fee:</strong> Cost for delivering money to remote locations</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Savings Information */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                You save {formatCurrency(5.50, feeBreakdown.currencyFrom)} vs traditional banks
              </p>
              <p className="text-xs text-green-600">
                Average bank fee: {formatCurrency(feeBreakdown.totalFees + 5.50, feeBreakdown.currencyFrom)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

 