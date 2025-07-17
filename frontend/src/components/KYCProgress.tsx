'use client';

import React from 'react';
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { KYCData } from '../services/kycService';

interface KYCProgressProps {
  kycData: KYCData;
  className?: string;
}

const KYCProgress: React.FC<KYCProgressProps> = ({ kycData, className = '' }) => {
  const levels = [
    {
      name: 'Bronze',
      key: 'bronze',
      description: 'Basic verification',
      limit: 'R5,000/month',
      requirements: ['ID Document', 'Selfie with ID', 'Home Address']
    },
    {
      name: 'Silver',
      key: 'silver',
      description: 'Enhanced verification',
      limit: 'R25,000/month',
      requirements: ['Certified ID Copy', 'Proof of Address', 'Job Title']
    },
    {
      name: 'Gold',
      key: 'gold',
      description: 'Full verification',
      limit: 'R50,000/month',
      requirements: ['All previous requirements', 'Additional verification']
    }
  ];

  const getCurrentLevelIndex = () => {
    return levels.findIndex(level => level.key === kycData.level);
  };

  const isLevelCompleted = (levelKey: string) => {
    const currentIndex = getCurrentLevelIndex();
    const levelIndex = levels.findIndex(level => level.key === levelKey);
    return levelIndex < currentIndex || (levelIndex === currentIndex && kycData.status === 'approved');
  };

  const isLevelAvailable = (levelKey: string) => {
    const currentIndex = getCurrentLevelIndex();
    const levelIndex = levels.findIndex(level => level.key === levelKey);
    return levelIndex <= currentIndex;
  };

  const getLevelStatus = (levelKey: string) => {
    if (levelKey === kycData.level) {
      return kycData.status;
    }
    return isLevelCompleted(levelKey) ? 'completed' : 'locked';
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">KYC Progress</h3>
      
      <div className="space-y-6">
        {levels.map((level, index) => {
          const status = getLevelStatus(level.key);
          const isCompleted = status === 'completed';
          const isCurrent = level.key === kycData.level;
          const isAvailable = isLevelAvailable(level.key);

          return (
            <div key={level.key} className="relative">
              {/* Progress Line */}
              {index < levels.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isCurrent 
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckIcon className="h-6 w-6" />
                    ) : isCurrent ? (
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LockClosedIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>

                {/* Level Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-lg font-medium ${
                      isCompleted ? 'text-green-900' : 
                      isCurrent ? 'text-blue-900' : 'text-gray-500'
                    }`}>
                      {level.name}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : isCurrent 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {level.limit}
                    </span>
                  </div>

                  <p className={`text-sm mb-3 ${
                    isCompleted ? 'text-green-700' : 
                    isCurrent ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {level.description}
                  </p>

                  {/* Requirements */}
                  <div className="space-y-1">
                    {level.requirements.map((requirement, reqIndex) => (
                      <div key={reqIndex} className="flex items-center text-sm">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : isCurrent 
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                        }`}></div>
                        <span className={
                          isCompleted ? 'text-green-700' : 
                          isCurrent ? 'text-blue-700' : 'text-gray-500'
                        }>
                          {requirement}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Current Level Status */}
                  {isCurrent && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        kycData.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : kycData.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {kycData.status.charAt(0).toUpperCase() + kycData.status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Level Info */}
      {kycData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Level:</span>
              <span className="ml-2 font-medium text-gray-900">
                {kycData.level.charAt(0).toUpperCase() + kycData.level.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${
                kycData.status === 'approved' ? 'text-green-600' :
                kycData.status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {kycData.status.charAt(0).toUpperCase() + kycData.status.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Monthly Limit:</span>
              <span className="ml-2 font-medium text-gray-900">
                R{kycData.monthlySendLimit.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Sent This Month:</span>
              <span className="ml-2 font-medium text-gray-900">
                R{kycData.currentMonthSent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCProgress; 