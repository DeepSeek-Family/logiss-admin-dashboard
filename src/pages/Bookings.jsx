import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Clock, MapPin, Phone, ChevronRight,
  CheckCircle2, User, Users, CalendarClock,
  AlertOctagon, Navigation, Repeat, MoveRight,
  Check, Trash2, XCircle, Plus, Loader2, Edit2, ExternalLink, ShieldAlert
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge, Pagination } from '../components/UI';
import { ManualTripModal } from '../components/ManualTripModal';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { formatTime, formatDateTime, formatShortDate, tripTypeLabel, money } from '../utils/helpers';
import { CancelTripModal } from './Reports';

// Helper: check if two time windows overlap (within 1.5 hours either side)
const hasTimeConflict = (existingTrip, candidateTime) => {
  if (!existingTrip.scheduledTime || !candidateTime) return false;
  const existing = new Date(existingTrip.scheduledTime).getTime();
  const candidate = new Date(candidateTime).getTime();
  const BUFFER_MS = 90 * 60 * 1000; // 1.5 hour buffer
  return Math.abs(existing - candidate) < BUFFER_MS;
};

// Helper: check if driver vehicle type matches trip mobility need
const isVehicleMatch = (driver, booking) => {
  if (!booking?.mobility) return false;
  const need = booking.mobility.toLowerCase();
  const type = driver.vehicle?.type?.toLowerCase() || '';
  if (need === 'wheelchair' || need === 'stretcher') return type.includes(need.split(' ')[0]);
  return true; // ambulatory / cane can use any van
};

const Bookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBulkCancelModal, setShowBulkCancelModal] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 8;

  const { trips: initialTrips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();
  const [localTrips, setLocalTrips] = useState([]);

  const loading = tripsLoading || driversLoading;

  useEffect(() => {
    if (initialTrips?.length > 0 && localTrips.length === 0) setLocalTrips(initialTrips);
  }, [initialTrips, localTrips.length]);

  // Sync local trips when initialTrips changes
  const trips = localTrips.length > 0 ? localTrips : initialTrips;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const updateTripStatus = (ids, newStatus, extra = {}) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    setLocalTrips(prev => {
      const source = prev.length > 0 ? prev : initialTrips;
      return source.map(t => idArray.includes(t.id) ? { ...t, status: newStatus, ...extra } : t);
    });
  };

  const filteredTrips = (trips || []).filter(t => {
    const matchesTab = activeTab === 'pending' ? t?.status === 'pending_review' : activeTab === 'confirmed' ? t?.status === 'confirmed' : false;
    const matchesSearch = !bookingSearch ||
      (t?.rider?.name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (t?.id || '').toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedBookings = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleBulkAction = (action) => {
    if (action === 'approve') {
      updateTripStatus(selectedTrips, 'confirmed');
      showToast(`${selectedTrips.length} bookings approved`);
      setSelectedTrips([]);
    } else if (action === 'cancel') {
      setShowBulkCancelModal(true);
    }
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedBookings.map(t => t.id);
    const allSelected = pageIds.every(id => selectedTrips.includes(id));
    if (allSelected) {
      setSelectedTrips(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedTrips(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleSelectTrip = (id) => {
    setSelectedTrips(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleAssign = (driverId) => {
    updateTripStatus(selectedBookingId, 'confirmed', { driverId });
    setIsAssigning(false);
    showToast('Driver assigned successfully');
  };

  const openBooking = (id) => {
    setSelectedBookingId(id);
    setIsAssigning(false);
  };

  const closeBooking = () => {
    setSelectedBookingId(null);
    setIsAssigning(false);
  };

  const handleDispatch = () => {
    updateTripStatus(selectedBookingId, 'en_route');
    showToast('Trip dispatched successfully');
    closeBooking();
  };

  const handleReject = () => {
    setShowCancelModal(true);
  };

  const handleApprove = (id) => {
    const targetId = id || selectedBookingId;
    updateTripStatus(targetId, 'confirmed');
    showToast('Booking approved — moved to Ready to Assign');
    if (targetId === selectedBookingId) closeBooking();
  };

  const selectedBooking = selectedBookingId ? (trips || []).find(t => t?.id === selectedBookingId) : null;
  const assignedDriver = selectedBooking?.driverId ? drivers.find(d => d.id === selectedBooking.driverId) : null;
  
  const smartDrivers = (drivers || [])
    .filter(d => d?.onDuty && isVehicleMatch(d, selectedBooking))
    .map(driver => {
      const activeTrips = (trips || []).filter(t =>
        t?.driverId === driver?.id &&
        ['assigned', 'confirmed', 'in_trip', 'en_route'].includes(t?.status) &&
        t?.id !== selectedBookingId
      );
      const hasConflict = activeTrips.some(t => hasTimeConflict(t, selectedBooking?.scheduledTime));
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
      {toast && (
        <div className="fixed top-6 right-6 z-[200] bg-ink text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-200 flex items-center gap-2.5 pointer-events-none">
          <CheckCircle2 size={16} className="text-accent shrink-0" />
          {toast}
        </div>
      )}

      {showManualModal && (
        <ManualTripModal
          trips={trips}
          onClose={() => setShowManualModal(false)}
          onSave={(newTrip) => {
            showToast('Manual booking created');
            setShowManualModal(false);
          }}
        />
      )}

      {showBulkCancelModal && (
        <CancelTripModal
          onClose={() => setShowBulkCancelModal(false)}
          onConfirm={(reason) => {
            showToast(`${selectedTrips.length} bookings cancelled`);
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
        <Button variant="primary" icon={Plus} onClick={() => setShowManualModal(true)}>Manual Entry</Button>
      </div>

      <div className="flex items-center gap-1 border-b border-line-2">
        {['pending', 'confirmed'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); setSelectedBookingId(null); }}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-3 hover:text-ink-2'}`}
          >
            {tab === 'pending' ? 'Pending Review' : 'Ready to Assign'}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-primary-light text-primary' : 'bg-bg text-ink-4'}`}>
              {trips.filter(t => tab === 'pending' ? t.status === 'pending_review' : t.status === 'confirmed').length}
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
                        checked={paginatedBookings.length > 0 && paginatedBookings.every(b => selectedTrips.includes(b.id))}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-line text-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-ink-4 uppercase tracking-widest">IDs</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Rider</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Source / Program</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Route</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Space Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Scheduled (Appt)</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {paginatedBookings.map(booking => (
                    <tr
                      key={booking.id}
                      onClick={() => openBooking(booking.id)}
                      className={`cursor-pointer transition-colors group ${selectedBookingId === booking.id ? 'bg-primary-tint/20' : 'hover:bg-bg'} ${selectedTrips.includes(booking.id) ? 'bg-accent-light/10' : ''}`}
                    >
                      <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedTrips.includes(booking.id)} onChange={() => toggleSelectTrip(booking.id)} className="w-4 h-4 rounded border-line text-primary cursor-pointer" />
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs font-black text-ink uppercase tracking-tight">#{booking?.id || '---'}</span>
                          <span className="text-[9px] font-bold text-ink-4 uppercase tracking-widest flex items-center gap-1">
                            <ShieldAlert size={8} className="text-primary" /> {booking?.authId || 'PENDING AUTH'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <Avatar initials={booking?.rider?.initials || '?'} size="xs" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-ink leading-tight truncate">{booking?.rider?.name || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-ink-4 mt-0.5">ID: {booking?.rider?.passengerId || '---'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                            <span className="text-[11px] font-black text-ink-2 uppercase tracking-wide">{booking?.source || 'Chesterfield County'}</span>
                          </div>
                          {booking?.dropoff && booking?.source && !booking.dropoff.toLowerCase().includes(booking.source.split(' ')[0].toLowerCase()) && (
                            <span className="text-[8px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded shadow-sm w-fit uppercase tracking-tighter ml-3.5">Outside County</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-0.5 relative pl-4">
                          <div className="absolute left-[5px] top-[7px] bottom-[7px] w-0.5 bg-line-2"></div>
                          <div className="flex items-center gap-2 text-xs font-bold text-ink relative">
                            <div className="absolute -left-[14px] w-2 h-2 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                            <span className="truncate max-w-[150px]">{booking?.pickup || '---'}</span>
                          </div>
                          
                          {booking?.stops?.map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-ink-4 relative mt-1">
                              <div className="absolute -left-[12.5px] w-1.5 h-1.5 rounded-full bg-line-3 border border-white shadow-sm"></div>
                              <span className="truncate max-w-[150px]">{stop.address}</span>
                            </div>
                          ))}

                          <div className="flex items-center gap-2 text-[10px] font-bold text-ink-3 relative mt-1.5">
                            <div className="absolute -left-[14px] w-2 h-2 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
                            <span className="truncate max-w-[150px]">{booking?.dropoff || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="primary-light" className="w-fit text-[9px] font-black">{booking?.mobility || 'AMB'}</Badge>
                          <div className="flex items-center gap-1.5">
                            {booking?.type === 'round_trip' ? 
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"><Repeat size={8} strokeWidth={3} /><span className="text-[8px] font-black uppercase">Round Trip</span></div> : 
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"><MoveRight size={8} strokeWidth={3} /><span className="text-[8px] font-black uppercase">One Way</span></div>
                            }
                            {booking?.returnType === 'will_call' && 
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-warning-light text-warning-dark border border-warning/20"><Phone size={8} strokeWidth={3} /><span className="text-[8px] font-black uppercase tracking-tighter">Will Call</span></div>
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <p className="text-xs font-black text-ink">{formatTime(booking?.scheduledTime)}</p>
                        <p className="text-[10px] text-ink-3 font-bold">Appt: {booking?.appointmentTime || '---'}</p>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {activeTab === 'pending' ? (
                            <button className="p-2 text-accent hover:bg-accent-light rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); handleApprove(booking.id); }} title="Confirm Booking"><Check size={18} /></button>
                          ) : (
                            <button className="p-2 text-primary hover:bg-primary-light rounded-xl transition-all flex items-center gap-1.5 px-3" onClick={(e) => { e.stopPropagation(); openBooking(booking.id); setIsAssigning(true); }}><Users size={16} /><span className="text-[10px] font-bold uppercase">Assign Driver</span></button>
                          )}
                          <ChevronRight size={15} className="text-ink-4 group-hover:translate-x-1 transition-transform" />
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
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-black text-lg">{selectedTrips.length}</div>
              <div><p className="text-sm font-black">Trips Selected</p><p className="text-[10px] font-bold text-white/50 uppercase">Ready for action</p></div>
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
                      <div className="flex items-center gap-3">
                        <Avatar initials={selectedBooking.rider.initials} size="md" />
                        <div>
                          <h3 className="text-sm font-bold text-ink">{selectedBooking.rider.name}</h3>
                          <p className="text-xs text-ink-3">ID: {selectedBooking.rider.passengerId || '---'} · {selectedBooking.rider.phone}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" icon={Phone}>Call</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-2">
                      <div><p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">Authorization ID</p><p className="text-xs font-black text-primary uppercase">{selectedBooking.authId || 'PENDING'}</p></div>
                      <div><p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">Source / Program</p><p className="text-xs font-bold text-ink">{selectedBooking.source || 'Chesterfield County'}</p></div>
                      <div className="pt-2 border-t border-line-2"><p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">Pickup Time</p><p className="text-xs font-black text-ink">{formatDateTime(selectedBooking.scheduledTime)}</p></div>
                      <div className="pt-2 border-t border-line-2"><p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">Appointment</p><p className="text-xs font-black text-ink-2">{selectedBooking.appointmentTime || '---'}</p></div>
                      <div className="pt-2 border-t border-line-2"><p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">Trip Type</p><p className="text-xs font-bold text-ink uppercase">{tripTypeLabel(selectedBooking.type)}</p></div>
                      <div className="pt-2 border-t border-line-2"><p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-1">Mobility Need</p><Badge variant="primary-light" className="text-[10px] font-black">{selectedBooking.mobility || 'AMB'}</Badge></div>
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Navigation size={11} className="text-primary" /> Trip Route</p>
                    <div className="bg-bg rounded-xl p-4 border border-line-2 space-y-4">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm border border-white"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-ink-4 uppercase mb-0.5">Pickup</p>
                          <p className="text-xs font-bold text-ink">{selectedBooking.pickup}</p>
                        </div>
                      </div>
                      
                      {selectedBooking?.stops?.map((stop, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-line-3 mt-1.5 shrink-0 ml-0.5"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold text-ink-4 uppercase mb-0.5 flex items-center gap-1.5">
                              Stop {idx + 1} 
                              <span className="px-1 py-0.5 bg-white border border-line-2 rounded text-[7px] tracking-tighter">{stop.type.toUpperCase()}</span>
                            </p>
                            <p className="text-xs font-medium text-ink-3 italic">{stop.address}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-3 pt-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-sm border border-white"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-ink-4 uppercase mb-0.5">Drop-off</p>
                          <p className="text-xs font-bold text-ink">{selectedBooking.dropoff}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Users size={11} className="text-primary" /> Driver Assignment</p>
                    {assignedDriver && !isAssigning ? (
                      <div className="border border-accent/20 bg-accent-light/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><Avatar initials={assignedDriver.initials} size="sm" online={assignedDriver.onDuty} /><div><p className="text-sm font-bold text-ink">{assignedDriver.name}</p><p className="text-[10px] text-ink-3">{assignedDriver.phone}</p></div></div>
                          <button onClick={() => setIsAssigning(true)} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"><Edit2 size={10} /> Change</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line-2">
                          <div><p className="text-[10px] font-bold text-ink-4 uppercase mb-0.5">Vehicle</p><p className="text-xs font-bold text-ink">{assignedDriver.vehicle.type}</p></div>
                          <div><p className="text-[10px] font-bold text-ink-4 uppercase mb-0.5">Plate</p><p className="text-xs font-bold font-mono text-ink">{assignedDriver.vehicle.plate}</p></div>
                        </div>
                      </div>
                    ) : !isAssigning ? (
                      <div className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${activeTab === 'confirmed' ? 'border-primary bg-primary-tint/30' : 'border-line-2 bg-bg hover:bg-line-2/50'}`} onClick={() => setIsAssigning(true)}>
                        <div className="flex items-center gap-3"><div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-ink-4 shadow-sm"><Users size={18} /></div><div><p className="text-sm font-bold text-ink">Assign a Driver</p><p className="text-[10px] text-ink-3">Click to select available driver</p></div></div>
                        <Button variant="outline" size="sm">Select</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-ink-3">Recommended Drivers</p><button onClick={() => setIsAssigning(false)} className="text-xs font-bold text-primary">Cancel</button></div>
                        {smartDrivers.map(driver => (
                          <div key={driver.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${driver.hasConflict ? 'border-line-2 opacity-50' : 'border-line-2 hover:border-primary/30 hover:bg-primary-tint/10'}`}>
                            <div className="flex items-center gap-2.5"><Avatar initials={driver.initials} size="sm" online={driver.onDuty} /><div><p className="text-sm font-bold text-ink">{driver.name}</p><p className="text-[10px] text-ink-3">{driver.vehicle.type} · {driver.rating} ★</p></div></div>
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
