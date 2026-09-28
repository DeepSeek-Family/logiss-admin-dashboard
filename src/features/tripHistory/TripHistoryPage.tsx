import { useMemo, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, Download, Map as MapIcon, Calendar, Printer } from 'lucide-react';
import { Card, Button, ConfirmationModal } from '@/shared/components/ui';
import { useTrips } from '@/hooks/useTrips';
import { useDrivers } from '@/hooks/useDrivers';
import { useFleet } from '@/hooks/useFleet';
import { toast } from 'react-hot-toast';
import { useGetAllTripHistoryQuery, useUpdateBookingMutation } from '@/redux/api/bookingApi';
import { mapApiBooking, mapPatchToApiPayload, apiErrorMessage } from '@/features/bookings/utils/helpers';

import { StatusUpdateModal, TripDetailsModal, TripArchiveTab, ScheduleTab, TripHistoryMap } from '@/features/tripHistory';

const TripHistory = ({ role }: { role?: string | null }) => {
  const { data: historyResponse, isLoading: historyLoading, refetch: refetchHistory } = useGetAllTripHistoryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateBookingMutation] = useUpdateBookingMutation();
  const { trips: fallbackTrips, loading: tripsLoading, updateTrip: fallbackUpdateTrip } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();
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

  const apiTrips = useMemo(
    () => (historyResponse?.data || []).map(mapApiBooking),
    [historyResponse]
  );

  const trips = historyResponse?.data ? apiTrips : fallbackTrips;
  const loading = (historyLoading || tripsLoading) && trips.length === 0;

  const handleUpdateTrip = async (id: string, patch: Record<string, any>, skipConfirm?: boolean) => {
    const isDriverAssign = 'driverId' in patch;
    const isStatusUpdate = 'status' in patch || 'bookingStatus' in patch || 'isApproved' in patch;

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
  // Time & Sort live here so they can render in the page header (beside the actions).
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
            {/* Time + Sort move up here only when the map is shown (filter bar gets narrow) */}
            {showMap && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-ink-4 whitespace-nowrap">Time</span>
                  <div className="relative flex items-center">
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="bg-white border border-line rounded-xl py-2 pl-3 pr-9 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer h-9 appearance-none"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <button type="button" onClick={() => setTimeFilter('custom')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-primary" title="Custom range"><Calendar size={14} /></button>
                  </div>
                </div>

                {timeFilter === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onClick={(e) => { try { e.currentTarget.showPicker(); } catch { /* noop */ } }} className="bg-white border border-line rounded-xl py-2 px-2.5 text-xs font-medium text-ink outline-none h-9 cursor-pointer" title="Start date" />
                    <span className="text-xs text-ink-4">to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onClick={(e) => { try { e.currentTarget.showPicker(); } catch { /* noop */ } }} className="bg-white border border-line rounded-xl py-2 px-2.5 text-xs font-medium text-ink outline-none h-9 cursor-pointer" title="End date" />
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-ink-4 whitespace-nowrap">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer h-9 appearance-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rider">Rider Name (A-Z)</option>
                    <option value="day">Scheduled Day</option>
                    <option value="hour">Scheduled Hour</option>
                    <option value="month">Scheduled Month</option>
                    <option value="year">Scheduled Year</option>
                  </select>
                </div>
              </>
            )}

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
              icon={Download}
              onClick={() => window.dispatchEvent(new CustomEvent('export-trips-csv'))}
              className="shadow-sm border-line text-ink-3 hover:text-ink hover:bg-bg transition-all h-9"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
              className="shadow-sm border-line text-ink-3 hover:text-ink hover:bg-bg transition-all h-9"
            >
              Print
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
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              inlineTimeSort={!showMap}
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
          trips={trips}
          onTripClick={setSelectedTripId}
          updateTrip={handleUpdateTrip}
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
