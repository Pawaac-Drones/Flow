import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getList } from '@/lib/api';
import { IWhatsappUser } from '@pawaacflow/shared/types/whatsapp';

/**
 * Hook for the WhatsApp self-service settings screen.
 *
 * All endpoints live in the OpenWA module which is only mounted when
 * OPENWA_ENABLED=true on the backend. When it is disabled the queries fail;
 * callers should degrade gracefully using the `isError` flag.
 */
export function useWhatsapp() {
  const queryClient = useQueryClient();

  const numbers = useQuery({
    queryKey: ['whatsapp-numbers'],
    queryFn: () => getList<IWhatsappUser>('/openwa/whatsapp-users/me'),
    retry: false,
  });

  const linkNumber = useMutation({
    mutationFn: (phoneNumber: string) =>
      api.post<IWhatsappUser>('/openwa/whatsapp-users', { phoneNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] });
    },
  });

  const unlinkNumber = useMutation({
    mutationFn: (id: string) => api.delete(`/openwa/whatsapp-users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] });
    },
  });

  const enableDigest = useMutation({
    mutationFn: () => api.post('/openwa/digest/opt-in'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] });
    },
  });

  const disableDigest = useMutation({
    mutationFn: () => api.delete('/openwa/digest/opt-out'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-numbers'] });
    },
  });

  return {
    numbers,
    linkNumber,
    unlinkNumber,
    enableDigest,
    disableDigest,
  };
}
