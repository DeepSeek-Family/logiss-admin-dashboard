import { Truck, Zap, Activity, ShieldAlert } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface FleetKpiStripProps {
  stats: {
    total: number;
    available: number;
    inTrip: number;
    issues: number;
  };
}

export const FleetKpiStrip = ({ stats }: FleetKpiStripProps) => {
  const items = [
    { label: 'Fleet Assets',     value: stats.total,     sub: 'Managed Units',      icon: Truck,       color: 'bg-primary-light text-primary' },
    { label: 'Mission Ready',    value: stats.available, sub: 'Active Duty',         icon: Zap,         color: 'bg-accent-light text-accent' },
    { label: 'Live Deployments', value: stats.inTrip,    sub: 'En Route',            icon: Activity,    color: 'bg-primary-light/60 text-primary' },
    { label: 'Risk & Service',   value: stats.issues,    sub: 'Attention Required',  icon: ShieldAlert, color: 'bg-urgent-light text-urgent' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(s => (
        <Card key={s.label} className={`p-5 flex items-center gap-4 ${s.label === 'Risk & Service' && s.value > 0 ? 'border-urgent/20' : ''}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
            <s.icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-4 leading-none">{s.label}</p>
            <p className="text-2xl font-semibold text-ink mt-1 leading-none">{s.value}</p>
            <p className="text-xs text-ink-4 mt-1">{s.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
