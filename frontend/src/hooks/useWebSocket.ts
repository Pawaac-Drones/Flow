import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, onSocketEvent } from '@/lib/socket';
import { getAccessToken } from '@/lib/auth';

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    connectSocket();

    const unsubBoardUpdate = onSocketEvent('board-update', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    const unsubTaskUpdated = onSocketEvent('task-updated', (data: unknown) => {
      const taskData = data as { id?: string };
      if (taskData?.id) {
        queryClient.invalidateQueries({ queryKey: ['task', taskData.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    const unsubNotification = onSocketEvent('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      unsubBoardUpdate();
      unsubTaskUpdated();
      unsubNotification();
      disconnectSocket();
    };
  }, [queryClient]);
}
