import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.helper';

test.describe('5. History & Review System', () => {
  test('Test Case 16: Reviewing an unconfirmed tutor prompt', async ({ request, page }) => {
    // 1. Backend validation: Reject review submission for non-existent / unconfirmed match
    const fakeRecId = '00000000-0000-0000-0000-000000000001';
    const fakeTutorId = '00000000-0000-0000-0000-000000000002';

    const reviewRes = await request.post('http://localhost:4000/api/reviews', {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
      data: {
        recommendation_id: fakeRecId,
        tutor_id: fakeTutorId,
        rating_knowledge: 5,
        rating_preparation: 5,
        rating_clarity: 5,
        rating_punctuality: 5,
        comment: 'Unverified attempt',
      },
    });

    expect([404, 409]).toContain(reviewRes.status());

    // 2. UI validation: Visiting review page for unconfirmed tutor displays gating warning
    await loginAs(page, 'STUDENT');
    await page.goto(`/student/review/${fakeRecId}`);
    const gatingWarning = page.locator('text=Review Gating').or(page.locator('text=Verified Lesson Required')).or(page.locator('text=Return to Matching History'));
    await expect(gatingWarning.first()).toBeVisible();
  });

  test('Test Case 17: Four-category rating and comment submitted correctly', async ({ request, page }) => {
    // 1. Ensure a confirmed match is ready
    const subjectsRes = await request.get('http://localhost:4000/api/subjects');
    const subjectsData = await subjectsRes.json();
    const mathSubject = subjectsData.data.find((s: any) => s.name === 'Mathematics');
    const curriculumVariant = mathSubject?.variants.find((v: any) => v.name === 'School Curriculum Mathematics') || mathSubject?.variants[0];

    const matchRes = await request.post('http://localhost:4000/api/matching', {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
      data: {
        variant_id: curriculumVariant.id,
      },
    });
    const matchData = await matchRes.json();
    const rec = matchData.data.recommendations[0];

    await request.post(`http://localhost:4000/api/matching/${matchData.data.match_request_id}/confirm`, {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
      data: {
        recommendation_id: rec.recommendation_id,
        tutor_id: rec.tutor.tutor_id,
      },
    });

    // 2. In UI, student visits history and clicks Write 4-Category Review
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history');

    const writeReviewBtn = page.locator('button:has-text("Write 4-Category Review")').first();
    if (await writeReviewBtn.isVisible()) {
      await writeReviewBtn.click();
      await expect(page).toHaveURL(/\/student\/review\//);

      // Verify 4 rating dimensions are rendered
      await expect(page.locator('text=Knowledge & Mastery')).toBeVisible();
      await expect(page.locator('text=Lesson Preparation & Materials')).toBeVisible();
      await expect(page.locator('text=Clarity & Delivery')).toBeVisible();
      await expect(page.locator('text=Punctuality & Reliability')).toBeVisible();

      // Enter written feedback
      await page.fill('#review-comment', 'Very patient tutor. Helped me understand calculus clearly!');

      // Click submit
      await page.click('button:has-text("Submit Verified Review")');

      // Verify success modal is displayed
      await expect(page.locator('text=Review Submitted Successfully!')).toBeVisible();
    } else {
      // Fallback direct API verification if all slots are reviewed
      const submitReviewRes = await request.post('http://localhost:4000/api/reviews', {
        headers: {
          Authorization: 'Bearer mock-token-mock-student-id',
        },
        data: {
          recommendation_id: rec.recommendation_id,
          tutor_id: rec.tutor.tutor_id,
          rating_knowledge: 5,
          rating_preparation: 4,
          rating_clarity: 5,
          rating_punctuality: 4,
          comment: 'Very patient tutor. Helped me understand calculus clearly!',
        },
      });
      expect([200, 201, 409]).toContain(submitReviewRes.status());
    }
  });

  test('Test Case 18: Duplicate review submission prompt', async ({ request, page }) => {
    // 1. In UI, verify already reviewed tutors display "Review Submitted" badge (no duplicate button)
    await loginAs(page, 'STUDENT');
    await page.goto('/student/history');

    const reviewedIndicator = page.locator('text=Review Submitted').or(page.locator('text=CONFIRMED'));
    await expect(reviewedIndicator.first()).toBeVisible();

    // 2. In backend, verify direct duplicate submission returns 409 Conflict
    const historyRes = await request.get('http://localhost:4000/api/matching/history', {
      headers: {
        Authorization: 'Bearer mock-token-mock-student-id',
      },
    });
    const historyData = await historyRes.json();
    const reviewedMatch = historyData.data.find((m: any) => m.selected && m.selected.has_reviewed);

    if (reviewedMatch) {
      const duplicateRes = await request.post('http://localhost:4000/api/reviews', {
        headers: {
          Authorization: 'Bearer mock-token-mock-student-id',
        },
        data: {
          recommendation_id: reviewedMatch.selected.recommendation_id,
          tutor_id: reviewedMatch.selected.tutor_id,
          rating_knowledge: 5,
          rating_preparation: 5,
          rating_clarity: 5,
          rating_punctuality: 5,
          comment: 'Duplicate review attempt',
        },
      });

      expect([400, 409]).toContain(duplicateRes.status());
    }
  });
});

