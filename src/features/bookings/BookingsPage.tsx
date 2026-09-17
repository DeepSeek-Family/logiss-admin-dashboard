import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Clock, MapPin, Phone, ChevronRight,
  CheckCircle2, User, Users, CalendarClock,
  AlertOctagon, Navigation, Repeat, MoveRight, ArrowRight,
  Check, Trash2, XCircle, Plus, Loader2, Edit2, ExternalLink, List, Map as MapIcon
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge, Pagination } from '@/shared/components/ui';
import { ManualTripModal } from '@/components/ManualTripModal';
import { tripService } from '@/services/tripService';
import { quoteFares, quotePenalty, findFundingPolicy } from '@/hooks/usePricing';
import { useDrivers } from '@/hooks/useDrivers';
import { formatTime, formatDateTime, formatShortDate, tripTypeLabel, money } from '@/utils/helpers';
import { CancelTripModal } from '@/features/reports';
import { toast } from 'react-hot-toast';
import { BookingDetailsSidebar, BookingsList, hasTimeConflict, isVehicleMatch } from '@/features/bookings';
import { mapApiBooking } from '@/features/bookings/utils/helpers';
import { TripHistoryMap, TripDetailsModal } from '@/features/tripHistory';
import { useGetAllBookingsQuery } from '@/redux/api/bookingApi';

const Bookings = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [fundingFilter, setFundingFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const listParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    ...(bookingSearch.trim() ? { search: bookingSearch.trim() } : {}),
  }), [currentPage, itemsPerPage, bookingSearch]);

  const { data: apiResponse, isLoading: apiLoading, isError, refetch: refetchApiBookings } = useGetAllBookingsQuery(listParams, {
    refetchOnMountOrArgChange: true,
  });
  const [showMap, setShowMap] = useState(false);
  const [mapTripId, setMapTripId] = useState<string | null>(null);
  const [editTripId, setEditTripId] = useState<string | null>(null);

  const { drivers } = useDrivers();

  const refresh = () => {
    refetchApiBookings();
  };

  const bookingsList = useMemo(
    () => (apiResponse?.data || []).map(mapApiBooking),
    [apiResponse]
  );

  const pagination = apiResponse?.pagination;
  const pendingCount = bookingsList.filter((t: any) => {
    const status = String(t?.status || t?.rawStatus || '').toLowerCase();
    return status === 'pending_review' || status === 'pending';
  }).length;
  const confirmedCount = bookingsList.filter((t: any) => {
    const status = String(t?.status || t?.rawStatus || '').toLowerCase();
    return status === 'confirmed' || status === 'assigned';
  }).length;

  const editTrip = editTripId ? bookingsList.find((t: any) => t?.id === editTripId) : null;
  const loading = apiLoading;

  const mergedDrivers = useMemo(() => {
    const extra = bookingsList
      .filter((b: any) => b.driverId && b.driverName)
      .map((b: any) => ({
        id: b.driverId,
        name: b.driverName,
        initials: (b.driverName || '').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase(),
        onDuty: true,
        vehicle: { type: 'Van', plate: '' },
      }));
    const merged = [...(drivers || [])];
    extra.forEach((d: any) => {
      if (!merged.some((x: any) => String(x.id) === String(d.id))) merged.push(d);
    });
    return merged;
  }, [drivers, bookingsList]);

  const filteredTrips = bookingsList.filter((t: any) => {
    const status = (t?.status || '').toLowerCase();
    const matchesTab = activeTab === 'pending'
      ? (status === 'pending_review' || status === 'pending')
      : activeTab === 'confirmed'
        ? (status === 'confirmed' || status === 'assigned')
        : status === activeTab;

    const search = bookingSearch.toLowerCase().trim();
    const matchesSearch = !search ||
      (t?.rider?.name || '').toLowerCase().includes(search) ||
      (t?.id || '').toLowerCase().includes(search) ||
      (t?.mobility || '').toLowerCase().includes(search) ||
      (t?.passengerId || '').toLowerCase().includes(search) ||
      (t?.authorizationId || t?.authId || '').toLowerCase().includes(search) ||
      (t?.source || t?.fundingSource || '').toLowerCase().includes(search) ||
      (t?.pickup || '').toLowerCase().includes(search) ||
      (t?.dropoff || '').toLowerCase().includes(search);

    const matchesFunding = fundingFilter === 'all' || (t?.fundingSource || t?.paymentMethod || '') === fundingFilter;
    const matchesCounty = countyFilter === 'all' || (t?.source || t?.county || '') === countyFilter;

    return matchesTab && matchesSearch && matchesFunding && matchesCounty;
  });

  const totalPages = pagination?.totalPage || Math.ceil(filteredTrips.length / itemsPerPage) || 1;
  const paginatedBookings = filteredTrips;

  const handleBulkAction = async (action: string) => {
    if (selectedTrips.length === 0) return;

    if (action === 'approve') {
      try {
        await Promise.all(selectedTrips.map(id => tripService.updateTripStatus(id, 'confirmed')));
        toast.success(`${selectedTrips.length} bookings approved successfully`);
        setSelectedTrips([]);
        refresh();
      } catch (e) {
        toast.error('Failed to approve bookings');
      }
    } else if (action === 'dispatch') {
      const tripsToDispatch = selectedTrips.filter(id => {
        const t = bookingsList.find((trip: any) => trip.id === id);
        return t && t.driverId;
      });
      if (tripsToDispatch.length === 0) {
        toast.error('No selected trips have a driver assigned.');
        return;
      }
      try {
        await Promise.all(tripsToDispatch.map(id => tripService.updateTripStatus(id, 'en_route')));
        toast.success(`${tripsToDispatch.length} trips dispatched to Live Trips`);
        setSelectedTrips([]);
        refresh();
      } catch (e) {
        toast.error('Failed to dispatch trips');
      }
    } else if (action === 'cancel') {
      setShowBulkCancelModal(true);
    }
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedBookings.map((t: any) => t.id);
    const allSelected = pageIds.every((id: string) => selectedTrips.includes(id));
    if (allSelected) {
      setSelectedTrips(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedTrips(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleSelectTrip = (id: string) => {
    setSelectedTrips(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleAssign = async (driverId: string) => {
    if (!selectedBookingId) return;
    try {
      await tripService.assignDriver(selectedBookingId, driverId);
      await tripService.updateTripStatus(selectedBookingId, 'confirmed');
      toast.success('Driver assigned — ready to dispatch');
      setIsAssigning(false);
      refresh();
    } catch (e) {
      toast.error('Failed to assign driver');
    }
  };

  const openBooking = (id: string) => {
    setSelectedBookingId(id);
    setIsAssigning(false);
  };

  const closeBooking = () => {
    setSelectedBookingId(null);
    setIsAssigning(false);
  };

  const handleDispatch = async (id?: any) => {
    const targetId = typeof id === 'string' ? id : selectedBookingId;
    if (!targetId) return;
    const targetTrip = bookingsList.find((t: any) => t.id === targetId);
    if (!targetTrip?.driverId) {
      toast.error('Cannot dispatch: No driver assigned');
      return;
    }
    try {
      await tripService.updateTripStatus(targetId, 'en_route');
      toast.success('Trip dispatched to Live Trips');
      if (targetId === selectedBookingId) closeBooking();
      refresh();
    } catch (e) {
      toast.error('Failed to dispatch trip');
    }
  };

  const handleReject = () => {
    setShowCancelModal(true);
  };

  const handleApprove = async (id?: any) => {
    const targetId = typeof id === 'string' ? id : selectedBookingId;
    if (!targetId) return;
    try {
      await tripService.updateTripStatus(targetId, 'confirmed');
      toast.success('Booking approved — moved to Ready to Assign');
      refresh();
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve booking');
    }
  };

  const hoursUntilPickup = (iso?: string) => {
    if (!iso) return undefined;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return undefined;
    return (t - Date.now()) / 36e5;
  };

  const applyCancelToTrip = (trip: any, reason: string) => {
    const isNoShow = /no.?show/i.test(reason);
    const penalty = quotePenalty({
      kind: isNoShow ? 'no_show' : 'late_cancel',
      fundingSourceId: trip?.fundingSourceId,
      fundingSource: trip?.fundingSource,
      hoursBeforePickup: hoursUntilPickup(trip?.scheduledTime),
      tripDate: trip?.scheduledTime,
    });
    return {
      status: isNoShow ? 'no_show' : 'cancelled',
      cancelReason: reason,
      passengerCopay: penalty.passengerCopay,
      copay: penalty.passengerCopay,
      fundingSourceCharge: penalty.fundingSourceCharge,
      costToCounty: penalty.fundingSourceCharge,
      cost: penalty.fundingSourceCharge,
    };
  };

  const selectedBooking = selectedBookingId ? bookingsList.find((t: any) => t?.id === selectedBookingId) : null;
  const selectedCancelPolicy = selectedBooking
    ? findFundingPolicy(selectedBooking.fundingSourceId || selectedBooking.fundingSource || undefined)
    : null;
  const assignedDriver = selectedBooking?.driverId ? mergedDrivers.find((d: any) => d.id === selectedBooking.driverId) : null;

  const driverQuery = driverSearch.toLowerCase().trim();
  const smartDrivers = (mergedDrivers || [])
    .filter((d: any) => {
      if (driverQuery) {
        return (d?.name || '').toLowerCase().includes(driverQuery) || (d?.id || '').toLowerCase().includes(driverQuery);
      }
      return d?.onDuty && isVehicleMatch(d, selectedBooking);
    })
    .map((driver: any) => {
      const activeTrips = bookingsList.filter((t: any) =>
        t?.driverId === driver?.id &&
        ['assigned', 'confirmed', 'in_trip', 'en_route'].includes(t?.status) &&
        t?.id !== selectedBookingId
      );
      const hasConflict = activeTrips.some((t: any) => hasTimeConflict(t, selectedBooking?.scheduledTime || null));
      return { ...driver, hasConflict };
    });

  if (loading && bookingsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (isError && bookingsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium text-ink">Could not load bookings</p>
          <p className="text-xs text-ink-4">Check your connection and try again.</p>
          <Button variant="primary" onClick={() => refetchApiBookings()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      {showManualModal && (
        <ManualTripModal
          trips={bookingsList}
          onClose={() => setShowManualModal(false)}
          onSave={(newTrip) => {
            toast.success('Manual booking created');
            setShowManualModal(false);
            refresh();
          }}
        />
      )}

      {showBulkCancelModal && (
        <CancelTripModal
          onClose={() => setShowBulkCancelModal(false)}
          freeCancelHours={selectedCancelPolicy?.freeCancelHours}
          lateCancelCharge={selectedCancelPolicy?.lateCancelCharge}
          noShowCharge={selectedCancelPolicy?.noShowCharge}
          onConfirm={async (reason) => {
            try {
              toast.success(`${selectedTrips.length} bookings cancelled`);
              setSelectedTrips([]);
              setShowBulkCancelModal(false);
              refresh();
            } catch (e) {
              toast.error('Failed to cancel bookings');
            }
          }}
        />
      )}

      {showCancelModal && (
        <CancelTripModal
          onClose={() => setShowCancelModal(false)}
          freeCancelHours={selectedCancelPolicy?.freeCancelHours}
          lateCancelCharge={selectedCancelPolicy?.lateCancelCharge}
          noShowCharge={selectedCancelPolicy?.noShowCharge}
          onConfirm={async (reason) => {
            if (selectedBookingId && selectedBooking) {
              try {
                toast.success('Booking declined');
                closeBooking();
                refresh();
              } catch (e) {
                toast.error('Failed to decline booking');
              }
            }
            setShowCancelModal(false);
          }}
        />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="type-page-title">Booking Requests</h1>
          <p className="text-sm text-ink-4 mt-0.5">Review, dispatch &amp; manage rides — with live map</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMap(v => !v)}
            title={showMap ? 'Hide map' : 'Show map'}
            className={`inline-flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold border transition-all ${showMap ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-ink-3 border-line hover:text-ink hover:bg-bg'}`}
          >
            <MapIcon size={15} />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/create-booking')}>Manual Entry</Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 w-full">
          <BookingsList
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            bookingSearch={bookingSearch}
            setBookingSearch={setBookingSearch}
            fundingFilter={fundingFilter}
            setFundingFilter={(v: string) => { setFundingFilter(v); setCurrentPage(1); }}
            countyFilter={countyFilter}
            setCountyFilter={(v: string) => { setCountyFilter(v); setCurrentPage(1); }}
            pendingCount={pendingCount}
            confirmedCount={confirmedCount}
            filteredTrips={filteredTrips}
            paginatedBookings={paginatedBookings}
            selectedTrips={selectedTrips}
            toggleSelectAll={toggleSelectAll}
            toggleSelectTrip={toggleSelectTrip}
            openBooking={openBooking}
            selectedBookingId={selectedBookingId}
            handleApprove={handleApprove}
            setIsAssigning={setIsAssigning}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
            trips={bookingsList}
            drivers={mergedDrivers}
            totalItems={pagination?.total ?? filteredTrips.length}
            setSelectedTrips={setSelectedTrips}
            handleBulkAction={handleBulkAction}
            updateTrip={() => { refetchApiBookings(); }}
            onEditTrip={(id) => setEditTripId(id)}
            onRowSelect={(id) => { setMapTripId(id); setShowMap(true); }}
            selectedMapId={mapTripId}
          />
        </div>
        {showMap && (
          <TripHistoryMap
            trips={filteredTrips}
            drivers={mergedDrivers}
            selectedId={mapTripId}
            onSelect={setMapTripId}
            onOpenDetails={(id) => setEditTripId(id)}
            onClose={() => setShowMap(false)}
            plotAll
            title="Dispatch Map"
          />
        )}
      </div>

      {selectedBooking && (
        <BookingDetailsSidebar
          selectedBooking={selectedBooking}
          assignedDriver={assignedDriver}
          smartDrivers={smartDrivers}
          activeTab={activeTab}
          closeBooking={closeBooking}
          handleAssign={handleAssign}
          handleReject={handleReject}
          handleApprove={() => handleApprove(selectedBookingId)}
          handleDispatch={() => handleDispatch(selectedBookingId)}
          driverSearch={driverSearch}
          setDriverSearch={setDriverSearch}
          onEditDetails={(id) => setEditTripId(id)}
        />
      )}

      {editTrip && (
        <TripDetailsModal
          key={editTrip.id}
          trip={editTrip}
          drivers={mergedDrivers}
          onClose={() => setEditTripId(null)}
          startInEdit
        />
      )}
    </div>
  );
};

export default Bookings;
