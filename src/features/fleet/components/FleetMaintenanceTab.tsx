import React from 'react';
import { Plus, Wrench, Calendar, Gauge, ClipboardCheck } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';

interface FleetMaintenanceTabProps {
  vehicle: any;
  handleLogService: () => void;
}

export const FleetMaintenanceTab: React.FC<FleetMaintenanceTabProps> = ({ vehicle, handleLogService }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-ink">Service Registry</h3>
          <p className="text-xs text-ink-3 font-medium">Detailed history of repairs and preventative maintenance</p>
        </div>
        <Button variant="primary-light" size="sm" icon={Plus} onClick={handleLogService}>Add Registry Entry</Button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {(vehicle.maintenance || []).map((log: any, i: number) => (
          <div key={i} className="flex items-center gap-5 p-5 bg-bg/40 rounded-3xl border border-line-2 hover:border-primary/20 hover:bg-white hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-line-2 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
              <Wrench size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-ink">{log.type}</p>
                <div className="flex items-center gap-4">
                  <Badge variant="neutral" className="text-xs font-medium">{log.shop}</Badge>
                  <p className="text-sm font-semibold text-ink">${log.cost}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                <span className="flex items-center gap-1.5"><Calendar size={12} /> {log.date}</span>
                <span className="w-1 h-1 rounded-full bg-line-2" />
                <span className="flex items-center gap-1.5"><Gauge size={12} /> {log.mileage.toLocaleString()} mi</span>
                <span className="w-1 h-1 rounded-full bg-line-2" />
                <span className="flex items-center gap-1.5 text-accent"><ClipboardCheck size={12} /> Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
