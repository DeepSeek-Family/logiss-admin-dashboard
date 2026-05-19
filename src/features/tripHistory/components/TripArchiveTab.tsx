import React, { useState } from 'react';
import { Search, Download, ChevronRight, MapPin, ArrowRight, UserPlus, Repeat, MoveRight, Calendar } from 'lucide-react';
import { Card, Badge, Avatar, TripStatusBadge, Pagination, Button } from '@/shared/components/ui';
import { formatTime, formatShortDate, money } from '@/utils/helpers';

interface TripArchiveTabProps {
  trips: any[];
  drivers: any[];
  setSelectedTripId: (id: string | null) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const TripArchiveTab: React.FC<TripArchiveTabProps> = ({
  trips,
  drivers,
  setSelectedTripId,
  selectedIds,
  setSelectedIds,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        <div className="p-6 border-b border-line-2 bg-bg/30 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 max-w-2xl relative shadow-sm rounded-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input
                type="text"
                placeholder="Search trips, riders, or locations..."
                className="w-full bg-white border border-line-2 hover:border-primary/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold text-ink placeholder:text-ink-4/80 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none h-12"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-4 whitespace-nowrap">Time Period</span>
                  <div className="relative flex items-center">
                    <select
                      value={timeFilter}
                      onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-white border border-line rounded-xl py-2.5 pl-4 pr-10 text-xs font-medium text-ink focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer h-10 min-w-[140px] appearance-none"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeFilter('custom');
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-primary transition-colors focus:outline-none"
                      title="Select Custom Range"
                    >
                      <Calendar size={14} />
                    </button>
                  </div>
                </div>

                {timeFilter === 'custom' && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {
                          console.log(err);
                        }
                      }}
                      className="bg-white border border-line rounded-xl py-2 px-3 text-xs font-medium text-ink focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none h-10 shadow-sm cursor-pointer"
                      title="Start Date"
                    />
                    <span className="text-xs text-ink-4">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {
                          console.log(err);
                        }
                      }}
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
                <th className="px-3 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Trip ID</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Date & Pickup</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Rider</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Driver</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Route</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Type</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-right">Financials</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-center">Status</th>
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
                      <span className="text-xs font-semibold text-ink whitespace-nowrap">Pickup: {trip.requestedPickup || formatTime(trip.scheduledTime)}</span>
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
          {filteredTrips.length === 0 && (
            <div className="p-12 text-center text-ink-4">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-ink">No trips found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
