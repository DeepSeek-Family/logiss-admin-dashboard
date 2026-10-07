import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Clock, MapPin, Phone, ChevronRight,
  CheckCircle2, User, Users, CalendarClock,
  AlertOctagon, Navigation, Repeat, MoveRight, ArrowRight,
  Check, Trash2, XCircle, Plus, Loader2, Edit2, ExternalLink, List, Map as MapIcon
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge, Pagination, ConfirmationModal } from '@/shared/components/ui';
import { ManualTripModal } from '@/components/ManualTripModal';
import { quoteFares, quotePenalty, findFundingPolicy } from '@/hooks/usePricing';
import { useDrivers } from '@/hooks/useDrivers';
import { formatTime, formatDateTime, formatShortDate, tripTypeLabel, money } from '@/utils/helpers';
import { CancelTripModal } from '@/features/reports';
import { toast } from 'react-hot-toast';
import { BookingDetailsSidebar, BookingsList, hasTimeConflict, isVehicleMatch } from '@/features/bookings';
import { mapApiBooking, mapPatchToApiPayload, apiErrorMessage } from '@/features/bookings/utils/helpers';
import { TripHistoryMap, TripDetailsModal } from '@/features/tripHistory';
import { useGetAllBookingsQuery, useGetAllAssignedBookingsQuery, useUpdateBookingMutation } from '@/redux/api/bookingApi';
import { useGetDriversQuery } from '@/redux/api/driversApi';
import { mapApiDriver } from '@/features/drivers/utils/helpers';

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
  const [debouncedBookingSearch, setDebouncedBookingSearch] = useState('');
  const [fundingFilter, setFundingFilter] = useState('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBookingSearch(bookingSearch.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [bookingSearch]);

  const listParams = useMemo(() => {
    const params: Record<string, any> = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (debouncedBookingSearch) {
      params.searchTerm = debouncedBookingSearch;
    }
    if (fundingFilter && fundingFilter !== 'all') {
      params.payerSource = fundingFilter;
    }
    return params;
  }, [currentPage, itemsPerPage, debouncedBookingSearch, fundingFilter]);

  const { data: pendingResponse, isLoading: pendingLoading, isError: pendingError, refetch: refetchPendingBookings } = useGetAllBookingsQuery(listParams, {
    refetchOnMountOrArgChange: true,
  });

  const { data: assignedResponse, isLoading: assignedLoading, isError: assignedError, refetch: refetchAssignedBookings } = useGetAllAssignedBookingsQuery(listParams, {
    refetchOnMountOrArgChange: true,
  });

  const [updateBookingMutation] = useUpdateBookingMutation();
  const [showMap, setShowMap] = useState(false);
  const [mapTripId, setMapTripId] = useState<string | null>(null);
  const [editTripId, setEditTripId] = useState<string | null>(null);

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

  const { data: apiDriversResponse, refetch: refetchDrivers } = useGetDriversQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const apiDrivers = useMemo(
    () => (apiDriversResponse?.data || []).map(mapApiDriver),
    [apiDriversResponse]
  );

  const { drivers } = useDrivers();

  const refresh = () => {
    refetchPendingBookings();
    refetchAssignedBookings();
    refetchDrivers();
  };

  const handleUpdateBooking = async (id: string, patch: Record<string, any>, skipConfirm?: boolean) => {
    const existingTrip = bookingsList.find((t: any) => String(t.id) === String(id) || String(t._id) === String(id));
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
        toast.success('Booking updated successfully');
        refresh();
      } catch (e: any) {
        toast.error(apiErrorMessage(e, 'Failed to update booking'));
      }
    };

    if (skipConfirm || (!isDriverAssign && !isStatusUpdate)) {
      await executeUpdate();
      return;
    }

    if (isDriverAssign) {
      const driver = mergedDrivers.find(d => String(d.id) === String(patch.driverId));
      const driverName = driver?.name || (patch.driverId ? 'Selected Driver' : 'Unassigned');
      openConfirm({
        title: 'Confirm Driver Assignment',
        message: patch.driverId
          ? `Are you sure you want to assign driver "${driverName}" to Booking #${id}?`
          : `Are you sure you want to unassign driver from Booking #${id}?`,
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
        message: `Are you sure you want to change status of Booking #${id} to "${statusVal}"?`,
        confirmText: 'Update Status',
        variant: isUrgent ? 'urgent' : 'warning',
        onConfirm: executeUpdate,
      });
      return;
    }
  };

  const pendingBookings = useMemo(
    () => (pendingResponse?.data || []).map(mapApiBooking),
    [pendingResponse]
  );

  const assignedBookings = useMemo(
    () => (assignedResponse?.data || []).map(mapApiBooking),
    [assignedResponse]
  );

  const bookingsList = useMemo(
    () => [...pendingBookings, ...assignedBookings],
    [pendingBookings, assignedBookings]
  );

  const pendingCount = pendingResponse?.pagination?.total ?? pendingBookings.length;
  const confirmedCount = assignedResponse?.pagination?.total ?? assignedBookings.length;

  const currentTabBookings = activeTab === 'pending' ? pendingBookings : assignedBookings;
  const currentPagination = activeTab === 'pending' ? pendingResponse?.pagination : assignedResponse?.pagination;
  const loading = activeTab === 'pending' ? pendingLoading : assignedLoading;
  const isError = activeTab === 'pending' ? pendingError : assignedError;

  const editTrip = editTripId ? bookingsList.find((t: any) => t?.id === editTripId) : null;

  const mergedDrivers = useMemo(() => {
    const merged = [...apiDrivers, ...(drivers || [])];
    const extra = bookingsList
      .filter((b: any) => b.driverId && b.driverName)
      .map((b: any) => ({
        id: b.driverId,
        name: b.driverName,
        initials: (b.driverName || '').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase(),
        onDuty: true,
        vehicle: { type: 'Van', plate: '' },
      }));
    extra.forEach((d: any) => {
      if (!merged.some((x: any) => String(x.id) === String(d.id))) merged.push(d);
    });
    return merged;
  }, [apiDrivers, drivers, bookingsList]);

  const filteredTrips = currentTabBookings.filter((t: any) => {
    const search = debouncedBookingSearch.toLowerCase();
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

    return matchesSearch && matchesFunding;
  });

  const totalPages = currentPagination?.totalPage || Math.ceil(filteredTrips.length / itemsPerPage) || 1;
  const paginatedBookings = filteredTrips;

  const handleBulkAction = async (action: string) => {
    if (selectedTrips.length === 0) return;

    if (action === 'approve') {
      openConfirm({
        title: 'Approve Selected Bookings',
        message: `Are you sure you want to approve ${selectedTrips.length} selected bookings?`,
        confirmText: 'Approve All',
        variant: 'accent',
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedTrips.map(id =>
                updateBookingMutation({
                  id,
                  payload: { isApproved: 'approved', bookingStatus: 'assigned' },
                }).unwrap()
              )
            );
            toast.success(`${selectedTrips.length} bookings approved successfully`);
            setSelectedTrips([]);
            refresh();
          } catch (e: any) {
            toast.error(apiErrorMessage(e, 'Failed to approve bookings'));
          }
        },
      });
    } else if (action === 'dispatch') {
      const tripsToDispatch = selectedTrips.filter(id => {
        const t = bookingsList.find((trip: any) => trip.id === id);
        return t && t.driverId;
      });
      if (tripsToDispatch.length === 0) {
        toast.error('No selected trips have a driver assigned.');
        return;
      }
      openConfirm({
        title: 'Dispatch Selected Trips',
        message: `Are you sure you want to dispatch ${tripsToDispatch.length} selected trips to Live Trips?`,
        confirmText: 'Dispatch All',
        variant: 'accent',
        onConfirm: async () => {
          try {
            await Promise.all(
              tripsToDispatch.map(id =>
                updateBookingMutation({
                  id,
                  payload: { bookingStatus: 'en_route' },
                }).unwrap()
              )
            );
            toast.success(`${tripsToDispatch.length} trips dispatched to Live Trips`);
            setSelectedTrips([]);
            refresh();
          } catch (e: any) {
            toast.error(apiErrorMessage(e, 'Failed to dispatch trips'));
          }
        },
      });
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
    const driver = mergedDrivers.find(d => String(d.id) === String(driverId));
    const driverName = driver?.name || 'Selected Driver';
    openConfirm({
      title: 'Assign Driver',
      message: `Are you sure you want to assign ${driverName} to Booking #${selectedBookingId}?`,
      confirmText: 'Assign Driver',
      variant: 'primary',
      onConfirm: async () => {
        try {
          await updateBookingMutation({
            id: selectedBookingId,
            payload: { driverId, bookingStatus: 'assigned', isApproved: 'approved' },
          }).unwrap();
          toast.success('Driver assigned — ready to dispatch');
          setIsAssigning(false);
          refresh();
        } catch (e: any) {
          toast.error(apiErrorMessage(e, 'Failed to assign driver'));
        }
      },
    });
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
    openConfirm({
      title: 'Dispatch Trip',
      message: `Are you sure you want to dispatch Booking #${targetId} to Live Trips?`,
      confirmText: 'Dispatch Trip',
      variant: 'accent',
      onConfirm: async () => {
        try {
          await updateBookingMutation({
            id: targetId,
            payload: { bookingStatus: 'en_route' },
          }).unwrap();
          toast.success('Trip dispatched to Live Trips');
          if (targetId === selectedBookingId) closeBooking();
          refresh();
        } catch (e: any) {
          toast.error(apiErrorMessage(e, 'Failed to dispatch trip'));
        }
      },
    });
  };

  const handleReject = () => {
    setShowCancelModal(true);
  };

  const handleApprove = async (id?: any) => {
    const targetId = typeof id === 'string' ? id : selectedBookingId;
    if (!targetId) return;
    openConfirm({
      title: 'Approve Booking',
      message: `Are you sure you want to approve Booking #${targetId}?`,
      confirmText: 'Approve Booking',
      variant: 'accent',
      onConfirm: async () => {
        try {
          await updateBookingMutation({
            id: targetId,
            payload: { isApproved: 'approved', bookingStatus: 'assigned' },
          }).unwrap();
          toast.success('Booking approved — moved to Ready to Assign');
          refresh();
        } catch (e: any) {
          console.error(e);
          toast.error(apiErrorMessage(e, 'Failed to approve booking'));
        }
      },
    });
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
      return isVehicleMatch(d, selectedBooking);
    })
    .map((driver: any) => {
      const activeTrips = bookingsList.filter((t: any) =>
        t?.driverId === driver?.id &&
        ['assigned', 'confirmed', 'in-progress', 'en_route'].includes(t?.status) &&
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
          <Button variant="primary" onClick={() => refresh()}>Retry</Button>
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
              await Promise.all(
                selectedTrips.map(id =>
                  updateBookingMutation({
                    id,
                    payload: { isApproved: 'rejected', bookingStatus: 'cancelled' },
                  }).unwrap()
                )
              );
              toast.success(`${selectedTrips.length} bookings cancelled`);
              setSelectedTrips([]);
              setShowBulkCancelModal(false);
              refresh();
            } catch (e: any) {
              toast.error(apiErrorMessage(e, 'Failed to cancel bookings'));
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
                await updateBookingMutation({
                  id: selectedBookingId,
                  payload: { isApproved: 'rejected', bookingStatus: 'cancelled' },
                }).unwrap();
                toast.success('Booking declined');
                closeBooking();
                refresh();
              } catch (e: any) {
                toast.error(apiErrorMessage(e, 'Failed to decline booking'));
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
            totalItems={currentPagination?.total ?? filteredTrips.length}
            setSelectedTrips={setSelectedTrips}
            handleBulkAction={handleBulkAction}
            updateTrip={handleUpdateBooking}
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
          onUpdate={handleUpdateBooking}
          startInEdit
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

export default Bookings;
