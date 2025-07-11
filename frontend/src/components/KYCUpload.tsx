'use client';

import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface KYCUploadProps {
  level: 'bronze' | 'silver';
  onSuccess?: () => void;
  className?: string;
}

const KYCUpload: React.FC<KYCUploadProps> = ({ level, onSuccess, className = '' }) => {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bronzeFields = {
    idDocument: 'ID/Passport Document',
    selfieWithId: 'Selfie with ID/Passport',
    homeAddress: 'Home Address'
  };

  const silverFields = {
    certifiedIdDocument: 'Certified ID/Passport Copy',
    proofOfAddress: 'Proof of Address',
    jobTitle: 'Job Title'
  };

  const currentFields = level === 'bronze' ? bronzeFields : silverFields;

  const handleFileChange = (fieldName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }));
    setError('');
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setError('');
  };

  const validateForm = () => {
    if (level === 'bronze') {
      if (!formData.homeAddress?.trim()) {
        setError('Home address is required');
        return false;
      }
      if (!files.idDocument || !files.selfieWithId) {
        setError('Both ID document and selfie with ID are required');
        return false;
      }
    } else if (level === 'silver') {
      if (!formData.jobTitle?.trim()) {
        setError('Job title is required');
        return false;
      }
      if (!files.certifiedIdDocument || !files.proofOfAddress) {
        setError('Both certified ID document and proof of address are required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add files
      Object.entries(files).forEach(([fieldName, file]) => {
        if (file) {
          formDataToSend.append(fieldName, file);
        }
      });

      // Add form data
      Object.entries(formData).forEach(([fieldName, value]) => {
        if (value) {
          formDataToSend.append(fieldName, value);
        }
      });

      const endpoint = level === 'bronze' ? '/api/kyc/upload-bronze' : '/api/kyc/upload-silver';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setFiles({});
        setFormData({});
        onSuccess?.();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fieldName: string) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload {level.charAt(0).toUpperCase() + level.slice(1)} Level Documents
        </h3>
        <p className="text-sm text-gray-600">
          {level === 'bronze' 
            ? 'Upload your ID/Passport document, a selfie with your ID, and provide your home address.'
            : 'Upload a certified copy of your ID/Passport, proof of address, and provide your job title.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Fields */}
        {Object.entries(currentFields).map(([fieldName, label]) => {
          const isFileField = fieldName !== 'homeAddress' && fieldName !== 'jobTitle';
          
          if (isFileField) {
            return (
              <div key={fieldName} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {label} *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {files[fieldName] ? (
                    <div className="space-y-2">
                      {getFilePreview(files[fieldName]!) ? (
                        <img 
                          src={getFilePreview(files[fieldName]!)!} 
                          alt="Preview" 
                          className="max-w-xs max-h-32 object-contain rounded"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          File: {files[fieldName]?.name}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(fieldName)}
                        className="flex items-center text-red-600 hover:text-red-800 text-sm"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor={fieldName} className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-800 font-medium">
                            Click to upload
                          </span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </label>
                        <input
                          id={fieldName}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(fieldName, e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            return (
              <div key={fieldName} className="space-y-2">
                <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
                  {label} *
                </label>
                <input
                  id={fieldName}
                  type="text"
                  value={formData[fieldName] || ''}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={fieldName === 'homeAddress' ? 'Enter your home address' : 'Enter your job title'}
                />
              </div>
            );
          }
        })}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" />
              Uploading...
            </>
          ) : (
            `Upload ${level.charAt(0).toUpperCase() + level.slice(1)} Documents`
          )}
        </Button>
      </form>
    </div>
  );
};

export default KYCUpload; 