/**
 * Geofencing & Address Auto-Detection Engine for Virginia Paratransit & NEMT.
 * Maps GPS Coordinates (Polygon boundaries), postal ZIP codes, and municipal zones to official Service Counties.
 */

export interface CountyGeofenceData {
  countyId: string;
  countyName: string;
  state: string;
  cities: string[];
  zipCodes: string[];
}

/** Official Chesterfield County approximate GPS bounding polygon coordinates [lat, lng] */
export const CHESTERFIELD_GPS_POLYGON: [number, number][] = [
  [37.5681, -77.6012],
  [37.5312, -77.4981],
  [37.4521, -77.3812],
  [37.3892, -77.2915],
  [37.2814, -77.3412],
  [37.2105, -77.4512],
  [37.2341, -77.6102],
  [37.3012, -77.7812],
  [37.4102, -77.8512],
  [37.5214, -77.7214],
  [37.5681, -77.6012],
];

export const VIRGINIA_COUNTY_GEOFENCES: CountyGeofenceData[] = [
  {
    countyId: 'county-chesterfield',
    countyName: 'Chesterfield County',
    state: 'VA',
    cities: [
      'chesterfield',
      'midlothian',
      'chester',
      'moseley',
      'bon air',
      'north chesterfield',
      'enon',
      'matoaca',
      'winterpock',
      'brandermill',
      'woodlake',
      'bellwood',
      'bensley',
      'ettrick',
    ],
    zipCodes: [
      '23112', '23113', '23114', '23120', '23139', '23235', '23236', '23237',
      '23803', '23831', '23832', '23834', '23836', '23838'
    ],
  },
  {
    countyId: 'county-henrico',
    countyName: 'Henrico County',
    state: 'VA',
    cities: [
      'henrico',
      'glen allen',
      'short pump',
      'sandston',
      'highland springs',
      'tuckahoe',
      'varina',
      'lakeside',
      'dumbarton',
      'innsbrook',
      'chub run',
      'laurel',
      'montrose',
    ],
    zipCodes: [
      '23058', '23059', '23060', '23075', '23150', '23228', '23229', '23231',
      '23233', '23238', '23242', '23250', '23294'
    ],
  },
  {
    countyId: 'county-richmond',
    countyName: 'Richmond City',
    state: 'VA',
    cities: [
      'richmond',
      'downtown richmond',
      'the fan',
      'carytown',
      'church hill',
      'scotts addition',
      'shockoe bottom',
      'shockoe slip',
      'southside',
      'manchester',
      'jackson ward',
      'ginter park',
      'forest hill',
    ],
    zipCodes: [
      '23218', '23219', '23220', '23221', '23222', '23223', '23224', '23225',
      '23226', '23227', '23230', '23232', '23234', '23240', '23249', '23260',
      '23261', '23274', '23284', '23298'
    ],
  },
  {
    countyId: 'county-hanover',
    countyName: 'Hanover County',
    state: 'VA',
    cities: [
      'hanover',
      'mechanicsville',
      'ashland',
      'beaverdam',
      'doswell',
      'montpelier',
      'rockville',
      'studley',
      'cold harbor',
    ],
    zipCodes: [
      '23005', '23015', '23047', '23069', '23111', '23116', '23146', '23162', '23192'
    ],
  },
  {
    countyId: 'county-powhatan',
    countyName: 'Powhatan County',
    state: 'VA',
    cities: [
      'powhatan',
      'flat rock',
      'ballsville',
      'trenholm',
    ],
    zipCodes: [
      '23139'
    ],
  },
  {
    countyId: 'county-goochland',
    countyName: 'Goochland County',
    state: 'VA',
    cities: [
      'goochland',
      'manakin-sabot',
      'manakin sabot',
      'crozier',
      'oilville',
      'hadensville',
      'maidens',
      'sandy hook',
    ],
    zipCodes: [
      '23038', '23039', '23063', '23065', '23067', '23102', '23103'
    ],
  },
];

/**
 * Point-in-Polygon (Ray-Casting Algorithm) for GPS Coordinates.
 * Returns true if [lat, lng] is mathematically enclosed inside the polygon coordinates.
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Normalize a stored [lat, lng] ring. Fewer than 3 points = no drawn fence. */
export function parsePolygon(raw: unknown): [number, number][] {
  if (!Array.isArray(raw)) return [];
  const pts: [number, number][] = [];
  for (const p of raw) {
    if (Array.isArray(p) && p.length >= 2) {
      const lat = Number(p[0]);
      const lng = Number(p[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) pts.push([lat, lng]);
    }
  }
  return pts.length >= 3 ? pts : [];
}

/** Stored fence: array of rings, or a single ring. */
export function parsePolygons(raw: unknown): [number, number][][] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const first = raw[0];
  if (Array.isArray(first) && typeof first[0] === 'number') {
    const one = parsePolygon(raw);
    return one.length >= 3 ? [one] : [];
  }
  return raw.map(ring => parsePolygon(ring)).filter(ring => ring.length >= 3);
}

export type GeoJsonParseResult =
  | { ok: true; rings: [number, number][][]; vertexCount: number }
  | { ok: false; error: string };

type LngLatPair = [number, number];

function numericPairs(coords: unknown): LngLatPair[] {
  if (!Array.isArray(coords)) return [];
  const out: LngLatPair[] = [];
  for (const p of coords) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const a = Number(p[0]);
    const b = Number(p[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    out.push([a, b]);
  }
  return out;
}

function pairsAsLatLng(pairs: LngLatPair[], lngFirst: boolean): [number, number][] {
  const pts: [number, number][] = [];
  for (const [a, b] of pairs) {
    const lat = lngFirst ? b : a;
    const lng = lngFirst ? a : b;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    pts.push([lat, lng]);
  }
  return pts.length >= 3 ? pts : [];
}

/** GeoJSON is [lng, lat]; some exports are [lat, lng]. VA-style coords can be either. */
function ringIsLngFirst(pairs: LngLatPair[]): boolean {
  if (pairs.length === 0) return true;
  let lngFirst = 0;
  let latFirst = 0;
  for (const [a, b] of pairs.slice(0, 40)) {
    const absA = Math.abs(a);
    const absB = Math.abs(b);
    if (absA > 20 && absA <= 180 && absB <= 70) lngFirst++;
    if (absA <= 70 && absB > 20 && absB <= 180) latFirst++;
  }
  if (latFirst > lngFirst) return false;
  return true;
}

function outerRingsFromCoordinates(coordinates: unknown, lngFirst: boolean): [number, number][][] {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
  const sample = coordinates[0];
  // Polygon: [ ring, hole... ] where ring = [[lng,lat], ...]
  if (Array.isArray(sample) && Array.isArray(sample[0]) && typeof sample[0][0] === 'number') {
    const outer = pairsAsLatLng(numericPairs(sample), lngFirst);
    return outer.length >= 3 ? [outer] : [];
  }
  // MultiPolygon: [ polygon, ... ]
  if (Array.isArray(sample) && Array.isArray(sample[0]) && Array.isArray(sample[0][0])) {
    const rings: [number, number][][] = [];
    for (const poly of coordinates) {
      const outer = pairsAsLatLng(numericPairs(Array.isArray(poly) ? poly[0] : null), lngFirst);
      if (outer.length >= 3) rings.push(outer);
    }
    return rings;
  }
  // Bare ring: [[lng,lat], ...]
  if (typeof sample[0] === 'number') {
    const outer = pairsAsLatLng(numericPairs(coordinates), lngFirst);
    return outer.length >= 3 ? [outer] : [];
  }
  return [];
}

function detectLngFirst(coordinates: unknown): boolean {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return true;
  const sample = coordinates[0];
  if (Array.isArray(sample) && typeof sample[0] === 'number') return ringIsLngFirst(numericPairs(coordinates));
  if (Array.isArray(sample) && Array.isArray(sample[0]) && typeof sample[0][0] === 'number') {
    return ringIsLngFirst(numericPairs(sample));
  }
  if (Array.isArray(sample) && Array.isArray(sample[0]) && Array.isArray(sample[0][0])) {
    return ringIsLngFirst(numericPairs(sample[0]));
  }
  return true;
}

function ringsFromGeometry(geom: unknown, lngFirst?: boolean): [number, number][][] {
  if (!geom || typeof geom !== 'object') return [];
  const g = geom as { type?: string; coordinates?: unknown; geometries?: unknown[] };
  if (g.type === 'GeometryCollection' && Array.isArray(g.geometries)) {
    return g.geometries.flatMap(child => ringsFromGeometry(child, lngFirst));
  }
  if (g.type === 'Polygon' || g.type === 'MultiPolygon' || g.coordinates) {
    const first = lngFirst ?? detectLngFirst(g.coordinates);
    return outerRingsFromCoordinates(g.coordinates, first);
  }
  return [];
}

/**
 * Parse a GeoJSON document (Polygon / MultiPolygon / Feature / FeatureCollection)
 * or a bare coordinate ring. Returns [lat, lng] rings for point-in-polygon.
 */
export function parseGeoJsonDocument(raw: unknown): GeoJsonParseResult {
  if (raw == null) {
    return { ok: false, error: 'That file is empty.' };
  }
  if (typeof raw !== 'object') {
    return { ok: false, error: 'Not a GeoJSON object. Use Polygon, Feature, or FeatureCollection.' };
  }

  let rings: [number, number][][] = [];

  if (Array.isArray(raw)) {
    const first = detectLngFirst(raw);
    rings = outerRingsFromCoordinates(raw, first);
  } else {
    const obj = raw as {
      type?: string;
      geometry?: unknown;
      features?: unknown[];
      coordinates?: unknown;
    };
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      for (const feature of obj.features) {
        if (!feature || typeof feature !== 'object') continue;
        const geom = (feature as { geometry?: unknown }).geometry;
        rings.push(...ringsFromGeometry(geom));
      }
    } else if (obj.type === 'Feature' || obj.geometry) {
      rings.push(...ringsFromGeometry(obj.geometry));
    } else if (obj.type === 'Polygon' || obj.type === 'MultiPolygon' || obj.type === 'GeometryCollection') {
      rings.push(...ringsFromGeometry(obj));
    } else if (obj.coordinates) {
      rings.push(...ringsFromGeometry(obj));
    }
  }

  rings = rings.filter(r => r.length >= 3);
  if (rings.length === 0) {
    return {
      ok: false,
      error: 'No polygon found. Upload GeoJSON Polygon, MultiPolygon, Feature, or FeatureCollection.',
    };
  }
  const vertexCount = rings.reduce((n, r) => n + r.length, 0);
  return { ok: true, rings, vertexCount };
}

export function isPointInAnyPolygon(point: [number, number], rings: [number, number][][]): boolean {
  return rings.some(ring => ring.length >= 3 && isPointInPolygon(point, ring));
}

/** Seed Chesterfield’s approximate outline; other areas use ZIP/city until a fence is drawn. */
export function seedFencePolygon(countyId?: string, countyName?: string): [number, number][] {
  const id = (countyId || '').toLowerCase();
  const name = (countyName || '').toLowerCase();
  if (id === 'county-chesterfield' || name === 'chesterfield county') {
    return CHESTERFIELD_GPS_POLYGON.map(([lat, lng]) => [lat, lng]);
  }
  return [];
}

export function resolveFencePolygon(area?: { id?: string; name?: string; polygon?: [number, number][] } | null): [number, number][] {
  return parsePolygon(area?.polygon);
}

export function extractGpsFromAddress(address = ''): [number, number] | undefined {
  const match = address.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return undefined;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return [lat, lng];
}

const geocodeCache = new Map<string, [number, number] | null>();

function geocodeKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function geocodeCached(address: string): [number, number] | undefined {
  const key = geocodeKey(address);
  if (!key) return undefined;
  const hit = geocodeCache.get(key);
  return hit || undefined;
}

/** OSM Nominatim — no API key. Cached. Used so drawn fences can be tested against a real point. */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const key = geocodeKey(address);
  if (!key || key.length < 8) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
  const pasted = extractGpsFromAddress(address);
  if (pasted) {
    geocodeCache.set(key, pasted);
    return pasted;
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    const lat = hit ? Number(hit.lat) : NaN;
    const lon = hit ? Number(hit.lon) : NaN;
    const gps: [number, number] | null = Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
    geocodeCache.set(key, gps);
    return gps;
  } catch {
    return null;
  }
}

/**
 * Extract 5-digit US ZIP code from an address string.
 */
export function extractZipCode(address = ''): string | null {
  if (!address) return null;
  const match = address.match(/\b(2[0-9]{4})(?:-[0-9]{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Payer → Areas.
 * Empty `serviceAreaIds` = every Area on the Areas tab (or the seeded VA list).
 * That way Medicaid and other unconfigured payers still treat regional trips as inside.
 */
export function resolvePayerAreaIds(
  serviceAreaIds?: string[],
  knownCounties?: Array<{ id: string }>
): string[] {
  const selected = (serviceAreaIds || []).map(String).filter(Boolean);
  if (selected.length > 0) return selected;
  const fromAreas = (knownCounties || []).map(c => c.id).filter(Boolean);
  if (fromAreas.length > 0) return fromAreas;
  return VIRGINIA_COUNTY_GEOFENCES.map(g => g.countyId);
}

export function lookupAreaGeofence(
  countyId?: string,
  countyName?: string
): CountyGeofenceData | undefined {
  const id = (countyId || '').toLowerCase();
  const name = (countyName || '').toLowerCase();
  return VIRGINIA_COUNTY_GEOFENCES.find(
    g => g.countyId.toLowerCase() === id || g.countyName.toLowerCase() === name
  );
}

export interface AreaFenceSource {
  id?: string;
  name?: string;
  zipCodes?: string[];
  cities?: string[];
  polygon?: [number, number][];
}

function prettyCityName(name: string): string {
  return name.replace(/\b([a-z])/g, ch => ch.toUpperCase());
}

function normalizeZipToken(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 5 ? digits.slice(0, 5) : null;
}

/** Seed ZIP/city lists from the built-in VA tables (Chesterfield = 14 ZIPs). */
export function seedFenceLists(countyId?: string, countyName?: string): { zipCodes: string[]; cities: string[] } {
  const g = lookupAreaGeofence(countyId, countyName);
  if (!g) return { zipCodes: [], cities: [] };
  return {
    zipCodes: [...g.zipCodes],
    cities: g.cities.map(prettyCityName),
  };
}

/** Stored lists win; empty lists fall back to the hardcoded seed so old data still matches. */
export function resolveFenceLists(area?: AreaFenceSource | null): { zipCodes: string[]; cities: string[] } {
  const storedZips = (area?.zipCodes || []).map(z => normalizeZipToken(String(z)) || String(z).trim()).filter(Boolean);
  const storedCities = (area?.cities || []).map(c => String(c).trim()).filter(Boolean);
  const seed = seedFenceLists(area?.id, area?.name);
  return {
    zipCodes: storedZips.length > 0 ? storedZips : seed.zipCodes,
    cities: storedCities.length > 0 ? storedCities : seed.cities,
  };
}

function fencesForDetection(
  knownCounties?: Array<{ id: string; name: string; zipCodes?: string[]; cities?: string[]; polygon?: [number, number][] }>
): Array<{ countyId: string; countyName: string; zipCodes: string[]; cities: string[]; polygon: [number, number][] }> {
  if (knownCounties && knownCounties.length > 0) {
    return knownCounties.map(c => {
      const lists = resolveFenceLists(c);
      return {
        countyId: c.id,
        countyName: c.name,
        zipCodes: lists.zipCodes,
        cities: lists.cities,
        polygon: resolveFencePolygon(c),
      };
    });
  }
  return VIRGINIA_COUNTY_GEOFENCES.map(g => ({
    countyId: g.countyId,
    countyName: g.countyName,
    zipCodes: [...g.zipCodes],
    cities: [...g.cities],
    polygon: seedFencePolygon(g.countyId, g.countyName),
  }));
}

function gpsForCountyId(countyId: string): [number, number] {
  return countyId === 'county-chesterfield' ? [37.4212, -77.5912] : [37.5407, -77.4360];
}

export type CountyMatchBy = 'polygon' | 'zip' | 'city' | 'county_name' | 'fallback' | 'none';

/**
 * Intelligent County Detection from any Address string.
 * Drawn polygon (when GPS is known) first, then ZIP, city, then area name.
 */
export function detectCountyFromAddress(
  address = '',
  knownCounties?: Array<{ id: string; name: string; zipCodes?: string[]; cities?: string[]; polygon?: [number, number][] }>,
  gps?: [number, number]
): {
  countyName: string;
  countyId: string;
  matchedBy: CountyMatchBy;
  matchedValue?: string;
  gpsEstimate?: [number, number];
} {
  if (!address || !address.trim()) {
    const defaultCounty = knownCounties?.[0]?.name || 'Chesterfield County';
    const defaultId = knownCounties?.[0]?.id || 'county-chesterfield';
    return {
      countyName: defaultCounty,
      countyId: defaultId,
      matchedBy: 'fallback',
      gpsEstimate: [37.3774, -77.5816],
    };
  }

  const normalized = address.toLowerCase();
  const zip = extractZipCode(address);
  const fences = fencesForDetection(knownCounties);
  const point = gps || extractGpsFromAddress(address) || geocodeCached(address);

  if (point) {
    const withPoly = fences.filter(g => g.polygon.length >= 3);
    for (const geofence of withPoly) {
      if (isPointInPolygon(point, geofence.polygon)) {
        const matched = knownCounties?.find(c =>
          c.id === geofence.countyId || c.name.toLowerCase() === geofence.countyName.toLowerCase()
        );
        return {
          countyName: matched?.name || geofence.countyName,
          countyId: matched?.id || geofence.countyId,
          matchedBy: 'polygon',
          matchedValue: `${geofence.polygon.length} vertices`,
          gpsEstimate: point,
        };
      }
    }
    if (withPoly.length > 0) {
      const zipOnlyCounties = (knownCounties || []).filter(c => resolveFencePolygon(c).length < 3);
      if (zipOnlyCounties.length > 0) {
        const viaZip = detectCountyFromAddress(address, zipOnlyCounties);
        if (viaZip.matchedBy !== 'fallback' && viaZip.matchedBy !== 'none') return viaZip;
      }
      return {
        countyName: '',
        countyId: '',
        matchedBy: 'none',
        gpsEstimate: point,
      };
    }
  }

  // 1. Try ZIP code match (Highest accuracy) — uses stored area lists, seed if empty
  if (zip) {
    for (const geofence of fences) {
      if (geofence.zipCodes.some(z => normalizeZipToken(z) === zip)) {
        const matched = knownCounties?.find(c =>
          c.id === geofence.countyId || c.name.toLowerCase() === geofence.countyName.toLowerCase()
        );
        return {
          countyName: matched?.name || geofence.countyName,
          countyId: matched?.id || geofence.countyId,
          matchedBy: 'zip',
          matchedValue: zip,
          gpsEstimate: gpsForCountyId(matched?.id || geofence.countyId),
        };
      }
    }
  }

  // 2. Try city / town / district match
  for (const geofence of fences) {
    for (const city of geofence.cities) {
      const token = city.trim();
      if (!token) continue;
      const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(normalized)) {
        const matched = knownCounties?.find(c =>
          c.id === geofence.countyId || c.name.toLowerCase() === geofence.countyName.toLowerCase()
        );
        return {
          countyName: matched?.name || geofence.countyName,
          countyId: matched?.id || geofence.countyId,
          matchedBy: 'city',
          matchedValue: city,
          gpsEstimate: gpsForCountyId(matched?.id || geofence.countyId),
        };
      }
    }
  }

  // 3. Direct county name match (stored Areas + seeded VA names)
  for (const geofence of fences) {
    const rawName = geofence.countyName.toLowerCase().replace(/\s+(county|city)$/i, '');
    if (normalized.includes(rawName)) {
      const matched = knownCounties?.find(c =>
        c.id === geofence.countyId || c.name.toLowerCase() === geofence.countyName.toLowerCase()
      );
      return {
        countyName: matched?.name || geofence.countyName,
        countyId: matched?.id || geofence.countyId,
        matchedBy: 'county_name',
        matchedValue: geofence.countyName,
        gpsEstimate: gpsForCountyId(matched?.id || geofence.countyId),
      };
    }
  }

  if (knownCounties?.length) {
    for (const area of knownCounties) {
      const full = area.name.toLowerCase();
      const raw = full.replace(/\s+(county|city)$/i, '');
      if (full && (normalized.includes(full) || (raw.length > 3 && normalized.includes(raw)))) {
        return {
          countyName: area.name,
          countyId: area.id,
          matchedBy: 'county_name',
          matchedValue: area.name,
        };
      }
    }
  }

  // Fallback to primary county
  const fallbackCounty = knownCounties?.[0]?.name || 'Chesterfield County';
  const fallbackId = knownCounties?.[0]?.id || 'county-chesterfield';
  return {
    countyName: fallbackCounty,
    countyId: fallbackId,
    matchedBy: 'fallback',
    gpsEstimate: [37.3774, -77.5816],
  };
}

/**
 * Evaluates whether a trip stays inside the payer’s fence.
 * Uploaded GeoJSON (when GPS is known) is the source of truth.
 * No polygon: named Areas / ZIP fallback. Empty serviceAreaIds = all seeded areas (chips not required).
 */
export function evaluateTripBoundary(
  pickupAddress = '',
  dropoffAddress = '',
  baseCounty = 'Chesterfield County',
  knownCounties?: Array<{ id: string; name: string; zipCodes?: string[]; cities?: string[]; polygon?: [number, number][] }>,
  serviceAreaIds?: string[],
  gps?: {
    pickupGps?: [number, number];
    dropoffGps?: [number, number];
    payerPolygons?: [number, number][][];
  }
): {
  isInsideCounty: boolean;
  pickupCounty: string;
  dropoffCounty: string;
  boundaryStatus: 'inside' | 'outside' | 'unknown';
  boundaryLabel: string;
  pickupGPS?: [number, number];
  dropoffGPS?: [number, number];
} {
  if (!pickupAddress.trim() || !dropoffAddress.trim()) {
    return {
      isInsideCounty: true,
      pickupCounty: baseCounty,
      dropoffCounty: baseCounty,
      boundaryStatus: 'inside',
      boundaryLabel: `Inside ${baseCounty}`,
      pickupGPS: [37.4212, -77.5912],
      dropoffGPS: [37.4312, -77.6012],
    };
  }

  const pickupGps = gps?.pickupGps || extractGpsFromAddress(pickupAddress) || geocodeCached(pickupAddress);
  const dropoffGps = gps?.dropoffGps || extractGpsFromAddress(dropoffAddress) || geocodeCached(dropoffAddress);
  const payerRings = parsePolygons(gps?.payerPolygons);

  // Payer-uploaded GeoJSON is the source of truth when both points can be located.
  if (payerRings.length > 0 && pickupGps && dropoffGps) {
    const isInside =
      isPointInAnyPolygon(pickupGps, payerRings) && isPointInAnyPolygon(dropoffGps, payerRings);
    const label = baseCounty || 'service area';
    return {
      isInsideCounty: isInside,
      pickupCounty: isInside ? label : '',
      dropoffCounty: isInside ? label : '',
      boundaryStatus: isInside ? 'inside' : 'outside',
      boundaryLabel: isInside ? `Inside ${label}` : 'Outside drawn fence',
      pickupGPS: pickupGps,
      dropoffGPS: dropoffGps,
    };
  }

  const pickup = detectCountyFromAddress(pickupAddress, knownCounties, pickupGps);
  const dropoff = detectCountyFromAddress(dropoffAddress, knownCounties, dropoffGps);

  const areaSet = resolvePayerAreaIds(serviceAreaIds, knownCounties);
  const inAreas = (countyId: string, countyName: string) => {
    if (!countyId) return false;
    const name = countyName.toLowerCase();
    return areaSet.some(id => {
      const hit = knownCounties?.find(c => c.id === id);
      const fence = lookupAreaGeofence(id);
      return (
        id === countyId ||
        (hit && hit.name.toLowerCase() === name) ||
        (fence && fence.countyName.toLowerCase() === name)
      );
    });
  };

  const located =
    pickup.matchedBy !== 'none' && dropoff.matchedBy !== 'none';
  const isInside =
    located &&
    inAreas(pickup.countyId, pickup.countyName) &&
    inAreas(dropoff.countyId, dropoff.countyName);

  let boundaryLabel = '';
  if (!located) {
    boundaryLabel = 'Outside drawn fence';
  } else if (isInside) {
    boundaryLabel = `Inside ${pickup.countyName}`;
  } else {
    boundaryLabel = `Cross-County: ${pickup.countyName} ➔ ${dropoff.countyName}`;
  }

  return {
    isInsideCounty: isInside,
    pickupCounty: pickup.countyName || baseCounty,
    dropoffCounty: dropoff.countyName || baseCounty,
    boundaryStatus: isInside ? 'inside' : 'outside',
    boundaryLabel,
    pickupGPS: pickup.gpsEstimate,
    dropoffGPS: dropoff.gpsEstimate,
  };
}
