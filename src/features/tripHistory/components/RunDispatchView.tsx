import React, { useMemo, useState, useEffect } from 'react';
import {
  Truck, Clock, MapPin, AlertTriangle, LogOut, LogIn, Coffee, Users, ArrowRight, ExternalLink, ChevronDown,
} from 'lucide-react';
import { Card, Avatar, TripStatusBadge } from '@/shared/components/ui';
import { formatTime } from '@/utils/helpers';

interface RunDispatchViewProps {
  drivers: any[];
  trips: any[];
  date: Date;
  onTripClick?: (id: string) => void;
  /** Persist live dispatch actuals (status advance) from the manifest. */
  updateTrip?: (id: string, patch: Record<string, any>) => void;
}

const DEPOT_BUFFER = 15;
const IN_PROGRESS = ['dispatched', 'en_route', 'arrived', 'in_trip'];

// Forward lifecycle: one tap advances a trip to its next operational state.
const NEXT_STATUS: Record<string, string> = {
  pending_review: 'confirmed',
  confirmed: 'dispatched',
  assigned: 'dispatched',
  dispatched: 'en_route',
  en_route: 'arrived',
  arrived: 'in_trip',
  in_trip: 'completed',
};
// Action label for the *current* status (what the next tap does).
const STEP_LABEL: Record<string, string> = {
  pending_review: 'Confirm',
  confirmed: 'Dispatch',
  assigned: 'Dispatch',
  dispatched: 'En route',
  en_route: 'Arrived',
  arrived: 'Start',
  in_trip: 'Complete',
};
// Capture an actual timestamp alongside the status change where it makes sense.
const stampFor = (next: string): Record<string, any> => {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (next === 'dispatched') return { dispatchTime: hhmm };
  if (next === 'in_trip') return { departureTime: hhmm };
  if (next === 'completed') return { arrivalTime: hhmm };
  return {};
};

const estDurationMin = (t: any): number => {
  if (t?.duration) { const m = parseInt(String(t.duration), 10); if (!isNaN(m) && m > 0) return Math.min(m, 180); }
  if (t?.miles) return Math.min(150, Math.round(Number(t.miles) * 3) + 12);
  return 45;
};
const minsToLabel = (m: number) => {
  const v = Math.max(0, Math.round(m));
  const h = Math.floor(v / 60); const r = v % 60;
  return h ? `${h}h${r ? ` ${r}m` : ''}` : `${r}m`;
};
const parseTimeToMin = (s?: string): number | null => {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10); const min = parseInt(m[2], 10); const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};
const cityFrom = (addr?: string) => {
  const p = String(addr || '').split(',');
  return p.length >= 2 ? p[1].trim() : '';
};
const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Run Dispatch — MediRoutes-style operational manifest in our design system.
 * A "run" = a driver's trips for the selected day. Each trip expands into pickup +
 * drop-off legs (derived, not duplicated). All data comes from the shared trips;
 * clicking a leg opens the same edit modal, so Booking/Trip History stay in sync.
 */
export const RunDispatchView: React.FC<RunDispatchViewProps> = ({ drivers, trips, date, onTripClick, updateTrip }) => {
  const driverById = useMemo(() => {
    const m: Record<string, any> = {};
    (drivers || []).forEach(d => { m[String(d.id)] = d; });
    return m;
  }, [drivers]);

  // Runs = drivers that have assigned trips on this day.
  const runs = useMemo(() => {
    const byDriver: Record<string, any[]> = {};
    (trips || []).forEach((t: any) => {
      if (!t?.scheduledTime || t.status === 'cancelled' || !t.driverId) return;
      if (!sameDay(new Date(t.scheduledTime), date)) return;
      (byDriver[String(t.driverId)] ||= []).push(t);
    });
    return Object.entries(byDriver).map(([driverId, list]) => ({
      driverId,
      driver: driverById[driverId],
      trips: list.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()),
    })).sort((a, b) => (b.trips.length - a.trips.length));
  }, [trips, date, driverById]);

  const [runId, setRunId] = useState<string | null>(null);
  useEffect(() => {
    if (runs.length === 0) { setRunId(null); return; }
    if (!runId || !runs.find(r => r.driverId === runId)) setRunId(runs[0].driverId);
  }, [runs, runId]);

  const run = runs.find(r => r.driverId === runId) || null;

  // Build the leg-based manifest rows for the selected run.
  const { rows, totalMiles, lateCount } = useMemo(() => {
    if (!run) return { rows: [] as any[], totalMiles: 0, lateCount: 0 };
    const out: any[] = [];
    let seq = 0;
    let miles = 0;
    let late = 0;
    const list = run.trips;
    if (list.length) {
      out.push({ kind: 'pullout', time: addMin(new Date(list[0].scheduledTime), -DEPOT_BUFFER), to: list[0].pickup });
    }
    list.forEach((t: any, i: number) => {
      const start = new Date(t.scheduledTime);
      const dur = estDurationMin(t);
      const end = addMin(start, dur);
      const apptMin = parseTimeToMin(t.appointmentTime);
      const isLate = apptMin != null && (start.getHours() * 60 + start.getMinutes() + dur) > apptMin;
      if (isLate) late++;
      miles += Number(t.miles) || 0;

      // standby gap before this trip
      if (i > 0) {
        const prev = list[i - 1];
        const prevEnd = addMin(new Date(prev.scheduledTime), estDurationMin(prev));
        const gap = (start.getTime() - prevEnd.getTime()) / 60000;
        if (gap < -1) out.push({ kind: 'conflict', mins: Math.abs(gap) });
        else if (gap > 5) out.push({ kind: 'gap', mins: gap });
      }

      out.push({
        kind: 'leg', leg: 'pickup', trip: t, seq: ++seq,
        time: t.requestedPickup || formatTime(t.scheduledTime),
        appt: '', eta: formatTime(start.toISOString()), travel: dur, dist: t.miles,
        on: t.passengers ?? 1, space: t.driverId ? (driverById[String(t.driverId)]?.vehicle?.seats ?? '') : '',
        address: t.pickup, city: cityFrom(t.pickup), late: false,
      });
      (Array.isArray(t.stops) ? t.stops : (t.stop ? [t.stop] : [])).forEach((s: string) => {
        out.push({ kind: 'leg', leg: 'stop', trip: t, seq: ++seq, time: '', appt: '', eta: '', travel: '', dist: '', address: s, city: cityFrom(s), late: false });
      });
      out.push({
        kind: 'leg', leg: 'dropoff', trip: t, seq: ++seq,
        time: '', appt: t.appointmentTime || '', eta: formatTime(end.toISOString()), travel: '', dist: '',
        address: t.dropoff, city: cityFrom(t.dropoff), late: isLate,
      });
    });
    if (list.length) {
      const last = list[list.length - 1];
      out.push({ kind: 'pullin', time: addMin(new Date(last.scheduledTime), estDurationMin(last) + DEPOT_BUFFER), from: last.dropoff });
    }
    return { rows: out, totalMiles: miles, lateCount: late };
  }, [run, driverById]);

  if (runs.length === 0) {
    return (
      <Card className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-bg border border-line-2 flex items-center justify-center mb-3"><Truck size={20} className="text-ink-4" /></div>
        <p className="text-sm font-semibold text-ink">No active runs for this day</p>
        <p className="text-xs text-ink-4 mt-1">Assign drivers to trips to build a run manifest.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Run header / selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-line-2 bg-bg/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={runId || ''}
              onChange={(e) => setRunId(e.target.value)}
              className="appearance-none bg-white border border-line-2 rounded-xl pl-3 pr-9 py-2 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
            >
              {runs.map(r => (
                <option key={r.driverId} value={r.driverId}>
                  {(r.driver?.vehicle?.type || 'Run')} · {r.driver?.name || r.driverId} ({r.trips.length})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
          </div>
          {run?.driver && (
            <div className="hidden sm:flex items-center gap-2">
              <Avatar initials={run.driver.initials} size="xs" online={run.driver.onDuty} />
              <span className="text-xs text-ink-4">{run.driver.vehicle?.plate}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-ink-3"><span className="font-bold text-ink">{run?.trips.length || 0}</span> trips</span>
          <span className="text-xs font-medium text-ink-3"><span className="font-bold text-ink">{totalMiles.toFixed(1)}</span> mi est.</span>
          {lateCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-urgent bg-urgent-light/40 border border-urgent/20 px-2 py-0.5 rounded-full">
              <AlertTriangle size={11} /> {lateCount} running late
            </span>
          )}
        </div>
      </div>

      {/* Manifest */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead className="bg-bg/50 border-b border-line-2">
            <tr>
              {['#', 'Stop', 'Time', 'Appt', 'ETA', 'Travel', 'Dist', 'On/Sp', 'Address', 'City', 'Funding', 'Status', ''].map((h, i) => (
                <th key={h || i} className="px-3 py-2.5 type-th whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2/60">
            {rows.map((r, idx) => {
              if (r.kind === 'pullout' || r.kind === 'pullin') {
                const isOut = r.kind === 'pullout';
                return (
                  <tr key={`${r.kind}-${idx}`} className="bg-bg/30">
                    <td className="px-3 py-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center ${isOut ? 'bg-primary/10 text-primary' : 'bg-ink/5 text-ink-3'}`}>
                        {isOut ? <LogOut size={11} /> : <LogIn size={11} />}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink-3 whitespace-nowrap">{isOut ? 'Pull-Out' : 'Pull-In'}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-ink-3 whitespace-nowrap">{formatTime(r.time.toISOString())}</td>
                    <td colSpan={5} />
                    <td className="px-3 py-2 text-xs text-ink-4">{isOut ? `Depot → ${cityFrom(r.to) || 'first pickup'}` : `${cityFrom(r.from) || 'last drop-off'} → Depot`}</td>
                    <td colSpan={3} />
                  </tr>
                );
              }
              if (r.kind === 'gap' || r.kind === 'conflict') {
                const conflict = r.kind === 'conflict';
                return (
                  <tr key={`gap-${idx}`}>
                    <td />
                    <td colSpan={12} className="px-3 py-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 border ${conflict ? 'text-urgent bg-urgent-light/40 border-urgent/20' : 'text-ink-4 bg-bg border-line-2'}`}>
                        {conflict ? <><AlertTriangle size={10} /> Overlap · {minsToLabel(r.mins)}</> : <><Coffee size={10} /> Standby · {minsToLabel(r.mins)}</>}
                      </span>
                    </td>
                  </tr>
                );
              }
              // leg row
              const t = r.trip;
              const isPickup = r.leg === 'pickup';
              const isStop = r.leg === 'stop';
              const dot = isPickup ? 'border-primary' : isStop ? 'border-warning' : 'border-urgent';
              return (
                <tr key={`${t.id}-${r.leg}-${idx}`} className="hover:bg-primary-tint/10 transition-colors group cursor-pointer" onClick={() => onTripClick?.(t.id)}>
                  <td className="px-3 py-2.5 text-xs font-semibold text-ink-3">{r.seq}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full border-2 bg-white ${dot} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink whitespace-nowrap flex items-center gap-1.5">
                          {t.rider?.name || 'Unknown'}
                          {r.leg === 'dropoff' && t.returnType === 'will_call' && (
                            <span className="text-xs font-bold uppercase tracking-wide text-warning-dark bg-warning/15 border border-warning/30 rounded-full px-1.5 py-0.5">Will-Call</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-4">{isPickup ? 'Pickup' : isStop ? 'Stop' : 'Drop-off'} · #{t.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-ink whitespace-nowrap">{r.time || '—'}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-primary whitespace-nowrap">{r.appt || '—'}</td>
                  <td className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap ${r.late ? 'text-urgent' : 'text-ink-3'}`}>
                    {r.eta || '—'}{r.late && <AlertTriangle size={10} className="inline ml-1 -mt-0.5" />}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-4 whitespace-nowrap">{r.travel ? minsToLabel(r.travel) : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-4 whitespace-nowrap">{r.dist ? `${r.dist} mi` : '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-4 whitespace-nowrap">
                    {isPickup ? <span className="inline-flex items-center gap-1"><Users size={10} />{r.on}{r.space ? `/${r.space}` : ''}</span> : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs text-ink-3 max-w-[200px]">
                      <MapPin size={11} className={isPickup ? 'text-primary shrink-0' : 'text-urgent shrink-0'} />
                      <span className="truncate" title={r.address}>{r.address || '—'}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-3 whitespace-nowrap">{r.city || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-3 whitespace-nowrap max-w-[140px] truncate" title={t.fundingSource || t.paymentMethod || ''}>{t.fundingSource || t.paymentMethod || '—'}</td>
                  <td className="px-3 py-2.5">
                    {isPickup ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <TripStatusBadge status={t.status} className="text-xs" />
                        {updateTrip && NEXT_STATUS[t.status] && (
                          <button
                            type="button"
                            onClick={() => { const next = NEXT_STATUS[t.status]; updateTrip(t.id, { status: next, ...stampFor(next) }); }}
                            title={`Mark ${STEP_LABEL[t.status]}`}
                            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-full px-2 py-0.5 transition-all whitespace-nowrap"
                          >
                            {STEP_LABEL[t.status]} →
                          </button>
                        )}
                      </div>
                    ) : (IN_PROGRESS.includes(t.status) ? <ArrowRight size={12} className="text-urgent" /> : null)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5">Open <ExternalLink size={9} /></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 border-t border-line-2 bg-bg/20">
        {[
          { c: 'border-primary', l: 'Pickup' },
          { c: 'border-warning', l: 'Stop' },
          { c: 'border-urgent', l: 'Drop-off' },
        ].map(x => (
          <span key={x.l} className="inline-flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full border-2 bg-white ${x.c}`} /><span className="text-xs text-ink-4">{x.l}</span></span>
        ))}
        <span className="inline-flex items-center gap-1.5"><Clock size={11} className="text-ink-4" /><span className="text-xs text-ink-4">ETA · red = running late</span></span>
        <span className="text-xs text-ink-4 ml-auto">Click any leg to open & edit the trip</span>
      </div>
    </Card>
  );
};
