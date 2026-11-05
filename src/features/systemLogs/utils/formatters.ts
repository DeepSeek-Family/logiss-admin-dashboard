import type { SystemLog } from "@/redux/api/systemLogsApi";

export const humanizeFieldName = (fieldName: string): string =>
  String(fieldName || "Field")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const formatAuditValue = (value: unknown): string => {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) {
    if (value.every((item) => ["string", "number", "boolean"].includes(typeof item))) {
      return value.map(formatAuditValue).join(", ") || "—";
    }
    return JSON.stringify(value, null, 2);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const formatLogTimestamp = (timestamp?: string): string => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
};

export const getSystemLogActorName = (log: SystemLog): string => {
  if (!log.actorId || typeof log.actorId === "string") return "Unknown user";
  return (
    [log.actorId.firstName, log.actorId.middleName, log.actorId.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown user"
  );
};

export const getSystemLogActorEmail = (log: SystemLog): string =>
  (typeof log.actorId === "object" && log.actorId?.email) || log.actorEmail || "—";

export const isJsonLikeValue = (value: unknown): boolean =>
  typeof value === "object" && value !== null;
