import { AUTH_TOKEN_KEY } from '@/constants/auth-storage';

/** Swap mock → live API without touching pages. Set in `.env`. */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) || '',
  imageBaseUrl: (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) || '',
  /** Default false — set VITE_USE_MOCK=true only for local demo without API. */
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
};

export const getAuthToken = (): string | null => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || window.localStorage.getItem('logiss-token');
  } catch {
    return null;
  }
};
