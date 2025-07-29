/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: login-biometric.spec - handles backend functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Login and Biometric Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('@login Successful login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Verify user is logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('@login Login validation errors', async ({ page }) => {
    // Test empty form
    await page.click('button[type="submit"]');
    await expect(page.locator('text=required')).toBeVisible();
    
    // Test invalid credentials
    await page.fill('input[placeholder*="email"]', 'invalid@example.com');
    await page.fill('input[placeholder*="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('@login Password reset flow', async ({ page }) => {
    // Click forgot password
    await page.click('text=Forgot Password');
    
    // Fill email for password reset
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Verify OTP sent message
    await expect(page.locator('text=OTP sent')).toBeVisible();
    
    // Enter OTP
    await page.fill('input[placeholder*="OTP"]', '123456');
    await page.fill('input[placeholder*="new password"]', 'NewPassword123!');
    await page.fill('input[placeholder*="confirm"]', 'NewPassword123!');
    await page.click('button:has-text("Reset Password")');
    
    // Should show success message
    await expect(page.locator('text=Password reset successfully')).toBeVisible();
  });

  test('@login Biometric authentication prompt', async ({ page, context }) => {
    // Mock biometric API
    await context.addInitScript(() => {
      window.navigator.credentials = {
        get: async () => ({
          id: 'mock-biometric-id',
          type: 'public-key'
        })
      };
    });
    
    // Login first
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to settings or profile
    await page.goto('/profile');
    
    // Enable biometric login
    await page.click('text=Biometric Login');
    await page.click('input[type="checkbox"]');
    
    // Should show biometric setup prompt
    await expect(page.locator('text=Set up biometric login')).toBeVisible();
    
    // Simulate biometric enrollment
    await page.click('button:has-text("Enroll")');
    
    // Should show success message
    await expect(page.locator('text=Biometric login enabled')).toBeVisible();
  });

  test('@login Biometric login flow', async ({ page, context }) => {
    // Mock biometric authentication
    await context.addInitScript(() => {
      window.navigator.credentials = {
        get: async () => ({
          id: 'mock-biometric-id',
          type: 'public-key'
        })
      };
    });
    
    // Navigate to login page
    await page.goto('/auth');
    
    // Should show biometric login option
    await expect(page.locator('text=Login with biometrics')).toBeVisible();
    
    // Click biometric login
    await page.click('button:has-text("Login with biometrics")');
    
    // Should show biometric prompt
    await expect(page.locator('text=Touch your fingerprint sensor')).toBeVisible();
    
    // Simulate successful biometric authentication
    await page.waitForTimeout(1000);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('@login Session management', async ({ page }) => {
    // Login first
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify session is active
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Logout
    await page.click('text=Logout');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*auth/);
  });

  test('@login Offline login handling', async ({ page }) => {
    // Go offline
    await page.route('**/*', route => route.abort());
    
    // Try to login
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show offline message
    await expect(page.locator('text=No internet connection')).toBeVisible();
    
    // Go back online
    await page.unroute('**/*');
    
    // Should be able to login again
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });
}); 