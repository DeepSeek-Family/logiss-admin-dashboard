import { AUTH_TOKEN_KEY } from "@/constants/auth-storage";

/** API and media base URLs from `.env`. */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) || "",
  imageBaseUrl: (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined) || "",
};

export const getAuthToken = (): string | null => {
  try {
    return (
      window.localStorage.getItem(AUTH_TOKEN_KEY) || window.localStorage.getItem("logiss-token")
    );
  } catch {
    return null;
  }
};
