import { Car, Calendar, RotateCcw, Settings } from 'lucide-react';
import { Card } from '@/shared/components/ui';
import { ROUTES } from '@/constants/routes';

interface QuickActionsProps {
  onNavigate: (path: string) => void;
}

const ACTIONS = [
  { icon: Car,        label: 'Fleet Manager', path: '/fleet',        iconCls: 'text-primary',      bgCls: 'bg-primary/10'    },
  { icon: Calendar,   label: 'Trip Logs',     path: '/bookings',     iconCls: 'text-accent',       bgCls: 'bg-accent/10'     },
  { icon: RotateCcw,  label: 'Refunds',       path: ROUTES.transactions, iconCls: 'text-warning-dark', bgCls: 'bg-warning/10'    },
  { icon: Settings,   label: 'Global Config', path: '/settings',     iconCls: 'text-ink-3',        bgCls: 'bg-ink/5'         },
];

export const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  return (
    <Card className="p-5 border-line-2 shadow-sm">
      <h3 className="text-xs font-semibold text-ink-4 uppercase tracking-wide mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ icon: Icon, label, path, iconCls, bgCls }) => (
          <button
            key={path}
            onClick={() => onNavigate(path)}
            className="flex flex-col items-center gap-2.5 p-4 bg-bg border border-line-2 rounded-xl hover:border-primary/30 hover:bg-white transition-all text-center group hover:shadow-sm"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgCls} group-hover:scale-110 transition-transform`}>
              <Icon size={18} className={iconCls} />
            </div>
            <p className="text-xs font-medium text-ink">{label}</p>
          </button>
        ))}
      </div>
    </Card>
  );
};
