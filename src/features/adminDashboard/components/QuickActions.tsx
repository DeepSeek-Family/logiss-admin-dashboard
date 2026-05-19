import { Car, Calendar, RotateCcw, Settings } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface QuickActionsProps {
  onNavigate: (path: string) => void;
}

export const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  return (
    <Card className="p-6 border-line-2 shadow-sm">
      <h3 className="text-xs font-medium text-ink-4 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('/fleet')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
          <Car className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
          <p className="text-xs font-medium text-ink">Fleet Manager</p>
        </button>
        <button onClick={() => onNavigate('/bookings')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
          <Calendar className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
          <p className="text-xs font-medium text-ink">Trip Logs</p>
        </button>
        <button onClick={() => onNavigate('/transactions')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
          <RotateCcw className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
          <p className="text-xs font-medium text-ink">Refunds</p>
        </button>
        <button onClick={() => onNavigate('/settings')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
          <Settings className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
          <p className="text-xs font-medium text-ink">Global Config</p>
        </button>
      </div>
    </Card>
  );
};
