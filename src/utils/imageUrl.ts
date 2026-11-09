const stripApiPrefix = (base: string): string =>
  base.replace(/\/api\/v\d+\/?$/i, "").replace(/\/$/, "");

/** Paths served as static files on the API host (not under `/api/v1`). */
export const isStaticMediaPath = (path: string): boolean => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return /^\/image/i.test(p) || /^\/uploads\//i.test(p);
};

/** Host used for `/image/...` static files (not the `/api/v1` JSON base). */
export const getMediaOrigin = (): string => {
  const imageBase = (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined)?.trim();
  if (imageBase) {
    return stripApiPrefix(imageBase);
  }
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (apiBase) {
    return stripApiPrefix(apiBase);
  }
  return "";
};

/**
 * Build a URL for API-hosted images (profiles, mobility icons, licenses, etc.).
 * In dev, uses same-origin `/image/...` (Vite proxy) so private-network hosts work from localhost.
 */
export const imageUrl = (path?: string | null): string => {
  if (!path || typeof path !== "string") {
    return "";
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return "";
  }

  if (/^(?:data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  const isAbsoluteUrl = /^(?:https?:)?\/\//i.test(trimmed);
  let normalizedPath: string;
  if (isAbsoluteUrl) {
    try {
      const url = new URL(trimmed, "http://localhost");
      normalizedPath = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return trimmed;
    }
  } else {
    normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  if (import.meta.env.DEV && isStaticMediaPath(normalizedPath)) {
    return normalizedPath;
  }

  if (isAbsoluteUrl) {
    return trimmed;
  }

  const origin = getMediaOrigin();
  if (!origin) {
    return normalizedPath;
  }

  return `${origin}${normalizedPath}`;
};

/** Same as `imageUrl`, but returns `undefined` when empty (handy for optional `src` props). */
export const resolveMediaUrl = (path?: string | null): string | undefined => {
  const url = imageUrl(path);
  return url || undefined;
};
