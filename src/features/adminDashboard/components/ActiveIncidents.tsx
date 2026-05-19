import { Flag, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '@/shared/components/ui';

interface ActiveIncidentsProps {
  onNavigate: (path: string) => void;
}

export const ActiveIncidents = ({ onNavigate }: ActiveIncidentsProps) => {
  const incidents = [
    { type: 'Safety Violation', id: 'REP-4821', severity: 'high', time: '14m ago' },
    { type: 'Vehicle Damage', id: 'REP-4819', severity: 'medium', time: '1h ago' },
    { type: 'No-Show Dispute', id: 'REP-4815', severity: 'low', time: '3h ago' },
    { type: 'Late Arrival', id: 'REP-4812', severity: 'low', time: '5h ago' },
    { type: 'Driver Feedback', id: 'REP-4809', severity: 'medium', time: 'Yesterday' },
  ];

  return (
    <Card className="p-6 border-line-2 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Flag size={16} className="text-urgent" /> Active Incident Reports</h3>
        <button onClick={() => onNavigate('/reports')} className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <div className="space-y-4">
        {incidents.map((rep, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-bg hover:bg-line-2 transition-colors rounded-xl cursor-pointer shadow-sm border border-transparent hover:border-line-2" onClick={() => onNavigate('/reports')}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rep.severity === 'high' ? 'bg-urgent-light text-urgent' : rep.severity === 'medium' ? 'bg-warning-light text-warning-dark' : 'bg-primary-light text-primary'}`}>
                <AlertTriangle size={14} />
              </div>
              <div>
                <p className="text-xs font-medium text-ink">{rep.type}</p>
                <p className="text-xs text-ink-4 font-mono">{rep.id} · {rep.time}</p>
              </div>
            </div>
            <Badge variant={rep.severity === 'high' ? 'urgent' : rep.severity === 'medium' ? 'warning' : 'accent'}>
              {rep.severity}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};
