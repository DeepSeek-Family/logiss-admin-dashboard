import { Activity } from 'lucide-react';
import { Card, Badge } from '@/shared/components/ui';

export const ServerStatus = () => {
  return (
    <Card className="p-6 border-line-2 bg-ink text-white overflow-hidden relative shadow-lg">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="accent" dot>System Healthy</Badge>
        </div>
        <h3 className="text-sm font-semibold mb-1">Server Status</h3>
        <p className="text-xs text-ink-4/80 mb-4">All nodes operating at peak capacity</p>
        <div className="flex gap-1 h-8 items-end">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
            <div key={i} className="flex-1 bg-accent/30 rounded-t-[1px]" style={{ height: `${40 + Math.random() * 60}%` }}></div>
          ))}
        </div>
      </div>
      <Activity className="absolute -bottom-4 -right-4 text-white/5" size={120} />
    </Card>
  );
};
