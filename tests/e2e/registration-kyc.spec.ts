import { test, expect } from '@playwright/test';

test.describe('Registration & KYC Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/PacheduConnect/);
  });

  test('@registration Complete registration and KYC flow', async ({ page }) => {
    // Step 1: Visit homepage and click "Get Started"
    await expect(page.locator('h1')).toContainText('Send Money');
    await expect(page.locator('button')).toContainText('Get Started');
    
    // Click Get Started button
    await page.click('button:has-text("Get Started")');
    
    // Should navigate to auth page
    await expect(page).toHaveURL(/.*auth/);
    
    // Step 2: Switch to registration form
    await page.click('text=Create Account');
    await expect(page.locator('form')).toBeVisible();
    
    // Step 3: Fill registration form
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: '+27831234567',
      password: 'TestPassword123!'
    };
    
    // Fill form fields
    await page.fill('input[placeholder*="full name"]', testUser.name);
    await page.fill('input[placeholder*="email"]', testUser.email);
    await page.fill('input[placeholder*="phone"]', testUser.phone);
    await page.fill('input[type="password"]', testUser.password);
    await page.fill('input[placeholder*="confirm"]', testUser.password);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Step 4: Verify OTP sent message
    await expect(page.locator('text=OTP sent')).toBeVisible();
    
    // Step 5: Enter OTP (simulate)
    await page.fill('input[placeholder*="OTP"]', '123456');
    await page.click('button:has-text("Verify")');
    
    // Step 6: Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Step 7: Navigate to KYC section
    await page.click('text=KYC');
    await expect(page.locator('text=KYC Verification')).toBeVisible();
    
    // Step 8: Upload ID document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-id.jpg');
    
    // Step 9: Fill address information
    await page.fill('input[name="homeAddress"]', '123 Test Street, Johannesburg, South Africa');
    
    // Step 10: Submit KYC
    await page.click('button:has-text("Submit")');
    
    // Step 11: Verify KYC submission confirmation
    await expect(page.locator('text=Documents uploaded successfully')).toBeVisible();
    await expect(page.locator('text=pending')).toBeVisible();
  });

  test('@registration Registration form validation', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    await page.click('text=Create Account');
    
    // Test required field validation
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[placeholder*="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=valid email')).toBeVisible();
    
    // Test password mismatch
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.fill('input[placeholder*="confirm"]', 'different');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=match')).toBeVisible();
  });

  test('@registration KYC document upload validation', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to KYC
    await page.goto('/profile');
    await page.click('text=KYC');
    
    // Test invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/invalid.txt');
    
    // Should show error for invalid file type
    await expect(page.locator('text=Only image and PDF files')).toBeVisible();
    
    // Test file size limit
    await fileInput.setInputFiles('tests/fixtures/large-file.jpg');
    await expect(page.locator('text=File too large')).toBeVisible();
  });

  test('@registration Real-time KYC feedback', async ({ page }) => {
    // Login and navigate to KYC
    await page.goto('/auth');
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/profile');
    await page.click('text=KYC');
    
    // Upload blurry image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/blurry-id.jpg');
    
    // Should show blurry image warning
    await expect(page.locator('text=Image is too blurry')).toBeVisible();
    
    // Upload clear image
    await fileInput.setInputFiles('tests/fixtures/clear-id.jpg');
    await expect(page.locator('text=Image quality is good')).toBeVisible();
  });
}); 