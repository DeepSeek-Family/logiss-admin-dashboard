import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, AlertTriangle, Car, X, Check, Loader2 } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import {
  useCreateDriverMutation,
  useGetDriversQuery,
  useGetDriverTripHistoryQuery,
  type IDriverUser,
} from '@/redux/api/driversApi';
import { mapApiDriver } from '@/features/drivers/utils/helpers';
import { apiErrorMessage, mapApiBooking } from '@/features/bookings/utils/helpers';
import toast from 'react-hot-toast';

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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [assignedVehicles, setAssignedVehicles] = useState<Record<string, any>>({});

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

  const drivers = useMemo(
    () => (driversResponse?.data || []).map(mapApiDriver),
    [driversResponse],
  );

  const pagination = driversResponse?.pagination;

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

  if (selectedDriverId && !selectedDriver && historyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={28} className="text-primary animate-spin" />
        <p className="text-sm text-ink-4">Loading driver...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: any } = {
      available: { variant: 'accent', label: 'Available' },
      in_trip: { variant: 'solid_accent', label: 'In Trip' },
      break: { variant: 'warning', label: 'On Break' },
      off_duty: { variant: 'neutral', label: 'Off Duty' },
    };
    const { variant, label } = config[status] || { variant: 'neutral', label: status };
    return <Badge variant={variant} className="w-fit">{label}</Badge>;
  };

  const mockVehicles = [
    { id: 'V001', name: 'Ford Transit', type: 'Ambulatory Van', plate: 'VA-4KL-8392' },
    { id: 'V002', name: 'Toyota Sienna', type: 'Wheelchair Van', plate: 'VA-2MX-5510' },
    { id: 'V003', name: 'Honda Odyssey', type: 'Standard', plate: 'VA-9TQ-1147' },
  ];

  if (selectedDriver) {
    return (
      <>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-line-2 shadow-xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Car size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-ink">Assign Vehicle</h3>
                </div>
                <button onClick={() => { setShowAssignModal(false); setSelectedVehicleId(null); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 hover:bg-bg transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-ink-4 mb-4">Select a vehicle to assign to <span className="font-semibold text-ink">{selectedDriver.name}</span></p>
              <div className="space-y-2 mb-5">
                {mockVehicles.map(v => (
                  <button key={v.id} onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedVehicleId === v.id
                        ? 'border-primary bg-primary/5'
                        : 'border-line-2 hover:border-primary/30 hover:bg-bg'
                    }`}>
                    <div className="w-8 h-8 rounded-lg bg-bg border border-line-2 flex items-center justify-center shrink-0">
                      <Car size={14} className="text-ink-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{v.name}</p>
                      <p className="text-xs text-ink-4">{v.type} · {v.plate}</p>
                    </div>
                    {selectedVehicleId === v.id && <Check size={15} className="text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 text-sm"
                  onClick={() => { setShowAssignModal(false); setSelectedVehicleId(null); }}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1 h-9 text-sm"
                  onClick={() => {
                    const vehicle = mockVehicles.find(v => v.id === selectedVehicleId);
                    if (vehicle && selectedDriver) {
                      setAssignedVehicles(prev => ({ ...prev, [selectedDriver.id]: vehicle }));
                    }
                    setShowAssignModal(false);
                    setAssignSuccess(true);
                    setTimeout(() => setAssignSuccess(false), 3000);
                  }}
                  disabled={!selectedVehicleId}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {assignSuccess && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <Check size={15} /> Vehicle assigned successfully
          </div>
        )}

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
          onAssignVehicle={() => { setShowAssignModal(true); setSelectedVehicleId(null); }}
          onViewFleet={() => navigate('/fleet')}
          assignedVehicle={assignedVehicles[selectedDriver.id] || null}
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
