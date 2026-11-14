import proj4 from "proj4";

/** Common US State Plane / local CRS used in Chesterfield boundary exports. */
proj4.defs(
  "EPSG:2284",
  "+proj=lcc +lat_1=37.96666666666667 +lat_2=36.76666666666667 +lat_0=36.33333333333334 +lon_0=-78.5 +x_0=3500000.0001016 +y_0=999999.9998983998 +datum=NAD83 +units=us-ft +no_defs +type=crs",
);

type Geometry = { type?: string; coordinates?: unknown };

const looksLikeWgs84Ring = (ring: unknown): boolean => {
  if (!Array.isArray(ring) || !ring.length) return false;
  const first = ring[0];
  if (!Array.isArray(first) || first.length < 2) return false;
  const lng = Number(first[0]);
  const lat = Number(first[1]);
  return Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
};

const sampleRing = (geometry: Geometry): unknown => {
  const coords = geometry.coordinates;
  if (geometry.type === "Polygon" && Array.isArray(coords)) return coords[0];
  if (geometry.type === "MultiPolygon" && Array.isArray(coords)) {
    const firstPoly = coords[0];
    return Array.isArray(firstPoly) ? firstPoly[0] : undefined;
  }
  return undefined;
};

const convertPos = (fromCrs: string, pos: unknown): unknown => {
  if (!Array.isArray(pos) || pos.length < 2) return pos;
  const x = Number(pos[0]);
  const y = Number(pos[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return pos;
  const [lng, lat] = proj4(fromCrs, "EPSG:4326", [x, y]);
  return [lng, lat, ...pos.slice(2)];
};

const convertCoords = (fromCrs: string, coords: unknown, depth: number): unknown => {
  if (depth === 0) return convertPos(fromCrs, coords);
  if (!Array.isArray(coords)) return coords;
  return coords.map((c) => convertCoords(fromCrs, c, depth - 1));
};

export const reprojectGeometryToWgs84 = (geometry: Geometry, fromCrs: string): Geometry => {
  if (!geometry?.type || geometry.coordinates == null) return geometry;
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: convertCoords(fromCrs, geometry.coordinates, 2),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: convertCoords(fromCrs, geometry.coordinates, 3),
    };
  }
  return geometry;
};

/** Detect EPSG code from GeoJSON crs.name, e.g. "EPSG:2284". */
export const detectEpsgCode = (crsName?: string): string | null => {
  if (!crsName) return null;
  if (/crs84|4326|wgs.?84/i.test(crsName)) return "EPSG:4326";
  const match = crsName.match(/EPSG[:\s]*(\d+)/i);
  return match ? `EPSG:${match[1]}` : null;
};

/**
 * Ensure geometry is WGS84 lon/lat.
 * - Already lon/lat → unchanged
 * - Declared projected CRS (e.g. EPSG:2284) → reproject
 * - No CRS but coords look projected → try EPSG:2284 (Chesterfield exports)
 */
export const ensureWgs84Geometry = (
  geometry: Geometry,
  crsName?: string,
): { geometry: Geometry; reprojectedFrom?: string } => {
  if (looksLikeWgs84Ring(sampleRing(geometry))) {
    return { geometry };
  }

  const declared = detectEpsgCode(crsName);
  const fromCrs =
    declared && declared !== "EPSG:4326"
      ? declared
      : "EPSG:2284"; /* Chesterfield Access boundary default */

  try {
    const next = reprojectGeometryToWgs84(geometry, fromCrs);
    if (!looksLikeWgs84Ring(sampleRing(next))) {
      throw new Error("reproject produced non-WGS84 coordinates");
    }
    return { geometry: next, reprojectedFrom: fromCrs };
  } catch {
    throw new Error(
      `Could not convert ${fromCrs} → WGS84. Re-export as EPSG:4326 GeoJSON.`,
    );
  }
};
