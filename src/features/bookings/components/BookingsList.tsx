import React, { useState } from 'react';
import {
  Search, List, ArrowRight, MapPin, Repeat, MoveRight,
  Check, Trash2, CheckCircle2, ClipboardList, Pencil, X,
  Accessibility, Bed, Disc, Info, User
} from 'lucide-react';
import { Avatar, Badge, Button, Pagination } from '@/shared/components/ui';
import { formatShortDate, money } from '@/utils/helpers';
import { DollarSign } from 'lucide-react';
import { usePricing } from '@/hooks/usePricing';
import { DriverAssignSelect } from './DriverAssignSelect';

// ── Inline edit helpers (mirrors Trip History table) ──────────────────────────
const INLINE_INPUT =
  'bg-transparent border border-transparent hover:bg-bg/70 focus:bg-white focus:ring-2 focus:ring-primary/15 rounded-lg px-1.5 py-1 text-xs font-medium text-ink outline-none transition-all cursor-pointer';

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
const to12h = (hhmm?: string): string => {
  if (!hhmm) return '';
  const m = String(hhmm).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(hhmm);
  let h = parseInt(m[1], 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
};

const STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];
const STATUS_STYLE: Record<string, string> = {
  pending_review: 'text-amber-700 bg-amber-50',
  confirmed: 'text-primary bg-primary/5',
  assigned: 'text-primary bg-primary/5',
  cancelled: 'text-ink-3 bg-bg',
  no_show: 'text-urgent bg-urgent/5',
};

const InlineTime: React.FC<{ value?: string; onCommit: (v: string) => void }> = ({ value, onCommit }) => (
  <input
    type="time"
    value={to24h(value)}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => onCommit(e.target.value ? to12h(e.target.value) : '')}
    className={`${INLINE_INPUT} w-[118px]`}
  />
);

const InlineText: React.FC<{ value?: string; onCommit: (v: string) => void; placeholder?: string; className?: string }> = ({ value, onCommit, placeholder, className = '' }) => {
  const [val, setVal] = useState(value ?? '');
  React.useEffect(() => { setVal(value ?? ''); }, [value]);
  return (
    <input
      type="text" value={val} placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if (val !== (value ?? '')) onCommit(val); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className={`${INLINE_INPUT} placeholder:text-ink-4/60 ${className}`}
    />
  );
};

interface BookingsListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bookingSearch: string;
  setBookingSearch: (val: string) => void;
  fundingFilter: string;
  setFundingFilter: (val: string) => void;
  countyFilter: string;
  setCountyFilter: (val: string) => void;
  filteredTrips: any[];
  paginatedBookings: any[];
  selectedTrips: string[];
  toggleSelectAll: () => void;
  toggleSelectTrip: (id: string) => void;
  openBooking: (id: string) => void;
  selectedBookingId: string | null;
  handleApprove: (id: string) => void;
  setIsAssigning: (val: boolean) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  setCurrentPage: (page: number) => void;
  trips: any[];
  drivers: any[];
  setSelectedTrips: (trips: string[]) => void;
  handleBulkAction: (action: string) => void;
  updateTrip: (id: string, patch: Record<string, any>) => void;
  onEditTrip: (id: string) => void;
  /** Locate this booking's vehicle on the side map. */
  onRowSelect?: (id: string | null) => void;
  selectedMapId?: string | null;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  activeTab, setActiveTab, bookingSearch, setBookingSearch, fundingFilter, setFundingFilter,
  countyFilter, setCountyFilter,
  filteredTrips, paginatedBookings, selectedTrips, toggleSelectAll, toggleSelectTrip,
  openBooking, selectedBookingId, handleApprove, setIsAssigning,
  currentPage, totalPages, itemsPerPage, setItemsPerPage, setCurrentPage, trips, drivers,
  setSelectedTrips, handleBulkAction, updateTrip,   onEditTrip, onRowSelect, selectedMapId
}) => {
  const { pricing } = usePricing();
  const fundingOptions = (pricing.fundingPolicies || []).filter(p => p.active);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center gap-1 border-b border-line-2 shrink-0">
        <button
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-ink-4 hover:text-ink hover:border-line-2'}`}
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); openBooking(''); setSelectedTrips([]); }}
        >
          <List size={16} /> Pending Review <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-line-2 text-ink-3'}`}>{(trips || []).filter((t: any) => t.status === 'pending_review' && !t?.driverId).length}</span>
        </button>
        <button
          className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'confirmed' ? 'border-primary text-primary' : 'border-transparent text-ink-4 hover:text-ink hover:border-line-2'}`}
          onClick={() => { setActiveTab('confirmed'); setCurrentPage(1); openBooking(''); setSelectedTrips([]); }}
        >
          Ready to Assign <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'confirmed' ? 'bg-primary text-white' : 'bg-line-2 text-ink-3'}`}>{(trips || []).filter((t: any) => (t.status === 'confirmed' || t.status === 'assigned') && !t?.driverId).length}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
          <input
            type="text"
            placeholder="Search rider or ID..."
            value={bookingSearch}
            onChange={e => { setBookingSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-3 py-2 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={12} className="text-ink-4" />
          <span className="text-xs text-ink-4">Payer</span>
          <select
            value={fundingFilter}
            onChange={e => setFundingFilter(e.target.value)}
            className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
          >
            <option value="all">All Payers</option>
            {fundingOptions.map(fs => <option key={fs.id} value={fs.name}>{fs.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-ink-4" />
          <span className="text-xs text-ink-4">County</span>
          <select
            value={countyFilter}
            onChange={e => setCountyFilter(e.target.value)}
            className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
          >
            <option value="all">All Counties</option>
            <option value="Richmond City">Richmond City</option>
            <option value="Chesterfield County">Chesterfield County</option>
            <option value="Henrico County">Henrico County</option>
            <option value="Hanover County">Hanover County</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-line-2 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm">
        {/* Bulk-action bar — consistent with Trip History; appears on selection */}
        {selectedTrips.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-tint/40 border-b border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
            <span className="text-xs font-semibold text-primary-dark whitespace-nowrap">{selectedTrips.length} selected</span>
            <div className="h-4 w-px bg-primary/20" />

            {/* Bulk assign driver — moves the booking into Trip History once assigned */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-4 whitespace-nowrap">Assign</span>
              <select
                value=""
                onChange={(e) => { if (e.target.value) { selectedTrips.forEach(id => updateTrip(id, { driverId: e.target.value, status: 'assigned' })); setSelectedTrips([]); } }}
                className="bg-white border border-line rounded-lg py-1.5 pl-2.5 pr-7 text-xs font-medium text-ink outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Driver…</option>
                {(drivers || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {activeTab === 'pending' && (
              <button
                type="button"
                onClick={() => handleBulkAction('approve')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-dark transition-all shadow-sm"
              >
                <Check size={13} /> Approve
              </button>
            )}

            <button
              type="button"
              onClick={() => handleBulkAction('cancel')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-urgent bg-urgent/5 hover:bg-urgent/10 border border-urgent/15 transition-all"
            >
              <Trash2 size={13} /> Cancel
            </button>

            <button
              type="button"
              onClick={() => setSelectedTrips([])}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-3 hover:bg-white hover:text-ink transition-all"
            >
              <X size={13} /> Clear
            </button>
          </div>
        )}

        {filteredTrips.length > 0 ? (
          <>
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left">
                <thead className="bg-bg border-b border-line-2 sticky top-0 z-10">
                  <tr className="border-b border-line-2 bg-bg/50">
                    {activeTab === 'pending' && (
                      <th className="pl-4 pr-2 py-2.5 w-8">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-line-2 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                          checked={paginatedBookings.length > 0 && paginatedBookings.every((b: any) => selectedTrips.includes(b.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-3.5 py-3 type-th whitespace-nowrap">Actions</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Trip ID</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[90px]">Date</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[105px]">Pickup Time</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[95px]">Appt</th>
                    <th className="px-4 py-3 type-th whitespace-nowrap min-w-[200px]">Rider</th>
                    <th className="px-4 py-3 type-th whitespace-nowrap min-w-[150px]">Mobility</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[110px]">Customer ID</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[130px]">Auth ID</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap text-center min-w-[135px]">Status</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[160px]">Driver</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[95px]">Run</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[280px]">Route</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[150px]">Trip Reason</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[90px]">Distance</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Trip Type</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[110px]">Dispatch Time</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[100px]">Perform</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[110px]">Arrival Time</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Payer</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[100px]">County</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap text-right min-w-[110px]">Charge (est.)</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[150px]">User Note</th>
                    <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[160px]">Dispatcher/Admin Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {paginatedBookings.map((booking: any) => (
                    <tr
                      key={booking.id}
                      onClick={() => onRowSelect?.(booking.id)}
                      className={`border-b border-line-2 transition-colors cursor-pointer ${selectedMapId === booking.id ? 'bg-primary-tint/40 ring-1 ring-inset ring-primary/30' : selectedTrips.includes(booking.id) ? 'bg-accent-light/10' : 'hover:bg-bg/50'} ${booking.isUrgent ? 'border-l-4 border-l-urgent border-urgent/30 bg-urgent-light/10' : ''}`}
                    >
                      {activeTab === 'pending' && (
                        <td className="pl-4 pr-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedTrips.includes(booking.id)} onChange={() => toggleSelectTrip(booking.id)} className="w-4 h-4 rounded border-line text-primary cursor-pointer" />
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {activeTab === 'pending' && (
                            <button title="Approve" className="p-2 text-accent hover:bg-accent-light rounded-xl transition-all" onClick={() => handleApprove(booking.id)}><Check size={16} /></button>
                          )}
                          <button title="Edit ride details" className="p-2 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" onClick={() => onEditTrip(booking.id)}><Pencil size={15} /></button>
                          <button title="Cancel / delete ride" className="p-2 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-xl transition-all" onClick={() => updateTrip(booking.id, { status: 'cancelled' })}><Trash2 size={15} /></button>
                        </div>
                      </td>

                      {/* Trip ID */}
                      <td className="px-3.5 py-3 min-w-[120px]">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-xs text-ink-3 whitespace-nowrap">#{booking?.id || '---'}</span>
                          {booking.isUrgent && <span className="bg-urgent text-white text-xs font-medium px-1.5 py-0.5 rounded uppercase shadow-sm shadow-urgent/30">URGENT</span>}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[90px]">
                        <span className="text-xs font-medium text-ink whitespace-nowrap">{booking?.scheduledTime ? formatShortDate(booking.scheduledTime) : (booking?.submittedTime ? formatShortDate(booking.submittedTime) : '-')}</span>
                      </td>

                      {/* Pickup Time (editable) */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[105px]">
                        <InlineTime
                          value={booking?.requestedPickup || (booking?.scheduledTime ? String(booking.scheduledTime).slice(11, 16) : '')}
                          onCommit={(v) => updateTrip(booking.id, { requestedPickup: v })}
                        />
                      </td>

                      {/* Appt (editable) */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[95px]">
                        <InlineTime value={booking?.appointmentTime} onCommit={(v) => updateTrip(booking.id, { appointmentTime: v })} />
                      </td>

                      {/* Rider */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <Avatar initials={booking?.rider?.initials || '?'} size="xs" />
                          <p className="text-xs font-medium text-ink leading-tight whitespace-nowrap">{booking?.rider?.name || 'Unknown'}</p>
                        </div>
                      </td>

                      {/* Mobility */}
                      <td className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                        {(() => {
                          const m = (booking?.mobility || 'Ambulatory').trim();
                          const lower = m.toLowerCase();
                          if (lower.includes('wheelchair')) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Accessibility size={13} className="shrink-0 text-indigo-600" />
                                {m}
                              </span>
                            );
                          }
                          if (lower.includes('stretcher')) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <Bed size={13} className="shrink-0 text-rose-600" />
                                {m}
                              </span>
                            );
                          }
                          if (lower.includes('walker') || lower.includes('rollator')) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Disc size={13} className="shrink-0 text-amber-600" />
                                {m}
                              </span>
                            );
                          }
                          if (lower.includes('cane')) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Info size={13} className="shrink-0 text-amber-600" />
                                {m}
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg text-ink-3 border border-line-2">
                              <User size={13} className="shrink-0 text-ink-4" />
                              {m || 'Ambulatory'}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Customer ID */}
                      <td className="px-3.5 py-3 min-w-[110px]">
                        <span className="text-xs text-ink-3 whitespace-nowrap" title={booking.passengerId || booking.rider?.passengerId || ''}>{booking.passengerId || booking.rider?.passengerId || '—'}</span>
                      </td>

                      {/* Auth ID */}
                      <td className="px-3.5 py-3 min-w-[130px]">
                        <span className="text-xs text-ink-3 whitespace-nowrap" title={booking.authorizationId || booking.authId || ''}>{booking.authorizationId || booking.authId || '—'}</span>
                      </td>

                      {/* Status (editable) */}
                      <td className="px-3.5 py-3 text-center min-w-[135px]">
                        <select
                          value={booking.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateTrip(booking.id, { status: e.target.value })}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer transition-all focus:ring-2 focus:ring-primary/15 ${STATUS_STYLE[booking.status] || 'text-ink-3 bg-bg'}`}
                        >
                          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-ink bg-white">{o.label}</option>)}
                        </select>
                      </td>

                      {/* Driver (inline assign — smart suggestions + force-assign) */}
                      <td className="px-3.5 py-3 min-w-[160px]">
                        <DriverAssignSelect
                          trip={booking}
                          drivers={drivers}
                          allTrips={trips}
                          onAssign={(driverId) => updateTrip(booking.id, driverId ? { driverId, status: 'assigned' } : { driverId: '' })}
                          className={`${INLINE_INPUT} max-w-[150px] ${booking.driverId ? '' : 'text-ink-4'}`}
                        />
                      </td>

                      {/* Run */}
                      <td className="px-3.5 py-3 min-w-[95px]">
                        <InlineText value={booking.driverRun} onCommit={(v) => updateTrip(booking.id, { driverRun: v })} placeholder="—" className="w-[84px] " />
                      </td>

                      {/* Route */}
                      <td className="px-3.5 py-3 min-w-[280px]">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                          <span className="text-xs font-semibold text-ink max-w-[120px] truncate" title={booking?.pickup || ''}>{booking?.pickup || '---'}</span>

                          {/* Intermediate Stop Indicator */}
                          {(booking?.stop || (booking?.stops && booking.stops.length > 0)) ? (
                            <div className="flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-full bg-warning/10 border border-warning/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                              <span className="text-xs font-medium text-warning-dark whitespace-nowrap">
                                {Array.isArray(booking.stops) ? `+${booking.stops.length} Stop${booking.stops.length > 1 ? 's' : ''}` : '+1 Stop'}
                              </span>
                            </div>
                          ) : (
                            <ArrowRight size={12} className="text-ink-4 shrink-0 mx-1" />
                          )}

                          <MapPin size={13} className="text-urgent shrink-0" />
                          <span className="text-xs font-semibold text-ink-2 max-w-[120px] truncate" title={booking?.dropoff || ''}>{booking?.dropoff || '---'}</span>
                        </div>
                      </td>

                      {/* Trip Reason */}
                      <td className="px-3.5 py-3 min-w-[150px]">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink max-w-[160px]">
                          <ClipboardList size={12} className="text-ink-4 shrink-0" />
                          <span className="truncate" title={booking?.reason || ''}>{booking?.reason || '—'}</span>
                        </span>
                      </td>

                      {/* Distance (editable) */}
                      <td className="px-3.5 py-3 min-w-[90px]">
                        <InlineText
                          value={booking?.distance || (booking?.miles ? `${booking.miles} mi` : '')}
                          onCommit={(v) => updateTrip(booking.id, { distance: v })}
                          placeholder="—"
                          className="w-[72px]"
                        />
                      </td>

                      {/* Trip Type */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[120px]">
                        <div className="flex items-center gap-1 text-xs text-ink-4">
                          {booking?.type === 'round_trip' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 border border-indigo-100 font-medium">
                              <Repeat size={11} className="text-indigo-600" strokeWidth={2.5} />
                              Round Trip
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/70 text-blue-700 border border-blue-100 font-medium">
                              <MoveRight size={11} className="text-blue-600" strokeWidth={2.5} />
                              One Way
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dispatch Time (filled once dispatched) */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[110px]">
                        <InlineTime value={booking?.dispatchTime} onCommit={(v) => updateTrip(booking.id, { dispatchTime: v })} />
                      </td>

                      {/* Perform / departure */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[100px]">
                        <InlineTime value={booking?.departureTime || booking?.actualPickup} onCommit={(v) => updateTrip(booking.id, { departureTime: v })} />
                      </td>

                      {/* Arrival Time */}
                      <td className="px-3.5 py-3 whitespace-nowrap min-w-[110px]">
                        <InlineTime value={booking?.arrivalTime || booking?.actualDropoff} onCommit={(v) => updateTrip(booking.id, { arrivalTime: v })} />
                      </td>

                      {/* Funding */}
                      <td className="px-3.5 py-3 min-w-[120px]">
                        <div className="flex flex-col gap-1.5 items-start">
                          {(() => {
                            const fs = booking.fundingSource || booking.paymentMethod;
                            if (!fs) return <span className="text-xs text-ink-4">—</span>;
                            const isMedicaid = fs.toLowerCase().includes('medicaid');
                            const isMedicare = fs.toLowerCase().includes('medicare');
                            const isDSS = fs.toLowerCase().includes('dss');
                            const isSelfPay = fs.toLowerCase().includes('self');
                            const isFacility = fs.toLowerCase().includes('facility');
                            const colorClass = isMedicaid ? 'bg-green-50 text-green-700 border-green-200'
                              : isMedicare ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isDSS ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : isSelfPay ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isFacility ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-bg text-ink-3 border-line-2';
                            return (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${colorClass}`}>
                                <DollarSign size={9} />{fs}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* County (editable) */}
                      <td className="px-3 py-2.5">
                        <select
                          value={booking.insideCounty === true ? 'inside' : booking.insideCounty === false ? 'outside' : ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateTrip(booking.id, { insideCounty: e.target.value === 'inside' ? true : e.target.value === 'outside' ? false : undefined })}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer transition-all focus:ring-2 focus:ring-primary/15 ${booking.insideCounty === false ? 'text-urgent bg-urgent/5' : booking.insideCounty === true ? 'text-accent bg-accent/5' : 'text-ink-4 bg-bg'}`}
                        >
                          <option value="">—</option>
                          <option value="inside">In-County</option>
                          <option value="outside">Out-of-County</option>
                        </select>
                      </td>

                      {/* Charge (estimated) */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-medium text-primary">{money(booking.fundingSourceCharge ?? booking.costToCounty ?? booking.cost ?? 0)}</span>
                          <div className="flex items-center gap-1.5 opacity-80">
                            <span className="text-xs text-ink-4">Copay: {money(booking.passengerCopay ?? booking.copay ?? 0)}</span>
                            <span className="text-xs text-ink-4">Payer: {money(booking.fundingSourceCharge ?? booking.costToCounty ?? booking.cost ?? 0)}</span>
                          </div>
                        </div>
                      </td>

                      {/* User Note (from rider app) */}
                      <td className="px-3 py-2.5">
                        <InlineText value={booking.notes} onCommit={(v) => updateTrip(booking.id, { notes: v })} placeholder="Add note…" className="w-[150px]" />
                      </td>

                      {/* Dispatcher/Admin Note (internal) */}
                      <td className="px-3 py-2.5">
                        <InlineText value={booking.privateNotes} onCommit={(v) => updateTrip(booking.id, { privateNotes: v })} placeholder="Internal note…" className="w-[150px]" />
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="shrink-0">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredTrips.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-ink-4">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-ink">Queue Empty</p>
            <p className="text-sm">No bookings match your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
