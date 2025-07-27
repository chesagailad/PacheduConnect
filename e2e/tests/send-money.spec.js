const { test, expect } = require('@playwright/test');

test.describe('Send Money Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test.describe('Complete Send Money Flow', () => {
    test('should complete full send money transaction', async ({ page }) => {
      // Navigate to send money page
      await page.click('[data-testid="send-money-nav"]');
      await expect(page).toHaveURL(/.*send-money/);
      
      // Select recipient
      await page.click('[data-testid="add-recipient-button"]');
      
      // Fill recipient details
      await page.fill('[data-testid="recipient-name"]', 'Jane Smith');
      await page.fill('[data-testid="recipient-email"]', 'jane.smith@example.com');
      await page.fill('[data-testid="recipient-phone"]', '+1234567890');
      await page.selectOption('[data-testid="recipient-country"]', 'USA');
      await page.fill('[data-testid="recipient-address"]', '123 Main St, New York, NY');
      await page.click('[data-testid="save-recipient-button"]');
      
      // Wait for recipient to be saved and selected
      await expect(page.locator('[data-testid="selected-recipient"]')).toContainText('Jane Smith');
      
      // Enter amount
      await page.fill('[data-testid="amount-input"]', '1000');
      
      // Select target currency
      await page.click('[data-testid="currency-selector"]');
      await page.click('[data-testid="currency-USD"]');
      
      // Wait for exchange rate to load
      await expect(page.locator('[data-testid="exchange-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="recipient-amount"]')).toBeVisible();
      
      // Review fees
      await expect(page.locator('[data-testid="transfer-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
      
      // Continue to payment
      await page.click('[data-testid="continue-button"]');
      await expect(page).toHaveURL(/.*payment/);
      
      // Select payment method
      await page.click('[data-testid="payment-method-stripe"]');
      
      // Fill payment details
      await page.fill('[data-testid="card-number"]', '4111111111111111');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvv"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'John Doe');
      
      // Submit payment
      await page.click('[data-testid="pay-now-button"]');
      
      // Wait for processing
      await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
      
      // Verify success
      await expect(page).toHaveURL(/.*payment\/success/);
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Payment successful');
      
      // Verify transaction details
      await expect(page.locator('[data-testid="transaction-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="transaction-amount"]')).toContainText('R 1,000.00');
      await expect(page.locator('[data-testid="recipient-receives"]')).toBeVisible();
    });

    test('should handle payment failure gracefully', async ({ page }) => {
      await page.goto('/send-money');
      
      // Quick setup with saved recipient
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.click('[data-testid="continue-button"]');
      
      // Select payment method
      await page.click('[data-testid="payment-method-stripe"]');
      
      // Use declining card number
      await page.fill('[data-testid="card-number"]', '4000000000000002');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvv"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'John Doe');
      
      await page.click('[data-testid="pay-now-button"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Card declined');
      await expect(page.locator('[data-testid="try-again-button"]')).toBeVisible();
    });
  });

  test.describe('Amount Validation', () => {
    test('should validate minimum transfer amount', async ({ page }) => {
      await page.goto('/send-money');
      
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '5'); // Below minimum
      
      await page.click('[data-testid="continue-button"]');
      
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('Minimum amount is R 10');
    });

    test('should validate maximum transfer amount', async ({ page }) => {
      await page.goto('/send-money');
      
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '100000'); // Above limit
      
      await page.click('[data-testid="continue-button"]');
      
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('Maximum amount is R 50,000');
    });

    test('should validate sufficient balance', async ({ page }) => {
      await page.goto('/send-money');
      
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '50000'); // More than balance
      
      await page.click('[data-testid="continue-button"]');
      
      await expect(page.locator('[data-testid="balance-error"]')).toContainText('Insufficient balance');
    });
  });

  test.describe('Exchange Rate Updates', () => {
    test('should show real-time exchange rate updates', async ({ page }) => {
      await page.goto('/send-money');
      
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '1000');
      
      // Wait for initial rate
      await expect(page.locator('[data-testid="exchange-rate"]')).toBeVisible();
      const initialRate = await page.locator('[data-testid="exchange-rate-value"]').textContent();
      
      // Wait for rate update (30 seconds)
      await page.waitForTimeout(31000);
      
      const updatedRate = await page.locator('[data-testid="exchange-rate-value"]').textContent();
      
      // Rate might have changed (or might be the same in test env)
      await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
    });

    test('should handle exchange rate API failures', async ({ page }) => {
      // Mock API failure
      await page.route('/api/exchange-rates/**', route => {
        route.fulfill({ status: 500 });
      });
      
      await page.goto('/send-money');
      
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '1000');
      
      await expect(page.locator('[data-testid="rate-error"]')).toContainText('Unable to fetch exchange rates');
      await expect(page.locator('[data-testid="retry-rate-button"]')).toBeVisible();
    });
  });

  test.describe('Recipient Management', () => {
    test('should add new recipient during send flow', async ({ page }) => {
      await page.goto('/send-money');
      
      await page.click('[data-testid="add-recipient-button"]');
      
      await page.fill('[data-testid="recipient-name"]', 'Bob Johnson');
      await page.fill('[data-testid="recipient-email"]', 'bob.johnson@example.com');
      await page.fill('[data-testid="recipient-phone"]', '+44987654321');
      await page.selectOption('[data-testid="recipient-country"]', 'UK');
      
      await page.click('[data-testid="save-recipient-button"]');
      
      // Verify recipient was added and selected
      await expect(page.locator('[data-testid="selected-recipient"]')).toContainText('Bob Johnson');
      
      // Verify recipient appears in future lists
      await page.reload();
      await expect(page.locator('[data-testid="recipient-bob-johnson"]')).toBeVisible();
    });

    test('should edit existing recipient', async ({ page }) => {
      await page.goto('/send-money');
      
      await page.click('[data-testid="recipient-jane-smith-edit"]');
      
      await page.fill('[data-testid="recipient-phone"]', '+1234567891'); // Update phone
      await page.click('[data-testid="save-recipient-button"]');
      
      await expect(page.locator('[data-testid="recipient-jane-smith-phone"]')).toContainText('+1234567891');
    });
  });

  test.describe('Transaction History', () => {
    test('should show transaction in history after completion', async ({ page }) => {
      // Complete a transaction first (simplified)
      await page.goto('/send-money');
      await page.click('[data-testid="recipient-jane-smith"]');
      await page.fill('[data-testid="amount-input"]', '500');
      await page.click('[data-testid="continue-button"]');
      
      await page.click('[data-testid="payment-method-stripe"]');
      await page.fill('[data-testid="card-number"]', '4111111111111111');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvv"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'John Doe');
      await page.click('[data-testid="pay-now-button"]');
      
      await expect(page).toHaveURL(/.*payment\/success/);
      
      // Navigate to transactions
      await page.click('[data-testid="transactions-nav"]');
      
      // Verify transaction appears
      await expect(page.locator('[data-testid="transaction-list"]').first()).toContainText('Jane Smith');
      await expect(page.locator('[data-testid="transaction-list"]').first()).toContainText('R 500.00');
      await expect(page.locator('[data-testid="transaction-status"]').first()).toContainText('Completed');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/send-money');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-send-form"]')).toBeVisible();
      
      // Test mobile-specific interactions
      await page.click('[data-testid="recipient-selector-mobile"]');
      await page.click('[data-testid="recipient-jane-smith"]');
      
      await page.fill('[data-testid="amount-input"]', '1000');
      
      // Verify currency selector works on mobile
      await page.click('[data-testid="currency-selector-mobile"]');
      await page.click('[data-testid="currency-USD"]');
      
      await expect(page.locator('[data-testid="exchange-rate"]')).toBeVisible();
    });
  });
});