import { useState } from 'react';
import { CheckCircle2, User, Star, Settings } from 'lucide-react';
import { Avatar } from '@/shared/components/ui';

interface AssignDriverCellProps {
  vehicle: any;
  allDrivers: any[];
  onAssign: (vId: string, dId: string | null) => void;
}

export const AssignDriverCell = ({ vehicle, allDrivers, onAssign }: AssignDriverCellProps) => {
  const [open, setOpen] = useState(false);
  const driver = allDrivers.find(d => d.id === vehicle.assignedDriverId);

  return (
    <div className="relative">
      {driver ? (
        <div className="flex items-center gap-3">
          <Avatar initials={driver.initials} size="xs" online={driver.onDuty} className="ring-2 ring-white shadow-sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">{driver.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-4 flex items-center gap-0.5"><Star size={8} className="fill-warning text-warning" /> {driver.rating}</span>
              <span className="text-xs text-primary">#{driver.totalTrips}T</span>
            </div>
          </div>
          <button onClick={() => setOpen(o => !o)} className="ml-1 w-6 h-6 rounded-lg bg-bg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
            <Settings size={12} />
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg border border-dashed border-line text-xs font-medium text-ink-4 hover:text-primary hover:border-primary/30 transition-all">
          <User size={12} /> Assign Operator
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-[24px] border border-line-2 shadow-2xl z-50 py-2 animate-in slide-in-from-top-3 duration-200 ring-1 ring-ink/5">
          <div className="px-4 py-2 border-b border-line-2 mb-2">
            <p className="text-xs font-medium text-ink-4">Select Operator</p>
          </div>
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {allDrivers.map(d => (
              <button key={d.id} onClick={() => { onAssign(vehicle.id, d.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors group">
                <Avatar initials={d.initials} size="xs" online={d.onDuty} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium text-ink truncate group-hover:text-primary transition-colors">{d.name}</p>
                  <p className="text-xs text-ink-4">{d.status.replace('_', ' ')}</p>
                </div>
                {vehicle.assignedDriverId === d.id && <CheckCircle2 size={14} className="text-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
          {vehicle.assignedDriverId && (
            <button onClick={() => { onAssign(vehicle.id, null); setOpen(false); }}
              className="w-full px-4 py-3 text-xs font-medium text-urgent hover:bg-urgent-light transition-colors text-center border-t border-line-2 mt-2">
              Vacate Unit Assignment
            </button>
          )}
        </div>
      )}
    </div>
  );
};
