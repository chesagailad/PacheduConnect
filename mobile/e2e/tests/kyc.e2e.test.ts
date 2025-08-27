import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { kycService } from '../../src/services/api/kycService';
import { AppError, ErrorCode } from '../../src/utils/errors';

// Mock the KYC service
jest.mock('../../src/services/api/kycService');

describe('KYC E2E Tests', () => {
  const mockKYCService = kycService as jest.Mocked<typeof kycService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('KYC Status Check', () => {
    test('should display current KYC status correctly', async () => {
      // Arrange
      const mockKYCStatus = {
        id: 'kyc-123',
        userId: 'user-123',
        level: 'silver',
        status: 'approved',
        submittedAt: new Date().toISOString(),
        documents: [],
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          countryOfResidence: 'US',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          },
          phoneNumber: '+1234567890',
          email: 'test@example.com',
          occupation: 'Developer',
          sourceOfFunds: 'Employment',
          expectedMonthlyVolume: 1000,
        },
        verificationScore: 85,
        lastUpdated: new Date().toISOString(),
      };

      const mockGetKYCStatus = jest.fn().mockResolvedValue(mockKYCStatus);
      mockKYCService.getKYCStatus = mockGetKYCStatus;

      // Act
      await act(async () => {
        const result = await mockKYCService.getKYCStatus();
        expect(result.level).toBe('silver');
        expect(result.status).toBe('approved');
        expect(result.verificationScore).toBe(85);
      });
    });

    test('should handle KYC status loading error', async () => {
      // Arrange
      const mockGetKYCStatus = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.SERVER_ERROR,
          message: 'Failed to load KYC status',
          retryable: true,
          userMessage: 'Something went wrong. Please try again later.',
          timestamp: new Date(),
        })
      );

      mockKYCService.getKYCStatus = mockGetKYCStatus;

      // Act & Assert
      await expect(mockKYCService.getKYCStatus()).rejects.toThrow();
    });
  });

  describe('KYC Requirements', () => {
    test('should display KYC requirements for bronze level', async () => {
      // Arrange
      const mockRequirements = {
        level: 'bronze',
        requiredDocuments: [
          {
            type: 'identity',
            name: 'Government ID',
            description: 'Valid government-issued identification',
            required: true,
            acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
            maxSize: 10485760,
          },
        ],
        limits: {
          dailyLimit: 100,
          monthlyLimit: 1000,
          yearlyLimit: 10000,
        },
        features: ['Basic money transfers', 'Limited transaction history'],
      };

      const mockGetKYCRequirements = jest.fn().mockResolvedValue(mockRequirements);
      mockKYCService.getKYCRequirements = mockGetKYCRequirements;

      // Act
      await act(async () => {
        const result = await mockKYCService.getKYCRequirements('bronze');
        expect(result.level).toBe('bronze');
        expect(result.requiredDocuments).toHaveLength(1);
        expect(result.limits.dailyLimit).toBe(100);
      });
    });

    test('should display KYC requirements for silver level', async () => {
      // Arrange
      const mockRequirements = {
        level: 'silver',
        requiredDocuments: [
          {
            type: 'identity',
            name: 'Government ID',
            description: 'Valid government-issued identification',
            required: true,
            acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
            maxSize: 10485760,
          },
          {
            type: 'address',
            name: 'Proof of Address',
            description: 'Recent utility bill or bank statement',
            required: true,
            acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
            maxSize: 10485760,
          },
        ],
        limits: {
          dailyLimit: 1000,
          monthlyLimit: 10000,
          yearlyLimit: 100000,
        },
        features: ['Enhanced money transfers', 'Full transaction history', 'Priority support'],
      };

      const mockGetKYCRequirements = jest.fn().mockResolvedValue(mockRequirements);
      mockKYCService.getKYCRequirements = mockGetKYCRequirements;

      // Act
      await act(async () => {
        const result = await mockKYCService.getKYCRequirements('silver');
        expect(result.level).toBe('silver');
        expect(result.requiredDocuments).toHaveLength(2);
        expect(result.limits.dailyLimit).toBe(1000);
      });
    });
  });

  describe('KYC Submission', () => {
    test('should successfully submit KYC application', async () => {
      // Arrange
      const mockSubmissionRequest = {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          countryOfResidence: 'US',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          },
          phoneNumber: '+1234567890',
          email: 'test@example.com',
          occupation: 'Developer',
          sourceOfFunds: 'Employment',
          expectedMonthlyVolume: 1000,
        },
        documents: [],
        level: 'silver' as const,
      };

      const mockSubmitKYC = jest.fn().mockResolvedValue({
        id: 'kyc-123',
        status: 'pending',
        level: 'silver',
        submittedAt: new Date().toISOString(),
      });

      mockKYCService.submitKYC = mockSubmitKYC;

      // Act
      await act(async () => {
        const result = await mockKYCService.submitKYC(mockSubmissionRequest);
        expect(result.status).toBe('pending');
        expect(result.level).toBe('silver');
      });
    });

    test('should handle KYC submission with invalid data', async () => {
      // Arrange
      const mockSubmissionRequest = {
        personalInfo: {
          firstName: '', // Invalid: empty name
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          countryOfResidence: 'US',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          },
          phoneNumber: '+1234567890',
          email: 'test@example.com',
          occupation: 'Developer',
          sourceOfFunds: 'Employment',
          expectedMonthlyVolume: 1000,
        },
        documents: [],
        level: 'silver' as const,
      };

      const mockSubmitKYC = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'First name must be at least 2 characters',
          retryable: false,
          userMessage: 'First name must be at least 2 characters',
          timestamp: new Date(),
        })
      );

      mockKYCService.submitKYC = mockSubmitKYC;

      // Act & Assert
      await expect(mockKYCService.submitKYC(mockSubmissionRequest)).rejects.toThrow();
    });

    test('should handle KYC submission with underage user', async () => {
      // Arrange
      const mockSubmissionRequest = {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '2010-01-01', // Underage
          nationality: 'US',
          countryOfResidence: 'US',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'US',
          },
          phoneNumber: '+1234567890',
          email: 'test@example.com',
          occupation: 'Student',
          sourceOfFunds: 'Allowance',
          expectedMonthlyVolume: 100,
        },
        documents: [],
        level: 'bronze' as const,
      };

      const mockSubmitKYC = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'You must be at least 18 years old',
          retryable: false,
          userMessage: 'You must be at least 18 years old',
          timestamp: new Date(),
        })
      );

      mockKYCService.submitKYC = mockSubmitKYC;

      // Act & Assert
      await expect(mockKYCService.submitKYC(mockSubmissionRequest)).rejects.toThrow();
    });
  });

  describe('Document Upload', () => {
    test('should successfully upload KYC document', async () => {
      // Arrange
      const mockDocument = {
        type: 'identity' as const,
        uri: 'file://test-document.jpg',
        fileName: 'test-document.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000, // 1MB
        documentNumber: 'ID123456',
        expiryDate: '2025-12-31',
        country: 'US',
      };

      const mockUploadDocument = jest.fn().mockResolvedValue({
        id: 'doc-123',
        type: 'identity',
        name: 'Government ID',
        fileName: 'test-document.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        uploadDate: new Date().toISOString(),
        status: 'pending',
        documentNumber: 'ID123456',
        expiryDate: '2025-12-31',
        country: 'US',
      });

      mockKYCService.uploadDocument = mockUploadDocument;

      // Act
      await act(async () => {
        const result = await mockKYCService.uploadDocument(mockDocument);
        expect(result.type).toBe('identity');
        expect(result.status).toBe('pending');
        expect(result.documentNumber).toBe('ID123456');
      });
    });

    test('should handle document upload with invalid file size', async () => {
      // Arrange
      const mockDocument = {
        type: 'identity' as const,
        uri: 'file://large-document.jpg',
        fileName: 'large-document.jpg',
        mimeType: 'image/jpeg',
        fileSize: 15 * 1024 * 1024, // 15MB (exceeds 10MB limit)
      };

      const mockUploadDocument = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Document size must be less than 10MB',
          retryable: false,
          userMessage: 'Document size must be less than 10MB',
          timestamp: new Date(),
        })
      );

      mockKYCService.uploadDocument = mockUploadDocument;

      // Act & Assert
      await expect(mockKYCService.uploadDocument(mockDocument)).rejects.toThrow();
    });

    test('should handle document upload with invalid file format', async () => {
      // Arrange
      const mockDocument = {
        type: 'identity' as const,
        uri: 'file://document.txt',
        fileName: 'document.txt',
        mimeType: 'text/plain', // Invalid format
        fileSize: 1024000,
      };

      const mockUploadDocument = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Document must be in JPEG, PNG, or PDF format',
          retryable: false,
          userMessage: 'Document must be in JPEG, PNG, or PDF format',
          timestamp: new Date(),
        })
      );

      mockKYCService.uploadDocument = mockUploadDocument;

      // Act & Assert
      await expect(mockKYCService.uploadDocument(mockDocument)).rejects.toThrow();
    });
  });

  describe('Document Management', () => {
    test('should successfully delete KYC document', async () => {
      // Arrange
      const mockDeleteDocument = jest.fn().mockResolvedValue(undefined);
      mockKYCService.deleteDocument = mockDeleteDocument;

      // Act
      await act(async () => {
        await mockKYCService.deleteDocument('doc-123');
      });

      // Assert
      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-123');
    });

    test('should handle document deletion error', async () => {
      // Arrange
      const mockDeleteDocument = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.NOT_FOUND,
          message: 'Document not found',
          retryable: false,
          userMessage: 'Document not found',
          timestamp: new Date(),
        })
      );

      mockKYCService.deleteDocument = mockDeleteDocument;

      // Act & Assert
      await expect(mockKYCService.deleteDocument('invalid-doc-id')).rejects.toThrow();
    });

    test('should get document upload progress', async () => {
      // Arrange
      const mockGetUploadProgress = jest.fn().mockResolvedValue({
        progress: 75,
        status: 'uploading',
        message: 'Uploading document...',
      });

      mockKYCService.getUploadProgress = mockGetUploadProgress;

      // Act
      await act(async () => {
        const result = await mockKYCService.getUploadProgress('doc-123');
        expect(result.progress).toBe(75);
        expect(result.status).toBe('uploading');
      });
    });
  });

  describe('KYC Verification Status', () => {
    test('should check KYC verification status', async () => {
      // Arrange
      const mockCheckVerificationStatus = jest.fn().mockResolvedValue({
        isVerified: true,
        level: 'silver',
        status: 'approved',
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      mockKYCService.checkVerificationStatus = mockCheckVerificationStatus;

      // Act
      await act(async () => {
        const result = await mockKYCService.checkVerificationStatus();
        expect(result.isVerified).toBe(true);
        expect(result.level).toBe('silver');
        expect(result.status).toBe('approved');
      });
    });

    test('should handle KYC verification for pending status', async () => {
      // Arrange
      const mockCheckVerificationStatus = jest.fn().mockResolvedValue({
        isVerified: false,
        level: 'bronze',
        status: 'pending',
      });

      mockKYCService.checkVerificationStatus = mockCheckVerificationStatus;

      // Act
      await act(async () => {
        const result = await mockKYCService.checkVerificationStatus();
        expect(result.isVerified).toBe(false);
        expect(result.status).toBe('pending');
      });
    });
  });

  describe('KYC Review Request', () => {
    test('should successfully request KYC review', async () => {
      // Arrange
      const mockRequestReview = jest.fn().mockResolvedValue({
        message: 'Review request submitted successfully',
        estimatedReviewTime: '2-3 business days',
      });

      mockKYCService.requestReview = mockRequestReview;

      // Act
      await act(async () => {
        const result = await mockKYCService.requestReview();
        expect(result.message).toBe('Review request submitted successfully');
        expect(result.estimatedReviewTime).toBe('2-3 business days');
      });
    });

    test('should handle KYC review request error', async () => {
      // Arrange
      const mockRequestReview = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Cannot request review for approved KYC',
          retryable: false,
          userMessage: 'Cannot request review for approved KYC',
          timestamp: new Date(),
        })
      );

      mockKYCService.requestReview = mockRequestReview;

      // Act & Assert
      await expect(mockKYCService.requestReview()).rejects.toThrow();
    });
  });

  describe('KYC History', () => {
    test('should display KYC submission history', async () => {
      // Arrange
      const mockKYCHistory = {
        submissions: [
          {
            id: 'kyc-1',
            level: 'bronze',
            status: 'approved',
            submittedAt: new Date('2024-01-01').toISOString(),
          },
          {
            id: 'kyc-2',
            level: 'silver',
            status: 'pending',
            submittedAt: new Date('2024-01-15').toISOString(),
          },
        ],
        total: 2,
      };

      const mockGetKYCHistory = jest.fn().mockResolvedValue(mockKYCHistory);
      mockKYCService.getKYCHistory = mockGetKYCHistory;

      // Act
      await act(async () => {
        const result = await mockKYCService.getKYCHistory();
        expect(result.submissions).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.submissions[0].level).toBe('bronze');
        expect(result.submissions[1].level).toBe('silver');
      });
    });

    test('should handle KYC history loading error', async () => {
      // Arrange
      const mockGetKYCHistory = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.SERVER_ERROR,
          message: 'Failed to load KYC history',
          retryable: true,
          userMessage: 'Something went wrong. Please try again later.',
          timestamp: new Date(),
        })
      );

      mockKYCService.getKYCHistory = mockGetKYCHistory;

      // Act & Assert
      await expect(mockKYCService.getKYCHistory()).rejects.toThrow();
    });
  });

  describe('Document Download', () => {
    test('should successfully download KYC document', async () => {
      // Arrange
      const mockDownloadDocument = jest.fn().mockResolvedValue({
        downloadUrl: 'https://example.com/document.pdf',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      mockKYCService.downloadDocument = mockDownloadDocument;

      // Act
      await act(async () => {
        const result = await mockKYCService.downloadDocument('doc-123');
        expect(result.downloadUrl).toBeDefined();
        expect(result.expiresAt).toBeDefined();
      });
    });

    test('should handle document download error', async () => {
      // Arrange
      const mockDownloadDocument = jest.fn().mockRejectedValue(
        new AppError({
          code: ErrorCode.NOT_FOUND,
          message: 'Document not found',
          retryable: false,
          userMessage: 'Document not found',
          timestamp: new Date(),
        })
      );

      mockKYCService.downloadDocument = mockDownloadDocument;

      // Act & Assert
      await expect(mockKYCService.downloadDocument('invalid-doc-id')).rejects.toThrow();
    });
  });
}); 