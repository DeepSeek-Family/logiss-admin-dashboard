import { AUTH_TOKEN_KEY } from '@/constants/auth-storage';

/** Swap mock → live API without touching pages. Set in `.env`. */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) || '',
  imageBaseUrl: (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) || '',
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
};

export const getAuthToken = (): string | null => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || window.localStorage.getItem('logiss-token');
  } catch {
    return null;
  }
};
