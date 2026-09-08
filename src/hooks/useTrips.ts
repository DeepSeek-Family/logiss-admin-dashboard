import { useState, useEffect, useCallback } from 'react';
import { Trip, tripService } from '../services/tripService';
import { quoteFares } from './usePricing';

export const useTrips = (initialFilters: { status?: string } = {}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tripService.getTrips(filters);
      setTrips(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const updateTrip = useCallback(async (id: string, patch: Partial<Trip>) => {
    // Inside/outside dropdown is the only fare trigger here — booking/details
    // already send cost/copay themselves. Keeps list edits in sync with rates.
    let nextPatch = patch;
    if ('insideCounty' in patch && !('cost' in patch) && !('copay' in patch)) {
      const current = trips.find(t => t.id === id);
      if (current) {
        const merged = { ...current, ...patch };
        const miles = merged.miles ?? (parseFloat(String(merged.distance || '').replace(/[^\d.]/g, '')) || 0);
        const quoted = quoteFares({
          insideCounty: merged.insideCounty,
          tripType: merged.type,
          miles,
          calculatedMiles: merged.calculatedMiles ?? miles,
          actualMiles: merged.actualMiles,
          mobility: merged.mobility,
          stops: merged.stops,
          fundingSourceId: merged.fundingSourceId,
          fundingSource: merged.fundingSource,
          tripDate: merged.scheduledTime,
          pickup: merged.pickup,
          dropoff: merged.dropoff,
        });
        nextPatch = {
          ...patch,
          ...quoted,
          miles: quoted.billedMiles,
          billingClassId: quoted.billingClassId,
          billingClassName: quoted.billingClassName,
        };
      }
    }
    setTrips(prev => prev.map(t => (t.id === id ? { ...t, ...nextPatch } : t)));
    try {
      await tripService.updateTrip(id, nextPatch);
    } catch (err: any) {
      setError(err.message);
      fetchTrips();
    }
  }, [fetchTrips, trips]);

  return { trips, loading, error, setFilters, refresh: fetchTrips, updateTrip };
};
