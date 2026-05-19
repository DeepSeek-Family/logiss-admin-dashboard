import React from 'react';
import { X, Truck, Users, Wrench, Coffee } from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';

export const StatusUpdateModal = ({ item, date, onClose }: { item: any; date: Date; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-line-2 flex justify-between items-center bg-bg">
          <h3 className="font-semibold text-sm text-ink">Update Status</h3>
          <button onClick={onClose} className="text-ink-4 hover:text-ink transition-colors p-1 rounded-lg hover:bg-line-2"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl border border-line-2 flex items-center justify-center shadow-sm">
              {item.plate ? <Truck size={18} className="text-primary" /> : <Users size={18} className="text-primary" />}
            </div>
            <div>
              <p className="font-medium text-sm text-ink">{item.name || item.plate}</p>
              <p className="text-xs text-ink-4 mt-0.5">{date.toDateString()}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-medium text-ink-4">Set Status For This Day</label>
            <div className="grid grid-cols-2 gap-2">
              {item.plate ? (
                <>
                  <button className="py-3 rounded-xl border-2 border-line hover:border-primary font-medium text-xs bg-bg text-ink-4 hover:text-primary transition-all">Active Duty</button>
                  <button className="py-3 rounded-xl border-2 border-transparent font-medium text-xs bg-urgent-light/40 text-urgent hover:bg-urgent-light transition-all flex flex-col items-center justify-center gap-1">
                    <Wrench size={14} /> Maintenance
                  </button>
                </>
              ) : (
                <>
                  <button className="py-3 rounded-xl border-2 border-line hover:border-primary font-medium text-xs bg-bg text-ink-4 hover:text-primary transition-all">Assign Shift</button>
                  <button className="py-3 rounded-xl border-2 border-line font-medium text-xs bg-white text-ink-4 hover:border-ink-4 hover:text-ink transition-all flex flex-col items-center justify-center gap-1">
                    <Coffee size={14} /> Weekend / Off
                  </button>
                </>
              )}
            </div>
          </div>
          <Button variant="primary" className="w-full mt-2 py-3" onClick={onClose}>Save & Update Schedule</Button>
        </div>
      </Card>
    </div>
  );
};
