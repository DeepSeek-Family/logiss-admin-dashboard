import { FileWarning } from 'lucide-react';
import { Card, Badge } from '@/shared/components/ui';

interface OpenReportsPanelProps {
  openReports: any[];
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
        <button onClick={onReviewClick} className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <div className="divide-y divide-line-2">
        {openReports.slice(0, 4).map((report: any) => (
          <div
            key={report?.id}
            onClick={onReviewClick}
            className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink truncate">{report?.type || 'Incident'}</p>
              <p className="text-xs text-ink-4">By {report?.filedBy?.name || 'Unknown'}</p>
            </div>
            <Badge variant={report?.severity === 'high' ? 'urgent' : 'warning'} className="flex-shrink-0 ml-2">
              {report?.severity || 'medium'}
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
