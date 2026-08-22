import { useState } from 'react';
import { AlertTriangle, ChevronRight, MessageSquare, Flag, Navigation, X, CheckCircle2, MoreVertical } from 'lucide-react';
import { Avatar, Badge, Button } from '@/shared/components/ui';
import { formatDateTime } from '@/utils/helpers';
import { SEVERITY } from './ReportCard';
import { SendWarningModal } from './SendWarningModal';

interface DetailPanelProps {
  report: any;
  onResolve: () => void;
}

export const DetailPanel = ({ report, onResolve }: DetailPanelProps) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;
  const SevIcon = sev.icon;
  const [warningTarget, setWarningTarget] = useState<string | null>(null);

  const statusVariant: { [key: string]: string } = {
    open: 'urgent',
    reviewing: 'warning',
    resolved: 'accent',
  };
  const variant = statusVariant[report.status] || 'neutral';

  return (
    <div className="h-full flex flex-col">
      {warningTarget && <SendWarningModal name={warningTarget} onClose={() => setWarningTarget(null)} />}

      {/* Detail Header */}
      <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between bg-bg/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sev.bg}`}>
            <SevIcon size={20} className={sev.iconClass} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink leading-tight">{report.type}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-ink-3">#{report.id}</span>
              <span className="w-1 h-1 bg-line rounded-full" />
              <Badge variant={variant}>{report.status}</Badge>
              {report.severity === 'high' && (
                <>
                  <span className="w-1 h-1 bg-line rounded-full" />
                  <Badge variant="urgent" className="text-xs uppercase font-medium animate-pulse flex items-center gap-1">
                    <AlertTriangle size={10} /> Safety Alert
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-bg rounded-lg text-ink-4 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Detail Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* High severity alert */}
        {report.severity === 'high' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-urgent-light/40 rounded-xl border border-urgent/10 text-urgent text-xs font-medium">
            <AlertTriangle size={13} className="shrink-0 animate-pulse" />
            <span>Urgent: Safety violation flagged — immediate dispatch follow-up required.</span>
          </div>
        )}

        {/* Filer vs Subject */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { data: report.filedBy, label: 'Filed by', badge: <Badge variant="neutral" className="text-xs">Filer</Badge> },
            { data: report.subject, label: 'Subject', badge: <Badge variant="urgent" className="text-xs">Subject</Badge> },
          ].map(({ data, label, badge }) => (
            <div key={label} className="bg-bg/60 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar initials={data?.name?.[0] || '?'} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-medium text-ink truncate">{data?.name || 'Unknown'}</p>
                    {badge}
                  </div>
                  <p className="text-xs text-primary">{data?.role || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setWarningTarget(data?.name || 'User')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-warning/20 bg-warning-light hover:bg-warning hover:text-white text-warning text-xs font-medium transition-all shrink-0 whitespace-nowrap"
                title="Send Warning"
              >
                <AlertTriangle size={12} />
                Send Warning
              </button>
            </div>
          ))}
        </div>

        {/* Statement */}
        <div>
          <h4 className="type-th mb-3 flex items-center gap-2">
            <MessageSquare size={12} /> Statement of Incident
          </h4>
          <div className="bg-bg/40 rounded-2xl p-5 relative">
            <span className="absolute -top-3 left-5 text-xl text-ink-4 font-serif">"</span>
            <p className="text-sm font-medium text-ink-2 leading-relaxed italic">{report.description}</p>
          </div>
        </div>

        {/* Associated Trip */}
        <div>
          <h4 className="type-th mb-3 flex items-center gap-2">
            <Flag size={12} /> Associated Record
          </h4>
          <div className="bg-bg/60 rounded-xl p-4 flex items-center justify-between group hover:bg-primary-tint/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                <Navigation size={18} />
              </div>
              <div>
                <p className="text-sm text-ink-3">Trip #{report.tripId}</p>
                <p className="text-xs text-ink-3 font-medium mt-0.5">Submitted {formatDateTime(report.submitted)}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-white border-t border-line-2 flex items-center justify-end gap-2 shrink-0">
        <Button variant="outline" icon={X} className="text-ink-3 hover:text-ink" onClick={onResolve}>
          Dismiss
        </Button>
        <Button variant="primary" icon={CheckCircle2} className="shadow-sm shadow-primary/20" onClick={onResolve}>
          Resolve
        </Button>
      </div>
    </div>
  );
};
