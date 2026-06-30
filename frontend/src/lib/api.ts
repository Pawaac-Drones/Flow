import { getAccessToken, clearTokens } from './auth';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient(API_BASE_URL);

/**
 * Shape of paginated list responses returned by the backend.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount?: number;
  };
}

/**
 * Fetch a list endpoint and normalize the result to a plain array.
 *
 * Backend list endpoints return an envelope `{ data, meta }`, while a few
 * return a raw array. This helper unwraps both so callers always get `T[]`.
 */
export async function getList<T>(path: string): Promise<T[]> {
  const res = await api.get<PaginatedResponse<T> | T[]>(path);
  if (Array.isArray(res)) {
    return res;
  }
  return res?.data ?? [];
}
