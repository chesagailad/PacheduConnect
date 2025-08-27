import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendMoney from '../SendMoney';

// Mock API calls
global.fetch = jest.fn();

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

describe('SendMoney Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  test('Should render without infinite re-render', () => {
    render(<SendMoney />);
    expect(screen.getByText('Send Money')).toBeInTheDocument();
  });
}); 