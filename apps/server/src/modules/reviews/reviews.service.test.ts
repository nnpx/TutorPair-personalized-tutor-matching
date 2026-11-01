import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { MatchRequestStatus, TutorType } from '@tutorpair/shared';
import { reviewsService } from './reviews.service.js';
import { reviewsRepository } from './reviews.repository.js';
import {
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
} from '../../common/errors/http-errors.js';

const STUDENT_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_STUDENT_ID = '22222222-2222-4222-8222-222222222222';
const TUTOR_ID = '33333333-3333-4333-8333-333333333333';
const REC_ID = '44444444-4444-4444-8444-444444444444';
const REVIEW_ID = '55555555-5555-4555-8555-555555555555';

describe('ReviewsService (TP-30 & TP-19)', () => {
  const orig = {
    findEligible: reviewsRepository.findEligibleConfirmedRecommendation,
    findReview: reviewsRepository.findReviewByRecommendationId,
    findRecDetails: reviewsRepository.findRecommendationForReview,
    createReview: reviewsRepository.createReview,
    getSummary: reviewsRepository.getTutorReviewsSummary,
  };

  let eligibleRec: {
    recommendation_id: string;
    tutor_id: string;
    student_id: string;
    status: string;
    is_selected: boolean;
  } | null;

  let existingReview: any | null;
  let createdParams: any | null;

  beforeEach(() => {
    eligibleRec = {
      recommendation_id: REC_ID,
      tutor_id: TUTOR_ID,
      student_id: STUDENT_ID,
      status: MatchRequestStatus.CONFIRMED,
      is_selected: true,
    };
    existingReview = null;
    createdParams = null;

    reviewsRepository.findEligibleConfirmedRecommendation = (async () => eligibleRec) as any;
    reviewsRepository.findReviewByRecommendationId = (async () => existingReview) as any;
    reviewsRepository.createReview = (async (params: any) => {
      createdParams = params;
      return {
        id: REVIEW_ID,
        student_id: params.student_id,
        tutor_id: params.tutor_id,
        recommendation_id: params.recommendation_id,
        rating_knowledge: params.rating_knowledge,
        rating_preparation: params.rating_preparation,
        rating_clarity: params.rating_clarity,
        rating_punctuality: params.rating_punctuality,
        overall_rating: params.overall_rating.toFixed(2),
        comment: params.comment,
        created_at: new Date('2026-11-01T12:00:00Z'),
      };
    }) as any;
  });

  afterEach(() => {
    reviewsRepository.findEligibleConfirmedRecommendation = orig.findEligible;
    reviewsRepository.findReviewByRecommendationId = orig.findReview;
    reviewsRepository.findRecommendationForReview = orig.findRecDetails;
    reviewsRepository.createReview = orig.createReview;
    reviewsRepository.getTutorReviewsSummary = orig.getSummary;
  });

  const validReviewInput = {
    tutor_id: TUTOR_ID,
    recommendation_id: REC_ID,
    rating_knowledge: 5,
    rating_preparation: 4,
    rating_clarity: 5,
    rating_punctuality: 4,
    comment: 'Great tutor! Explained everything step-by-step.',
  };

  describe('submitReview (TP-30)', () => {
    it('throws NotFoundError when IDs are not valid UUIDs', async () => {
      await assert.rejects(
        reviewsService.submitReview(STUDENT_ID, {
          ...validReviewInput,
          recommendation_id: 'bad-uuid',
        }),
        NotFoundError
      );
    });

    it('throws NotFoundError when the recommendation is not found or not owned by student', async () => {
      eligibleRec = null;
      await assert.rejects(
        reviewsService.submitReview(STUDENT_ID, validReviewInput),
        NotFoundError
      );
    });

    it('throws ConflictError when the match is not CONFIRMED', async () => {
      eligibleRec = {
        ...eligibleRec!,
        status: MatchRequestStatus.PENDING,
      };
      await assert.rejects(
        reviewsService.submitReview(STUDENT_ID, validReviewInput),
        ConflictError
      );
    });

    it('throws ConflictError when the recommendation was not the one selected', async () => {
      eligibleRec = {
        ...eligibleRec!,
        is_selected: false,
      };
      await assert.rejects(
        reviewsService.submitReview(STUDENT_ID, validReviewInput),
        ConflictError
      );
    });

    it('throws UnprocessableEntityError when tutor_id does not match the recommendation tutor', async () => {
      await assert.rejects(
        reviewsService.submitReview(STUDENT_ID, {
          ...validReviewInput,
          tutor_id: '99999999-9999-4999-8999-999999999999',
        }),
        UnprocessableEntityError
      );
    });

    it('throws ConflictError when a review has already been submitted for this recommendation', async () => {
      existingReview = { id: 'rev-1' };
      await assert.rejects(
        reviewsService.submitReview(STUDENT_ID, validReviewInput),
        ConflictError
      );
    });

    it('computes overall rating as arithmetic mean of 4 metrics and creates review', async () => {
      // (5 + 4 + 5 + 4) / 4 = 18 / 4 = 4.5
      const result = await reviewsService.submitReview(STUDENT_ID, validReviewInput);

      assert.equal(createdParams.overall_rating, 4.5);
      assert.equal(createdParams.student_id, STUDENT_ID);
      assert.equal(createdParams.tutor_id, TUTOR_ID);
      assert.equal(createdParams.rating_knowledge, 5);
      assert.equal(createdParams.rating_preparation, 4);
      assert.equal(createdParams.rating_clarity, 5);
      assert.equal(createdParams.rating_punctuality, 4);
      assert.equal(createdParams.comment, 'Great tutor! Explained everything step-by-step.');

      assert.deepEqual(result, {
        review_id: REVIEW_ID,
        tutor_id: TUTOR_ID,
        overall_rating: 4.5,
        created_at: '2026-11-01T12:00:00.000Z',
      });
    });
  });

  describe('getTutorReviews (TP-19)', () => {
    it('throws NotFoundError for non-uuid tutorId', async () => {
      await assert.rejects(reviewsService.getTutorReviews('invalid-id'), NotFoundError);
    });

    it('returns rating breakdown and review list from repository', async () => {
      const mockSummary = {
        tutor_id: TUTOR_ID,
        average_rating: 4.75,
        review_count: 2,
        rating_breakdown: {
          knowledge: 5,
          preparation: 4.5,
          clarity: 4.5,
          punctuality: 5,
        },
        reviews: [],
      };
      reviewsRepository.getTutorReviewsSummary = (async () => mockSummary) as any;

      const result = await reviewsService.getTutorReviews(TUTOR_ID);
      assert.deepEqual(result, mockSummary);
    });
  });
});
