import { useSyncExternalStore } from 'react';

/** Dispatch-editable rates. Same localStorage pattern as facilities — no new backend. */
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
}

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
    { id: 'Wheelchair', label: 'Wheelchair', amount: 0 },
    { id: 'Walker', label: 'Walker', amount: 0 },
    { id: 'Rollator', label: 'Rollator', amount: 0 },
    { id: 'Cane', label: 'Cane', amount: 0 },
    { id: 'Stretcher', label: 'Stretcher', amount: 0 },
  ],
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
        };
      }
    }
  } catch { /* seed */ }
  return { ...DEFAULT_PRICING, brackets: [...DEFAULT_PRICING.brackets], items: DEFAULT_PRICING.items.map(i => ({ ...i })) };
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
  return { pricing, setPricing };
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
  insideCounty?: boolean;
  tripType?: string;
  miles?: number;
  mobility?: string;
  stops?: string[];
} = {}, config?: PricingConfig) {
  const cfg = config || pricingStore.get();
  const roundTrip = input.tripType === 'round-trip' || input.tripType === 'round_trip';
  const legs = roundTrip ? 2 : 1;
  const customerUnit = input.insideCounty === false ? cfg.customerOutside : cfg.customerInside;
  const copay = Number((legs * customerUnit).toFixed(2));

  const miles = Number(input.miles) || 0;
  const match = cfg.brackets.find(b => miles >= Number(b.min) && miles <= Number(b.max));
  const last = cfg.brackets[cfg.brackets.length - 1];
  const bracketRate = match ? Number(match.rate) : (last && miles > Number(last.max) ? Number(last.rate) : Number(cfg.brackets[0]?.rate) || 0);
  const service = cfg.items.find(i => i.id === input.mobility || i.label === input.mobility)?.amount || 0;
  const cost = Number((bracketRate + Number(cfg.pickupFee || 0) + Number(service)).toFixed(2));

  return { copay, cost, costToCounty: cost, legs, customerUnit };
}
