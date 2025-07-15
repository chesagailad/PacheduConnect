import { test, expect } from '@playwright/test';

test.describe('Transaction Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to send money page', async ({ page }) => {
    await page.getByRole('link', { name: 'Send Money' }).click();
    await expect(page).toHaveURL(/\/send/);
    await expect(page.getByRole('heading', { name: 'Send Money' })).toBeVisible();
  });

  test('should create a new transaction successfully', async ({ page }) => {
    await page.goto('/send');
    
    // Fill transaction form
    await page.getByPlaceholder('Recipient Name').fill('John Doe');
    await page.getByPlaceholder('Phone Number').fill('+263771234567');
    await page.getByPlaceholder('Amount in ZAR').fill('1000');
    
    // Select payout method
    await page.getByRole('combobox', { name: 'Payout Method' }).click();
    await page.getByRole('option', { name: 'EcoCash' }).click();
    
    // Add description
    await page.getByPlaceholder('Purpose of transfer').fill('Family support');
    
    // Submit transaction
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    // Should show confirmation page
    await expect(page).toHaveURL(/\/transaction\/\d+\/confirm/);
    await expect(page.getByText('Confirm Transaction')).toBeVisible();
    await expect(page.getByText('ZAR 1,000')).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should show validation errors for incomplete form', async ({ page }) => {
    await page.goto('/send');
    
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    await expect(page.getByText('Recipient name is required')).toBeVisible();
    await expect(page.getByText('Phone number is required')).toBeVisible();
    await expect(page.getByText('Amount is required')).toBeVisible();
  });

  test('should validate minimum amount', async ({ page }) => {
    await page.goto('/send');
    
    await page.getByPlaceholder('Amount in ZAR').fill('50'); // Below minimum
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    await expect(page.getByText('Minimum amount is ZAR 100')).toBeVisible();
  });

  test('should validate maximum amount', async ({ page }) => {
    await page.goto('/send');
    
    await page.getByPlaceholder('Amount in ZAR').fill('25000'); // Above maximum
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    await expect(page.getByText('Maximum amount is ZAR 20,000')).toBeVisible();
  });

  test('should display live exchange rate', async ({ page }) => {
    await page.goto('/send');
    
    await page.getByPlaceholder('Amount in ZAR').fill('1000');
    
    // Wait for exchange rate to load
    await expect(page.getByText(/Exchange Rate:/)).toBeVisible();
    await expect(page.getByText(/ZWL/)).toBeVisible();
    
    // Should show converted amount
    await expect(page.getByText(/You send: ZAR 1,000/)).toBeVisible();
    await expect(page.getByText(/Recipient gets: ZWL/)).toBeVisible();
  });

  test('should save recipient for future use', async ({ page }) => {
    await page.goto('/send');
    
    await page.getByPlaceholder('Recipient Name').fill('Jane Smith');
    await page.getByPlaceholder('Phone Number').fill('+263771234568');
    await page.getByRole('checkbox', { name: 'Save recipient' }).check();
    
    await page.getByPlaceholder('Amount in ZAR').fill('500');
    await page.getByRole('combobox', { name: 'Payout Method' }).click();
    await page.getByRole('option', { name: 'Bank Transfer' }).click();
    
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    // Go back and check saved recipients
    await page.goto('/recipients');
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('+263771234568')).toBeVisible();
  });

  test('should use saved recipient', async ({ page }) => {
    // First create a saved recipient
    await page.goto('/recipients');
    await page.getByRole('button', { name: 'Add Recipient' }).click();
    
    await page.getByPlaceholder('Full Name').fill('Mary Johnson');
    await page.getByPlaceholder('Phone Number').fill('+263771234569');
    await page.getByRole('button', { name: 'Save Recipient' }).click();
    
    // Now use saved recipient in transaction
    await page.goto('/send');
    await page.getByRole('button', { name: 'Choose Recipient' }).click();
    await page.getByText('Mary Johnson').click();
    
    // Form should be pre-filled
    await expect(page.getByDisplayValue('Mary Johnson')).toBeVisible();
    await expect(page.getByDisplayValue('+263771234569')).toBeVisible();
  });

  test('should track transaction status', async ({ page }) => {
    await page.goto('/send');
    
    // Create transaction
    await page.getByPlaceholder('Recipient Name').fill('Test User');
    await page.getByPlaceholder('Phone Number').fill('+263771234567');
    await page.getByPlaceholder('Amount in ZAR').fill('1000');
    await page.getByRole('combobox', { name: 'Payout Method' }).click();
    await page.getByRole('option', { name: 'EcoCash' }).click();
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    // Confirm transaction
    await page.getByRole('button', { name: 'Confirm Payment' }).click();
    
    // Should redirect to transaction details
    await expect(page).toHaveURL(/\/transaction\/\d+/);
    await expect(page.getByText('Transaction Details')).toBeVisible();
    await expect(page.getByText('Status: Pending')).toBeVisible();
    
    // Check transaction appears in history
    await page.goto('/transactions');
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('ZAR 1,000')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
  });

  test('should cancel pending transaction', async ({ page }) => {
    await page.goto('/transactions');
    
    // Find a pending transaction
    const firstTransaction = page.locator('[data-testid="transaction-row"]').first();
    await firstTransaction.getByRole('button', { name: 'View' }).click();
    
    // Cancel transaction if it's pending
    const cancelButton = page.getByRole('button', { name: 'Cancel Transaction' });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.getByRole('button', { name: 'Confirm Cancellation' }).click();
      
      await expect(page.getByText('Transaction cancelled')).toBeVisible();
      await expect(page.getByText('Status: Cancelled')).toBeVisible();
    }
  });

  test('should filter transactions by status', async ({ page }) => {
    await page.goto('/transactions');
    
    // Filter by completed transactions
    await page.getByRole('combobox', { name: 'Filter by status' }).click();
    await page.getByRole('option', { name: 'Completed' }).click();
    
    // All visible transactions should be completed
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows.first().getByText('Completed')).toBeVisible();
  });

  test('should search transactions', async ({ page }) => {
    await page.goto('/transactions');
    
    await page.getByPlaceholder('Search transactions...').fill('Test User');
    
    // Should show only transactions matching search
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await page.goto('/send');
    
    // Use invalid card details or simulate payment failure
    await page.getByPlaceholder('Recipient Name').fill('Test User');
    await page.getByPlaceholder('Phone Number').fill('+263771234567');
    await page.getByPlaceholder('Amount in ZAR').fill('1000');
    await page.getByRole('combobox', { name: 'Payout Method' }).click();
    await page.getByRole('option', { name: 'EcoCash' }).click();
    await page.getByRole('button', { name: 'Send Money' }).click();
    
    // Enter invalid payment details
    await page.getByPlaceholder('Card Number').fill('4000000000000002'); // Declined card
    await page.getByPlaceholder('MM/YY').fill('12/25');
    await page.getByPlaceholder('CVC').fill('123');
    await page.getByRole('button', { name: 'Pay Now' }).click();
    
    // Should show error message
    await expect(page.getByText('Payment failed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('should show transaction receipt', async ({ page }) => {
    await page.goto('/transactions');
    
    // Open a completed transaction
    const completedTransaction = page.locator('[data-testid="transaction-row"]')
      .filter({ hasText: 'Completed' }).first();
    await completedTransaction.getByRole('button', { name: 'View' }).click();
    
    // Download receipt
    await page.getByRole('button', { name: 'Download Receipt' }).click();
    
    // Should download PDF receipt
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/);
  });
});