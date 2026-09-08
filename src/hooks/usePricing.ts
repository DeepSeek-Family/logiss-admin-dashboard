import { useSyncExternalStore } from 'react';
import {
  evaluateTripBoundary,
  detectCountyFromAddress,
  resolvePayerAreaIds,
  seedFenceLists,
  seedFencePolygon,
  parsePolygon,
  parsePolygons,
  geocodeCached,
} from '@/utils/geofenceEngine';

export interface CountyConfig {
  id: string;
  name: string;
  state?: string;
  localFare: number;
  status: 'active' | 'inactive';
  notes?: string;
  /** ZIP codes that count as inside this area. Empty at runtime falls back to the VA seed table. */
  zipCodes: string[];
  /** City / town names that count as inside this area. Empty at runtime falls back to the VA seed table. */
  cities: string[];
  /** Drawn [lat, lng] fence. Empty = use ZIP/city. */
  polygon: [number, number][];
}

export interface TransitRulesConfig {
  basePickupFee: number;
  crossCountySurcharge: number;
  stopFee: number;
  nightSurcharge: number;
  weekendSurcharge: number;
}

export interface BillingClass {
  id: string;
  name: string;
  fee: number;
}

export interface MobilityConfig {
  id: string;
  name: string;
  fee: number;
  billingClassId?: string;
  iconKey?: string;
  iconUrl?: string;
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

export type PricingMethod =
  | 'flat'
  | 'base_per_mile'
  | 'mileage_brackets'
  | 'geofence'
  | 'included_then_per_mile';

export type BillMileage = 'calculated' | 'actual';
export type MileageRounding = 'none' | 'up';
export type PenaltyAppliesTo = 'copay' | 'funding' | 'both';

export const PRICING_METHOD_LABELS: Record<PricingMethod, string> = {
  flat: 'Flat Rate',
  included_then_per_mile: 'By miles',
  mileage_brackets: 'Mileage Brackets',
  // Snapshot / legacy aliases
  base_per_mile: 'By miles',
  geofence: 'Flat Rate',
};

function normalizePricingMethod(method: unknown): PricingMethod {
  if (method === 'flat' || method === 'geofence' || method === 'mileage_brackets' || method === 'included_then_per_mile') {
    return method;
  }
  if (method === 'base_per_mile' || method === 'per_mile') return 'included_then_per_mile';
  if (method === 'brackets') return 'mileage_brackets';
  if (method === 'first_x' || method === 'threshold') return 'included_then_per_mile';
  return 'mileage_brackets';
}

function migrateStoredRates(p: {
  pricingMethod?: unknown;
  baseFare?: unknown;
  includedMiles?: unknown;
  includedRate?: unknown;
  flatRate?: unknown;
  insideRate?: unknown;
}): { pricingMethod: PricingMethod; includedMiles: number; includedRate: number; flatRate: number } {
  const raw = p.pricingMethod;
  let pricingMethod = normalizePricingMethod(raw);
  let includedMiles = Number(p.includedMiles ?? 5);
  let includedRate = Number(p.includedRate ?? 20);
  let flatRate = Number(p.flatRate ?? 45);

  if (raw === 'base_per_mile' || raw === 'per_mile') {
    pricingMethod = 'included_then_per_mile';
    includedMiles = 0;
    includedRate = Number(p.baseFare ?? p.includedRate ?? 15);
  }
  if (raw === 'geofence') {
    pricingMethod = 'flat';
    flatRate = Number(p.insideRate ?? p.flatRate ?? 45);
  }

  return { pricingMethod, includedMiles, includedRate, flatRate };
}

export const DEFAULT_REPORT_COLUMNS = [
  'Trip ID',
  'Date',
  'Rider',
  'Miles',
  'Calculated Miles',
  'Actual Miles',
  'Passenger Copay',
  'Payer Charge',
  'Auth ID',
  'Inside/Outside',
  'Billing Class',
  'Driver',
  'Status',
];

export const ALL_REPORT_COLUMNS = [
  ...DEFAULT_REPORT_COLUMNS,
  'Payer',
  'Pickup',
  'Dropoff',
];

export interface PolicyRateVersion {
  effectiveFrom: string;
  effectiveTo: string;
  pricingMethod: PricingMethod;
  flatRate: number;
  baseFare: number;
  perMileRate: number;
  includedMiles: number;
  includedRate: number;
  brackets: PricingBracket[];
  insideRate: number;
  outsideRate: number;
  passengerCopayInside: number;
  passengerCopayOutside: number;
}

export interface FundingSourcePolicy {
  id: string;
  name: string;
  type: string;
  active: boolean;
  pricingMethod: PricingMethod;
  flatRate: number;
  baseFare: number;
  perMileRate: number;
  includedMiles: number;
  includedRate: number;
  brackets: PricingBracket[];
  insideRate: number;
  outsideRate: number;
  passengerCopayInside: number;
  passengerCopayOutside: number;
  effectiveFrom: string;
  effectiveTo: string;
  reportColumns: string[];
  /** Named areas this payer covers. Empty = all seeded Areas (no chip selection required; GeoJSON fence wins when set). */
  serviceAreaIds: string[];
  /** Uploaded GeoJSON outer rings [lat, lng]. Source of truth when present. */
  geofencePolygons: [number, number][][];
  geofenceFileName: string;
  billMileage: BillMileage;
  rounding: MileageRounding;
  freeCancelHours: number;
  lateCancelCharge: number;
  noShowCharge: number;
  penaltyAppliesTo: PenaltyAppliesTo;
  versions: PolicyRateVersion[];
}

export interface PricingConfig {
  rules: TransitRulesConfig;
  counties: CountyConfig[];
  mobilityTypes: MobilityConfig[];
  billingClasses: BillingClass[];
  brackets: PricingBracket[];
  items: PricingItem[];
  fundingPolicies: FundingSourcePolicy[];
  customerInside?: number;
  customerOutside?: number;
  pickupFee?: number;
}

export interface FareLegQuote {
  legIndex: 1 | 2;
  label: string;
  miles: number;
  passengerCopay: number;
  fundingSourceCharge: number;
}

export interface PricingSnapshot {
  fundingSourceId: string;
  fundingSourceName: string;
  pricingMethod: PricingMethod;
  methodLabel: string;
  flatRate?: number;
  baseFare?: number;
  perMileRate?: number;
  brackets?: PricingBracket[];
  insideRate?: number;
  outsideRate?: number;
  passengerCopayInside: number;
  passengerCopayOutside: number;
  effectiveFrom: string;
  effectiveTo: string;
  quotedAt: string;
  insideCounty: boolean;
  miles: number;
  calculatedMiles?: number;
  actualMiles?: number;
  billingClassId?: string;
  billingClassName?: string;
  mobilityFee: number;
  pickupFee: number;
  stopsFee: number;
  includedMiles?: number;
  includedRate?: number;
}

export interface FareQuote {
  /** @deprecated use passengerCopay */
  copay: number;
  /** @deprecated use fundingSourceCharge */
  cost: number;
  /** @deprecated use fundingSourceCharge */
  costToCounty: number;
  passengerCopay: number;
  fundingSourceCharge: number;
  legs: number;
  legQuotes: FareLegQuote[];
  customerUnit: number;
  basePickupFee: number;
  crossCountySurcharge: number;
  mobilitySurcharge: number;
  stopsSurcharge: number;
  countyPickupFee: number;
  snapshot: PricingSnapshot | null;
  policy: FundingSourcePolicy | null;
  methodLabel: string;
  billedMiles: number;
  billingClassId?: string;
  billingClassName?: string;
}

export const DEFAULT_TRANSIT_RULES: TransitRulesConfig = {
  basePickupFee: 0.00,
  crossCountySurcharge: 6.00,
  stopFee: 5.00,
  nightSurcharge: 15.00,
  weekendSurcharge: 10.00,
};

function withSeedFence(
  county: Omit<CountyConfig, 'zipCodes' | 'cities' | 'polygon'>
): CountyConfig {
  const seed = seedFenceLists(county.id, county.name);
  return {
    ...county,
    zipCodes: seed.zipCodes,
    cities: seed.cities,
    polygon: seedFencePolygon(county.id, county.name),
  };
}

export const DEFAULT_COUNTIES: CountyConfig[] = [
  withSeedFence({ id: 'county-chesterfield', name: 'Chesterfield County', state: 'VA', localFare: 10.00, status: 'active', notes: 'Primary coverage area' }),
  withSeedFence({ id: 'county-henrico', name: 'Henrico County', state: 'VA', localFare: 12.00, status: 'active', notes: 'North & East coverage' }),
  withSeedFence({ id: 'county-hanover', name: 'Hanover County', state: 'VA', localFare: 12.00, status: 'active', notes: 'North Richmond zone' }),
  withSeedFence({ id: 'county-richmond', name: 'Richmond City', state: 'VA', localFare: 10.00, status: 'active', notes: 'Metro district' }),
  withSeedFence({ id: 'county-powhatan', name: 'Powhatan County', state: 'VA', localFare: 15.00, status: 'active', notes: 'West rural coverage' }),
  withSeedFence({ id: 'county-goochland', name: 'Goochland County', state: 'VA', localFare: 15.00, status: 'active', notes: 'Northwest zone' }),
];

export const DEFAULT_BILLING_CLASSES: BillingClass[] = [
  { id: 'AMB', name: 'AMB', fee: 0 },
  { id: 'WAV', name: 'WAV', fee: 25 },
  { id: 'STR', name: 'STR', fee: 50 },
];

export const DEFAULT_MOBILITY_TYPES: MobilityConfig[] = [
  { id: 'Ambulatory', name: 'Ambulatory', fee: 0, billingClassId: 'AMB', iconKey: 'User', description: 'Independent rider, no mobility equipment needed', status: 'active' },
  { id: 'Wheelchair', name: 'Wheelchair', fee: 25, billingClassId: 'WAV', iconKey: 'Accessibility', description: 'Requires wheelchair ramp / lift and vehicle space', status: 'active' },
  { id: 'Stretcher', name: 'Stretcher', fee: 50, billingClassId: 'STR', iconKey: 'Bed', description: 'Medical stretcher transport, requires two-person assist', status: 'active' },
  { id: 'Walker', name: 'Walker', fee: 5, billingClassId: 'WAV', iconKey: 'Disc', description: 'Standard folding walker assistance', status: 'active' },
  { id: 'Rollator', name: 'Rollator', fee: 5, billingClassId: 'WAV', iconKey: 'Zap', description: '4-wheel rolling walker with seat', status: 'active' },
  { id: 'Cane', name: 'Cane', fee: 0, billingClassId: 'WAV', iconKey: 'Info', description: 'Single or quad cane walking support', status: 'active' },
];

export const DEFAULT_BRACKETS: PricingBracket[] = [
  { min: 0, max: 5, rate: 10 },
  { min: 5, max: 10, rate: 20 },
  { min: 10, max: 30, rate: 50 },
  { min: 30, max: 50, rate: 70 },
];

const snapshotRates = (p: FundingSourcePolicy): PolicyRateVersion => ({
  effectiveFrom: p.effectiveFrom || '',
  effectiveTo: p.effectiveTo || '',
  pricingMethod: p.pricingMethod,
  flatRate: p.flatRate,
  baseFare: p.baseFare,
  perMileRate: p.perMileRate,
  includedMiles: p.includedMiles,
  includedRate: p.includedRate,
  brackets: (p.brackets || []).map(b => ({ ...b })),
  insideRate: p.insideRate,
  outsideRate: p.outsideRate,
  passengerCopayInside: p.passengerCopayInside,
  passengerCopayOutside: p.passengerCopayOutside,
});

const makePolicy = (
  partial: Partial<FundingSourcePolicy> & Pick<FundingSourcePolicy, 'id' | 'name' | 'type' | 'pricingMethod'>
): FundingSourcePolicy => ({
  active: true,
  flatRate: 45,
  baseFare: 15,
  perMileRate: 2.5,
  includedMiles: 5,
  includedRate: 20,
  brackets: DEFAULT_BRACKETS.map(b => ({ ...b })),
  insideRate: 35,
  outsideRate: 55,
  passengerCopayInside: 10,
  passengerCopayOutside: 16,
  effectiveFrom: '2025-01-01',
  effectiveTo: '',
  reportColumns: [...DEFAULT_REPORT_COLUMNS],
  serviceAreaIds: [],
  geofencePolygons: [],
  geofenceFileName: '',
  billMileage: 'calculated',
  rounding: 'none',
  freeCancelHours: 2,
  lateCancelCharge: 15,
  noShowCharge: 25,
  penaltyAppliesTo: 'both',
  versions: [],
  ...partial,
});

export const DEFAULT_FUNDING_POLICIES: FundingSourcePolicy[] = [
  makePolicy({ id: 'fs-medicaid-va', name: 'Medicaid - VA', type: 'Government', pricingMethod: 'mileage_brackets', passengerCopayInside: 0, passengerCopayOutside: 0 }),
  makePolicy({ id: 'fs-medicare', name: 'Medicare', type: 'Government', pricingMethod: 'included_then_per_mile', includedMiles: 0, includedRate: 20, baseFare: 20, perMileRate: 2.75, passengerCopayInside: 5, passengerCopayOutside: 8 }),
  makePolicy({ id: 'fs-chesterfield', name: 'Chesterfield County', type: 'County', pricingMethod: 'mileage_brackets', passengerCopayInside: 10, passengerCopayOutside: 16, serviceAreaIds: ['county-chesterfield'] }),
  makePolicy({ id: 'fs-henrico', name: 'Henrico County', type: 'County', pricingMethod: 'flat', flatRate: 32, insideRate: 32, outsideRate: 48, passengerCopayInside: 12, passengerCopayOutside: 18, serviceAreaIds: ['county-henrico'] }),
  makePolicy({ id: 'fs-richmond', name: 'Richmond City', type: 'Municipal', pricingMethod: 'flat', flatRate: 40, passengerCopayInside: 10, passengerCopayOutside: 16, serviceAreaIds: ['county-richmond'] }),
  makePolicy({ id: 'fs-hanover', name: 'Hanover County', type: 'County', pricingMethod: 'mileage_brackets', passengerCopayInside: 12, passengerCopayOutside: 18, serviceAreaIds: ['county-hanover'] }),
  makePolicy({ id: 'fs-self-pay', name: 'Self-Pay', type: 'Private', pricingMethod: 'included_then_per_mile', includedMiles: 0, includedRate: 12, baseFare: 12, perMileRate: 3, passengerCopayInside: 0, passengerCopayOutside: 0 }),
  makePolicy({ id: 'fs-insurance', name: 'Insurance', type: 'Private', pricingMethod: 'flat', flatRate: 55, passengerCopayInside: 15, passengerCopayOutside: 20 }),
  makePolicy({ id: 'fs-facility', name: 'Facility Paid', type: 'Facility', pricingMethod: 'flat', flatRate: 50, passengerCopayInside: 0, passengerCopayOutside: 0 }),
  makePolicy({ id: 'fs-dss', name: 'DSS', type: 'Government', pricingMethod: 'included_then_per_mile', includedMiles: 10, includedRate: 25, perMileRate: 2.5, passengerCopayInside: 0, passengerCopayOutside: 0 }),
];

export const DEFAULT_PRICING: PricingConfig = {
  rules: DEFAULT_TRANSIT_RULES,
  counties: DEFAULT_COUNTIES,
  mobilityTypes: DEFAULT_MOBILITY_TYPES,
  billingClasses: DEFAULT_BILLING_CLASSES,
  brackets: DEFAULT_BRACKETS,
  items: [
    { id: 'Ambulatory', label: 'Ambulatory', amount: 0 },
    { id: 'Wheelchair', label: 'Wheelchair', amount: 25 },
    { id: 'Walker', label: 'Walker', amount: 5 },
    { id: 'Rollator', label: 'Rollator', amount: 5 },
    { id: 'Cane', label: 'Cane', amount: 0 },
    { id: 'Stretcher', label: 'Stretcher', amount: 50 },
  ],
  fundingPolicies: DEFAULT_FUNDING_POLICIES,
  customerInside: 10,
  customerOutside: 16,
  pickupFee: 0,
};

const STORAGE_KEY = 'logiss-pricing-v3';
const LEGACY_KEY = 'logiss-pricing-v2';
const listeners = new Set<() => void>();

const normalizePolicy = (p: any, fallbackBrackets: PricingBracket[]): FundingSourcePolicy => {
  const migrated = migrateStoredRates(p);
  return makePolicy({
    id: p.id || `fs-${Date.now()}`,
    name: p.name || 'Untitled Payer',
    type: p.type || 'Other',
    active: p.active !== false,
    pricingMethod: migrated.pricingMethod,
    flatRate: migrated.flatRate,
    baseFare: Number(p.baseFare ?? 15),
    perMileRate: Number(p.perMileRate ?? 2.5),
    includedMiles: migrated.includedMiles,
    includedRate: migrated.includedRate,
    brackets: Array.isArray(p.brackets) && p.brackets.length
      ? p.brackets.map((b: any) => ({ min: Number(b.min), max: Number(b.max), rate: Number(b.rate) }))
      : fallbackBrackets.map(b => ({ ...b })),
    insideRate: Number(p.insideRate ?? 35),
    outsideRate: Number(p.outsideRate ?? 55),
    passengerCopayInside: Number(p.passengerCopayInside ?? 10),
    passengerCopayOutside: Number(p.passengerCopayOutside ?? 16),
    effectiveFrom: p.effectiveFrom || '2025-01-01',
    effectiveTo: p.effectiveTo || '',
    reportColumns: Array.isArray(p.reportColumns) && p.reportColumns.length
      ? p.reportColumns.map((c: string) =>
          c === 'Funding Source Charge' ? 'Payer Charge' : c === 'Funding Source' ? 'Payer' : c
        )
      : [...DEFAULT_REPORT_COLUMNS],
    serviceAreaIds: Array.isArray(p.serviceAreaIds) ? p.serviceAreaIds.map(String) : [],
    geofencePolygons: parsePolygons(p.geofencePolygons ?? p.polygon),
    geofenceFileName: typeof p.geofenceFileName === 'string' ? p.geofenceFileName : '',
    billMileage: p.billMileage === 'actual' ? 'actual' : 'calculated',
    rounding: p.rounding === 'up' ? 'up' : 'none',
    freeCancelHours: Number(p.freeCancelHours ?? 2),
    lateCancelCharge: Number(p.lateCancelCharge ?? 15),
    noShowCharge: Number(p.noShowCharge ?? 25),
    penaltyAppliesTo:
      p.penaltyAppliesTo === 'copay' || p.penaltyAppliesTo === 'funding' || p.penaltyAppliesTo === 'both'
        ? p.penaltyAppliesTo
        : 'both',
    versions: Array.isArray(p.versions)
      ? p.versions.map((v: any) => {
          const vm = migrateStoredRates(v);
          return {
            effectiveFrom: v.effectiveFrom || '',
            effectiveTo: v.effectiveTo || '',
            pricingMethod: vm.pricingMethod,
            flatRate: vm.flatRate,
            baseFare: Number(v.baseFare ?? 15),
            perMileRate: Number(v.perMileRate ?? 2.5),
            includedMiles: vm.includedMiles,
            includedRate: vm.includedRate,
            brackets: Array.isArray(v.brackets) ? v.brackets : fallbackBrackets.map(b => ({ ...b })),
            insideRate: Number(v.insideRate ?? 35),
            outsideRate: Number(v.outsideRate ?? 55),
            passengerCopayInside: Number(v.passengerCopayInside ?? 10),
            passengerCopayOutside: Number(v.passengerCopayOutside ?? 16),
          };
        })
      : [],
  });
};

const load = (): PricingConfig => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const brackets = Array.isArray(parsed.brackets) && parsed.brackets.length
          ? parsed.brackets
          : DEFAULT_BRACKETS;
        const fundingPolicies = Array.isArray(parsed.fundingPolicies) && parsed.fundingPolicies.length
          ? parsed.fundingPolicies.map((p: any) => normalizePolicy(p, brackets))
          : DEFAULT_FUNDING_POLICIES.map(p => ({ ...p, brackets: p.brackets.map(b => ({ ...b })) }));
        return {
          ...DEFAULT_PRICING,
          ...parsed,
          rules: { ...DEFAULT_TRANSIT_RULES, ...(parsed.rules || {}) },
          counties: Array.isArray(parsed.counties) && parsed.counties.length
            ? parsed.counties.map((c: any) => {
                const id = c.id || `county-${Date.now()}`;
                const name = c.name || '';
                const seed = seedFenceLists(id, name);
                const zipCodes = Array.isArray(c.zipCodes) && c.zipCodes.filter(Boolean).length
                  ? c.zipCodes.map((z: unknown) => String(z).trim()).filter(Boolean)
                  : [...seed.zipCodes];
                const cities = Array.isArray(c.cities) && c.cities.filter(Boolean).length
                  ? c.cities.map((city: unknown) => String(city).trim()).filter(Boolean)
                  : [...seed.cities];
                const polygon = Array.isArray(c.polygon)
                  ? parsePolygon(c.polygon)
                  : seedFencePolygon(id, name);
                return {
                  id,
                  name,
                  state: c.state || 'VA',
                  localFare: c.localFare != null ? Number(c.localFare) : (Number(c.insideRate) || 10),
                  status: c.status || 'active',
                  notes: c.notes || '',
                  zipCodes,
                  cities,
                  polygon,
                };
              })
            : DEFAULT_COUNTIES,
          mobilityTypes: Array.isArray(parsed.mobilityTypes) && parsed.mobilityTypes.length
            ? parsed.mobilityTypes.map((m: any) => ({
                ...m,
                billingClassId: m.billingClassId || guessBillingClassId(m.id || m.name),
              }))
            : DEFAULT_MOBILITY_TYPES,
          billingClasses: Array.isArray(parsed.billingClasses) && parsed.billingClasses.length
            ? parsed.billingClasses
            : DEFAULT_BILLING_CLASSES,
          brackets,
          items: Array.isArray(parsed.items) && parsed.items.length ? parsed.items : DEFAULT_PRICING.items,
          fundingPolicies,
        };
      }
    }
  } catch { /* seed */ }
  return {
    ...DEFAULT_PRICING,
    rules: { ...DEFAULT_TRANSIT_RULES },
    brackets: DEFAULT_BRACKETS.map(b => ({ ...b })),
    items: DEFAULT_PRICING.items.map(i => ({ ...i })),
    counties: DEFAULT_COUNTIES.map(c => ({
      ...c,
      zipCodes: [...c.zipCodes],
      cities: [...c.cities],
      polygon: c.polygon.map(([lat, lng]) => [lat, lng] as [number, number]),
    })),
    mobilityTypes: DEFAULT_MOBILITY_TYPES.map(m => ({ ...m })),
    billingClasses: DEFAULT_BILLING_CLASSES.map(c => ({ ...c })),
    fundingPolicies: DEFAULT_FUNDING_POLICIES.map(p => ({
      ...p,
      brackets: p.brackets.map(b => ({ ...b })),
      reportColumns: [...p.reportColumns],
      serviceAreaIds: [...(p.serviceAreaIds || [])],
      geofencePolygons: parsePolygons(p.geofencePolygons),
      geofenceFileName: p.geofenceFileName || '',
    })),
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

export function findFundingPolicy(
  fundingSourceIdOrName?: string,
  config?: PricingConfig
): FundingSourcePolicy | null {
  const cfg = config || pricingStore.get();
  const policies = cfg.fundingPolicies || [];
  if (!fundingSourceIdOrName) {
    return policies.find(p => p.active) || policies[0] || null;
  }
  const q = fundingSourceIdOrName.toLowerCase();
  return (
    policies.find(p => p.id === fundingSourceIdOrName) ||
    policies.find(p => p.name.toLowerCase() === q) ||
    policies.find(p => p.name.toLowerCase().includes(q)) ||
    null
  );
}

function guessBillingClassId(name = ''): string {
  const n = name.toLowerCase();
  if (n.includes('stretch')) return 'STR';
  if (n.includes('ambul')) return 'AMB';
  return 'WAV';
}

function dateOnly(iso?: string): string {
  if (!iso) return '';
  return String(iso).slice(0, 10);
}

function inDateRange(day: string, from?: string, to?: string): boolean {
  if (!day) return true;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function resolvePolicyAt(policy: FundingSourcePolicy, tripDate?: string): FundingSourcePolicy {
  const day = dateOnly(tripDate);
  if (!day) return policy;
  const match = (policy.versions || []).find(v => inDateRange(day, v.effectiveFrom, v.effectiveTo));
  if (match) {
    return { ...policy, ...match, versions: policy.versions };
  }
  if (inDateRange(day, policy.effectiveFrom, policy.effectiveTo)) return policy;
  const past = [...(policy.versions || [])]
    .filter(v => v.effectiveFrom && v.effectiveFrom <= day)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  return past ? { ...policy, ...past, versions: policy.versions } : policy;
}

function ratesChanged(prev: FundingSourcePolicy, next: FundingSourcePolicy): boolean {
  return (
    prev.pricingMethod !== next.pricingMethod ||
    prev.flatRate !== next.flatRate ||
    prev.baseFare !== next.baseFare ||
    prev.perMileRate !== next.perMileRate ||
    prev.includedMiles !== next.includedMiles ||
    prev.includedRate !== next.includedRate ||
    prev.insideRate !== next.insideRate ||
    prev.outsideRate !== next.outsideRate ||
    prev.passengerCopayInside !== next.passengerCopayInside ||
    prev.passengerCopayOutside !== next.passengerCopayOutside ||
    JSON.stringify(prev.brackets) !== JSON.stringify(next.brackets)
  );
}

function archiveVersionOnRateChange(prev: FundingSourcePolicy, next: FundingSourcePolicy): FundingSourcePolicy {
  if (!ratesChanged(prev, next)) return next;
  const newFrom = next.effectiveFrom || dateOnly(new Date().toISOString());
  const oldFrom = prev.effectiveFrom || '';
  if (oldFrom && newFrom && newFrom !== oldFrom) {
    const closed: PolicyRateVersion = {
      ...snapshotRates(prev),
      effectiveTo: prev.effectiveTo || newFrom,
    };
    return {
      ...next,
      versions: [...(prev.versions || []).filter(v => v.effectiveFrom !== closed.effectiveFrom), closed],
    };
  }
  return next;
}

function resolveBillableMiles(
  policy: FundingSourcePolicy | null,
  input: { miles?: number; calculatedMiles?: number; actualMiles?: number }
): { billed: number; calculated: number; actual: number } {
  const calculated = Number(input.calculatedMiles ?? input.miles) || 0;
  const actual = Number(input.actualMiles ?? input.miles) || 0;
  let raw = policy?.billMileage === 'actual' ? (actual || calculated) : (calculated || actual);
  if (policy?.rounding === 'up' && raw > 0) raw = Math.ceil(raw);
  return { billed: Number(raw.toFixed(2)), calculated, actual };
}

function resolveBillingClass(
  mobility: string | undefined,
  cfg: PricingConfig
): { id?: string; name?: string; fee: number } {
  const types = cfg.mobilityTypes || [];
  const matched = types.find(
    m =>
      m.name.toLowerCase() === (mobility || '').toLowerCase() ||
      m.id.toLowerCase() === (mobility || '').toLowerCase()
  );
  const classId = matched?.billingClassId || guessBillingClassId(matched?.name || mobility);
  const klass = (cfg.billingClasses || DEFAULT_BILLING_CLASSES).find(c => c.id === classId);
  const typeFee =
    matched != null
      ? Number(matched.fee)
      : Number(cfg.items?.find(i => i.id === mobility || i.label === mobility)?.amount) || 0;
  return { id: classId, name: klass?.name || classId, fee: typeFee };
}

function bracketRateFor(miles: number, brackets: PricingBracket[]): number {
  if (!brackets.length) return 0;
  const match = brackets.find(b => miles >= Number(b.min) && miles <= Number(b.max));
  const last = brackets[brackets.length - 1];
  if (match) return Number(match.rate);
  if (last && miles > Number(last.max)) return Number(last.rate);
  return Number(brackets[0]?.rate) || 0;
}

function chargeForMethod(
  policy: FundingSourcePolicy,
  miles: number,
  insideCounty: boolean,
  addOns: number
): number {
  let base = 0;
  const raw = policy.pricingMethod as string;
  // Un-normalized localStorage / snapshot payloads
  if (raw === 'base_per_mile' || raw === 'per_mile') {
    base = (Number(policy.baseFare) || 0) + miles * (Number(policy.perMileRate) || 0);
  } else {
    switch (normalizePricingMethod(raw)) {
      case 'flat':
        base = Number(policy.flatRate) || 0;
        break;
      case 'geofence':
        base = insideCounty ? (Number(policy.insideRate) || 0) : (Number(policy.outsideRate) || 0);
        break;
      case 'included_then_per_mile': {
        const included = Number(policy.includedMiles) || 0;
        const includedRate = Number(policy.includedRate) || 0;
        const extra = Math.max(0, miles - included);
        base = includedRate + extra * (Number(policy.perMileRate) || 0);
        break;
      }
      case 'mileage_brackets':
      default:
        base = bracketRateFor(miles, policy.brackets?.length ? policy.brackets : DEFAULT_BRACKETS);
        break;
    }
  }
  return Number((base + addOns).toFixed(2));
}

export function usePricing() {
  const pricing = useSyncExternalStore(pricingStore.subscribe, pricingStore.get, pricingStore.get);
  const setPricing = (next: PricingConfig | ((prev: PricingConfig) => PricingConfig)) =>
    pricingStore.set(typeof next === 'function' ? next(pricingStore.get()) : next);

  const updateRules = (updates: Partial<TransitRulesConfig>) => {
    setPricing(prev => ({
      ...prev,
      rules: { ...(prev.rules || DEFAULT_TRANSIT_RULES), ...updates },
    }));
  };

  const addCounty = (county: Omit<CountyConfig, 'id'>) => {
    const newCounty: CountyConfig = {
      ...county,
      id: `county-${Date.now()}`,
      zipCodes: [...(county.zipCodes || [])],
      cities: [...(county.cities || [])],
      polygon: parsePolygon(county.polygon),
    };
    setPricing(prev => ({ ...prev, counties: [...(prev.counties || []), newCounty] }));
    return newCounty;
  };

  const updateCounty = (id: string, updates: Partial<CountyConfig>) => {
    setPricing(prev => ({
      ...prev,
      counties: (prev.counties || []).map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteCounty = (id: string) => {
    setPricing(prev => ({
      ...prev,
      counties: (prev.counties || []).filter(c => c.id !== id),
    }));
  };

  const addBillingClass = (cls: Omit<BillingClass, 'id'> & { id?: string }) => {
    const item: BillingClass = {
      id: cls.id || cls.name.trim().replace(/\s+/g, '_').toUpperCase(),
      name: cls.name,
      fee: Number(cls.fee) || 0,
    };
    setPricing(prev => ({
      ...prev,
      billingClasses: [...(prev.billingClasses || []), item],
    }));
    return item;
  };

  const updateBillingClass = (id: string, updates: Partial<BillingClass>) => {
    setPricing(prev => ({
      ...prev,
      billingClasses: (prev.billingClasses || []).map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteBillingClass = (id: string) => {
    setPricing(prev => ({
      ...prev,
      billingClasses: (prev.billingClasses || []).filter(c => c.id !== id),
    }));
  };

  const addMobility = (mob: Omit<MobilityConfig, 'id'>) => {
    const newMob: MobilityConfig = {
      ...mob,
      billingClassId: mob.billingClassId || guessBillingClassId(mob.name),
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
      mobilityTypes: (prev.mobilityTypes || []).map(m => (m.id === id ? { ...m, ...updates } : m)),
      items: (prev.items || []).map(i =>
        i.id === id
          ? { ...i, label: updates.name || i.label, amount: updates.fee != null ? updates.fee : i.amount }
          : i
      ),
    }));
  };

  const deleteMobility = (id: string) => {
    setPricing(prev => ({
      ...prev,
      mobilityTypes: (prev.mobilityTypes || []).filter(m => m.id !== id),
      items: (prev.items || []).filter(i => i.id !== id),
    }));
  };

  const addFundingPolicy = (partial?: Partial<FundingSourcePolicy>) => {
    const policy = normalizePolicy(
      {
        id: `fs-${Date.now()}`,
        name: 'New Payer',
        type: 'Government',
        pricingMethod: 'included_then_per_mile',
        ...partial,
      },
      pricingStore.get().brackets || DEFAULT_BRACKETS
    );
    setPricing(prev => ({
      ...prev,
      fundingPolicies: [...(prev.fundingPolicies || []), policy],
    }));
    return policy;
  };

  const updateFundingPolicy = (id: string, updates: Partial<FundingSourcePolicy>) => {
    setPricing(prev => ({
      ...prev,
      fundingPolicies: (prev.fundingPolicies || []).map(p => {
        if (p.id !== id) return p;
        const next = normalizePolicy({ ...p, ...updates }, prev.brackets || DEFAULT_BRACKETS);
        return archiveVersionOnRateChange(p, next);
      }),
    }));
  };

  const deleteFundingPolicy = (id: string) => {
    setPricing(prev => ({
      ...prev,
      fundingPolicies: (prev.fundingPolicies || []).filter(p => p.id !== id),
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
    addBillingClass,
    updateBillingClass,
    deleteBillingClass,
    addFundingPolicy,
    updateFundingPolicy,
    deleteFundingPolicy,
  };
}

/** Inside if pickup AND dropoff are in the payer GeoJSON fence. No fence: named Areas / ZIP; empty Areas = all seeded (chips not required). */
export function inferInsideCounty(
  pickup = '',
  dropoff = '',
  homeCounty = '',
  serviceAreaIds?: string[],
  payerPolygons?: [number, number][][]
): boolean {
  if (!pickup.trim() || !dropoff.trim()) return true;
  const cfg = pricingStore.get();
  const evaluation = evaluateTripBoundary(pickup, dropoff, homeCounty, cfg.counties, serviceAreaIds, {
    pickupGps: geocodeCached(pickup),
    dropoffGps: geocodeCached(dropoff),
    payerPolygons,
  });
  return evaluation.isInsideCounty;
}

export { evaluateTripBoundary, detectCountyFromAddress, resolvePayerAreaIds };

export function quoteFares(
  input: {
    county?: string;
    insideCounty?: boolean;
    tripType?: string;
    miles?: number;
    calculatedMiles?: number;
    actualMiles?: number;
    mobility?: string;
    stops?: string[];
    fundingSourceId?: string;
    fundingSource?: string;
    tripDate?: string;
    pickup?: string;
    dropoff?: string;
  } = {},
  config?: PricingConfig
): FareQuote {
  const cfg = config || pricingStore.get();
  const rules = cfg.rules || DEFAULT_TRANSIT_RULES;
  const roundTrip = input.tripType === 'round-trip' || input.tripType === 'round_trip';
  const legCount = roundTrip ? 2 : 1;

  const found = findFundingPolicy(input.fundingSourceId || input.fundingSource, cfg);
  const policy = found ? resolvePolicyAt(found, input.tripDate) : null;

  const milesInfo = resolveBillableMiles(policy, input);
  const miles = milesInfo.billed;

  const insideCounty =
    input.insideCounty === true || input.insideCounty === false
      ? input.insideCounty
      : input.pickup && input.dropoff
        ? inferInsideCounty(
            input.pickup,
            input.dropoff,
            input.county,
            policy?.serviceAreaIds,
            policy?.geofencePolygons
          )
        : true;

  // Passenger copay from policy (preferred) or county local fare fallback
  let customerUnit: number;
  if (policy) {
    customerUnit = insideCounty
      ? Number(policy.passengerCopayInside)
      : Number(policy.passengerCopayOutside);
  } else {
    const matchedCounty = input.county
      ? cfg.counties?.find(
          c =>
            c.name.toLowerCase() === input.county?.toLowerCase() ||
            c.id === input.county ||
            c.name.toLowerCase().includes(input.county?.toLowerCase() || '')
        )
      : null;
    const localBaseFare =
      matchedCounty?.localFare != null
        ? Number(matchedCounty.localFare)
        : Number(cfg.customerInside) || 0;
    const crossCountySurcharge = Number(rules.crossCountySurcharge || 0);
    customerUnit = insideCounty ? localBaseFare : localBaseFare + crossCountySurcharge;
  }

  const billing = resolveBillingClass(input.mobility, cfg);
  const mobilitySurcharge = billing.fee;
  const stopsSurcharge =
    (input.stops?.filter(s => s && s.trim().length > 0).length || 0) * Number(rules.stopFee || 0);
  const addOns = mobilitySurcharge + stopsSurcharge;

  // Per-leg funding charge (each leg billed separately for round-trip)
  const perLegCharge = policy
    ? chargeForMethod(policy, miles, insideCounty, addOns)
    : Number(
        (
          bracketRateFor(miles, cfg.brackets?.length ? cfg.brackets : DEFAULT_BRACKETS) + addOns
        ).toFixed(2)
      );

  const perLegCopay = Number(customerUnit.toFixed(2));

  const legQuotes: FareLegQuote[] = Array.from({ length: legCount }, (_, i) => ({
    legIndex: (i + 1) as 1 | 2,
    label: i === 0 ? (legCount > 1 ? 'Leg 1 · Outbound' : 'One-way') : 'Leg 2 · Return',
    miles,
    passengerCopay: perLegCopay,
    fundingSourceCharge: perLegCharge,
  }));

  const passengerCopay = Number((perLegCopay * legCount).toFixed(2));
  const fundingSourceCharge = Number((perLegCharge * legCount).toFixed(2));

  const method = policy ? normalizePricingMethod(policy.pricingMethod) : 'mileage_brackets';
  const snapshot: PricingSnapshot | null = policy
    ? {
        fundingSourceId: policy.id,
        fundingSourceName: policy.name,
        pricingMethod: method,
        methodLabel: PRICING_METHOD_LABELS[method],
        flatRate: policy.flatRate,
        baseFare: policy.baseFare,
        perMileRate: policy.perMileRate,
        includedMiles: policy.includedMiles,
        includedRate: policy.includedRate,
        brackets: policy.brackets?.map(b => ({ ...b })),
        insideRate: policy.insideRate,
        outsideRate: policy.outsideRate,
        passengerCopayInside: policy.passengerCopayInside,
        passengerCopayOutside: policy.passengerCopayOutside,
        effectiveFrom: policy.effectiveFrom,
        effectiveTo: policy.effectiveTo,
        quotedAt: new Date().toISOString(),
        insideCounty,
        miles,
        calculatedMiles: milesInfo.calculated,
        actualMiles: milesInfo.actual,
        billingClassId: billing.id,
        billingClassName: billing.name,
        mobilityFee: mobilitySurcharge,
        pickupFee: 0,
        stopsFee: stopsSurcharge,
      }
    : null;

  return {
    copay: passengerCopay,
    cost: fundingSourceCharge,
    costToCounty: fundingSourceCharge,
    passengerCopay,
    fundingSourceCharge,
    legs: legCount,
    legQuotes,
    customerUnit: perLegCopay,
    basePickupFee: 0,
    crossCountySurcharge: Number(rules.crossCountySurcharge || 0),
    mobilitySurcharge,
    stopsSurcharge,
    countyPickupFee: 0,
    snapshot,
    policy,
    methodLabel: policy ? PRICING_METHOD_LABELS[normalizePricingMethod(policy.pricingMethod)] : 'Mileage Brackets',
    billedMiles: miles,
    billingClassId: billing.id,
    billingClassName: billing.name,
  };
}

export function quotePenalty(
  input: {
    kind: 'late_cancel' | 'no_show';
    fundingSourceId?: string;
    fundingSource?: string;
    hoursBeforePickup?: number;
    tripDate?: string;
  },
  config?: PricingConfig
): {
  waived: boolean;
  passengerCopay: number;
  fundingSourceCharge: number;
  amount: number;
  reason: string;
  policy: FundingSourcePolicy | null;
} {
  const cfg = config || pricingStore.get();
  const found = findFundingPolicy(input.fundingSourceId || input.fundingSource, cfg);
  const policy = found ? resolvePolicyAt(found, input.tripDate) : null;
  if (!policy) {
    return {
      waived: true,
      passengerCopay: 0,
      fundingSourceCharge: 0,
      amount: 0,
      reason: 'No payer policy',
      policy: null,
    };
  }

  if (input.kind === 'late_cancel') {
    const hours = Number(input.hoursBeforePickup);
    if (Number.isFinite(hours) && hours >= Number(policy.freeCancelHours)) {
      return {
        waived: true,
        passengerCopay: 0,
        fundingSourceCharge: 0,
        amount: 0,
        reason: `Cancelled ${hours}h before pickup (free window ${policy.freeCancelHours}h)`,
        policy,
      };
    }
  }

  const amount = input.kind === 'no_show' ? Number(policy.noShowCharge) || 0 : Number(policy.lateCancelCharge) || 0;
  const apply = policy.penaltyAppliesTo || 'both';
  const passengerCopay = apply === 'funding' ? 0 : amount;
  const fundingSourceCharge = apply === 'copay' ? 0 : amount;

  return {
    waived: amount === 0,
    passengerCopay,
    fundingSourceCharge,
    amount,
    reason: input.kind === 'no_show' ? 'No-show charge' : 'Late cancellation charge',
    policy,
  };
}
