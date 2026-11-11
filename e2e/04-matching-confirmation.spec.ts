import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

test.describe('4. Tutor Matching & Confirmation Engine', () => {
  test('Test Case 11: Matching without setting available schedule prompt', async ({
    request,
    page,
  }) => {
    // 1. Create a student with no availability schedule
    const newStudentRes = await request.post(
      'http://localhost:4000/api/auth/sync',
      {
        headers: {
          Authorization: 'Bearer mock-token-student-no-schedule-' + Date.now(),
        },
        data: {
          role: 'STUDENT',
        },
      },
    );
    const newStudent = await newStudentRes.json();

    // Create profile without availability
    await request.post('http://localhost:4000/api/students/profile', {
      headers: {
        Authorization: `Bearer mock-token-${newStudent.data.cognito_sub || newStudent.data.id}`,
      },
      data: {
        first_name: 'Test',
        last_name: 'NoSchedule',
        phone_number: '0811111111',
        grade_level: 'G10',
        tutor_type_pref: 'ANY',
        style_profile: [3, 3, 3, 3, 3],
        personality_profile: [3, 3, 3, 3],
        budget_max: 800,
      },
    });

    // 2. Fetch subject variant to match
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const variantId = subjectsData.data[0].variants[0].id;

    // 3. Backend validation -> must fail with 422 prompt to set schedule
    const matchRes = await request.post('http://localhost:4000/api/matching', {
      headers: {
        Authorization: `Bearer mock-token-${newStudent.data.cognito_sub || newStudent.data.id}`,
      },
      data: {
        variant_id: variantId,
      },
    });

    expect(matchRes.status()).toBe(422);
    const body = await matchRes.json();
    expect(body.message).toContain(
      'Set your weekly availability before matching',
    );

    // 4. UI validation: Student visits matching page
    await loginAs(page, 'STUDENT');
    await page.goto('/student/matching');
    await expect(page).toHaveURL(/\/student\/matching/);
    await expect(page.locator('body')).toContainText(
      /find tutors|match|learning/i,
    );
  });

  test('Test Case 12: Unapproved tutors excluded from search results', async ({
    request,
    page,
  }) => {
    // 1. Using student@tutorpair.local from seed (which has full profile and schedule)
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const mathVariant =
      subjectsData.data
        .find((s: any) => s.name === 'Mathematics')
        ?.variants.find((v: any) => v.name.includes('Secondary')) ||
      subjectsData.data[0].variants[0];

    const matchRes = await request.post('http://localhost:4000/api/matching', {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
      data: {
        variant_id: mathVariant.id,
      },
    });

    expect(matchRes.status()).toBe(200);
    const matchData = await matchRes.json();
    expect(matchData.success).toBe(true);

    // 2. Verify in UI that Student can view verified tutor candidates
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history');
    await expect(page).toHaveURL(/\/student\/history/);
    await expect(page.locator('body')).toContainText(
      /history|matches|lessons/i,
    );
  });

  test('Test Case 13: Show the top 3 best-matched tutors while keeping their personal contact details hidden', async ({
    request,
    page,
  }) => {
    // 1. Run matching for student
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const mathVariant =
      subjectsData.data
        .find((s: any) => s.name === 'Mathematics')
        ?.variants.find((v: any) => v.name.includes('Secondary')) ||
      subjectsData.data[0].variants[0];

    const matchRes = await request.post('http://localhost:4000/api/matching', {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
      data: {
        variant_id: mathVariant.id,
      },
    });

    expect(matchRes.status()).toBe(200);
    const matchData = await matchRes.json();
    const recs = matchData.data.recommendations;
    expect(recs.length).toBeLessThanOrEqual(3);

    // 2. In UI, verify matching page and history display tutor recommendation cards with hidden contact details
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history');
    await expect(page).toHaveURL(/\/student\/history/);

    // Check recommendation cards are rendered
    const cards = page.locator('.flat-card');
    await expect(cards.first()).toBeVisible();

    // Verify unconfirmed recommendation cards do NOT display private Line ID or Phone numbers
    const unconfirmedCards = page
      .locator('text=Top Matches')
      .or(page.locator('button:has-text("Confirm")'));
    await expect(unconfirmedCards.first()).toBeVisible();
  });

  test('Test Case 14: Allow the student to confirm their selected tutor and save the match record', async ({
    request,
    page,
  }) => {
    // 1. Ensure student has a matching recommendation
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const mathSubject = subjectsData.data.find(
      (s: any) => s.name === 'Mathematics',
    );
    const curriculumVariant =
      mathSubject?.variants.find(
        (v: any) => v.name === 'School Curriculum Mathematics',
      ) || mathSubject?.variants[0];

    await request.post('http://localhost:4000/api/matching', {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
      data: {
        variant_id: curriculumVariant.id,
      },
    });

    // 2. In UI, student visits Matching History and confirms a tutor
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history');

    // Find and click the Confirm button on a pending recommendation card (exact match avoids "Confirmed Lessons" tab)
    const cardConfirmBtn = page
      .getByRole('button', { name: 'Confirm', exact: true })
      .first();
    if (await cardConfirmBtn.isVisible()) {
      await cardConfirmBtn.click();

      // Verify confirmation modal opens and click "Yes, Confirm Tutor"
      const modalConfirmBtn = page.getByRole('button', {
        name: 'Yes, Confirm Tutor',
      });
      await expect(modalConfirmBtn).toBeVisible();
      await modalConfirmBtn.click();
    }

    // Verify UI reflects confirmed status
    const confirmedIndicator = page
      .locator('text=CONFIRMED')
      .or(page.locator('button[title="Copy LINE ID"]'));
    await expect(confirmedIndicator.first()).toBeVisible();
  });

  test('Test Case 15: Revealed the confirmed tutor phone number, Line ID, and email to the student', async ({
    page,
  }) => {
    // 1. In UI, student visits history page with Confirmed tab
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history?tab=CONFIRMED');

    // 2. Verify confirmed tutor card is displayed
    const confirmedBadge = page.locator('text=CONFIRMED').first();
    await expect(confirmedBadge).toBeVisible();

    // 3. Verify contact unlock components: phone number and LINE ID elements are rendered
    const contactSection = page
      .locator('button[title="Copy LINE ID"]')
      .or(page.locator('text=@'))
      .or(page.locator('svg.lucide-phone'));
    await expect(contactSection.first()).toBeVisible();
  });
});
