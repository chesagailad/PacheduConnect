import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KYCData {
  status: 'bronze' | 'silver' | 'gold' | 'pending' | 'rejected';
  monthlyLimit: number;
  documents: {
    idDocument?: string;
    selfie?: string;
    proofOfAddress?: string;
  };
}

const KYC: React.FC = () => {
  const router = useRouter();
  const [kycData, setKycData] = useState<KYCData>({
    status: 'bronze',
    monthlyLimit: 1000,
    documents: {}
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{
    idDocument?: File;
    selfie?: File;
    proofOfAddress?: File;
  }>({});

  useEffect(() => {
    // Load KYC data on component mount
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/kyc/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKycData(data);
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    }
  };

  const handleFileSelect = (type: 'idDocument' | 'selfie' | 'proofOfAddress', file: File) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const uploadDocument = async (type: 'idDocument' | 'selfie' | 'proofOfAddress') => {
    const file = selectedFiles[type];
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setKycData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [type]: result.documentUrl
          }
        }));
      } else {
        setMessage(result.message || 'Upload failed');
      }
    } catch (error) {
      setMessage('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gold': return 'text-green-600';
      case 'silver': return 'text-blue-600';
      case 'bronze': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">KYC Verification</h1>
        
        {/* Current Status */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Status:</h2>
            <button
              onClick={loadKYCData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking status...' : 'Check Status'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Status: </span>
              <span className={`font-bold ${getStatusColor(kycData.status)}`}>
                {getStatusText(kycData.status)}
              </span>
            </div>
            <div>
              <span className="font-medium">Monthly Limit: </span>
              <span className="font-bold">${kycData.monthlyLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* KYC Levels */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">KYC Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${kycData.status === 'bronze' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <h3 className="font-semibold text-lg">Bronze Level</h3>
              <p className="text-sm text-gray-600">Basic verification required</p>
              <p className="text-sm font-medium">Limit: $1,000/month</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${kycData.status === 'silver' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <h3 className="font-semibold text-lg">Silver Level</h3>
              <p className="text-sm text-gray-600">Enhanced verification</p>
              <p className="text-sm font-medium">Limit: $10,000/month</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${kycData.status === 'gold' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <h3 className="font-semibold text-lg">Gold Level</h3>
              <p className="text-sm text-gray-600">Full verification</p>
              <p className="text-sm font-medium">Limit: $50,000/month</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </div>

        {/* Upload Documents */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
          
          {/* ID Document */}
          <div className="mb-6">
            <label htmlFor="id-document" className="block text-sm font-medium text-gray-700 mb-2">
              ID Document
            </label>
            <input
              id="id-document"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect('idDocument', file);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFiles.idDocument && (
              <button
                onClick={() => uploadDocument('idDocument')}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Upload ID Document
              </button>
            )}
          </div>

          {/* Selfie with ID */}
          <div className="mb-6">
            <label htmlFor="selfie-id" className="block text-sm font-medium text-gray-700 mb-2">
              Selfie with ID
            </label>
            <input
              id="selfie-id"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect('selfie', file);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFiles.selfie && (
              <button
                onClick={() => uploadDocument('selfie')}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Upload Selfie
              </button>
            )}
          </div>

          {/* Proof of Address */}
          <div className="mb-6">
            <label htmlFor="proof-address" className="block text-sm font-medium text-gray-700 mb-2">
              Proof of Address
            </label>
            <input
              id="proof-address"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect('proofOfAddress', file);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFiles.proofOfAddress && (
              <button
                onClick={() => uploadDocument('proofOfAddress')}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Upload Proof of Address
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Complete KYC
          </button>
        </div>
      </div>
    </div>
  );
};

export default KYC; 