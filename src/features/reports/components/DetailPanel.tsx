import { useState } from 'react';
import {
  AlertTriangle, Navigation, X, CheckCircle2,
  MoreVertical, Clock, ExternalLink
} from 'lucide-react';
import { Avatar, Button } from '@/shared/components/ui';
import { formatDateTime } from '@/utils/helpers';
import { SEVERITY } from './ReportCard';
import { SendWarningModal } from './SendWarningModal';

interface DetailPanelProps {
  report: any;
  onResolve: () => void;
  onMarkReview?: () => void;
}

export const DetailPanel = ({ report, onResolve, onMarkReview }: DetailPanelProps) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;
  const [warningTarget, setWarningTarget] = useState<{ name: string; role: string } | null>(null);
  const status = report.status || 'open';

  const statusCfg: Record<string, { label: string; cls: string }> = {
    open:       { label: 'Open',         cls: 'text-ink-3 bg-white border border-line-2'  },
    reviewing:  { label: 'Under review', cls: 'text-warning bg-warning/10 border border-warning/20' },
    resolved:   { label: 'Resolved',     cls: 'text-accent bg-accent/10 border border-accent/20' },
  };
  const sc = statusCfg[status] || statusCfg.open;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {warningTarget && (
        <SendWarningModal
          name={warningTarget.name}
          onClose={() => setWarningTarget(null)}
        />
      )}

      {/* ── DETAIL HEADER ─────────────────────── */}
      <div className="px-6 py-4 border-b border-line-2 flex items-start justify-between gap-4 shrink-0">
        <div>
          <p className="text-xs text-ink-4 mb-1">{report.id}</p>
          <h2 className="text-xl font-bold text-ink">{report.type}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className={`flex items-center gap-1 font-semibold ${sev.iconClass}`}>
              <span className={`w-2 h-2 rounded-full ${sev.dot}`} /> {sev.label} priority
            </span>
            <span className="text-ink-4">·</span>
            <span className="text-ink-4">Safety report</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown (simple) */}
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${sc.cls}`}>
            {sc.label}
          </span>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-4 hover:bg-bg transition-colors border border-line-2">
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ───────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Severity alert banner */}
        {report.severity === 'high' && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-urgent/6 border border-urgent/15 rounded-xl text-xs font-medium text-urgent">
            <span className="w-2 h-2 rounded-full bg-urgent shrink-0" />
            Safety concern · Dispatch follow-up required
          </div>
        )}

        {/* Incident statement */}
        <div>
          <h4 className="text-sm font-bold text-ink mb-3">Incident statement</h4>
          <div className="border-l-4 border-line-2 pl-4">
            <p className="text-sm text-ink leading-relaxed">{report.description}</p>
          </div>
        </div>

        {/* People involved */}
        <div>
          <h4 className="text-sm font-bold text-ink mb-3">People involved</h4>
          <div className="flex gap-3 flex-wrap">
            {/* Reporter */}
            {report.filedBy && (
              <div className="flex-1 min-w-[180px] flex items-center justify-between gap-2 p-3 border border-line-2 rounded-xl bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar initials={(report.filedBy.name || '?')[0]} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{report.filedBy.name}</p>
                    <p className="text-xs text-ink-4">
                      Reported by · <span className="capitalize">{report.filedBy.role || 'Rider'}</span>
                    </p>
                  </div>
                </div>
                <button className="text-ink-4 hover:text-ink p-1 rounded transition-colors shrink-0">
                  <MoreVertical size={14} />
                </button>
              </div>
            )}

            {/* Subject */}
            {report.subject && (
              <div className="flex-1 min-w-[180px] flex items-center justify-between gap-2 p-3 border border-line-2 rounded-xl bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar initials={(report.subject.name || '?')[0]} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{report.subject.name}</p>
                    <p className="text-xs text-ink-4 capitalize">Reported {report.subject.role || 'driver'}</p>
                    <button
                      onClick={() => setWarningTarget({ name: report.subject.name, role: report.subject.role || 'driver' })}
                      className="flex items-center gap-1 text-[11px] font-semibold text-warning mt-0.5 hover:underline"
                    >
                      <AlertTriangle size={10} /> Send warning
                    </button>
                  </div>
                </div>
                <button className="text-ink-4 hover:text-ink p-1 rounded transition-colors shrink-0">
                  <MoreVertical size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related trip */}
        {report.tripId && (
          <div>
            <h4 className="text-sm font-bold text-ink mb-3">Related trip</h4>
            <div className="flex items-center justify-between p-3 border border-line-2 rounded-xl bg-white hover:bg-bg/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/8 border border-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Navigation size={15} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Trip #{report.tripId}</p>
                  <p className="text-xs text-ink-4">Submitted {formatDateTime(report.submitted)}</p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                View trip <ExternalLink size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTION BAR ────────────────────────── */}
      <div className="px-6 py-3 bg-white border-t border-line-2 flex items-center gap-2 shrink-0">
        {status !== 'reviewing' && status !== 'resolved' && (
          <Button
            variant="outline"
            className="h-9 text-sm border-warning/20 text-warning hover:bg-warning/5"
            icon={Clock}
            onClick={onMarkReview}
          >
            Mark under review
          </Button>
        )}
        <div className="flex-1" />
        {status !== 'resolved' ? (
          <>
            <Button variant="outline" icon={X} className="h-9 text-sm" onClick={onResolve}>
              Dismiss
            </Button>
            <Button variant="primary" icon={CheckCircle2} className="h-9 text-sm" onClick={onResolve}>
              Resolve report
            </Button>
          </>
        ) : (
          <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
            <CheckCircle2 size={14} /> This incident has been resolved
          </span>
        )}
      </div>
    </div>
  );
};
