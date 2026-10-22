import { FileWarning } from 'lucide-react';
import { Card, Badge } from '@/shared/components/ui';
import type { IIncidentReport } from '@/redux/apivtwo/dashboardOnvording';
import { formatReportUser, reportCategory, statusLabel } from '@/features/reports/utils/helpers';

interface OpenReportsPanelProps {
  openReports: IIncidentReport[];
  onReviewClick: () => void;
}

export const OpenReportsPanel = ({ openReports, onReviewClick }: OpenReportsPanelProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileWarning size={14} className="text-urgent" />
          <h3 className="text-xs font-medium text-ink">Open Reports</h3>
        </div>
        <button
          type="button"
          onClick={onReviewClick}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </button>
      </div>
      <div className="divide-y divide-line-2">
        {openReports.slice(0, 4).map((report) => (
          <div
            key={report._id}
            onClick={onReviewClick}
            onKeyDown={(e) => e.key === 'Enter' && onReviewClick()}
            role="button"
            tabIndex={0}
            className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink truncate">{reportCategory(report)}</p>
              <p className="text-xs text-ink-4 truncate">
                By {formatReportUser(report.reportedBy)}
              </p>
            </div>
            <Badge variant="warning" className="flex-shrink-0 ml-2">
              {statusLabel(report.reportStatus)}
            </Badge>
          </div>
        ))}
        {openReports.length === 0 && (
          <p className="px-4 py-5 text-xs text-ink-4 text-center font-medium">No open reports ✓</p>
        )}
      </div>
    </Card>
  );
};
