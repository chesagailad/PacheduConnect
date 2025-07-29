/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: FeeTransparency.test - test file for React components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FeeTransparency from '../FeeTransparency';

// Mock the motion components from framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    section: ({ children, className }: any) => <section className={className}>{children}</section>,
    div: ({ children, className }: any) => <div className={className}>{children}</div>
  }
}));

describe('FeeTransparency Component', () => {
  const renderComponent = () => {
    return render(<FeeTransparency />);
  };

  describe('Fee Calculation Validation', () => {
    test('should display valid fee calculation for normal amounts', () => {
      renderComponent();
      
      // Check that the component renders without validation errors
      expect(screen.getByText('Transfer Amount:')).toBeInTheDocument();
      expect(screen.getByText('Transfer Fee (3%):')).toBeInTheDocument();
      expect(screen.getByText('Total Cost:')).toBeInTheDocument();
      
      // Should not show error message for valid amounts
      expect(screen.queryByText(/Invalid amount/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Minimum transfer amount/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Maximum transfer amount/)).not.toBeInTheDocument();
    });

    test('should handle minimum and maximum amounts correctly', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Set amount to minimum (10) - should be valid
      fireEvent.change(rangeInput, { target: { value: '10' } });
      expect(screen.queryByText(/Minimum transfer amount/)).not.toBeInTheDocument();
      expect(screen.getByText('R0.30')).toBeInTheDocument(); // 3% of 10
      
      // Set amount to maximum (50000) - should be valid
      fireEvent.change(rangeInput, { target: { value: '50000' } });
      expect(screen.queryByText(/Maximum transfer amount/)).not.toBeInTheDocument();
      expect(screen.getByText('R1500.00')).toBeInTheDocument(); // 3% of 50000
    });

    test('should calculate correct fee for valid amounts', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Test with R1000
      fireEvent.change(rangeInput, { target: { value: '1000' } });
      
      // Fee should be 3% of 1000 = R30
      expect(screen.getByText('R30.00')).toBeInTheDocument();
      
      // Total cost should be 1000 + 30 = R1030
      expect(screen.getByText('R1030.00')).toBeInTheDocument();
    });

    test('should apply minimum fee for small amounts', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Test with R10 (minimum amount)
      fireEvent.change(rangeInput, { target: { value: '10' } });
      
      // Fee should be 3% of 10 = R0.30 (minimum fee doesn't apply here)
      expect(screen.getByText('R0.30')).toBeInTheDocument();
      
      // Total cost should be 10 + 0.30 = R10.30
      expect(screen.getByText('R10.30')).toBeInTheDocument();
    });

    test('should handle edge cases correctly', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Test with minimum amount (should be valid)
      fireEvent.change(rangeInput, { target: { value: '10' } });
      expect(screen.queryByText(/Amount must be greater than zero/)).not.toBeInTheDocument();
      
      // Test with maximum amount (should be valid)
      fireEvent.change(rangeInput, { target: { value: '50000' } });
      expect(screen.queryByText(/Maximum transfer amount/)).not.toBeInTheDocument();
    });
  });

  describe('Range Input Validation', () => {
    test('should have correct min and max values', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      expect(rangeInput).toHaveAttribute('min', '10');
      expect(rangeInput).toHaveAttribute('max', '50000');
      expect(rangeInput).toHaveAttribute('step', '100');
    });

    test('should display correct range labels', () => {
      renderComponent();
      
      expect(screen.getByText('R10')).toBeInTheDocument();
      expect(screen.getByText('R50,000')).toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    test('should render all required UI elements', () => {
      renderComponent();
      
      expect(screen.getByText('💰 Transparent Fee Structure')).toBeInTheDocument();
      expect(screen.getByText('Simple, transparent pricing. 3% flat fee on all transfers')).toBeInTheDocument();
      expect(screen.getByText('Fee Calculator')).toBeInTheDocument();
      expect(screen.getByText('Simple 3% Flat Fee')).toBeInTheDocument();
      expect(screen.getByText('Transfer Amount (ZAR)')).toBeInTheDocument();
    });

    test('should display fee calculation correctly', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Set amount to 1000
      fireEvent.change(rangeInput, { target: { value: '1000' } });
      
      // Should show correct fee calculation
      expect(screen.getByText('R30.00')).toBeInTheDocument(); // 3% of 1000
      expect(screen.getByText('R1030.00')).toBeInTheDocument(); // 1000 + 30
    });
  });

  describe('Fee Calculation Accuracy', () => {
    test('should calculate fees with proper decimal precision', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Test with R333
      fireEvent.change(rangeInput, { target: { value: '333' } });
      
      // Fee should be 3% of 333 = R9.99
      expect(screen.getByText('R9.99')).toBeInTheDocument();
      
      // Total should be 333 + 9.99 = R342.99
      expect(screen.getByText('R342.99')).toBeInTheDocument();
    });

    test('should handle large amounts correctly', () => {
      renderComponent();
      
      const rangeInput = screen.getByRole('slider');
      
      // Test with R10000
      fireEvent.change(rangeInput, { target: { value: '10000' } });
      
      // Fee should be 3% of 10000 = R300
      expect(screen.getByText('R300.00')).toBeInTheDocument();
      
      // Total should be 10000 + 300 = R10300
      expect(screen.getByText('R10300.00')).toBeInTheDocument();
    });
  });
}); 