import { ArrowRight, ExternalLink, Navigation } from "lucide-react";
import {
  RouteLocationLabel,
  looksLikeCoordinateLabel,
} from "@/features/bookings/components/RouteLocationLabel";
import { parseLatLng } from "@/features/bookings/utils/helpers";
import { googleMapsDirectionsUrl } from "../utils/helpers";

export type RoutePointKind = "pickup" | "stop" | "dropoff";

export const TRIP_STATUS_VARIANT: Record<string, string> = {
  pending: "warning",
  assigned: "primary",
  "in-progress": "primary-light",
  "trip-completed": "accent",
  completed: "accent",
  cancelled: "urgent",
};

export type RouteTimelinePoint = {
  kind: RoutePointKind;
  raw: unknown;
  displayFallback?: string;
};

const isBlank = (v?: string | null): boolean => {
  const s = String(v ?? "").trim();
  return !s || s === "—" || s === "N/A";
};

/** True when a stop (or any point) has real location data worth showing. */
export const routePointHasValue = (raw: unknown, displayFallback?: string): boolean => {
  if (!isBlank(displayFallback) && !looksLikeCoordinateLabel(displayFallback)) return true;
  if (raw == null || raw === "") return false;
  if (Array.isArray(raw)) {
    const clean = raw.filter((x) => x != null && x !== "");
    if (clean.length === 0) return false;
  }
  if (parseLatLng(raw)) return true;
  if (typeof raw === "string" && raw.trim()) return true;
  if (!isBlank(displayFallback)) return true;
  return false;
};

export const tripStopCount = (trip: { stopAddressRaw?: unknown; stops?: string[] }): number => {
  if (Array.isArray(trip.stops) && trip.stops.length > 0) {
    return trip.stops.filter((s) => routePointHasValue(s, s)).length;
  }
  return routePointHasValue(trip.stopAddressRaw, undefined) ? 1 : 0;
};

export const tripRoutePoints = (trip: {
  pickupLocationRaw?: unknown;
  pickup?: string;
  stopAddressRaw?: unknown;
  stops?: string[];
  dropOffLocationRaw?: unknown;
  dropoff?: string;
}): RouteTimelinePoint[] => {
  const points: RouteTimelinePoint[] = [
    {
      kind: "pickup",
      raw: trip.pickupLocationRaw ?? trip.pickup,
      displayFallback: trip.pickup,
    },
  ];

  const stopFallback = Array.isArray(trip.stops) ? trip.stops[0] : undefined;
  if (routePointHasValue(trip.stopAddressRaw, stopFallback)) {
    points.push({
      kind: "stop",
      raw: trip.stopAddressRaw,
      displayFallback: stopFallback,
    });
  }

  points.push({
    kind: "dropoff",
    raw: trip.dropOffLocationRaw ?? trip.dropoff,
    displayFallback: trip.dropoff,
  });

  return points;
};

export const tripRouteStopsForMaps = (trip: {
  stopAddressRaw?: unknown;
  stops?: string[];
}): unknown[] => {
  if (Array.isArray(trip.stops) && trip.stops.length > 0) {
    return trip.stops.filter((s) => routePointHasValue(s, s));
  }
  return routePointHasValue(trip.stopAddressRaw, undefined) ? [trip.stopAddressRaw] : [];
};

export const tripRouteMapsProps = (trip: {
  pickupLocationRaw?: unknown;
  pickup?: string;
  stopAddressRaw?: unknown;
  stops?: string[];
  dropOffLocationRaw?: unknown;
  dropoff?: string;
}) => ({
  pickup: trip.pickupLocationRaw ?? trip.pickup,
  dropoff: trip.dropOffLocationRaw ?? trip.dropoff,
  stops: tripRouteStopsForMaps(trip),
});

export const TripRouteMapsLink = ({
  pickup,
  dropoff,
  stops = [],
}: {
  pickup: unknown;
  dropoff: unknown;
  stops?: unknown[];
}) => {
  const routeUrl = googleMapsDirectionsUrl(pickup, dropoff, stops);

  if (!routeUrl) {
    return <span className="text-xs text-ink-4">—</span>;
  }

  return (
    <a
      href={routeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 transition-colors hover:border-indigo-300 hover:bg-indigo-100 whitespace-nowrap"
    >
      <Navigation size={13} className="shrink-0 text-indigo-600" />
      View route in Maps
      <ExternalLink size={11} className="shrink-0 opacity-60" />
    </a>
  );
};

/** Compact single-row route for profile trip tables. */
export const TripRouteRow = ({
  trip,
}: {
  trip: {
    pickupLocationRaw?: unknown;
    pickup?: string;
    stopAddressRaw?: unknown;
    stops?: string[];
    dropOffLocationRaw?: unknown;
    dropoff?: string;
  };
}) => {
  const pickupRaw = trip.pickupLocationRaw ?? trip.pickup;
  const dropoffRaw = trip.dropOffLocationRaw ?? trip.dropoff;
  const stopCount = tripStopCount(trip);

  return (
    <div className="flex min-w-[200px] max-w-[360px] flex-wrap items-center gap-x-2 gap-y-1">
      <div className="flex min-w-0 max-w-[160px] items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full border-2 border-accent bg-accent-light"
          title="Pickup"
        />
        <RouteLocationLabel
          locationRaw={pickupRaw}
          displayFallback={trip.pickup}
          className="max-w-[140px] truncate text-xs font-medium"
        />
      </div>

      {stopCount > 0 ? (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning-dark"
          title={Array.isArray(trip.stops) ? trip.stops.join(" · ") : "Stop"}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          {stopCount > 1 ? `+${stopCount} Stops` : "+1 Stop"}
        </span>
      ) : (
        <ArrowRight size={12} className="shrink-0 text-ink-4" aria-hidden />
      )}

      <div className="flex min-w-0 max-w-[160px] items-center gap-1.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full border-2 border-primary bg-primary"
          title="Drop-off"
        />
        <RouteLocationLabel
          locationRaw={dropoffRaw}
          displayFallback={trip.dropoff}
          className="max-w-[140px] truncate text-xs font-medium text-ink-2"
        />
      </div>
    </div>
  );
};

/** Vertical timeline (optional; stops omitted when empty). */
export const RouteTimeline = ({ points }: { points: RouteTimelinePoint[] }) => {
  const visible = points.filter(
    (p) => p.kind !== "stop" || routePointHasValue(p.raw, p.displayFallback),
  );

  return (
    <div className="min-w-0">
      <ol className="relative">
        {visible.map((point, i) => {
          const dot =
            point.kind === "pickup"
              ? "border-accent bg-accent-light"
              : point.kind === "stop"
                ? "border-warning bg-warning-light"
                : "border-primary bg-primary";
          const label =
            point.kind === "pickup" ? "Pickup" : point.kind === "stop" ? "Stop" : "Drop-off";
          const isLast = i === visible.length - 1;
          return (
            <li
              key={`${point.kind}-${i}`}
              className="relative flex items-start gap-2.5 pb-2 last:pb-0"
            >
              {!isLast && (
                <span className="absolute left-[3.5px] top-3 bottom-0 w-px border-l border-dashed border-line-2" />
              )}
              <span className={`relative mt-1 h-2 w-2 shrink-0 rounded-full border-2 ${dot}`} />
              <div className="min-w-0 flex-1">
                <RouteLocationLabel
                  locationRaw={point.raw}
                  displayFallback={point.displayFallback}
                  className="max-w-[200px] truncate text-xs font-medium"
                />
                <p className="text-[10px] text-ink-4">{label}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
