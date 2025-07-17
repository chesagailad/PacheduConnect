'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { kycService } from '../services/kycService';

interface PendingKYC {
  id: string;
  userId: string;
  level: string;
  status: string;
  homeAddress?: string;
  jobTitle?: string;
  idDocument?: string;
  selfieWithId?: string;
  certifiedIdDocument?: string;
  proofOfAddress?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface KYCAdminPanelProps {
  className?: string;
}

const KYCAdminPanel: React.FC<KYCAdminPanelProps> = ({ className = '' }) => {
  const [pendingKYC, setPendingKYC] = useState<PendingKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<PendingKYC | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/kyc/pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingKYC(data.pendingKYC);
      } else {
        setError('Failed to fetch pending KYC');
      }
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
      setError('Failed to fetch pending KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (kycId: string) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/kyc/approve/${kycId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        await fetchPendingKYC();
        setSelectedKYC(null);
      } else {
        setError('Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      setError('Failed to approve KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (kycId: string) => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/kyc/reject/${kycId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason }),
      });
      
      if (response.ok) {
        await fetchPendingKYC();
        setSelectedKYC(null);
        setRejectionReason('');
      } else {
        setError('Failed to reject KYC');
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      setError('Failed to reject KYC');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
          <Button
            onClick={fetchPendingKYC}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Pending KYC Verifications</h3>
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-gray-600">{pendingKYC.length} pending</span>
        </div>
      </div>

      {pendingKYC.length === 0 ? (
        <div className="text-center py-8">
          <CheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No pending KYC verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingKYC.map((kyc) => (
            <div key={kyc.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{kyc.user.name}</h4>
                    <p className="text-sm text-gray-600">{kyc.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(kyc.level)}`}>
                    {kyc.level.charAt(0).toUpperCase() + kyc.level.slice(1)}
                  </span>
                  <Button
                    onClick={() => setSelectedKYC(kyc)}
                    variant="outline"
                    size="sm"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                Submitted: {formatDate(kyc.createdAt)}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleApprove(kyc.id)}
                  disabled={processing}
                  variant="primary"
                  size="sm"
                >
                  {processing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={() => setSelectedKYC(kyc)}
                  disabled={processing}
                  variant="danger"
                  size="sm"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC Detail Modal */}
      {selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                KYC Verification Details
              </h3>
              <button
                onClick={() => setSelectedKYC(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedKYC.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedKYC.user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(selectedKYC.level)}`}>
                      {selectedKYC.level.charAt(0).toUpperCase() + selectedKYC.level.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedKYC.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
                <div className="space-y-2 text-sm">
                  {selectedKYC.homeAddress && (
                    <div>
                      <span className="text-gray-600">Home Address:</span>
                      <span className="ml-2 font-medium">{selectedKYC.homeAddress}</span>
                    </div>
                  )}
                  {selectedKYC.jobTitle && (
                    <div>
                      <span className="text-gray-600">Job Title:</span>
                      <span className="ml-2 font-medium">{selectedKYC.jobTitle}</span>
                    </div>
                  )}
                  {selectedKYC.idDocument && (
                    <div>
                      <span className="text-gray-600">ID Document:</span>
                      <span className="ml-2 font-medium">Uploaded</span>
                    </div>
                  )}
                  {selectedKYC.selfieWithId && (
                    <div>
                      <span className="text-gray-600">Selfie with ID:</span>
                      <span className="ml-2 font-medium">Uploaded</span>
                    </div>
                  )}
                  {selectedKYC.certifiedIdDocument && (
                    <div>
                      <span className="text-gray-600">Certified ID:</span>
                      <span className="ml-2 font-medium">Uploaded</span>
                    </div>
                  )}
                  {selectedKYC.proofOfAddress && (
                    <div>
                      <span className="text-gray-600">Proof of Address:</span>
                      <span className="ml-2 font-medium">Uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  onClick={() => setSelectedKYC(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(selectedKYC.id)}
                  disabled={processing}
                  variant="primary"
                >
                  {processing ? <LoadingSpinner size="sm" /> : <CheckIcon className="h-4 w-4 mr-1" />}
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(selectedKYC.id)}
                  disabled={processing || !rejectionReason.trim()}
                  variant="danger"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCAdminPanel; 