'use client';

import React from 'react';
import { XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface KYCDocumentPreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

const KYCDocumentPreview: React.FC<KYCDocumentPreviewProps> = ({ 
  file, 
  onRemove, 
  className = '' 
}) => {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    if (isPDF) {
      return <DocumentIcon className="h-8 w-8 text-red-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const getFileType = () => {
    if (isImage) return 'Image';
    if (isPDF) return 'PDF';
    return 'Document';
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {isImage ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={URL.createObjectURL(file)}
                alt="Document preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <span>{getFileType()}</span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            </div>
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={onRemove}
              className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Progress (if needed) */}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <p className="text-xs text-green-600 mt-1">Uploaded successfully</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCDocumentPreview; 