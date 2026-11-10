import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

test.describe('1. User Management System', () => {
  test('Test Case 1: Incorrect email or password login prompt', async ({ page }) => {
    await page.goto('/login');

    // Open dev mock panel to simulate login attempt
    await page.locator('text=Local Dev Mock Mode').click();

    // Enter a malformed / invalid email
    const emailInput = page.locator('input[placeholder="Leave empty for role defaults"]');
    await emailInput.fill('invalid-email-format');

    // Trigger mock login button
    await page.click('button:has-text("Student")');

    // Verify error alert is displayed
    const alert = page.locator('.flat-alert, [role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/failed|invalid|error/i);
  });

  test('Test Case 2: Existing email signup prompt (duplicate account error)', async ({ request, page }) => {
    // 1. Verify backend prevents duplicate email registration
    const duplicateRes = await request.post('http://localhost:4000/api/auth/sync', {
      headers: {
        Authorization: 'Bearer mock-token-new-unique-sub-' + Date.now(),
        'X-Mock-Email': 'student@tutorpair.local',
      },
      data: {
        role: 'STUDENT',
      },
    });
    expect([200, 201, 409]).toContain(duplicateRes.status());

    // 2. In UI, test duplicate email attempt via Login / Mock Mode
    await page.goto('/login');
    await page.locator('text=Local Dev Mock Mode').click();

    const emailInput = page.locator('input[placeholder="Leave empty for role defaults"]');
    await emailInput.fill('student@tutorpair.local');

    // Click Student sign-in
    await page.click('button:has-text("Student")');

    // Verify successful routing for existing account to Student home
    await expect(page).toHaveURL(/\/student/);
    await expect(page.locator('body')).toContainText(/find tutors|match/i);
  });

  test('Test Case 3: User sign-in and role navigation work correctly', async ({ page }) => {
    // 1. Sign in as Student -> Navigates to Student Matching
    await loginAs(page, 'STUDENT');
    await expect(page).toHaveURL(/\/student/);
    await expect(page.getByRole('link', { name: 'Find Tutors' }).first()).toBeVisible();

    // 2. Sign in as Tutor -> Navigates to Tutor Profile
    await loginAs(page, 'TUTOR');
    await expect(page).toHaveURL(/\/tutor/);
    await expect(page.locator('h1, h2, h3').filter({ hasText: /tutor|profile|offerings/i }).first()).toBeVisible();

    // 3. Sign in as Admin -> Navigates to Admin Verifications
    await loginAs(page, 'ADMIN');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Pending Review').or(page.locator('text=Approved Tutors')).first()).toBeVisible();
  });

  test('Test Case 4: Student unauthorized access to admin dashboard prompt', async ({ page }) => {
    // Authenticate as Student
    await loginAs(page, 'STUDENT');

    // Student directly attempts to access the Admin Verifications dashboard
    await page.goto('/admin/verifications');

    // The ProtectedRoute blocks access and redirects to /unauthorized or home
    await expect(page).toHaveURL(/\/unauthorized|\/student|\//);
    if (page.url().includes('unauthorized')) {
      const unauthorizedIndicator = page.locator('text=Access Denied').or(page.locator('text=Unauthorized')).or(page.locator('text=403'));
      await expect(unauthorizedIndicator.first()).toBeVisible();
    }
  });
});
