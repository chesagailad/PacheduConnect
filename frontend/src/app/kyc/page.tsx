'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, ArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Navigation from '../../components/Navigation';
import KYCStatus from '../../components/KYCStatus';
import KYCProgress from '../../components/KYCProgress';
import KYCUploadEnhanced from '../../components/KYCUploadEnhanced';
import { useKYC } from '../../hooks/useKYC';

export default function KYCPage() {
  const { kycData, loading, error, refreshKYC } = useKYC();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUploadSuccess = () => {
    refreshKYC();
  };

  const getNextLevelInfo = () => {
    if (!kycData) return null;

    switch (kycData.level) {
      case 'bronze':
        return {
          level: 'silver',
          title: 'Upgrade to Silver',
          description: 'Upload ID document, selfie with ID, and provide home address',
          limit: 'R25,000 per month',
          requirements: [
            'ID/Passport document',
            'Selfie with ID/Passport',
            'Home address'
          ]
        };
      case 'silver':
        return {
          level: 'gold',
          title: 'Upgrade to Gold',
          description: 'Upload certified ID copy, proof of address, and provide job title',
          limit: 'R50,000 per month',
          requirements: [
            'Certified ID/Passport copy',
            'Proof of address',
            'Job title'
          ]
        };
      case 'gold':
        return null;
      default:
        return null;
    }
  };

  const canUpgrade = () => {
    return kycData && kycData.status === 'approved' && kycData.level !== 'gold';
  };

  const nextLevelInfo = getNextLevelInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation 
          title="KYC Verification" 
          showBackButton={true} 
          user={user}
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading KYC information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navigation 
          title="KYC Verification" 
          showBackButton={true} 
          user={user}
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-900">Error Loading KYC</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <button
              onClick={refreshKYC}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation 
        title="KYC Verification" 
        showBackButton={true} 
        user={user}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
          <p className="text-gray-600">
            Complete your verification to unlock higher send limits and additional features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* KYC Status */}
          <div>
            <KYCStatus />
          </div>

          {/* KYC Progress */}
          {kycData && (
            <div>
              <KYCProgress kycData={kycData} />
            </div>
          )}
        </div>

        {/* Upgrade Section */}
        {canUpgrade() && nextLevelInfo && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ArrowUpIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{nextLevelInfo.title}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Benefits</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Increased monthly send limit: {nextLevelInfo.limit}</li>
                  <li>• Enhanced security features</li>
                  <li>• Priority customer support</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Required Documents</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {nextLevelInfo.requirements.map((req, index) => (
                    <li key={index} className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 text-green-600 mr-2" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <KYCUploadEnhanced 
                level={nextLevelInfo.level as 'bronze' | 'silver'} 
                onSuccess={handleUploadSuccess}
              />
            </div>
          </div>
        )}

        {/* Already at Gold Level */}
        {kycData?.level === 'gold' && kycData?.status === 'approved' && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Gold Level Achieved</h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Congratulations!</h4>
              <p className="text-sm text-yellow-800">
                You have reached the highest KYC level. You can send up to R50,000 per month.
              </p>
            </div>
          </div>
        )}

        {/* Pending Verification */}
        {kycData?.status === 'pending' && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Verification Pending</h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Documents Under Review</h4>
              <p className="text-sm text-yellow-800">
                Your documents have been submitted and are currently being reviewed by our team. 
                This process typically takes 1-2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Rejected Verification */}
        {kycData?.status === 'rejected' && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Verification Rejected</h3>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Action Required</h4>
              <p className="text-sm text-red-800 mb-3">
                Your verification was rejected. Please review the reason below and resubmit your documents.
              </p>
              {kycData.rejectionReason && (
                <div className="bg-white border border-red-200 rounded p-3">
                  <p className="text-sm text-red-700">{kycData.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KYC Levels Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Levels Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-amber-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-gray-900">Bronze</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Default level for new users</p>
              <p className="text-sm font-medium text-gray-900">R5,000 per month</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-gray-900">Silver</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">ID + Selfie + Address verification</p>
              <p className="text-sm font-medium text-gray-900">R25,000 per month</p>
            </div>
            
            <div className="border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-gray-900">Gold</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Certified documents + Job verification</p>
              <p className="text-sm font-medium text-gray-900">R50,000 per month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 