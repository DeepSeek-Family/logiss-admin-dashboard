import { MapPin, ImageIcon } from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';
import type { MappedDriverApplication } from '../utils/helpers';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'text-warning bg-warning/10' },
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
  const licenseCount = app.licenseImages.length;

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
          <h4 className="text-sm font-semibold text-ink truncate">{app.name}</h4>
          <p className="text-xs text-ink-4 truncate mt-0.5">{app.email || app.phone || '—'}</p>
          {app.county && (
            <p className="text-xs text-ink-4 flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={9} /> County: {app.county}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${sc.cls}`}>
          {sc.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {app.licenseClass && <Badge variant="neutral">Class {app.licenseClass}</Badge>}
        {app.driverExperience && <Badge variant="neutral">{app.driverExperience}</Badge>}
        {app.authorizationID && (
          <Badge variant="neutral">Auth {app.authorizationID}</Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-medium text-ink-4">
        <span className="flex items-center gap-1">
          <ImageIcon size={10} />
          {licenseCount} license photo{licenseCount === 1 ? '' : 's'}
        </span>
        {app.createdAt && <span>Applied {app.createdAt}</span>}
      </div>
    </Card>
  );
};
