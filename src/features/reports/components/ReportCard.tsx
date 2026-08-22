import { AlertOctagon, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import { timeAgo } from '@/utils/helpers';

export const SEVERITY = {
  high: { icon: AlertOctagon, iconClass: 'text-urgent', badge: 'urgent', bg: 'bg-urgent-light', label: 'High' },
  medium: { icon: AlertTriangle, iconClass: 'text-warning', badge: 'warning', bg: 'bg-warning-light', label: 'Medium' },
  low: { icon: ShieldAlert, iconClass: 'text-ink-4', badge: 'neutral', bg: 'bg-bg', label: 'Low' },
};

interface ReportCardProps {
  report: any;
  selected: boolean;
  onClick: () => void;
}

export const ReportCard = ({ report, selected, onClick }: ReportCardProps) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;
  const SevIcon = sev.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        selected
          ? 'border-primary/40 bg-primary/5 shadow-sm'
          : 'border-line-2 bg-white hover:border-line hover:bg-bg/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink line-clamp-1 flex-1 mr-2">{report.type}</p>
        <Badge variant={sev.badge} className="text-xs px-1.5 py-0 shrink-0">{sev.label}</Badge>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <SevIcon size={11} className={sev.iconClass} />
          <span className="text-xs text-ink-4">{report.id}</span>
        </div>
        <span className="text-xs text-ink-4">{timeAgo(report?.submitted)}</span>
      </div>
    </button>
  );
};
