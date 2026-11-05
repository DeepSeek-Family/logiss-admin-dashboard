import type {
  IIncidentReport,
  IIncidentReportTrip,
  IReportUser,
} from "@/redux/apivtwo/dashboardOnvording";

export const statusLabel = (status: string) => {
  const key = status.toLowerCase();
  if (key === "approved") return "Solved";
  if (key === "rejected") return "Rejected";
  return status.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const reportStatusVariant = (status: string) => {
  const key = status.toLowerCase();
  if (key === "pending" || key === "open" || key === "reviewing") return "warning";
  if (key === "approved" || key === "resolved" || key === "completed" || key === "closed")
    return "accent";
  if (key === "rejected" || key === "cancelled" || key === "canceled") return "urgent";
  return "primary";
};

export const reportStatusClass = (status: string) => {
  const variant = reportStatusVariant(status);
  if (variant === "warning") return { text: "text-warning", dot: "bg-warning" };
  if (variant === "accent") return { text: "text-accent", dot: "bg-accent" };
  if (variant === "urgent") return { text: "text-urgent", dot: "bg-urgent" };
  return { text: "text-primary", dot: "bg-primary" };
};

export const isMongoId = (value: string) => /^[a-f\d]{24}$/i.test(value.trim());

const isPopulatedUser = (user: IReportUser): boolean =>
  Boolean(
    user.firstName?.trim() ||
    user.middleName?.trim() ||
    user.lastName?.trim() ||
    user.email?.trim(),
  );

export const formatReportUser = (user?: IReportUser | string | null): string => {
  if (!user) return "Unknown user";
  if (typeof user === "string") {
    const trimmed = user.trim();
    if (!trimmed || isMongoId(trimmed)) return "Unknown user";
    return trimmed;
  }
  const parts = [user.firstName, user.middleName, user.lastName]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (user.email?.trim()) return user.email.trim();
  return "Unknown user";
};

export const resolveReportPerson = (
  report: IIncidentReport | null | undefined,
  field: "userId" | "reportedBy",
  fallback?: IIncidentReport | null,
): IReportUser | undefined => {
  const read = (source?: IIncidentReport | null): IReportUser | undefined => {
    const value = source?.[field];
    if (!value) return undefined;
    if (typeof value === "object" && isPopulatedUser(value)) return value;
    return undefined;
  };
  return read(report) ?? read(fallback);
};

export const reportPersonName = (
  report: IIncidentReport | null | undefined,
  field: "userId" | "reportedBy",
  fallback?: IIncidentReport | null,
): string => formatReportUser(resolveReportPerson(report, field, fallback));

export const reportPersonEmail = (
  report: IIncidentReport | null | undefined,
  field: "userId" | "reportedBy",
  fallback?: IIncidentReport | null,
): string | undefined => resolveReportPerson(report, field, fallback)?.email?.trim();

export const reportCategory = (report: IIncidentReport): string =>
  report.documents?.trim() || "Untitled report";

export const reportReasonText = (report: IIncidentReport): string => report.reason?.trim() || "";

export const reportTrip = (report: IIncidentReport): IIncidentReportTrip | null => {
  if (report.tripId == null) return null;
  if (typeof report.tripId === "string") {
    return report.tripId ? { _id: report.tripId } : null;
  }
  return report.tripId;
};

export const reportCardSubtitle = (report: IIncidentReport): string => {
  const reason = reportReasonText(report);
  const reporter = reportPersonName(report, "reportedBy");
  const trip = reportTrip(report);
  const tripLabel = trip?.tripType ? trip.tripType.replace(/_/g, "-") : "";
  const parts = [reportCategory(report)];
  if (reason) parts.push(reason);
  else if (tripLabel) parts.push(tripLabel);
  parts.push(`Filed by ${reporter}`);
  return parts.join(" · ");
};

export const parseReportCoordinates = (value: unknown): { lat: number; lng: number } | null => {
  const validPair = (first: number, second: number) => {
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    if (Math.abs(first) > 90 && Math.abs(first) <= 180 && Math.abs(second) <= 90) {
      return { lat: second, lng: first };
    }
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      return { lat: first, lng: second };
    }
    return null;
  };

  if (Array.isArray(value) && value.length >= 2) {
    return validPair(Number(value[0]), Number(value[1]));
  }

  if (value && typeof value === "object") {
    const point = value as Record<string, unknown>;
    const nested =
      point.location && typeof point.location === "object"
        ? (point.location as Record<string, unknown>)
        : point;
    const first = nested.lng ?? nested.longitude ?? nested.lat ?? nested.latitude;
    const second = nested.lat ?? nested.latitude ?? nested.lng ?? nested.longitude;
    if (first != null && second != null) {
      return validPair(Number(first), Number(second));
    }
  }

  const text = String(value ?? "").trim();
  const separated = text.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (separated) {
    const pair = validPair(Number(separated[1]), Number(separated[2]));
    if (pair) return pair;
  }

  const compactCandidates: Array<{ point: { lat: number; lng: number }; score: number }> = [];
  const firstDecimalIndex = text.indexOf(".");
  for (let decimalIndex = firstDecimalIndex + 1; decimalIndex < text.length; decimalIndex += 1) {
    if (text[decimalIndex] !== ".") continue;
    for (let splitAt = firstDecimalIndex + 5; splitAt < decimalIndex; splitAt += 1) {
      const firstPart = text.slice(0, splitAt);
      const secondPart = text.slice(splitAt);
      if (!/^-?\d{1,3}\.\d{4,10}$/.test(firstPart) || !/^-?\d{1,2}\.\d{4,10}$/.test(secondPart))
        continue;

      const point = validPair(Number(firstPart), Number(secondPart));
      if (!point) continue;
      const degreeDigits = secondPart.match(/^-?(\d+)/)?.[1].length ?? 0;
      compactCandidates.push({ point, score: degreeDigits });
    }
  }

  compactCandidates.sort((a, b) => b.score - a.score);
  return compactCandidates[0]?.point ?? null;
};
