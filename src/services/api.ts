import { env, getAuthToken } from '@/config/env';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  params?: Record<string, string | undefined>;
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
  const res = await fetch(buildUrl(path, options.params), {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`API ${options.method || 'GET'} ${path} failed (${res.status})`);
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
