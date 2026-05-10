import { useState, useEffect, useCallback } from 'react';
import { Driver, driverService } from '../services/driverService';

export const useDrivers = (initialFilters: { status?: string } = {}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await driverService.getDrivers(filters);
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const addDriver = async (driverData: Partial<Driver>) => {
    try {
      setError(null);
      const newDriver = await driverService.createDriver(driverData);
      setDrivers((prev: Driver[]) => [newDriver, ...prev]);
      return newDriver;
    } catch (err: any) {
      setError(err.message || 'Failed to add driver');
      throw err;
    }
  };

  const updateDriverStatus = async (id: string, status: string) => {
    try {
      setError(null);
      const updated = await driverService.updateDriver(id, { status });
      setDrivers((prev: Driver[]) => prev.map((d: Driver) => d.id === id ? updated : d));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update driver');
      throw err;
    }
  };

  return {
    drivers,
    loading,
    error,
    addDriver,
    updateDriverStatus,
    setFilters,
    refresh: fetchDrivers
  };
};
