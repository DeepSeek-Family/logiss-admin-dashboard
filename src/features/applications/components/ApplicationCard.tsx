import { MapPin, CheckCircle2, FileText } from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';

interface ApplicationCardProps {
  app: any;
  selected: boolean;
  onClick: () => void;
  stages: { id: number; label: string }[];
  appStatus?: string;   // reviewing | info_requested | approved | rejected
  docsVerified?: number;
  docsTotal?: number;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  reviewing:      { label: 'Under Review',  cls: 'text-warning bg-warning/10'   },
  info_requested: { label: 'Awaiting Info', cls: 'text-primary bg-primary/10'   },
  approved:       { label: 'Approved',      cls: 'text-accent bg-accent/10'     },
  rejected:       { label: 'Rejected',      cls: 'text-urgent bg-urgent/10'     },
};

export const ApplicationCard = ({
  app, selected, onClick, stages,
  appStatus = 'reviewing', docsVerified = 0, docsTotal = 4
}: ApplicationCardProps) => {
  const sc = STATUS_CFG[appStatus] || STATUS_CFG.reviewing;
  const allDone = docsVerified === docsTotal;

  return (
    <Card
      hover
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all border rounded-2xl ${
        selected ? 'border-primary bg-primary-tint/20 shadow-md shadow-primary/5' : 'border-line-2'
      }`}
    >
      {/* Name + status */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={app?.initials || '?'} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-ink truncate">{app?.name || 'Applicant'}</h4>
          <p className="text-xs text-ink-4 flex items-center gap-1 mt-0.5">
            <MapPin size={9} /> {app?.county || 'Unknown'}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${sc.cls}`}>
          {sc.label}
        </span>
      </div>

      {/* Vehicle + experience */}
      <div className="flex gap-1.5 mb-3">
        <Badge variant="neutral">{app?.vehicle?.type || 'Standard'}</Badge>
        <Badge variant="neutral">{app?.experience || '0'} exp</Badge>
      </div>

      {/* Doc verification + stage bar */}
      <div className="flex items-center justify-between">
        {/* Doc count */}
        <span className={`flex items-center gap-1 text-[10px] font-medium ${allDone ? 'text-accent' : 'text-ink-4'}`}>
          {allDone ? <CheckCircle2 size={10} /> : <FileText size={10} />}
          {docsVerified}/{docsTotal} docs verified
        </span>
        {/* Stage pills */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1 w-5 rounded-full ${
              s < (app?.stage || 0) ? 'bg-accent' :
              s === app?.stage      ? 'bg-warning' : 'bg-line-2'
            }`} />
          ))}
        </div>
      </div>
    </Card>
  );
};
