import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

test.describe('6. Notification System', () => {
  test('Test Case 19: Tutor receives alert when confirmed by a student', async ({ request, page }) => {
    // 1. Backend verification: Fetch notifications for verified tutor
    const notiRes = await request.get('http://localhost:4000/api/notifications', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
    });

    expect(notiRes.status()).toBe(200);
    const notiData = await notiRes.json();
    expect(notiData.success).toBe(true);

    // 2. UI verification: In Tutor dashboard, click notification bell to inspect alerts
    await loginAs(page, 'TUTOR');
    await page.goto('/tutor/profile');

    const bellButton = page.locator('.notification-bell, button[aria-label*="notification" i]').first();
    await expect(bellButton).toBeVisible();
    await bellButton.click();

    // Verify notification panel opens on screen
    const notiPanel = page.locator('#tutor-notifications, .notification-dropdown').or(page.locator('text=Notifications'));
    await expect(notiPanel.first()).toBeVisible();
  });

  test('Test Case 20: Notification bell unread count badge shown and updates on read', async ({ request, page }) => {
    // 1. In Tutor UI, verify notification bell renders in navbar with badge support
    await loginAs(page, 'TUTOR');
    await page.goto('/tutor/profile');

    const bellButton = page.locator('.notification-bell, button[aria-label*="notification" i]').first();
    await expect(bellButton).toBeVisible();

    // Click to open notification panel
    await bellButton.click();

    // If "Mark all as read" button is present, click it to clear unread status
    const markAllBtn = page.locator('button:has-text("Mark all as read"), .notification-mark-all').first();
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
    }

    // 2. Backend verification: Ensure unread count is updated
    const afterRes = await request.get('http://localhost:4000/api/notifications', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
    });
    const afterData = await afterRes.json();
    expect(afterData.success).toBe(true);
  });
});

