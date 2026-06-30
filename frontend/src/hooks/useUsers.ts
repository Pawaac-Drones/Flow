import { useQuery } from '@tanstack/react-query';
import { getList } from '@/lib/api';
import { IUser } from '@pawaacflow/shared/types/user';

export function useUsers() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => getList<IUser>('/users'),
  });

  return { users };
}
