import { z } from 'zod';
import {
  MatchRequestStatus,
  type CreateReviewInput,
  type ReviewItemDto,
  type TutorReviewsSummaryDto,
} from '@tutorpair/shared';
import {
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
} from '../../common/errors/http-errors.js';
import { reviewsRepository } from './reviews.repository.js';

const isUuid = (val: string) => z.string().uuid().safeParse(val).success;

export const reviewsService = {
  /**
   * TP-30: Submits a 4-category review for a confirmed tutor match.
   * Enforces verified gating: only the student who confirmed this lesson can submit.
   * Prevents double-reviewing the same match.
   */
  async submitReview(studentId: string, input: CreateReviewInput) {
    if (!isUuid(input.recommendation_id) || !isUuid(input.tutor_id)) {
      throw new NotFoundError('Invalid recommendation or tutor ID');
    }

    // 1. Gating verification: Must be a confirmed recommendation owned by this student
    const eligible = await reviewsRepository.findEligibleConfirmedRecommendation(
      studentId,
      input.recommendation_id
    );

    if (!eligible) {
      throw new NotFoundError('Confirmed match recommendation not found');
    }

    if (eligible.status !== MatchRequestStatus.CONFIRMED || !eligible.is_selected) {
      throw new ConflictError('You can only review tutors from confirmed matches');
    }

    if (eligible.tutor_id !== input.tutor_id) {
      throw new UnprocessableEntityError('tutor_id does not match the recommendation tutor');
    }

    // 2. Duplicate review prevention
    const existingReview = await reviewsRepository.findReviewByRecommendationId(
      input.recommendation_id
    );
    if (existingReview) {
      throw new ConflictError('You have already submitted a review for this tutor match');
    }

    // 3. Compute overall mean rating (1.00 - 5.00)
    const overallRating =
      (input.rating_knowledge +
        input.rating_preparation +
        input.rating_clarity +
        input.rating_punctuality) /
      4;

    // 4. Save review and update tutor average in single transaction
    const created = await reviewsRepository.createReview({
      student_id: studentId,
      tutor_id: input.tutor_id,
      recommendation_id: input.recommendation_id,
      rating_knowledge: input.rating_knowledge,
      rating_preparation: input.rating_preparation,
      rating_clarity: input.rating_clarity,
      rating_punctuality: input.rating_punctuality,
      overall_rating: overallRating,
      comment: input.comment ?? null,
    });

    return {
      review_id: created.id,
      tutor_id: created.tutor_id,
      overall_rating: Number(created.overall_rating),
      created_at: created.created_at.toISOString(),
    };
  },

  /**
   * TP-19: Get all verified reviews and 4-metric score breakdown for a tutor.
   */
  async getTutorReviews(tutorId: string): Promise<TutorReviewsSummaryDto> {
    if (!isUuid(tutorId)) {
      throw new NotFoundError('Tutor not found');
    }

    return await reviewsRepository.getTutorReviewsSummary(tutorId);
  },

  /**
   * Helper for the review submission form to prefetch tutor and subject context.
   */
  async getRecommendationContext(studentId: string, recommendationId: string) {
    if (!isUuid(recommendationId)) {
      throw new NotFoundError('Match recommendation not found');
    }

    const details = await reviewsRepository.findRecommendationForReview(
      recommendationId,
      studentId
    );

    if (!details) {
      throw new NotFoundError('Match recommendation not found');
    }

    if (details.status !== MatchRequestStatus.CONFIRMED || !details.is_selected) {
      throw new ConflictError('You can only review tutors from confirmed matches');
    }

    return {
      recommendation_id: details.recommendation_id,
      tutor_id: details.tutor_id,
      tutor_name: `${details.first_name} ${details.last_name}`,
      tutor_type: details.tutor_type,
      hourly_rate: Number(details.hourly_rate ?? 0),
      subject_name: details.subject_name,
      variant_name: details.variant_name,
      already_reviewed: Boolean(details.existing_review_id),
      existing_review_id: details.existing_review_id ?? null,
    };
  },
};
