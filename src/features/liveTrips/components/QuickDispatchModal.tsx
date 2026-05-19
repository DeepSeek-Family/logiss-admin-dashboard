import React from 'react';
import { X, Repeat, MapPin, Search, ChevronRight } from 'lucide-react';
import { Avatar, Badge } from '@/shared/components/ui';

interface QuickDispatchModalProps {
  dispatchModalTrip: any;
  setDispatchModalTrip: (trip: any) => void;
  driverSearch: string;
  setDriverSearch: (search: string) => void;
  sortedDrivers: any[];
  handleQuickDispatch: (driverId: string) => void;
  setSelectedRiderProfile: (profile: any) => void;
  setSelectedDriverProfile: (profile: any) => void;
}

export const QuickDispatchModal: React.FC<QuickDispatchModalProps> = ({
  dispatchModalTrip,
  setDispatchModalTrip,
  driverSearch,
  setDriverSearch,
  sortedDrivers,
  handleQuickDispatch,
  setSelectedRiderProfile,
  setSelectedDriverProfile
}) => {
  if (!dispatchModalTrip) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => { setDispatchModalTrip(null); setDriverSearch(''); }}
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-line-2 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
              <Repeat size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">Quick Dispatch</h3>
              <p className="text-[10px] text-ink-4">#{dispatchModalTrip.tripId}</p>
            </div>
          </div>
          <button
            onClick={() => { setDispatchModalTrip(null); setDriverSearch(''); }}
            className="p-2 hover:bg-bg rounded-xl text-ink-4 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Route Panel */}
          <div className="bg-bg rounded-2xl p-5 border border-line-2 space-y-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex flex-col items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-white" />
                <div className="w-0.5 h-8 border-l border-line-2 border-dashed" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1">Pickup</p>
                <p className="text-sm font-medium text-ink truncate">{dispatchModalTrip.pickupLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <MapPin size={14} className="text-urgent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1">Destination</p>
                <p className="text-sm font-medium text-ink truncate">{dispatchModalTrip.returnAddress}</p>
              </div>
            </div>
          </div>

          {/* Rider Summary */}
          <div className="flex items-center gap-4 px-1 cursor-pointer hover:bg-bg p-2 rounded-xl transition-all" onClick={() => {
            const riderObj = {
              name: dispatchModalTrip.rider,
              initials: dispatchModalTrip.rider.split(' ').map((n: string) => n[0]).join(''),
              mobility: 'Wheelchair',
              rating: 4.8
            };
            setSelectedRiderProfile(riderObj);
          }}>
            <Avatar initials={dispatchModalTrip.rider.split(' ').map((n: string) => n[0]).join('')} size="sm" />
            <div>
              <h4 className="text-sm font-medium text-ink">{dispatchModalTrip.rider}</h4>
              <p className="text-[10px] text-ink-4">Patient Will Call Service</p>
            </div>
          </div>

          {/* Driver Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h5 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Assign Driver</h5>
              <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded-full">{sortedDrivers.length} Online</span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="w-full bg-bg border border-line-2 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-ink-4/50"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {sortedDrivers.length > 0 ? sortedDrivers.map((driver: any) => (
                <button
                  key={driver.id}
                  onClick={() => handleQuickDispatch(driver.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${driver.id === dispatchModalTrip.driverId ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-line-2 bg-white hover:border-primary/20 hover:bg-bg'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedDriverProfile(driver); }}>
                      <Avatar initials={driver.initials} size="xs" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${driver.status === 'available' ? 'bg-accent' : 'bg-warning'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-medium text-ink">{driver.name}</p>
                        {driver.id === dispatchModalTrip.driverId && (
                          <Badge variant="primary" className="text-xs py-0 px-1.5 h-4 flex items-center border-none">ORIGINAL</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-ink-4 uppercase tracking-normal">{driver.vehicle.type} · {driver.vehicle.plate}</p>
                        {driver.status !== 'available' && (
                          <span className="text-xs font-medium text-warning-dark bg-warning/10 px-1 rounded">{driver.status.replace('_', ' ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-ink-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )) : (
                <div className="p-10 text-center bg-bg rounded-2xl border border-dashed border-line-2">
                  <p className="text-xs text-ink-4">No matching drivers</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-line-2 bg-bg/50">
          <div className="flex items-start gap-3">
            <Repeat size={14} className="text-primary mt-0.5" />
            <p className="text-xs text-ink-4 leading-relaxed">
              Confirmation will instantly notify the driver. All route and rider data will be synchronized to their device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
