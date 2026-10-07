import React, { useState, useEffect, useRef } from 'react';
import { 
  XCircle, Navigation, Users, Edit2, Search, MapPin 
} from 'lucide-react';
import { Avatar, Badge, Button, TripStatusBadge, loadGoogleMapsScript } from '@/shared/components/ui';
import { tripTypeLabel, formatTime, formatShortDate } from '@/utils/helpers';
import { isRoundTrip, resolveMediaUrl, parseLatLng, extractBookingStopsCoords } from '../utils/helpers';

const SidebarBookingGoogleMap: React.FC<{ booking: any }> = ({ booking }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    loadGoogleMapsScript()
      .then(() => {
        if (!active || !mapRef.current || !(window as any).google?.maps) return;
        const google = (window as any).google;

        const pCoord = parseLatLng(booking.pickupLocationRaw || booking.pickupLocation || booking.pickup);
        const dCoord = parseLatLng(booking.dropOffLocationRaw || booking.dropOffLocation || booking.dropoff);
        const stopsCoords = extractBookingStopsCoords(booking);

        const bounds = new google.maps.LatLngBounds();
        const path: any[] = [];

        const map = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: pCoord || { lat: 37.5407, lng: -77.4360 },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        if (pCoord) {
          bounds.extend(pCoord);
          path.push(pCoord);
          new google.maps.Marker({
            position: pCoord,
            map,
            title: `Pickup: ${booking.pickup || ''}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2969CD',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
        }

        stopsCoords.forEach((sCoord, i) => {
          bounds.extend(sCoord);
          path.push(sCoord);
          new google.maps.Marker({
            position: sCoord,
            map,
            title: `Stop ${i + 1}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#F59E0B',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
        });

        if (dCoord) {
          bounds.extend(dCoord);
          path.push(dCoord);
          new google.maps.Marker({
            position: dCoord,
            map,
            title: `Drop-off: ${booking.dropoff || ''}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });
        }

        if (path.length > 1) {
          new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#2969CD',
            strokeOpacity: 0.85,
            strokeWeight: 4,
            map,
          });
        }

        if (path.length > 0) {
          map.fitBounds(bounds, { top: 25, bottom: 25, left: 25, right: 25 });
        }
      })
      .catch((err) => console.warn('Sidebar Google Maps load error', err));

    return () => {
      active = false;
    };
  }, [booking]);

  return <div ref={mapRef} className="w-full h-44 rounded-xl border border-line-2 overflow-hidden shadow-sm my-2" />;
};

interface BookingDetailsSidebarProps {
  selectedBooking: any;
  assignedDriver: any;
  smartDrivers: any[];
  activeTab: string;
  closeBooking: () => void;
  handleAssign: (driverId: string) => void;
  handleReject: () => void;
  handleApprove: () => void;
  handleDispatch: () => void;
  driverSearch: string;
  setDriverSearch: (val: string) => void;
  /** Open the full edit modal to change ride details before completion. */
  onEditDetails?: (id: string) => void;
}

export const BookingDetailsSidebar: React.FC<BookingDetailsSidebarProps> = ({
  selectedBooking,
  assignedDriver,
  smartDrivers,
  activeTab,
  closeBooking,
  handleAssign,
  handleReject,
  handleApprove,
  handleDispatch,
  driverSearch,
  setDriverSearch,
  onEditDetails,
}) => {
  const [isAssigning, setIsAssigning] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-ink/50 animate-in fade-in duration-200" onClick={closeBooking}></div>
      <div className="relative w-full max-w-lg bg-white border-l border-line-2 shadow-2xl h-full animate-in slide-in-from-right duration-300">
        <div className="h-full flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-ink-4">#{selectedBooking.id}</span>
                <TripStatusBadge status={selectedBooking.status} />
              </div>
              <h2 className="text-base font-semibold text-ink">Booking Details</h2>
            </div>
            <div className="flex items-center gap-2">
              {onEditDetails && (
                <button
                  onClick={() => onEditDetails(selectedBooking.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-2 bg-white text-xs font-semibold text-ink-3 hover:text-primary hover:border-primary/40 transition-all"
                  title="Edit ride details (date, time, pickup, drop-off…)"
                >
                  <Edit2 size={13} /> Edit Details
                </button>
              )}
              <button onClick={closeBooking} className="p-1.5 hover:bg-bg rounded-lg text-ink-4 transition-colors">
                <XCircle size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable body — passenger, route, and driver assignment all scroll together */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-4 pb-4 space-y-4">
            {/* Passenger Info Card */}
            <section className="bg-bg rounded-2xl border border-line-2 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-line-2">
                <Avatar initials={selectedBooking.rider.initials} src={resolveMediaUrl(selectedBooking.rider.profile)} size="md" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink">{selectedBooking.rider.name}</h3>
                  <p className="text-xs text-ink-4 mt-0.5">
                    {selectedBooking.rider.phone ? `${selectedBooking.rider.phone} · ` : ''}
                    ID: {selectedBooking.passengerId || 'N/A'}
                  </p>
                  {(selectedBooking.authorizationId || selectedBooking.authId) && (
                    <p className="text-xs text-ink-4">
                      Auth: <span className="text-primary">{selectedBooking.authorizationId || selectedBooking.authId}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-line-2">
                <div className="p-3">
                  <p className="type-label text-ink-4 mb-0.5">Service Date</p>
                  <p className="text-sm font-semibold text-ink">{selectedBooking.serviceDate ? formatShortDate(selectedBooking.serviceDate) : 'N/A'}</p>
                </div>
                <div className="p-3">
                  <p className="type-label text-ink-4 mb-0.5">Pickup Time</p>
                  <p className="text-sm font-semibold text-ink">{selectedBooking.pickupTime || selectedBooking.requestedPickup || formatTime(selectedBooking.scheduledTime) || 'N/A'}</p>
                </div>
                <div className="p-3">
                  <p className="type-label text-ink-4 mb-0.5">Appointment</p>
                  <p className="text-sm font-semibold text-primary">{selectedBooking.appointmentTime || 'N/A'}</p>
                </div>
                {isRoundTrip(selectedBooking.tripType || selectedBooking.type) && (
                  <div className="p-3">
                    <p className="type-label text-ink-4 mb-0.5">Return Time</p>
                    <p className="text-sm font-semibold text-ink">{selectedBooking.returnTime || selectedBooking.returnPickup || 'N/A'}</p>
                  </div>
                )}
                <div className="p-3">
                  <p className="type-label text-ink-4 mb-0.5">Trip Type</p>
                  <p className="text-xs font-medium text-ink">{tripTypeLabel(selectedBooking.tripType || selectedBooking.type)}</p>
                </div>
                <div className="p-3">
                  <p className="type-label text-ink-4 mb-0.5">Mobility</p>
                  <Badge variant="warning" className="text-xs px-2 py-0.5 font-medium">{selectedBooking.mobility || 'Ambulatory'}</Badge>
                </div>
              </div>
            </section>

            {/* Route */}
            <section>
              <p className="text-xs text-ink-4 flex items-center gap-1.5 mb-2">
                <Navigation size={11} className="text-primary" /> Trip Route
              </p>
              <SidebarBookingGoogleMap booking={selectedBooking} />
              <div className="bg-bg rounded-xl p-3 border border-line-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Pickup</p>
                    <p className="text-xs font-medium text-ink">{selectedBooking.pickup}</p>
                  </div>
                </div>
                {selectedBooking.stop && !Array.isArray(selectedBooking.stop) && (
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-4 mb-0.5">Stop</p>
                      <p className="text-xs font-medium text-ink">{selectedBooking.stop}</p>
                    </div>
                  </div>
                )}
                {Array.isArray(selectedBooking.stops) && selectedBooking.stops.map((s: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-4 mb-0.5">Stop {i + 1}</p>
                      <p className="text-xs font-medium text-ink">{s}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <MapPin size={13} className="text-urgent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Drop-off</p>
                    <p className="text-xs font-medium text-ink">{selectedBooking.dropoff}</p>
                  </div>
                </div>
              </div>
            </section>


            {/* Driver Assignment */}
            <div className="pt-4 border-t border-line-2">
              <p className="text-xs text-ink-4 flex items-center gap-1.5 pb-3">
                <Users size={11} className="text-primary" /> Driver Assignment
              </p>
              <div>
              {assignedDriver && !isAssigning ? (
                <div className="border border-accent/20 bg-accent-light/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar initials={assignedDriver.initials} size="sm" online={assignedDriver.onDuty} />
                      <div>
                        <p className="text-sm font-semibold text-ink">{assignedDriver.name}</p>
                        <p className="text-xs text-ink-4">{assignedDriver.phone}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsAssigning(true)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                      <Edit2 size={10} /> Change
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line-2">
                    <div>
                      <p className="text-xs text-ink-4 mb-0.5">Vehicle</p>
                      <p className="text-xs font-medium text-ink">{assignedDriver.vehicle.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-0.5">Plate</p>
                      <p className="text-xs text-ink">{assignedDriver.vehicle.plate}</p>
                    </div>
                  </div>
                </div>
              ) : !isAssigning ? (
                <div
                  className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${activeTab === 'confirmed' ? 'border-primary bg-primary-tint/30' : 'border-line-2 bg-bg hover:bg-line-2/50'}`}
                  onClick={() => setIsAssigning(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-ink-4 shadow-sm">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">Assign a Driver</p>
                      <p className="text-xs text-ink-4">Click to select available driver</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Select</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between shrink-0">
                    <p className="text-xs text-ink-4">{driverSearch.trim() ? `Search Results (${smartDrivers.length})` : 'Recommended Drivers'}</p>
                    <button onClick={() => { setIsAssigning(false); setDriverSearch(''); }} className="text-xs font-medium text-primary hover:underline">Cancel</button>
                  </div>
                  <div className="relative shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={13} />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search any driver by name or ID..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-line-2 rounded-lg text-xs font-medium text-ink placeholder:text-ink-4 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 pr-1 max-h-72 overflow-y-auto custom-scrollbar">
                    {smartDrivers.length > 0 ? smartDrivers.map((driver: any) => (
                      <div
                        key={driver.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${driver.hasConflict ? 'border-line-2 opacity-60 bg-bg/50' : 'border-line-2 bg-white hover:border-primary/30 hover:bg-primary-tint/10'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar initials={driver.initials} size="sm" online={driver.onDuty} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink whitespace-nowrap">{driver.name}</p>
                            <p className="text-xs text-ink-4 mt-0.5 whitespace-nowrap">
                              {driver.vehicle.type} · {driver.rating} ★ ·{' '}
                              <span className={driver.onDuty ? 'text-accent' : 'text-ink-4'}>{driver.onDuty ? 'On duty' : 'Off duty'}</span>
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { handleAssign(driver.id); setIsAssigning(false); }} disabled={driver.hasConflict}>
                          {driver.hasConflict ? 'Busy' : 'Assign'}
                        </Button>
                      </div>
                    )) : (
                      <div className="py-6 flex flex-col items-center justify-center text-ink-4 border border-dashed border-line-2 rounded-xl">
                        <Search size={24} className="opacity-20 mb-2" />
                        <p className="text-xs font-medium">No drivers found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 border-t border-line-2 bg-white space-y-3 shrink-0">
            {selectedBooking.status === 'pending_review' ? (
              <div className="flex gap-3">
                <Button variant="ghost" className="text-urgent flex-1" onClick={handleReject}>Decline</Button>
                <Button variant="primary" className="flex-1" onClick={handleApprove}>Confirm</Button>
              </div>
            ) : selectedBooking.driverId ? (
              <div className="space-y-2">
                <Button 
                  variant="accent" 
                  className="w-full py-3.5 text-sm font-medium" 
                  icon={Navigation} 
                  onClick={handleDispatch}
                >
                  Confirm & Dispatch Trip
                </Button>
                <Button variant="ghost" className="w-full text-urgent text-xs" onClick={handleReject}>
                  Cancel Trip
                </Button>
              </div>
            ) : (
              <Button variant="ghost" className="w-full text-urgent" onClick={handleReject}>Cancel Trip</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
