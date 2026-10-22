import type { IIncidentReport } from "@/redux/apivtwo/dashboardOnvording";
import { timeAgo } from "@/utils/helpers";
import {
  reportCardSubtitle,
  reportPersonName,
  reportStatusClass,
  statusLabel,
} from "../utils/helpers";

interface ReportCardProps {
  report: IIncidentReport;
  selected: boolean;
  onClick: () => void;
}

export const ReportCard = ({ report, selected, onClick }: ReportCardProps) => {
  const tone = reportStatusClass(report.reportStatus);
  const subjectName = reportPersonName(report, "userId");
  const subtitle = reportCardSubtitle(report);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-line-2 transition-colors relative ${
        selected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-bg/60 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />
          <p className="text-sm font-medium text-ink truncate">{subjectName}</p>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${tone.text}`}>
          {statusLabel(report.reportStatus)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1 pl-4 gap-3">
        <span className="text-xs text-ink-4 truncate" title={subtitle}>
          {subtitle}
        </span>
        <span className="text-xs text-ink-4 shrink-0">{timeAgo(report.createdAt)}</span>
      </div>
    </button>
  );
};
