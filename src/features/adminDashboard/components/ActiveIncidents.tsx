import { Flag, AlertTriangle } from "lucide-react";
import { Card, Badge, Button } from "@/shared/components/ui";
import {
  useGetAllReportsQuery,
  type IIncidentReport,
} from "@/redux/apivtwo/dashboardOnvording";
import { Loader } from "@/shared/Lodder";
import { timeAgo, tripTypeLabel } from "@/utils/helpers";

interface ActiveIncidentsProps {
  onNavigate: (path: string) => void;
}

const PREVIEW_LIMIT = 5;

const statusTone = (status: string) => {
  const key = status.toLowerCase();
  if (key === "pending" || key === "open" || key === "reviewing") {
    return { badge: "warning", icon: "bg-warning-light text-warning-dark" };
  }
  if (key === "resolved" || key === "completed" || key === "closed") {
    return { badge: "accent", icon: "bg-accent-light text-accent" };
  }
  if (key === "rejected" || key === "cancelled" || key === "canceled") {
    return { badge: "urgent", icon: "bg-urgent-light text-urgent" };
  }
  return { badge: "primary", icon: "bg-primary-light text-primary" };
};

const tripDetail = (report: IIncidentReport) => {
  const trip = report.tripId;
  if (!trip || typeof trip === "string") return "";
  return trip.tripReason || (trip.tripType ? tripTypeLabel(trip.tripType) : "");
};

export const ActiveIncidents = ({ onNavigate }: ActiveIncidentsProps) => {
  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
  } = useGetAllReportsQuery();

  const preview = [...reports]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, PREVIEW_LIMIT);

  return (
    <Card className="p-6 border-line-2 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Flag size={16} className="text-urgent" /> Active Incident Reports
        </h3>
        <button
          onClick={() => onNavigate("/reports")}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </button>
      </div>

      {isLoading ? (
        <Loader message="Loading incident reports..." />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <p className="text-sm text-ink-4">Could not load incident reports.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : preview.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-ink-4">No incident reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {preview.map((report) => {
            const tone = statusTone(report.reportStatus);
            const detail = tripDetail(report);
            const when = timeAgo(report.createdAt);
            return (
              <div
                key={report._id}
                className="flex items-center justify-between p-3 bg-bg hover:bg-line-2 transition-colors rounded-xl cursor-pointer shadow-sm border border-transparent hover:border-line-2"
                onClick={() => onNavigate("/reports")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone.icon}`}
                  >
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink truncate">
                      {report.documents}
                    </p>
                    <p className="text-xs text-ink-4 truncate">
                      {detail ? `${detail} · ${when}` : when}
                    </p>
                  </div>
                </div>
                <Badge variant={tone.badge} className="shrink-0 ml-3">
                  {report.reportStatus}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
