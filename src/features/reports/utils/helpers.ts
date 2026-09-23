import type { IIncidentReport, IIncidentReportTrip } from "@/redux/apivtwo/dashboardOnvording";

export const statusLabel = (status: string) =>
  status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const reportStatusVariant = (status: string) => {
  const key = status.toLowerCase();
  if (key === "pending" || key === "open" || key === "reviewing") return "warning";
  if (key === "resolved" || key === "completed" || key === "closed") return "accent";
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

export const reportTrip = (report: IIncidentReport): IIncidentReportTrip | null => {
  if (!report.tripId || typeof report.tripId === "string") return null;
  return report.tripId;
};
