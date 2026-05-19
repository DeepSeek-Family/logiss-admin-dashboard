import { MapPin } from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';
import { timeAgo } from '@/utils/helpers';

interface ApplicationCardProps {
  app: any;
  selected: boolean;
  onClick: () => void;
  stages: { id: number; label: string }[];
}

export const ApplicationCard = ({ app, selected, onClick, stages }: ApplicationCardProps) => {
  return (
    <Card
      hover
      onClick={onClick}
      className={`p-5 cursor-pointer transition-all border-2 rounded-2xl ${
        selected ? 'border-primary bg-primary-tint/20 shadow-lg shadow-primary/5' : 'border-line-2'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="font-mono text-xs text-ink-4">#{app?.id || '---'}</span>
        <span className="text-xs text-ink-4">{app?.submitted ? timeAgo(app.submitted) : '---'}</span>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Avatar initials={app?.initials || '?'} size="sm" />
        <div>
          <h4 className="text-sm font-medium text-ink">{app?.name || 'Applicant'}</h4>
          <p className="text-xs font-semibold text-ink-3 flex items-center gap-1">
            <MapPin size={10} /> {app?.county || 'Unknown'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Badge variant="neutral">{app?.vehicle?.type || 'Standard'}</Badge>
        <Badge variant="neutral">{app?.experience || '0'} exp</Badge>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-medium">
          <span className={app?.stage === 4 ? 'text-accent' : 'text-warning'}>
            Stage {app?.stage || 0}/4: {stages.find(s => s.id === app?.stage)?.label || 'Pending'}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s < (app?.stage || 0) ? 'bg-accent' : s === app?.stage ? 'bg-warning' : 'bg-line-2'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </Card>
  );
};
