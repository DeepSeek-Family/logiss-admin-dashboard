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
    { label: 'Fleet Assets', value: stats.total, sub: 'Managed Units', icon: Truck, color: 'from-primary to-primary/80', iconColor: 'text-white' },
    { label: 'Mission Ready', value: stats.available, sub: 'Active Duty', icon: Zap, color: 'from-accent to-accent/80', iconColor: 'text-white' },
    { label: 'Live Deployments', value: stats.inTrip, sub: 'En Route', icon: Activity, color: 'from-primary-tint to-primary/60', iconColor: 'text-white' },
    { label: 'Risk & Service', value: stats.issues, sub: 'Attention Required', icon: ShieldAlert, color: 'from-urgent to-urgent/80', iconColor: 'text-white' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map(s => (
        <Card key={s.label} className={`p-6 flex items-center gap-5 border-none shadow-xl ring-1 ring-ink/5 bg-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} opacity-5 -mr-12 -mt-12 rounded-full`} />
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${s.color} shadow-lg shadow-primary/10 group-hover:rotate-6 transition-transform duration-500`}>
            <s.icon size={24} className="text-white" />
          </div>
          <div className="min-w-0 relative z-10">
            <p className="text-xs text-ink-4 leading-none mb-2">{s.label}</p>
            <p className="text-2xl font-semibold text-ink leading-none">{s.value}</p>
            <p className="text-xs font-medium text-ink-3 mt-2 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-line-2" /> {s.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
