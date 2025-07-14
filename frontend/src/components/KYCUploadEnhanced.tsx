'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import KYCDocumentPreview from './KYCDocumentPreview';
import { kycService } from '../services/kycService';

interface KYCUploadEnhancedProps {
  level: 'bronze' | 'silver';
  onSuccess?: () => void;
  className?: string;
}

interface UploadField {
  name: string;
  label: string;
  required: boolean;
  type: 'file' | 'text';
  accept?: string;
  placeholder?: string;
}

const KYCUploadEnhanced: React.FC<KYCUploadEnhancedProps> = ({ 
  level, 
  onSuccess, 
  className = '' 
}) => {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bronzeFields: UploadField[] = [
    {
      name: 'idDocument',
      label: 'ID/Passport Document',
      required: true,
      type: 'file',
      accept: 'image/*,.pdf'
    },
    {
      name: 'selfieWithId',
      label: 'Selfie with ID/Passport',
      required: true,
      type: 'file',
      accept: 'image/*'
    },
    {
      name: 'homeAddress',
      label: 'Home Address',
      required: true,
      type: 'text',
      placeholder: 'Enter your complete home address'
    }
  ];

  const silverFields: UploadField[] = [
    {
      name: 'certifiedIdDocument',
      label: 'Certified ID/Passport Copy',
      required: true,
      type: 'file',
      accept: 'image/*,.pdf'
    },
    {
      name: 'proofOfAddress',
      label: 'Proof of Address',
      required: true,
      type: 'file',
      accept: 'image/*,.pdf'
    },
    {
      name: 'jobTitle',
      label: 'Job Title',
      required: true,
      type: 'text',
      placeholder: 'Enter your current job title'
    }
  ];

  const currentFields = level === 'bronze' ? bronzeFields : silverFields;

  const onDrop = useCallback((acceptedFiles: File[], fieldName: string) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [fieldName]: acceptedFiles[0] }));
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      // This will be handled by individual dropzones
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const handleFileChange = (fieldName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }));
    setError('');
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setError('');
  };

  const validateForm = () => {
    for (const field of currentFields) {
      if (field.required) {
        if (field.type === 'file' && !files[field.name]) {
          setError(`${field.label} is required`);
          return false;
        }
        if (field.type === 'text' && !formData[field.name]?.trim()) {
          setError(`${field.label} is required`);
          return false;
        }
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

      const result = level === 'bronze' 
        ? await kycService.uploadBronzeDocuments(formDataToSend)
        : await kycService.uploadSilverDocuments(formDataToSend);

      setSuccess(result.message);
      setFiles({});
      setFormData({});
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fieldName: string) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
  };

  const renderFileUpload = (field: UploadField) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (acceptedFiles) => onDrop(acceptedFiles, field.name),
      accept: field.accept ? {
        'image/*': ['.jpeg', '.jpg', '.png'],
        'application/pdf': ['.pdf']
      } : undefined,
      maxSize: 5 * 1024 * 1024,
      multiple: false
    });

    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label} {field.required && '*'}
        </label>
        
        {files[field.name] ? (
          <KYCDocumentPreview
            file={files[field.name]!}
            onRemove={() => removeFile(field.name)}
          />
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                Click to upload
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {field.accept?.includes('image/*') ? 'Images and PDFs' : 'Images only'} up to 5MB
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTextInput = (field: UploadField) => (
    <div key={field.name} className="space-y-2">
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
        {field.label} {field.required && '*'}
      </label>
      <input
        id={field.name}
        type="text"
        value={formData[field.name] || ''}
        onChange={(e) => handleInputChange(field.name, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={field.placeholder}
      />
    </div>
  );

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
        {/* Form Fields */}
        {currentFields.map((field) => 
          field.type === 'file' ? renderFileUpload(field) : renderTextInput(field)
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
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

export default KYCUploadEnhanced; 