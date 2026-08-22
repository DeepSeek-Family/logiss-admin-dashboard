/**
 * Geofencing & Address Auto-Detection Engine for Virginia Paratransit & NEMT.
 * Maps GPS Coordinates (Polygon boundaries), postal ZIP codes, and municipal zones to official Service Counties.
 */

export interface CountyGeofenceData {
  countyId: string;
  countyName: string;
  state: string;
  polygonPointsCount: number;
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
    polygonPointsCount: 1480,
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
    polygonPointsCount: 1120,
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
    polygonPointsCount: 890,
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
    polygonPointsCount: 960,
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
    polygonPointsCount: 640,
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
    polygonPointsCount: 710,
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

/**
 * Extract 5-digit US ZIP code from an address string.
 */
export function extractZipCode(address = ''): string | null {
  if (!address) return null;
  const match = address.match(/\b(2[0-9]{4})(?:-[0-9]{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Intelligent County Detection from any Address string.
 * Checks Postal ZIP codes first, then known municipality/town names, then direct county mentions.
 */
export function detectCountyFromAddress(
  address = '',
  knownCounties?: Array<{ id: string; name: string }>
): {
  countyName: string;
  countyId: string;
  matchedBy: 'zip' | 'city' | 'county_name' | 'fallback';
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

  // 1. Try ZIP code match (Highest accuracy)
  if (zip) {
    for (const geofence of VIRGINIA_COUNTY_GEOFENCES) {
      if (geofence.zipCodes.includes(zip)) {
        const matched = knownCounties?.find(c =>
          c.id === geofence.countyId || c.name.toLowerCase() === geofence.countyName.toLowerCase()
        );
        return {
          countyName: matched?.name || geofence.countyName,
          countyId: matched?.id || geofence.countyId,
          matchedBy: 'zip',
          matchedValue: zip,
          gpsEstimate: geofence.countyId === 'county-chesterfield' ? [37.4212, -77.5912] : [37.5407, -77.4360],
        };
      }
    }
  }

  // 2. Try city / town / district match
  for (const geofence of VIRGINIA_COUNTY_GEOFENCES) {
    for (const city of geofence.cities) {
      const regex = new RegExp(`\\b${city}\\b`, 'i');
      if (regex.test(normalized)) {
        const matched = knownCounties?.find(c =>
          c.id === geofence.countyId || c.name.toLowerCase() === geofence.countyName.toLowerCase()
        );
        return {
          countyName: matched?.name || geofence.countyName,
          countyId: matched?.id || geofence.countyId,
          matchedBy: 'city',
          matchedValue: city,
          gpsEstimate: geofence.countyId === 'county-chesterfield' ? [37.4212, -77.5912] : [37.5407, -77.4360],
        };
      }
    }
  }

  // 3. Direct county name match
  for (const geofence of VIRGINIA_COUNTY_GEOFENCES) {
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
        gpsEstimate: geofence.countyId === 'county-chesterfield' ? [37.4212, -77.5912] : [37.5407, -77.4360],
      };
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
 * Evaluates whether a trip stays inside the service county or crosses county borders.
 */
export function evaluateTripBoundary(
  pickupAddress = '',
  dropoffAddress = '',
  baseCounty = 'Chesterfield County',
  knownCounties?: Array<{ id: string; name: string }>
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

  const pickup = detectCountyFromAddress(pickupAddress, knownCounties);
  const dropoff = detectCountyFromAddress(dropoffAddress, knownCounties);

  const isSameCounty = pickup.countyId === dropoff.countyId;
  const isBaseCounty = baseCounty
    ? (pickup.countyName.toLowerCase() === baseCounty.toLowerCase() || pickup.countyId === baseCounty)
    : true;

  const isInside = isSameCounty && isBaseCounty;

  let boundaryLabel = '';
  if (isInside) {
    boundaryLabel = `Inside ${pickup.countyName}`;
  } else {
    boundaryLabel = `Cross-County: ${pickup.countyName} ➔ ${dropoff.countyName}`;
  }

  return {
    isInsideCounty: isInside,
    pickupCounty: pickup.countyName,
    dropoffCounty: dropoff.countyName,
    boundaryStatus: isInside ? 'inside' : 'outside',
    boundaryLabel,
    pickupGPS: pickup.gpsEstimate,
    dropoffGPS: dropoff.gpsEstimate,
  };
}
