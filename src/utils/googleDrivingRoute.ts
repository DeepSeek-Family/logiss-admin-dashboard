export type LatLngPoint = { lat: number; lng: number };

type GoogleMapsNs = {
  maps: {
    DirectionsService: new () => {
      route: (
        request: {
          origin: LatLngPoint;
          destination: LatLngPoint;
          waypoints?: { location: LatLngPoint; stopover: boolean }[];
          optimizeWaypoints?: boolean;
          travelMode: unknown;
        },
        callback: (
          result: { routes?: { overview_path?: { lat: () => number; lng: () => number }[] }[] } | null,
          status: string,
        ) => void,
      ) => void;
    };
    DirectionsStatus: { OK: string };
    TravelMode: { DRIVING: unknown };
    Polyline: new (opts: Record<string, unknown>) => { setMap: (map: unknown | null) => void };
    SymbolPath: { FORWARD_CLOSED_ARROW: unknown };
  };
};

let directionsFailureLogged = false;

function logDirectionsFailure(status: string) {
  if (directionsFailureLogged || status === 'OK') return;
  directionsFailureLogged = true;
  console.warn(
    `[Maps] Directions request failed (${status}). Enable Directions API on your Google Maps key, or the route will draw as a straight line.`,
  );
}

/** Driving directions path (follows roads). Falls back to waypoint straight path on failure. */
export async function getDrivingRoutePath(
  google: GoogleMapsNs,
  waypointPoints: LatLngPoint[],
): Promise<LatLngPoint[]> {
  if (waypointPoints.length < 2) return waypointPoints;

  const origin = waypointPoints[0];
  const destination = waypointPoints[waypointPoints.length - 1];
  const middle = waypointPoints.slice(1, -1);

  const directionsService = new google.maps.DirectionsService();

  return new Promise((resolve) => {
    directionsService.route(
      {
        origin,
        destination,
        waypoints: middle.length
          ? middle.map((location) => ({ location, stopover: true }))
          : undefined,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes?.[0]?.overview_path?.length) {
          logDirectionsFailure(status);
          resolve(waypointPoints);
          return;
        }
        const path = result.routes[0].overview_path!.map((ll) => ({
          lat: ll.lat(),
          lng: ll.lng(),
        }));
        resolve(path.length > 1 ? path : waypointPoints);
      },
    );
  });
}

/** Road-following polyline with direction arrows along the path. */
export function createDirectionalRoutePolyline(
  google: GoogleMapsNs,
  map: unknown,
  path: LatLngPoint[],
  strokeColor = '#2969CD',
): InstanceType<GoogleMapsNs['maps']['Polyline']> {
  return new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor,
    strokeOpacity: 0.9,
    strokeWeight: 5,
    icons: [
      {
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          strokeColor,
          fillColor: strokeColor,
          fillOpacity: 0.95,
        },
        offset: '0%',
        repeat: '90px',
      },
    ],
    map,
  });
}
