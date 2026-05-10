import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Clock, MapPin, Phone, ChevronRight,
  CheckCircle2, User, Users, CalendarClock,
  AlertOctagon, Navigation, Repeat, MoveRight, ArrowRight,
  Check, Trash2, XCircle, Plus, Loader2, Edit2, ExternalLink
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge, Pagination } from '../components/ui';
import { ManualTripModal } from '../components/ManualTripModal';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { formatTime, formatDateTime, formatShortDate, tripTypeLabel, money } from '../utils/helpers';
import { CancelTripModal } from './Reports';
import { toast } from 'react-hot-toast';

// Helper: check if two time windows overlap (within 1.5 hours either side)
const hasTimeConflict = (existingTrip: any, candidateTime: string | null) => {
  if (!existingTrip.scheduledTime || !candidateTime) return false;
  const existing = new Date(existingTrip.scheduledTime).getTime();
  const candidate = new Date(candidateTime).getTime();
  const BUFFER_MS = 90 * 60 * 1000; // 1.5 hour buffer
  return Math.abs(existing - candidate) < BUFFER_MS;
};

// Helper: check if driver vehicle type matches trip mobility need
const isVehicleMatch = (driver: any, booking: any) => {
  if (!booking?.mobility) return false;
  const need = booking.mobility.toLowerCase();
  const type = driver.vehicle?.type?.toLowerCase() || '';
  if (need === 'wheelchair' || need === 'stretcher') return type.includes(need.split(' ')[0]);
  return true; // ambulatory / cane can use any van
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { trips, loading: tripsLoading } = useTrips();
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
      (t?.pickup || '').toLowerCase().includes(search) ||
      (t?.dropoff || '').toLowerCase().includes(search);

    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedBookings = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleBulkAction = (action: string) => {
    if (selectedTrips.length === 0) return;

    if (action === 'approve') {
      toast.success(`${selectedTrips.length} bookings approved successfully`);
      setSelectedTrips([]);
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

  const handleAssign = (driverId: string) => {
    setIsAssigning(false);
    toast.success('Driver assigned — trip moved to Live Trips');
  };

  const openBooking = (id: string) => {
    setSelectedBookingId(id);
    setIsAssigning(false);
  };

  const closeBooking = () => {
    setSelectedBookingId(null);
    setIsAssigning(false);
  };

  const handleDispatch = () => {
    toast.success('Trip dispatched successfully');
    closeBooking();
  };

  const handleReject = () => {
    setShowCancelModal(true);
  };

  const handleApprove = () => {
    toast.success('Booking approved — moved to Ready to Assign');
  };

  const selectedBooking = selectedBookingId ? (trips || []).find((t: any) => t?.id === selectedBookingId) : null;
  const assignedDriver = selectedBooking?.driverId ? drivers.find((d: any) => d.id === selectedBooking.driverId) : null;

  const smartDrivers = (drivers || [])
    .filter((d: any) => d?.onDuty && isVehicleMatch(d, selectedBooking))
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
          <p className="text-sm font-bold text-ink-3">Loading Bookings...</p>
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
          onConfirm={(reason) => {
            toast.success(`${selectedTrips.length} bookings cancelled`);
            setSelectedTrips([]);
            setShowBulkCancelModal(false);
          }}
        />
      )}

      {showCancelModal && (
        <CancelTripModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => {
            setShowCancelModal(false);
            closeBooking();
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-display text-ink tracking-tight">Booking Requests</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-wide">Review and dispatch medical transportation requests</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/create-booking')}>Manual Entry</Button>
      </div>

      <div className="flex items-center gap-1 border-b border-line-2">
        {['pending', 'confirmed'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); setSelectedBookingId(null); }}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-3 hover:text-ink-2'}`}
          >
            {tab === 'pending' ? 'Pending Review' : 'Ready to Assign'}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-primary-light text-primary' : 'bg-bg text-ink-4'}`}>
              {trips.filter((t: any) => tab === 'pending' ? t.status === 'pending_review' : t.status === 'confirmed').length}
            </span>
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
        <input
          type="text"
          placeholder="Search rider or ID..."
          value={bookingSearch}
          onChange={e => { setBookingSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-8 pr-3 py-2 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none"
        />
      </div>

      <div className="bg-white border border-line-2 rounded-xl overflow-hidden min-h-[500px] flex flex-col shadow-sm">
        {filteredTrips.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg border-b border-line-2">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedBookings.length > 0 && paginatedBookings.every((b: any) => selectedTrips.includes(b.id))}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-line text-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-ink-2 whitespace-nowrap">Trip ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-ink-2 whitespace-nowrap">Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-ink-2 whitespace-nowrap">Rider</th>
                    <th className="px-6 py-4 text-xs font-bold text-ink-2 whitespace-nowrap">Route</th>
                    <th className="px-6 py-4 text-xs font-bold text-ink-2 whitespace-nowrap">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-ink-2 whitespace-nowrap">Scheduled</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {paginatedBookings.map((booking: any) => (
                    <tr
                      key={booking.id}
                      onClick={() => openBooking(booking.id)}
                      className={`cursor-pointer transition-colors group ${selectedBookingId === booking.id ? 'bg-primary-tint/20' : 'hover:bg-bg'} ${selectedTrips.includes(booking.id) ? 'bg-accent-light/10' : ''}`}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedTrips.includes(booking.id)} onChange={() => toggleSelectTrip(booking.id)} className="w-4 h-4 rounded border-line text-primary cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-ink uppercase">#{booking?.id || '---'}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-ink">{booking?.submittedTime ? formatShortDate(booking.submittedTime) : '-'}</p>
                        <p className="text-xs text-ink-4">{booking?.submittedTime ? formatTime(booking.submittedTime) : '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3"><Avatar initials={booking?.rider?.initials || '?'} size="xs" /><span className="text-sm font-bold text-ink leading-tight">{booking?.rider?.name || 'Unknown'}</span></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                          <span className="text-[13px] font-semibold text-ink max-w-[140px] truncate">{booking?.pickup || '---'}</span>
                          <ArrowRight size={12} className="text-ink-4 shrink-0" />
                          <MapPin size={13} className="text-urgent shrink-0" />
                          <span className="text-[13px] font-semibold text-ink-2 max-w-[140px] truncate">{booking?.dropoff || '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="primary" className="w-fit">{booking?.mobility || 'Standard'}</Badge>
                          {booking?.type === 'round_trip' ? <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 w-fit"><Repeat size={10} strokeWidth={3} /><span className="text-xs font-bold">Round Trip</span></div> : <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 w-fit"><MoveRight size={10} strokeWidth={3} /><span className="text-xs font-bold">One Way</span></div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-ink">{formatShortDate(booking?.scheduledTime)}</p>
                        <p className="text-xs text-ink-4">{formatTime(booking?.scheduledTime)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {activeTab === 'pending' ? (
                            <button className="p-2 text-accent hover:bg-accent-light rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); handleApprove(); }}><Check size={18} /></button>
                          ) : (
                            <button className="p-2 text-primary hover:bg-primary-light rounded-xl transition-all flex items-center gap-1.5 px-3" onClick={(e) => { e.stopPropagation(); openBooking(booking.id); setIsAssigning(true); }}><Users size={16} /><span className="text-xs font-bold">Assign Driver</span></button>
                          )}
                          <ChevronRight size={15} className="text-ink-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredTrips.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-ink-4">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Queue Empty</p>
            <p className="text-sm">No bookings match your criteria.</p>
          </div>
        )}
      </div>

      {selectedTrips.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-ink text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">{selectedTrips.length}</div>
              <div><p className="text-sm font-bold">Trips Selected</p><p className="text-xs font-bold text-white/50 uppercase">Ready for action</p></div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="primary" size="md" icon={Check} className="bg-accent border-none px-6" onClick={() => handleBulkAction('approve')}>Approve All</Button>
              <Button variant="outline" size="md" icon={Trash2} className="border-white/20 text-white hover:bg-white/10 px-6" onClick={() => handleBulkAction('cancel')}>Cancel All</Button>
              <button onClick={() => setSelectedTrips([])} className="text-xs font-bold text-white/40 hover:text-white transition-colors ml-4">Deselect</button>
            </div>
          </div>
        </div>
      )}

      {selectedBookingId && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeBooking}></div>
          <div className="relative w-full max-w-lg bg-white shadow-2xl h-full animate-in slide-in-from-right duration-300">
            {selectedBooking ? (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-line-2 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5"><span className="font-mono text-xs font-bold text-ink-4">#{selectedBooking.id}</span><TripStatusBadge status={selectedBooking.status} /></div>
                    <h2 className="text-base font-bold text-ink">Booking Details</h2>
                  </div>
                  <button onClick={closeBooking} className="p-1.5 hover:bg-bg rounded-lg text-ink-4 transition-colors"><XCircle size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  <section className="bg-bg rounded-xl p-4 border border-line-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><Avatar initials={selectedBooking.rider.initials} size="md" /><div><h3 className="text-sm font-bold text-ink">{selectedBooking.rider.name}</h3><p className="text-xs text-ink-4">{selectedBooking.rider.age} yrs · {selectedBooking.rider.phone}</p></div></div>
                      <Button variant="outline" size="sm" icon={Phone}>Call</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs font-bold text-ink-4 mb-1">Pickup Time</p><p className="text-xs font-bold text-ink">{formatDateTime(selectedBooking.scheduledTime)}</p></div>
                      <div><p className="text-xs font-bold text-ink-4 mb-1">Trip Type</p><p className="text-xs font-bold text-ink">{tripTypeLabel(selectedBooking.type)}</p></div>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-bold text-ink-4 flex items-center gap-1.5 mb-2"><Navigation size={11} className="text-primary" /> Trip Route</p>
                    <div className="bg-bg rounded-xl p-4 border border-line-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink-4 mb-0.5">Pickup</p>
                          <p className="text-xs font-bold text-ink">{selectedBooking.pickup}</p>
                        </div>
                      </div>

                      {/* Handle legacy 'stop' string */}
                      {selectedBooking.stop && !Array.isArray(selectedBooking.stop) && (
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-ink-4 mb-0.5">Stop</p>
                            <p className="text-xs font-bold text-ink">{selectedBooking.stop}</p>
                          </div>
                        </div>
                      )}

                      {/* Handle new 'stops' array */}
                      {Array.isArray(selectedBooking.stops) && selectedBooking.stops.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-ink-4 mb-0.5">Stop {i + 1}</p>
                            <p className="text-xs font-bold text-ink">{s}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center gap-3">
                        <MapPin size={13} className="text-urgent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink-4 mb-0.5">Drop-off</p>
                          <p className="text-xs font-bold text-ink">{selectedBooking.dropoff}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-bold text-ink-4 flex items-center gap-1.5 mb-2"><Users size={11} className="text-primary" /> Driver Assignment</p>
                    {assignedDriver && !isAssigning ? (
                      <div className="border border-accent/20 bg-accent-light/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><Avatar initials={assignedDriver.initials} size="sm" online={assignedDriver.onDuty} /><div><p className="text-sm font-bold text-ink">{assignedDriver.name}</p><p className="text-xs text-ink-4">{assignedDriver.phone}</p></div></div>
                          <button onClick={() => setIsAssigning(true)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><Edit2 size={10} /> Change</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line-2">
                          <div><p className="text-xs font-bold text-ink-4 mb-0.5">Vehicle</p><p className="text-xs font-bold text-ink">{assignedDriver.vehicle.type}</p></div>
                          <div><p className="text-xs font-bold text-ink-4 mb-0.5">Plate</p><p className="text-xs font-bold font-mono text-ink">{assignedDriver.vehicle.plate}</p></div>
                        </div>
                      </div>
                    ) : !isAssigning ? (
                      <div className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${activeTab === 'confirmed' ? 'border-primary bg-primary-tint/30' : 'border-line-2 bg-bg hover:bg-line-2/50'}`} onClick={() => setIsAssigning(true)}>
                        <div className="flex items-center gap-3"><div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-ink-4 shadow-sm"><Users size={18} /></div><div><p className="text-sm font-bold text-ink">Assign a Driver</p><p className="text-xs text-ink-4">Click to select available driver</p></div></div>
                        <Button variant="outline" size="sm">Select</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-ink-3">Recommended Drivers</p><button onClick={() => setIsAssigning(false)} className="text-xs font-bold text-primary">Cancel</button></div>
                        {smartDrivers.map((driver: any) => (
                          <div key={driver.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${driver.hasConflict ? 'border-line-2 opacity-50' : 'border-line-2 hover:border-primary/30 hover:bg-primary-tint/10'}`}>
                            <div className="flex items-center gap-2.5"><Avatar initials={driver.initials} size="sm" online={driver.onDuty} /><div><p className="text-sm font-bold text-ink">{driver.name}</p><p className="text-xs text-ink-4">{driver.vehicle.type} · {driver.rating} ★</p></div></div>
                            <Button variant="outline" size="sm" onClick={() => handleAssign(driver.id)} disabled={driver.hasConflict}>{driver.hasConflict ? 'Busy' : 'Assign'}</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <div className="p-6 border-t border-line-2 bg-white space-y-3">
                  {selectedBooking.status === 'pending_review' ? (
                    <div className="flex gap-3"><Button variant="ghost" className="text-urgent flex-1" onClick={handleReject}>Decline</Button><Button variant="primary" className="flex-1" onClick={handleApprove}>Confirm</Button></div>
                  ) : (
                    <Button variant="accent" className="w-full py-4 text-base" icon={Navigation} onClick={handleDispatch} disabled={!selectedBooking.driverId}>Dispatch Trip</Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 text-center text-ink-4"><div><Search size={48} className="mx-auto mb-4 opacity-20" /><p className="font-bold">Not Found</p></div></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
