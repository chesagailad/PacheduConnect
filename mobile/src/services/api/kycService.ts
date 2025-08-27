import { apiClient } from './apiClient';
import { AppError, ErrorCode } from '../../utils/errors';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// KYC Interfaces
export interface KYCStatus {
  id: string;
  userId: string;
  level: 'bronze' | 'silver' | 'gold';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  submittedAt: string;
  reviewedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  documents: KYCDocument[];
  personalInfo: KYCPersonalInfo;
  verificationScore: number;
  lastUpdated: string;
}

export interface KYCPersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phoneNumber: string;
  email: string;
  occupation: string;
  sourceOfFunds: string;
  expectedMonthlyVolume: number;
}

export interface KYCDocument {
  id: string;
  type: 'identity' | 'address' | 'income' | 'business' | 'other';
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  documentNumber?: string;
  expiryDate?: string;
  country?: string;
}

export interface KYCSubmissionRequest {
  personalInfo: KYCPersonalInfo;
  documents: KYCDocumentUpload[];
  level: 'bronze' | 'silver' | 'gold';
}

export interface KYCDocumentUpload {
  type: 'identity' | 'address' | 'income' | 'business' | 'other';
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  documentNumber?: string;
  expiryDate?: string;
  country?: string;
}

export interface KYCRequirements {
  level: 'bronze' | 'silver' | 'gold';
  requiredDocuments: {
    type: string;
    name: string;
    description: string;
    required: boolean;
    acceptedFormats: string[];
    maxSize: number;
  }[];
  limits: {
    dailyLimit: number;
    monthlyLimit: number;
    yearlyLimit: number;
  };
  features: string[];
}

// KYC Validation Functions
export class KYCValidator {
  static validatePersonalInfo(info: KYCPersonalInfo): void {
    if (!info.firstName || info.firstName.trim().length < 2) {
      throw AppError.fromValidationError('firstName', 'First name must be at least 2 characters');
    }

    if (!info.lastName || info.lastName.trim().length < 2) {
      throw AppError.fromValidationError('lastName', 'Last name must be at least 2 characters');
    }

    if (!info.dateOfBirth) {
      throw AppError.fromValidationError('dateOfBirth', 'Date of birth is required');
    }

    // Validate age (must be 18+)
    const birthDate = new Date(info.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      throw AppError.fromValidationError('dateOfBirth', 'You must be at least 18 years old');
    }

    if (!info.nationality) {
      throw AppError.fromValidationError('nationality', 'Nationality is required');
    }

    if (!info.countryOfResidence) {
      throw AppError.fromValidationError('countryOfResidence', 'Country of residence is required');
    }

    if (!info.phoneNumber) {
      throw AppError.fromValidationError('phoneNumber', 'Phone number is required');
    }

    if (!info.email) {
      throw AppError.fromValidationError('email', 'Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(info.email)) {
      throw AppError.fromValidationError('email', 'Please enter a valid email address');
    }

    if (!info.occupation) {
      throw AppError.fromValidationError('occupation', 'Occupation is required');
    }

    if (!info.sourceOfFunds) {
      throw AppError.fromValidationError('sourceOfFunds', 'Source of funds is required');
    }

    // Validate address
    if (!info.address.street || !info.address.city || !info.address.country) {
      throw AppError.fromValidationError('address', 'Complete address is required');
    }
  }

  static validateDocument(document: KYCDocumentUpload): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (!document.uri) {
      throw AppError.fromValidationError('document', 'Document file is required');
    }

    if (!acceptedFormats.includes(document.mimeType)) {
      throw AppError.fromValidationError(
        'document',
        'Document must be in JPEG, PNG, or PDF format'
      );
    }

    if (document.fileSize > maxSize) {
      throw AppError.fromValidationError(
        'document',
        'Document size must be less than 10MB'
      );
    }

    if (!document.type) {
      throw AppError.fromValidationError('document', 'Document type is required');
    }
  }

  static validateKYCLevel(level: string): void {
    const validLevels = ['bronze', 'silver', 'gold'];
    if (!validLevels.includes(level)) {
      throw AppError.fromValidationError('level', 'Invalid KYC level');
    }
  }
}

// KYC Service Class
export class KYCService {
  private static instance: KYCService;

  static getInstance(): KYCService {
    if (!KYCService.instance) {
      KYCService.instance = new KYCService();
    }
    return KYCService.instance;
  }

  // Get current KYC status
  async getKYCStatus(): Promise<KYCStatus> {
    try {
      const response = await apiClient.get<KYCStatus>('/kyc/status');
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get KYC requirements for a level
  async getKYCRequirements(level: 'bronze' | 'silver' | 'gold'): Promise<KYCRequirements> {
    try {
      KYCValidator.validateKYCLevel(level);
      
      const response = await apiClient.get<KYCRequirements>(`/kyc/requirements/${level}`);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Submit KYC application
  async submitKYC(request: KYCSubmissionRequest): Promise<KYCStatus> {
    try {
      // Validate personal info
      KYCValidator.validatePersonalInfo(request.personalInfo);
      
      // Validate KYC level
      KYCValidator.validateKYCLevel(request.level);
      
      // Validate documents
      request.documents.forEach((doc, index) => {
        try {
          KYCValidator.validateDocument(doc);
        } catch (error) {
          throw AppError.fromValidationError(
            `documents[${index}]`,
            (error as AppError).userMessage
          );
        }
      });

      const response = await apiClient.post<KYCStatus>('/kyc/submit', request);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Upload KYC document
  async uploadDocument(document: KYCDocumentUpload): Promise<KYCDocument> {
    try {
      KYCValidator.validateDocument(document);

      const formData = new FormData();
      formData.append('type', document.type);
      formData.append('file', {
        uri: document.uri,
        name: document.fileName,
        type: document.mimeType,
      } as any);
      
      if (document.documentNumber) {
        formData.append('documentNumber', document.documentNumber);
      }
      if (document.expiryDate) {
        formData.append('expiryDate', document.expiryDate);
      }
      if (document.country) {
        formData.append('country', document.country);
      }

      const response = await apiClient.post<KYCDocument>('/kyc/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Update KYC personal information
  async updatePersonalInfo(personalInfo: KYCPersonalInfo): Promise<KYCStatus> {
    try {
      KYCValidator.validatePersonalInfo(personalInfo);

      const response = await apiClient.put<KYCStatus>('/kyc/personal-info', personalInfo);
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Delete KYC document
  async deleteDocument(documentId: string): Promise<void> {
    try {
      if (!documentId || documentId.trim().length === 0) {
        throw AppError.fromValidationError('documentId', 'Document ID is required');
      }

      await apiClient.delete(`/kyc/documents/${documentId}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get document upload progress
  async getUploadProgress(documentId: string): Promise<{
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message?: string;
  }> {
    try {
      if (!documentId || documentId.trim().length === 0) {
        throw AppError.fromValidationError('documentId', 'Document ID is required');
      }

      const response = await apiClient.get<{
        progress: number;
        status: 'uploading' | 'processing' | 'completed' | 'failed';
        message?: string;
      }>(`/kyc/documents/${documentId}/progress`);

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Pick document from device
  async pickDocument(
    type: 'identity' | 'address' | 'income' | 'business' | 'other'
  ): Promise<KYCDocumentUpload | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      
      return {
        type,
        uri: asset.uri,
        fileName: asset.name || 'document',
        mimeType: asset.mimeType || 'application/octet-stream',
        fileSize: asset.size || 0,
      };
    } catch (error) {
      throw AppError.fromBusinessError(
        ErrorCode.VALIDATION_ERROR,
        'Failed to pick document',
        'Please try selecting the document again'
      );
    }
  }

  // Take photo for KYC
  async takePhoto(
    type: 'identity' | 'address' | 'income' | 'business' | 'other'
  ): Promise<KYCDocumentUpload | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw AppError.fromBusinessError(
          ErrorCode.FORBIDDEN,
          'Camera permission denied',
          'Please grant camera permission to take photos for KYC'
        );
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      
      return {
        type,
        uri: asset.uri,
        fileName: `kyc_${type}_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: 0, // Will be calculated when uploading
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromBusinessError(
        ErrorCode.VALIDATION_ERROR,
        'Failed to take photo',
        'Please try taking the photo again'
      );
    }
  }

  // Check KYC verification status
  async checkVerificationStatus(): Promise<{
    isVerified: boolean;
    level: string;
    status: string;
    nextReviewDate?: string;
  }> {
    try {
      const response = await apiClient.get<{
        isVerified: boolean;
        level: string;
        status: string;
        nextReviewDate?: string;
      }>('/kyc/verification-status');

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Request KYC review
  async requestReview(): Promise<{ message: string; estimatedReviewTime: string }> {
    try {
      const response = await apiClient.post<{ message: string; estimatedReviewTime: string }>(
        '/kyc/request-review'
      );
      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Get KYC history
  async getKYCHistory(): Promise<{
    submissions: KYCStatus[];
    total: number;
  }> {
    try {
      const response = await apiClient.get<{
        submissions: KYCStatus[];
        total: number;
      }>('/kyc/history');

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }

  // Download KYC document
  async downloadDocument(documentId: string): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      if (!documentId || documentId.trim().length === 0) {
        throw AppError.fromValidationError('documentId', 'Document ID is required');
      }

      const response = await apiClient.get<{ downloadUrl: string; expiresAt: string }>(
        `/kyc/documents/${documentId}/download`
      );

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.fromServerError(error);
    }
  }
}

// Export singleton instance
export const kycService = KYCService.getInstance(); 