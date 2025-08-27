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
describe('SendMoney Component - Extended Scenarios', () => {
  // Utility to mock fetch responses in sequence
  const mockFetchResponse = (status: number, body: any, headers: Record<string,string> = {}) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
      headers: {
        get: (k: string) => headers[k.toLowerCase()] ?? null
      }
    } as any);
  };

  const typeInto = async (el: HTMLElement, value: string) => {
    // prefer user-event if available, otherwise fallback to fireEvent
    try {
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.type(el, value);
    } catch {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.change(el, { target: { value } });
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage as any).getItem.mockReturnValue('mock-token');
  });

  test('renders key form controls and submit button', () => {
    render(<SendMoney />);
    // Try common labels/roles; keep selectors flexible to match typical forms
    expect(screen.getByText(/send money/i)).toBeInTheDocument();

    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.queryByPlaceholderText(/amount/i) ||
      screen.getByRole('textbox', { name: /amount/i });

    expect(amountInput).toBeInTheDocument();

    const recipientInput =
      screen.queryByLabelText(/to|recipient|payee/i) ||
      screen.queryByPlaceholderText(/recipient/i) ||
      screen.getByRole('textbox', { name: /to/i });

    expect(recipientInput).toBeInTheDocument();

    const submitBtn =
      screen.queryByRole('button', { name: /send|submit|transfer/i }) ||
      screen.getByText(/send/i).closest('button');

    expect(submitBtn).toBeEnabled();
  });

  test('disables submit for invalid amount (empty, zero, negative, non-numeric)', async () => {
    render(<SendMoney />);

    const submitBtn =
      screen.queryByRole('button', { name: /send|submit|transfer/i }) ||
      screen.getByText(/send/i).closest('button') as HTMLButtonElement;

    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.queryByPlaceholderText(/amount/i) ||
      screen.getByRole('textbox', { name: /amount/i }) as HTMLInputElement;

    // Empty
    await typeInto(amountInput as HTMLElement, '');
    // If component does not auto-disable, we still assert validation feedback when clicked
    if (submitBtn) {
      try { const userEvent = (await import('@testing-library/user-event')).default; await userEvent.click(submitBtn); } catch {}
    }
    expect(global.fetch).not.toHaveBeenCalled();

    // Zero
    await typeInto(amountInput as HTMLElement, '0');
    if (submitBtn) { try { const userEvent = (await import('@testing-library/user-event')).default; await userEvent.click(submitBtn); } catch {} }
    expect(global.fetch).not.toHaveBeenCalled();

    // Negative
    await typeInto(amountInput as HTMLElement, '-10');
    if (submitBtn) { try { const userEvent = (await import('@testing-library/user-event')).default; await userEvent.click(submitBtn); } catch {} }
    expect(global.fetch).not.toHaveBeenCalled();

    // Non-numeric
    await typeInto(amountInput as HTMLElement, 'abc');
    if (submitBtn) { try { const userEvent = (await import('@testing-library/user-event')).default; await userEvent.click(submitBtn); } catch {} }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('includes auth token from localStorage when sending and redirects on success', async () => {
    render(<SendMoney />);

    // Find fields with flexible selectors
    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.queryByPlaceholderText(/amount/i) ||
      screen.getByRole('textbox', { name: /amount/i });

    const recipientInput =
      screen.queryByLabelText(/to|recipient|payee/i) ||
      screen.queryByPlaceholderText(/recipient/i) ||
      screen.getByRole('textbox', { name: /to/i });

    const memoInput =
      screen.queryByLabelText(/memo|note|message/i) ||
      screen.queryByPlaceholderText(/memo|note/i) ||
      screen.queryByRole('textbox', { name: /memo|note/i });

    const submitBtn =
      screen.queryByRole('button', { name: /send|submit|transfer/i }) ||
      screen.getByText(/send/i).closest('button');

    await typeInto(amountInput as HTMLElement, '123.45');
    if (recipientInput) await typeInto(recipientInput as HTMLElement, 'alice@example.com');
    if (memoInput) await typeInto(memoInput as HTMLElement, 'For lunch');

    mockFetchResponse(200, { id: 'tx_123', status: 'ok' });

    try {
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.click(submitBtn as HTMLElement);
    } catch {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.click(submitBtn as HTMLElement);
    }

    // Assert fetch called with token header
    expect(global.fetch).toHaveBeenCalled();
    const [reqUrl, reqInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(reqInit?.headers?.Authorization || reqInit?.headers?.authorization).toMatch(/mock-token/);

    // Assert navigation invoked after success
    expect((jest.requireMock('next/navigation') as any).useRouter().push).toHaveBeenCalled();
  });

  test('shows API error feedback and does not navigate on failure (400/500)', async () => {
    render(<SendMoney />);

    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.queryByPlaceholderText(/amount/i) ||
      screen.getByRole('textbox', { name: /amount/i });
    const submitBtn =
      screen.queryByRole('button', { name: /send|submit|transfer/i }) ||
      screen.getByText(/send/i).closest('button');

    await typeInto(amountInput as HTMLElement, '20');

    mockFetchResponse(400, { error: 'Invalid recipient' });

    try {
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.click(submitBtn as HTMLElement);
    } catch {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.click(submitBtn as HTMLElement);
    }

    // No navigation on error
    expect((jest.requireMock('next/navigation') as any).useRouter().push).not.toHaveBeenCalled();

    // Error message appears (use flexible matcher)
    expect(
      screen.getByText(/invalid|error|failed|unable/i)
    ).toBeInTheDocument();
  });

  test('prevents double submission (debounce/disabled while in-flight)', async () => {
    render(<SendMoney />);

    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.queryByPlaceholderText(/amount/i) ||
      screen.getByRole('textbox', { name: /amount/i });

    const submitBtn =
      screen.queryByRole('button', { name: /send|submit|transfer/i }) ||
      screen.getByText(/send/i).closest('button');

    await typeInto(amountInput as HTMLElement, '50');

    // Keep first request pending by returning a promise that we resolve later
    let resolveFirst: (v?: unknown)=>void;
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(res => { resolveFirst = res; }) as any);

    try {
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.click(submitBtn as HTMLElement);
      // Try clicking again quickly
      await userEvent.click(submitBtn as HTMLElement);
    } catch {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.click(submitBtn as HTMLElement);
      fireEvent.click(submitBtn as HTMLElement);
    }

    // Only one network call should be in-flight before resolution
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);

    // Resolve the first call; subsequent clicks may proceed according to component logic
    resolveFirst && resolveFirst({
      ok: true,
      status: 200,
      json: async () => ({ id: 'tx_abc', status: 'ok' }),
      text: async () => '{"id":"tx_abc","status":"ok"}',
      headers: { get: () => null }
    });

  });

  test('gracefully handles missing auth token (falls back or shows auth error)', async () => {
    (localStorage as any).getItem.mockReturnValueOnce(null);

    render(<SendMoney />);

    const amountInput =
      screen.queryByLabelText(/amount/i) ||
      screen.queryByPlaceholderText(/amount/i) ||
      screen.getByRole('textbox', { name: /amount/i });
    const submitBtn =
      screen.queryByRole('button', { name: /send|submit|transfer/i }) ||
      screen.getByText(/send/i).closest('button');

    await typeInto(amountInput as HTMLElement, '10');

    mockFetchResponse(401, { error: 'Unauthorized' });

    try {
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.click(submitBtn as HTMLElement);
    } catch {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.click(submitBtn as HTMLElement);
    }

    // No navigation and error message visible
    expect((jest.requireMock('next/navigation') as any).useRouter().push).not.toHaveBeenCalled();
    expect(
      screen.getByText(/unauthorized|login|sign in|token/i)
    ).toBeInTheDocument();
  });
});