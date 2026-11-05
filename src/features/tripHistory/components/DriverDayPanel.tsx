import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  LogOut,
  LogIn,
  MapPin,
  Clock,
  AlertTriangle,
  Coffee,
  Truck,
  ExternalLink,
  ArrowRight,
  UserMinus,
} from "lucide-react";
import { Avatar, Badge, TripStatusBadge } from "@/shared/components/ui";
import { formatTime } from "@/utils/helpers";
import type { TripHistoryDriver, TripHistoryRecord, TripUpdateHandler } from "../types";
import {
  addMinutes,
  estimateTripDurationMinutes,
  formatDurationMinutes,
  formatLocalDateKey,
  isSameCalendarDay,
} from "../utils/dateTime";

interface DriverDayPanelProps {
  driver: TripHistoryDriver;
  trips: TripHistoryRecord[];
  date: Date;
  onClose: () => void;
  onTripClick?: (id: string) => void;
  /** Full driver roster for reassignment. */
  drivers?: TripHistoryDriver[];
  /** Persist reassign/unassign (id, patch). */
  updateTrip?: TripUpdateHandler;
}

const DEPOT_BUFFER_MIN = 15; // pull-out / pull-in depot travel allowance

export const DriverDayPanel: React.FC<DriverDayPanelProps> = ({
  driver,
  trips,
  date,
  onClose,
  onTripClick,
  drivers,
  updateTrip,
}) => {
  const dayTrips = useMemo(() => {
    return (trips || [])
      .filter((t: any) => {
        if (String(t?.driverId) !== String(driver?.id) || t.status === "cancelled") return false;
        const targetDateKey = formatLocalDateKey(date);
        return t?.serviceDate
          ? t.serviceDate === targetDateKey
          : t?.scheduledTime && isSameCalendarDay(new Date(t.scheduledTime), date);
      })
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }, [trips, driver, date]);

  // Build the run sheet: pull-out → trips (with gaps) → pull-in.
  const segments = useMemo(() => {
    const segs: any[] = [];
    if (dayTrips.length === 0) return segs;

    const firstStart = new Date(dayTrips[0].scheduledTime);
    segs.push({
      kind: "pullout",
      time: addMinutes(firstStart, -DEPOT_BUFFER_MIN),
      to: dayTrips[0].pickup,
    });

    dayTrips.forEach((t: any, i: number) => {
      const start = new Date(t.scheduledTime);
      const end = addMinutes(start, estimateTripDurationMinutes(t));
      if (i > 0) {
        const prev = dayTrips[i - 1];
        const prevEnd = addMinutes(new Date(prev.scheduledTime), estimateTripDurationMinutes(prev));
        const gapMin = (start.getTime() - prevEnd.getTime()) / 60000;
        if (gapMin < -1) segs.push({ kind: "conflict", mins: Math.abs(gapMin) });
        else if (gapMin > 5) segs.push({ kind: "gap", mins: gapMin });
      }
      segs.push({ kind: "trip", trip: t, start, end });
    });

    const last = dayTrips[dayTrips.length - 1];
    const lastEnd = addMinutes(new Date(last.scheduledTime), estimateTripDurationMinutes(last));
    segs.push({ kind: "pullin", time: lastEnd, from: last.dropoff });
    return segs;
  }, [dayTrips]);

  const totalMiles = dayTrips.reduce((s: number, t: any) => s + (Number(t.miles) || 0), 0);
  const firstStart = dayTrips[0] ? new Date(dayTrips[0].scheduledTime) : null;
  const lastEnd = dayTrips.length
    ? addMinutes(
        new Date(dayTrips[dayTrips.length - 1].scheduledTime),
        estimateTripDurationMinutes(dayTrips[dayTrips.length - 1]),
      )
    : null;
  const dutyWindow =
    firstStart && lastEnd
      ? `${formatTime(firstStart.toISOString())} – ${formatTime(lastEnd.toISOString())}`
      : "—";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 duration-200 bg-ink/50  "
        onClick={onClose}
      />
      <div className="relative flex flex-col w-full h-full max-w-md duration-300 bg-white border-l shadow-lg border-line-2  ">
        {/* Header */}
        <div className="px-5 py-4 border-b border-line-2 bg-bg shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center min-w-0 gap-3">
              <Avatar initials={driver?.initials} size="md" online={driver?.onDuty} />
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate text-ink">{driver?.name}</h2>
                <p className="text-xs text-ink-4 flex items-center gap-1.5">
                  <Truck size={11} />
                  {driver?.vehicle?.plate || "—"} · {driver?.vehicle?.type}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center bg-white border rounded-full shadow-sm w-9 h-9 border-line-2 hover:bg-line-2 text-ink-4 shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="px-3 py-2 bg-white border rounded-xl border-line-2">
              <p className="text-xs font-semibold uppercase text-ink-4">Trips</p>
              <p className="text-sm font-bold text-ink">{dayTrips.length}</p>
            </div>
            <div className="px-3 py-2 bg-white border rounded-xl border-line-2">
              <p className="text-xs font-semibold uppercase text-ink-4">Miles</p>
              <p className="text-sm font-bold text-ink">{totalMiles.toFixed(1)}</p>
            </div>
            <div className="px-3 py-2 bg-white border rounded-xl border-line-2">
              <p className="text-xs font-semibold uppercase text-ink-4">On Duty</p>
              <p className="text-xs font-bold leading-tight text-ink">{dutyWindow}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-4">
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Run sheet */}
        <div className="flex-1 p-5 overflow-y-auto">
          {dayTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex items-center justify-center w-12 h-12 mb-3 border rounded-2xl bg-bg border-line-2">
                <Coffee size={20} className="text-ink-4" />
              </div>
              <p className="text-sm font-semibold text-ink">No trips this day</p>
              <p className="mt-1 text-xs text-ink-4">
                {driver?.onDuty ? "On duty · idle" : "Off duty"}
              </p>
            </div>
          ) : (
            <div className="relative pl-6">
              {/* vertical connector */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-line-2" />

              {segments.map((seg: any, i: number) => {
                if (seg.kind === "pullout") {
                  return (
                    <div key={`po-${i}`} className="relative mb-3">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <LogOut size={9} className="text-primary" />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold tracking-wide uppercase text-primary">
                          Pull-Out
                        </p>
                        <span className="text-xs font-semibold text-ink-3">
                          {formatTime(seg.time.toISOString())}
                        </span>
                      </div>
                      <p className="text-xs text-ink-4 mt-0.5">
                        Depot → {seg.to || "first pickup"}
                      </p>
                    </div>
                  );
                }
                if (seg.kind === "pullin") {
                  return (
                    <div key={`pi-${i}`} className="relative mt-3">
                      <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-ink/5 border-2 border-ink-4 flex items-center justify-center">
                        <LogIn size={9} className="text-ink-3" />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold tracking-wide uppercase text-ink-3">
                          Pull-In
                        </p>
                        <span className="text-xs font-semibold text-ink-3">
                          {formatTime(seg.time.toISOString())}
                        </span>
                      </div>
                      <p className="text-xs text-ink-4 mt-0.5">
                        {seg.from || "last drop-off"} → Depot
                      </p>
                    </div>
                  );
                }
                if (seg.kind === "gap") {
                  return (
                    <div key={`gap-${i}`} className="relative my-2 ml-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-4 bg-bg border border-line-2 rounded-full px-2.5 py-1">
                        <Coffee size={10} /> Standby · {formatDurationMinutes(seg.mins)}
                      </div>
                    </div>
                  );
                }
                if (seg.kind === "conflict") {
                  return (
                    <div key={`cf-${i}`} className="relative my-2 ml-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-urgent bg-urgent-light/40 border border-urgent/20 rounded-full px-2.5 py-1">
                        <AlertTriangle size={10} /> Overlap · {formatDurationMinutes(seg.mins)}
                      </div>
                    </div>
                  );
                }
                // trip
                const t = seg.trip;
                return (
                  <div key={t.id} className="relative mb-3">
                    <div
                      className={`absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full border-2 bg-white flex items-center justify-center ${["in_trip", "en_route", "arrived"].includes(t.status) ? "border-urgent" : t.status === "completed" ? "border-accent" : "border-primary"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${["in_trip", "en_route", "arrived"].includes(t.status) ? "bg-urgent" : t.status === "completed" ? "bg-accent" : "bg-primary"}`}
                      />
                    </div>
                    <button
                      onClick={() => onTripClick?.(t.id)}
                      className="w-full p-3 text-left transition-colors bg-white border rounded-xl border-line-2 hover:border-primary/40 hover:shadow-sm group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Clock size={11} className="text-ink-4" />
                          {formatTime(seg.start.toISOString())}{" "}
                          <span className="font-normal text-ink-4">
                            – {formatTime(seg.end.toISOString())}
                          </span>
                        </span>
                        <TripStatusBadge status={t.status} className="text-xs" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar initials={t?.rider?.initials || "?"} size="xs" />
                        <p className="text-xs font-semibold truncate text-ink">
                          {t?.rider?.name || "Unknown"}
                        </p>
                        <span className="ml-auto text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5">
                          Open <ExternalLink size={9} />
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-3">
                        <span className="truncate max-w-[120px]">{t.pickup || "—"}</span>
                        <ArrowRight size={11} className="text-ink-4 shrink-0" />
                        <MapPin size={10} className="text-urgent shrink-0" />
                        <span className="truncate max-w-[120px]">{t.dropoff || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="neutral" className="text-xs">
                          {t.mobility || "Ambulatory"}
                        </Badge>
                        {t.miles && <span className="text-xs text-ink-4">{t.miles} mi</span>}
                      </div>
                    </button>

                    {/* Quick dispatch actions — reassign to another driver or pull off this run */}
                    {updateTrip && !["completed", "in_trip", "arrived"].includes(t.status) && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <select
                          value={String(t.driverId || "")}
                          onChange={(e) =>
                            updateTrip(t.id, {
                              driverId: e.target.value,
                              status: e.target.value
                                ? ["pending_review", "confirmed"].includes(t.status)
                                  ? "assigned"
                                  : t.status
                                : "confirmed",
                            })
                          }
                          className="flex-1 py-1 pl-2 pr-6 text-xs font-medium bg-white border rounded-lg outline-none appearance-none cursor-pointer border-line-2 text-ink focus:ring-2 focus:ring-primary/15"
                          title="Reassign to another driver"
                        >
                          <option value="">Unassigned</option>
                          {(drivers || []).map((d: any) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => updateTrip(t.id, { driverId: "", status: "confirmed" })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold transition-colors border rounded-lg text-urgent bg-urgent/5 hover:bg-urgent/10 border-urgent/15 shrink-0"
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
    </div>,
    document.body,
  );
};
