import React from 'react';
import {
  Search, List, ArrowRight, MapPin, Repeat, MoveRight,
  Check, Users, ChevronRight, Trash2, CheckCircle2, ClipboardList
} from 'lucide-react';
import { Avatar, Badge, Button, Pagination, TripStatusBadge } from '@/shared/components/ui';
import { formatTime, formatShortDate } from '@/utils/helpers';
import { DollarSign } from 'lucide-react';

interface BookingsListProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bookingSearch: string;
  setBookingSearch: (val: string) => void;
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
}

export const BookingsList: React.FC<BookingsListProps> = ({
  activeTab, setActiveTab, bookingSearch, setBookingSearch,
  filteredTrips, paginatedBookings, selectedTrips, toggleSelectAll, toggleSelectTrip,
  openBooking, selectedBookingId, handleApprove, setIsAssigning,
  currentPage, totalPages, itemsPerPage, setItemsPerPage, setCurrentPage, trips, drivers,
  setSelectedTrips, handleBulkAction
}) => {
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

      <div className="relative w-full max-w-sm shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
        <input
          type="text"
          placeholder="Search rider or ID..."
          value={bookingSearch}
          onChange={e => { setBookingSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-8 pr-3 py-2 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none"
        />
      </div>

      <div className="bg-white border border-line-2 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm">
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
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Trip ID</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Date</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Pickup Time</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Appt</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Rider</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-center">Status</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Route</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Trip Reason</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Distance</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Type</th>
                    <th className="px-3 py-2.5 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Funding</th>
                    <th className="px-3 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {paginatedBookings.map((booking: any) => (
                    <tr
                      key={booking.id}
                      onClick={() => openBooking(booking.id)}
                      className={`border-b border-line-2 hover:bg-line-2/20 transition-colors cursor-pointer ${selectedBookingId === booking.id ? 'bg-primary-tint/20' : 'hover:bg-bg'} ${selectedTrips.includes(booking.id) ? 'bg-accent-light/10' : ''} ${booking.isUrgent ? 'border-l-4 border-l-urgent border-urgent/30 bg-urgent-light/10' : ''}`}
                    >
                      {activeTab === 'pending' && (
                        <td className="pl-4 pr-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedTrips.includes(booking.id)} onChange={() => toggleSelectTrip(booking.id)} className="w-4 h-4 rounded border-line text-primary cursor-pointer" />
                        </td>
                      )}

                      {/* Trip ID */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="font-mono text-xs text-ink-3 whitespace-nowrap">#{booking?.id || '---'}</span>
                          {booking.isUrgent && <span className="bg-urgent text-white text-xs font-medium px-1.5 py-0.5 rounded uppercase shadow-sm shadow-urgent/30">URGENT</span>}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-medium text-ink whitespace-nowrap">{booking?.scheduledTime ? formatShortDate(booking.scheduledTime) : (booking?.submittedTime ? formatShortDate(booking.submittedTime) : '-')}</span>
                      </td>

                      {/* Pickup Time */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-ink">{booking?.requestedPickup || formatTime(booking?.scheduledTime)}</p>
                      </td>

                      {/* Appt */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-primary">{booking?.appointmentTime || 'N/A'}</p>
                      </td>

                      {/* Rider */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar initials={booking?.rider?.initials || '?'} size="xs" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-ink leading-tight whitespace-nowrap">{booking?.rider?.name || 'Unknown'}</p>
                            {(booking?.passengerId || booking?.authorizationId) && (
                              <p
                                className="text-[10px] font-medium text-ink-4 mt-0.5 whitespace-nowrap truncate max-w-[120px]"
                                title={booking?.passengerId ? `PX: ${booking.passengerId}` : `Auth: ${booking.authorizationId}`}
                              >
                                {booking?.passengerId ? `PX: ${booking.passengerId}` : `Auth: ${booking.authorizationId}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 text-center">
                        <TripStatusBadge status={booking.status} className="text-[10px] whitespace-nowrap" />
                      </td>

                      {/* Route */}
                      <td className="px-3 py-2.5">
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
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink max-w-[160px]">
                          <ClipboardList size={12} className="text-ink-4 shrink-0" />
                          <span className="truncate" title={booking?.reason || ''}>{booking?.reason || '—'}</span>
                        </span>
                      </td>

                      {/* Distance */}
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-medium text-ink whitespace-nowrap">{booking?.distance || (booking?.miles ? `${booking.miles} mi` : '—')}</span>
                      </td>

                      {/* Type */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5 font-medium">{booking?.mobility || 'Standard'}</Badge>
                          <div className="flex items-center gap-1 text-[10px] text-ink-4">
                            {booking?.type === 'round_trip' ? (
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

                      {/* Funding */}
                      <td className="px-3 py-2.5">
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
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${colorClass}`}>
                                <DollarSign size={9} />{fs}
                              </span>
                            );
                          })()}
                          {booking.insideCounty !== undefined && (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${booking.insideCounty ? 'text-accent bg-accent/5 border-accent/20' : 'text-urgent bg-urgent/5 border-urgent/20'}`}>
                              {booking.insideCounty ? 'In-County' : 'Out-of-County'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {activeTab === 'pending' ? (
                            <button className="p-2 text-accent hover:bg-accent-light rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); handleApprove(booking.id); }}><Check size={18} /></button>
                          ) : (
                            <button className="p-2 text-primary hover:bg-primary-light rounded-xl transition-all flex items-center gap-1.5 px-3" onClick={(e) => { e.stopPropagation(); openBooking(booking.id); setIsAssigning(true); }}><Users size={16} /><span className="text-xs font-medium">Assign Driver</span></button>
                          )}
                          <ChevronRight size={15} className="text-ink-4" />
                        </div>
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

      {selectedTrips.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-ink text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">{selectedTrips.length}</div>
              <div><p className="text-sm font-medium">Trips Selected</p><p className="text-xs text-white/50">Ready for action</p></div>
            </div>
            <div className="flex items-center gap-4">
              {activeTab === 'pending' ? (
                <>
                  <Button variant="primary" size="md" icon={Check} className="bg-accent border-none px-6" onClick={() => handleBulkAction('approve')}>Approve All</Button>
                  <Button variant="outline" size="md" icon={Trash2} className="border-white/20 text-white hover:bg-white/10 px-6" onClick={() => handleBulkAction('cancel')}>Cancel All</Button>
                </>
              ) : (
                <Button variant="outline" size="md" icon={Trash2} className="border-white/20 text-white hover:bg-white/10 px-6" onClick={() => handleBulkAction('cancel')}>Cancel All</Button>
              )}
              <button onClick={() => setSelectedTrips([])} className="text-xs font-medium text-white/40 hover:text-white transition-colors ml-4">Deselect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
