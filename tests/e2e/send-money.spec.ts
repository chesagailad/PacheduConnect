/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: send-money.spec - handles backend functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Send Money Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('@send Complete send money flow', async ({ page }) => {
    // Step 1: Click "Send Money" from dashboard
    await page.click('text=Send Money');
    await expect(page).toHaveURL(/.*send-money/);
    
    // Step 2: Select sending and receiving countries
    await page.click('select[name="fromCountry"]');
    await page.selectOption('select[name="fromCountry"]', 'ZA');
    
    await page.click('select[name="toCountry"]');
    await page.selectOption('select[name="toCountry"]', 'ZW');
    
    // Step 3: Input amount
    await page.fill('input[name="amount"]', '1000');
    
    // Step 4: Validate real-time exchange rate and fees
    await expect(page.locator('text=Exchange Rate')).toBeVisible();
    await expect(page.locator('text=Transfer Fee')).toBeVisible();
    await expect(page.locator('text=Total Cost')).toBeVisible();
    
    // Verify calculations are displayed
    const exchangeRate = await page.locator('[data-testid="exchange-rate"]').textContent();
    expect(exchangeRate).toMatch(/\d+\.\d+/);
    
    const transferFee = await page.locator('[data-testid="transfer-fee"]').textContent();
    expect(transferFee).toMatch(/R\d+/);
    
    const totalCost = await page.locator('[data-testid="total-cost"]').textContent();
    expect(totalCost).toMatch(/R\d+/);
    
    // Step 5: Add recipient information
    await page.click('text=Add New Recipient');
    
    const recipient = {
      name: 'John Doe',
      phone: '+263771234567',
      bankAccount: '1234567890',
      bankName: 'CBZ Bank'
    };
    
    await page.fill('input[name="recipientName"]', recipient.name);
    await page.fill('input[name="recipientPhone"]', recipient.phone);
    await page.fill('input[name="bankAccount"]', recipient.bankAccount);
    await page.fill('input[name="bankName"]', recipient.bankName);
    
    await page.click('button:has-text("Save Recipient")');
    
    // Step 6: Confirm transaction details
    await expect(page.locator('text=Transaction Summary')).toBeVisible();
    await expect(page.locator(`text=${recipient.name}`)).toBeVisible();
    await expect(page.locator('text=R1000')).toBeVisible();
    
    // Step 7: Submit transaction
    await page.click('button:has-text("Confirm & Send")');
    
    // Step 8: Verify confirmation page
    await expect(page).toHaveURL(/.*success/);
    await expect(page.locator('text=Transaction Successful')).toBeVisible();
    
    // Step 9: Verify transaction receipt
    const transactionId = await page.locator('[data-testid="transaction-id"]').textContent();
    expect(transactionId).toMatch(/TXN\d+/);
    
    await expect(page.locator('text=Transaction ID')).toBeVisible();
    await expect(page.locator('text=Amount Sent')).toBeVisible();
    await expect(page.locator('text=Recipient')).toBeVisible();
    await expect(page.locator('text=Estimated Delivery')).toBeVisible();
  });

  test('@send Currency converter validation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test different currency combinations
    const testCases = [
      { from: 'ZA', to: 'ZW', amount: '1000', expectedCurrency: 'USD' },
      { from: 'ZA', to: 'MW', amount: '500', expectedCurrency: 'MWK' },
      { from: 'ZA', to: 'ZM', amount: '750', expectedCurrency: 'ZMW' }
    ];
    
    for (const testCase of testCases) {
      await page.click('text=Send Money');
      
      await page.selectOption('select[name="fromCountry"]', testCase.from);
      await page.selectOption('select[name="toCountry"]', testCase.to);
      await page.fill('input[name="amount"]', testCase.amount);
      
      // Wait for exchange rate to load
      await page.waitForSelector('[data-testid="exchange-rate"]');
      
      // Verify exchange rate is displayed
      const exchangeRate = await page.locator('[data-testid="exchange-rate"]').textContent();
      expect(exchangeRate).toMatch(/\d+\.\d+/);
      
      // Verify converted amount
      const convertedAmount = await page.locator('[data-testid="converted-amount"]').textContent();
      expect(convertedAmount).toContain(testCase.expectedCurrency);
    }
  });

  test('@send Fee breakdown validation', async ({ page }) => {
    await page.goto('/send-money');
    
    await page.selectOption('select[name="fromCountry"]', 'ZA');
    await page.selectOption('select[name="toCountry"]', 'ZW');
    await page.fill('input[name="amount"]', '1000');
    
    // Verify fee breakdown is displayed
    await expect(page.locator('text=Transfer Fee')).toBeVisible();
    await expect(page.locator('text=Exchange Fee')).toBeVisible();
    await expect(page.locator('text=Total Fees')).toBeVisible();
    await expect(page.locator('text=Net Amount')).toBeVisible();
    
    // Verify fee calculations
    const transferFee = await page.locator('[data-testid="transfer-fee"]').textContent();
    const exchangeFee = await page.locator('[data-testid="exchange-fee"]').textContent();
    const totalFees = await page.locator('[data-testid="total-fees"]').textContent();
    const netAmount = await page.locator('[data-testid="net-amount"]').textContent();
    
    expect(transferFee).toMatch(/R\d+/);
    expect(exchangeFee).toMatch(/R\d+/);
    expect(totalFees).toMatch(/R\d+/);
    expect(netAmount).toMatch(/R\d+/);
  });

  test('@send Recipient management', async ({ page }) => {
    await page.goto('/send-money');
    
    // Add first recipient
    await page.click('text=Add New Recipient');
    
    const recipient1 = {
      name: 'Alice Smith',
      phone: '+263771234567',
      bankAccount: '1234567890',
      bankName: 'CBZ Bank'
    };
    
    await page.fill('input[name="recipientName"]', recipient1.name);
    await page.fill('input[name="recipientPhone"]', recipient1.phone);
    await page.fill('input[name="bankAccount"]', recipient1.bankAccount);
    await page.fill('input[name="bankName"]', recipient1.bankName);
    await page.click('button:has-text("Save Recipient")');
    
    // Add second recipient
    await page.click('text=Add New Recipient');
    
    const recipient2 = {
      name: 'Bob Johnson',
      phone: '+263772345678',
      bankAccount: '0987654321',
      bankName: 'Stanbic Bank'
    };
    
    await page.fill('input[name="recipientName"]', recipient2.name);
    await page.fill('input[name="recipientPhone"]', recipient2.phone);
    await page.fill('input[name="bankAccount"]', recipient2.bankAccount);
    await page.fill('input[name="bankName"]', recipient2.bankName);
    await page.click('button:has-text("Save Recipient")');
    
    // Verify recipients are saved
    await expect(page.locator(`text=${recipient1.name}`)).toBeVisible();
    await expect(page.locator(`text=${recipient2.name}`)).toBeVisible();
    
    // Select existing recipient
    await page.click(`text=${recipient1.name}`);
    await expect(page.locator('text=Selected Recipient')).toBeVisible();
  });

  test('@send Transaction limits validation', async ({ page }) => {
    await page.goto('/send-money');
    
    // Test amount below minimum
    await page.fill('input[name="amount"]', '50');
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('text=Minimum amount is R100')).toBeVisible();
    
    // Test amount above maximum
    await page.fill('input[name="amount"]', '50000');
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('text=Maximum amount is R25000')).toBeVisible();
    
    // Test valid amount
    await page.fill('input[name="amount"]', '1000');
    await page.click('button:has-text("Continue")');
    
    await expect(page).toHaveURL(/.*recipient/);
  });

  test('@send Network error handling', async ({ page }) => {
    await page.goto('/send-money');
    
    // Fill form
    await page.selectOption('select[name="fromCountry"]', 'ZA');
    await page.selectOption('select[name="toCountry"]', 'ZW');
    await page.fill('input[name="amount"]', '1000');
    
    // Simulate network error
    await page.route('**/api/transactions/convert-currency', route => {
      route.fulfill({ status: 500, body: '{"error": "Server error"}' });
    });
    
    await page.click('button:has-text("Continue")');
    
    // Should show error message
    await expect(page.locator('text=Network error')).toBeVisible();
    await expect(page.locator('text=Please try again')).toBeVisible();
    
    // Restore network
    await page.unroute('**/api/transactions/convert-currency');
    
    // Should work again
    await page.click('button:has-text("Continue")');
    await expect(page).toHaveURL(/.*recipient/);
  });
}); 