import { MapPin, Shield } from 'lucide-react';
import { Card, Badge } from '@/shared/components/ui';

const COUNTIES = ['Chesterfield', 'Henrico', 'Hanover', 'Richmond City', 'Powhatan', 'Goochland'];

interface CoverageTabProps {
  role?: string | null;
}

export const CoverageTab = ({ role }: CoverageTabProps) => {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-200">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-ink-4">Active Service Counties</p>
          <Badge variant="accent" dot>{COUNTIES.length} Active</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {COUNTIES.map(c => (
            <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg rounded-full border border-line-2 text-xs font-semibold text-ink-2">
              <MapPin size={11} className="text-ink-4" /> {c}
            </span>
          ))}
          {role === 'admin' && (
            <button className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-line rounded-full text-xs text-ink-4 hover:text-primary hover:border-primary/40 transition-colors">
              + Add County
            </button>
          )}
        </div>
        <p className="text-xs text-ink-4 mt-5 flex items-center gap-1.5">
          <Shield size={11} /> {role === 'admin' ? 'Contact support to modify coverage zones.' : 'Contact your administrator to change service coverage.'}
        </p>
      </Card>
    </div>
  );
};
