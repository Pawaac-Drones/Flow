import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getList } from '@/lib/api';
import { INotification } from '@pawaacflow/shared/types/notification';

export function useNotifications() {
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getList<INotification>('/notifications'),
    refetchInterval: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications,
    markAsRead,
    markAllAsRead,
  };
}
