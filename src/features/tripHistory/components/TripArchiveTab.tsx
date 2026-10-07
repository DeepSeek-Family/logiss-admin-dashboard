import React, { useState } from 'react';
import { Search, MapPin, ArrowRight, Repeat, MoveRight, Filter, DollarSign, ClipboardList, SlidersHorizontal, Download, X, Accessibility, Bed, Disc, Info, User, Loader2 } from 'lucide-react';
import { Card, Badge, Avatar, Pagination } from '@/shared/components/ui';
import { formatTime, formatShortDate, money, formatTripId } from '@/utils/helpers';
import { DriverAssignSelect } from '@/features/bookings';
import { useGetAllPayersQuery } from '@/redux/api/bookingApi';
import { ServiceDateFilter } from './ServiceDateFilter';

interface TripArchiveTabProps {
  trips: any[];
  drivers: any[];
  setSelectedTripId: (id: string | null) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  updateTrip: (id: string, patch: Record<string, any>) => void;
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
  /** `YYYY-MM-DD`, or '' for all dates. */
  serviceDate: string;
  setServiceDate: (v: string) => void;
  isFetching?: boolean;
  sortBy: string;
  setSortBy: (v: string) => void;
  /** Render Date/Sort inside the filter bar (true when the map is hidden); the page
   *  header renders them instead when the map is shown. */
  inlineTimeSort?: boolean;
}

// Editable status options (mirrors TripStatusBadge config).
const STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'en_route', label: 'En Route' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'in_trip', label: 'In Trip' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

// Color cue per status so the inline dropdown still reads at a glance.
const STATUS_STYLE: Record<string, string> = {
  pending_review: 'text-amber-700 bg-amber-50 border-amber-200',
  assigned: 'text-primary bg-primary/5 border-primary/20',
  confirmed: 'text-primary bg-primary/5 border-primary/20',
  dispatched: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  en_route: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  arrived: 'text-amber-700 bg-amber-50 border-amber-200',
  in_trip: 'text-accent bg-accent/5 border-accent/20',
  completed: 'text-green-700 bg-green-50 border-green-200',
  cancelled: 'text-ink-3 bg-bg border-line-2',
  no_show: 'text-urgent bg-urgent/5 border-urgent/20',
};

// Normalize "8:32 AM" / "13:05" → "HH:MM" for <input type="time">; '' if unparseable.
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

const INLINE_INPUT =
  'bg-transparent border border-transparent hover:bg-bg/70 focus:bg-white focus:ring-2 focus:ring-primary/15 rounded-lg px-2 py-1 text-xs font-medium text-ink outline-none transition-all cursor-pointer';

// Inline time picker cell (Dispatch / Departure / Arrival).
const InlineTime: React.FC<{ value?: string; onCommit: (v: string) => void }> = ({ value, onCommit }) => (
  <input
    type="time"
    value={to24h(value)}
    onClick={(e) => e.stopPropagation()}
    onChange={(e) => onCommit(e.target.value)}
    className={`${INLINE_INPUT} w-fit min-w-0 px-1.5 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
  />
);

// Inline free-text cell (Distance / notes). Commits on blur or Enter so typing stays smooth.
const InlineText: React.FC<{ value?: string; onCommit: (v: string) => void; placeholder?: string; className?: string }> = ({
  value,
  onCommit,
  placeholder,
  className = '',
}) => {
  const [val, setVal] = useState(value ?? '');
  React.useEffect(() => { setVal(value ?? ''); }, [value]);
  return (
    <input
      type="text"
      value={val}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if (val !== (value ?? '')) onCommit(val); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className={`${INLINE_INPUT} placeholder:text-ink-4/60 ${className}`}
    />
  );
};

// Long names/addresses are clipped to save space. Hover shows the full value (native
// tooltip); clicking expands it inline so nothing is ever missed.
const TruncatedText: React.FC<{ text?: string; className?: string; max?: string }> = ({
  text,
  className = '',
  max = 'max-w-[120px]',
}) => {
  const [expanded, setExpanded] = useState(false);
  const value = text || '---';
  return (
    <span
      title={value}
      onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
      className={`cursor-pointer transition-all ${expanded ? 'whitespace-normal break-words' : `${max} truncate`} ${className}`}
    >
      {value}
    </span>
  );
};

export const TripArchiveTab: React.FC<TripArchiveTabProps> = ({
  trips,
  drivers,
  setSelectedTripId,
  selectedIds,
  setSelectedIds,
  updateTrip,
  onRowSelect,
  selectedMapId,
  search,
  setSearch,
  driverFilter,
  setDriverFilter,
  payerFilter,
  setPayerFilter,
  serviceDate,
  setServiceDate,
  isFetching,
  sortBy,
  setSortBy,
  inlineTimeSort = true,
}) => {
  const { data: payersResponse } = useGetAllPayersQuery();
  const payersList = (payersResponse?.data || []).filter((p) => p.status !== false);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when the header-controlled Date/Sort change.
  React.useEffect(() => { setCurrentPage(1); }, [serviceDate, sortBy]);
  const [countyFilter, setCountyFilter] = useState('all'); // 'all' | 'inside' | 'outside'

  // Advanced filters state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [daysFilter, setDaysFilter] = useState<string[]>([]);
  const [hoursFilter, setHoursFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Process filter logic for Trips Archive
  // Anything past the booking stage belongs here — i.e. not pending_review, OR already
  // has a driver assigned (so a driver-assigned trip always shows in Trip History).
  const historyTrips = (trips || []).filter((t: any) => t?.status !== 'pending_review' || t?.driverId);
  // Search, date, driver and payer are filtered server-side.
  const filteredTrips = historyTrips.filter((trip: any) => {
    let matchesStatus = true;
    if (filter !== 'all') {
      if (filter === 'active') matchesStatus = ['assigned', 'confirmed', 'en_route', 'arrived', 'in_trip'].includes(trip.status);
      else if (filter === 'completed') matchesStatus = trip.status === 'completed';
      else if (filter === 'cancelled') matchesStatus = trip.status === 'cancelled';
    }

    let matchesCounty = countyFilter === 'all' ||
      (countyFilter === 'inside' && trip.insideCounty === true) ||
      (countyFilter === 'outside' && trip.insideCounty === false);

    // Advanced Filter Checks
    let matchesDayOfWeek = true;
    if (daysFilter.length > 0) {
      const tripDay = new Date(trip.scheduledTime).getDay().toString();
      matchesDayOfWeek = daysFilter.includes(tripDay);
    }

    let matchesHourOfDay = true;
    if (hoursFilter.length > 0) {
      const tripHour = new Date(trip.scheduledTime).getHours();
      let category = '';
      if (tripHour >= 6 && tripHour < 12) category = 'morning';
      else if (tripHour >= 12 && tripHour < 17) category = 'afternoon';
      else if (tripHour >= 17 && tripHour < 22) category = 'evening';
      else category = 'night';
      matchesHourOfDay = hoursFilter.includes(category);
    }

    let matchesMonth = true;
    if (monthFilter !== 'all') {
      const tripMonth = new Date(trip.scheduledTime).getMonth().toString();
      matchesMonth = tripMonth === monthFilter;
    }

    let matchesYear = true;
    if (yearFilter !== 'all') {
      const tripYear = new Date(trip.scheduledTime).getFullYear().toString();
      matchesYear = tripYear === yearFilter;
    }

    return matchesStatus && matchesCounty && matchesDayOfWeek && matchesHourOfDay && matchesMonth && matchesYear;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
    if (sortBy === 'oldest') return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    if (sortBy === 'rider') return (a?.rider?.name || '').localeCompare(b?.rider?.name || '');

    // Chronological date decompositions
    const dateA = new Date(a.scheduledTime);
    const dateB = new Date(b.scheduledTime);

    if (sortBy === 'day') {
      return dateA.getDate() - dateB.getDate();
    }
    if (sortBy === 'hour') {
      const timeA = dateA.getHours() * 60 + dateA.getMinutes();
      const timeB = dateB.getHours() * 60 + dateB.getMinutes();
      return timeA - timeB;
    }
    if (sortBy === 'month') {
      return dateA.getMonth() - dateB.getMonth();
    }
    if (sortBy === 'year') {
      return dateA.getFullYear() - dateB.getFullYear();
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedTrips.length / itemsPerPage);
  const paginatedTrips = sortedTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    const headers = [
      'Trip ID', 'Passenger Name', 'Passenger ID', 'Date',
      'Pickup Address', 'Drop-off Address',
      'Scheduled Pickup', 'Pickup Arrival', 'Drop-off Completed',
      'Trip Miles', 'Trip Reason', 'Vehicle/Service', 'Mobility',
      'No-Show', 'Cancelled',
      'Payer', 'Inside County',
      'Passenger Copay', 'Payer Charge', 'Type', 'Leg'
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
        trip.insideCounty === true ? 'Yes' : trip.insideCounty === false ? 'No' : 'N/A',
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

  React.useEffect(() => {
    const handleExportEvent = () => {
      handleExport();
    };
    window.addEventListener('export-trips-csv', handleExportEvent);
    return () => {
      window.removeEventListener('export-trips-csv', handleExportEvent);
    };
  }, [sortedTrips, selectedIds, trips, drivers]);

  return (
    <>
      <Card className="overflow-hidden border-line-2 shadow-sm">
        <div className="px-5 py-3 border-b border-line-2 bg-bg/30 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="w-full sm:w-56 relative shadow-sm rounded-xl">
              {isFetching
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={16} />
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />}
              <input
                type="text"
                placeholder="Search trips, riders..."
                className="w-full bg-white border border-line-2 hover:border-primary/40 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-ink placeholder:text-ink-4/80 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none h-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-4">Status</span>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink capitalize focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Driver Filter */}
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-ink-4" />
              <span className="text-xs text-ink-4">Driver</span>
              <select
                value={driverFilter}
                onChange={(e) => { setDriverFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
              >
                <option value="all">All Drivers</option>
                {(drivers || []).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
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

            {/* Inside/Outside County Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-4">County</span>
              <select
                value={countyFilter}
                onChange={(e) => { setCountyFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
              >
                <option value="all">All</option>
                <option value="inside">Inside</option>
                <option value="outside">Outside</option>
              </select>
            </div>

            {/* Right group: Time / Sort (when map hidden) + Advanced */}
            <div className="ml-auto flex items-center gap-3 flex-wrap">
              {inlineTimeSort && (
                <>
                  <ServiceDateFilter value={serviceDate} onChange={setServiceDate} />

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-4 whitespace-nowrap">Sort</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer h-9 appearance-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="rider">Rider Name (A-Z)</option>
                      <option value="day">Scheduled Day</option>
                      <option value="hour">Scheduled Hour</option>
                      <option value="month">Scheduled Month</option>
                      <option value="year">Scheduled Year</option>
                    </select>
                  </div>
                </>
              )}

              {/* Advanced Filters — icon toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                title={showAdvanced ? 'Hide advanced filters' : 'Advanced filters'}
                aria-label="Advanced filters"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border shrink-0 ${showAdvanced
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-ink border-line-2 hover:bg-bg'
                  }`}
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvanced && (
            <div className="mt-4 p-5 bg-bg/40 border border-line rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-3 duration-300">
              {/* Days of Week */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Days of Week</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: '1', label: 'M' },
                    { key: '2', label: 'T' },
                    { key: '3', label: 'W' },
                    { key: '4', label: 'T' },
                    { key: '5', label: 'F' },
                    { key: '6', label: 'S' },
                    { key: '0', label: 'S' }
                  ].map(d => {
                    const isSel = daysFilter.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          setDaysFilter(prev => prev.includes(d.key) ? prev.filter(k => k !== d.key) : [...prev, d.key]);
                          setCurrentPage(1);
                        }}
                        className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-all border ${isSel ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-ink-3 border-line-2 hover:bg-bg'
                          }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hour of Day */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Hour of Day</label>
                <div className="flex flex-nowrap gap-1.5">
                  {[
                    { key: 'morning', label: 'Morning' },
                    { key: 'afternoon', label: 'Afternoon' },
                    { key: 'evening', label: 'Evening' }
                  ].map(h => {
                    const isSel = hoursFilter.includes(h.key);
                    return (
                      <button
                        key={h.key}
                        type="button"
                        onClick={() => {
                          setHoursFilter(prev => prev.includes(h.key) ? prev.filter(k => k !== h.key) : [...prev, h.key]);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${isSel ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-ink-3 border-line-2 hover:bg-bg'
                          }`}
                      >
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-line-2 rounded-xl py-2 px-3 text-xs font-semibold text-ink outline-none"
                >
                  <option value="all">All Months</option>
                  <option value="0">January</option>
                  <option value="1">February</option>
                  <option value="2">March</option>
                  <option value="3">April</option>
                  <option value="4">May</option>
                  <option value="5">June</option>
                  <option value="6">July</option>
                  <option value="7">August</option>
                  <option value="8">September</option>
                  <option value="9">October</option>
                  <option value="10">November</option>
                  <option value="11">December</option>
                </select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-line-2 rounded-xl py-2 px-3 text-xs font-semibold text-ink outline-none"
                >
                  <option value="all">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk-action bar — appears when one or more rows are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary-tint/40 border-b border-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-xs font-semibold text-primary-dark whitespace-nowrap">{selectedIds.length} selected</span>
            <div className="h-4 w-px bg-primary/20" />

            {/* Bulk assign driver */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-4 whitespace-nowrap">Assign</span>
              <select
                value=""
                onChange={(e) => { if (e.target.value) selectedIds.forEach(id => updateTrip(id, { driverId: e.target.value })); }}
                className="bg-white border border-line rounded-lg py-1.5 pl-2.5 pr-7 text-xs font-medium text-ink outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Driver…</option>
                {(drivers || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Bulk change status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-4 whitespace-nowrap">Status</span>
              <select
                value=""
                onChange={(e) => { if (e.target.value) selectedIds.forEach(id => updateTrip(id, { status: e.target.value })); }}
                className="bg-white border border-line rounded-lg py-1.5 pl-2.5 pr-7 text-xs font-medium text-ink outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Set status…</option>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

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
                <th className="px-3.5 py-3 type-th whitespace-nowrap text-right min-w-[110px]">Charge</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[150px]">User Note</th>
                <th className="px-3.5 py-3 type-th whitespace-nowrap min-w-[160px]">Dispatcher/Admin Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {paginatedTrips.map(trip => (
                <tr
                  key={trip.id}
                  onClick={() => onRowSelect?.(trip.id)}
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
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ink-3 whitespace-nowrap">{formatTripId(trip.id || trip._id)}</span>
                      {trip.source && <span className="text-xs text-ink-4 whitespace-nowrap">{trip.source}</span>}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[90px]">
                    <span className="text-xs font-medium text-ink whitespace-nowrap">{formatShortDate(trip.scheduledTime)}</span>
                  </td>

                  {/* Pickup Time */}
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[105px]">
                    <InlineTime
                      value={trip.pickupTime || to24h(trip.requestedPickup) || demoTimeFor(trip, 'departure')}
                      onCommit={(v) => updateTrip(trip.id, { pickupTime: v })}
                    />
                  </td>

                  {/* Appointment Time */}
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[95px]">
                    <InlineTime
                      value={to24h(trip.appointmentTime)}
                      onCommit={(v) => updateTrip(trip.id, { appointmentTime: v })}
                    />
                  </td>

                  {/* Rider */}
                  <td className="px-4 py-3 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <Avatar initials={trip.rider.initials} size="xs" />
                      <span className="text-xs font-medium text-ink whitespace-nowrap">{trip.rider.name}</span>
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

                  {/* Customer ID */}
                  <td className="px-3.5 py-3 min-w-[110px]">
                    <span className="text-xs text-ink-3 whitespace-nowrap" title={trip.passengerId || trip.rider?.passengerId || ''}>{trip.passengerId || trip.rider?.passengerId || '—'}</span>
                  </td>

                  {/* Authorization ID */}
                  <td className="px-3.5 py-3 min-w-[130px]">
                    <span className="text-xs text-ink-3 whitespace-nowrap" title={trip.authorizationId || trip.authId || ''}>{trip.authorizationId || trip.authId || '—'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-3.5 py-3 text-center min-w-[135px]">
                    <select
                      value={trip.status}
                      onChange={(e) => updateTrip(trip.id, { status: e.target.value })}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer transition-all focus:ring-2 focus:ring-primary/15 ${STATUS_STYLE[trip.status] || 'text-ink-3 bg-bg'}`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} className="text-ink bg-white">{opt.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Driver (inline assignment — smart suggestions + force-assign) */}
                  <td className="px-3.5 py-3 min-w-[160px]">
                    <DriverAssignSelect
                      trip={trip}
                      drivers={drivers}
                      allTrips={trips}
                      onAssign={(driverId) => updateTrip(trip.id, { driverId })}
                      className={`${INLINE_INPUT} max-w-[150px] ${trip.driverId ? '' : 'text-ink-4'}`}
                    />
                  </td>

                  {/* Run */}
                  <td className="px-3.5 py-3 min-w-[95px]">
                    <InlineText value={trip.driverRun} onCommit={(v) => updateTrip(trip.id, { driverRun: v })} placeholder="—" className="w-[84px] " />
                  </td>

                  {/* Route */}
                  <td className="px-3.5 py-3 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                      <TruncatedText text={trip.pickup} className="text-xs font-semibold text-ink" />

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
                      <TruncatedText text={trip.dropoff} className="text-xs font-semibold text-ink-2" />
                    </div>
                  </td>

                  {/* Trip Reason */}
                  <td className="px-3.5 py-3 min-w-[150px]">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                      <ClipboardList size={12} className="text-ink-4 shrink-0" />
                      <TruncatedText text={trip.reason || '—'} className="text-xs font-medium text-ink" max="max-w-[150px]" />
                    </span>
                  </td>

                  {/* Distance */}
                  <td className="px-3.5 py-3 min-w-[90px]">
                    <InlineText
                      value={trip.distance || (trip.miles ? `${trip.miles} mi` : '')}
                      onCommit={(v) => updateTrip(trip.id, { distance: v })}
                      placeholder="—"
                      className="w-[78px]"
                    />
                  </td>

                  {/* Trip Type */}
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[120px]">
                    <div className="flex items-center gap-1 text-xs text-ink-4">
                      {trip.type === 'round_trip' ? (
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

                  {/* Dispatch Time */}
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[110px]">
                    <InlineTime
                      value={trip.dispatchTime || demoTimeFor(trip, 'dispatch')}
                      onCommit={(v) => updateTrip(trip.id, { dispatchTime: v })}
                    />
                  </td>

                  {/* Perform (departure / trip start) */}
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[100px]">
                    <InlineTime
                      value={trip.departureTime || to24h(trip.actualPickup) || demoTimeFor(trip, 'departure')}
                      onCommit={(v) => updateTrip(trip.id, { departureTime: v })}
                    />
                  </td>

                  {/* Arrival Time */}
                  <td className="px-3.5 py-3 whitespace-nowrap min-w-[110px]">
                    <InlineTime
                      value={trip.arrivalTime || to24h(trip.actualDropoff) || demoTimeFor(trip, 'arrival')}
                      onCommit={(v) => updateTrip(trip.id, { arrivalTime: v })}
                    />
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

                  {/* County (editable) */}
                  <td className="px-3 py-2.5">
                    <select
                      value={trip.insideCounty === true ? 'inside' : trip.insideCounty === false ? 'outside' : ''}
                      onChange={(e) => updateTrip(trip.id, { insideCounty: e.target.value === 'inside' ? true : e.target.value === 'outside' ? false : undefined })}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer transition-all focus:ring-2 focus:ring-primary/15 ${trip.insideCounty === false ? 'text-urgent bg-urgent/5' : trip.insideCounty === true ? 'text-accent bg-accent/5' : 'text-ink-4 bg-bg'}`}
                    >
                      <option value="">—</option>
                      <option value="inside">In-County</option>
                      <option value="outside">Out-of-County</option>
                    </select>
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-medium text-primary">{money(trip.fundingSourceCharge ?? trip.costToCounty ?? trip.cost)}</span>
                      <div className="flex items-center gap-1.5 opacity-80">
                        <span className="text-xs font-medium text-ink-4">Copay: {money(trip.passengerCopay ?? trip.copay ?? 0)}</span>
                        <span className="text-xs font-medium text-ink-4">Payer: {money(trip.fundingSourceCharge ?? (trip.costToCounty != null ? trip.costToCounty : (trip.cost || 0)))}</span>
                      </div>
                    </div>
                  </td>

                  {/* User Note (from rider app) */}
                  <td className="px-3 py-2.5">
                    <InlineText
                      value={trip.notes}
                      onCommit={(v) => updateTrip(trip.id, { notes: v })}
                      placeholder="Add note…"
                      className="w-[150px]"
                    />
                  </td>

                  {/* Dispatcher/Admin Note (internal) */}
                  <td className="px-3 py-2.5">
                    <InlineText
                      value={trip.privateNotes}
                      onCommit={(v) => updateTrip(trip.id, { privateNotes: v })}
                      placeholder="Internal note…"
                      className="w-[150px]"
                    />
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
