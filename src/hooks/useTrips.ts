import { useState, useEffect, useCallback } from 'react';
import { Trip, tripService } from '../services/tripService';

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
    // Optimistic update so inline edits feel instant.
    setTrips(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await tripService.updateTrip(id, patch);
    } catch (err: any) {
      setError(err.message);
      fetchTrips(); // Roll back to source of truth on failure.
    }
  }, [fetchTrips]);

  return { trips, loading, error, setFilters, refresh: fetchTrips, updateTrip };
};
