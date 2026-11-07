import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../reviews.api';
import type { CreateReviewInput } from '@tutorpair/shared';
import { MATCHING_QUERY_KEYS } from '../../matching/hooks/useMatching';

export const REVIEWS_QUERY_KEYS = {
  tutor: (tutorId: string) => ['reviews', 'tutor', tutorId] as const,
  recommendation: (recId: string) => ['reviews', 'recommendation', recId] as const,
};

export function useTutorReviews(tutorId: string) {
  return useQuery({
    queryKey: REVIEWS_QUERY_KEYS.tutor(tutorId),
    queryFn: () => reviewsApi.getTutorReviews(tutorId),
    enabled: Boolean(tutorId),
  });
}

export function useRecommendationReviewContext(recommendationId: string) {
  return useQuery({
    queryKey: REVIEWS_QUERY_KEYS.recommendation(recommendationId),
    queryFn: () => reviewsApi.getRecommendationContext(recommendationId),
    enabled: Boolean(recommendationId),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewInput) => reviewsApi.submitReview(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MATCHING_QUERY_KEYS.history });
      queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEYS.tutor(variables.tutor_id) });
      queryClient.invalidateQueries({ queryKey: ['tutors', variables.tutor_id] });
    },
  });
}
