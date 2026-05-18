import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Search, Download, ChevronRight, MapPin, ArrowRight,
  Clock, User, Truck, CheckCircle2, XCircle, TrendingUp,
  X, Calendar, Phone, CreditCard, Shield, Navigation, Car,
  MoveRight, Repeat, MessageSquare, UserPlus, Loader2,
  ChevronLeft, Users, AlertTriangle, Coffee, Wrench
} from 'lucide-react';
import { Card, Badge, Avatar, TripStatusBadge, Pagination, Button } from '../components/ui';
import { CancelTripModal } from './Reports';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { useFleet } from '../hooks/useFleet';
import { formatTime, formatShortDate, formatDateTime, tripTypeLabel, money } from '../utils/helpers';

/* ── Schedule Helpers ─────────────────────────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0=Mon

// Deterministic mock schedule per driver+day
const getShift = (driverIdx: number, dayIdx: number) => {
  const seed = (driverIdx * 7 + dayIdx) % 6;
  if (seed === 0) return { type: 'heavy', label: '8 Trips', time: '07:00 – 16:00', color: 'primary' };
  if (seed === 1) return { type: 'split', label: '4 Trips', time: '06:00 – 10:00\n14:00 – 18:00', color: 'warning' };
  if (seed === 2) return null; // Off
  if (seed === 3) return { type: 'normal', label: '5 Trips', time: '12:00 – 20:00', color: 'accent' };
  if (seed === 4) return { type: 'light', label: '2 Trips', time: '09:00 – 13:00', color: 'primary' };
  return { type: 'leave', label: 'Leave', time: 'All Day', color: 'neutral' };
};

const shiftStyle: { [key: string]: string } = {
  primary: 'bg-primary-tint/40 border-primary/20 text-primary',
  warning: 'bg-warning-light/50 border-warning/20 text-warning-dark',
  neutral: 'bg-bg border-line-2 text-ink-3',
  accent: 'bg-accent-light/40 border-accent/20 text-accent-dark',
};

const StatusUpdateModal = ({ item, date, onClose }: { item: any; date: Date; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-line-2 flex justify-between items-center bg-bg">
          <h3 className="font-semibold text-sm text-ink">Update Status</h3>
          <button onClick={onClose} className="text-ink-4 hover:text-ink transition-colors p-1 rounded-lg hover:bg-line-2"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl border border-line-2 flex items-center justify-center shadow-sm">
              {item.plate ? <Truck size={18} className="text-primary" /> : <Users size={18} className="text-primary" />}
            </div>
            <div>
              <p className="font-medium text-sm text-ink">{item.name || item.plate}</p>
              <p className="text-xs text-ink-4 mt-0.5">{date.toDateString()}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-medium text-ink-4">Set Status For This Day</label>
            <div className="grid grid-cols-2 gap-2">
              {item.plate ? (
                <>
                  <button className="py-3 rounded-xl border-2 border-line hover:border-primary font-medium text-xs bg-bg text-ink-4 hover:text-primary transition-all">Active Duty</button>
                  <button className="py-3 rounded-xl border-2 border-transparent font-medium text-xs bg-urgent-light/40 text-urgent hover:bg-urgent-light transition-all flex flex-col items-center justify-center gap-1">
                    <Wrench size={14} /> Maintenance
                  </button>
                </>
              ) : (
                <>
                  <button className="py-3 rounded-xl border-2 border-line hover:border-primary font-medium text-xs bg-bg text-ink-4 hover:text-primary transition-all">Assign Shift</button>
                  <button className="py-3 rounded-xl border-2 border-line font-medium text-xs bg-white text-ink-4 hover:border-ink-4 hover:text-ink transition-all flex flex-col items-center justify-center gap-1">
                    <Coffee size={14} /> Weekend / Off
                  </button>
                </>
              )}
            </div>
          </div>
          <Button variant="primary" className="w-full mt-2 py-3" onClick={onClose}>Save & Update Schedule</Button>
        </div>
      </Card>
    </div>
  );
};

/* ── Trip Details Modal ───────────────────────────────────────────────── */
const TripDetailsModal = ({ trip, drivers, onClose }: { trip: any; drivers: any[]; onClose: () => void }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedTime, setEditedTime] = useState(trip?.scheduledTime ? trip.scheduledTime.slice(11, 16) : '');
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [editedDriverId, setEditedDriverId] = useState(trip?.driverId || '');

  const driver = (drivers || []).find(d => String(d?.id) === String(editedDriverId));
  const canEdit = !['completed', 'cancelled', 'in_trip', 'en_route', 'arrived'].includes(trip.status);

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-line-2 bg-bg relative">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <TripStatusBadge status={trip.status} />
            <div>
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                Trip #{trip.id}
                {trip.rating && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp size={12} /> ★ {trip.rating}</span>}
              </h2>
              <p className="text-xs text-ink-4 mt-1">Submitted: {trip.submittedTime ? formatDateTime(trip.submittedTime) : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && !editMode && !cancelMode && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Modify Trip</Button>
                <button
                  onClick={() => setCancelMode(true)}
                  className="px-4 py-2 bg-urgent/10 text-urgent border border-urgent/20 rounded-xl text-xs font-medium hover:bg-urgent hover:text-white transition-all shadow-sm"
                >
                  Cancel Trip
                </button>
              </>
            )}
            {editMode && (
              <Button variant="primary" size="sm" onClick={() => {
                trip.driverId = editedDriverId;
                trip.scheduledTime = trip.scheduledTime.slice(0, 11) + editedTime + trip.scheduledTime.slice(16);
                if (trip.status === 'pending_review' || !trip.status) trip.status = 'assigned';
                setEditMode(false);
                toast.success('Trip modified successfully');
              }}>Save Changes</Button>
            )}
            {cancelMode && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                <input
                  placeholder="Reason for cancellation..."
                  className="bg-white border border-urgent/30 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-urgent/10 min-w-[200px]"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <Button variant="primary" className="bg-urgent hover:bg-urgent/90" size="sm" onClick={() => {
                  if (!cancelReason) return toast.error('Please provide a reason');
                  trip.status = 'cancelled';
                  trip.cancelReason = cancelReason;
                  setCancelMode(false);
                  toast.success('Trip cancelled successfully');
                }}>Confirm</Button>
                <button onClick={() => setCancelMode(false)} className="p-2 text-ink-4 hover:text-ink"><X size={16} /></button>
              </div>
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-line-2 hover:bg-line-2 hover:text-ink transition-colors text-ink-4 shadow-sm">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

          {trip.cancelReason && (
            <div className="mb-6 bg-urgent-light/40 border border-urgent/20 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="text-urgent shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-medium text-urgent mb-1">Cancellation Reason</p>
                <p className="text-sm font-medium text-ink">{trip.cancelReason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Col: Trip Details & Rider Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Trip Overview */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                  <Calendar size={14} /> Trip Overview
                </h3>

                {editMode && (
                  <div className="mb-5 p-4 bg-primary-tint/10 rounded-xl border border-primary/20">
                    <label className="block text-xs font-bold text-ink-3 mb-1">Reschedule Time</label>
                    <input
                      type="time"
                      value={editedTime}
                      onChange={(e) => setEditedTime(e.target.value)}
                      className="w-full max-w-xs bg-white border border-line rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-ink-4 mb-1">Source / County</p>
                    <p className="text-sm font-medium text-ink truncate">{trip.source || 'VA County'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4 mb-1">Pickup Time</p>
                    <p className="text-sm font-medium text-ink">{trip.requestedPickup || (trip.scheduledTime ? formatTime(trip.scheduledTime) : 'N/A')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4 mb-1">Appointment</p>
                    <p className="text-sm font-medium text-primary">{trip.appointmentTime || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4 mb-1">Trip Type</p>
                    <p className="text-sm font-medium text-ink">{tripTypeLabel(trip.type)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-4 mb-1">Reason</p>
                    <p className="text-sm font-medium text-ink">{trip.reason || 'Medical Visit'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-4 mb-1">Est. Distance</p>
                    <p className="text-sm font-medium text-ink">{trip.distance || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-4 mb-1">Est. Duration</p>
                    <p className="text-sm font-medium text-ink">{trip.duration || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-4 mb-1">Return Type</p>
                    <p className="text-sm font-medium text-ink capitalize">{trip.returnType ? trip.returnType.replace('_', ' ') : 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Route Anatomy */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                  <Navigation size={14} /> Route & Timeline
                </h3>

                <div className="relative pl-4 space-y-6">
                  <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-line-2"></div>

                  <div className="relative z-10 flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-ink-4 mb-0.5">Pickup Location</p>
                        {trip.actualPickup && <Badge variant="neutral" className="text-xs">Actual: {trip.actualPickup}</Badge>}
                      </div>
                      <p className="text-sm font-medium text-ink leading-snug max-w-lg">{trip.pickup}</p>
                    </div>
                  </div>

                  {trip.stop && (
                    <div className="relative z-10 flex gap-4">
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-accent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-accent"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-ink-4 mb-0.5">Intermediate Stop</p>
                          {trip.actualStop && <Badge variant="neutral" className="text-xs">Actual: {trip.actualStop}</Badge>}
                        </div>
                        <p className="text-sm font-medium text-ink leading-snug max-w-lg">{trip.stop}</p>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-urgent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <MapPin size={10} className="text-urgent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-ink-4 mb-0.5">Drop-off Location</p>
                        {trip.actualDropoff ? <Badge variant="neutral" className="text-xs">Actual: {trip.actualDropoff}</Badge> : trip.actualArrived ? <Badge variant="neutral" className="text-xs">Arrived: {trip.actualArrived}</Badge> : null}
                      </div>
                      <p className="text-sm font-medium text-ink leading-snug max-w-lg">{trip.dropoff}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rider Info */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                  <User size={14} /> Rider Information
                </h3>

                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-4 border-r border-line-2 pr-6">
                    <Avatar initials={trip?.rider?.initials || '?'} size="lg" />
                    <div>
                      <h4 className="text-base font-semibold text-ink">{trip?.rider?.name || 'Unknown Rider'}</h4>
                      <p className="text-xs text-ink-4 mt-0.5 font-medium">{trip?.rider?.phone || 'No phone provided'}</p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Age</p>
                      <p className="text-sm text-ink">{trip?.rider?.age || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Mobility Need</p>
                      <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                        <Badge variant="primary">{trip?.mobility || 'Ambulatory'}</Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Passengers</p>
                      <p className="text-sm text-ink">{trip?.passengers || 1}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Escort/Attendant</p>
                      <p className="text-sm text-ink">{trip?.escort || 'None'}</p>
                    </div>
                  </div>
                </div>

                {trip.notes && (
                  <div className="mt-5 p-4 bg-bg rounded-xl border border-line-2">
                    <p className="text-xs text-ink-4 mb-1">Special Instructions / Notes</p>
                    <p className="text-sm font-medium text-ink">{trip.notes}</p>
                  </div>
                )}
              </section>

            </div>

            {/* Right Col: Driver & Financials */}
            <div className="space-y-6">

              {/* Driver Assignment */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                    <Truck size={14} /> Fleet & Driver
                  </h3>
                  {editMode && <Badge variant="warning">Editing</Badge>}
                </div>

                {editMode ? (
                  <div className="space-y-2">
                    {drivers.slice(0, 5).map(d => (
                      <button
                        key={d.id}
                        onClick={() => setEditedDriverId(d.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${editedDriverId === d.id ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'hover:bg-bg border-line-2'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar initials={d.initials} size="xs" />
                          <div className="text-left">
                            <p className="text-xs font-bold leading-tight">{d.name}</p>
                            <p className="text-xs font-medium opacity-80">{d.vehicle.type}</p>
                          </div>
                        </div>
                        {editedDriverId === d.id && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  driver ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={driver.initials} size="md" online={driver.onDuty} />
                        <div>
                          <p className="text-base font-semibold text-ink">{driver.name}</p>
                          <p className="text-xs text-ink-4 font-medium">{driver.phone}</p>
                        </div>
                      </div>

                      <div className="bg-bg rounded-xl p-3 border border-line-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-4">Vehicle Type</span>
                          <span className="text-xs text-ink">{driver.vehicle.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-4">Plate Number</span>
                          <span className="text-xs font-mono text-ink bg-white px-2 py-0.5 rounded border border-line">{driver.vehicle.plate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-4">Driver Rating</span>
                          <span className="text-xs text-ink">★ {driver.rating}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" icon={Phone}>Call</Button>
                        <Button variant="outline" size="sm" icon={MessageSquare}>Message</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center bg-bg/50 border border-dashed border-line-2 rounded-xl">
                      <Car size={32} className="text-ink-4 mb-3 opacity-50" />
                      <p className="text-sm font-medium text-ink mb-1">Unassigned Request</p>
                      <p className="text-xs text-ink-4 mb-4">No driver has been assigned yet.</p>
                      {canEdit && <Button variant="primary" size="sm" onClick={() => setEditMode(true)}>Assign Driver</Button>}
                    </div>
                  )
                )}
              </section>

              {/* Financial & Billing */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                  <CreditCard size={14} /> Billing & Payment
                </h3>

                <div className="space-y-4">
                  <div className="flex items-end justify-between bg-bg p-4 rounded-xl border border-line-2">
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Total Trip Cost</p>
                      <p className="text-2xl font-semibold text-primary leading-none">{money(trip.cost)}</p>
                    </div>
                    <Badge variant={trip.paymentStatus === 'Paid' || trip.paymentStatus === 'Approved' || trip.paymentStatus === 'charged' ? 'accent' : 'warning'}>
                      {trip.paymentStatus || 'Pending'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">Patient Copay</p>
                      <p className="text-lg font-semibold text-ink">{money(trip.copay || 0)}</p>
                    </div>
                    <div className="border-l border-primary/20 pl-4">
                      <p className="text-xs font-medium text-primary mb-1">Cost to County</p>
                      <p className="text-lg font-semibold text-ink">{money(trip.costToCounty || trip.cost || 0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Payment Method</p>
                      <p className="text-sm text-ink truncate" title={trip.paymentMethod || 'N/A'}>{trip.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Authorization ID</p>
                      <p className="text-sm font-mono text-ink truncate" title={trip.authorizationId || trip.authId || 'N/A'}>{trip.authorizationId || trip.authId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Logs / Audits */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                  <Shield size={14} /> Audit Trail
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-line-2 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-xs font-medium text-ink-3">Trip submitted by <span className="font-bold text-ink">Dispatcher Portal</span></p>
                      <p className="text-xs text-ink-4">{trip.submittedTime ? formatDateTime(trip.submittedTime) : 'N/A'}</p>
                    </div>
                  </div>
                  {trip.driverId && (
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-xs font-medium text-ink-3">Assigned to <span className="font-bold text-ink">{driver?.name || trip.driverId}</span></p>
                        <p className="text-xs text-ink-4">System Auto-log</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Trip History Page Component ────────────────────────────────── */
const TripHistory = ({ role }: { role?: string | null }) => {
  const { trips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();
  const { vehicles, loading: fleetLoading } = useFleet();

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = location.pathname.includes('/schedule') ? 'schedule' : (searchParams.get('tab') || 'trips');

  /* ── Trip Archive States ── */
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ── Schedule States ── */
  const [scheduleActiveTab, setScheduleActiveTab] = useState('driver');
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCell, setEditingCell] = useState<any>(null);

  const loading = tripsLoading || driversLoading || fleetLoading;

  // Process week dates for schedule
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - TODAY_IDX + weekOffset * 7);
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth();
  };

  // Fleet structure mapping for schedule
  const scheduleFleet = (vehicles || []).map((v: any) => ({
    id: v.id,
    plate: v.plate,
    make: v.make,
    type: v.type,
    image: v.image,
    status: v.status === 'maintenance' || v.status === 'urgent' ? 'maintenance' : 'active',
  }));

  const scheduleItems = scheduleActiveTab === 'driver' ? (drivers || []) : scheduleFleet;
  const filteredSchedule = scheduleItems.filter((item: any) => {
    const q = scheduleSearchTerm.toLowerCase();
    if (scheduleActiveTab === 'driver') return item.name.toLowerCase().includes(q) || item.vehicle?.plate?.toLowerCase().includes(q);
    return item.plate.toLowerCase().includes(q) || item.make.toLowerCase().includes(q);
  });

  const onDutyCount = (drivers || []).filter((d: any) => d?.onDuty).length;
  const offDutyCount = (drivers || []).length - onDutyCount;

  // Process filter logic for Trips Archive
  const historyTrips = (trips || []).filter((t: any) => t?.status !== 'pending_review');
  const filteredTrips = historyTrips.filter((trip: any) => {
    const matchesSearch = !search ||
      (trip?.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (trip?.rider?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (trip?.passengerId || '').toLowerCase().includes(search.toLowerCase()) ||
      (trip?.authorizationId || trip?.authId || '').toLowerCase().includes(search.toLowerCase()) ||
      (trip?.source || '').toLowerCase().includes(search.toLowerCase()) ||
      (trip?.pickup || '').toLowerCase().includes(search.toLowerCase()) ||
      (trip?.dropoff || '').toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (filter !== 'all') {
      if (filter === 'active') matchesStatus = ['assigned', 'confirmed', 'en_route', 'arrived', 'in_trip'].includes(trip.status);
      else if (filter === 'completed') matchesStatus = trip.status === 'completed';
      else if (filter === 'cancelled') matchesStatus = trip.status === 'cancelled';
    }

    let matchesTime = true;
    if (timeFilter !== 'all') {
      const tripDate = new Date(trip.scheduledTime);
      tripDate.setHours(0, 0, 0, 0);

      if (timeFilter === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (tripDate < start) matchesTime = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (tripDate > end) matchesTime = false;
        }
      } else {
        const now = new Date();
        const isTodayVal = tripDate.toDateString() === now.toDateString();

        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        const isTomorrow = tripDate.toDateString() === tomorrow.toDateString();

        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const isThisWeek = tripDate >= startOfWeek && tripDate <= endOfWeek;
        const isThisMonth = tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();

        if (timeFilter === 'today') matchesTime = isTodayVal;
        else if (timeFilter === 'tomorrow') matchesTime = isTomorrow;
        else if (timeFilter === 'week') matchesTime = isThisWeek;
        else if (timeFilter === 'month') matchesTime = isThisMonth;
      }
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
    if (sortBy === 'oldest') return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    if (sortBy === 'rider') return (a?.rider?.name || '').localeCompare(b?.rider?.name || '');
    return 0;
  });

  const totalPages = Math.ceil(sortedTrips.length / itemsPerPage);
  const paginatedTrips = sortedTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedTrip = selectedTripId ? (trips || []).find((t: any) => t?.id === selectedTripId) : null;

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedTrips.length) setSelectedIds([]);
    else setSelectedIds(paginatedTrips.map((t: any) => t.id));
  };

  const toggleSelect = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExport = () => {
    const tripsToExport = selectedIds.length > 0
      ? trips.filter((t: any) => selectedIds.includes(t.id))
      : sortedTrips;

    if (tripsToExport.length === 0) return;

    const headers = ['Trip ID', 'Source', 'Passenger ID', 'Auth ID', 'Date', 'Time', 'Rider Name', 'Driver Name', 'Pickup', 'Dropoff', 'Status', 'Total Cost', 'Copay', 'Cost to County', 'Type'];

    const rows = tripsToExport.map((trip: any) => [
      trip.id,
      `"${trip.source || 'N/A'}"`,
      `"${trip.passengerId || 'N/A'}"`,
      `"${trip.authorizationId || trip.authId || 'N/A'}"`,
      formatShortDate(trip.scheduledTime),
      formatTime(trip.scheduledTime),
      trip?.rider?.name || 'Unknown',
      drivers.find((d: any) => String(d.id) === String(trip.driverId))?.name || 'Unassigned',
      `"${trip.pickup}"`,
      `"${trip.dropoff}"`,
      trip.status,
      trip.cost || 0,
      trip.copay || 0,
      trip.costToCounty || trip.cost || 0,
      trip.type
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LOGISS_Trips_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSelectedIds([]);
  };

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
    <div className="space-y-8 animate-in fade-in duration-500">
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
        />
      )}

      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {activeTab === 'trips' ? (
          <div>
            <h1 className="text-2xl font-semibold text-ink">Trip History</h1>
            <p className="text-sm text-ink-4 mt-0.5">Archived and active records for LOGISS fleet</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-ink">Fleet Schedule</h1>
            <p className="text-sm text-ink-4 mt-0.5">Coordinate shifts, vehicle availability, and operator assignments</p>
          </div>
        )}

        {activeTab === 'trips' ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>Export CSV</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-xl border border-line-2 bg-white hover:bg-bg flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-4 py-2 bg-white border border-line-2 rounded-xl text-xs font-medium text-ink min-w-[130px] text-center shadow-sm">
              {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </div>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="w-8 h-8 rounded-xl border border-line-2 bg-white hover:bg-bg flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex items-center gap-1 bg-bg/60 p-0.5 rounded-xl w-fit shadow-sm border border-line-2/40">
        <button
          onClick={() => setSearchParams({ tab: 'trips' })}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'trips'
              ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
              : 'text-ink-4 hover:text-ink'
          }`}
        >
          <Truck size={14} />
          Trip Archive
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'schedule' })}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'schedule'
              ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
              : 'text-ink-4 hover:text-ink'
          }`}
        >
          <Calendar size={14} />
          Driver & Fleet Shifts
        </button>
      </div>

      {/* ────────────────── TRIP HISTORY TAB VIEW ────────────────── */}
      {activeTab === 'trips' && (
        <Card className="overflow-hidden border-line-2 shadow-sm">
          <div className="p-6 border-b border-line-2 bg-bg/30 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1 max-w-2xl relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" size={20} />
                <input
                  type="text"
                  placeholder="Search trips, riders, or locations..."
                  className="w-full bg-white border border-line rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-4 whitespace-nowrap">Time Period</span>
                    <select
                      value={timeFilter}
                      onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-white border border-line rounded-xl py-2.5 px-4 text-xs font-medium text-ink focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer h-10 min-w-[140px]"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {timeFilter === 'custom' && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="bg-white border border-line rounded-xl py-2 px-3 text-xs font-medium text-ink focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none h-10 shadow-sm cursor-pointer"
                        title="Start Date"
                      />
                      <span className="text-xs text-ink-4">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="bg-white border border-line rounded-xl py-2 px-3 text-xs font-medium text-ink focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none h-10 shadow-sm cursor-pointer"
                        title="End Date"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-4 whitespace-nowrap">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-line rounded-xl py-2.5 px-4 text-xs font-medium text-ink focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer h-10 min-w-[140px]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rider">Rider Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-start gap-6 pt-2">
              <div className="flex items-center gap-2 bg-bg p-1.5 rounded-xl border border-line shadow-inner">
                {['all', 'active', 'completed', 'cancelled'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setCurrentPage(1); }}
                    className={`px-5 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-white shadow-md text-primary' : 'text-ink-4 hover:text-ink hover:bg-white/50'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg/50 border-b border-line-2">
                  <th className="pl-6 pr-3 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedTrips.length && paginatedTrips.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Trip ID</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Date & Pickup</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Rider</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Driver</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Route</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Type</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-right">Financials</th>
                  <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-center">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {paginatedTrips.map(trip => (
                  <tr
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`hover:bg-primary-tint/20 transition-colors group cursor-pointer ${selectedIds.includes(trip.id) ? 'bg-primary-tint/10' : ''}`}
                  >
                    <td className="pl-6 pr-3 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(trip.id)}
                        onChange={(e) => toggleSelect(trip.id, e)}
                        className="w-4 h-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-ink-3 whitespace-nowrap">#{trip.id}</span>
                        {trip.source && <span className="text-xs text-ink-4 whitespace-nowrap">{trip.source}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-ink whitespace-nowrap">{formatShortDate(trip.scheduledTime)}</span>
                        <span className="text-xs font-semibold text-ink">Pickup: {trip.requestedPickup || formatTime(trip.scheduledTime)}</span>
                        <span className="text-xs text-ink-4">Appt: {trip.appointmentTime || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={trip.rider.initials} size="xs" />
                        <span className="text-xs font-medium text-ink whitespace-nowrap">{trip.rider.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {trip.driverId ? (
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          <Avatar initials={(drivers || []).find((d: any) => String(d?.id) === String(trip?.driverId))?.initials} size="xs" />
                          <span className="text-xs font-medium text-ink whitespace-nowrap">{(drivers || []).find((d: any) => String(d?.id) === String(trip?.driverId))?.name}</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTripId(trip.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all text-xs font-medium"
                        >
                          <UserPlus size={12} /> Assign
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                        <span className="text-xs font-semibold text-ink max-w-[120px] truncate">{trip.pickup || '---'}</span>

                        {/* Intermediate Stop Indicator */}
                        {(trip.stop || (trip.stops && trip.stops.length > 0)) ? (
                          <div className="flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-full bg-warning/10 border border-warning/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                            <span className="text-xs font-medium text-warning-dark whitespace-nowrap">
                              {Array.isArray(trip.stops) ? `+${trip.stops.length} Stop${trip.stops.length > 1 ? 's' : ''}` : '+1 Stop'}
                            </span>
                          </div>
                        ) : (
                          <ArrowRight size={12} className="text-ink-4 shrink-0 mx-1" />
                        )}

                        <MapPin size={13} className="text-urgent shrink-0" />
                        <span className="text-xs font-semibold text-ink-2 max-w-[120px] truncate">{trip.dropoff || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5">{trip.mobility || 'Standard'}</Badge>
                        <div className="flex items-center gap-1 text-[10px] text-ink-4">
                          {trip.type === 'round_trip' ? (
                            <>
                              <Repeat size={10} className="text-indigo-500" strokeWidth={2.5} />
                              <span className="text-indigo-600/80">Round Trip</span>
                            </>
                          ) : (
                            <>
                              <MoveRight size={10} className="text-blue-500" strokeWidth={2.5} />
                              <span className="text-blue-600/80">One Way</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-xs font-medium text-ink">{money(trip.cost)}</span>
                        <div className="flex items-center gap-1.5 opacity-80">
                           <span className="font-mono text-xs font-medium text-ink-4">Co: {money(trip.copay || 0)}</span>
                           <span className="font-mono text-xs font-medium text-ink-4">Cty: {money(trip.costToCounty || trip.cost || 0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={16} className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTrips.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
            {filteredTrips.length === 0 && !loading && (
              <div className="p-12 text-center text-ink-4">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium text-ink">No trips found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ────────────────── SHIFT SCHEDULE TAB VIEW ────────────────── */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Total Drivers', value: (drivers || []).length, color: 'bg-primary-light text-primary' },
              { icon: CheckCircle2, label: 'On Duty Today', value: onDutyCount, color: 'bg-accent-light text-accent' },
              { icon: Coffee, label: 'Off Duty Today', value: offDutyCount, color: 'bg-bg border text-ink-3' },
              { icon: Truck, label: 'Fleet Vehicles', value: (vehicles || []).length, color: 'bg-primary-light text-primary' },
            ].map(s => (
              <Card key={s.label} className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-ink-4">{s.label}</p>
                  <p className="text-2xl font-semibold text-ink mt-0.5">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-2/50 pb-3">
            <div className="flex bg-bg/60 p-0.5 rounded-xl border border-line-2/45 w-fit">
              {[
                { id: 'driver', label: 'Driver Schedule', icon: Users },
                { id: 'fleet', label: 'Fleet Schedule', icon: Truck },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setScheduleActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                    scheduleActiveTab === tab.id
                      ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
                      : 'text-ink-4 hover:text-ink'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                className="pl-9 pr-4 py-2.5 text-xs font-medium bg-bg/60 focus:bg-white rounded-xl w-56 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                placeholder={scheduleActiveTab === 'driver' ? 'Search driver…' : 'Search plate…'}
                value={scheduleSearchTerm}
                onChange={e => setScheduleSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="grid border-b border-line-2/40 bg-bg/20" style={{ gridTemplateColumns: '220px repeat(7, 1fr)' }}>
              <div className="px-4 py-3 border-r border-line-2/30">
                <p className="text-xs text-ink-4">
                  {scheduleActiveTab === 'driver' ? 'Driver' : 'Vehicle'}
                </p>
              </div>
              {weekDates.map((d, i) => (
                <div
                  key={i}
                  className={`px-3 py-3 text-center border-r border-line-2/30 last:border-r-0 ${isToday(d) ? 'bg-primary-tint/20' : ''}`}
                >
                  <p className={`text-xs font-medium ${isToday(d) ? 'text-primary' : 'text-ink-4'}`}>
                    {DAYS[i]}
                  </p>
                  <p className={`text-sm font-semibold mt-0.5 ${isToday(d) ? 'text-primary' : 'text-ink'}`}>
                    {d.getDate()}
                  </p>
                  {isToday(d) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>

            <div className="divide-y divide-line-2/40">
              {filteredSchedule.length === 0 && !loading && (
                <div className="py-16 text-center text-sm text-ink-4">
                  No results match your search.
                </div>
              )}

              {filteredSchedule.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="grid hover:bg-bg/30 transition-colors group"
                  style={{ gridTemplateColumns: '220px repeat(7, 1fr)' }}
                >
                  <div className="px-4 py-3 border-r border-line-2/30 flex items-center gap-3 bg-white group-hover:bg-bg/10 transition-colors">
                    {scheduleActiveTab === 'driver' ? (
                      <>
                        <Avatar initials={item.initials} size="sm" online={item.onDuty} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                          <p className="text-xs text-ink-4 truncate">{item.vehicle?.type}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border overflow-hidden ${
                          item.status === 'active' ? 'bg-accent-light text-accent border-accent/10' : 'bg-urgent-light text-urgent border-urgent/10'
                        }`}>
                          {item.image ? (
                            <img src={item.image} alt={item.plate} className="w-full h-full object-cover" />
                          ) : (
                            <Truck size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink truncate">{item.plate}</p>
                          <p className="text-xs text-ink-4 truncate">{item.make} · {item.type}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {weekDates.map((d, dayIdx) => {
                    const shift = getShift(idx, dayIdx);
                    return (
                      <div
                        key={dayIdx}
                        onClick={() => setEditingCell({ item, date: d })}
                        className={`px-2 py-2 border-r border-line-2/30 last:border-r-0 min-h-[72px] flex flex-col justify-center cursor-pointer hover:bg-bg transition-colors ${
                          isToday(d) ? 'bg-primary-tint/10' : ''
                        }`}
                      >
                        {shift ? (
                          <div className={`rounded-lg border px-2 py-1.5 text-xs font-medium leading-tight ${shiftStyle[shift.color]}`}>
                            <div className="flex items-center gap-1 mb-1 opacity-70">
                              <Clock size={9} />
                              <span className="whitespace-pre-line text-[10px]">{shift.time}</span>
                            </div>
                            <p className="font-medium">{shift.label}</p>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <span className="text-xs text-ink-4">Off</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-4 px-1">
            <div className="flex flex-wrap items-center gap-5">
              {[
                { color: 'bg-primary', label: 'Heavy (8+ Trips)' },
                { color: 'bg-warning', label: 'Split (4+ Trips)' },
                { color: 'bg-accent', label: 'Normal (5+ Trips)' },
                { color: 'bg-line', label: 'Off Day' },
                { color: 'bg-ink-4', label: 'Leave / Maintenance' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-xs text-ink-4">{l.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-4">Last sync: Just now</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripHistory;
