const ACCESS_TOKEN_KEY = 'pawaacflow_access_token';
const REFRESH_TOKEN_KEY = 'pawaacflow_refresh_token';
const USER_KEY = 'pawaacflow_user';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setStoredUser(user: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}
