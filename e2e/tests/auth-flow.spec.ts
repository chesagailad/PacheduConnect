import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form by default', async ({ page }) => {
    await page.goto('/auth');
    
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for validation error messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByPlaceholder('Email').fill('invalid-email');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to register mode
    await page.getByText('Sign Up').click();
    
    // Fill registration form
    await page.getByPlaceholder('Full Name').fill('Test User');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Phone Number').fill('+27123456789');
    await page.getByPlaceholder('Password').fill('Password123!');
    await page.getByPlaceholder('Confirm Password').fill('Password123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/\/dashboard|\/verify/);
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByText('Sign Up').click();
    
    await page.getByPlaceholder('Full Name').fill('Test User');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Phone Number').fill('+27123456789');
    await page.getByPlaceholder('Password').fill('Password123!');
    await page.getByPlaceholder('Confirm Password').fill('DifferentPassword');
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth');
    
    await page.getByText('Forgot Password?').click();
    
    await expect(page.getByText('Reset Password')).toBeVisible();
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    
    await expect(page.getByText('Password reset link sent')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth');
    
    const passwordInput = page.getByPlaceholder('Password');
    const toggleButton = page.getByRole('button', { name: 'Toggle password visibility' });
    
    await passwordInput.fill('password123');
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should redirect authenticated user from auth page', async ({ page }) => {
    // First login
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Try to visit auth page again
    await page.goto('/auth');
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});