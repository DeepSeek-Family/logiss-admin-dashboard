import { Activity, CreditCard, AlertTriangle, UserPlus, CheckCircle2, Truck } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface RecentActivityProps {
  onNavigate: (path: string) => void;
}

export const RecentActivity = ({ onNavigate }: RecentActivityProps) => {
  const activities = [
    { icon: CreditCard, color: 'text-accent', text: 'New payment received from Rider #882', time: '5m ago' },
    { icon: AlertTriangle, color: 'text-urgent', text: 'Unassigned trip delay alert in Chesterfield', time: '12m ago' },
    { icon: UserPlus, color: 'text-primary', text: 'New dispatcher account created for Sarah J.', time: '1h ago' },
    { icon: CheckCircle2, color: 'text-accent', text: 'Daily fleet inspection completed for Unit #VEH-003', time: '2h ago' },
    { icon: Truck, color: 'text-primary', text: 'Trip LOGISS-2841 successfully completed by David W.', time: '4h ago' },
  ];

  return (
    <Card className="p-6 border-line-2 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Activity size={16} className="text-accent" /> Recent Activity</h3>
        <button onClick={() => onNavigate('/trips')} className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <div className="space-y-5">
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3 p-1">
            <div className={`mt-0.5 ${act.color} bg-bg p-1.5 rounded-lg shadow-sm`}><act.icon size={14} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ink leading-tight">{act.text}</p>
              <p className="text-xs text-ink-4 mt-1">{act.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
