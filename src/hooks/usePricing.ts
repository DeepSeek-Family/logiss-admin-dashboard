import { useSyncExternalStore } from 'react';

export interface CountyConfig {
  id: string;
  name: string;
  state?: string;
  insideRate: number;
  outsideRate: number;
  pickupFee: number;
  status: 'active' | 'inactive';
  notes?: string;
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
  customerInside: number;
  customerOutside: number;
  pickupFee: number;
  brackets: PricingBracket[];
  items: PricingItem[];
  counties: CountyConfig[];
  mobilityTypes: MobilityConfig[];
}

export const DEFAULT_COUNTIES: CountyConfig[] = [
  { id: 'county-chesterfield', name: 'Chesterfield County', state: 'VA', insideRate: 10, outsideRate: 15, pickupFee: 0, status: 'active', notes: 'Primary coverage area' },
  { id: 'county-henrico', name: 'Henrico County', state: 'VA', insideRate: 12, outsideRate: 18, pickupFee: 0, status: 'active', notes: 'North & East coverage' },
  { id: 'county-hanover', name: 'Hanover County', state: 'VA', insideRate: 12, outsideRate: 18, pickupFee: 0, status: 'active', notes: 'North Richmond zone' },
  { id: 'county-richmond', name: 'Richmond City', state: 'VA', insideRate: 10, outsideRate: 15, pickupFee: 0, status: 'active', notes: 'Metro district' },
  { id: 'county-powhatan', name: 'Powhatan County', state: 'VA', insideRate: 15, outsideRate: 22, pickupFee: 5, status: 'active', notes: 'West rural coverage' },
  { id: 'county-goochland', name: 'Goochland County', state: 'VA', insideRate: 15, outsideRate: 22, pickupFee: 5, status: 'active', notes: 'Northwest zone' },
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
  customerInside: 10,
  customerOutside: 15,
  pickupFee: 0,
  brackets: [
    { min: 0, max: 5.49, rate: 10 },
    { min: 5.5, max: 10.49, rate: 20 },
    { min: 10.5, max: 30, rate: 50 },
  ],
  items: [
    { id: 'Ambulatory', label: 'Ambulatory', amount: 0 },
    { id: 'Wheelchair', label: 'Wheelchair', amount: 25 },
    { id: 'Walker', label: 'Walker', amount: 5 },
    { id: 'Rollator', label: 'Rollator', amount: 5 },
    { id: 'Cane', label: 'Cane', amount: 0 },
    { id: 'Stretcher', label: 'Stretcher', amount: 50 },
  ],
  counties: DEFAULT_COUNTIES,
  mobilityTypes: DEFAULT_MOBILITY_TYPES,
};

const STORAGE_KEY = 'logiss-pricing';
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
          brackets: Array.isArray(parsed.brackets) && parsed.brackets.length ? parsed.brackets : DEFAULT_PRICING.brackets,
          items: Array.isArray(parsed.items) && parsed.items.length ? parsed.items : DEFAULT_PRICING.items,
          counties: Array.isArray(parsed.counties) && parsed.counties.length ? parsed.counties : DEFAULT_COUNTIES,
          mobilityTypes: Array.isArray(parsed.mobilityTypes) && parsed.mobilityTypes.length ? parsed.mobilityTypes : DEFAULT_MOBILITY_TYPES,
        };
      }
    }
  } catch { /* seed */ }
  return {
    ...DEFAULT_PRICING,
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
  const roundTrip = input.tripType === 'round-trip' || input.tripType === 'round_trip';
  const legs = roundTrip ? 2 : 1;

  // 1. County rate lookup
  const matchedCounty = input.county ? (
    cfg.counties?.find(c => c.name.toLowerCase() === input.county?.toLowerCase() || c.id === input.county || c.name.toLowerCase().includes(input.county?.toLowerCase() || ''))
  ) : null;

  const countyInsideRate = matchedCounty?.insideRate != null ? matchedCounty.insideRate : cfg.customerInside;
  const countyOutsideRate = matchedCounty?.outsideRate != null ? matchedCounty.outsideRate : cfg.customerOutside;
  const countyPickupFee = matchedCounty?.pickupFee != null ? matchedCounty.pickupFee : Number(cfg.pickupFee || 0);

  const customerUnit = input.insideCounty === false ? countyOutsideRate : countyInsideRate;
  const copay = Number((legs * customerUnit).toFixed(2));

  // 2. Mileage bracket rate lookup
  const miles = Number(input.miles) || 0;
  const match = cfg.brackets.find(b => miles >= Number(b.min) && miles <= Number(b.max));
  const last = cfg.brackets[cfg.brackets.length - 1];
  const bracketRate = match ? Number(match.rate) : (last && miles > Number(last.max) ? Number(last.rate) : Number(cfg.brackets[0]?.rate) || 0);

  // 3. Mobility surcharge lookup
  const matchedMobility = cfg.mobilityTypes?.find(m => m.name.toLowerCase() === (input.mobility || '').toLowerCase() || m.id.toLowerCase() === (input.mobility || '').toLowerCase());
  const mobilitySurcharge = matchedMobility != null ? matchedMobility.fee : (
    cfg.items?.find(i => i.id === input.mobility || i.label === input.mobility)?.amount || 0
  );

  const cost = Number((bracketRate + countyPickupFee + mobilitySurcharge).toFixed(2));

  return { copay, cost, costToCounty: cost, legs, customerUnit, countyPickupFee, mobilitySurcharge };
}

