import React, { useMemo } from 'react';
import { Plus, Minus, MapPin, Navigation, Truck, ExternalLink, X, MousePointerClick, Clock } from 'lucide-react';
import { Card, Avatar, TripStatusBadge } from '@/shared/components/ui';
import { formatTime, formatShortDate, money } from '@/utils/helpers';

interface TripHistoryMapProps {
  trips: any[];
  drivers: any[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenDetails?: (id: string) => void;
  onClose?: () => void;
}

const hashCode = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
};
const pos = (seed: string) => ({
  left: 8 + (hashCode(seed) % 84),
  top: 10 + (hashCode(seed + 'y') % 74),
});

const vehicleProgress = (status: string) => {
  if (status === 'completed' || status === 'arrived') return 1;
  if (['in_trip', 'en_route'].includes(status)) return 0.55;
  return 0.06;
};

const dotColor = (status: string) =>
  status === 'completed' ? 'bg-accent'
    : ['in_trip', 'en_route', 'arrived'].includes(status) ? 'bg-urgent'
      : status === 'cancelled' || status === 'no_show' ? 'bg-ink-4'
        : 'bg-primary';

export const TripHistoryMap: React.FC<TripHistoryMapProps> = ({ trips, drivers, selectedId, onSelect, onOpenDetails, onClose }) => {
  const driverById = useMemo(() => {
    const m: Record<string, any> = {};
    (drivers || []).forEach(d => { m[String(d.id)] = d; });
    return m;
  }, [drivers]);

  const historyTrips = useMemo(
    () => (trips || []).filter((t: any) => t?.scheduledTime && (t.status !== 'pending_review' || t.driverId)),
    [trips]
  );

  const geo = useMemo(() => {
    const m: Record<string, { pickup: any; dropoff: any; vehicle: any }> = {};
    historyTrips.forEach((t: any) => {
      const pickup = pos(`${t.id}-p-${t.pickup || ''}`);
      const dropoff = pos(`${t.id}-d-${t.dropoff || ''}`);
      const f = vehicleProgress(t.status);
      const vehicle = { left: pickup.left + (dropoff.left - pickup.left) * f, top: pickup.top + (dropoff.top - pickup.top) * f };
      m[t.id] = { pickup, dropoff, vehicle };
    });
    return m;
  }, [historyTrips]);

  const selected = selectedId ? historyTrips.find((t: any) => t.id === selectedId) : null;
  const selGeo = selected ? geo[selected.id] : null;
  const selDriver = selected?.driverId ? driverById[String(selected.driverId)] : null;
  const vehicleStatusLabel = selected
    ? (['in_trip', 'en_route'].includes(selected.status) ? 'En route to drop-off'
      : selected.status === 'arrived' ? 'Arrived at drop-off'
        : selected.status === 'completed' ? 'Trip completed'
          : selDriver ? 'Staged at pickup' : 'Awaiting assignment')
    : '';

  return (
    <div className="w-full xl:w-[360px] shrink-0 xl:sticky xl:top-4 flex flex-col gap-4 xl:h-[calc(100vh-9rem)]">
      {/* Map */}
      <Card className="overflow-hidden p-0 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-2">
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-primary" />
            <h3 className="text-sm font-semibold text-ink">Trip Map</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-ink-4 bg-bg px-2 py-0.5 rounded-full border border-line-2">{historyTrips.length} trips</span>
            {onClose && (
              <button onClick={onClose} title="Hide map" className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-4 hover:text-ink hover:bg-bg border border-line-2 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-primary-light to-accent-light overflow-hidden h-[360px]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-th" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(41, 105, 205, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-th)" />
            <line x1="0" y1="175" x2="800" y2="175" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
            <line x1="0" y1="325" x2="800" y2="325" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
            <line x1="240" y1="0" x2="240" y2="500" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
            <line x1="560" y1="0" x2="560" y2="500" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
            <rect x="40" y="50" width="120" height="75" rx="4" fill="rgba(255,255,255,0.1)" />
            <rect x="600" y="75" width="160" height="150" rx="4" fill="rgba(255,255,255,0.1)" />
            <rect x="80" y="350" width="96" height="90" rx="4" fill="rgba(255,255,255,0.1)" />
            <rect x="320" y="375" width="120" height="50" rx="4" fill="rgba(255,255,255,0.1)" />
          </svg>

          {selGeo && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1={selGeo.pickup.left} y1={selGeo.pickup.top} x2={selGeo.dropoff.left} y2={selGeo.dropoff.top} stroke="#2969CD" strokeWidth="0.6" strokeDasharray="2 1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          )}

          <div className="absolute inset-0">
            {historyTrips.map((t: any) => {
              const g = geo[t.id];
              if (t.id === selectedId) return null;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  title={`${t.rider?.name || 'Trip'} · ${formatTime(t.scheduledTime)}`}
                  className={`absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 shadow-sm hover:scale-150 transition-transform ${dotColor(t.status)} ${selectedId ? 'opacity-25' : 'opacity-80'}`}
                  style={{ left: `${g.vehicle.left}%`, top: `${g.vehicle.top}%` }}
                />
              );
            })}

            {selGeo && selected && (
              <>
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${selGeo.pickup.left}%`, top: `${selGeo.pickup.top}%` }}>
                  <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow" />
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-full z-10" style={{ left: `${selGeo.dropoff.left}%`, top: `${selGeo.dropoff.top}%` }}>
                  <MapPin size={20} className="text-urgent drop-shadow" fill="white" />
                </div>
                <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20" style={{ left: `${selGeo.vehicle.left}%`, top: `${selGeo.vehicle.top}%` }}>
                  <div className="relative w-9 h-9 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white">
                    <Truck size={16} />
                    {['in_trip', 'en_route', 'arrived'].includes(selected.status) && <div className="absolute inset-0 rounded-full pulse-dot-primary" />}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-1">
            <button className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Plus size={14} /></button>
            <button className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Minus size={14} /></button>
          </div>
        </div>
      </Card>

      {/* Detail card — fills the remaining space below the map */}
      <Card className="flex-1 min-h-0 overflow-y-auto p-0">
        {selected ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar initials={selected?.rider?.initials || '?'} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{selected?.rider?.name || 'Unknown'}</p>
                  <p className="text-[11px] text-ink-4">#{selected.id} · {formatShortDate(selected.scheduledTime)} · {formatTime(selected.scheduledTime)}</p>
                </div>
              </div>
              <button onClick={() => onSelect(null)} className="p-1.5 text-ink-4 hover:text-ink rounded-lg hover:bg-bg shrink-0"><X size={15} /></button>
            </div>

            {/* Vehicle status */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/15 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Truck size={15} className="text-primary" /></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{selDriver ? selDriver.name : 'Unassigned'}</p>
                <p className="text-[10px] text-ink-4">{selDriver ? `${selDriver.vehicle?.type || ''} · ${selDriver.vehicle?.plate || ''}` : 'No vehicle assigned'}</p>
              </div>
              <span className="ml-auto text-[9px] font-semibold text-primary bg-white px-2 py-1 rounded-full border border-primary/20 whitespace-nowrap">{vehicleStatusLabel}</span>
            </div>

            {/* Route */}
            <div className="relative pl-1 space-y-3 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full border-2 border-primary bg-white shrink-0 mt-0.5" />
                <div className="min-w-0"><p className="text-[10px] text-ink-4">Pickup</p><p className="text-xs font-medium text-ink leading-snug">{selected.pickup || '—'}</p></div>
              </div>
              {selected.stop && (
                <div className="flex items-start gap-2.5">
                  <div className="w-3 h-3 rounded-full border-2 border-warning bg-white shrink-0 mt-0.5" />
                  <div className="min-w-0"><p className="text-[10px] text-ink-4">Stop</p><p className="text-xs font-medium text-ink leading-snug">{selected.stop}</p></div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <MapPin size={13} className="text-urgent shrink-0 mt-0.5" />
                <div className="min-w-0"><p className="text-[10px] text-ink-4">Drop-off</p><p className="text-xs font-medium text-ink leading-snug">{selected.dropoff || '—'}</p></div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-[10px] text-ink-4">Pickup time</p>
                <p className="text-xs font-semibold text-ink flex items-center gap-1"><Clock size={10} className="text-ink-4" />{selected.requestedPickup || formatTime(selected.scheduledTime)}</p>
              </div>
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-[10px] text-ink-4">Distance</p>
                <p className="text-xs font-semibold text-ink">{selected.distance || (selected.miles ? `${selected.miles} mi` : '—')}</p>
              </div>
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-[10px] text-ink-4">Trip cost</p>
                <p className="text-xs font-semibold text-ink">{money(selected.cost || 0)}</p>
              </div>
              <div className="bg-bg rounded-lg px-2.5 py-2 border border-line-2">
                <p className="text-[10px] text-ink-4">Reason</p>
                <p className="text-xs font-semibold text-ink truncate">{selected.reason || '—'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line-2">
              <TripStatusBadge status={selected.status} className="text-[10px]" />
              {onOpenDetails && (
                <button onClick={() => onOpenDetails(selected.id)} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  Open full details <ExternalLink size={12} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-bg border border-line-2 flex items-center justify-center mb-3">
              <MousePointerClick size={20} className="text-ink-4" />
            </div>
            <p className="text-sm font-semibold text-ink">No trip selected</p>
            <p className="text-xs text-ink-4 mt-1 max-w-[220px]">Click any trip in the table to locate its vehicle on the map and see its details here.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
