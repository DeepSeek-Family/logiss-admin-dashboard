import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Clock, MapPin, Phone, ChevronRight,
  CheckCircle2, User, Users, CalendarClock,
  AlertOctagon, Navigation, Repeat, MoveRight, ArrowRight,
  Check, Trash2, XCircle, Plus, Loader2, Edit2, ExternalLink, List
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge, Pagination } from '@/shared/components/ui';
import { ManualTripModal } from '../components/ManualTripModal';
import { useTrips } from '../hooks/useTrips';
import { tripService } from '../services/tripService';
import { useDrivers } from '../hooks/useDrivers';
import { formatTime, formatDateTime, formatShortDate, tripTypeLabel, money } from '../utils/helpers';
import { CancelTripModal } from '@/features/reports';
import { toast } from 'react-hot-toast';
import { BookingDetailsSidebar, BookingsList, hasTimeConflict, isVehicleMatch } from '@/features/bookings';

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
  const [driverSearch, setDriverSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { trips, loading: tripsLoading, refresh } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();

  const loading = tripsLoading || driversLoading;

  const filteredTrips = (trips || []).filter((t: any) => {
    const status = (t?.status || '').toLowerCase();
    const matchesTab = activeTab === 'pending'
      ? status === 'pending_review'
      : activeTab === 'confirmed'
        ? (status === 'confirmed' || status === 'assigned')
        : status === activeTab;

    const search = bookingSearch.toLowerCase().trim();
    const matchesSearch = !search ||
      (t?.rider?.name || '').toLowerCase().includes(search) ||
      (t?.id || '').toLowerCase().includes(search) ||
      (t?.passengerId || '').toLowerCase().includes(search) ||
      (t?.authorizationId || t?.authId || '').toLowerCase().includes(search) ||
      (t?.source || '').toLowerCase().includes(search) ||
      (t?.pickup || '').toLowerCase().includes(search) ||
      (t?.dropoff || '').toLowerCase().includes(search);

    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedBookings = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        const t = trips.find((trip: any) => trip.id === id);
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
      refresh(); // keep sidebar open so dispatcher can confirm
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
    const targetTrip = trips.find((t: any) => t.id === targetId);
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
      if (targetId === selectedBookingId) {
        // Optionally keep it open to show the new state
      }
      refresh();
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve booking');
    }
  };

  const selectedBooking = selectedBookingId ? (trips || []).find((t: any) => t?.id === selectedBookingId) : null;
  const assignedDriver = selectedBooking?.driverId ? drivers.find((d: any) => d.id === selectedBooking.driverId) : null;

  const smartDrivers = (drivers || [])
    .filter((d: any) => d?.onDuty && isVehicleMatch(d, selectedBooking))
    .filter((d: any) => {
      const search = driverSearch.toLowerCase().trim();
      return !search || d?.name?.toLowerCase().includes(search) || d?.id?.toLowerCase().includes(search);
    })
    .map((driver: any) => {
      const activeTrips = (trips || []).filter((t: any) =>
        t?.driverId === driver?.id &&
        ['assigned', 'confirmed', 'in_trip', 'en_route'].includes(t?.status) &&
        t?.id !== selectedBookingId
      );
      const hasConflict = activeTrips.some((t: any) => hasTimeConflict(t, selectedBooking?.scheduledTime));
      return { ...driver, hasConflict };
    });

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {showManualModal && (
        <ManualTripModal
          trips={trips}
          onClose={() => setShowManualModal(false)}
          onSave={(newTrip) => {
            toast.success('Manual booking created');
            setShowManualModal(false);
          }}
        />
      )}

      {showBulkCancelModal && (
        <CancelTripModal
          onClose={() => setShowBulkCancelModal(false)}
          onConfirm={async (reason) => {
            try {
              await Promise.all(selectedTrips.map(id => tripService.updateTripStatus(id, 'cancelled')));
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
          onConfirm={async (reason) => {
            if (selectedBookingId) {
              try {
                await tripService.updateTripStatus(selectedBookingId, 'cancelled');
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Booking Requests</h1>
          <p className="text-sm text-ink-4 mt-0.5">Review and dispatch medical transportation requests</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/create-booking')}>Manual Entry</Button>
      </div>

      <BookingsList
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookingSearch={bookingSearch}
        setBookingSearch={setBookingSearch}
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
        setCurrentPage={setCurrentPage}
        trips={trips}
        setSelectedTrips={setSelectedTrips}
        handleBulkAction={handleBulkAction}
      />

      {selectedBookingId && selectedBooking && (
        <BookingDetailsSidebar
          selectedBooking={selectedBooking}
          assignedDriver={assignedDriver}
          smartDrivers={smartDrivers}
          activeTab={activeTab}
          closeBooking={closeBooking}
          handleAssign={handleAssign}
          handleReject={handleReject}
          handleApprove={handleApprove}
          handleDispatch={handleDispatch}
          driverSearch={driverSearch}
          setDriverSearch={setDriverSearch}
        />
      )}
    </div>
  );
};

export default Bookings;
