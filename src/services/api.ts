import { env, getAuthToken } from '@/config/env';
import toast from 'react-hot-toast';
import { isTokenExpired, handleAuthSessionExpired, handleForbiddenAccess } from '@/utils/authSession';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  params?: Record<string, string | undefined>;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string, params?: Record<string, string | undefined>) {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.params), {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    });
  } catch (err: any) {
    toast.error('Network error: Unable to connect to server. Please check your internet connection.', {
      id: 'fetch-network-error',
    });
    throw new ApiError(0, err?.message || 'Network connection failed');
  }

  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      /* non-JSON response body */
    }

    const errorMessage =
      errorData?.message ||
      errorData?.error ||
      `API ${options.method || 'GET'} ${path} failed (${res.status})`;

    const isAuthPath =
      path.includes('login') ||
      path.includes('forgot-password') ||
      path.includes('verify-email') ||
      path.includes('reset-password') ||
      path.includes('resend-otp');

    if (!isAuthPath) {
      if (res.status === 401) {
        handleAuthSessionExpired({ reason: errorData?.message || 'Session expired. Please log in again.' });
      } else if (res.status === 403) {
        handleForbiddenAccess({
          message: errorData?.message || 'Access forbidden (403): Redirecting to login...',
        });
      }
    } else if (res.status >= 500) {
      toast.error(errorMessage || `Server error (${res.status}). Please try again later.`, {
        id: `api-server-error-${res.status}`,
      });
    }

    throw new ApiError(res.status, errorMessage, errorData);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | undefined>) =>
    request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

