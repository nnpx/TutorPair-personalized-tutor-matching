import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../notifications.api';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (unreadOnly = false) => ['notifications', { unreadOnly }] as const,
};

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(unreadOnly),
    queryFn: () => notificationsApi.getNotifications(unreadOnly),
    refetchInterval: 10000, // Reactive polling every 10 seconds
    staleTime: 5000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}
