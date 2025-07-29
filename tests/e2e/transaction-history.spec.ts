/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: transaction-history.spec - handles backend functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Transaction History & Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to transactions page for testing
    await page.goto('/transactions');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('@transactions View transaction history', async ({ page }) => {
    // We're already on the transactions page from beforeEach
    
    // Verify transaction list loads
    await expect(page.locator('text=Transaction History')).toBeVisible();
    await expect(page.locator('text=Recent Transactions')).toBeVisible();
    
    // Verify transaction list structure
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows.first()).toBeVisible();
    
    // Verify transaction details are displayed
    await expect(page.locator('text=Transaction ID')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Recipient')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
  });

  test('@transactions Transaction details view', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Click on first transaction
    await page.click('[data-testid="transaction-row"]:first-child');
    
    // Verify transaction details page
    await expect(page.locator('text=Transaction Details')).toBeVisible();
    
    // Verify all transaction information is displayed
    await expect(page.locator('text=Transaction ID')).toBeVisible();
    await expect(page.locator('text=Amount Sent')).toBeVisible();
    await expect(page.locator('text=Recipient Name')).toBeVisible();
    await expect(page.locator('text=Recipient Phone')).toBeVisible();
    await expect(page.locator('text=Bank Account')).toBeVisible();
    await expect(page.locator('text=Bank Name')).toBeVisible();
    await expect(page.locator('text=Exchange Rate')).toBeVisible();
    await expect(page.locator('text=Transfer Fee')).toBeVisible();
    await expect(page.locator('text=Total Cost')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Created Date')).toBeVisible();
    await expect(page.locator('text=Estimated Delivery')).toBeVisible();
  });

  test('@transactions Transaction status tracking', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Click on a transaction
    await page.click('[data-testid="transaction-row"]:first-child');
    
    // Verify progress timeline is displayed
    await expect(page.locator('text=Transaction Progress')).toBeVisible();
    
    // Verify timeline steps
    const timelineSteps = [
      'Transaction Initiated',
      'Payment Processing',
      'Funds Transferred',
      'Recipient Notified',
      'Transaction Completed'
    ];
    
    for (const step of timelineSteps) {
      await expect(page.locator(`text=${step}`)).toBeVisible();
    }
    
    // Verify current status is highlighted
    await expect(page.locator('[data-testid="current-step"]')).toBeVisible();
  });

  test('@transactions Filter and search transactions', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Test status filter
    await page.click('select[name="status"]');
    await page.selectOption('select[name="status"]', 'completed');
    
    // Verify filtered results
    const completedTransactions = page.locator('[data-testid="transaction-row"]');
    await expect(completedTransactions.first()).toBeVisible();
    
    // Test date range filter
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Verify filtered results
    await expect(page.locator('text=Filtered Results')).toBeVisible();
    
    // Test search functionality
    await page.fill('input[placeholder*="search"]', 'TXN123');
    await page.click('button:has-text("Search")');
    
    // Verify search results
    await expect(page.locator('text=Search Results')).toBeVisible();
  });

  test('@transactions Export transaction history', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Verify export options
    await expect(page.locator('text=Export Format')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
    await expect(page.locator('text=CSV')).toBeVisible();
    await expect(page.locator('text=Excel')).toBeVisible();
    
    // Select PDF format
    await page.click('input[value="pdf"]');
    await page.click('button:has-text("Download")');
    
    // Verify download starts
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('@transactions Transaction receipt generation', async ({ page }) => {
    // Navigate to a specific transaction
    await page.goto('/transactions');
    await page.click('[data-testid="transaction-row"]:first-child');
    
    // Click download receipt
    await page.click('button:has-text("Download Receipt")');
    
    // Verify receipt download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/i);
  });

  test('@transactions Real-time status updates', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Mock real-time updates
    await page.addInitScript(() => {
      // Simulate WebSocket connection for real-time updates
      window.mockWebSocket = {
        send: () => {},
        close: () => {}
      };
    });
    
    // Verify real-time indicator
    await expect(page.locator('text=Live Updates')).toBeVisible();
    
    // Simulate status change
    await page.evaluate(() => {
      // Mock status update
      const event = new CustomEvent('transactionUpdate', {
        detail: { transactionId: 'TXN123', status: 'completed' }
      });
      window.dispatchEvent(event);
    });
    
    // Verify status update is reflected
    await expect(page.locator('text=Status Updated')).toBeVisible();
  });

  test('@transactions Transaction notifications', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Enable notifications for a transaction
    await page.click('[data-testid="transaction-row"]:first-child');
    await page.click('button:has-text("Enable Notifications")');
    
    // Verify notification settings
    await expect(page.locator('text=Notification Settings')).toBeVisible();
    await expect(page.locator('text=Email Notifications')).toBeVisible();
    await expect(page.locator('text=SMS Notifications')).toBeVisible();
    await expect(page.locator('text=Push Notifications')).toBeVisible();
    
    // Enable all notifications
    await page.click('input[name="emailNotifications"]');
    await page.click('input[name="smsNotifications"]');
    await page.click('input[name="pushNotifications"]');
    
    await page.click('button:has-text("Save Settings")');
    
    // Verify settings saved
    await expect(page.locator('text=Notification settings updated')).toBeVisible();
  });

  test('@transactions Offline transaction history', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Go offline
    await page.route('**/*', route => route.abort());
    
    // Should still show cached transactions
    await expect(page.locator('text=Transaction History')).toBeVisible();
    await expect(page.locator('text=Offline Mode')).toBeVisible();
    
    // Go back online
    await page.unroute('**/*');
    
    // Should refresh data
    await page.reload();
    await expect(page.locator('text=Transaction History')).toBeVisible();
  });

  // 1. Pagination & Infinite Scroll Tests
  test('@pagination Pagination functionality', async ({ page }) => {
    await page.goto('/transactions');
    
    // Verify pagination controls are visible
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    
    // Test pagination navigation
    await page.click('button:has-text("Next")');
    await expect(page.locator('[data-testid="page-2"]')).toBeVisible();
    
    await page.click('button:has-text("Previous")');
    await expect(page.locator('[data-testid="page-1"]')).toBeVisible();
    
    // Test page size selector
    await page.selectOption('select[name="pageSize"]', '50');
    await expect(page.locator('text=Showing 1-50 of')).toBeVisible();
  });

  test('@pagination Infinite scroll functionality', async ({ page }) => {
    await page.goto('/transactions');
    
    // Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for new content to load
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' });
    
    // Verify more transactions loaded
    const initialCount = await page.locator('[data-testid="transaction-row"]').count();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    
    const newCount = await page.locator('[data-testid="transaction-row"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
    
    // Test end of list behavior
    await page.evaluate(() => {
      // Mock reaching end of list
      window.dispatchEvent(new CustomEvent('endOfList'));
    });
    
    await expect(page.locator('text=No more transactions')).toBeVisible();
  });

  // 2. Multi-user/Role-based Views Tests
  test('@roles Regular user sees only own transactions', async ({ page }) => {
    // Login as regular user
    await page.goto('/auth');
    await page.fill('input[placeholder*="email"]', 'user@example.com');
    await page.fill('input[placeholder*="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/transactions');
    
    // Verify user sees only their transactions
    await expect(page.locator('text=My Transactions')).toBeVisible();
    
    // Verify no admin controls are visible
    await expect(page.locator('text=All Users')).not.toBeVisible();
    await expect(page.locator('button:has-text("Admin View")')).not.toBeVisible();
  });

  test('@roles Admin sees all users transactions', async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[placeholder*="email"]', 'admin@example.com');
    await page.fill('input[placeholder*="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.goto('/transactions');
    
    // Verify admin controls are visible
    await expect(page.locator('text=All Users Transactions')).toBeVisible();
    await expect(page.locator('select[name="userFilter"]')).toBeVisible();
    
    // Test user filter
    await page.selectOption('select[name="userFilter"]', 'user1@example.com');
    await expect(page.locator('text=Filtered by user1@example.com')).toBeVisible();
    
    // Test bulk actions for admin
    await page.click('input[type="checkbox"]:first-child'); // Select all
    await expect(page.locator('button:has-text("Bulk Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Bulk Notify")')).toBeVisible();
  });

  test('@roles Unauthorized access prevention', async ({ page }) => {
    // Try to access admin endpoint directly
    await page.goto('/api/admin/transactions');
    
    // Should be redirected to login or show error
    await expect(page.locator('text=Unauthorized') || page.locator('text=Login')).toBeVisible();
    
    // Try to access other user's transaction directly
    await page.goto('/transactions/TXN123');
    
    // Should show access denied or redirect
    await expect(page.locator('text=Access Denied') || page.locator('text=Not Found')).toBeVisible();
  });

  // 3. Transaction Dispute/Support Tests
  test('@dispute Open dispute from transaction', async ({ page }) => {
    await page.goto('/transactions');
    await page.click('[data-testid="transaction-row"]:first-child');
    
    // Click dispute button
    await page.click('button:has-text("Report Issue")');
    
    // Verify dispute form
    await expect(page.locator('text=Report Transaction Issue')).toBeVisible();
    await expect(page.locator('select[name="issueType"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    
    // Fill dispute form
    await page.selectOption('select[name="issueType"]', 'transaction_not_received');
    await page.fill('textarea[name="description"]', 'Recipient has not received the funds');
    await page.fill('input[name="contactPhone"]', '+1234567890');
    
    // Submit dispute
    await page.click('button:has-text("Submit Report")');
    
    // Verify dispute submitted
    await expect(page.locator('text=Issue reported successfully')).toBeVisible();
    await expect(page.locator('text=Case ID:')).toBeVisible();
  });

  test('@dispute Track dispute status', async ({ page }) => {
    await page.goto('/transactions');
    await page.click('[data-testid="transaction-row"]:first-child');
    
    // Check if transaction has active dispute
    const disputeStatus = page.locator('[data-testid="dispute-status"]');
    if (await disputeStatus.isVisible()) {
      await expect(disputeStatus).toContainText('Under Review');
      
      // Click to view dispute details
      await page.click('[data-testid="dispute-status"]');
      
      // Verify dispute timeline
      await expect(page.locator('text=Dispute Timeline')).toBeVisible();
      await expect(page.locator('text=Report Submitted')).toBeVisible();
      await expect(page.locator('text=Under Investigation')).toBeVisible();
      await expect(page.locator('text=Resolution')).toBeVisible();
    }
  });

  test('@dispute Support chat integration', async ({ page }) => {
    await page.goto('/transactions');
    await page.click('[data-testid="transaction-row"]:first-child');
    
    // Open support chat
    await page.click('button:has-text("Get Help")');
    
    // Verify chat widget opens
    await expect(page.locator('[data-testid="support-chat"]')).toBeVisible();
    await expect(page.locator('text=How can we help you?')).toBeVisible();
    
    // Send message
    await page.fill('[data-testid="chat-input"]', 'I need help with my transaction');
    await page.click('button:has-text("Send")');
    
    // Verify message sent
    await expect(page.locator('text=I need help with my transaction')).toBeVisible();
  });

  // 4. Bulk Actions Tests
  test('@bulk Bulk transaction selection', async ({ page }) => {
    await page.goto('/transactions');
    
    // Select multiple transactions
    await page.click('input[type="checkbox"]:nth-child(1)');
    await page.click('input[type="checkbox"]:nth-child(2)');
    await page.click('input[type="checkbox"]:nth-child(3)');
    
    // Verify bulk action bar appears
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    await expect(page.locator('text=3 transactions selected')).toBeVisible();
    
    // Test bulk export
    await page.click('button:has-text("Export Selected")');
    await expect(page.locator('text=Export Format')).toBeVisible();
    await page.click('input[value="csv"]');
    await page.click('button:has-text("Download")');
    
    // Verify download starts
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('@bulk Bulk notification settings', async ({ page }) => {
    await page.goto('/transactions');
    
    // Select transactions
    await page.click('input[type="checkbox"]:nth-child(1)');
    await page.click('input[type="checkbox"]:nth-child(2)');
    
    // Open bulk notification settings
    await page.click('button:has-text("Notification Settings")');
    
    // Configure bulk notifications
    await page.click('input[name="bulkEmailNotifications"]');
    await page.click('input[name="bulkSMSNotifications"]');
    await page.selectOption('select[name="notificationFrequency"]', 'immediate');
    
    await page.click('button:has-text("Apply to Selected")');
    
    // Verify settings applied
    await expect(page.locator('text=Notification settings updated for 2 transactions')).toBeVisible();
  });

  // 5. Accessibility (a11y) Tests
  test('@a11y Keyboard navigation', async ({ page }) => {
    await page.goto('/transactions');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Navigate through transaction rows with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Open transaction details
    
    // Verify transaction details opened
    await expect(page.locator('text=Transaction Details')).toBeVisible();
    
    // Test escape key closes modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Transaction Details')).not.toBeVisible();
  });

  test('@a11y Screen reader compatibility', async ({ page }) => {
    await page.goto('/transactions');
    
    // Verify ARIA labels are present
    await expect(page.locator('[aria-label*="transaction"]')).toBeVisible();
    await expect(page.locator('[role="table"]')).toBeVisible();
    await expect(page.locator('[role="row"]')).toBeVisible();
    
    // Verify status announcements
    await page.click('[data-testid="transaction-row"]:first-child');
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    
    // Test high contrast mode
    await page.addInitScript(() => {
      document.body.style.filter = 'contrast(200%)';
    });
    
    await expect(page.locator('text=Transaction History')).toBeVisible();
  });

  // 6. Edge Cases Tests
  test('@edge No transactions state', async ({ page }) => {
    // Mock empty transaction list
    await page.route('/api/transactions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transactions: [], total: 0 })
      });
    });
    
    await page.goto('/transactions');
    
    // Verify empty state
    await expect(page.locator('text=No transactions found')).toBeVisible();
    await expect(page.locator('text=Start your first transfer')).toBeVisible();
    await expect(page.locator('button:has-text("Send Money")')).toBeVisible();
  });

  test('@edge Large transaction amounts', async ({ page }) => {
    await page.goto('/transactions');
    
    // Mock transaction with large amount
    await page.route('/api/transactions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: [{
            id: 'TXN123',
            amount: 999999999.99,
            currency: 'USD',
            status: 'completed'
          }]
        })
      });
    });
    
    await page.reload();
    
    // Verify large amount displays correctly
    await expect(page.locator('text=$999,999,999.99')).toBeVisible();
  });

  test('@edge Failed/cancelled transactions', async ({ page }) => {
    await page.goto('/transactions');
    
    // Mock failed transaction
    await page.route('/api/transactions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transactions: [{
            id: 'TXN456',
            amount: 100.00,
            status: 'failed',
            failureReason: 'Insufficient funds'
          }]
        })
      });
    });
    
    await page.reload();
    
    // Verify failed transaction display
    await expect(page.locator('text=Failed')).toBeVisible();
    await expect(page.locator('text=Insufficient funds')).toBeVisible();
    
    // Test retry functionality
    await page.click('button:has-text("Retry")');
    await expect(page.locator('text=Retrying transaction')).toBeVisible();
  });

  test('@edge Corrupted data handling', async ({ page }) => {
    // Mock corrupted API response
    await page.route('/api/transactions', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"transactions": [{"invalid": "data"}]}'
      });
    });
    
    await page.goto('/transactions');
    
    // Verify error handling
    await expect(page.locator('text=Error loading transactions')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  // 7. Mobile Responsiveness Tests
  test('@mobile Mobile transaction list view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/transactions');
    
    // Verify mobile-optimized layout
    await expect(page.locator('[data-testid="mobile-transaction-card"]')).toBeVisible();
    
    // Test mobile-specific interactions
    await page.click('[data-testid="mobile-transaction-card"]:first-child');
    await expect(page.locator('text=Transaction Details')).toBeVisible();
    
    // Test mobile navigation
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Transaction History')).toBeVisible();
  });

  test('@mobile Mobile filters and search', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/transactions');
    
    // Open mobile filter menu
    await page.click('button[aria-label="Open filters"]');
    
    // Verify mobile filter interface
    await expect(page.locator('[data-testid="mobile-filters"]')).toBeVisible();
    await expect(page.locator('text=Filter Transactions')).toBeVisible();
    
    // Test mobile search
    await page.click('button[aria-label="Search"]');
    await page.fill('input[placeholder*="search"]', 'TXN123');
    await page.keyboard.press('Enter');
    
    // Verify search results on mobile
    await expect(page.locator('text=Search Results')).toBeVisible();
  });

  test('@mobile Mobile bulk actions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/transactions');
    
    // Long press to select (mobile gesture)
    await page.click('[data-testid="mobile-transaction-card"]:first-child', { button: 'right' });
    await expect(page.locator('[data-testid="mobile-selection-mode"]')).toBeVisible();
    
    // Select multiple items
    await page.click('[data-testid="mobile-transaction-card"]:nth-child(2)');
    await page.click('[data-testid="mobile-transaction-card"]:nth-child(3)');
    
    // Verify mobile bulk actions
    await expect(page.locator('text=3 selected')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('@mobile Mobile dispute flow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/transactions');
    await page.click('[data-testid="mobile-transaction-card"]:first-child');
    
    // Open mobile dispute form
    await page.click('button:has-text("Report Issue")');
    
    // Verify mobile-optimized dispute form
    await expect(page.locator('[data-testid="mobile-dispute-form"]')).toBeVisible();
    
    // Test mobile form interactions
    await page.selectOption('select[name="issueType"]', 'transaction_not_received');
    await page.fill('textarea[name="description"]', 'Mobile test dispute');
    
    // Submit on mobile
    await page.click('button:has-text("Submit")');
    
    // Verify mobile success message
    await expect(page.locator('text=Issue reported successfully')).toBeVisible();
  });

  test('@mobile Mobile accessibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/transactions');
    
    // Test mobile screen reader compatibility
    await expect(page.locator('[aria-label*="transaction"]')).toBeVisible();
    
    // Test mobile keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test mobile gesture accessibility
    await page.click('[data-testid="mobile-transaction-card"]:first-child', { button: 'right' });
    await expect(page.locator('[aria-label*="context menu"]')).toBeVisible();
  });
}); 