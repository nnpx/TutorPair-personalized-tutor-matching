import apiClient from '../../services/api-client';
import type {
  ApiResponse,
  MatchResultDto,
  ConfirmSelectionResultDto,
  ConfirmTutorSelectionInput,
  MatchHistoryItemDto,
} from '@tutorpair/shared';

export const matchingApi = {
  /**
   * Runs the Stage 1 & 2 matching engine to produce Top 3 recommendations.
   */
  async runMatch(variantId: string): Promise<MatchResultDto> {
    const res = await apiClient.post<ApiResponse<MatchResultDto>>('/api/matching', {
      variant_id: variantId,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to calculate tutor matches');
    }
    return res.data.data;
  },

  /**
   * Student confirms exactly 1 tutor from their Top 3.
   */
  async confirmSelection(
    matchRequestId: string,
    data: ConfirmTutorSelectionInput
  ): Promise<ConfirmSelectionResultDto> {
    const res = await apiClient.post<ApiResponse<ConfirmSelectionResultDto>>(
      `/api/matching/${matchRequestId}/confirm`,
      data
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to confirm tutor selection');
    }
    return res.data.data;
  },

  /**
   * Fetches the complete matching history for the authenticated student (TP-34).
   */
  async getHistory(): Promise<MatchHistoryItemDto[]> {
    const res = await apiClient.get<ApiResponse<MatchHistoryItemDto[]>>('/api/matching/history');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch match history');
    }
    return res.data.data;
  },
};
