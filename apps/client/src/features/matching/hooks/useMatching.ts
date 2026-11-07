import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '../matching.api';
import type { ConfirmTutorSelectionInput } from '@tutorpair/shared';

export const MATCHING_QUERY_KEYS = {
  history: ['matching', 'history'] as const,
};

export function useMatchHistory() {
  return useQuery({
    queryKey: MATCHING_QUERY_KEYS.history,
    queryFn: matchingApi.getHistory,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRunMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => matchingApi.runMatch(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCHING_QUERY_KEYS.history });
    },
  });
}

export function useConfirmTutor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchRequestId,
      data,
    }: {
      matchRequestId: string;
      data: ConfirmTutorSelectionInput;
    }) => matchingApi.confirmSelection(matchRequestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCHING_QUERY_KEYS.history });
    },
  });
}
