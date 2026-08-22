import { useSyncExternalStore } from 'react';

export interface CountyConfig {
  id: string;
  name: string;
  state?: string;
  localFare: number; // Inside-county base fare / copay
  status: 'active' | 'inactive';
  notes?: string;
}

export interface TransitRulesConfig {
  basePickupFee: number;       // Global base dispatch/pickup fee
  crossCountySurcharge: number; // Global surcharge when leaving origin county
  stopFee: number;             // Fee per intermediate stop
  nightSurcharge: number;      // Surcharge for after-hours trips (8 PM - 6 AM)
  weekendSurcharge: number;    // Surcharge for weekend trips
}

export interface MobilityConfig {
  id: string;
  name: string;
  fee: number;
  iconKey?: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface PricingBracket {
  min: number;
  max: number;
  rate: number;
}

export interface PricingItem {
  id: string;
  label: string;
  amount: number;
}

export interface PricingConfig {
  rules: TransitRulesConfig;
  counties: CountyConfig[];
  mobilityTypes: MobilityConfig[];
  brackets: PricingBracket[];
  items: PricingItem[];
  // Backwards compatibility helpers
  customerInside?: number;
  customerOutside?: number;
  pickupFee?: number;
}

export const DEFAULT_TRANSIT_RULES: TransitRulesConfig = {
  basePickupFee: 0.00,
  crossCountySurcharge: 6.00,
  stopFee: 5.00,
  nightSurcharge: 15.00,
  weekendSurcharge: 10.00,
};

export const DEFAULT_COUNTIES: CountyConfig[] = [
  { id: 'county-chesterfield', name: 'Chesterfield County', state: 'VA', localFare: 10.00, status: 'active', notes: 'Primary coverage area' },
  { id: 'county-henrico', name: 'Henrico County', state: 'VA', localFare: 12.00, status: 'active', notes: 'North & East coverage' },
  { id: 'county-hanover', name: 'Hanover County', state: 'VA', localFare: 12.00, status: 'active', notes: 'North Richmond zone' },
  { id: 'county-richmond', name: 'Richmond City', state: 'VA', localFare: 10.00, status: 'active', notes: 'Metro district' },
  { id: 'county-powhatan', name: 'Powhatan County', state: 'VA', localFare: 15.00, status: 'active', notes: 'West rural coverage' },
  { id: 'county-goochland', name: 'Goochland County', state: 'VA', localFare: 15.00, status: 'active', notes: 'Northwest zone' },
];

export const DEFAULT_MOBILITY_TYPES: MobilityConfig[] = [
  { id: 'Ambulatory', name: 'Ambulatory', fee: 0, iconKey: 'User', description: 'Independent rider, no mobility equipment needed', status: 'active' },
  { id: 'Wheelchair', name: 'Wheelchair', fee: 25, iconKey: 'Accessibility', description: 'Requires wheelchair ramp / lift and vehicle space', status: 'active' },
  { id: 'Stretcher', name: 'Stretcher', fee: 50, iconKey: 'Bed', description: 'Medical stretcher transport, requires two-person assist', status: 'active' },
  { id: 'Walker', name: 'Walker', fee: 5, iconKey: 'Disc', description: 'Standard folding walker assistance', status: 'active' },
  { id: 'Rollator', name: 'Rollator', fee: 5, iconKey: 'Zap', description: '4-wheel rolling walker with seat', status: 'active' },
  { id: 'Cane', name: 'Cane', fee: 0, iconKey: 'Info', description: 'Single or quad cane walking support', status: 'active' },
];

export const DEFAULT_PRICING: PricingConfig = {
  rules: DEFAULT_TRANSIT_RULES,
  counties: DEFAULT_COUNTIES,
  mobilityTypes: DEFAULT_MOBILITY_TYPES,
  brackets: [
    { min: 0, max: 5, rate: 10 },
    { min: 5, max: 10, rate: 20 },
    { min: 10, max: 30, rate: 50 },
    { min: 30, max: 50, rate: 70 },
  ],
  items: [
    { id: 'Ambulatory', label: 'Ambulatory', amount: 0 },
    { id: 'Wheelchair', label: 'Wheelchair', amount: 25 },
    { id: 'Walker', label: 'Walker', amount: 5 },
    { id: 'Rollator', label: 'Rollator', amount: 5 },
    { id: 'Cane', label: 'Cane', amount: 0 },
    { id: 'Stretcher', label: 'Stretcher', amount: 50 },
  ],
  customerInside: 10,
  customerOutside: 16,
  pickupFee: 0,
};

const STORAGE_KEY = 'logiss-pricing-v2';
const listeners = new Set<() => void>();

const load = (): PricingConfig => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_PRICING,
          ...parsed,
          rules: { ...DEFAULT_TRANSIT_RULES, ...(parsed.rules || {}) },
          counties: Array.isArray(parsed.counties) && parsed.counties.length
            ? parsed.counties.map((c: any) => ({
                id: c.id || `county-${Date.now()}`,
                name: c.name || '',
                state: c.state || 'VA',
                localFare: c.localFare != null ? Number(c.localFare) : (Number(c.insideRate) || 10),
                status: c.status || 'active',
                notes: c.notes || '',
              }))
            : DEFAULT_COUNTIES,
          mobilityTypes: Array.isArray(parsed.mobilityTypes) && parsed.mobilityTypes.length ? parsed.mobilityTypes : DEFAULT_MOBILITY_TYPES,
          brackets: Array.isArray(parsed.brackets) && parsed.brackets.length ? parsed.brackets : DEFAULT_PRICING.brackets,
          items: Array.isArray(parsed.items) && parsed.items.length ? parsed.items : DEFAULT_PRICING.items,
        };
      }
    }
  } catch { /* seed */ }
  return {
    ...DEFAULT_PRICING,
    rules: { ...DEFAULT_TRANSIT_RULES },
    brackets: [...DEFAULT_PRICING.brackets],
    items: DEFAULT_PRICING.items.map(i => ({ ...i })),
    counties: DEFAULT_COUNTIES.map(c => ({ ...c })),
    mobilityTypes: DEFAULT_MOBILITY_TYPES.map(m => ({ ...m })),
  };
};

let store: PricingConfig = load();

const persist = () => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
};

export const pricingStore = {
  get: () => store,
  set: (next: PricingConfig) => { store = next; persist(); listeners.forEach(l => l()); },
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
};

export function usePricing() {
  const pricing = useSyncExternalStore(pricingStore.subscribe, pricingStore.get, pricingStore.get);
  const setPricing = (next: PricingConfig | ((prev: PricingConfig) => PricingConfig)) =>
    pricingStore.set(typeof next === 'function' ? next(pricingStore.get()) : next);

  // Transit Rules actions
  const updateRules = (updates: Partial<TransitRulesConfig>) => {
    setPricing(prev => ({
      ...prev,
      rules: { ...(prev.rules || DEFAULT_TRANSIT_RULES), ...updates },
    }));
  };

  // County actions
  const addCounty = (county: Omit<CountyConfig, 'id'>) => {
    const newCounty: CountyConfig = {
      ...county,
      id: `county-${Date.now()}`,
    };
    setPricing(prev => ({
      ...prev,
      counties: [...(prev.counties || []), newCounty],
    }));
    return newCounty;
  };

  const updateCounty = (id: string, updates: Partial<CountyConfig>) => {
    setPricing(prev => ({
      ...prev,
      counties: (prev.counties || []).map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const deleteCounty = (id: string) => {
    setPricing(prev => ({
      ...prev,
      counties: (prev.counties || []).filter(c => c.id !== id),
    }));
  };

  // Mobility actions
  const addMobility = (mob: Omit<MobilityConfig, 'id'>) => {
    const newMob: MobilityConfig = {
      ...mob,
      id: mob.name.trim().replace(/\s+/g, '_'),
    };
    setPricing(prev => ({
      ...prev,
      mobilityTypes: [...(prev.mobilityTypes || []), newMob],
      items: [...(prev.items || []), { id: newMob.id, label: newMob.name, amount: newMob.fee }],
    }));
    return newMob;
  };

  const updateMobility = (id: string, updates: Partial<MobilityConfig>) => {
    setPricing(prev => ({
      ...prev,
      mobilityTypes: (prev.mobilityTypes || []).map(m => m.id === id ? { ...m, ...updates } : m),
      items: (prev.items || []).map(i => i.id === id ? { ...i, label: updates.name || i.label, amount: updates.fee != null ? updates.fee : i.amount } : i),
    }));
  };

  const deleteMobility = (id: string) => {
    setPricing(prev => ({
      ...prev,
      mobilityTypes: (prev.mobilityTypes || []).filter(m => m.id !== id),
      items: (prev.items || []).filter(i => i.id !== id),
    }));
  };

  return {
    pricing,
    setPricing,
    updateRules,
    addCounty,
    updateCounty,
    deleteCounty,
    addMobility,
    updateMobility,
    deleteMobility,
  };
}

/** Address-text stand-in until client geofence/GPS codes arrive. */
export function inferInsideCounty(pickup = '', dropoff = '', homeCounty = ''): boolean {
  if (!pickup.trim() || !dropoff.trim()) return true;
  const home = homeCounty.toLowerCase().replace(/\s+(county|city)$/i, '').trim();
  const p = pickup.toLowerCase();
  const d = dropoff.toLowerCase();
  if (home) return p.includes(home) && d.includes(home);
  const zones = ['chesterfield', 'henrico', 'hanover', 'richmond', 'powhatan', 'goochland'];
  const pickupZone = zones.find(z => p.includes(z));
  const dropoffZone = zones.find(z => d.includes(z));
  if (pickupZone && dropoffZone) return pickupZone === dropoffZone;
  return true;
}

export function quoteFares(input: {
  county?: string;
  insideCounty?: boolean;
  tripType?: string;
  miles?: number;
  mobility?: string;
  stops?: string[];
} = {}, config?: PricingConfig) {
  const cfg = config || pricingStore.get();
  const rules = cfg.rules || DEFAULT_TRANSIT_RULES;
  const roundTrip = input.tripType === 'round-trip' || input.tripType === 'round_trip';
  const legs = roundTrip ? 2 : 1;

  // 1. County local fare lookup
  const matchedCounty = input.county ? (
    cfg.counties?.find(c => c.name.toLowerCase() === input.county?.toLowerCase() || c.id === input.county || c.name.toLowerCase().includes(input.county?.toLowerCase() || ''))
  ) : null;

  const localBaseFare = matchedCounty?.localFare != null ? Number(matchedCounty.localFare) : (Number(cfg.customerInside) || 10.00);
  const crossCountySurcharge = Number(rules.crossCountySurcharge || 6.00);

  // If outside county, apply standard cross-county surcharge
  const customerUnit = input.insideCounty === false ? (localBaseFare + crossCountySurcharge) : localBaseFare;
  const copay = Number((legs * customerUnit).toFixed(2));

  // 2. Mileage bracket rate lookup
  const miles = Number(input.miles) || 0;
  const match = cfg.brackets.find(b => miles >= Number(b.min) && miles <= Number(b.max));
  const last = cfg.brackets[cfg.brackets.length - 1];
  const bracketRate = match ? Number(match.rate) : (last && miles > Number(last.max) ? Number(last.rate) : Number(cfg.brackets[0]?.rate) || 0);

  // 3. Base Pickup fee & Mobility surcharge
  const basePickupFee = Number(rules.basePickupFee || 0);
  const matchedMobility = cfg.mobilityTypes?.find(m => m.name.toLowerCase() === (input.mobility || '').toLowerCase() || m.id.toLowerCase() === (input.mobility || '').toLowerCase());
  const mobilitySurcharge = matchedMobility != null ? Number(matchedMobility.fee) : (
    Number(cfg.items?.find(i => i.id === input.mobility || i.label === input.mobility)?.amount) || 0
  );

  // 4. Stops fee
  const stopsSurcharge = (input.stops?.filter(s => s && s.trim().length > 0).length || 0) * Number(rules.stopFee || 5.00);

  const cost = Number((bracketRate + basePickupFee + mobilitySurcharge + stopsSurcharge).toFixed(2));

  return {
    copay,
    cost,
    costToCounty: cost,
    legs,
    customerUnit,
    basePickupFee,
    crossCountySurcharge,
    mobilitySurcharge,
    stopsSurcharge,
    countyPickupFee: basePickupFee, // backwards compatibility
  };
}

