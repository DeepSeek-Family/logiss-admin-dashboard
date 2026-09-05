import { Users, Car, Truck, AlertTriangle } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface DriverKpiStripProps {
  drivers: any[];
}

export const DriverKpiStrip = ({ drivers }: DriverKpiStripProps) => {
  const stats = [
    { label: 'Total Drivers', value: (drivers || []).length, sub: 'registered accounts', icon: Users, color: 'bg-primary-light text-primary' },
    { label: 'On Duty', value: (drivers || []).filter((d: any) => d?.onDuty).length, sub: 'currently active', icon: Car, color: 'bg-accent-light text-accent' },
    { label: 'In Trip', value: (drivers || []).filter((d: any) => d?.status === 'in_trip').length, sub: 'on the road now', icon: Truck, color: 'bg-primary-light/60 text-primary' },
    { label: 'Needs Attention', value: (drivers || []).filter((d: any) => (d?.pendingDocUpdates || 0) > 0).length, sub: 'document issues', icon: AlertTriangle, color: 'bg-urgent-light text-urgent' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s: any) => (
        <Card key={s.label} className={`p-4 flex items-center gap-3 ${s.label === 'Needs Attention' && s.value > 0 ? 'border-urgent/40' : ''}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
            <s.icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-4 leading-none">{s.label}</p>
            <p className="text-xl font-semibold text-ink mt-1 leading-none tabular-nums">{s.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
