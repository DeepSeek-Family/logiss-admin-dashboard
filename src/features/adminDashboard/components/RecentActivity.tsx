import { Activity } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface RecentActivityProps {
  onNavigate: (path: string) => void;
}

export const RecentActivity = ({ onNavigate }: RecentActivityProps) => {
  return (
    <Card className="p-6 border-line-2 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Activity size={16} className="text-accent" /> Recent Activity
        </h3>
        <button
          type="button"
          onClick={() => onNavigate('/trips')}
          className="text-xs font-medium text-primary hover:underline"
        >
          Trip history
        </button>
      </div>
      <p className="text-xs text-ink-4 py-6 text-center">
        Activity feed will appear when the backend activity API is connected.
      </p>
    </Card>
  );
};
