/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: KYCStatus - handles frontend functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, ShieldExclamationIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

interface KYCData {
  id: string;
  level: 'bronze' | 'silver' | 'gold';
  status: 'pending' | 'approved' | 'rejected';
  monthlySendLimit: number;
  currentMonthSent: number;
  resetDate: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

interface KYCStatusProps {
  className?: string;
}

const KYCStatus: React.FC<KYCStatusProps> = ({ className = '' }) => {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/kyc/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setKycData(data.kyc);
      } else {
        setError('Failed to fetch KYC status');
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setError('Failed to fetch KYC status');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <ShieldCheckIcon className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <ShieldExclamationIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getRemainingLimit = () => {
    if (!kycData) return 0;
    return Math.max(0, kycData.monthlySendLimit - kycData.currentMonthSent);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <ShieldExclamationIcon className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!kycData) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <ShieldExclamationIcon className="h-8 w-8 mx-auto mb-2" />
          <p>KYC status not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">KYC Verification</h3>
        {getStatusIcon(kycData.status)}
      </div>

      <div className="space-y-4">
        {/* KYC Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Level:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(kycData.level)}`}>
            {kycData.level.charAt(0).toUpperCase() + kycData.level.slice(1)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(kycData.status)}`}>
            {kycData.status.charAt(0).toUpperCase() + kycData.status.slice(1)}
          </span>
        </div>

        {/* Monthly Limits */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Monthly Send Limits</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Limit:</span>
              <span className="font-medium">{formatCurrency(kycData.monthlySendLimit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sent This Month:</span>
              <span className="font-medium">{formatCurrency(kycData.currentMonthSent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-medium ${getRemainingLimit() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getRemainingLimit())}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, (kycData.currentMonthSent / kycData.monthlySendLimit) * 100)}%` 
            }}
          ></div>
        </div>

        {/* Rejection Reason */}
        {kycData.status === 'rejected' && kycData.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</h4>
            <p className="text-sm text-red-700">{kycData.rejectionReason}</p>
          </div>
        )}

        {/* Verification Date */}
        {kycData.verifiedAt && (
          <div className="text-xs text-gray-500">
            Verified: {new Date(kycData.verifiedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCStatus; 