import { useCallback, useMemo, useState } from "react";
import { useGetAllBookingsQuery, useUpdateBookingMutation } from "@/redux/api/bookingApi";
import { mapApiBooking, mapPatchToApiPayload } from "@/features/bookings/utils/helpers";

export type Trip = ReturnType<typeof mapApiBooking>;

export const useTrips = (initialFilters: { status?: string } = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const { data, isLoading, isError, refetch } = useGetAllBookingsQuery(
    { page: 1, limit: 500 },
    { refetchOnMountOrArgChange: true },
  );
  const [updateBookingMutation] = useUpdateBookingMutation();

  const allTrips = useMemo(() => (data?.data ?? []).map(mapApiBooking), [data]);

  const trips = useMemo(() => {
    if (!filters.status || filters.status === "all") return allTrips;
    return allTrips.filter((t) => t.status === filters.status);
  }, [allTrips, filters.status]);

  const updateTrip = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const body = mapPatchToApiPayload(patch);
      await updateBookingMutation({ id, payload: body }).unwrap();
      refetch();
    },
    [updateBookingMutation, refetch],
  );

  return {
    trips,
    loading: isLoading,
    error: isError ? "Failed to load trips" : null,
    setFilters,
    refresh: refetch,
    updateTrip,
  };
};
