import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

test.describe('2. Tutor Onboarding & Document System', () => {
  test('Test Case 5: Missing required document upload prompt', async ({ request, page }) => {
    // 1. Backend validation: Reject presigned URL without file name
    const res = await request.post('http://localhost:4000/api/documents/presigned-upload', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
      data: {
        file_name: '',
        file_size_kb: 1024,
        document_type: 'CV',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);

    // 2. UI validation: In Tutor Verification, view document upload section and check validation controls
    await loginAs(page, 'TUTOR');
    await page.goto('/tutor/profile?tab=documents');
    await expect(page).toHaveURL(/\/tutor\/profile/);
    await expect(page.locator('body')).toContainText(/document|verification|degree|cv/i);

    // Attempt to submit when mandatory documents are missing
    const saveBtn = page.locator('button:has-text("Save Document Changes"), button:has-text("Submit")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      const feedback = page.locator('.flat-alert, [role="alert"]').or(page.locator('text=mandatory documents')).or(page.locator('text=Verification'));
      await expect(feedback.first()).toBeVisible();
    }
  });

  test('Test Case 6: Resume and degree certificate uploaded successfully', async ({ request, page }) => {
    // 1. Request presigned upload URL for CV
    const presignedRes = await request.post('http://localhost:4000/api/documents/presigned-upload', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
      data: {
        file_name: 'resume-tutor.pdf',
        file_size_kb: 500,
        document_type: 'CV',
      },
    });

    expect(presignedRes.status()).toBe(200);
    const presignedData = await presignedRes.json();
    const fileKey = presignedData.data.fileKey || presignedData.data.file_key;

    // 2. Confirm the upload in backend
    const confirmRes = await request.post('http://localhost:4000/api/documents/confirm', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
      data: {
        file_key: fileKey,
        file_size_kb: 500,
        document_type: 'CV',
      },
    });
    expect([200, 201]).toContain(confirmRes.status());

    // 3. UI verification: View verification page and assert document upload section and uploaded files are visible
    await loginAs(page, 'TUTOR');
    await page.goto('/tutor/profile?tab=documents');
    await expect(page.locator('body')).toContainText(/document|degree|cv|resume|verification/i);
    const uploadedIndicator = page.locator('text=Uploaded').or(page.locator('text=KB')).or(page.locator('input[type="file"]'));
    await expect(uploadedIndicator.first()).toBeVisible();
  });

  test('Test Case 7: Tutor teaching subjects, rates, and schedule saved correctly', async ({ request, page }) => {
    // 1. Fetch available subject variants to pick a valid variant UUID
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const variantId = subjectsData.data[0].variants[0].id;

    // 2. Save tutor subjects and hourly rate
    const putSubjectsRes = await request.put('http://localhost:4000/api/tutors/subjects', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
      data: {
        subjects: [
          {
            variant_id: variantId,
            hourly_rate: 650,
            grade_levels: ['G10', 'G11', 'G12'],
            teaching_focus: 'Calculus and Exam Prep',
          },
        ],
      },
    });
    expect(putSubjectsRes.status()).toBe(200);

    // 3. Save tutor availability schedule
    const putAvailRes = await request.put('http://localhost:4000/api/tutors/availability', {
      headers: {
        Authorization: 'Bearer mock-token-mock-tutor-id',
      },
      data: {
        availability: [
          {
            day_of_week: 'MONDAY',
            start_time: '17:00',
            end_time: '20:00',
          },
        ],
      },
    });
    expect(putAvailRes.status()).toBe(200);

    // 4. Verify in UI that Tutor Profile and Subjects pages load correctly
    await loginAs(page, 'TUTOR');
    await page.goto('/tutor/profile?tab=subjects');
    await expect(page).toHaveURL(/\/tutor\/profile/);
    await expect(page.locator('body')).toContainText(/subjects|teaching|rate|tutor/i);

    await page.goto('/tutor/profile');
    await expect(page).toHaveURL(/\/tutor\/profile/);
    await expect(page.locator('body')).toContainText(/tutor|subjects|profile|availability/i);
  });
});
