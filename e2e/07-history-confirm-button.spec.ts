import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

const CONFIRM_THIS_TUTOR = { name: 'Confirm This Tutor' };

test.describe('7. History profile card: Confirm This Tutor only while Pending', () => {
  test('Test Case 21: Pending profile card shows Confirm This Tutor; Confirmed profile cards do not', async ({
    request,
    page,
  }) => {
    // 1. Fresh PENDING request for the demo student
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const variant = subjectsData.data
      .find((s: any) => s.name === 'Mathematics')
      ?.variants.find((v: any) => v.name === 'School Curriculum Mathematics');
    const matchRes = await request.post('http://localhost:4000/api/matching', {
      headers: { Authorization: 'Bearer mock-token-mock-student-id' },
      data: { variant_id: variant.id },
    });
    expect(matchRes.status()).toBe(200);

    // 2. Open a Pending recommendation's profile from History
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history');
    await page.getByRole('button', { name: 'Profile', exact: true }).first().click();
    const profileConfirm = page.getByRole('button', CONFIRM_THIS_TUTOR);
    await expect(profileConfirm).toBeVisible();

    // 3. Confirm through the profile card -> existing confirm dialog
    await profileConfirm.click();
    await page.getByRole('button', { name: 'Yes, Confirm Tutor' }).click();
    await expect(page.getByText('CONFIRMED').first()).toBeVisible();

    // 4. Selected tutor of a Confirmed request: no Confirm button
    await page
      .getByRole('button', { name: 'Inspect Full Profile & All Reviews' })
      .first()
      .click();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    await expect(page.getByRole('button', CONFIRM_THIS_TUTOR)).toHaveCount(0);
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // 5. Other recommendation of a Confirmed request: no Confirm button
    await page.getByRole('button', { name: 'View Full Profile' }).first().click();
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    await expect(page.getByRole('button', CONFIRM_THIS_TUTOR)).toHaveCount(0);
  });
});
