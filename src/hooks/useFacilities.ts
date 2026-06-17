import { useSyncExternalStore } from 'react';
import { FACILITY_PROGRAMS } from '@/data/mockData';

export interface Facility {
  id: number;
  name: string;
  type: string;
  active: boolean;
}

// Shared, app-wide facilities/programs registry. Edits in the CMS Facilities panel
// flow live to every consumer (Facility-User assignment dropdown, booking program
// selection) and survive reloads via localStorage — a single source of truth without
// a backend.
const STORAGE_KEY = 'logiss-facilities';
const listeners = new Set<() => void>();

const seed = (): Facility[] => FACILITY_PROGRAMS.map(f => ({ ...f }));

const load = (): Facility[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  return seed();
};

let store: Facility[] = load();

const persist = () => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
};

export const facilitiesStore = {
  get: () => store,
  set: (next: Facility[]) => { store = next; persist(); listeners.forEach(l => l()); },
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
};

/** Reactive access to the shared facilities registry. */
export function useFacilities() {
  const facilities = useSyncExternalStore(facilitiesStore.subscribe, facilitiesStore.get, facilitiesStore.get);
  const setFacilities = (next: Facility[] | ((prev: Facility[]) => Facility[])) =>
    facilitiesStore.set(typeof next === 'function' ? next(facilitiesStore.get()) : next);
  return {
    facilities,
    activeFacilityNames: facilities.filter(f => f.active).map(f => f.name),
    setFacilities,
  };
}
