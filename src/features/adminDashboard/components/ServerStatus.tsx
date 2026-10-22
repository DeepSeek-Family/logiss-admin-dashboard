import { Activity } from 'lucide-react';
import { Card } from '@/shared/components/ui';

export const ServerStatus = () => {
  return (
    <Card className="p-6 border-line-2 overflow-hidden relative shadow-sm">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">System Health</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg text-ink-4 text-xs font-semibold border border-line-2">
            Not configured
          </span>
        </div>
        <p className="text-xs text-ink-4">
          Connect a monitoring endpoint to show live system status here.
        </p>
      </div>
      <Activity className="absolute -bottom-4 -right-4 text-ink/4" size={100} />
    </Card>
  );
};
