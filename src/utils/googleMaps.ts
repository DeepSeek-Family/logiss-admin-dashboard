export interface LatitudeLongitude {
  lat: number;
  lng: number;
}

const validPoint = (lat: number, lng: number): LatitudeLongitude | null =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng }
    : null;

/** Parse backend GeoJSON coordinates or a user-facing `latitude,longitude` value. */
export const parseRouteCoordinate = (raw: unknown): LatitudeLongitude | null => {
  if (raw == null || raw === "") return null;

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const coordinateObject = raw as {
      coordinates?: unknown;
      lat?: unknown;
      latitude?: unknown;
      lng?: unknown;
      longitude?: unknown;
    };
    if (coordinateObject.coordinates) return parseGeoJsonCoordinate(coordinateObject.coordinates);
    const latitude = Number(coordinateObject.lat ?? coordinateObject.latitude);
    const longitude = Number(coordinateObject.lng ?? coordinateObject.longitude);
    return validPoint(latitude, longitude);
  }

  if (Array.isArray(raw)) return parseGeoJsonCoordinate(raw);

  const values = String(raw)
    .match(/-?\d+(?:\.\d+)?/g)
    ?.slice(0, 2)
    .map(Number);
  if (!values || values.length < 2) return null;
  return validPoint(values[0], values[1]);
};

const parseGeoJsonCoordinate = (raw: unknown): LatitudeLongitude | null => {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const longitude = Number(raw[0]);
  const latitude = Number(raw[1]);
  return validPoint(latitude, longitude);
};

export const buildGoogleMapsDirectionsUrl = (
  pickup: unknown,
  dropoff: unknown,
  stops: unknown[] = [],
): string | null => {
  const origin = parseRouteCoordinate(pickup);
  const destination = parseRouteCoordinate(dropoff);
  if (!origin || !destination) return null;

  const waypointValue = stops
    .map(parseRouteCoordinate)
    .filter((point): point is LatitudeLongitude => point !== null)
    .map((point) => `${point.lat},${point.lng}`)
    .join("|");

  const query = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "driving",
  });
  if (waypointValue) query.set("waypoints", waypointValue);
  return `https://www.google.com/maps/dir/?${query.toString()}`;
};
