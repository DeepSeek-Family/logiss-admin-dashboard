import React from 'react';
import { Info, Map as MapIcon } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface FleetOverviewTabProps {
  vehicle: any;
  VEHICLE_IMAGE: string;
}

export const FleetOverviewTab: React.FC<FleetOverviewTabProps> = ({ vehicle, VEHICLE_IMAGE }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <Card className="p-6">
          <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-4">Vehicle Specifications</h4>
          <div className="space-y-4">
            {[
              ['Category', vehicle.type],
              ['Max Occupancy', `${vehicle.seats} Riders`],
              ['Exterior Color', vehicle.color],
              ['VIN Identification', vehicle.vin],
              ['Model Year', vehicle.year],
              ['Service Status', vehicle.status.replace('_', ' ')]
            ].map(([l, v]) => (
              <div key={l as string} className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                <span className="text-xs text-ink-4">{l}</span>
                <span className="text-xs font-medium text-ink capitalize">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-4">Special Equipment</h4>
          <div className="p-4 bg-primary-tint/10 rounded-2xl border border-primary/10 flex gap-3">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-ink-3 leading-relaxed">
              Equipped with hydraulic wheelchair lift, emergency oxygen supply, and reinforced cabin floor for medical safety compliance.
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-4">Operational Context</h4>
          <div className="aspect-[4/3] bg-bg rounded-xl border border-line-2 relative overflow-hidden group shadow-sm">
            <img
              src={VEHICLE_IMAGE}
              alt="Fleet Vehicle"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-line-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <MapIcon size={20} />
                  </div>
                  <div>
                    <p className="type-label text-ink-4">Last Known Base</p>
                    <p className="text-xs font-medium text-ink mt-0.5">Loggiskabir Main Dispatch Base</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <p className="type-label text-accent">Stationary · Signal High</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
