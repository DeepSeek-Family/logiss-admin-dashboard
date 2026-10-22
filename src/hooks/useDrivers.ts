import { useMemo, useState } from 'react';
import { useGetDriversQuery } from '@/redux/api/driversApi';
import { mapApiDriver } from '@/features/drivers/utils/helpers';

export type Driver = ReturnType<typeof mapApiDriver>;

export const useDrivers = (initialFilters: { status?: string } = {}) => {
  const [filters] = useState(initialFilters);
  const { data, isLoading, isError, refetch } = useGetDriversQuery(
    { page: 1, limit: 200 },
    { refetchOnMountOrArgChange: true },
  );

  const drivers = useMemo(() => {
    const list = (data?.data ?? []).map(mapApiDriver);
    if (!filters.status || filters.status === 'all') return list;
    return list.filter((d) => d.status === filters.status);
  }, [data, filters.status]);

  return {
    drivers,
    loading: isLoading,
    error: isError ? 'Failed to load drivers' : null,
    setFilters: () => {},
    refresh: refetch,
    addDriver: async () => {
      throw new Error('Use Drivers page / API to add drivers');
    },
    updateDriverStatus: async () => {
      throw new Error('Use Drivers page / API to update driver status');
    },
  };
};
