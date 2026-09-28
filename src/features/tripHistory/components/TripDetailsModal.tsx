import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  X, TrendingUp, Calendar, Navigation, User, Truck, CreditCard, Shield,
  MapPin, Phone, MessageSquare, Car, XCircle, Lock, Pencil, Plus, Trash2, Link2, Camera
} from 'lucide-react';
import { Badge, Avatar, TripStatusBadge, Button } from '@/shared/components/ui';
import { formatTime, formatDateTime, tripTypeLabel, money } from '../../../utils/helpers';
import { isMongoId } from '../../bookings/utils/helpers';
import { PRICING_METHOD_LABELS, quoteFares, quotePenalty, type PricingMethod } from '@/hooks/usePricing';

interface TripDetailsModalProps {
  trip: any;
  drivers: any[];
  onClose: () => void;
  /** Persist edits (id, patch). Wired to useTrips().updateTrip. */
  onUpdate?: (id: string, patch: Record<string, any>) => void;
  /** Open directly in edit mode (used by the Bookings Edit / Assign action). */
  startInEdit?: boolean;
}

const INPUT = 'w-full bg-white border border-line-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

// "10:15 AM" / "13:05" → "HH:MM" (24h) for <input type="time">.
const to24h = (val?: string): string => {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};
// "HH:MM" → "h:MM AM/PM" for storage/display consistency with the rest of the app.
const to12h = (hhmm?: string): string => {
  if (!hhmm) return '';
  const m = String(hhmm).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(hhmm);
  let h = parseInt(m[1], 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};
const numFrom = (v?: string): string => {
  const m = String(v ?? '').match(/[\d.]+/);
  return m ? m[0] : '';
};

export const TripDetailsModal = ({ trip, drivers, onClose, onUpdate, startInEdit = false }: TripDetailsModalProps) => {
  const [editMode, setEditMode] = useState(startInEdit);
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [performMode, setPerformMode] = useState(false);
  const [performMiles, setPerformMiles] = useState(
    trip?.miles != null ? String(trip.miles) : numFrom(trip?.distance)
  );
  const [performNote, setPerformNote] = useState('');

  const formatLocField = (loc: any): string => {
    if (loc == null || loc === '') return '';
    if (Array.isArray(loc)) return loc.filter((x: any) => x != null && x !== '').join(', ');
    return String(loc);
  };

  const initialDriverId = trip?.driverId
    ? (typeof trip.driverId === 'object' ? trip.driverId._id || trip.driverId.id : String(trip.driverId))
    : '';

  const initialTime = to24h(trip?.pickupTime || trip?.requestedPickup) ||
    (trip?.scheduledTime ? String(trip.scheduledTime).slice(11, 16) : '');

  const isRound = String(trip?.tripType || trip?.type || '').toLowerCase().includes('round');
  const userObj = typeof trip?.userId === 'object' && trip?.userId ? (trip.userId as any) : null;
  const initialPhone = trip?.rider?.phone || (userObj?.phone || userObj?.contact) || trip?.rider?.contact || trip?.phone || '';

  const [form, setForm] = useState({
    scheduledDate: trip?.serviceDate || (trip?.scheduledTime ? String(trip.scheduledTime).slice(0, 10) : ''),
    scheduledTimeOfDay: initialTime,
    requestedPickup: initialTime,
    appointmentTime: to24h(trip?.appointmentTime),
    returnTime: to24h(trip?.returnTime || trip?.returnPickup),
    type: isRound ? 'round-trip' : 'one-way',
    reason: trip?.tripReason || trip?.reason || '',
    source: trip?.programContext || trip?.source || '',
    pickup: formatLocField(trip?.pickupLocation || trip?.pickup),
    stops: (Array.isArray(trip?.stops) ? trip.stops.map((s: any) => formatLocField(s)) : (trip?.stopAddress ? (Array.isArray(trip.stopAddress) ? trip.stopAddress.map(formatLocField) : [formatLocField(trip.stopAddress)]) : (trip?.stop ? [formatLocField(trip.stop)] : []))) as string[],
    dropoff: formatLocField(trip?.dropOffLocation || trip?.dropoff),
    phone: initialPhone,
    age: trip?.rider?.age ?? '',
    mobility: trip?.mobility || (typeof trip?.mobilityRequirements === 'string' && !isMongoId(trip?.mobilityRequirements) ? trip?.mobilityRequirements : trip?.mobilityRequirements?.name) || 'Ambulatory',
    mobilityId: trip?.mobilityRequirementsId || trip?.mobilityId || (typeof trip?.mobilityRequirements === 'object' ? trip?.mobilityRequirements?._id : (isMongoId(trip?.mobilityRequirements) ? trip?.mobilityRequirements : '')),
    passengers: trip?.passengerSeats ?? trip?.passengers ?? 1,
    escort: trip?.escort || '',
    notes: trip?.tripNote || trip?.notes || '',
    privateNotes: trip?.internalPrivateNote || trip?.privateNotes || '',
    cost: trip?.price ?? trip?.fundingSourceCharge ?? trip?.cost ?? 0,
    driverId: initialDriverId,
  });

  const set = (k: string, v: any) => setForm(f => {
    const updated = { ...f, [k]: v };
    if (k === 'scheduledTimeOfDay') {
      updated.requestedPickup = v;
    } else if (k === 'requestedPickup') {
      updated.scheduledTimeOfDay = v;
    }
    return updated;
  });
  const setStop = (i: number, v: string) => setForm(f => ({ ...f, stops: f.stops.map((s, idx) => (idx === i ? v : s)) }));
  const addStop = () => setForm(f => ({ ...f, stops: [...f.stops, ''] }));
  const removeStop = (i: number) => setForm(f => ({ ...f, stops: f.stops.filter((_, idx) => idx !== i) }));

  const driver = (drivers || []).find(d => String(d?.id) === String(form.driverId));

  const numF = (v: any) => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; };

  const auditEvents: any[] = Array.isArray(trip?.auditTrail) && trip.auditTrail.length
    ? trip.auditTrail
    : [
        {
          id: 'legacy-created',
          at: trip?.submittedTime || trip?.scheduledTime,
          by: 'Dispatcher Portal',
          action: 'created',
          summary: 'Trip submitted by Dispatcher Portal',
        },
        ...(driver
          ? [{
              id: 'legacy-assign',
              at: trip?.submittedTime || trip?.scheduledTime,
              by: 'System',
              action: 'assigned',
              summary: `Assigned to ${driver.name}`,
            }]
          : []),
      ];

  const isRoundTripLeg = trip?.type === 'round-trip' || trip?.type === 'round_trip' || trip?.linkedLegId || trip?.legIndex;
  const legIndex = trip?.legIndex || 1;
  const legTotal = trip?.linkedLegId || isRoundTripLeg ? 2 : 1;

  const handleSave = () => {
    const scheduledTimeOfDayVal = form.scheduledTimeOfDay || form.requestedPickup;
    const scheduledTime = form.scheduledDate && scheduledTimeOfDayVal
      ? `${form.scheduledDate}T${scheduledTimeOfDayVal}:00`
      : trip?.scheduledTime || trip?.serviceDate;

    const nowIso = new Date().toISOString();
    const newAudit = [...auditEvents];

    const driverChanged = String(form.driverId || '') !== String(initialDriverId || '');
    if (driverChanged && form.driverId) {
      const newDriver = (drivers || []).find(d => String(d?.id) === String(form.driverId));
      newAudit.push({
        id: `evt-${Date.now()}-assign`,
        at: nowIso,
        by: 'Admin Console',
        action: 'assigned',
        summary: `Assigned to ${newDriver?.name || form.driverId}`,
      });
    }

    const priceNum = numF(form.cost);

    const patch: Record<string, any> = {
      scheduledDate: form.scheduledDate,
      serviceDate: form.scheduledDate,
      scheduledTime,
      requestedPickup: to12h(scheduledTimeOfDayVal),
      pickupTime: to12h(scheduledTimeOfDayVal),
      appointmentTime: to12h(form.appointmentTime),
      returnTime: form.returnTime ? to12h(form.returnTime) : undefined,
      type: form.type,
      tripType: form.type === 'round-trip' ? 'round-trip' : 'one-way',
      reason: form.reason,
      tripReason: form.reason,
      source: form.source,
      programContext: form.source,
      pickup: form.pickup,
      pickupLocation: form.pickup,
      stops: form.stops.map(s => s.trim()).filter(Boolean),
      stopAddress: form.stops.map(s => s.trim()).filter(Boolean),
      dropoff: form.dropoff,
      dropOffLocation: form.dropoff,
      mobility: form.mobility,
      mobilityId: form.mobilityId,
      mobilityRequirements: form.mobilityId || form.mobility,
      passengers: Number(form.passengers) || 1,
      passengerSeats: Number(form.passengers) || 1,
      escort: form.escort,
      notes: form.notes,
      tripNote: form.notes,
      privateNotes: form.privateNotes,
      internalPrivateNote: form.privateNotes,
      price: priceNum,
      cost: priceNum,
      phone: form.phone,
      auditTrail: newAudit,
      rider: { ...(trip?.rider || {}), phone: form.phone, age: form.age === '' ? undefined : Number(form.age) },
    };

    if (driverChanged) {
      patch.driverId = form.driverId;
      if (form.driverId && (trip.status === 'pending_review' || !trip.status || trip.status === 'pending')) {
        patch.status = 'assigned';
        patch.bookingStatus = 'assigned';
        patch.isApproved = 'approved';
      }
    }

    onUpdate?.(trip.id || trip._id, patch);
    setEditMode(false);
  };


  // Called as a function (not <Field/>) so inputs keep focus across re-renders.
  const Field = ({ label, k, type = 'text', accent = false, options, fmt, step }: { label: string; k: keyof typeof form; type?: string; accent?: boolean; options?: { value: string; label: string }[]; fmt?: (v: string) => string; step?: string }) => {
    const raw = String(form[k] ?? '');
    return (
      <div key={k as string}>
        <p className="text-xs text-ink-4 mb-1">{label}</p>
        {editMode ? (
          options ? (
            <select value={raw} onChange={(e) => set(k as string, e.target.value)} className={`${INPUT} cursor-pointer`}>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} step={step} min={type === 'number' ? '0' : undefined} value={raw} onChange={(e) => set(k as string, e.target.value)} className={`${INPUT}${type === 'time' ? ' w-fit' : ''}`} />
          )
        ) : (
          <p className={`text-sm font-medium ${accent ? 'text-primary' : 'text-ink'} truncate`}>{raw ? (fmt ? fmt(raw) : raw) : <span className="text-ink-4">N/A</span>}</p>
        )}
      </div>
    );
  };

  return createPortal((
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-line-2 bg-bg relative shrink-0">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <TripStatusBadge status={trip.status} />
            <div>
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                Trip #{trip.id}
                {trip.rating && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp size={12} /> ★ {trip.rating}</span>}
              </h2>
              <p className="text-xs text-ink-4 mt-1">Submitted: {trip.submittedTime ? formatDateTime(trip.submittedTime) : 'N/A'}</p>
              {isRoundTripLeg && (
                <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/15 text-xs font-semibold text-primary">
                  <Link2 size={12} />
                  Leg {legIndex} of {legTotal}
                  {trip.legLabel ? ` · ${trip.legLabel}` : ''}
                  {trip.linkedLegId ? ` · linked ${trip.linkedLegId}` : ''}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!editMode && !cancelMode && !performMode && (
              <>
                <Button variant="outline" size="sm" icon={Pencil} onClick={() => setEditMode(true)}>Edit Details</Button>
                {(trip.status === 'no_show' || trip.status === 'cancelled') && (
                  <Button variant="primary" size="sm" onClick={() => setPerformMode(true)}>Complete manually</Button>
                )}
                {trip.status !== 'cancelled' && trip.status !== 'completed' && (
                  <button onClick={() => setCancelMode(true)} className="px-4 py-2 bg-urgent/10 text-urgent border border-urgent/20 rounded-xl text-xs font-medium hover:bg-urgent hover:text-white transition-all shadow-sm">
                    Cancel Trip
                  </button>
                )}
              </>
            )}
            {editMode && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Discard</Button>
                <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
              </>
            )}
            {cancelMode && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                <input placeholder="Reason for cancellation..." className="bg-white border border-urgent/30 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-urgent/10 min-w-[200px]" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <Button variant="primary" className="bg-urgent hover:bg-urgent/90" size="sm" onClick={() => {
                  if (!cancelReason) return toast.error('Please provide a reason');
                  const isNoShow = /no.?show/i.test(cancelReason);
                  const hours = trip?.scheduledTime
                    ? (new Date(trip.scheduledTime).getTime() - Date.now()) / 36e5
                    : undefined;
                  const penalty = quotePenalty({
                    kind: isNoShow ? 'no_show' : 'late_cancel',
                    fundingSourceId: trip.fundingSourceId,
                    fundingSource: trip.fundingSource,
                    hoursBeforePickup: hours,
                    tripDate: trip.scheduledTime,
                  });
                  const nowIso = new Date().toISOString();
                  onUpdate?.(trip.id, {
                    status: isNoShow ? 'no_show' : 'cancelled',
                    cancelReason,
                    passengerCopay: penalty.passengerCopay,
                    copay: penalty.passengerCopay,
                    fundingSourceCharge: penalty.fundingSourceCharge,
                    costToCounty: penalty.fundingSourceCharge,
                    cost: penalty.fundingSourceCharge,
                    auditTrail: [
                      ...auditEvents,
                      {
                        id: `evt-${Date.now()}-cancel`,
                        at: nowIso,
                        by: 'Admin Console',
                        action: isNoShow ? 'no_show' : 'cancelled',
                        reason: cancelReason,
                        summary: penalty.waived ? `${cancelReason} · no charge` : `${cancelReason} · ${penalty.reason}`,
                      },
                    ],
                  });
                  setCancelMode(false);
                  toast.success(isNoShow ? 'Marked no-show' : 'Trip cancelled');
                }}>Confirm</Button>
                <button onClick={() => setCancelMode(false)} className="p-2 text-ink-4 hover:text-ink"><X size={16} /></button>
              </div>
            )}
            {performMode && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPerformMode(false)}>Discard</Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const calc = parseFloat(performMiles) || 0;
                    const quoted = quoteFares({
                      insideCounty: trip.insideCounty,
                      tripType: trip.type,
                      miles: calc,
                      calculatedMiles: calc,
                      mobility: trip.mobility,
                      stops: trip.stops,
                      fundingSourceId: trip.fundingSourceId,
                      fundingSource: trip.fundingSource,
                      tripDate: trip.scheduledTime,
                      pickup: form.pickup || trip.pickup,
                      dropoff: form.dropoff || trip.dropoff,
                    });
                    const nowIso = new Date().toISOString();
                    const priorStatus = trip.status;
                    onUpdate?.(trip.id, {
                      status: 'completed',
                      priorStatus,
                      pickup: form.pickup || trip.pickup,
                      dropoff: form.dropoff || trip.dropoff,
                      driverId: form.driverId || trip.driverId,
                      miles: quoted.billedMiles,
                      calculatedMiles: calc,
                      billingClassId: quoted.billingClassId,
                      billingClassName: quoted.billingClassName,
                      passengerCopay: quoted.passengerCopay,
                      copay: quoted.passengerCopay,
                      fundingSourceCharge: quoted.fundingSourceCharge,
                      costToCounty: quoted.fundingSourceCharge,
                      cost: quoted.fundingSourceCharge,
                      pricingSnapshot: quoted.snapshot,
                      auditTrail: [
                        ...auditEvents,
                        {
                          id: `evt-${Date.now()}-manual-perform`,
                          at: nowIso,
                          by: 'Admin Console',
                          action: 'manual_perform',
                          reason: performNote.trim() || 'Manual complete after prior status',
                          summary: `Completed manually (was ${priorStatus})`,
                          before: {
                            passengerCopay: numF(trip?.passengerCopay ?? trip?.copay),
                            fundingSourceCharge: numF(trip?.fundingSourceCharge ?? trip?.cost),
                          },
                          after: {
                            passengerCopay: quoted.passengerCopay,
                            fundingSourceCharge: quoted.fundingSourceCharge,
                          },
                        },
                      ],
                    });
                    setPerformMode(false);
                    toast.success('Trip completed. Prior status kept in audit.');
                  }}
                >
                  Complete & bill
                </Button>
              </div>
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-line-2 hover:bg-line-2 hover:text-ink transition-colors text-ink-4 shadow-sm">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-bg/40">
          {editMode && (
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5">
              <Pencil size={13} /> Editing mode — update any field except the rider's name, then Save Changes.
            </div>
          )}

          {performMode && (
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-primary">Manual perform — re-quote and mark completed. The previous {trip.status} stays on the audit trail.</p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <p className="text-xs text-ink-4 mb-1">Miles</p>
                  <input className={INPUT} type="number" step="0.1" value={performMiles} onChange={e => setPerformMiles(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs text-ink-4 mb-1">Note</p>
                  <input className={INPUT} value={performNote} onChange={e => setPerformNote(e.target.value)} placeholder="Why this was completed" />
                </div>
              </div>
            </div>
          )}

          {trip.cancelReason && !editMode && (
            <div className="mb-6 bg-urgent-light/40 border border-urgent/20 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="text-urgent shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-medium text-urgent mb-1">Cancellation Reason</p>
                <p className="text-sm font-medium text-ink">{trip.cancelReason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Overview */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4"><Calendar size={14} /> Trip Overview</h3>

                {editMode && (
                  <div className="mb-5 grid grid-cols-2 gap-4 p-4 bg-primary-tint/10 rounded-xl border border-primary/20">
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Scheduled Date</p>
                      <input type="date" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Scheduled Time</p>
                      <input type="time" value={form.scheduledTimeOfDay} onChange={(e) => set('scheduledTimeOfDay', e.target.value)} className={INPUT} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Field({ label: 'Pickup Time', k: 'requestedPickup', type: 'time', fmt: to12h })}
                  {Field({ label: 'Appointment Time', k: 'appointmentTime', type: 'time', accent: true, fmt: to12h })}
                  {form.type === 'round-trip' && Field({ label: 'Return Time', k: 'returnTime', type: 'time', fmt: to12h })}
                  {Field({ label: 'Trip Type', k: 'type', options: [{ value: 'one-way', label: 'One Way' }, { value: 'round-trip', label: 'Round Trip' }] })}
                  {Field({ label: 'Trip Reason', k: 'reason' })}
                  {Field({ label: 'Program Context', k: 'source' })}
                </div>
                {!editMode && <p className="sr-only">{tripTypeLabel(trip.type)}</p>}
              </section>

              {/* Route */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4"><Navigation size={14} /> Route & Timeline</h3>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Pickup Location</p>
                      <input value={form.pickup} onChange={(e) => set('pickup', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-ink-4">Intermediate Stops</p>
                        <button type="button" onClick={addStop} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Plus size={12} /> Add stop</button>
                      </div>
                      {form.stops.length === 0 && <p className="text-xs text-ink-4/70 italic">No stops — direct trip.</p>}
                      <div className="space-y-2">
                        {form.stops.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-ink-4 w-10 shrink-0">Stop {i + 1}</span>
                            <input value={s} onChange={(e) => setStop(i, e.target.value)} className={INPUT} placeholder="Stop address…" />
                            <button type="button" onClick={() => removeStop(i)} className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-colors shrink-0"><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Drop-off Location</p>
                      <input value={form.dropoff} onChange={(e) => set('dropoff', e.target.value)} className={INPUT} />
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-4 space-y-6">
                    <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-line-2" />
                    <div className="relative z-10 flex gap-4">
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><div className="w-2 h-2 rounded-full bg-primary" /></div>
                      <div className="flex-1"><p className="text-xs text-ink-4 mb-0.5">Pickup Location</p><p className="text-sm font-medium text-ink leading-snug max-w-lg">{trip.pickup}</p></div>
                    </div>
                    {((Array.isArray(trip.stops) && trip.stops.length ? trip.stops : (trip.stop ? [trip.stop] : [])) as string[]).map((s, i) => (
                      <div key={i} className="relative z-10 flex gap-4">
                        <div className="w-5 h-5 rounded-full bg-white border-2 border-accent flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><div className="w-1.5 h-1.5 bg-accent" /></div>
                        <div className="flex-1"><p className="text-xs text-ink-4 mb-0.5">Stop {i + 1}</p><p className="text-sm font-medium text-ink leading-snug max-w-lg">{s}</p></div>
                      </div>
                    ))}
                    <div className="relative z-10 flex gap-4">
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-urgent flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin size={10} className="text-urgent" /></div>
                      <div className="flex-1"><p className="text-xs text-ink-4 mb-0.5">Drop-off Location</p><p className="text-sm font-medium text-ink leading-snug max-w-lg">{trip.dropoff}</p></div>
                    </div>
                  </div>
                )}
              </section>

              {/* Rider */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4"><User size={14} /> Rider Information</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-4 sm:border-r border-line-2 sm:pr-6">
                    <Avatar initials={trip?.rider?.initials || '?'} size="lg" />
                    <div>
                      <h4 className="text-base font-semibold text-ink">{trip?.rider?.name || 'Unknown Rider'}</h4>
                      {editMode ? (
                        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={`${INPUT} mt-1`} placeholder="Phone" />
                      ) : (
                        <p className="text-xs text-ink-4 mt-0.5 font-medium">{trip?.rider?.phone || 'No phone provided'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {Field({ label: 'Age', k: 'age', type: 'number' })}
                    <div>
                      <p className="text-xs text-ink-4 mb-1">Mobility Need</p>
                      {editMode ? (
                        <select value={form.mobility} onChange={(e) => set('mobility', e.target.value)} className={`${INPUT} cursor-pointer`}>
                          {['Ambulatory', 'Cane', 'Walker', 'Wheelchair', 'Stretcher'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <Badge variant="primary">{trip?.mobility || 'Ambulatory'}</Badge>
                      )}
                    </div>
                    {Field({ label: 'Passengers', k: 'passengers', type: 'number' })}
                    {Field({ label: 'Escort/Attendant', k: 'escort' })}
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-5 space-y-3">
                  <div className={`p-4 rounded-xl border ${editMode ? 'border-line-2 bg-white' : 'bg-bg border-line-2'}`}>
                    <p className="text-xs text-ink-4 mb-1">Instructions for Driver</p>
                    {editMode ? (
                      <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${INPUT} resize-none`} placeholder="Driver instructions…" />
                    ) : (
                      <p className="text-sm font-medium text-ink">{trip.notes || <span className="text-ink-4">None</span>}</p>
                    )}
                  </div>
                  <div className={`p-4 rounded-xl border ${editMode ? 'border-urgent/20 bg-white' : 'bg-urgent-light/40 border-urgent/20'}`}>
                    <p className="text-xs font-bold text-urgent mb-1 flex items-center gap-1.5"><Lock size={12} /> Internal Private Notes</p>
                    {editMode ? (
                      <textarea value={form.privateNotes} onChange={(e) => set('privateNotes', e.target.value)} rows={2} className={`${INPUT} resize-none`} placeholder="Dispatcher / admin only…" />
                    ) : (
                      <p className="text-sm font-medium text-ink">{trip.privateNotes || <span className="text-ink-4">None</span>}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right */}
            <div className="space-y-6">
              {/* Driver */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Truck size={14} /> Fleet & Driver</h3>
                  {editMode && <Badge variant="warning">Editing</Badge>}
                </div>
                {editMode ? (
                  <select value={form.driverId} onChange={(e) => set('driverId', e.target.value)} className={`${INPUT} cursor-pointer`}>
                    <option value="">Unassigned</option>
                    {(drivers || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : driver ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={driver.initials} size="md" online={driver.onDuty} />
                      <div><p className="text-base font-semibold text-ink">{driver.name}</p><p className="text-xs text-ink-4 font-medium">{driver.phone}</p></div>
                    </div>
                    <div className="bg-bg rounded-xl p-3 border border-line-2 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-xs text-ink-4">Vehicle Type</span><span className="text-xs text-ink">{driver.vehicle?.type}</span></div>
                      <div className="flex items-center justify-between"><span className="text-xs text-ink-4">Plate Number</span><span className="text-xs text-ink bg-white px-2 py-0.5 rounded border border-line">{driver.vehicle?.plate}</span></div>
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
                    <Button variant="primary" size="sm" onClick={() => setEditMode(true)}>Assign Driver</Button>
                  </div>
                )}
              </section>

              {/* Billing */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4"><CreditCard size={14} /> Billing & Price</h3>
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/15">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Trip Price ($)</p>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={String(form.cost)}
                        onChange={(e) => set('cost', e.target.value)}
                        className={INPUT}
                      />
                    ) : (
                      <p className="text-2xl font-bold text-primary">{money(Number(form.cost) || 0)}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Audit */}
              <section className="bg-white rounded-2xl border border-line-2 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4"><Shield size={14} /> Audit Trail</h3>
                <div className="space-y-3">
                  {[...auditEvents].reverse().map((evt: any) => (
                    <div key={evt.id || `${evt.at}-${evt.action}`} className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        evt.action === 'fare_override' ? 'bg-warning' : evt.action === 'assigned' ? 'bg-primary' : 'bg-line'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-3">
                          {evt.summary || evt.action}
                          {evt.by ? <> · <span className="font-medium text-ink">{evt.by}</span></> : null}
                        </p>
                        {evt.reason && (
                          <p className="text-xs text-ink-4 mt-0.5">Reason: {evt.reason}</p>
                        )}
                        {evt.before && evt.after && (
                          <p className="text-xs text-ink-4 mt-0.5">
                            Copay {money(evt.before.passengerCopay)} → {money(evt.after.passengerCopay)} · Payer {money(evt.before.fundingSourceCharge)} → {money(evt.after.fundingSourceCharge)}
                          </p>
                        )}
                        <p className="text-xs text-ink-4">{evt.at ? formatDateTime(evt.at) : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
};
