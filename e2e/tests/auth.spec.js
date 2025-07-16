const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test database state
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      await page.goto('/auth');
      
      // Click register tab
      await page.click('[data-testid="register-tab"]');
      
      // Fill registration form
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="phone-input"]', '+27123456789');
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!');
      
      // Submit registration
      await page.click('[data-testid="register-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
      
      // Verify redirection to verification page
      await expect(page).toHaveURL(/.*verify-phone/);
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      await page.goto('/auth');
      await page.click('[data-testid="register-tab"]');
      
      // Submit empty form
      await page.click('[data-testid="register-button"]');
      
      // Check validation messages
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should prevent registration with existing email', async ({ page }) => {
      await page.goto('/auth');
      await page.click('[data-testid="register-tab"]');
      
      // Fill form with existing user email
      await page.fill('[data-testid="name-input"]', 'Jane Smith');
      await page.fill('[data-testid="email-input"]', 'existing@example.com');
      await page.fill('[data-testid="phone-input"]', '+27987654321');
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!');
      
      await page.click('[data-testid="register-button"]');
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already exists');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/auth');
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      
      // Verify redirection to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toContainText('John Doe');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth');
      
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
      
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('should handle rate limiting', async ({ page }) => {
      await page.goto('/auth');
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        
        if (i < 5) {
          await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        }
      }
      
      // Should show rate limit message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Too many attempts');
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset flow', async ({ page }) => {
      await page.goto('/auth');
      
      await page.click('[data-testid="forgot-password-link"]');
      
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.click('[data-testid="reset-password-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent');
    });

    test('should show error for non-existent email', async ({ page }) => {
      await page.goto('/auth');
      
      await page.click('[data-testid="forgot-password-link"]');
      
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.click('[data-testid="reset-password-button"]');
      
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email not found');
    });
  });

  test.describe('Phone Verification', () => {
    test('should verify phone number with OTP', async ({ page, context }) => {
      // Login first
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to phone verification
      await page.goto('/verify-phone');
      
      await page.fill('[data-testid="phone-input"]', '+27123456789');
      await page.click('[data-testid="send-otp-button"]');
      
      await expect(page.locator('[data-testid="otp-sent-message"]')).toBeVisible();
      
      // Enter OTP (in real test, you'd get this from SMS service mock)
      await page.fill('[data-testid="otp-input"]', '123456');
      await page.click('[data-testid="verify-otp-button"]');
      
      await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout user successfully', async ({ page }) => {
      // Login first
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
      await page.click('[data-testid="login-button"]');
      
      // Wait for dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      // Verify redirection to auth page
      await expect(page).toHaveURL(/.*auth/);
      
      // Verify user menu is not visible
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    });
  });
});