import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, Download, Map as MapIcon, Printer } from 'lucide-react';
import { Card, Button, ConfirmationModal } from '@/shared/components/ui';
import { useTrips } from '@/hooks/useTrips';
import { useDrivers } from '@/hooks/useDrivers';
import { useFleet } from '@/hooks/useFleet';
import { toast } from 'react-hot-toast';
import {
  useGetAllTripHistoryQuery,
  useExportTripHistoryExcelMutation,
  useUpdateBookingMutation,
  useScheduleBookingQuery,
  useGetScheduleOnboardingQuery,
  type IGetBookingsQueryParams,
} from '@/redux/api/bookingApi';
import { useGetDriversQuery } from '@/redux/api/driversApi';
import { mapApiDriver } from '@/features/drivers/utils/helpers';
import { mapApiBooking, mapPatchToApiPayload, apiErrorMessage } from '@/features/bookings/utils/helpers';

import { StatusUpdateModal, TripDetailsModal, TripArchiveTab, ScheduleTab, TripHistoryMap, ServiceDateFilter } from '@/features/tripHistory';
import { env } from '@/config/env';

const formatYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TripHistory = ({ role }: { role?: string | null }) => {
  const [scheduleQueryParams, setScheduleQueryParams] = useState<{
    serviceDate?: string;
    bookingStatus?: string;
  }>({
    serviceDate: formatYmd(new Date()),
  });

  const handleScheduleFilterChange = useCallback((params: { serviceDate?: string; bookingStatus?: string }) => {
    setScheduleQueryParams((prev) => {
      if (prev.serviceDate === params.serviceDate && prev.bookingStatus === params.bookingStatus) {
        return prev;
      }
      return params;
    });
  }, []);

  const [historySearch, setHistorySearch] = useState('');
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [payerFilter, setPayerFilter] = useState('all');
  const [serviceDate, setServiceDate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHistorySearch(historySearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [historySearch]);

  const historyQueryParams = useMemo(() => {
    const params: IGetBookingsQueryParams = {};
    if (debouncedHistorySearch) params.searchTerm = debouncedHistorySearch;
    if (serviceDate) params.serviceDate = serviceDate;
    if (driverFilter !== 'all') params.driverId = driverFilter;
    if (payerFilter !== 'all') params.payerSource = payerFilter;
    return params;
  }, [debouncedHistorySearch, serviceDate, driverFilter, payerFilter]);

  const { data: historyResponse, isLoading: historyLoading, isFetching: historyFetching, refetch: refetchHistory } = useGetAllTripHistoryQuery(historyQueryParams, {
    refetchOnMountOrArgChange: true,
  });
  const { data: scheduleResponse, isLoading: scheduleLoading } = useScheduleBookingQuery(scheduleQueryParams, {
    refetchOnMountOrArgChange: true,
  });
  const { data: onboardingResponse } = useGetScheduleOnboardingQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: apiDriversResponse } = useGetDriversQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [updateBookingMutation] = useUpdateBookingMutation();
  const [exportTripHistoryExcel, { isLoading: isExporting }] = useExportTripHistoryExcelMutation();

  const handleExportExcel = async () => {
    try {
      await exportTripHistoryExcel(historyQueryParams).unwrap();
      toast.success('Trip history exported');
    } catch (e: any) {
      toast.error(apiErrorMessage(e, 'Failed to export trip history'));
    }
  };
  const { trips: fallbackTrips, loading: tripsLoading, updateTrip: fallbackUpdateTrip } = useTrips();
  const { drivers: fallbackDrivers, loading: driversLoading } = useDrivers();
  const { vehicles, loading: fleetLoading } = useFleet();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'primary' | 'urgent' | 'accent' | 'warning';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = (params: {
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'primary' | 'urgent' | 'accent' | 'warning';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: params.title,
      message: params.message,
      confirmText: params.confirmText || 'Confirm',
      variant: params.variant || 'primary',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await params.onConfirm();
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const fetchedApiDrivers = useMemo(
    () => (apiDriversResponse?.data || []).map(mapApiDriver),
    [apiDriversResponse]
  );

  const drivers = useMemo(() => {
    const list = [...(apiDriversResponse?.data ? fetchedApiDrivers : fallbackDrivers)];
    const driverMap = new Map<string, any>();

    list.forEach((d) => {
      if (d?.id || d?._id) {
        driverMap.set(String(d.id || d._id), d);
      }
    });

    const bookings = [...(scheduleResponse?.data || []), ...(historyResponse?.data || [])];
    bookings.forEach((b: any) => {
      if (typeof b.driverId === 'object' && b.driverId?._id) {
        const id = String(b.driverId._id);
        if (!driverMap.has(id)) {
          const dName = [b.driverId.firstName, b.driverId.lastName].filter(Boolean).join(' ') || 'Driver';
          const initials = `${b.driverId.firstName?.[0] || ''}${b.driverId.lastName?.[0] || ''}`.toUpperCase() || 'D';
          driverMap.set(id, {
            id,
            _id: id,
            name: dName,
            initials,
            onDuty: true,
            status: 'available',
            profile: b.driverId.profile,
            vehicle: { plate: 'VA-4KL-8392', type: 'Ambulatory Van' },
          });
        }
      }
    });

    return Array.from(driverMap.values());
  }, [apiDriversResponse, fetchedApiDrivers, fallbackDrivers, scheduleResponse, historyResponse]);

  const apiTrips = useMemo(
    () => (historyResponse?.data || []).map(mapApiBooking),
    [historyResponse]
  );

  const apiScheduleTrips = useMemo(
    () => (scheduleResponse?.data || []).map(mapApiBooking),
    [scheduleResponse]
  );

  const trips = historyResponse?.data ? apiTrips : (env.useMock ? fallbackTrips : []);
  const scheduleTrips = scheduleResponse?.data ? apiScheduleTrips : (env.useMock ? trips : []);
  const loading = (historyLoading || tripsLoading) && trips.length === 0;

  const handleUpdateTrip = async (id: string, patch: Record<string, any>, skipConfirm?: boolean) => {
    const existingTrip = (trips || []).find((t: any) => String(t.id) === String(id) || String(t._id) === String(id));
    const driverObj = existingTrip?.driverId as any;
    const existingDriverId = driverObj
      ? (typeof driverObj === 'object' ? driverObj._id || driverObj.id : String(driverObj))
      : '';
    const patchDriverId = patch.driverId !== undefined ? String(patch.driverId || '') : undefined;
    const isDriverAssign = patchDriverId !== undefined && patchDriverId !== String(existingDriverId || '');

    const existingStatus = existingTrip?.status || existingTrip?.rawStatus || '';
    const patchStatus = patch.status || patch.bookingStatus || patch.isApproved;
    const isStatusUpdate = patchStatus !== undefined && String(patchStatus) !== String(existingStatus);

    const executeUpdate = async () => {
      const payload = mapPatchToApiPayload(patch);
      try {
        await updateBookingMutation({ id, payload }).unwrap();
        toast.success('Trip updated successfully');
        refetchHistory();
      } catch (e: any) {
        toast.error(apiErrorMessage(e, 'Failed to update trip'));
        fallbackUpdateTrip(id, patch);
      }
    };

    if (skipConfirm || (!isDriverAssign && !isStatusUpdate)) {
      await executeUpdate();
      return;
    }

    if (isDriverAssign) {
      const driver = (drivers || []).find(d => String(d.id) === String(patch.driverId));
      const driverName = driver?.name || (patch.driverId ? 'Selected Driver' : 'Unassigned');
      openConfirm({
        title: 'Confirm Driver Assignment',
        message: patch.driverId
          ? `Are you sure you want to assign driver "${driverName}" to Trip #${id}?`
          : `Are you sure you want to unassign driver from Trip #${id}?`,
        confirmText: 'Assign Driver',
        variant: 'primary',
        onConfirm: executeUpdate,
      });
      return;
    }

    if (isStatusUpdate) {
      const statusVal = patch.status || patch.bookingStatus || patch.isApproved;
      const isUrgent = ['cancelled', 'rejected', 'no_show'].includes(String(statusVal).toLowerCase());
      openConfirm({
        title: 'Confirm Status Change',
        message: `Are you sure you want to change status of Trip #${id} to "${statusVal}"?`,
        confirmText: 'Update Status',
        variant: isUrgent ? 'urgent' : 'warning',
        onConfirm: executeUpdate,
      });
      return;
    }
  };

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeTab = location.pathname.includes('/schedule') ? 'schedule' : (searchParams.get('tab') || 'trips');

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [mapTripId, setMapTripId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<any>(null);

  const selectedTrip = selectedTripId ? (trips || []).find((t: any) => t?.id === selectedTripId) : null;

  if (loading && (trips.length === 0 || drivers.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading trip records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {editingCell && (
        <StatusUpdateModal
          item={editingCell.item}
          date={editingCell.date}
          onClose={() => setEditingCell(null)}
        />
      )}

      {selectedTrip && (
        <TripDetailsModal
          key={selectedTrip.id}
          trip={selectedTrip}
          drivers={drivers}
          onClose={() => setSelectedTripId(null)}
          onUpdate={handleUpdateTrip}
        />
      )}

      {/* Header: title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {activeTab === 'trips' ? (
          <div>
            <h1 className="type-page-title">Trip History</h1>
            <p className="text-sm text-ink-4 mt-0.5">Archived and active records for LOGISS fleet</p>
          </div>
        ) : (
          <div>
            <h1 className="type-page-title">Scheduled</h1>
            <p className="text-sm text-ink-4 mt-0.5">Plan the day — driver assignments, timelines, and conflicts</p>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Date moves up here only when the map is shown (filter bar gets narrow) */}
            {showMap && <ServiceDateFilter value={serviceDate} onChange={setServiceDate} />}

            <button
              onClick={() => setShowMap(v => !v)}
              title={showMap ? 'Hide trip map' : 'Show trip map'}
              className={`inline-flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold border transition-all ${
                showMap ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-ink-3 border-line hover:text-ink hover:bg-bg'
              }`}
            >
              <MapIcon size={15} />
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
            <Button
              variant="outline"
              size="sm"
              icon={isExporting ? Loader2 : Download}
              onClick={handleExportExcel}
              disabled={isExporting}
              className={`shadow-sm border-line text-ink-3 hover:text-ink hover:bg-bg transition-all h-9 ${isExporting ? '[&_svg]:animate-spin opacity-70 cursor-wait' : ''}`}
            >
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>
      
          </div>
        )}
      </div>

      {/* ────────────────── TRIP HISTORY TAB VIEW ────────────────── */}
      {activeTab === 'trips' && (
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          <div className="flex-1 min-w-0 w-full">
            <TripArchiveTab
              trips={trips}
              drivers={drivers}
              setSelectedTripId={setSelectedTripId}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              updateTrip={handleUpdateTrip}
              onRowSelect={setMapTripId}
              selectedMapId={mapTripId}
              search={historySearch}
              setSearch={setHistorySearch}
              driverFilter={driverFilter}
              setDriverFilter={setDriverFilter}
              payerFilter={payerFilter}
              setPayerFilter={setPayerFilter}
              serviceDate={serviceDate}
              setServiceDate={setServiceDate}
              isFetching={historyFetching}
              inlineDateFilter={!showMap}
            />
          </div>
          {showMap && (
            <TripHistoryMap
              trips={trips}
              drivers={drivers}
              selectedId={mapTripId}
              onSelect={setMapTripId}
              onOpenDetails={setSelectedTripId}
              onClose={() => setShowMap(false)}
            />
          )}
        </div>
      )}

      {/* ────────────────── DAILY SCHEDULE TAB VIEW ────────────────── */}
      {activeTab === 'schedule' && (
        <ScheduleTab
          drivers={drivers}
          trips={scheduleTrips}
          onTripClick={setSelectedTripId}
          updateTrip={handleUpdateTrip}
          onboardingData={onboardingResponse?.data}
          isLoading={scheduleLoading}
          onFilterChange={handleScheduleFilterChange}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default TripHistory;
