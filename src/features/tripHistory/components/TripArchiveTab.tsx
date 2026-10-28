import React, { useState } from 'react';
import { Search, MapPin, ArrowRight, Repeat, MoveRight, Filter, DollarSign, ClipboardList, Download, X, Accessibility, Bed, Disc, Info, User, Loader2 } from 'lucide-react';
import { Card, Avatar, Pagination, SearchInput, TripStatusBadge } from '@/shared/components/ui';
import { formatShortDate, formatTripId, formatTime } from '@/utils/helpers';
import {
  isRoundTrip,
  resolveMediaUrl,
  formatPricingZone,
  type DriverAssignmentFilter,
} from '@/features/bookings/utils/helpers';
import {
  BookingZoneCell,
  BookingMilesCell,
  BookingCopayCell,
  BookingPayerChargeCell,
} from '@/features/bookings/components/BookingPricingColumns';
import { RouteLocationLabel } from '@/features/bookings/components/RouteLocationLabel';
import { useGetAllPayersQuery } from '@/redux/api/bookingApi';
import { ServiceDateFilter } from './ServiceDateFilter';

interface TripArchiveTabProps {
  trips: any[];
  drivers: any[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  /** Open trip details (view-only from Trip History page). */
  onOpenDetails?: (id: string) => void;
  /** Locate this trip's vehicle on the side map. */
  onRowSelect?: (id: string | null) => void;
  selectedMapId?: string | null;
  /** Search, driver, payer and date are sent to `/booking/history` by the page. */
  search: string;
  setSearch: (v: string) => void;
  driverFilter: string;
  setDriverFilter: (v: string) => void;
  payerFilter: string;
  setPayerFilter: (v: string) => void;
  assignFilter: DriverAssignmentFilter;
  setAssignFilter: (v: DriverAssignmentFilter) => void;
  /** `YYYY-MM-DD`, or '' for all dates. */
  serviceDate: string;
  setServiceDate: (v: string) => void;
  isFetching?: boolean;
  /** Render Date inside the filter bar (true when the map is hidden); the page
   *  header renders them instead when the map is shown. */
  inlineDateFilter?: boolean;
}

// Normalize "8:32 AM" / "13:05" → "HH:MM"; '' if unparseable.
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

// Derive demo times from the trip's scheduled time so the pickers show realistic
// values out of the box: dispatch 20m before pickup, departure at pickup, arrival 35m after.
const demoTimeFor = (trip: any, kind: 'dispatch' | 'departure' | 'arrival'): string => {
  const base = trip?.scheduledTime ? String(trip.scheduledTime).slice(11, 16) : '';
  if (!/^\d{2}:\d{2}$/.test(base)) return '';
  const mins = parseInt(base.slice(0, 2), 10) * 60 + parseInt(base.slice(3, 5), 10);
  const offset = kind === 'dispatch' ? -20 : kind === 'departure' ? 0 : 35;
  const t = (((mins + offset) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

// Borderless by default for a clean, dynamic feel; a subtle background/ring appears
// on hover/focus so the value stays editable on click without a static stroke.
// "HH:MM" (24h) → "h:MM AM/PM" for readable CSV output.
const to12h = (hhmm?: string): string => {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || '';
  let h = parseInt(hhmm.slice(0, 2), 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${hhmm.slice(3, 5)} ${ap}`;
};

// Single source of truth for the three editable times (edited value → real actual → demo),
// reused by both the table cells and the CSV export so they always match.
const resolveTripTimes = (trip: any) => ({
  dispatch: trip.dispatchTime || demoTimeFor(trip, 'dispatch'),
  departure: trip.departureTime || to24h(trip.actualPickup) || demoTimeFor(trip, 'departure'),
  arrival: trip.arrivalTime || to24h(trip.actualDropoff) || demoTimeFor(trip, 'arrival'),
});

const displayTime = (val?: string) => {
  if (!val) return '—';
  const hhmm = to24h(val) || (val.length >= 16 ? val.slice(11, 16) : '');
  if (hhmm) return to12h(hhmm);
  return formatTime(val) || val;
};

export const TripArchiveTab: React.FC<TripArchiveTabProps> = ({
  trips,
  drivers,
  selectedIds,
  setSelectedIds,
  onOpenDetails,
  onRowSelect,
  selectedMapId,
  search,
  setSearch,
  driverFilter,
  setDriverFilter,
  payerFilter,
  setPayerFilter,
  assignFilter,
  setAssignFilter,
  serviceDate,
  setServiceDate,
  isFetching,
  inlineDateFilter = true,
}) => {
  const { data: payersResponse } = useGetAllPayersQuery();
  const payersList = (payersResponse?.data || []).filter((p) => p.status !== false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when the header-controlled Date changes.
  React.useEffect(() => { setCurrentPage(1); }, [serviceDate]);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Anything past the booking stage belongs here — i.e. not pending_review, OR already
  // has a driver assigned (so a driver-assigned trip always shows in Trip History).
  // Search, date, driver and payer are filtered server-side.
  const filteredTrips = (trips || []).filter((t: any) => t?.status !== 'pending_review' || t?.driverId);

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      : filteredTrips;

    if (tripsToExport.length === 0) return;

    const headers = [
      'Trip ID', 'Passenger Name', 'Passenger ID', 'Date',
      'Pickup Address', 'Drop-off Address',
      'Scheduled Pickup', 'Pickup Arrival', 'Drop-off Completed',
      'Trip Miles', 'Trip Reason', 'Vehicle/Service', 'Mobility',
      'No-Show', 'Cancelled',
      'Payer', 'Zone',
      'Billing Miles', 'Passenger Copay', 'Payer Charge', 'Type', 'Leg'
    ];

    const rows = tripsToExport.map((trip: any) => {
      const times = resolveTripTimes(trip);
      const pickup = trip.pickupTime || to24h(trip.requestedPickup) || times.departure;
      const driver = drivers.find((d: any) => String(d.id) === String(trip.driverId));
      return [
        trip.id,
        `"${trip?.rider?.name || 'Unknown'}"`,
        `"${trip.passengerId || trip.rider?.passengerId || 'N/A'}"`,
        formatShortDate(trip.scheduledTime),
        `"${trip.pickup}"`,
        `"${trip.dropoff}"`,
        `"${to12h(pickup) || 'N/A'}"`,
        `"${to12h(times.arrival) || 'N/A'}"`,
        `"${to12h(String(trip.dropoffTime || '').slice(11, 16) || times.arrival) || 'N/A'}"`,
        `"${trip.distance || (trip.miles ? `${trip.miles} mi` : 'N/A')}"`,
        `"${trip.reason || 'N/A'}"`,
        `"${driver?.vehicle?.type || trip.vehicle?.type || trip.mobility || 'N/A'}"`,
        `"${trip.mobility || 'N/A'}"`,
        trip.status === 'no_show' ? 'Yes' : 'No',
        trip.status === 'cancelled' ? 'Yes' : 'No',
        `"${trip.fundingSource || trip.paymentMethod || 'N/A'}"`,
        `"${trip.pricingZoneLabel || formatPricingZone(trip.primaryPricingZone) || (trip.insideCounty === true ? 'Inside' : trip.insideCounty === false ? 'Outside' : 'N/A')}"`,
        trip.billingMileage != null && trip.billingMileage > 0 ? trip.billingMileage.toFixed(1) : 'N/A',
        trip.passengerCopay ?? trip.copay ?? 0,
        trip.fundingSourceCharge ?? (trip.costToCounty != null ? trip.costToCounty : (trip.cost || 0)),
        trip.type,
        trip.legIndex ? `Leg ${trip.legIndex}` : (trip.type === 'round_trip' ? 'Round' : 'One-way')
      ];
    });

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

  return (
    <>
      <Card className="overflow-hidden border-line-2 shadow-sm">
        <div className="px-5 py-3 border-b border-line-2 bg-bg/30 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput
              className="w-full sm:w-56"
              placeholder="Search trips, riders..."
              paramName="searchTerm"
              defaultValue={search}
              onSearchChange={(debouncedVal) => {
                setSearch(debouncedVal);
                setCurrentPage(1);
              }}
            />
            {isFetching && (
              <Loader2 className="text-primary animate-spin shrink-0" size={18} aria-label="Loading trips" />
            )}

        

            <div className="flex items-center gap-2">
              <User size={12} className="text-ink-4" />
              <span className="text-xs text-ink-4">Assigned</span>
              <select
                value={assignFilter}
                onChange={(e) => {
                  setAssignFilter(e.target.value as DriverAssignmentFilter);
                  setCurrentPage(1);
                }}
                className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
              >
                <option value="">All</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
              </select>
            </div>

            {/* Payer Filter */}
            <div className="flex items-center gap-2">
              <DollarSign size={12} className="text-ink-4" />
              <span className="text-xs text-ink-4">Payer</span>
              <select
                value={payerFilter}
                onChange={(e) => { setPayerFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
              >
                <option value="all">All Payers</option>
                {payersList.map((payer) => (
                  <option key={payer._id} value={payer._id}>
                    {payer.name || payer.title || payer.payerName || payer._id}
                  </option>
                ))}
              </select>
            </div>

            {/* Date (when map hidden) */}
            {inlineDateFilter && (
              <div className="ml-auto">
                <ServiceDateFilter value={serviceDate} onChange={setServiceDate} />
              </div>
            )}
          </div>
        </div>

        {/* Bulk-action bar — appears when one or more rows are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary-tint/40 border-b border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-xs font-semibold text-primary-dark whitespace-nowrap">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-primary/20" />

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all shadow-sm"
            >
              <Download size={13} /> Export selected
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-3 hover:bg-white hover:text-ink transition-all"
            >
              <X size={13} /> Clear
            </button>
          </div>
        )}

        <div className="overflow-auto max-h-[calc(100vh-17rem)]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-bg">
              <tr className="bg-bg border-b border-line-2">
                <th className="pl-6 pr-3 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedTrips.length && paginatedTrips.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Trip ID</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[90px]">Date</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[105px]">Pickup Time</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[95px]">Appt</th>
                <th className="px-4 py-3 type-th whitespace-nowrap min-w-[200px]">Rider</th>
                <th className="px-4 py-3 type-th whitespace-nowrap min-w-[150px]">Mobility</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[70px] text-center">Seats</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[140px]">Program</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap text-center min-w-[135px]">Status</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[160px]">Driver</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[280px]">Route</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[150px]">Trip Reason</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Trip Type</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Payer</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[120px]">Zone</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap text-right min-w-[72px]">Miles</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap text-right min-w-[100px]">Passenger copay</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap text-right min-w-[100px]">Payer charge</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[150px]">User Note</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[160px]">Dispatcher/Admin Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {paginatedTrips.map(trip => (
                <tr
                  key={trip.id}
                  onClick={() => onRowSelect?.(trip.id)}
                  onDoubleClick={() => onOpenDetails?.(trip.id)}
                  title={onOpenDetails ? 'Double-click to view trip details' : undefined}
                  className={`transition-colors group cursor-pointer ${selectedMapId === trip.id ? 'bg-primary-tint/40 ring-1 ring-inset ring-primary/30' : selectedIds.includes(trip.id) ? 'bg-primary-tint/10' : 'hover:bg-primary-tint/20'}`}
                >
                  <td className="pl-6 pr-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(trip.id)}
                      onChange={(e) => toggleSelect(trip.id, e)}
                      className="w-4 h-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
                    />
                  </td>
                  <td className="px-3.5 py-3 min-w-[120px]">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-xs text-ink-3 whitespace-nowrap">{formatTripId(trip.id || trip._id)}</span>
                      {trip.isUrgent && (
                        <span className="bg-urgent text-white text-xs font-medium px-1.5 py-0.5 rounded uppercase shadow-sm shadow-urgent/30">
                          URGENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[90px]">
                    <span className="text-xs font-medium text-ink whitespace-nowrap">
                      {trip?.serviceDate ? formatShortDate(trip.serviceDate) : (trip?.scheduledTime ? formatShortDate(trip.scheduledTime) : '-')}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[105px]">
                    <span className="text-xs font-medium text-ink whitespace-nowrap">
                      {displayTime(trip?.pickupTime || trip?.requestedPickup)}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[95px]">
                    <span className="text-xs font-medium text-ink whitespace-nowrap">
                      {displayTime(trip?.appointmentTime)}
                    </span>
                  </td>

                  <td className="px-4 py-3 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <Avatar initials={trip?.rider?.initials || '?'} src={resolveMediaUrl(trip?.rider?.profile)} size="xs" />
                      <p className="text-xs font-medium text-ink leading-tight whitespace-nowrap">{trip?.rider?.name || 'Unknown'}</p>
                    </div>
                  </td>

                  {/* Mobility */}
                  <td className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                    {(() => {
                      const m = (trip.mobility || 'Ambulatory').trim();
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

                  <td className="px-3.5 py-3 min-w-[70px] text-center">
                    <span className="text-xs font-semibold text-ink tabular-nums">{trip.passengerSeats ?? '—'}</span>
                  </td>

                  <td className="px-3.5 py-3 min-w-[140px]">
                    <span className="text-xs font-medium text-ink-3 block max-w-[130px] truncate" title={trip.programContext || ''}>
                      {trip.programContext || '—'}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 text-center min-w-[135px]">
                    <TripStatusBadge status={trip.status} />
                  </td>

                  <td className="px-3.5 py-3 min-w-[160px]">
                    <span className="text-xs font-medium text-ink truncate block max-w-[150px]" title={drivers.find((d: any) => String(d.id) === String(trip.driverId))?.name}>
                      {drivers.find((d: any) => String(d.id) === String(trip.driverId))?.name || trip.driver?.name || '—'}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                      <RouteLocationLabel locationRaw={trip.pickupLocationRaw} displayFallback={trip?.pickup} />

                      {(trip?.stop || (trip?.stops && trip.stops.length > 0)) ? (
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
                      <RouteLocationLabel locationRaw={trip.dropOffLocationRaw} displayFallback={trip?.dropoff} className="text-ink-2" />
                    </div>
                  </td>

                  <td className="px-3.5 py-3 min-w-[150px]">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink max-w-[160px]">
                      <ClipboardList size={12} className="text-ink-4 shrink-0" />
                      <span className="truncate" title={trip?.tripReason || trip?.reason || ''}>{trip?.tripReason || trip?.reason || '—'}</span>
                    </span>
                  </td>

                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[120px]">
                    <div className="flex items-center gap-1 text-xs text-ink-4">
                      {isRoundTrip(trip?.tripType || trip?.type) ? (
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
                      {trip?.isRecurring && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary border border-primary/15 font-medium" title={(trip.recurringDays || []).join(', ')}>
                          Recurring
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Funding */}
                  <td className="px-3.5 py-3 min-w-[120px]">
                    <div className="flex flex-col gap-1.5 items-start">
                      {(() => {
                        const fs = trip.fundingSource || trip.paymentMethod;
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

                  <td className="px-3 py-2.5 min-w-[120px]">
                    <BookingZoneCell row={trip} />
                  </td>

                  <td className="px-3 py-2.5 text-right min-w-[72px]">
                    <BookingMilesCell row={trip} />
                  </td>

                  <td className="px-3 py-2.5 text-right min-w-[100px]">
                    <BookingCopayCell row={trip} />
                  </td>

                  <td className="px-3 py-2.5 text-right min-w-[100px]">
                    <BookingPayerChargeCell row={trip} />
                  </td>

                  <td className="px-3 py-2.5">
                    <span className="text-xs text-ink-3 block max-w-[150px] truncate" title={trip.tripNote || trip.notes || ''}>
                      {trip.tripNote || trip.notes || '—'}
                    </span>
                  </td>

                  <td className="px-3 py-2.5">
                    <span className="text-xs text-ink-3 block max-w-[150px] truncate" title={trip.internalPrivateNote || trip.privateNotes || ''}>
                      {trip.internalPrivateNote || trip.privateNotes || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTrips.length === 0 && (
          <div className="p-12 text-center text-ink-4">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-ink">No trips found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTrips.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
        />
      </Card>
    </>
  );
};
