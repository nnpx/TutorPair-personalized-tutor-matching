import { and, eq, desc, avg, count } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.js';
import {
  reviews,
  tutors,
  tutorSubjects,
  students,
  matchRequests,
  matchRecommendations,
  subjectVariants,
  subjects,
  Review,
} from '../../db/schema/index.js';
import { notificationService } from '../../common/notifications/notification.service.js';
import { NotFoundError } from '../../common/errors/http-errors.js';
import { NotificationEventType, MatchRequestStatus, type ReviewItemDto, type TutorReviewsSummaryDto } from '@tutorpair/shared';

export interface InsertReviewParams {
  student_id: string;
  tutor_id: string;
  recommendation_id: string;
  rating_knowledge: number;
  rating_preparation: number;
  rating_clarity: number;
  rating_punctuality: number;
  overall_rating: number;
  comment?: string | null;
}

export const reviewsRepository = {
  /**
   * Verifies that the recommendation belongs to a confirmed match request for this student
   * and that the tutor matches.
   */
  async findEligibleConfirmedRecommendation(studentId: string, recommendationId: string) {
    const [row] = await db
      .select({
        recommendation_id: matchRecommendations.id,
        tutor_id: matchRecommendations.tutor_id,
        student_id: matchRequests.student_id,
        status: matchRequests.status,
        is_selected: matchRecommendations.is_selected,
      })
      .from(matchRecommendations)
      .innerJoin(matchRequests, eq(matchRecommendations.match_request_id, matchRequests.id))
      .where(
        and(
          eq(matchRecommendations.id, recommendationId),
          eq(matchRequests.student_id, studentId)
        )
      )
      .limit(1);

    return row ?? null;
  },

  /**
   * Checks whether this recommendation has already been reviewed.
   */
  async findReviewByRecommendationId(recommendationId: string): Promise<Review | null> {
    const [row] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.recommendation_id, recommendationId))
      .limit(1);

    return row ?? null;
  },

  /**
   * Details needed by the review submission page before submitting (TP-30).
   */
  async findRecommendationForReview(recommendationId: string, studentId: string) {
    const [row] = await db
      .select({
        recommendation_id: matchRecommendations.id,
        tutor_id: tutors.user_id,
        first_name: tutors.first_name,
        last_name: tutors.last_name,
        hourly_rate: tutorSubjects.hourly_rate,
        tutor_type: tutors.tutor_type,
        variant_name: subjectVariants.name,
        subject_name: subjects.name,
        status: matchRequests.status,
        is_selected: matchRecommendations.is_selected,
        existing_review_id: reviews.id,
      })
      .from(matchRecommendations)
      .innerJoin(matchRequests, eq(matchRecommendations.match_request_id, matchRequests.id))
      .innerJoin(tutors, eq(matchRecommendations.tutor_id, tutors.user_id))
      .innerJoin(subjectVariants, eq(matchRequests.variant_id, subjectVariants.id))
      .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
      .leftJoin(
        tutorSubjects,
        and(
          eq(tutorSubjects.tutor_id, tutors.user_id),
          eq(tutorSubjects.variant_id, matchRequests.variant_id)
        )
      )
      .leftJoin(reviews, eq(reviews.recommendation_id, matchRecommendations.id))
      .where(
        and(
          eq(matchRecommendations.id, recommendationId),
          eq(matchRequests.student_id, studentId)
        )
      )
      .limit(1);

    return row ?? null;
  },

  /**
   * Inserts the new review and recalculates average_rating and review_count in one transaction.
   */
  async createReview(params: InsertReviewParams): Promise<Review> {
    return await db.transaction(async (tx: DbExecutor) => {
      const [newReview] = await tx
        .insert(reviews)
        .values({
          student_id: params.student_id,
          tutor_id: params.tutor_id,
          recommendation_id: params.recommendation_id,
          rating_knowledge: params.rating_knowledge,
          rating_preparation: params.rating_preparation,
          rating_clarity: params.rating_clarity,
          rating_punctuality: params.rating_punctuality,
          overall_rating: params.overall_rating.toFixed(2),
          comment: params.comment ?? null,
        })
        .returning();

      // Recalculate average_rating and count
      const allTutorReviews = await tx
        .select({ overall: reviews.overall_rating })
        .from(reviews)
        .where(eq(reviews.tutor_id, params.tutor_id));

      const reviewCount = allTutorReviews.length;
      const sum = allTutorReviews.reduce((acc, r) => acc + Number(r.overall), 0);
      const avgRating = reviewCount > 0 ? (sum / reviewCount).toFixed(2) : '0.00';

      await tx
        .update(tutors)
        .set({
          average_rating: avgRating,
          review_count: reviewCount,
        })
        .where(eq(tutors.user_id, params.tutor_id));

      await notificationService.createNotification(
        {
          userId: params.tutor_id,
          eventType: NotificationEventType.NEW_REVIEW,
          message: 'A student has submitted a new verified review for your tutoring session.',
          requiresEmail: false,
        },
        tx
      );

      return newReview;
    });
  },

  /**
   * Retrieves all reviews and rating breakdown for a tutor (TP-19).
   */
  async getTutorReviewsSummary(tutorId: string): Promise<TutorReviewsSummaryDto> {
    const rows = await db
      .select({
        id: reviews.id,
        student_id: reviews.student_id,
        student_first_name: students.first_name,
        student_last_name: students.last_name,
        tutor_id: reviews.tutor_id,
        recommendation_id: reviews.recommendation_id,
        rating_knowledge: reviews.rating_knowledge,
        rating_preparation: reviews.rating_preparation,
        rating_clarity: reviews.rating_clarity,
        rating_punctuality: reviews.rating_punctuality,
        overall_rating: reviews.overall_rating,
        comment: reviews.comment,
        created_at: reviews.created_at,
      })
      .from(reviews)
      .innerJoin(students, eq(reviews.student_id, students.user_id))
      .where(eq(reviews.tutor_id, tutorId))
      .orderBy(desc(reviews.created_at));

    const [tutorRow] = await db
      .select({
        average_rating: tutors.average_rating,
        review_count: tutors.review_count,
      })
      .from(tutors)
      .where(eq(tutors.user_id, tutorId))
      .limit(1);

    if (!tutorRow) {
      throw new NotFoundError('Tutor not found');
    }

    if (rows.length === 0) {
      const fallbackAvg = parseFloat(tutorRow.average_rating);
      const fallbackCount = tutorRow.review_count;

      return {
        tutor_id: tutorId,
        average_rating: fallbackAvg,
        review_count: fallbackCount,
        rating_breakdown: {
          knowledge: fallbackAvg,
          preparation: fallbackAvg,
          clarity: fallbackAvg,
          punctuality: fallbackAvg,
        },
        reviews: [],
      };
    }

    const count = rows.length;
    const sumKnowledge = rows.reduce((acc, r) => acc + r.rating_knowledge, 0);
    const sumPrep = rows.reduce((acc, r) => acc + r.rating_preparation, 0);
    const sumClarity = rows.reduce((acc, r) => acc + r.rating_clarity, 0);
    const sumPunctuality = rows.reduce((acc, r) => acc + r.rating_punctuality, 0);
    const sumOverall = rows.reduce((acc, r) => acc + Number(r.overall_rating), 0);

    const formatStudentName = (first: string, last: string) => {
      if (!last) return first;
      return `${first} ${last.charAt(0).toUpperCase()}.`;
    };

    const reviewItems: ReviewItemDto[] = rows.map((r) => ({
      id: r.id,
      student_id: r.student_id,
      student_name: formatStudentName(r.student_first_name, r.student_last_name),
      tutor_id: r.tutor_id,
      recommendation_id: r.recommendation_id,
      rating_knowledge: r.rating_knowledge,
      rating_preparation: r.rating_preparation,
      rating_clarity: r.rating_clarity,
      rating_punctuality: r.rating_punctuality,
      overall_rating: Number(r.overall_rating),
      comment: r.comment,
      created_at: r.created_at.toISOString(),
    }));

    const displayReviewCount = tutorRow?.review_count && tutorRow.review_count > count
      ? tutorRow.review_count
      : count;
    const displayAverageRating = tutorRow?.average_rating && tutorRow.review_count > count
      ? parseFloat(tutorRow.average_rating)
      : Math.round((sumOverall / count) * 100) / 100;

    return {
      tutor_id: tutorId,
      average_rating: displayAverageRating,
      review_count: displayReviewCount,
      rating_breakdown: {
        knowledge: Math.round((sumKnowledge / count) * 10) / 10,
        preparation: Math.round((sumPrep / count) * 10) / 10,
        clarity: Math.round((sumClarity / count) * 10) / 10,
        punctuality: Math.round((sumPunctuality / count) * 10) / 10,
      },
      reviews: reviewItems,
    };
  },
};
