import apiClient from '../../services/api-client';
import type {
  ApiResponse,
  CreateReviewInput,
  TutorReviewsSummaryDto,
} from '@tutorpair/shared';

export interface RecommendationReviewContextDto {
  recommendation_id: string;
  tutor_id: string;
  tutor_name: string;
  tutor_type: string;
  hourly_rate: number;
  subject_name: string;
  variant_name: string;
  already_reviewed: boolean;
  existing_review_id: string | null;
}

export const reviewsApi = {
  /**
   * TP-30: Submits a 4-category review with written feedback.
   */
  async submitReview(data: CreateReviewInput): Promise<{ review_id: string; overall_rating: number }> {
    const res = await apiClient.post<ApiResponse<{ review_id: string; overall_rating: number }>>(
      '/api/reviews',
      data
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to submit tutor review');
    }
    return res.data.data;
  },

  /**
   * TP-19: Fetches reviews and 4-metric score breakdown for a tutor.
   */
  async getTutorReviews(tutorId: string): Promise<TutorReviewsSummaryDto> {
    const res = await apiClient.get<ApiResponse<TutorReviewsSummaryDto>>(
      `/api/reviews/tutor/${tutorId}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch tutor reviews');
    }
    return res.data.data;
  },

  /**
   * Fetches context for the review form (tutor name, subject, already reviewed check).
   */
  async getRecommendationContext(
    recommendationId: string
  ): Promise<RecommendationReviewContextDto> {
    const res = await apiClient.get<ApiResponse<RecommendationReviewContextDto>>(
      `/api/reviews/recommendation/${recommendationId}`
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch recommendation review details');
    }
    return res.data.data;
  },
};
