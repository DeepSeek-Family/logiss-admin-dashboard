import React, { useState } from 'react';
import { 
  XCircle, Navigation, Users, Edit2, Search, MapPin 
} from 'lucide-react';
import { Avatar, Badge, Button, TripStatusBadge } from '@/shared/components/ui';
import { tripTypeLabel, formatTime } from '@/utils/helpers';

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
}) => {
  const [isAssigning, setIsAssigning] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeBooking}></div>
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full animate-in slide-in-from-right duration-300">
        <div className="h-full flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-ink-4">#{selectedBooking.id}</span>
                <TripStatusBadge status={selectedBooking.status} />
              </div>
              <h2 className="text-base font-semibold text-ink">Booking Details</h2>
            </div>
            <button onClick={closeBooking} className="p-1.5 hover:bg-bg rounded-lg text-ink-4 transition-colors">
              <XCircle size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {/* Passenger Info Card */}
            <section className="bg-bg rounded-2xl border border-line-2 overflow-hidden">
              <div className="flex items-start justify-between p-5 border-b border-line-2">
                <div className="flex items-center gap-3">
                  <Avatar initials={selectedBooking.rider.initials} size="md" className="shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-ink">{selectedBooking.rider.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedBooking.source && (
                        <Badge variant="outline" className="text-xs font-medium text-primary border-primary/20 bg-primary/5">
                          {selectedBooking.source}
                        </Badge>
                      )}
                      {selectedBooking.county && (
                        <Badge variant="neutral" className="text-xs font-medium">
                          {selectedBooking.county}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-4 mt-1">
                      {selectedBooking.rider.phone} · PX: {selectedBooking.passengerId || 'N/A'}
                    </p>
                    <p className="text-xs text-ink-4 mt-0.5">
                      Auth: <span className="text-primary">{selectedBooking.authorizationId || selectedBooking.authId || '---'}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-line-2">
                <div className="p-4">
                  <p className="type-label text-ink-4 mb-1">Pickup Time</p>
                  <p className="text-base font-semibold text-ink">
                    {selectedBooking.requestedPickup || formatTime(selectedBooking.scheduledTime)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="type-label text-ink-4 mb-1">Appointment</p>
                  <p className="text-base font-semibold text-primary">{selectedBooking.appointmentTime || 'N/A'}</p>
                </div>
                <div className="p-4">
                  <p className="type-label text-ink-4 mb-1">Trip Type</p>
                  <p className="text-sm font-medium text-ink">{tripTypeLabel(selectedBooking.type)}</p>
                </div>
                <div className="p-4">
                  <p className="type-label text-ink-4 mb-1">Mobility</p>
                  <Badge variant="warning" className="text-xs px-2 py-0.5 font-medium">
                    {selectedBooking.mobility || 'Ambulatory'}
                  </Badge>
                </div>
              </div>
            </section>

            {/* Route Selection Map Route */}
            <section>
              <p className="text-xs text-ink-4 flex items-center gap-1.5 mb-2">
                <Navigation size={11} className="text-primary" /> Trip Route
              </p>
              <div className="bg-bg rounded-xl p-4 border border-line-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Pickup</p>
                    <p className="text-xs font-medium text-ink">{selectedBooking.pickup}</p>
                  </div>
                </div>

                {/* Legacy stop field */}
                {selectedBooking.stop && !Array.isArray(selectedBooking.stop) && (
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-4 mb-0.5">Stop</p>
                      <p className="text-xs font-medium text-ink">{selectedBooking.stop}</p>
                    </div>
                  </div>
                )}

                {/* Modern stops array */}
                {Array.isArray(selectedBooking.stops) && selectedBooking.stops.map((s: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0"></div>
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

            {/* Smart Driver Selection list */}
            <section>
              <p className="text-xs text-ink-4 flex items-center gap-1.5 mb-2">
                <Users size={11} className="text-primary" /> Driver Assignment
              </p>
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
                    <button 
                      onClick={() => setIsAssigning(true)} 
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
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
                      <p className="text-xs font-mono text-ink">{assignedDriver.vehicle.plate}</p>
                    </div>
                  </div>
                </div>
              ) : !isAssigning ? (
                <div 
                  className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    activeTab === 'confirmed' ? 'border-primary bg-primary-tint/30' : 'border-line-2 bg-bg hover:bg-line-2/50'
                  }`} 
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
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-4">Recommended Drivers</p>
                    <button 
                      onClick={() => { setIsAssigning(false); setDriverSearch(''); }} 
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={13} />
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-line-2 rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {smartDrivers.length > 0 ? smartDrivers.map((driver: any) => (
                      <div 
                        key={driver.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          driver.hasConflict 
                            ? 'border-line-2 opacity-60 bg-bg/50' 
                            : 'border-line-2 bg-white hover:border-primary/30 hover:bg-primary-tint/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={driver.initials} size="sm" online={driver.onDuty} />
                          <div>
                            <p className="text-sm font-medium text-ink">{driver.name}</p>
                            <p className="text-xs text-ink-4 mt-0.5">{driver.vehicle.type} · {driver.rating} ★</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            handleAssign(driver.id);
                            setIsAssigning(false);
                          }} 
                          disabled={driver.hasConflict}
                        >
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
            </section>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-line-2 bg-white space-y-3">
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
