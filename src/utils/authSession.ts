import toast from 'react-hot-toast';
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  RESET_PASSWORD_TOKEN_KEY,
  ROLE_STORAGE_KEY,
  USER_STORAGE_KEY,
  LEGACY_AUTH_TOKEN_KEY,
  REDIRECT_AFTER_LOGIN_KEY,
} from '@/constants/auth-storage';
import { ROUTES } from '@/constants/routes';

/**
 * Checks whether a given JWT token is expired.
 * If the token is not a valid 3-segment JWT (e.g., mock token in demo mode),
 * it returns false so mock/demo mode continues to function properly.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Non-JWT token (e.g. 'mock_access_token'), treat as valid
      return false;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);

    if (typeof parsed?.exp === 'number') {
      // Expiration time is in seconds; check with 5s safety margin
      return parsed.exp * 1000 <= Date.now() + 5000;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Safely removes all authentication and identity keys from browser storage.
 */
export function clearAuthStorage(): void {
  try {
    if (typeof window === 'undefined') return;

    const keysToRemove = [
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      RESET_PASSWORD_TOKEN_KEY,
      ROLE_STORAGE_KEY,
      USER_STORAGE_KEY,
      LEGACY_AUTH_TOKEN_KEY,
    ];

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  } catch (err) {
    console.error('Error clearing auth storage:', err);
  }
}

/**
 * Safely redirects the browser to the login page without triggering redirect loops.
 */
export function redirectToLogin(reason?: 'expired' | 'forbidden' | 'logout'): void {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;

  // Prevent redirect loops if already on the login page
  if (currentPath === ROUTES.login) return;

  // Save the intended destination for post-login return
  if (currentPath && currentPath !== '/' && currentPath !== ROUTES.login) {
    try {
      window.sessionStorage.setItem(
        REDIRECT_AFTER_LOGIN_KEY,
        window.location.pathname + window.location.search
      );
    } catch {
      /* ignore */
    }
  }

  // Use replace to prevent back-button loops into restricted routes
  window.location.replace(ROUTES.login);
}

// Track toast timestamps to prevent toast storms from parallel requests
let lastExpiredToastTime = 0;
let lastForbiddenToastTime = 0;
const TOAST_COOLDOWN_MS = 3000;

/**
 * Handles expired token / 401 Unauthorized globally:
 * Clears storage, shows toast, and redirects to login page.
 */
export function handleAuthSessionExpired(options?: {
  reason?: string;
  dispatch?: (action: any) => void;
}): void {
  clearAuthStorage();

  const now = Date.now();
  if (now - lastExpiredToastTime > TOAST_COOLDOWN_MS) {
    lastExpiredToastTime = now;
    toast.error(options?.reason || 'Your session has expired. Please log in again.', {
      id: 'auth-session-expired',
      duration: 4000,
    });
  }

  redirectToLogin('expired');
}

/**
 * Handles 403 Forbidden globally:
 * Per requirements: immediately clears credentials, alerts user, and redirects to login page.
 */
export function handleForbiddenAccess(options?: {
  message?: string;
  dispatch?: (action: any) => void;
}): void {
  clearAuthStorage();

  const now = Date.now();
  if (now - lastForbiddenToastTime > TOAST_COOLDOWN_MS) {
    lastForbiddenToastTime = now;
    toast.error(
      options?.message || 'Access forbidden (403): You do not have permission. Redirecting to login...',
      {
        id: 'auth-forbidden-access',
        duration: 4000,
      }
    );
  }

  redirectToLogin('forbidden');
}

/**
 * Sets up a listener for storage events to synchronize logout/token removal across tabs.
 */
export function initCrossTabAuthSync(onLogout: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === AUTH_TOKEN_KEY || e.key === ROLE_STORAGE_KEY) {
      if (!e.newValue) {
        onLogout();
        if (window.location.pathname !== ROUTES.login) {
          redirectToLogin('logout');
        }
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
