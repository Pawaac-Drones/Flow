import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { setTokens, clearTokens, setStoredUser, getStoredUser } from '@/lib/auth';
import { IUser, IAuthResponse, ILoginRequest, ICreateUser } from '@pawaacflow/shared/types/user';

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    const stored = getStoredUser<IUser>();
    if (stored) {
      setUser(stored);
    }
  }, []);

  const login = useMutation({
    mutationFn: (data: ILoginRequest) =>
      api.post<IAuthResponse>('/auth/login', data),
    onSuccess: (response) => {
      setTokens(response.accessToken, response.refreshToken);
      setStoredUser(response.user);
      setUser(response.user);
    },
  });

  const register = useMutation({
    mutationFn: (data: ICreateUser) =>
      api.post<IAuthResponse>('/auth/register', data),
    onSuccess: (response) => {
      setTokens(response.accessToken, response.refreshToken);
      setStoredUser(response.user);
      setUser(response.user);
    },
  });

  const logout = () => {
    clearTokens();
    setUser(null);
    queryClient.clear();
  };

  return {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}
