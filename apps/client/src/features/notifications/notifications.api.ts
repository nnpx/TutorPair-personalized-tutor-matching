import apiClient from '../../services/api-client';
import type { ApiResponse, NotificationListResponseDto } from '@tutorpair/shared';

export const notificationsApi = {
  async getNotifications(unreadOnly = false): Promise<NotificationListResponseDto> {
    const res = await apiClient.get<ApiResponse<NotificationListResponseDto>>('/api/notifications', {
      params: unreadOnly ? { unread: 'true' } : undefined,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch notifications');
    }
    return res.data.data;
  },

  async markAsRead(id: string): Promise<{ id: string; is_read: boolean }> {
    const res = await apiClient.patch<ApiResponse<{ id: string; is_read: boolean }>>(`/api/notifications/${id}/read`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to mark notification as read');
    }
    return res.data.data;
  },

  async markAllAsRead(): Promise<void> {
    const res = await apiClient.post<ApiResponse<null>>('/api/notifications/read-all');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to mark all notifications as read');
    }
  },
};
