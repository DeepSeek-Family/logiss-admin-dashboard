import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  X, TrendingUp, Calendar, Navigation, User, Truck, CreditCard, Shield,
  MapPin, Phone, MessageSquare, Car, XCircle, Lock, Pencil, Plus, Trash2, Link2, Camera
} from 'lucide-react';
import { Badge, Avatar, TripStatusBadge, Button } from '@/shared/components/ui';
import { formatTime, formatDateTime, tripTypeLabel, money } from '../../../utils/helpers';
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

  // Editable working copy — everything except the rider's name.
  const [form, setForm] = useState({
    scheduledDate: trip?.scheduledTime ? String(trip.scheduledTime).slice(0, 10) : '',
    scheduledTimeOfDay: trip?.scheduledTime ? String(trip.scheduledTime).slice(11, 16) : '',
    requestedPickup: to24h(trip?.requestedPickup),
    appointmentTime: to24h(trip?.appointmentTime),
    type: trip?.type || 'one_way',
    reason: trip?.reason || '',
    distance: trip?.miles != null ? String(trip.miles) : numFrom(trip?.distance),
    duration: numFrom(trip?.duration),
    returnType: trip?.returnType || '',
    source: trip?.source || '',
    pickup: trip?.pickup || '',
    stops: (Array.isArray(trip?.stops) ? trip.stops.map((s: any) => String(s)) : (trip?.stop ? [String(trip.stop)] : [])) as string[],
    dropoff: trip?.dropoff || '',
    phone: trip?.rider?.phone || '',
    age: trip?.rider?.age ?? '',
    mobility: trip?.mobility || '',
    passengers: trip?.passengers ?? 1,
    escort: trip?.escort || '',
    notes: trip?.notes || '',
    privateNotes: trip?.privateNotes || '',
    cost: trip?.fundingSourceCharge ?? trip?.costToCounty ?? trip?.cost ?? '',
    copay: trip?.passengerCopay ?? trip?.copay ?? '',
    costToCounty: trip?.fundingSourceCharge ?? trip?.costToCounty ?? trip?.cost ?? '',
    paymentMethod: trip?.paymentMethod || '',
    paymentStatus: trip?.paymentStatus || '',
    authorizationId: trip?.authorizationId || trip?.authId || '',
    driverId: trip?.driverId || '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const setStop = (i: number, v: string) => setForm(f => ({ ...f, stops: f.stops.map((s, idx) => (idx === i ? v : s)) }));
  const addStop = () => setForm(f => ({ ...f, stops: [...f.stops, ''] }));
  const removeStop = (i: number) => setForm(f => ({ ...f, stops: f.stops.filter((_, idx) => idx !== i) }));

  const driver = (drivers || []).find(d => String(d?.id) === String(form.driverId));

  // Passenger copay and funding charge are independent — never Total − Copay.
  const numF = (v: any) => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; };
  const AVG_MIN_PER_MILE = 2.5;
  const milesNow = editMode ? numF(form.distance) : (trip?.miles != null ? Number(trip.miles) : numF(trip?.distance));
  const estDurationMin = milesNow > 0 ? Math.max(5, Math.round(milesNow * AVG_MIN_PER_MILE)) : 0;
  const costNow = editMode ? numF(form.cost) : numF(trip?.fundingSourceCharge ?? trip?.cost);
  const copayNow = editMode ? numF(form.copay) : numF(trip?.passengerCopay ?? trip?.copay);
  const costToCountyNow = editMode
    ? (form.costToCounty === '' ? costNow : numF(form.costToCounty))
    : numF(trip?.fundingSourceCharge ?? trip?.costToCounty ?? trip?.cost);

  const snapshot = trip?.pricingSnapshot;
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

  const isRoundTripLeg = trip?.type === 'round_trip' || trip?.linkedLegId || trip?.legIndex;
  const legIndex = trip?.legIndex || 1;
  const legTotal = trip?.linkedLegId || trip?.type === 'round_trip' ? 2 : 1;

  const fareChanged =
    numF(form.copay) !== numF(trip?.passengerCopay ?? trip?.copay) ||
    numF(form.costToCounty === '' ? form.cost : form.costToCounty) !==
      numF(trip?.fundingSourceCharge ?? trip?.costToCounty ?? trip?.cost);

  const handleSave = () => {
    if (fareChanged && !overrideReason.trim()) {
      toast.error('Enter a reason when changing Passenger Copay or Payer Charge');
      return;
    }

    const scheduledTime = form.scheduledDate && form.scheduledTimeOfDay
      ? `${form.scheduledDate}T${form.scheduledTimeOfDay}:00`
      : trip.scheduledTime;

    const nextCopay = form.copay === '' ? 0 : Number(form.copay);
    const nextCharge = costToCountyNow;
    const nowIso = new Date().toISOString();

    const newAudit = [...auditEvents];
    if (fareChanged) {
      newAudit.push({
        id: `evt-${Date.now()}-fare`,
        at: nowIso,
        by: 'Admin Console',
        action: 'fare_override',
        reason: overrideReason.trim(),
        before: {
          passengerCopay: numF(trip?.passengerCopay ?? trip?.copay),
          fundingSourceCharge: numF(trip?.fundingSourceCharge ?? trip?.costToCounty ?? trip?.cost),
        },
        after: { passengerCopay: nextCopay, fundingSourceCharge: nextCharge },
        summary: `Fare adjusted: ${overrideReason.trim()}`,
      });
    }
    if (form.driverId && form.driverId !== trip.driverId) {
      const newDriver = (drivers || []).find(d => String(d?.id) === String(form.driverId));
      newAudit.push({
        id: `evt-${Date.now()}-assign`,
        at: nowIso,
        by: 'Admin Console',
        action: 'assigned',
        summary: `Assigned to ${newDriver?.name || form.driverId}`,
      });
    }

    const patch: Record<string, any> = {
      scheduledTime,
      requestedPickup: to12h(form.requestedPickup),
      appointmentTime: to12h(form.appointmentTime),
      type: form.type,
      reason: form.reason,
      distance: form.distance ? `${form.distance} mi` : '',
      miles: form.distance === '' ? undefined : Number(form.distance),
      duration: estDurationMin ? `${estDurationMin} min` : '',
      returnType: form.returnType,
      source: form.source,
      pickup: form.pickup,
      stops: form.stops.map(s => s.trim()).filter(Boolean),
      stop: form.stops.map(s => s.trim()).filter(Boolean)[0] || '',
      dropoff: form.dropoff,
      mobility: form.mobility,
      passengers: Number(form.passengers) || 1,
      escort: form.escort,
      notes: form.notes,
      privateNotes: form.privateNotes,
      cost: nextCharge,
      copay: nextCopay,
      passengerCopay: nextCopay,
      costToCounty: nextCharge,
      fundingSourceCharge: nextCharge,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      authorizationId: form.authorizationId,
      driverId: form.driverId,
      auditTrail: newAudit,
      rider: { ...(trip.rider || {}), phone: form.phone, age: form.age === '' ? undefined : Number(form.age) },
    };
    if (form.driverId && (trip.status === 'pending_review' || !trip.status)) patch.status = 'assigned';

    onUpdate?.(trip.id, patch);
    setEditMode(false);
    setOverrideReason('');
    toast.success('Trip updated');
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
                  {Field({ label: 'Source / County', k: 'source' })}
                  {Field({ label: 'Pickup Time', k: 'requestedPickup', type: 'time', fmt: to12h })}
                  {Field({ label: 'Appointment', k: 'appointmentTime', type: 'time', accent: true, fmt: to12h })}
                  {Field({ label: 'Trip Type', k: 'type', options: [{ value: 'one_way', label: 'One Way' }, { value: 'round_trip', label: 'Round Trip' }] })}
                  {Field({ label: 'Reason', k: 'reason' })}
                  {Field({ label: 'Est. Distance (mi)', k: 'distance', type: 'number', step: '0.1', fmt: (v) => `${v} mi` })}
                  <div>
                    <p className="text-xs text-ink-4 mb-1">Est. Duration (min)</p>
                    <p className="text-sm font-medium text-ink">
                      {estDurationMin ? `${estDurationMin} min` : <span className="text-ink-4">N/A</span>}
                      {editMode && estDurationMin > 0 && <span className="text-xs text-ink-4 font-normal ml-1">· auto from distance</span>}
                    </p>
                  </div>
                  {Field({ label: 'Return Type', k: 'returnType', options: [{ value: '', label: 'N/A' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'will_call', label: 'Will Call' }] })}
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
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4"><CreditCard size={14} /> Billing & Payment</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bg p-4 rounded-xl border border-line-2">
                      <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-1">Passenger Copay</p>
                      {editMode ? (
                        <input type="number" step="0.01" value={String(form.copay)} onChange={(e) => set('copay', e.target.value)} className={INPUT} />
                      ) : (
                        <p className="text-xl font-semibold text-ink">{money(copayNow)}</p>
                      )}
                      <p className="text-xs text-ink-4 mt-1">Rider-facing · never mixed with payer charge</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/15">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Payer Charge</p>
                        {editMode ? (
                          <select value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)} className={`${INPUT} w-28 cursor-pointer`}>
                            {['Pending', 'Approved', 'Paid', 'charged', 'Denied'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <Badge variant={['Paid', 'Approved', 'charged'].includes(trip.paymentStatus) ? 'accent' : 'warning'}>{trip.paymentStatus || 'Pending'}</Badge>
                        )}
                      </div>
                      {editMode ? (
                        <input
                          type="number"
                          step="0.01"
                          value={String(form.costToCounty === '' ? form.cost : form.costToCounty)}
                          onChange={(e) => {
                            set('costToCounty', e.target.value);
                            set('cost', e.target.value);
                          }}
                          className={INPUT}
                        />
                      ) : (
                        <p className="text-xl font-semibold text-primary">{money(costToCountyNow)}</p>
                      )}
                      <p className="text-xs text-ink-4 mt-1">{trip.fundingSource || 'Payer'} · admin bill</p>
                    </div>
                  </div>

                  {editMode && fareChanged && (
                    <div>
                      <label className="text-xs font-semibold text-ink-4 mb-1 block">Override reason (required)</label>
                      <input
                        className={INPUT}
                        placeholder="Why are you changing copay or payer charge?"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                      />
                    </div>
                  )}

                  {snapshot && (
                    <div className="rounded-xl border border-line-2 bg-bg/50 p-3 space-y-2">
                      <p className="text-xs font-bold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera size={12} /> Pricing snapshot at quote
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p className="text-ink-4">Payer <span className="font-semibold text-ink">{snapshot.fundingSourceName}</span></p>
                        <p className="text-ink-4">Method <span className="font-semibold text-ink">{snapshot.methodLabel || PRICING_METHOD_LABELS[snapshot.pricingMethod as PricingMethod]}</span></p>
                        <p className="text-ink-4">Miles <span className="font-semibold text-ink">{snapshot.miles}</span></p>
                        {snapshot.billingClassName && (
                          <p className="text-ink-4">Class <span className="font-semibold text-ink">{snapshot.billingClassName}</span></p>
                        )}
                        <p className="text-ink-4">Boundary <span className="font-semibold text-ink">{snapshot.insideCounty ? 'Inside' : 'Outside'}</span></p>
                        <p className="text-ink-4">Effective <span className="font-semibold text-ink">{snapshot.effectiveFrom || '—'}{snapshot.effectiveTo ? ` → ${snapshot.effectiveTo}` : ''}</span></p>
                        <p className="text-ink-4">Quoted <span className="font-semibold text-ink">{snapshot.quotedAt ? formatDateTime(snapshot.quotedAt) : '—'}</span></p>
                      </div>
                      <p className="text-xs text-ink-4">Completed trips keep this snapshot even if admin rates change later.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {Field({ label: 'Payment Method', k: 'paymentMethod' })}
                    {Field({ label: 'Auth ID', k: 'authorizationId' })}
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
