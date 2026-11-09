import { Flag, AlertTriangle } from "lucide-react";
import { Card, Badge, Button } from "@/shared/components/ui";
import { useGetAllReportsQuery } from "@/redux/apivtwo/dashboardOnvording";
import { Loader } from "@/shared/Lodder";
import { timeAgo } from "@/utils/helpers";
import { reportCardSubtitle, reportCategory, statusLabel } from "@/features/reports/utils/helpers";

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

export const ActiveIncidents = ({ onNavigate }: ActiveIncidentsProps) => {
  const {
    data: reportsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetAllReportsQuery({ page: 1, limit: 50 });

  const reports = reportsResponse?.data ?? [];

  const preview = [...reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, PREVIEW_LIMIT);

  return (
    <Card className="p-6 shadow-sm border-line-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
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
            const when = timeAgo(report.createdAt);
            const subtitle = reportCardSubtitle(report);
            return (
              <div
                key={report._id}
                className="flex items-center justify-between p-3 transition-colors border border-transparent shadow-sm cursor-pointer bg-bg hover:bg-line-2 rounded-xl hover:border-line-2"
                onClick={() => onNavigate("/reports")}
              >
                <div className="flex items-center min-w-0 gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone.icon}`}
                  >
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-ink">
                      {reportCategory(report)}
                    </p>
                    <p className="text-xs truncate text-ink-4">
                      {subtitle} · {when}
                    </p>
                  </div>
                </div>
                <Badge variant={tone.badge} className="ml-3 shrink-0">
                  {statusLabel(report.reportStatus)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
