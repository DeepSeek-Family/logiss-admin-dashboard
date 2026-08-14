import { Users, Activity, AlertTriangle, Star } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface RiderKpiStripProps {
  riders: any[];
}

export const RiderKpiStrip = ({ riders }: RiderKpiStripProps) => {
  const stats = [
    { label: 'Total Riders', value: (riders || []).length, sub: 'registered accounts', icon: Users, color: 'bg-primary-light text-primary' },
    { label: 'Active', value: (riders || []).filter(r => r?.status === 'active').length, sub: 'active passengers', icon: Activity, color: 'bg-accent-light text-accent' },
    { label: 'Suspended', value: (riders || []).filter(r => r?.status === 'suspended').length, sub: 'temporarily restricted', icon: AlertTriangle, color: 'bg-warning-light text-warning-dark' },
    { label: 'Banned', value: (riders || []).filter(r => r?.status === 'banned').length, sub: 'access revoked', icon: Star, color: 'bg-urgent-light text-urgent' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <Card key={s.label} className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
            <s.icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-3 leading-none">{s.label}</p>
            <p className="text-xl font-semibold text-ink mt-1 leading-none tabular-nums">{s.value}</p>
            <p className="text-xs font-medium text-ink-3 mt-1">{s.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
