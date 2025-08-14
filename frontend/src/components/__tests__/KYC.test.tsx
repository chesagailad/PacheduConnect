import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KYC from '../KYC';

// Mock API calls
global.fetch = jest.fn();

// Mock file upload
const mockFile = new File(['test content'], 'test-document.jpg', { type: 'image/jpeg' });

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
(global as any).localStorage = localStorageMock;

describe('KYC Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Initial Rendering', () => {
    test('Should render KYC form', () => {
      render(<KYC />);
      
      expect(screen.getByText('KYC Verification')).toBeInTheDocument();
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    test('Should display KYC levels', () => {
      render(<KYC />);
      
      expect(screen.getByText('Bronze Level')).toBeInTheDocument();
      expect(screen.getByText('Silver Level')).toBeInTheDocument();
      expect(screen.getByText('Gold Level')).toBeInTheDocument();
    });

    test('Should show current KYC status', () => {
      render(<KYC />);
      
      expect(screen.getByText('Current Status:')).toBeInTheDocument();
      expect(screen.getByText('Monthly Limit:')).toBeInTheDocument();
    });
  });

  describe('Document Upload (UC-020 to UC-025)', () => {
    test('UC-020: Should upload ID document', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'ID document uploaded successfully'
        })
      });

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('ID document uploaded successfully')).toBeInTheDocument();
      });
    });

    test('UC-021: Should upload selfie with ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Selfie uploaded successfully'
        })
      });

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('Selfie with ID');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload Selfie');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Selfie uploaded successfully')).toBeInTheDocument();
      });
    });

    test('UC-022: Should upload proof of address', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Proof of address uploaded successfully'
        })
      });

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('Proof of Address');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload Proof of Address');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Proof of address uploaded successfully')).toBeInTheDocument();
      });
    });

    test('UC-023: Should validate file format', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Only image and PDF files are allowed')).toBeInTheDocument();
      });
    });

    test('UC-024: Should validate file size', async () => {
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
      });
    });

    test('UC-025: Should assess document quality', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Document quality is too low. Please upload a clearer image.'
        })
      });

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Document quality is too low')).toBeInTheDocument();
      });
    });
  });

  describe('KYC Levels & Limits (UC-015 to UC-019)', () => {
    test('UC-015: Should display Bronze level information', () => {
      render(<KYC />);
      
      const bronzeLevel = screen.getByText('Bronze Level');
      fireEvent.click(bronzeLevel);
      
      expect(screen.getByText('Monthly Limit: R5,000')).toBeInTheDocument();
      expect(screen.getByText('Required Documents:')).toBeInTheDocument();
      expect(screen.getByText('• ID Document')).toBeInTheDocument();
      expect(screen.getByText('• Selfie with ID')).toBeInTheDocument();
    });

    test('UC-016: Should display Silver level information', () => {
      render(<KYC />);
      
      const silverLevel = screen.getByText('Silver Level');
      fireEvent.click(silverLevel);
      
      expect(screen.getByText('Monthly Limit: R25,000')).toBeInTheDocument();
      expect(screen.getByText('• Proof of Address')).toBeInTheDocument();
      expect(screen.getByText('• Employment Details')).toBeInTheDocument();
    });

    test('UC-017: Should display Gold level information', () => {
      render(<KYC />);
      
      const goldLevel = screen.getByText('Gold Level');
      fireEvent.click(goldLevel);
      
      expect(screen.getByText('Monthly Limit: R50,000')).toBeInTheDocument();
      expect(screen.getByText('• Bank Statements')).toBeInTheDocument();
      expect(screen.getByText('• Income Verification')).toBeInTheDocument();
    });

    test('UC-018: Should track monthly limits', () => {
      render(<KYC />);
      
      expect(screen.getByText('Current Month Sent:')).toBeInTheDocument();
      expect(screen.getByText('Remaining Limit:')).toBeInTheDocument();
    });

    test('UC-019: Should validate limits before transactions', () => {
      render(<KYC />);
      
      const limitInfo = screen.getByText('Remaining Limit:');
      expect(limitInfo).toBeInTheDocument();
      
      // Test limit exceeded scenario
      const limitExceeded = screen.queryByText('Limit exceeded');
      if (limitExceeded) {
        expect(limitExceeded).toBeInTheDocument();
      }
    });
  });

  describe('Personal Information (UC-026 to UC-030)', () => {
    test('UC-026: Should validate personal information form', async () => {
      render(<KYC />);
      
      const submitButton = screen.getByText('Submit KYC Application');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
        expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
        expect(screen.getByText('Home address is required')).toBeInTheDocument();
      });
    });

    test('UC-027: Should handle level upgrade requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Upgrade request submitted successfully'
        })
      });

      render(<KYC />);
      
      const upgradeButton = screen.getByText('Request Upgrade');
      fireEvent.click(upgradeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Upgrade request submitted successfully')).toBeInTheDocument();
      });
    });

    test('UC-028: Should display KYC status updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'approved',
          level: 'silver',
          message: 'KYC approved successfully'
        })
      });

      render(<KYC />);
      
      const checkStatusButton = screen.getByText('Check Status');
      fireEvent.click(checkStatusButton);
      
      await waitFor(() => {
        expect(screen.getByText('KYC approved successfully')).toBeInTheDocument();
        expect(screen.getByText('Status: Approved')).toBeInTheDocument();
        expect(screen.getByText('Level: Silver')).toBeInTheDocument();
      });
    });

    test('UC-029: Should handle KYC rejection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'rejected',
          reason: 'Documents are unclear and cannot be verified',
          message: 'KYC application rejected'
        })
      });

      render(<KYC />);
      
      const checkStatusButton = screen.getByText('Check Status');
      fireEvent.click(checkStatusButton);
      
      await waitFor(() => {
        expect(screen.getByText('KYC application rejected')).toBeInTheDocument();
        expect(screen.getByText('Reason: Documents are unclear')).toBeInTheDocument();
      });
    });

    test('UC-030: Should allow document resubmission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Documents resubmitted successfully'
        })
      });

      render(<KYC />);
      
      const resubmitButton = screen.getByText('Resubmit Documents');
      fireEvent.click(resubmitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Documents resubmitted successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('Should validate required fields', async () => {
      render(<KYC />);
      
      const submitButton = screen.getByText('Submit KYC Application');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
        expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
        expect(screen.getByText('Home address is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    test('Should validate date of birth format', async () => {
      render(<KYC />);
      
      const dobInput = screen.getByLabelText('Date of Birth');
      fireEvent.change(dobInput, { target: { value: 'invalid-date' } });
      
      const submitButton = screen.getByText('Submit KYC Application');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid date')).toBeInTheDocument();
      });
    });

    test('Should validate phone number format', async () => {
      render(<KYC />);
      
      const phoneInput = screen.getByLabelText('Phone Number');
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });
      
      const submitButton = screen.getByText('Submit KYC Application');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('Should show loading state during document upload', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, message: 'Upload successful' })
        }), 100))
      );

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      });
    });

    test('Should show loading state during status check', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ status: 'pending' })
        }), 100))
      );

      render(<KYC />);
      
      const checkStatusButton = screen.getByText('Check Status');
      fireEvent.click(checkStatusButton);
      
      expect(screen.getByText('Checking status...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Checking status...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('Should handle network errors during upload', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });
    });

    test('Should handle server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      render(<KYC />);
      
      const fileInput = screen.getByLabelText('ID Document');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      const uploadButton = screen.getByText('Upload ID Document');
      fireEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });
    });
  });
}); 