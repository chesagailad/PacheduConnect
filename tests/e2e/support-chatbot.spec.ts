/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: support-chatbot.spec - handles backend functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Support and Chatbot Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('@support Open chatbot widget', async ({ page }) => {
    // Navigate to any page
    await page.goto('/dashboard');
    
    // Look for chatbot widget
    const chatbotButton = page.locator('[data-testid="chatbot-button"]');
    await expect(chatbotButton).toBeVisible();
    
    // Click to open chatbot
    await chatbotButton.click();
    
    // Verify chatbot opens
    await expect(page.locator('[data-testid="chatbot-widget"]')).toBeVisible();
    await expect(page.locator('text=How can I help you?')).toBeVisible();
    
    // Verify input field is present
    await expect(page.locator('[data-testid="chatbot-input"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('@support KYC upload question', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Type KYC upload question
    await page.fill('[data-testid="chatbot-input"]', 'How do I upload my ID?');
    await page.click('button:has-text("Send")');
    
    // Verify response
    await expect(page.locator('text=To upload your ID')).toBeVisible();
    await expect(page.locator('text=Follow these steps')).toBeVisible();
    
    // Verify step-by-step instructions
    await expect(page.locator('text=1. Go to your profile')).toBeVisible();
    await expect(page.locator('text=2. Click on KYC section')).toBeVisible();
    await expect(page.locator('text=3. Upload your ID document')).toBeVisible();
    await expect(page.locator('text=4. Take a selfie with your ID')).toBeVisible();
    await expect(page.locator('text=5. Submit for verification')).toBeVisible();
  });

  test('@support Transaction tracking via chat', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Ask about transaction tracking
    await page.fill('[data-testid="chatbot-input"]', 'Where is my last transaction?');
    await page.click('button:has-text("Send")');
    
    // Verify response
    await expect(page.locator('text=Your last transaction')).toBeVisible();
    
    // Should show transaction details
    await expect(page.locator('text=Transaction ID')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Recipient')).toBeVisible();
  });

  test('@support Exchange rate questions', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Ask about exchange rates
    await page.fill('[data-testid="chatbot-input"]', 'What is the exchange rate for ZAR to USD?');
    await page.click('button:has-text("Send")');
    
    // Verify response
    await expect(page.locator('text=Current exchange rate')).toBeVisible();
    await expect(page.locator('text=ZAR to USD')).toBeVisible();
    
    // Should show current rate
    const rateText = await page.locator('[data-testid="exchange-rate-display"]').textContent();
    expect(rateText).toMatch(/\d+\.\d+/);
  });

  test('@support Fee structure questions', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Ask about fees
    await page.fill('[data-testid="chatbot-input"]', 'What are the transfer fees?');
    await page.click('button:has-text("Send")');
    
    // Verify response
    await expect(page.locator('text=Transfer fees vary')).toBeVisible();
    await expect(page.locator('text=by destination country')).toBeVisible();
    
    // Should show fee breakdown
    await expect(page.locator('text=Zimbabwe')).toBeVisible();
    await expect(page.locator('text=Malawi')).toBeVisible();
    await expect(page.locator('text=Zambia')).toBeVisible();
  });

  test('@support Account limits questions', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Ask about account limits
    await page.fill('[data-testid="chatbot-input"]', 'What are my account limits?');
    await page.click('button:has-text("Send")');
    
    // Verify response
    await expect(page.locator('text=Your account limits')).toBeVisible();
    await expect(page.locator('text=Bronze Level')).toBeVisible();
    await expect(page.locator('text=Monthly Limit')).toBeVisible();
    await expect(page.locator('text=Current Usage')).toBeVisible();
  });

  test('@support Live agent escalation', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Type complex question
    await page.fill('[data-testid="chatbot-input"]', 'I need help with a failed transaction');
    await page.click('button:has-text("Send")');
    
    // Should suggest live agent
    await expect(page.locator('text=I understand your concern')).toBeVisible();
    await expect(page.locator('text=Would you like to speak')).toBeVisible();
    await expect(page.locator('text=with a live agent?')).toBeVisible();
    
    // Click to connect with live agent
    await page.click('button:has-text("Connect to Live Agent")');
    
    // Verify live chat interface
    await expect(page.locator('text=Connecting to agent')).toBeVisible();
    await expect(page.locator('text=Please wait')).toBeVisible();
  });

  test('@support Chatbot language support', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Change language to Shona
    await page.click('[data-testid="language-selector"]');
    await page.selectOption('[data-testid="language-selector"]', 'sn');
    
    // Verify language change
    await expect(page.locator('text=Mhoro! Ndingakubatsirei?')).toBeVisible();
    
    // Ask question in Shona
    await page.fill('[data-testid="chatbot-input"]', 'Ndinokwanisa sei kutumira mari?');
    await page.click('button:has-text("Tumira")');
    
    // Verify response in Shona
    await expect(page.locator('text=Kutumira mari')).toBeVisible();
  });

  test('@support Chatbot conversation history', async ({ page }) => {
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Send multiple messages
    const messages = [
      'How do I upload my ID?',
      'What are the fees?',
      'How long does transfer take?'
    ];
    
    for (const message of messages) {
      await page.fill('[data-testid="chatbot-input"]', message);
      await page.click('button:has-text("Send")');
      await page.waitForTimeout(1000); // Wait for response
    }
    
    // Verify conversation history
    for (const message of messages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }
    
    // Verify chatbot remembers context
    await page.fill('[data-testid="chatbot-input"]', 'What about the previous question?');
    await page.click('button:has-text("Send")');
    
    // Should reference previous conversation
    await expect(page.locator('text=Regarding your earlier question')).toBeVisible();
  });

  test('@support Chatbot offline handling', async ({ page }) => {
    // Go offline
    await page.route('**/*', route => route.abort());
    
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Try to send message
    await page.fill('[data-testid="chatbot-input"]', 'Hello');
    await page.click('button:has-text("Send")');
    
    // Should show offline message
    await expect(page.locator('text=Chatbot is offline')).toBeVisible();
    await expect(page.locator('text=Please try again later')).toBeVisible();
    
    // Go back online
    await page.unroute('**/*');
    
    // Should work again
    await page.fill('[data-testid="chatbot-input"]', 'Hello');
    await page.click('button:has-text("Send")');
    await expect(page.locator('text=Hello! How can I help you?')).toBeVisible();
  });

  test('@support Chatbot voice input', async ({ page }) => {
    // Mock microphone access
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: async () => new MediaStream()
        }
      });
    });
    
    // Open chatbot
    await page.goto('/dashboard');
    await page.click('[data-testid="chatbot-button"]');
    
    // Click voice input button
    await page.click('[data-testid="voice-input-button"]');
    
    // Should show recording indicator
    await expect(page.locator('text=Listening...')).toBeVisible();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    // Simulate voice input
    await page.waitForTimeout(2000);
    
    // Should show transcribed text
    await expect(page.locator('text=How do I send money?')).toBeVisible();
    
    // Should send automatically
    await expect(page.locator('text=To send money')).toBeVisible();
  });
}); 