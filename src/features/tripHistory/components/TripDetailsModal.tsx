import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X, TrendingUp, Calendar, Navigation, User, Truck, CreditCard, Shield,
  MapPin, Phone, MessageSquare, Car, XCircle, CheckCircle2
} from 'lucide-react';
import { Card, Badge, Avatar, TripStatusBadge, Button } from '@/shared/components/ui';
import { formatTime, formatDateTime, tripTypeLabel, money } from '../../../utils/helpers';

export const TripDetailsModal = ({ trip, drivers, onClose }: { trip: any; drivers: any[]; onClose: () => void }) => {
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
                  className="bg-white border border-urgent/30 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-urgent/10 min-w-[200px]"
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
                    <label className="block text-xs text-ink-4 mb-1">Reschedule Time</label>
                    <input
                      type="time"
                      value={editedTime}
                      onChange={(e) => setEditedTime(e.target.value)}
                      className="w-full max-w-xs bg-white border border-line rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><p className="text-xs text-ink-4 mb-1">Source / County</p><p className="text-sm font-medium text-ink truncate">{trip.source || 'VA County'}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Pickup Time</p><p className="text-sm font-medium text-ink">{trip.requestedPickup || (trip.scheduledTime ? formatTime(trip.scheduledTime) : 'N/A')}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Appointment</p><p className="text-sm font-medium text-primary">{trip.appointmentTime || 'N/A'}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Trip Type</p><p className="text-sm font-medium text-ink">{tripTypeLabel(trip.type)}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Reason</p><p className="text-sm font-medium text-ink">{trip.reason || 'Medical Visit'}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Est. Distance</p><p className="text-sm font-medium text-ink">{trip.distance || 'N/A'}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Est. Duration</p><p className="text-sm font-medium text-ink">{trip.duration || 'N/A'}</p></div>
                  <div><p className="text-xs text-ink-4 mb-1">Return Type</p><p className="text-sm font-medium text-ink capitalize">{trip.returnType ? trip.returnType.replace('_', ' ') : 'N/A'}</p></div>
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
                    <div><p className="text-xs text-ink-4 mb-1">Age</p><p className="text-sm text-ink">{trip?.rider?.age || 'N/A'}</p></div>
                    <div><p className="text-xs text-ink-4 mb-1">Mobility Need</p><p className="text-sm font-medium text-ink flex items-center gap-1.5"><Badge variant="primary">{trip?.mobility || 'Ambulatory'}</Badge></p></div>
                    <div><p className="text-xs text-ink-4 mb-1">Passengers</p><p className="text-sm text-ink">{trip?.passengers || 1}</p></div>
                    <div><p className="text-xs text-ink-4 mb-1">Escort/Attendant</p><p className="text-sm text-ink">{trip?.escort || 'None'}</p></div>
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
                            <p className="text-xs font-medium leading-tight">{d.name}</p>
                            <p className="text-xs font-medium opacity-80">{d.vehicle.type}</p>
                          </div>
                        </div>
                        {editedDriverId === d.id && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                ) : driver ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={driver.initials} size="md" online={driver.onDuty} />
                      <div>
                        <p className="text-base font-semibold text-ink">{driver.name}</p>
                        <p className="text-xs text-ink-4 font-medium">{driver.phone}</p>
                      </div>
                    </div>
                    <div className="bg-bg rounded-xl p-3 border border-line-2 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-xs text-ink-4">Vehicle Type</span><span className="text-xs text-ink">{driver.vehicle.type}</span></div>
                      <div className="flex items-center justify-between"><span className="text-xs text-ink-4">Plate Number</span><span className="text-xs font-mono text-ink bg-white px-2 py-0.5 rounded border border-line">{driver.vehicle.plate}</span></div>
                      <div className="flex items-center justify-between"><span className="text-xs text-ink-4">Driver Rating</span><span className="text-xs text-ink">★ {driver.rating}</span></div>
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
                    <div><p className="text-xs font-medium text-primary mb-1">Patient Copay</p><p className="text-lg font-semibold text-ink">{money(trip.copay || 0)}</p></div>
                    <div className="border-l border-primary/20 pl-4"><p className="text-xs font-medium text-primary mb-1">Cost to County</p><p className="text-lg font-semibold text-ink">{money(trip.costToCounty || trip.cost || 0)}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-ink-4 mb-1">Payment Method</p><p className="text-sm text-ink truncate" title={trip.paymentMethod || 'N/A'}>{trip.paymentMethod || 'N/A'}</p></div>
                    <div><p className="text-xs text-ink-4 mb-1">Authorization ID</p><p className="text-sm font-mono text-ink truncate" title={trip.authorizationId || trip.authId || 'N/A'}>{trip.authorizationId || trip.authId || 'N/A'}</p></div>
                  </div>
                </div>
              </section>

              {/* Audit Trail */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-primary mb-4 flex items-center gap-2">
                  <Shield size={14} /> Audit Trail
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-line-2 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-xs font-medium text-ink-3">Trip submitted by <span className="font-medium text-ink">Dispatcher Portal</span></p>
                      <p className="text-xs text-ink-4">{trip.submittedTime ? formatDateTime(trip.submittedTime) : 'N/A'}</p>
                    </div>
                  </div>
                  {trip.driverId && (
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-xs font-medium text-ink-3">Assigned to <span className="font-medium text-ink">{driver?.name || trip.driverId}</span></p>
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
