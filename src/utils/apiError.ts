import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "The request could not be completed. Please check the information and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested information could not be found.",
  409: "This change conflicts with existing information. Refresh and try again.",
  422: "Some information is invalid. Please review the highlighted fields.",
  429: "Too many requests. Please wait a moment and try again.",
};

/** Returns a safe, consistent message without leaking server internals. */
export const getUserFacingApiError = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const queryError = error as FetchBaseQueryError;
  if (queryError.status === "FETCH_ERROR") {
    return "Unable to connect. Check your internet connection and try again.";
  }
  if (queryError.status === "TIMEOUT_ERROR") {
    return "The request took too long. Please try again.";
  }
  if (queryError.status === "PARSING_ERROR") {
    return "The server returned an unexpected response. Please try again.";
  }

  if (typeof queryError.status === "number") {
    if (STATUS_MESSAGES[queryError.status]) return STATUS_MESSAGES[queryError.status];
    if (queryError.status >= 500) {
      return "The service is temporarily unavailable. Please try again later.";
    }
  }

  const payload = "data" in queryError ? (queryError.data as ApiErrorPayload | undefined) : undefined;
  const message = payload?.message;
  return typeof message === "string" && message.length <= 160
    ? message
    : "Something went wrong. Please try again.";
};
