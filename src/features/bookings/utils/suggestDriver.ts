import { isVehicleMatch } from './helpers';

// ── Geo/time proxies (no GPS coords in the data, so we approximate) ───────────
const estDur = (t: any): number => {
  if (t?.duration) { const m = parseInt(String(t.duration), 10); if (!isNaN(m) && m > 0) return Math.min(m, 180); }
  if (t?.miles) return Math.min(150, Math.round(Number(t.miles) * 3) + 12);
  return 45;
};
// City/area = segment after the first comma ("5400 Midlothian Tpke, Richmond" → "richmond").
const area = (addr?: string): string => {
  const p = String(addr || '').split(',');
  return (p.length >= 2 ? p[1] : p[0] || '').trim().toLowerCase();
};
const sameDay = (a: string, b: string) => {
  if (!a || !b) return false;
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

const ACTIVE = ['assigned', 'confirmed', 'dispatched', 'en_route', 'in_trip', 'arrived'];

export interface DriverSuggestion {
  driver: any;
  score: number;      // lower = better
  conflict: boolean;  // hard time-window overlap
  fit: boolean;       // vehicle-type match
  sameArea: boolean;  // route-efficient continuation
  gapMin: number;     // slack to nearest same-day trip (Infinity = none)
  loadMiles: number;  // miles already on the driver's day
  hasDay: boolean;
  recommended: boolean;
  tags: string[];     // compact reasons for the UI
}

/**
 * Rank every driver for a trip using real operational signals — availability,
 * vehicle fit, time-overlap conflict, route-area continuity (deadhead), schedule
 * slack, and the day's mileage/workload. Lower score = better. The single source of
 * truth shared by the inline picker, Auto-Assign, and the AI suggestions panel.
 */
export function suggestDrivers(trip: any, drivers: any[], allTrips: any[]): DriverSuggestion[] {
  const myStart = new Date(trip.scheduledTime).getTime();
  const myEnd = myStart + estDur(trip) * 60000;
  const myPickupArea = area(trip.pickup);
  const myDropArea = area(trip.dropoff);

  const scored = (drivers || []).map((d: any): DriverSuggestion => {
    const others = (allTrips || []).filter((t: any) =>
      String(t.driverId) === String(d.id) && t.id !== trip.id &&
      ACTIVE.includes(t.status) && sameDay(t.scheduledTime, trip.scheduledTime));

    let conflict = false;
    let gapMin = Infinity;
    let loadMiles = 0;
    let prevDropArea = '';
    let nextPickArea = '';
    let prevEndDelta = Infinity;
    let nextStartDelta = Infinity;

    others.forEach((o: any) => {
      loadMiles += Number(o.miles) || 0;
      const os = new Date(o.scheduledTime).getTime();
      const oEnd = os + estDur(o) * 60000;
      if (myStart < oEnd && os < myEnd) conflict = true;
      const sep = myStart >= oEnd ? (myStart - oEnd) : (os >= myEnd ? (os - myEnd) : 0);
      gapMin = Math.min(gapMin, sep / 60000);
      if (oEnd <= myStart && (myStart - oEnd) < prevEndDelta) { prevEndDelta = myStart - oEnd; prevDropArea = area(o.dropoff); }
      if (os >= myEnd && (os - myEnd) < nextStartDelta) { nextStartDelta = os - myEnd; nextPickArea = area(o.pickup); }
    });

    const fit = isVehicleMatch(d, trip);
    const hasDay = others.length > 0;
    const sameArea = (!!prevDropArea && !!myPickupArea && prevDropArea === myPickupArea)
      || (!!nextPickArea && !!myDropArea && nextPickArea === myDropArea);

    let score = 0;
    if (!d.onDuty) score += 100;
    if (conflict) score += 50;
    if (!fit) score += 40;
    if (hasDay) {
      if (sameArea) score -= 12;
      else score += 8;
      if (!conflict && gapMin < 20) score += 8;
      score += Math.min(loadMiles * 0.05, 6);
    } else {
      score += 2;
    }

    return { driver: d, score, conflict, fit, sameArea, gapMin, loadMiles, hasDay, recommended: false, tags: [] };
  }).sort((a, b) => a.score - b.score || (a.driver.name || '').localeCompare(b.driver.name || ''));

  const top = scored.find(s => s.driver.onDuty && !s.conflict && s.fit);
  if (top) top.recommended = true;

  scored.forEach(s => {
    const tags: string[] = [];
    if (s.recommended) tags.push('★ best');
    if (!s.driver.onDuty) tags.push('off-duty');
    if (s.conflict) tags.push('⚠ busy');
    if (!s.fit) tags.push('⚠ vehicle');
    if (s.driver.onDuty && !s.conflict) {
      if (s.sameArea) tags.push('same area');
      else if (s.hasDay) tags.push('cross-town');
      if (!s.hasDay) tags.push('open');
      else if (isFinite(s.gapMin) && s.gapMin >= 20 && s.gapMin < 600) tags.push(`${Math.round(s.gapMin)}m gap`);
    }
    s.tags = tags;
  });

  return scored;
}

/** The single best *viable* driver (on-duty, no conflict, vehicle fit) or null. */
export function bestDriver(trip: any, drivers: any[], allTrips: any[]): DriverSuggestion | null {
  const ranked = suggestDrivers(trip, drivers, allTrips);
  return ranked.find(s => s.recommended) || null;
}
