import { AlertOctagon, AlertTriangle, ShieldAlert } from 'lucide-react';
import { timeAgo } from '@/utils/helpers';

export const SEVERITY = {
  high:   { icon: AlertOctagon,  iconClass: 'text-urgent',  dot: 'bg-urgent',  label: 'High'   },
  medium: { icon: AlertTriangle, iconClass: 'text-warning', dot: 'bg-warning', label: 'Medium' },
  low:    { icon: ShieldAlert,   iconClass: 'text-accent',  dot: 'bg-accent',  label: 'Low'    },
};

interface ReportCardProps {
  report: any;
  selected: boolean;
  onClick: () => void;
}

export const ReportCard = ({ report, selected, onClick }: ReportCardProps) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-line-2 transition-colors relative ${
        selected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-bg/60 border-l-2 border-l-transparent'
      }`}
    >
      {/* Severity dot + title + priority */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
          <p className="text-sm font-medium text-ink truncate">{report.type}</p>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${sev.iconClass}`}>{sev.label}</span>
      </div>
      {/* ID + time */}
      <div className="flex items-center justify-between mt-1 pl-4">
        <span className="text-xs text-ink-4">{report.id}</span>
        <span className="text-xs text-ink-4">{timeAgo(report?.submitted)}</span>
      </div>
    </button>
  );
};
