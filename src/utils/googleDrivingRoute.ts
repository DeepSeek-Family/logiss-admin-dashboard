export type LatLngPoint = { lat: number; lng: number };

type GoogleMapsNs = {
  maps: {
    importLibrary?: (name: string) => Promise<{
      Route?: {
        computeRoutes: (req: Record<string, unknown>) => Promise<{
          routes?: Array<{
            path?: unknown[];
            legs?: Array<{ path?: unknown[] }>;
            createPolylines?: (opts?: Record<string, unknown>) => Array<{ setMap: (map: unknown | null) => void }>;
          }>;
        }>;
      };
    }>;
    Polyline: new (opts: Record<string, unknown>) => { setMap: (map: unknown | null) => void };
    SymbolPath: { FORWARD_CLOSED_ARROW: unknown };
  };
};

const routePathCache = new Map<string, LatLngPoint[]>();
let googleRoutesBlocked = false;

function cacheKey(points: LatLngPoint[]): string {
  return points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
}

function toLatLngPoint(value: unknown): LatLngPoint | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const nested = v.location && typeof v.location === 'object' ? (v.location as Record<string, unknown>) : v;
  const latRaw =
    typeof nested.lat === 'function' ? (nested.lat as () => number)() : nested.lat ?? nested.latitude;
  const lngRaw =
    typeof nested.lng === 'function' ? (nested.lng as () => number)() : nested.lng ?? nested.longitude;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function pointsFromUnknown(list: unknown): LatLngPoint[] {
  if (!Array.isArray(list)) return [];
  return list.map(toLatLngPoint).filter((p): p is LatLngPoint => Boolean(p));
}

function formatRoutesError(err: unknown): string {
  if (!err) return 'Unknown Routes error';
  if (typeof err === 'string') return err;
  const e = err as Record<string, unknown>;
  const status = e.status || e.code;
  const message = e.message || e.statusText;
  return [status, message].filter(Boolean).join(': ') || String(err);
}

function isRoutesPermissionDenied(err: unknown): boolean {
  const text = formatRoutesError(err).toUpperCase();
  return (
    text.includes('PERMISSION_DENIED') ||
    text.includes('REQUEST_DENIED') ||
    text.includes('API_KEY_SERVICE_BLOCKED')
  );
}

async function computeRoutePathViaMapsJs(
  google: GoogleMapsNs,
  origin: LatLngPoint,
  destination: LatLngPoint,
  intermediates: LatLngPoint[],
): Promise<LatLngPoint[] | null> {
  const importLibrary = google.maps.importLibrary;
  if (typeof importLibrary !== 'function') return null;

  const lib = await importLibrary('routes');
  const Route = lib?.Route;
  if (!Route?.computeRoutes) return null;

  const request: Record<string, unknown> = {
    origin,
    destination,
    travelMode: 'DRIVING',
    fields: ['path', 'legs'],
  };
  if (intermediates.length) {
    request.intermediates = intermediates.map((location) => ({ location }));
  }

  const { routes } = await Route.computeRoutes(request);
  const route = routes?.[0];
  if (!route) return null;

  const fromPath = pointsFromUnknown(route.path);
  if (fromPath.length > 1) return fromPath;

  const fromLegs = (route.legs || []).flatMap((leg) => pointsFromUnknown(leg.path));
  return fromLegs.length > 1 ? fromLegs : null;
}

async function computeRoutePathViaOsrm(points: LatLngPoint[]): Promise<LatLngPoint[] | null> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
  );
  if (!response.ok) return null;
  const data = await response.json();
  const line = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(line) || line.length < 2) return null;
  return line.map((pair: unknown) => {
    const [lng, lat] = pair as [number, number];
    return { lat, lng };
  });
}

/**
 * Prefer Maps JS `Route.computeRoutes()` → `route.path`.
 * If the dashboard key still blocks Routes API, use a road-following fallback
 * so the map always has a line, then last-resort the waypoint path.
 */
export async function getDrivingRoutePath(
  google: GoogleMapsNs,
  waypointPoints: LatLngPoint[],
): Promise<LatLngPoint[]> {
  if (waypointPoints.length < 2) return waypointPoints;

  const key = cacheKey(waypointPoints);
  const cached = routePathCache.get(key);
  if (cached) return cached;

  const origin = waypointPoints[0];
  const destination = waypointPoints[waypointPoints.length - 1];
  const intermediates = waypointPoints.slice(1, -1);

  if (!googleRoutesBlocked) {
    try {
      const mapsPath = await computeRoutePathViaMapsJs(google, origin, destination, intermediates);
      if (mapsPath && mapsPath.length > 1) {
        routePathCache.set(key, mapsPath);
        return mapsPath;
      }
    } catch (err) {
      if (isRoutesPermissionDenied(err)) {
        googleRoutesBlocked = true;
      }
    }
  }

  try {
    const osrmPath = await computeRoutePathViaOsrm(waypointPoints);
    if (osrmPath && osrmPath.length > 1) {
      routePathCache.set(key, osrmPath);
      return osrmPath;
    }
  } catch (err) {
    console.warn('[Maps] Road-following fallback failed', err);
  }

  return waypointPoints;
}

export function createDirectionalRoutePolyline(
  google: GoogleMapsNs,
  map: unknown,
  path: LatLngPoint[],
  strokeColor = '#2969CD',
): InstanceType<GoogleMapsNs['maps']['Polyline']> | null {
  if (path.length < 2) return null;
  return new google.maps.Polyline({
    path,
    geodesic: false,
    strokeColor,
    strokeOpacity: 0.95,
    strokeWeight: 5,
    map,
  });
}
