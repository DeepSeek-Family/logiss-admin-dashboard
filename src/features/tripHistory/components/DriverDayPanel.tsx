import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, LogOut, LogIn, MapPin, Clock, AlertTriangle, Coffee, Truck, ExternalLink, ArrowRight, UserMinus } from 'lucide-react';
import { Avatar, Badge, TripStatusBadge } from '@/shared/components/ui';
import { formatTime } from '@/utils/helpers';

interface DriverDayPanelProps {
  driver: any;
  trips: any[];
  date: Date;
  onClose: () => void;
  onTripClick?: (id: string) => void;
  /** Full driver roster for reassignment. */
  drivers?: any[];
  /** Persist reassign/unassign (id, patch). */
  updateTrip?: (id: string, patch: Record<string, any>) => void;
}

const DEPOT_BUFFER_MIN = 15; // pull-out / pull-in depot travel allowance

const estDurationMin = (trip: any): number => {
  if (trip?.duration) {
    const m = parseInt(String(trip.duration), 10);
    if (!isNaN(m) && m > 0) return Math.min(m, 180);
  }
  if (trip?.miles) return Math.min(150, Math.round(Number(trip.miles) * 3) + 12);
  return 45;
};

const fmtDur = (mins: number) => {
  const m = Math.round(mins);
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h${r ? ` ${r}m` : ''}` : `${r}m`;
};

const addMin = (d: Date, mins: number) => new Date(d.getTime() + mins * 60000);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const DriverDayPanel: React.FC<DriverDayPanelProps> = ({ driver, trips, date, onClose, onTripClick, drivers, updateTrip }) => {
  const dayTrips = useMemo(() => {
    return (trips || [])
      .filter((t: any) => String(t?.driverId) === String(driver?.id) && t?.scheduledTime && t.status !== 'cancelled' && sameDay(new Date(t.scheduledTime), date))
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [trips, driver, date]);

  // Build the run sheet: pull-out → trips (with gaps) → pull-in.
  const segments = useMemo(() => {
    const segs: any[] = [];
    if (dayTrips.length === 0) return segs;

    const firstStart = new Date(dayTrips[0].scheduledTime);
    segs.push({ kind: 'pullout', time: addMin(firstStart, -DEPOT_BUFFER_MIN), to: dayTrips[0].pickup });

    dayTrips.forEach((t: any, i: number) => {
      const start = new Date(t.scheduledTime);
      const end = addMin(start, estDurationMin(t));
      if (i > 0) {
        const prev = dayTrips[i - 1];
        const prevEnd = addMin(new Date(prev.scheduledTime), estDurationMin(prev));
        const gapMin = (start.getTime() - prevEnd.getTime()) / 60000;
        if (gapMin < -1) segs.push({ kind: 'conflict', mins: Math.abs(gapMin) });
        else if (gapMin > 5) segs.push({ kind: 'gap', mins: gapMin });
      }
      segs.push({ kind: 'trip', trip: t, start, end });
    });

    const last = dayTrips[dayTrips.length - 1];
    const lastEnd = addMin(new Date(last.scheduledTime), estDurationMin(last));
    segs.push({ kind: 'pullin', time: lastEnd, from: last.dropoff });
    return segs;
  }, [dayTrips]);

  const totalMiles = dayTrips.reduce((s: number, t: any) => s + (Number(t.miles) || 0), 0);
  const firstStart = dayTrips[0] ? new Date(dayTrips[0].scheduledTime) : null;
  const lastEnd = dayTrips.length ? addMin(new Date(dayTrips[dayTrips.length - 1].scheduledTime), estDurationMin(dayTrips[dayTrips.length - 1])) : null;
  const dutyWindow = firstStart && lastEnd ? `${formatTime(firstStart.toISOString())} – ${formatTime(lastEnd.toISOString())}` : '—';

  return createPortal((
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-ink/50 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border-l border-line-2 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="px-5 py-4 border-b border-line-2 bg-bg shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar initials={driver?.initials} size="md" online={driver?.onDuty} />
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink truncate">{driver?.name}</h2>
                <p className="text-xs text-ink-4 flex items-center gap-1.5"><Truck size={11} />{driver?.vehicle?.plate || '—'} · {driver?.vehicle?.type}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-line-2 hover:bg-line-2 text-ink-4 shadow-sm shrink-0"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border border-line-2 px-3 py-2"><p className="text-xs text-ink-4 uppercase font-semibold">Trips</p><p className="text-sm font-bold text-ink">{dayTrips.length}</p></div>
            <div className="bg-white rounded-xl border border-line-2 px-3 py-2"><p className="text-xs text-ink-4 uppercase font-semibold">Miles</p><p className="text-sm font-bold text-ink">{totalMiles.toFixed(1)}</p></div>
            <div className="bg-white rounded-xl border border-line-2 px-3 py-2"><p className="text-xs text-ink-4 uppercase font-semibold">On Duty</p><p className="text-xs font-bold text-ink leading-tight">{dutyWindow}</p></div>
          </div>
          <p className="text-xs text-ink-4 mt-3">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Run sheet */}
        <div className="flex-1 overflow-y-auto p-5">
          {dayTrips.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-bg border border-line-2 flex items-center justify-center mb-3"><Coffee size={20} className="text-ink-4" /></div>
              <p className="text-sm font-semibold text-ink">No trips this day</p>
              <p className="text-xs text-ink-4 mt-1">{driver?.onDuty ? 'On duty · idle' : 'Off duty'}</p>
            </div>
          ) : (
            <div className="relative pl-6">
              {/* vertical connector */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-line-2" />

              {segments.map((seg: any, i: number) => {
                if (seg.kind === 'pullout') {
                  return (
                    <div key={`po-${i}`} className="relative mb-3">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center"><LogOut size={9} className="text-primary" /></div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-primary uppercase tracking-wide">Pull-Out</p>
                        <span className="text-xs font-semibold text-ink-3">{formatTime(seg.time.toISOString())}</span>
                      </div>
                      <p className="text-xs text-ink-4 mt-0.5">Depot → {seg.to || 'first pickup'}</p>
                    </div>
                  );
                }
                if (seg.kind === 'pullin') {
                  return (
                    <div key={`pi-${i}`} className="relative mt-3">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-ink/5 border-2 border-ink-4 flex items-center justify-center"><LogIn size={9} className="text-ink-3" /></div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-ink-3 uppercase tracking-wide">Pull-In</p>
                        <span className="text-xs font-semibold text-ink-3">{formatTime(seg.time.toISOString())}</span>
                      </div>
                      <p className="text-xs text-ink-4 mt-0.5">{seg.from || 'last drop-off'} → Depot</p>
                    </div>
                  );
                }
                if (seg.kind === 'gap') {
                  return (
                    <div key={`gap-${i}`} className="relative my-2 ml-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-4 bg-bg border border-line-2 rounded-full px-2.5 py-1">
                        <Coffee size={10} /> Standby · {fmtDur(seg.mins)}
                      </div>
                    </div>
                  );
                }
                if (seg.kind === 'conflict') {
                  return (
                    <div key={`cf-${i}`} className="relative my-2 ml-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-urgent bg-urgent-light/40 border border-urgent/20 rounded-full px-2.5 py-1">
                        <AlertTriangle size={10} /> Overlap · {fmtDur(seg.mins)}
                      </div>
                    </div>
                  );
                }
                // trip
                const t = seg.trip;
                return (
                  <div key={t.id} className="relative mb-3">
                    <div className={`absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full border-2 bg-white flex items-center justify-center ${['in_trip', 'en_route', 'arrived'].includes(t.status) ? 'border-urgent' : t.status === 'completed' ? 'border-accent' : 'border-primary'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${['in_trip', 'en_route', 'arrived'].includes(t.status) ? 'bg-urgent' : t.status === 'completed' ? 'bg-accent' : 'bg-primary'}`} />
                    </div>
                    <button
                      onClick={() => onTripClick?.(t.id)}
                      className="w-full text-left rounded-xl border border-line-2 bg-white hover:border-primary/40 hover:shadow-sm transition-all p-3 group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Clock size={11} className="text-ink-4" />{formatTime(seg.start.toISOString())} <span className="text-ink-4 font-normal">– {formatTime(seg.end.toISOString())}</span>
                        </span>
                        <TripStatusBadge status={t.status} className="text-xs" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar initials={t?.rider?.initials || '?'} size="xs" />
                        <p className="text-xs font-semibold text-ink truncate">{t?.rider?.name || 'Unknown'}</p>
                        <span className="ml-auto text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5">Open <ExternalLink size={9} /></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-3">
                        <span className="truncate max-w-[120px]">{t.pickup || '—'}</span>
                        <ArrowRight size={11} className="text-ink-4 shrink-0" />
                        <MapPin size={10} className="text-urgent shrink-0" />
                        <span className="truncate max-w-[120px]">{t.dropoff || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="neutral" className="text-xs">{t.mobility || 'Ambulatory'}</Badge>
                        {t.miles && <span className="text-xs text-ink-4">{t.miles} mi</span>}
                      </div>
                    </button>

                    {/* Quick dispatch actions — reassign to another driver or pull off this run */}
                    {updateTrip && !['completed', 'in_trip', 'arrived'].includes(t.status) && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <select
                          value={String(t.driverId || '')}
                          onChange={(e) => updateTrip(t.id, {
                            driverId: e.target.value,
                            status: e.target.value
                              ? (['pending_review', 'confirmed'].includes(t.status) ? 'assigned' : t.status)
                              : 'confirmed',
                          })}
                          className="flex-1 bg-white border border-line-2 rounded-lg py-1 pl-2 pr-6 text-xs font-medium text-ink outline-none cursor-pointer focus:ring-2 focus:ring-primary/15 appearance-none"
                          title="Reassign to another driver"
                        >
                          <option value="">Unassigned</option>
                          {(drivers || []).map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}{d.onDuty ? '' : ' (off-duty)'}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => updateTrip(t.id, { driverId: '', status: 'confirmed' })}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-urgent bg-urgent/5 hover:bg-urgent/10 border border-urgent/15 transition-colors shrink-0"
                          title="Remove from this driver"
                        >
                          <UserMinus size={11} /> Unassign
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  ), document.body);
};
