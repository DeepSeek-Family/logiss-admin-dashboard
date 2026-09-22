/**
 * Build a full URL for API-hosted images (profiles, mobility icons, licenses, etc.).
 * Paths from the API are usually relative, e.g. `/image/logo-123.png`.
 */
export const imageUrl = (path?: string | null): string => {
  if (!path || typeof path !== 'string') {
    return '';
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const baseUrl = (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) || '';
  // Uploads are served from the host root, not under `/api/v1`
  const origin = baseUrl.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return origin ? `${origin}${normalizedPath}` : normalizedPath;
};

/** Same as `imageUrl`, but returns `undefined` when empty (handy for optional `src` props). */
export const resolveMediaUrl = (path?: string | null): string | undefined => {
  const url = imageUrl(path);
  return url || undefined;
};
