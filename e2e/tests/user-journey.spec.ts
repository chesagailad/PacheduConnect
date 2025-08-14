import { test, expect } from '@playwright/test';

test.describe('PacheduConnect User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test.describe('Complete User Registration Journey', () => {
    test('Should complete full user registration and KYC process', async ({ page }) => {
      // Step 1: Navigate to registration page
      await page.click('text=Sign Up');
      await expect(page).toHaveURL(/.*\/auth/);

      // Step 2: Fill registration form
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="phone-input"]', '+27123456789');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');

      // Step 3: Submit registration
      await page.click('[data-testid="register-button"]');
      
      // Step 4: Verify successful registration
      await expect(page.locator('text=Registration successful')).toBeVisible();
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Step 5: Navigate to KYC
      await page.click('text=KYC Verification');
      await expect(page).toHaveURL(/.*\/kyc/);

      // Step 6: Upload required documents
      await page.setInputFiles('[data-testid="id-document-input"]', 'tests/fixtures/clear-id.jpg');
      await page.setInputFiles('[data-testid="selfie-input"]', 'tests/fixtures/clear-id.jpg');
      
      // Step 7: Fill personal information
      await page.fill('[data-testid="full-name-input"]', 'John Doe');
      await page.fill('[data-testid="dob-input"]', '1990-01-01');
      await page.fill('[data-testid="address-input"]', '123 Test Street, Johannesburg');
      await page.fill('[data-testid="phone-input"]', '+27123456789');

      // Step 8: Submit KYC application
      await page.click('[data-testid="submit-kyc-button"]');
      
      // Step 9: Verify KYC submission
      await expect(page.locator('text=KYC application submitted')).toBeVisible();
    });

    test('Should handle registration validation errors', async ({ page }) => {
      await page.click('text=Sign Up');
      
      // Test invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=Please enter a valid email')).toBeVisible();

      // Test weak password
      await page.fill('[data-testid="password-input"]', 'weak');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();

      // Test phone number validation
      await page.fill('[data-testid="phone-input"]', 'invalid-phone');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=Please enter a valid phone number')).toBeVisible();
    });
  });

  test.describe('Money Transfer Journey', () => {
    test('Should complete money transfer process', async ({ page }) => {
      // Step 1: Login
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Step 2: Navigate to send money
      await page.click('text=Send Money');
      await expect(page).toHaveURL(/.*\/send-money/);

      // Step 3: Fill transfer details
      await page.fill('[data-testid="recipient-email-input"]', 'recipient@example.com');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.selectOption('[data-testid="currency-select"]', 'USD');
      await page.fill('[data-testid="description-input"]', 'Test transfer');

      // Step 4: Verify recipient
      await page.click('[data-testid="verify-recipient-button"]');
      await expect(page.locator('text=Recipient verified')).toBeVisible();

      // Step 5: Review and confirm
      await expect(page.locator('text=Transfer Fee: $30.00')).toBeVisible();
      await expect(page.locator('text=Total Amount: $1030.00')).toBeVisible();
      
      await page.click('[data-testid="confirm-transfer-button"]');

      // Step 6: Select payment method
      await page.click('[data-testid="stripe-payment-option"]');
      
      // Step 7: Fill payment details
      await page.fill('[data-testid="card-number-input"]', '4242424242424242');
      await page.fill('[data-testid="expiry-month-input"]', '12');
      await page.fill('[data-testid="expiry-year-input"]', '2025');
      await page.fill('[data-testid="cvv-input"]', '123');

      // Step 8: Process payment
      await page.click('[data-testid="pay-button"]');
      
      // Step 9: Verify success
      await expect(page.locator('text=Payment successful')).toBeVisible();
      await expect(page.locator('text=Transaction completed')).toBeVisible();
    });

    test('Should handle insufficient balance', async ({ page }) => {
      // Login
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      // Navigate to send money
      await page.click('text=Send Money');
      
      // Try to send more than balance
      await page.fill('[data-testid="recipient-email-input"]', 'recipient@example.com');
      await page.fill('[data-testid="amount-input"]', '50000');
      await page.click('[data-testid="confirm-transfer-button"]');
      
      await expect(page.locator('text=Insufficient balance')).toBeVisible();
    });

    test('Should handle KYC limit exceeded', async ({ page }) => {
      // Login
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      // Navigate to send money
      await page.click('text=Send Money');
      
      // Try to send more than KYC limit
      await page.fill('[data-testid="recipient-email-input"]', 'recipient@example.com');
      await page.fill('[data-testid="amount-input"]', '10000');
      await page.click('[data-testid="confirm-transfer-button"]');
      
      await expect(page.locator('text=KYC limit exceeded')).toBeVisible();
    });
  });

  test.describe('Payment Gateway Journey', () => {
    test('Should process Stripe payment successfully', async ({ page }) => {
      // Login and navigate to payment
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await page.click('text=Send Money');
      await page.fill('[data-testid="recipient-email-input"]', 'recipient@example.com');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.click('[data-testid="confirm-transfer-button"]');

      // Select Stripe
      await page.click('[data-testid="stripe-payment-option"]');
      
      // Fill card details
      await page.fill('[data-testid="card-number-input"]', '4242424242424242');
      await page.fill('[data-testid="expiry-month-input"]', '12');
      await page.fill('[data-testid="expiry-year-input"]', '2025');
      await page.fill('[data-testid="cvv-input"]', '123');
      
      // Process payment
      await page.click('[data-testid="pay-button"]');
      
      // Verify success
      await expect(page.locator('text=Payment successful')).toBeVisible();
      await expect(page.locator('text=Transaction ID:')).toBeVisible();
    });

    test('Should handle declined card', async ({ page }) => {
      // Login and navigate to payment
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await page.click('text=Send Money');
      await page.fill('[data-testid="recipient-email-input"]', 'recipient@example.com');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.click('[data-testid="confirm-transfer-button"]');

      // Select Stripe
      await page.click('[data-testid="stripe-payment-option"]');
      
      // Use declined card
      await page.fill('[data-testid="card-number-input"]', '4000000000000002');
      await page.fill('[data-testid="expiry-month-input"]', '12');
      await page.fill('[data-testid="expiry-year-input"]', '2025');
      await page.fill('[data-testid="cvv-input"]', '123');
      
      // Process payment
      await page.click('[data-testid="pay-button"]');
      
      // Verify error
      await expect(page.locator('text=Card declined')).toBeVisible();
    });

    test('Should process Ozow EFT payment', async ({ page }) => {
      // Login and navigate to payment
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await page.click('text=Send Money');
      await page.fill('[data-testid="recipient-email-input"]', 'recipient@example.com');
      await page.fill('[data-testid="amount-input"]', '1000');
      await page.click('[data-testid="confirm-transfer-button"]');

      // Select Ozow
      await page.click('[data-testid="ozow-payment-option"]');
      
      // Fill bank details
      await page.fill('[data-testid="bank-account-input"]', '1234567890');
      await page.fill('[data-testid="bank-code-input"]', '123456');
      
      // Process payment
      await page.click('[data-testid="pay-button"]');
      
      // Verify success
      await expect(page.locator('text=Payment successful')).toBeVisible();
    });
  });

  test.describe('Chatbot Integration Journey', () => {
    test('Should interact with chatbot for support', async ({ page }) => {
      // Login
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      // Open chatbot
      await page.click('[data-testid="chat-toggle"]');
      await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();

      // Send message
      await page.fill('[data-testid="chat-input"]', 'How do I send money?');
      await page.click('[data-testid="send-button"]');
      
      // Verify response
      await expect(page.locator('text=To send money')).toBeVisible();
      await expect(page.locator('text=recipient email')).toBeVisible();

      // Ask about fees
      await page.fill('[data-testid="chat-input"]', 'What are the fees?');
      await page.click('[data-testid="send-button"]');
      
      await expect(page.locator('text=3% transfer fee')).toBeVisible();
    });

    test('Should get exchange rate information from chatbot', async ({ page }) => {
      // Login
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      // Open chatbot
      await page.click('[data-testid="chat-toggle"]');

      // Ask about exchange rates
      await page.fill('[data-testid="chat-input"]', 'What is the exchange rate for ZAR to USD?');
      await page.click('[data-testid="send-button"]');
      
      await expect(page.locator('text=exchange rate')).toBeVisible();
      await expect(page.locator('text=ZAR')).toBeVisible();
      await expect(page.locator('text=USD')).toBeVisible();
    });

    test('Should get KYC assistance from chatbot', async ({ page }) => {
      // Login
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      // Open chatbot
      await page.click('[data-testid="chat-toggle"]');

      // Ask about KYC
      await page.fill('[data-testid="chat-input"]', 'I need help with KYC verification');
      await page.click('[data-testid="send-button"]');
      
      await expect(page.locator('text=KYC')).toBeVisible();
      await expect(page.locator('text=documents')).toBeVisible();
      await expect(page.locator('text=verification')).toBeVisible();
    });
  });

  test.describe('Error Handling Journey', () => {
    test('Should handle network errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/**', route => route.abort());
      
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('text=Network error occurred')).toBeVisible();
    });

    test('Should handle server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/**', route => 
        route.fulfill({ status: 500, body: '{"error": "Internal server error"}' })
      );
      
      await page.click('text=Sign In');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('text=Internal server error')).toBeVisible();
    });

    test('Should handle validation errors', async ({ page }) => {
      await page.click('text=Sign Up');
      
      // Submit empty form
      await page.click('[data-testid="register-button"]');
      
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness Journey', () => {
    test('Should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('http://localhost:3000');
      
      // Verify mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test mobile navigation
      await page.click('text=Sign In');
      await expect(page).toHaveURL(/.*\/auth/);
      
      // Test mobile form
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');
      
      await expect(page).toHaveURL(/.*\/dashboard/);
    });
  });

  test.describe('Accessibility Journey', () => {
    test('Should be accessible with keyboard navigation', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Navigate with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should activate first focusable element
      
      // Navigate to sign up
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      await expect(page).toHaveURL(/.*\/auth/);
    });

    test('Should have proper ARIA labels', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Check for ARIA labels
      const inputs = await page.locator('input[aria-label]').count();
      expect(inputs).toBeGreaterThan(0);
      
      // Check for ARIA descriptions
      const describedElements = await page.locator('[aria-describedby]').count();
      expect(describedElements).toBeGreaterThan(0);
    });
  });
}); 