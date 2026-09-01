import { useState, useEffect, useCallback } from 'react';
import { Trip, tripService } from '../services/tripService';
import { quoteFares } from './usePricing';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { updateTrip as updateTripAction, setTrips as setTripsAction } from '@/redux/slice/tripsSlice';

export const useTrips = (initialFilters: { status?: string } = {}) => {
  const dispatch = useAppDispatch();
  const reduxTrips = useAppSelector((state) => state.trips.items);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tripService.getTrips(filters);
      dispatch(setTripsAction(data));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, dispatch]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const trips = filters.status && filters.status !== 'all'
    ? reduxTrips.filter(t => t.status === filters.status)
    : reduxTrips;

  const updateTrip = useCallback(async (id: string, patch: Partial<Trip>) => {
    let nextPatch = patch;
    if ('insideCounty' in patch && !('cost' in patch) && !('copay' in patch)) {
      const current = reduxTrips.find(t => t.id === id);
      if (current) {
        const merged = { ...current, ...patch };
        const miles = merged.miles ?? (parseFloat(String(merged.distance || '').replace(/[^\d.]/g, '')) || 0);
        nextPatch = { ...patch, ...quoteFares({ insideCounty: merged.insideCounty, tripType: merged.type, miles, mobility: merged.mobility, stops: merged.stops }) };
      }
    }
    dispatch(updateTripAction({ id, patch: nextPatch }));
    try {
      await tripService.updateTrip(id, nextPatch);
    } catch (err: any) {
      setError(err.message);
      fetchTrips();
    }
  }, [fetchTrips, reduxTrips, dispatch]);

  return { trips, loading, error, setFilters, refresh: fetchTrips, updateTrip };
};

