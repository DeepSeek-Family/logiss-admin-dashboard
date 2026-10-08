import { MapPin, CheckCircle2, FileText } from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';
import type { MappedDriverApplication } from '../utils/helpers';

const DOC_TOTAL = 4;

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Under Review', cls: 'text-warning bg-warning/10' },
  reviewing: { label: 'Under Review', cls: 'text-warning bg-warning/10' },
  approved: { label: 'Approved', cls: 'text-accent bg-accent/10' },
  rejected: { label: 'Rejected', cls: 'text-urgent bg-urgent/10' },
};

interface ApplicationCardProps {
  app: MappedDriverApplication;
  selected: boolean;
  onClick: () => void;
}

export const ApplicationCard = ({ app, selected, onClick }: ApplicationCardProps) => {
  const sc = STATUS_CFG[app.status] || STATUS_CFG.pending;
  const docsProvided = app.licenseImages.length > 0 ? 1 : 0;

  return (
    <Card
      hover
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all border rounded-2xl ${
        selected ? 'border-primary bg-primary-tint/20 shadow-md shadow-primary/5' : 'border-line-2'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={app.initials || '?'} src={app.image} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-ink truncate">{app.name || 'Applicant'}</h4>
          <p className="text-xs text-ink-4 flex items-center gap-1 mt-0.5">
            <MapPin size={9} /> {app.county || 'N/A'}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${sc.cls}`}>
          {sc.label}
        </span>
      </div>

      <div className="flex gap-1.5 mb-3">
        <Badge variant="neutral">{app.licenseClass ? `Class ${app.licenseClass}` : 'N/A'}</Badge>
        <Badge variant="neutral">{app.experience || 'N/A'}</Badge>
      </div>

      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1 text-[10px] font-medium ${docsProvided ? 'text-accent' : 'text-ink-4'}`}>
          {docsProvided ? <CheckCircle2 size={10} /> : <FileText size={10} />}
          {docsProvided}/{DOC_TOTAL} docs
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 w-5 rounded-full ${
              s < (app.stage || 0) ? 'bg-accent' :
              s === app.stage ? 'bg-warning' : 'bg-line-2'
            }`} />
          ))}
        </div>
      </div>
    </Card>
  );
};
