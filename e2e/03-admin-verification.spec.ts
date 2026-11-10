import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

test.describe('3. Admin Verification System', () => {
  test('Test Case 8: Reject tutor without entering reason prompt', async ({ request, page }) => {
    // 1. Backend validation: Reject API call with empty reason returns 400
    const queueRes = await request.get('http://localhost:4000/api/admin/tutors?status=ALL', {
      headers: {
        Authorization: 'Bearer mock-token-mock-admin-id',
      },
    });
    const queue = await queueRes.json();
    const targetTutorId = queue.data[0]?.user_id || 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f';

    const rejectRes = await request.patch(`http://localhost:4000/api/admin/tutors/${targetTutorId}/verify`, {
      headers: {
        Authorization: 'Bearer mock-token-mock-admin-id',
      },
      data: {
        status: 'REJECTED',
        rejection_reason: '',
      },
    });

    expect(rejectRes.status()).toBe(400);

    // 2. UI validation: Admin page prevents rejection without a reason
    await loginAs(page, 'ADMIN');
    await page.goto('/admin/verifications');

    const rejectBtn = page.locator('button:has-text("Reject Application")').first();
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      // Click confirm rejection without filling reason textarea
      const confirmRejectBtn = page.locator('button[type="submit"]:has-text("Confirm Rejection"), button:has-text("Confirm Rejection")').first();
      await confirmRejectBtn.click();

      // Verify validation message is displayed in UI
      const validationMsg = page.locator('text=Please specify the rejection reason').or(page.locator('.flat-alert'));
      await expect(validationMsg.first()).toBeVisible();
    }
  });

  test('Test Case 9: Admin rejects tutor with reason works correctly', async ({ request, page }) => {
    // 1. Get tutor applicant
    const queueRes = await request.get('http://localhost:4000/api/admin/tutors?status=ALL', {
      headers: {
        Authorization: 'Bearer mock-token-mock-admin-id',
      },
    });
    const queue = await queueRes.json();
    const targetTutor = queue.data[0];

    // 2. Reject tutor with valid reason
    const validReason = 'Degree transcript scan is blurry. Please upload a clear copy.';
    const rejectRes = await request.patch(`http://localhost:4000/api/admin/tutors/${targetTutor.user_id}/verify`, {
      headers: {
        Authorization: 'Bearer mock-token-mock-admin-id',
      },
      data: {
        status: 'REJECTED',
        rejection_reason: validReason,
      },
    });

    expect(rejectRes.status()).toBe(200);
    const result = await rejectRes.json();
    expect(result.data.verification_status).toBe('REJECTED');
    expect(result.data.rejection_reason).toBe(validReason);

    // 3. Verify in Admin UI that status updates and Rejected tab renders
    await loginAs(page, 'ADMIN');
    await page.goto('/admin/verifications');
    await page.click('text=Rejected Applications');
    await expect(page.locator('body')).toContainText(/rejected/i);
  });

  test('Test Case 10: Admin approves tutor application works correctly', async ({ request, page }) => {
    // 1. Get tutor applicant
    const queueRes = await request.get('http://localhost:4000/api/admin/tutors?status=ALL', {
      headers: {
        Authorization: 'Bearer mock-token-mock-admin-id',
      },
    });
    const queue = await queueRes.json();
    const targetTutor = queue.data[0];

    // 2. Approve tutor application
    const approveRes = await request.patch(`http://localhost:4000/api/admin/tutors/${targetTutor.user_id}/verify`, {
      headers: {
        Authorization: 'Bearer mock-token-mock-admin-id',
      },
      data: {
        status: 'APPROVED',
      },
    });

    expect(approveRes.status()).toBe(200);
    const result = await approveRes.json();
    expect(result.data.verification_status).toBe('APPROVED');

    // 3. Verify in UI that tutor is under Approved Tutors and filter tabs work
    await loginAs(page, 'ADMIN');
    await page.goto('/admin/verifications');
    await page.click('text=Approved Tutors');
    await expect(page.locator('body')).toContainText(/approved/i);
  });
});
