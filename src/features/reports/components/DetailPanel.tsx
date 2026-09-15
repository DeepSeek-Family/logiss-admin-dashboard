import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2,
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
    open:       { label: 'Open',         cls: 'text-ink-3 bg-bg border border-line-2'  },
    reviewing:  { label: 'Under review', cls: 'text-warning bg-warning/10 border border-warning/20' },
    resolved:   { label: 'Resolved',     cls: 'text-accent bg-accent/10 border border-accent/20' },
  };
  const sc = statusCfg[status] || statusCfg.open;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {warningTarget && (
        <SendWarningModal
          name={warningTarget.name}
          onClose={() => setWarningTarget(null)}
        />
      )}

      {/* ── DETAIL HEADER ─────────────────────── */}
      <div className="px-6 py-4 border-b border-line-2 flex items-start justify-between gap-4 shrink-0">
        <div>
          <p className="text-xs text-ink-4 mb-0.5">{report.id}</p>
          <h2 className="text-xl font-bold text-ink tracking-tight">{report.type}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className={`flex items-center gap-1.5 font-semibold ${sev.iconClass}`}>
              <span className={`w-2 h-2 rounded-full ${sev.dot}`} /> {sev.label} priority
            </span>
            <span className="text-ink-4">·</span>
            <span className="text-ink-4">Safety report</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sc.cls}`}>
            {sc.label}
          </span>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-4 hover:bg-bg transition-colors">
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* ── FLAT BODY (ZERO UNNECESSARY BOXES) ──── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Flat subtle alert strip — no rounded border box */}
        {report.severity === 'high' && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-urgent/[0.05] border-l-2 border-urgent text-xs font-medium text-urgent rounded-r-md">
            <span className="w-1.5 h-1.5 rounded-full bg-urgent shrink-0" />
            Safety concern · Dispatch follow-up required
          </div>
        )}

        {/* Incident statement — clean typography */}
        <div className="pb-5 border-b border-line-2">
          <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">
            Incident statement
          </h4>
          <p className="text-sm text-ink leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* People involved — flat 2-column metadata, no cards/boxes */}
        <div className="pb-5 border-b border-line-2">
          <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3">
            People involved
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Reporter */}
            {report.filedBy && (
              <div className="flex items-center gap-3">
                <Avatar initials={(report.filedBy.name || '?')[0]} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{report.filedBy.name}</p>
                  <p className="text-xs text-ink-4 mt-0.5">
                    Reported by · <span className="capitalize">{report.filedBy.role || 'Rider'}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Subject */}
            {report.subject && (
              <div className="flex items-center gap-3">
                <Avatar initials={(report.subject.name || '?')[0]} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{report.subject.name}</p>
                  <p className="text-xs text-ink-4 mt-0.5 capitalize">Reported {report.subject.role || 'driver'}</p>
                  <button
                    onClick={() => setWarningTarget({ name: report.subject.name, role: report.subject.role || 'driver' })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-warning hover:underline mt-1"
                  >
                    <AlertTriangle size={11} /> Send warning
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related trip — flat inline link, no giant card */}
        {report.tripId && (
          <div>
            <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2.5">
              Related trip
            </h4>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-ink">Trip #{report.tripId}</span>
                <span className="text-ink-4 text-xs">·</span>
                <span className="text-xs text-ink-4">Submitted {formatDateTime(report.submitted)}</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View trip <ExternalLink size={12} />
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
            <Button variant="outline" className="h-9 text-sm" onClick={onResolve}>
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
