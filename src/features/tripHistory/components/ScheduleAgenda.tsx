import { AlertTriangle, ArrowRight, Clock, MapPin, UserRound } from "lucide-react";
import { Avatar, Badge, Card, TripStatusBadge } from "@/shared/components/ui";
import { formatTime } from "@/utils/helpers";
import type { TripHistoryDriver, TripHistoryRecord } from "../types";
import { parseClockTimeToMinutes } from "../utils/dateTime";

interface ScheduleAgendaProps {
  trips: TripHistoryRecord[];
  drivers: TripHistoryDriver[];
  conflictIds: Set<string>;
  onTripClick?: (id: string) => void;
}

const getTripMinute = (trip: TripHistoryRecord): number => {
  const timeValue = (trip as any).requestedPickup || (trip as any).pickupTime;
  const parsed = timeValue ? parseClockTimeToMinutes(String(timeValue)) : null;
  if (parsed != null) return parsed;
  const date = new Date((trip as any).scheduledTime);
  return Number.isNaN(date.getTime()) ? 0 : date.getHours() * 60 + date.getMinutes();
};

const hourLabel = (hour: number): string => {
  const normalized = hour % 24;
  const display = normalized % 12 || 12;
  return `${display}:00 ${normalized >= 12 ? "PM" : "AM"}`;
};

const ScheduleAgenda = ({
  trips,
  drivers,
  conflictIds,
  onTripClick,
}: ScheduleAgendaProps) => {
  const driverById = new Map((drivers || []).map((driver) => [String(driver.id), driver]));
  const sortedTrips = [...(trips || [])].sort((a, b) => getTripMinute(a) - getTripMinute(b));
  const groups = sortedTrips.reduce<Map<number, TripHistoryRecord[]>>((result, trip) => {
    const hour = Math.floor(getTripMinute(trip) / 60);
    const group = result.get(hour) || [];
    group.push(trip);
    result.set(hour, group);
    return result;
  }, new Map());

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[88px_minmax(160px,0.8fr)_minmax(260px,1.5fr)_180px_120px] border-b border-line-2 bg-bg/70 px-4 py-2.5 max-lg:hidden">
        <span className="type-th">Pickup</span>
        <span className="type-th">Rider</span>
        <span className="type-th">Route</span>
        <span className="type-th">Driver</span>
        <span className="type-th text-right">Status</span>
      </div>

      <div className="divide-y divide-line-2">
        {Array.from(groups.entries()).map(([hour, hourTrips]) => {
          const conflictsInHour = hourTrips.filter((trip) => conflictIds.has(trip.id)).length;
          return (
            <section key={hour} aria-labelledby={`schedule-hour-${hour}`}>
              <div className="flex items-center gap-2 border-b border-line-2 bg-bg/50 px-4 py-2">
                <Clock size={13} className="text-primary" />
                <h3 id={`schedule-hour-${hour}`} className="text-xs font-semibold text-ink">
                  {hourLabel(hour)}
                </h3>
                <Badge variant="neutral">{hourTrips.length} bookings</Badge>
                {hourTrips.length >= 10 ? <Badge variant="warning">High volume</Badge> : null}
                {conflictsInHour > 0 ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-urgent">
                    <AlertTriangle size={12} /> {conflictsInHour} conflicts
                  </span>
                ) : null}
              </div>

              <div className="divide-y divide-line-2/70">
                {hourTrips.map((trip) => {
                  const driver = trip.driverId ? driverById.get(String(trip.driverId)) : undefined;
                  const conflict = conflictIds.has(trip.id);
                  const pickupTime =
                    (trip as any).requestedPickup ||
                    (trip as any).pickupTime ||
                    formatTime((trip as any).scheduledTime);

                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => onTripClick?.(trip.id)}
                      className={`grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition-colors hover:bg-primary-tint/30 lg:grid-cols-[88px_minmax(160px,0.8fr)_minmax(260px,1.5fr)_180px_120px] lg:items-center ${conflict ? "bg-urgent-light/20" : "bg-white"}`}
                    >
                      <div className="flex items-center justify-between lg:block">
                        <span className="text-sm font-semibold tabular-nums text-ink">
                          {pickupTime}
                        </span>
                        <span className="font-mono text-xs text-ink-4 lg:mt-1 lg:block">
                          #{String(trip.id).slice(-6)}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar initials={(trip as any).rider?.initials || "?"} size="xs" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {(trip as any).rider?.name || "Unknown rider"}
                          </p>
                          <p className="truncate text-xs text-ink-4">
                            {(trip as any).mobility || "Ambulatory"}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 text-xs text-ink-3">
                        <span className="truncate">{(trip as any).pickup || "Pickup unavailable"}</span>
                        <ArrowRight size={12} className="shrink-0 text-ink-4" />
                        <MapPin size={12} className="shrink-0 text-urgent" />
                        <span className="truncate">{(trip as any).dropoff || "Drop-off unavailable"}</span>
                      </div>

                      <div className="flex min-w-0 items-center gap-2">
                        <UserRound size={13} className="shrink-0 text-ink-4" />
                        {driver ? (
                          <span className="truncate text-xs font-medium text-ink">{driver.name}</span>
                        ) : (
                          <Badge variant="warning">Unassigned</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 lg:justify-end">
                        {conflict ? (
                          <AlertTriangle size={14} className="shrink-0 text-urgent" />
                        ) : null}
                        <TripStatusBadge status={(trip as any).status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
};

export default ScheduleAgenda;
