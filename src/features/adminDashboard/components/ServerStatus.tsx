import { Activity, AlertTriangle } from 'lucide-react';
import { Card } from '@/shared/components/ui';

const BARS = [55, 70, 45, 80, 60, 90, 50, 75, 65, 85, 55, 70, 95, 60, 80];

export const ServerStatus = () => {
  return (
    <Card className="p-6 border-line-2 overflow-hidden relative shadow-sm">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">System Health</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-light text-warning text-xs font-semibold border border-warning/20">
            <AlertTriangle size={11} />
            Degraded
          </span>
        </div>
        <p className="text-xs text-ink-4 mb-4">Some nodes are experiencing high load</p>
        <div className="flex gap-1 h-10 items-end">
          {BARS.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${h > 80 ? 'bg-warning/50' : 'bg-primary/25'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <Activity className="absolute -bottom-4 -right-4 text-ink/4" size={100} />
    </Card>
  );
};
