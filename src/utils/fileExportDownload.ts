import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export type FileExportType = "excel" | "csv" | "pdf";

/** Server builds export files on a worker; response may take several minutes. */
export const FILE_EXPORT_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

export const FILE_EXPORT_FALLBACK_NAMES = {
  tripHistory: {
    excel: "trip-history.xlsx",
    csv: "trip-history.csv",
    pdf: "trip-history.pdf",
  },
  payments: {
    excel: "payments.xlsx",
    csv: "payments.csv",
    pdf: "payments.pdf",
  },
} as const satisfies Record<string, Record<FileExportType, string>>;

export function parseContentDispositionFilename(disposition: string): string | null {
  if (!disposition) return null;

  const utf8Match = /filename\*=(?:UTF-8'')?([^;\n]+)/i.exec(disposition);
  if (utf8Match?.[1]) {
    const raw = utf8Match[1].replace(/^["']|["']$/g, "");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  const plainMatch = /filename="?([^";\n]+)"?/i.exec(disposition);
  return plainMatch?.[1]?.trim() || null;
}

export function downloadBlobFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseExportErrorMessage(error: FetchBaseQueryError): Promise<string> {
  const data = error.data;

  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as { message?: string };
      if (parsed?.message) return parsed.message;
    } catch {
      if (data.trim()) return data;
    }
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed?.message) return parsed.message;
      } catch {
        if (text.trim()) return text;
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof error.status === "number") {
    return `Export failed (${error.status})`;
  }

  return "Export failed";
}

type FileExportBaseQueryResult = {
  data?: unknown;
  error?: FetchBaseQueryError;
  meta?: { response?: Response };
};

export async function requestFileExport(
  // RTK `queryFn` baseQuery accepts FetchArgs; we pass a blob export shape.
  baseQuery: (args: Record<string, unknown>) => unknown,
  options: {
    url: string;
    params: Record<string, string | number | boolean>;
    type: FileExportType;
    fallbackFileName: string;
  },
): Promise<{ data: null } | { error: FetchBaseQueryError }> {
  const result = (await Promise.resolve(
    baseQuery({
      url: options.url,
      method: "GET",
      params: {
        ...options.params,
        type: options.type,
      },
      responseHandler: (response: Response) => response.blob(),
      cache: "no-cache",
      timeout: FILE_EXPORT_REQUEST_TIMEOUT_MS,
    }),
  )) as FileExportBaseQueryResult;

  if (result.error) {
    return { error: result.error };
  }

  const blob = result.data;
  if (!(blob instanceof Blob)) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: "Invalid export response",
        data: { message: "Export failed: invalid file response" },
      },
    };
  }

  const disposition = result.meta?.response?.headers.get("content-disposition") || "";
  const fileName = parseContentDispositionFilename(disposition) || options.fallbackFileName;
  downloadBlobFile(blob, fileName);
  return { data: null };
}
