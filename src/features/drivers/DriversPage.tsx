import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import {
  useCreateDriverMutation,
  useGetDriversQuery,
  useGetDriverTripHistoryQuery,
  type IDriverUser,
} from '@/redux/api/driversApi';
import { useToggleUserBannedMutation } from '@/redux/api/userApi';
import { mapApiDriver } from '@/features/drivers/utils/helpers';
import { apiErrorMessage, mapApiBooking } from '@/features/bookings/utils/helpers';
import toast from 'react-hot-toast';
import { useFleet } from '@/hooks/useFleet';

import {
  AddDriverModal,
  DriverProfile,
  DriversTable
} from '@/features/drivers';

const HISTORY_LIMIT = 10;

const Drivers = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('searchTerm') || '');
  const selectedDriverId = searchParams.get('driverId');
  const [historyPage, setHistoryPage] = useState(1);
  const setSelectedDriverId = (driverId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (driverId) next.set('driverId', driverId);
      else next.delete('driverId');
      return next;
    });
    setHistoryPage(1);
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [vehicleAssignLoading, setVehicleAssignLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [assignedVehicles, setAssignedVehicles] = useState<Record<string, any>>({});
  const { vehicles: fleetVehicles, loading: fleetLoading, handleAssign } = useFleet();

  const listParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    ...(search.trim() ? { searchTerm: search.trim() } : {}),
  }), [currentPage, itemsPerPage, search]);

  const { data: driversResponse, isLoading, isError, error, refetch } = useGetDriversQuery(listParams, {
    refetchOnMountOrArgChange: true,
  });
  const { data: historyResponse, isFetching: historyLoading } = useGetDriverTripHistoryQuery(
    { id: selectedDriverId || '', page: historyPage, limit: HISTORY_LIMIT },
    { skip: !selectedDriverId, refetchOnMountOrArgChange: true },
  );
  const driverTrips = useMemo(
    () => (historyResponse?.data || []).map(mapApiBooking),
    [historyResponse],
  );
  const historyPagination = historyResponse?.pagination;
  const [createDriver, { isLoading: isCreatingDriver }] = useCreateDriverMutation();
  const [toggleUserBanned, { isLoading: isBanToggling }] = useToggleUserBannedMutation();

  const drivers = useMemo(
    () => (driversResponse?.data || []).map(mapApiDriver),
    [driversResponse],
  );

  const pagination = driversResponse?.pagination;

  const assignableVehicles = useMemo(
    () =>
      fleetVehicles.map((v) => ({
        id: String(v.id),
        name: [v.make, v.model].filter(Boolean).join(' ').trim() || 'Vehicle',
        type: v.type || 'Van',
        plate: v.plate || '—',
      })),
    [fleetVehicles]
  );

  if (isLoading && drivers.length === 0) {
    return (
      <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-48 h-8 bg-line-2 rounded-xl animate-pulse"></div>
            <div className="w-64 h-4 bg-line-2 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="h-[400px] bg-bg rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={48} className="text-urgent mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-ink mb-2">Failed to load drivers</h3>
        <p className="text-ink-3 text-sm mb-4">{apiErrorMessage(error, 'Unable to fetch drivers')}</p>
        <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  // `searchTerm` is applied server-side.
  const totalItems = pagination?.total ?? drivers.length;
  const totalPages = pagination?.totalPage || Math.ceil(totalItems / itemsPerPage) || 1;

  // When opened from a URL, the driver may not be on the current list page; fall back to the
  // driver embedded in their trip history (`driverId`).
  const historyDriver = historyResponse?.data?.[0]?.driverId;
  const selectedDriver = selectedDriverId
    ? drivers.find((d: any) => d.id === selectedDriverId) ||
      (historyDriver && typeof historyDriver === 'object' && (historyDriver as IDriverUser)._id === selectedDriverId
        ? mapApiDriver(historyDriver as IDriverUser)
        : null)
    : null;

  const assignedVehicleForSelected = useMemo(() => {
    if (!selectedDriver?.id) return null;
    if (assignedVehicles[selectedDriver.id]) return assignedVehicles[selectedDriver.id];
    const match = fleetVehicles.find(
      (v) => String(v.assignedDriverId || v.driverId) === String(selectedDriver.id),
    );
    if (!match) return null;
    return {
      id: String(match.id),
      name: [match.make, match.model].filter(Boolean).join(' ').trim() || 'Vehicle',
      type: match.type || 'Van',
      plate: match.plate || '—',
    };
  }, [selectedDriver?.id, assignedVehicles, fleetVehicles]);

  if (selectedDriverId && !selectedDriver && historyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-sm text-ink-4">Loading driver...</p>
      </div>
    );
  }

  const handleToggleDriverBan = async () => {
    if (!selectedDriver?.id) return;
    try {
      const res = await toggleUserBanned(selectedDriver.id).unwrap();
      const nextBanned = res.data?.isBanned ?? !selectedDriver.isBanned;
      toast.success(
        res.message || (nextBanned ? 'Driver banned' : 'Driver unbanned'),
      );
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update ban status'));
    }
  };

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: any } = {
      available: { variant: 'accent', label: 'Available' },
      in_trip: { variant: 'solid_accent', label: 'In Trip' },
      break: { variant: 'warning', label: 'On Break' },
      off_duty: { variant: 'neutral', label: 'Off Duty' },
      banned: { variant: 'urgent', label: 'Banned' },
    };
    const { variant, label } = config[status] || { variant: 'neutral', label: status };
    return <Badge variant={variant} className="w-fit">{label}</Badge>;
  };

  const handleAssignVehicleToDriver = async (vehicleId: string) => {
    if (!selectedDriver?.id) return;
    const vehicle = assignableVehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;
    setVehicleAssignLoading(true);
    try {
      await handleAssign(vehicleId, selectedDriver.id);
      setAssignedVehicles((prev) => ({ ...prev, [selectedDriver.id]: vehicle }));
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to assign vehicle'));
      throw err;
    } finally {
      setVehicleAssignLoading(false);
    }
  };

  if (selectedDriver) {
    return (
      <>
        <DriverProfile
          selectedDriver={selectedDriver}
          setSelectedDriverId={setSelectedDriverId}
          role={role}
          trips={driverTrips}
          tripsLoading={historyLoading}
          tripsTotal={historyPagination?.total ?? driverTrips.length}
          tripsPage={historyPage}
          tripsTotalPages={historyPagination?.totalPage || 1}
          tripsPerPage={HISTORY_LIMIT}
          onTripsPageChange={setHistoryPage}
          onViewFleet={() => navigate('/fleet')}
          assignedVehicle={assignedVehicleForSelected}
          assignableVehicles={assignableVehicles}
          fleetLoading={fleetLoading}
          onAssignVehicleConfirm={handleAssignVehicleToDriver}
          vehicleAssignLoading={vehicleAssignLoading}
          onToggleBan={() => void handleToggleDriverBan()}
          banToggleLoading={isBanToggling}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {showAddModal && (
        <AddDriverModal
          saving={isCreatingDriver}
          onClose={() => setShowAddModal(false)}
          onSave={async (payload) => {
            try {
              await createDriver(payload).unwrap();
              toast.success('Driver account created');
              setShowAddModal(false);
              refetch();
            } catch (err) {
              toast.error(apiErrorMessage(err, 'Failed to create driver'));
              throw err;
            }
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title">Driver Network</h1>
          <p className="text-sm font-medium text-ink-3 mt-1">Manage driver accounts and compliance</p>
        </div>
        {role === 'admin' && (
          <Button variant="primary" icon={UserPlus} onClick={() => setShowAddModal(true)}>Create Driver Account</Button>
        )}
      </div>

      <DriversTable
        search={search}
        setSearch={setSearch}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        paginatedDrivers={drivers}
        filteredCount={totalItems}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onDriverClick={setSelectedDriverId}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default Drivers;
