import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { formatLatLng, googleMapsDirectionsUrl, googleMapsUrl } from '../utils/helpers';

export type RoutePointKind = 'pickup' | 'stop' | 'dropoff';

const ROUTE_POINT_STYLE: Record<RoutePointKind, { label: string; dot: string }> = {
  pickup: { label: 'Pickup', dot: 'border-accent bg-accent-light' },
  stop: { label: 'Stop', dot: 'border-warning bg-warning-light' },
  dropoff: { label: 'Drop-off', dot: 'border-primary bg-primary' },
};

export const TRIP_STATUS_VARIANT: Record<string, string> = {
  pending: 'warning',
  assigned: 'primary',
  'in-progress': 'primary-light',
  'trip-completed': 'accent',
  completed: 'accent',
  cancelled: 'urgent',
};

export const RouteTimeline = ({ points }: { points: { kind: RoutePointKind; raw: unknown }[] }) => {
  const visible = points.filter((p) => p.kind !== 'stop' || p.raw != null);
  const pickup = visible.find((p) => p.kind === 'pickup')?.raw;
  const dropoff = visible.find((p) => p.kind === 'dropoff')?.raw;
  const routeUrl = googleMapsDirectionsUrl(
    pickup,
    dropoff,
    visible.filter((p) => p.kind === 'stop').map((p) => p.raw),
  );

  return (
    <div className="min-w-[240px]">
      <ol className="relative">
        {visible.map((point, i) => {
          const style = ROUTE_POINT_STYLE[point.kind];
          const url = googleMapsUrl(point.raw);
          const text = formatLatLng(point.raw) || (typeof point.raw === 'string' ? point.raw : '') || '—';
          const isLast = i === visible.length - 1;
          return (
            <li key={`${point.kind}-${i}`} className="group/point relative flex items-start gap-3 pb-2.5 last:pb-0">
              {!isLast && (
                <span className="absolute left-[4.5px] top-3.5 bottom-0 w-px border-l border-dashed border-line" />
              )}
              <span className={`relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${style.dot}`} />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-ink-4 leading-none">{style.label}</p>
                  <p className="mt-1 text-xs font-medium text-ink tabular-nums truncate">{text}</p>
                </div>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Open ${style.label.toLowerCase()} in Google Maps`}
                    aria-label={`Open ${style.label.toLowerCase()} in Google Maps`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-4 transition-all hover:bg-primary-light hover:text-primary group-hover/point:text-primary"
                  >
                    <MapPin size={14} />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {routeUrl && (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 ml-[22px] inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          <Navigation size={11} /> View route in Maps
          <ExternalLink size={10} className="opacity-70" />
        </a>
      )}
    </div>
  );
};
