import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Truck, Clock, MapPin, Users, Calendar,
  Search, AlertTriangle, UserPlus, Activity, CheckCircle2, CircleDot, Layers
} from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';
import { formatTime } from '@/utils/helpers';
import { DriverDayPanel } from './DriverDayPanel';

interface ScheduleTabProps {
  drivers: any[];
  trips: any[];
  /** Open the shared trip detail / assignment drawer (reuses the existing flow). */
  onTripClick?: (id: string) => void;
}

// Timeline window: 6 AM → 10 PM (covers virtually all NEMT operating hours).
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TOTAL_MIN = TOTAL_HOURS * 60;

const IN_PROGRESS = ['dispatched', 'en_route', 'arrived', 'in_trip'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Estimated trip length in minutes (duration string → miles → sensible default).
const estDurationMin = (trip: any): number => {
  if (trip?.duration) {
    const m = parseInt(String(trip.duration), 10);
    if (!isNaN(m) && m > 0) return Math.min(m, 180);
  }
  if (trip?.miles) return Math.min(150, Math.round(Number(trip.miles) * 3) + 12);
  return 45;
};

const minutesFromDate = (d: Date) => (d.getHours() - START_HOUR) * 60 + d.getMinutes();

const pctFromMinutes = (mins: number) => {
  const clamped = Math.max(0, Math.min(TOTAL_MIN, mins));
  return (clamped / TOTAL_MIN) * 100;
};

// Status → left-accent + dot color, aligned with TripStatusBadge semantics.
const statusAccent = (status: string) => {
  if (IN_PROGRESS.includes(status)) return 'bg-urgent';
  if (status === 'completed') return 'bg-accent';
  if (status === 'no_show' || status === 'cancelled') return 'bg-ink-4';
  if (status === 'arrived') return 'bg-warning';
  return 'bg-primary';
};

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ drivers, trips, onTripClick }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [focus, setFocus] = useState<'all' | 'conflicts'>('all');
  const [hideOffDuty, setHideOffDuty] = useState(true);
  const [dayDriverId, setDayDriverId] = useState<string | null>(null);
  const initialized = useRef(false);

  // Mock trips are dated in the past relative to "today"; on first load land the
  // dispatcher on the busiest day so the board is immediately meaningful.
  useEffect(() => {
    if (initialized.current || !trips || trips.length === 0) return;
    initialized.current = true;
    const todayCount = trips.filter((t: any) => t?.scheduledTime && sameDay(new Date(t.scheduledTime), new Date())).length;
    if (todayCount > 0) return;
    const counts: Record<string, number> = {};
    trips.forEach((t: any) => {
      if (!t?.scheduledTime || t.status === 'cancelled') return;
      const key = new Date(t.scheduledTime).toDateString();
      counts[key] = (counts[key] || 0) + 1;
    });
    const busiest = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (busiest) setSelectedDate(new Date(busiest[0]));
  }, [trips]);

  const q = search.trim().toLowerCase();
  const isToday = sameDay(selectedDate, new Date());

  // All non-cancelled trips on the selected day (used for KPIs — stable, pre-filter).
  const dayTrips = useMemo(() => {
    return (trips || []).filter((t: any) => {
      if (!t?.scheduledTime || t.status === 'cancelled') return false;
      return sameDay(new Date(t.scheduledTime), selectedDate);
    });
  }, [trips, selectedDate]);

  // Apply the search + status filters used by the board/lane (not the KPIs).
  const matchesFilters = (t: any) => {
    const statusOk = statusFilter === 'all' || t.status === statusFilter;
    const searchOk = !q ||
      (t?.rider?.name || '').toLowerCase().includes(q) ||
      (t?.id || '').toLowerCase().includes(q) ||
      (t?.pickup || '').toLowerCase().includes(q) ||
      (t?.dropoff || '').toLowerCase().includes(q);
    return statusOk && searchOk;
  };

  const driverById = useMemo(() => {
    const m: Record<string, any> = {};
    (drivers || []).forEach(d => { m[String(d.id)] = d; });
    return m;
  }, [drivers]);

  // Per-driver sorted trips + conflict detection (overlap with previous trip's est. end).
  const { tripsByDriver, conflictIds } = useMemo(() => {
    const byDriver: Record<string, any[]> = {};
    const conflicts = new Set<string>();
    (drivers || []).forEach(d => { byDriver[String(d.id)] = []; });
    dayTrips.forEach((t: any) => {
      if (t.driverId && byDriver[String(t.driverId)]) byDriver[String(t.driverId)].push(t);
    });
    Object.values(byDriver).forEach(list => {
      list.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
      for (let i = 1; i < list.length; i++) {
        const prevEnd = new Date(list[i - 1].scheduledTime).getTime() + estDurationMin(list[i - 1]) * 60000;
        const curStart = new Date(list[i].scheduledTime).getTime();
        if (curStart < prevEnd) { conflicts.add(list[i].id); conflicts.add(list[i - 1].id); }
      }
    });
    return { tripsByDriver: byDriver, conflictIds: conflicts };
  }, [dayTrips, drivers]);

  // KPI metrics for the day.
  const kpis = useMemo(() => {
    const assigned = dayTrips.filter((t: any) => t.driverId).length;
    const unassigned = dayTrips.length - assigned;
    const inProgress = dayTrips.filter((t: any) => IN_PROGRESS.includes(t.status)).length;
    const completed = dayTrips.filter((t: any) => t.status === 'completed').length;
    const onDuty = (drivers || []).filter((d: any) => d?.onDuty).length;
    return { total: dayTrips.length, assigned, unassigned, inProgress, completed, conflicts: conflictIds.size, onDuty };
  }, [dayTrips, conflictIds, drivers]);

  // Drivers shown on the board.
  const visibleDrivers = useMemo(() => {
    let list = (drivers || []).filter(d => {
      const hasTrips = (tripsByDriver[String(d.id)] || []).length > 0;
      if (hideOffDuty && !d.onDuty && !hasTrips) return false;
      if (q && !(d.name || '').toLowerCase().includes(q) && !hasTrips) return false;
      return true;
    });
    if (focus === 'conflicts') {
      list = list.filter(d => (tripsByDriver[String(d.id)] || []).some((t: any) => conflictIds.has(t.id)));
    }
    return list;
  }, [drivers, tripsByDriver, hideOffDuty, q, focus, conflictIds]);

  const timelineHours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const nowPct = pctFromMinutes(minutesFromDate(new Date()));

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'en_route', label: 'En Route' },
    { value: 'in_trip', label: 'In Trip' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending_review', label: 'Pending Review' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-16">
      {/* ───────── Toolbar ───────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-line-2 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date navigator */}
          <div className="flex items-center gap-1.5 p-1 bg-bg rounded-xl border border-line-2">
            <button onClick={() => shiftDay(-1)} className="w-8 h-8 rounded-lg bg-white hover:bg-primary/5 flex items-center justify-center text-ink-3 hover:text-primary transition-all border border-line-2/50 shadow-sm" title="Previous day">
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 text-xs font-semibold text-ink min-w-[150px] text-center flex items-center justify-center gap-2">
              <Calendar size={14} className="text-primary" />
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {isToday && <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">TODAY</span>}
            </div>
            <button onClick={() => shiftDay(1)} className="w-8 h-8 rounded-lg bg-white hover:bg-primary/5 flex items-center justify-center text-ink-3 hover:text-primary transition-all border border-line-2/50 shadow-sm" title="Next day">
              <ChevronRight size={16} />
            </button>
            {!isToday && (
              <button onClick={() => setSelectedDate(new Date())} className="ml-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition-all">
                Today
              </button>
            )}
          </div>

          <input
            type="date"
            value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
            onChange={(e) => { if (e.target.value) { const [y, m, d] = e.target.value.split('-').map(Number); setSelectedDate(new Date(y, m - 1, d)); } }}
            onClick={(e) => { try { e.currentTarget.showPicker(); } catch { /* noop */ } }}
            className="bg-white border border-line-2 hover:border-primary/40 rounded-xl py-2 px-3 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer transition-all"
            title="Jump to date"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={15} />
            <input
              type="text"
              placeholder="Search driver, rider, trip…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-line-2 hover:border-primary/40 rounded-xl text-xs font-medium text-ink placeholder:text-ink-4/80 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none transition-all"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Focus quick-filter */}
          <div className="flex items-center gap-0.5 bg-bg p-1 rounded-xl border border-line-2">
            {([
              { id: 'all', label: 'All' },
              { id: 'conflicts', label: `Conflicts${kpis.conflicts ? ` (${kpis.conflicts})` : ''}` },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setFocus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${focus === f.id ? 'bg-white shadow-sm text-primary' : 'text-ink-4 hover:text-ink'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setHideOffDuty(v => !v)}
            className={`px-3 h-9 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${hideOffDuty ? 'bg-white text-ink-3 border-line-2 hover:bg-bg' : 'bg-primary/10 text-primary border-primary/20'}`}
            title="Toggle off-duty drivers"
          >
            {hideOffDuty ? 'Hide off-duty' : 'Showing all'}
          </button>
        </div>
      </div>

      {/* ───────── KPI strip ───────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Trips', value: kpis.total, icon: Layers, tone: 'text-ink', bg: 'bg-ink/5', ic: 'text-ink-3' },
          { label: 'Assigned', value: kpis.assigned, icon: CheckCircle2, tone: 'text-ink', bg: 'bg-accent/10', ic: 'text-accent' },
          { label: 'In Progress', value: kpis.inProgress, icon: Activity, tone: 'text-ink', bg: 'bg-primary/10', ic: 'text-primary' },
          { label: 'Completed', value: kpis.completed, icon: CircleDot, tone: 'text-ink', bg: 'bg-accent/10', ic: 'text-accent' },
          { label: 'Conflicts', value: kpis.conflicts, icon: AlertTriangle, tone: kpis.conflicts ? 'text-urgent' : 'text-ink', bg: 'bg-urgent/10', ic: 'text-urgent' },
        ].map(k => (
          <div key={k.label} className="flex items-center gap-3 px-3.5 py-3 bg-white rounded-2xl border border-line-2 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
              <k.icon size={16} className={k.ic} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-ink-4 uppercase tracking-wide truncate">{k.label}</p>
              <p className={`text-xl font-bold leading-none ${k.tone}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ───────── Conflict banner (only when action is needed) ───────── */}
      {kpis.conflicts > 0 && focus === 'all' && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border border-urgent/20 bg-urgent-light/30">
          <AlertTriangle size={16} className="text-urgent shrink-0" />
          <p className="text-xs font-medium text-ink">
            <span className="font-bold text-urgent">{kpis.conflicts}</span> scheduling {kpis.conflicts === 1 ? 'conflict' : 'conflicts'} detected
          </p>
          <button onClick={() => setFocus('conflicts')} className="ml-auto text-xs font-semibold text-urgent hover:underline">View conflicts →</button>
        </div>
      )}

      {/* ───────── Driver timeline (Gantt) ───────── */}
      {(
        <Card className="overflow-x-auto relative p-0">
          <div className="min-w-[1100px]">
            {/* Header / hour ruler */}
            <div className="sticky top-0 z-30 flex bg-bg border-b border-line-2">
              <div className="w-[260px] min-w-[260px] shrink-0 p-4 border-r border-line-2 flex items-center justify-between">
                <span className="text-xs font-bold text-ink-3 uppercase tracking-wide">Driver & Fleet</span>
                <span className="text-[10px] text-ink-4">{visibleDrivers.length}</span>
              </div>
              <div className="flex-1 relative h-14">
                {timelineHours.map((hour, idx) => {
                  const left = (idx / TOTAL_HOURS) * 100;
                  const display = hour > 12 ? hour - 12 : hour;
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  return (
                    <div key={hour} className="absolute top-0 bottom-0 border-l border-line-2/40" style={{ left: `${left}%` }}>
                      <span className="absolute -left-5 top-4 w-10 text-center text-[10px] font-bold text-ink-3">
                        {display}<span className="text-[8px] text-ink-4 ml-0.5">{ampm}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-line-2/40 relative bg-bg/20">
              {/* Current time line (today only) */}
              {isToday && nowPct > 0 && nowPct < 100 && (
                <div className="absolute top-0 bottom-0 w-[2px] bg-urgent z-40 pointer-events-none" style={{ left: `calc(260px + (100% - 260px) * ${nowPct / 100})` }}>
                  <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-urgent shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse" />
                </div>
              )}

              {visibleDrivers.map(driver => {
                const driverTrips = tripsByDriver[String(driver.id)] || [];
                const shownTrips = driverTrips.filter(matchesFilters);
                const totalMiles = driverTrips.reduce((s: number, t: any) => s + (Number(t.miles) || 0), 0);
                const hasConflict = driverTrips.some((t: any) => conflictIds.has(t.id));

                return (
                  <div key={driver.id} className="flex min-h-[88px] group hover:bg-white/60 transition-colors relative z-10">
                    {/* Driver sidebar — click to open the driver's run sheet */}
                    <button
                      type="button"
                      onClick={() => setDayDriverId(driver.id)}
                      title="View this driver's day"
                      className="w-[260px] min-w-[260px] shrink-0 p-3 border-r border-line-2/40 bg-bg/20 hover:bg-primary-tint/20 transition-colors flex flex-col justify-center gap-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={driver.initials} size="sm" online={driver.onDuty} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-ink truncate">{driver.name}</p>
                            {hasConflict && <AlertTriangle size={11} className="text-urgent shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Truck size={10} className="text-ink-4 shrink-0" />
                            <span className="text-[10px] text-ink-4 truncate">{driver.vehicle?.plate || '—'} · {driver.vehicle?.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pl-10">
                        {driverTrips.length > 0 ? (
                          <>
                            <Badge variant="primary" className="text-[9px] py-0">{driverTrips.length} {driverTrips.length === 1 ? 'trip' : 'trips'}</Badge>
                            {totalMiles > 0 && <span className="text-[9px] font-medium text-ink-4">{totalMiles.toFixed(1)} mi</span>}
                          </>
                        ) : (
                          <span className="text-[9px] font-medium text-ink-4">{driver.onDuty ? 'On duty · idle' : 'Off duty'}</span>
                        )}
                      </div>
                    </button>

                    {/* Timeline lane */}
                    <div className="flex-1 relative p-2 overflow-hidden bg-white">
                      {timelineHours.map((_, idx) => (
                        <div key={`bg-${idx}`} className="absolute top-0 bottom-0 border-l border-line-2/20" style={{ left: `${(idx / TOTAL_HOURS) * 100}%` }} />
                      ))}

                      {shownTrips.map((trip: any, idx: number) => {
                        const start = new Date(trip.scheduledTime);
                        const startMin = minutesFromDate(start);
                        const startPct = pctFromMinutes(startMin);
                        const endPct = pctFromMinutes(startMin + estDurationMin(trip));
                        const width = Math.max(endPct - startPct, 3.5);
                        const conflict = conflictIds.has(trip.id);
                        const inProgress = IN_PROGRESS.includes(trip.status);
                        const isLast = idx === shownTrips.length - 1;

                        // Pull-out marker on the first trip of the day.
                        const pullOut = idx === 0 && startPct > 1 ? (
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-[calc(100%+6px)] flex items-center gap-1 z-10" style={{ left: `${startPct}%` }}>
                            <span className="text-[8px] font-black text-primary/60 uppercase tracking-wide bg-primary/5 px-1.5 py-0.5 rounded-full border border-primary/20 whitespace-nowrap">Pull-Out</span>
                          </div>
                        ) : null;

                        // Standby gap between the previous trip and this one.
                        let gap = null;
                        if (idx > 0) {
                          const prev = shownTrips[idx - 1];
                          const prevEndPct = pctFromMinutes(minutesFromDate(new Date(prev.scheduledTime)) + estDurationMin(prev));
                          const gapW = startPct - prevEndPct;
                          if (gapW > 2 && !conflict) {
                            gap = (
                              <div
                                className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-line-2/70 group/gap z-10"
                                style={{ left: `${prevEndPct}%`, width: `${gapW}%` }}
                                title="Standby"
                              >
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-ink-4 opacity-0 group-hover/gap:opacity-100 transition-opacity whitespace-nowrap">Standby</span>
                              </div>
                            );
                          }
                        }

                        // Pull-in marker after the last trip of the day.
                        const pullIn = isLast && endPct < 99 ? (
                          <div className="absolute top-1/2 -translate-y-1/2 translate-x-2 flex items-center gap-1 z-10" style={{ left: `${endPct}%` }}>
                            <span className="text-[8px] font-black text-ink-4 uppercase tracking-wide bg-ink/5 px-1.5 py-0.5 rounded-full border border-line-2 whitespace-nowrap">Pull-In</span>
                          </div>
                        ) : null;

                        return (
                          <React.Fragment key={trip.id}>
                            {pullOut}
                            {gap}
                            {pullIn}
                            <button
                              onClick={() => onTripClick?.(trip.id)}
                              title={`#${trip.id} · ${trip.rider?.name || ''}\n${formatTime(trip.scheduledTime)} · ${trip.type === 'round_trip' ? 'Round Trip' : 'One Way'}\nPickup: ${trip.pickup || '—'}\nDrop-off: ${trip.dropoff || '—'}\nStatus: ${String(trip.status).replace(/_/g, ' ')}${conflict ? ' · ⚠ TIME CONFLICT' : ''}`}
                              className={`absolute top-2 bottom-2 min-w-[120px] rounded-xl shadow-sm border bg-white transition-all cursor-pointer flex flex-col overflow-visible group/trip z-20 hover:z-40 hover:-translate-y-0.5 text-left ${conflict ? 'border-urgent ring-1 ring-urgent/30 hover:ring-urgent/50 hover:shadow-lg' : 'border-line-2 hover:border-primary/50 hover:shadow-lg'}`}
                              style={{ left: `${startPct}%`, width: `${width}%` }}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${statusAccent(trip.status)}`} />
                              <div className="flex-1 p-1.5 pl-2.5 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] font-bold text-primary truncate">#{String(trip.id).split('-')[1] || trip.id}</span>
                                  {conflict ? (
                                    <AlertTriangle size={11} className="text-urgent shrink-0" />
                                  ) : inProgress ? (
                                    <span className="flex h-2 w-2 relative shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-urgent opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-urgent" />
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs font-semibold text-ink truncate mb-1">{trip.rider?.name}</p>
                                <div className="flex items-center gap-1 mt-auto bg-bg/60 px-1 py-0.5 rounded w-fit">
                                  <Clock size={9} className="text-ink-4 shrink-0" />
                                  <span className="text-[9px] font-medium text-ink-3">{formatTime(trip.scheduledTime)}</span>
                                </div>
                              </div>
                            </button>
                          </React.Fragment>
                        );
                      })}

                      {driverTrips.length === 0 && (
                        <div className="absolute inset-0 flex items-center pl-3">
                          <span className="text-[10px] text-ink-4/70 italic">No trips scheduled</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty states */}
              {visibleDrivers.length === 0 && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-line-2 flex items-center justify-center mb-3">
                    <Users size={20} className="text-ink-4" />
                  </div>
                  <p className="text-sm font-semibold text-ink">{focus === 'conflicts' ? 'No conflicts 🎉' : 'No drivers match'}</p>
                  <p className="text-xs text-ink-4 mt-0.5 max-w-xs">
                    {focus === 'conflicts'
                      ? 'Every assigned trip has a clear time slot for this day.'
                      : q ? 'Try a different search, or show off-duty drivers.' : 'No operators are on duty for this date.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Day-level empty state */}
      {dayTrips.length === 0 && (
        <Card className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg border border-line-2 flex items-center justify-center mb-4">
            <Calendar size={24} className="text-ink-4" />
          </div>
          <p className="text-sm font-semibold text-ink">No trips scheduled for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
          <p className="text-xs text-ink-4 mt-1 max-w-sm">Pick another date, or create a booking to start building this day's schedule.</p>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        {[
          { c: 'bg-primary', l: 'Scheduled' },
          { c: 'bg-warning', l: 'Arrived' },
          { c: 'bg-urgent', l: 'In progress' },
          { c: 'bg-accent', l: 'Completed' },
        ].map(x => (
          <div key={x.l} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${x.c}`} />
            <span className="text-[11px] text-ink-4">{x.l}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={11} className="text-urgent" />
          <span className="text-[11px] text-ink-4">Time conflict</span>
        </div>
        <span className="text-[11px] text-ink-4 ml-auto hidden sm:inline">Tip: click a driver to open their full day run sheet</span>
      </div>

      {/* Dedicated single-driver day run sheet */}
      {dayDriverId && (
        <DriverDayPanel
          driver={(drivers || []).find((d: any) => String(d.id) === String(dayDriverId))}
          trips={trips}
          date={selectedDate}
          onClose={() => setDayDriverId(null)}
          onTripClick={onTripClick}
        />
      )}
    </div>
  );
};
