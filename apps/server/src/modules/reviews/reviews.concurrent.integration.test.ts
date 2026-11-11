import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  matchRecommendations, matchRequests, notifications, reviews, students,
  subjectVariants, subjects, tutors, users,
} from '../../db/schema/index.js';
import {
  LearningGoal, MatchRequestStatus, NotificationEventType, SubjectCategory, TutorType, UserRole,
} from '@tutorpair/shared';
import { ConflictError } from '../../common/errors/http-errors.js';
import { reviewsService } from './reviews.service.js';

describe('Concurrent review submissions (PostgreSQL integration)', () => {
  const key = randomUUID();
  const studentSub = `review-concurrency-student-${key}`;
  const secondStudentSub = `review-concurrency-second-student-${key}`;
  const tutorSub = `review-concurrency-tutor-${key}`;
  let studentId: string;
  let secondStudentId: string;
  let tutorId: string;
  let subjectId: string;
  let recommendationId: string;
  let secondRecommendationId: string;

  before(async () => {
    const [studentUser] = await db.insert(users).values({
      cognito_sub: studentSub, email: `${studentSub}@test.tutorpair.com`, role: UserRole.STUDENT,
    }).returning();
    const [tutorUser] = await db.insert(users).values({
      cognito_sub: tutorSub, email: `${tutorSub}@test.tutorpair.com`, role: UserRole.TUTOR,
    }).returning();
    const [secondStudentUser] = await db.insert(users).values({
      cognito_sub: secondStudentSub, email: `${secondStudentSub}@test.tutorpair.com`, role: UserRole.STUDENT,
    }).returning();
    studentId = studentUser.id;
    secondStudentId = secondStudentUser.id;
    tutorId = tutorUser.id;
    await db.insert(students).values({
      user_id: studentId, first_name: 'Review', last_name: 'Student', grade_level: 'G10',
      tutor_type_pref: 'ANY', style_profile: [3, 3, 3, 3, 3], personality_profile: [3, 3, 3, 3],
      budget_max: '1000.00',
    });
    await db.insert(students).values({
      user_id: secondStudentId, first_name: 'Another', last_name: 'Student', grade_level: 'G10',
      tutor_type_pref: 'ANY', style_profile: [3, 3, 3, 3, 3], personality_profile: [3, 3, 3, 3],
      budget_max: '1000.00',
    });
    await db.insert(tutors).values({
      user_id: tutorId, first_name: 'Review', last_name: 'Tutor', phone_number: '0810000000',
      tutor_type: TutorType.FREELANCE, style_profile: [3, 3, 3, 3, 3], personality_profile: [3, 3, 3, 3],
    });
    const [subject] = await db.insert(subjects).values({
      name: `Review concurrency ${key}`, category: SubjectCategory.GENERAL_LEARNING,
    }).returning();
    subjectId = subject.id;
    const [variant] = await db.insert(subjectVariants).values({
      subject_id: subjectId, name: 'Review concurrency', learning_goal: LearningGoal.SCHOOL_CURRICULUM,
    }).returning();
    const [request] = await db.insert(matchRequests).values({
      student_id: studentId, variant_id: variant.id, status: MatchRequestStatus.CONFIRMED,
    }).returning();
    const [recommendation] = await db.insert(matchRecommendations).values({
      match_request_id: request.id, tutor_id: tutorId, rank: 1, score: '95.00', is_selected: true,
    }).returning();
    recommendationId = recommendation.id;
    const [secondRequest] = await db.insert(matchRequests).values({
      student_id: secondStudentId, variant_id: variant.id, status: MatchRequestStatus.CONFIRMED,
    }).returning();
    const [secondRecommendation] = await db.insert(matchRecommendations).values({
      match_request_id: secondRequest.id, tutor_id: tutorId, rank: 1, score: '94.00', is_selected: true,
    }).returning();
    secondRecommendationId = secondRecommendation.id;
  });

  after(async () => {
    if (tutorId) await db.delete(users).where(eq(users.id, tutorId));
    if (studentId) await db.delete(users).where(eq(users.id, studentId));
    if (secondStudentId) await db.delete(users).where(eq(users.id, secondStudentId));
    if (subjectId) await db.delete(subjects).where(eq(subjects.id, subjectId));
  });

  it('stores one duplicate-race winner and serializes ratings from different students', async () => {
    const firstInput = {
      tutor_id: tutorId, recommendation_id: recommendationId,
      rating_knowledge: 5, rating_preparation: 4, rating_clarity: 5, rating_punctuality: 4,
    };
    const secondInput = {
      tutor_id: tutorId, recommendation_id: secondRecommendationId,
      rating_knowledge: 4, rating_preparation: 3, rating_clarity: 4, rating_punctuality: 3,
    };
    const results = await Promise.allSettled([
      reviewsService.submitReview(studentId, firstInput),
      reviewsService.submitReview(studentId, firstInput),
      reviewsService.submitReview(secondStudentId, secondInput),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 2);
    const rejected = results.filter((result) => result.status === 'rejected');
    assert.equal(rejected.length, 1);
    assert.ok(rejected[0].status === 'rejected' && rejected[0].reason instanceof ConflictError);

    const storedReviews = await db.select().from(reviews).where(eq(reviews.tutor_id, tutorId));
    const tutor = (await db.select().from(tutors).where(eq(tutors.user_id, tutorId)))[0];
    const notices = await db.select().from(notifications).where(eq(notifications.user_id, tutorId));
    assert.equal(storedReviews.length, 2);
    assert.equal(tutor.review_count, 2);
    assert.equal(Number(tutor.average_rating), 4);
    assert.equal(notices.filter((notice) => notice.event_type === NotificationEventType.NEW_REVIEW).length, 2);
  });
});
