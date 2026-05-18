import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  AlertTriangle,
  ChevronRight, Truck, Plus, Minus, Battery, Wifi,
  Loader2, ExternalLink, MoveRight, MapPin, X, Repeat, Search,
  Star, Mail, ShieldCheck, CalendarClock,
  Maximize2, Navigation, Clock, ChevronLeft, User, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, Avatar, Badge, Button, TripStatusBadge } from '@/shared/components/ui';
import { willCallQueue } from '../data/mockData';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { tripTypeLabel, formatTime } from '../utils/helpers';
const LiveTrips = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState<string>('LOGISS-2847');
  const [selectedDriverProfile, setSelectedDriverProfile] = useState<any>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const [dispatchModalTrip, setDispatchModalTrip] = useState<any>(null);

  const { trips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();

  const loading = tripsLoading || driversLoading;

  const activeTrips = (trips || []).filter((t: any) =>
    ['en_route', 'arrived', 'in_trip', 'assigned'].includes(t?.status || '')
  );

  const selectedTrip = (trips || []).find((t: any) => t?.id === selectedTripId) || (activeTrips.length > 0 ? activeTrips[0] : null);
  const selectedDriver = selectedTrip ? (drivers || []).find((d: any) => d?.id === selectedTrip.driverId) : null;

  const [driverSearch, setDriverSearch] = useState('');
  const [selectedRiderProfile, setSelectedRiderProfile] = useState<any>(null);

  const filteredDrivers = (drivers || []).filter((d: any) =>
    d?.onDuty &&
    (d?.name?.toLowerCase().includes(driverSearch.toLowerCase()) || d?.id?.toLowerCase().includes(driverSearch.toLowerCase()))
  );

  // Sort: Put the original driver at the top if they match search or if no search
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (a.id === dispatchModalTrip?.driverId) return -1;
    if (b.id === dispatchModalTrip?.driverId) return 1;
    return 0;
  });

  const handleQuickDispatch = (driverId: string) => {
    toast.success(`Trip ${dispatchModalTrip.tripId} dispatched to driver`);
    setDispatchModalTrip(null);
    setDriverSearch('');
  };

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-ink-3">Loading Live Trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Side Profile Drawer for Rider */}
      {selectedRiderProfile && (
        <div className="fixed inset-0 z-[300] flex justify-end">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedRiderProfile(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-line-2 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Rider Profile</h3>
              <button onClick={() => setSelectedRiderProfile(null)} className="p-2 hover:bg-bg rounded-xl text-ink-4"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex flex-col items-center text-center">
                <Avatar initials={selectedRiderProfile.initials} size="lg" className="ring-4 ring-bg shadow-xl mb-4" />
                <h4 className="text-xl font-bold text-ink leading-tight">{selectedRiderProfile.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-xs font-bold text-ink-4 tracking-normal uppercase">{selectedRiderProfile.id || 'RID-2024-8821'}</span>
                  <Badge variant="accent" dot>Active</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-bg rounded-xl border border-line-2">
                  <p className="text-xs font-bold text-ink-4 uppercase mb-1">Mobility</p>
                  <p className="text-sm font-bold text-primary">{selectedRiderProfile.mobility || 'Ambulatory'}</p>
                </div>
                <div className="p-4 bg-bg rounded-xl border border-line-2">
                  <p className="text-xs font-bold text-ink-4 uppercase mb-1">Rating</p>
                  <p className="text-sm font-bold text-warning flex items-center gap-1"><Star size={12} fill="currentColor" /> {selectedRiderProfile.rating || 4.9}</p>
                </div>
              </div>

              <section className="space-y-3">
                <h5 className="text-xs font-black text-ink uppercase tracking-widest px-1">Contact Details</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                    <Phone size={14} className="text-ink-4" />
                    <span className="text-sm font-bold text-ink">{selectedRiderProfile.phone || '(804) 555-0142'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                    <Mail size={14} className="text-ink-4" />
                    <span className="text-sm font-bold text-ink truncate">{selectedRiderProfile.email || 'margaret.t@example.com'}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h5 className="text-xs font-black text-ink uppercase tracking-widest px-1">Emergency Contact</h5>
                <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                  <div className="w-8 h-8 bg-urgent-light text-urgent rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-ink truncate">{selectedRiderProfile.emergencyContact?.name || 'Sarah Phillips'}</p>
                      <span className="text-xs font-bold text-ink-4 uppercase">{selectedRiderProfile.emergencyContact?.relation || 'Daughter'}</span>
                    </div>
                    <p className="text-xs font-bold text-primary">{selectedRiderProfile.emergencyContact?.phone || '(804) 555-9921'}</p>
                  </div>
                </div>
              </section>
            </div>
            <div className="p-6 border-t border-line-2 flex gap-3 bg-bg/30">
              <Button variant="primary" className="flex-1" icon={Phone}>Call Rider</Button>
              <Button variant="outline" className="flex-1" icon={MessageSquare}>Message</Button>
            </div>
          </div>
        </div>
      )}

      {/* Side Profile Drawer for Driver */}
      {selectedDriverProfile && (
        <div className="fixed inset-0 z-[300] flex justify-end">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedDriverProfile(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-line-2 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">Driver Profile</h3>
              <button onClick={() => setSelectedDriverProfile(null)} className="p-2 hover:bg-bg rounded-xl text-ink-4"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex flex-col items-center text-center">
                <Avatar initials={selectedDriverProfile.initials} size="lg" className="ring-4 ring-bg shadow-xl mb-4" />
                <h4 className="text-xl font-bold text-ink leading-tight">{selectedDriverProfile.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-xs font-bold text-ink-4 tracking-normal uppercase">{selectedDriverProfile.id}</span>
                  <Badge variant="accent" dot>On Duty</Badge>
                </div>
              </div>

              <section className="space-y-3">
                <h5 className="text-xs font-black text-ink uppercase tracking-widest px-1">Current Vehicle</h5>
                <div className="p-4 bg-primary-tint/10 rounded-2xl border border-primary/10 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{selectedDriverProfile.vehicle?.make || 'Ford Transit'}</p>
                    <p className="text-xs font-black text-primary uppercase tracking-widest font-mono">{selectedDriverProfile.vehicle?.plate || 'VA-0123'}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h5 className="text-xs font-black text-ink uppercase tracking-widest px-1">Contact Details</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                    <Phone size={14} className="text-ink-4" />
                    <span className="text-sm font-bold text-ink">{selectedDriverProfile.phone || '(804) 555-0199'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                    <Mail size={14} className="text-ink-4" />
                    <span className="text-sm font-bold text-ink truncate">{selectedDriverProfile.email || 'robert.w@example.com'}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h5 className="text-xs font-black text-ink uppercase tracking-widest px-1">Emergency Contact</h5>
                <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                  <div className="w-8 h-8 bg-urgent-light text-urgent rounded-lg flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-ink truncate">{selectedDriverProfile.emergencyContact?.name || 'Robert Wilson'}</p>
                      <span className="text-xs font-bold text-ink-4 uppercase">{selectedDriverProfile.emergencyContact?.relation || 'Brother'}</span>
                    </div>
                    <p className="text-xs font-bold text-primary">{selectedDriverProfile.emergencyContact?.phone || '(804) 555-0012'}</p>
                  </div>
                </div>
              </section>
            </div>
            <div className="p-6 border-t border-line-2 flex gap-3 bg-bg/30">
              <Button variant="primary" className="flex-1" icon={Phone}>Call Driver</Button>
              <Button variant="outline" className="flex-1" icon={MessageSquare}>Message</Button>
            </div>
          </div>
        </div>
      )}

      {showEmergencyModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-urgent-light rounded-xl flex items-center justify-center text-urgent">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Emergency Protocol</h3>
                <p className="text-xs text-ink-4">Active incident response</p>
              </div>
            </div>
            <div className="space-y-3">
              <a href="tel:911" className="flex items-center justify-between p-4 bg-urgent-light rounded-xl border border-urgent/20 hover:bg-urgent/10 transition-colors">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-urgent" />
                  <div>
                    <p className="text-sm font-bold text-ink">Call 911</p>
                    <p className="text-xs text-ink-4">Police / Ambulance</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-urgent">911</span>
              </a>
              <a href="tel:+18045550911" className="flex items-center justify-between p-4 bg-bg rounded-xl border border-line-2 hover:bg-primary-light transition-colors">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-bold text-ink">Logiss Emergency Line</p>
                    <p className="text-xs text-ink-4">(804) 555-0911</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">Call</span>
              </a>
            </div>
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="w-full mt-4 py-2.5 text-sm font-bold text-ink-4 hover:text-ink transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {dispatchModalTrip && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setDispatchModalTrip(null); setDriverSearch(''); }}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-line-2 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
                  <Repeat size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Quick Dispatch</h3>
                  <p className="text-xs font-bold text-ink-4 uppercase tracking-wider">#{dispatchModalTrip.tripId}</p>
                </div>
              </div>
              <button
                onClick={() => { setDispatchModalTrip(null); setDriverSearch(''); }}
                className="p-2 hover:bg-bg rounded-xl text-ink-4 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Route Panel */}
              <div className="bg-bg rounded-2xl p-5 border border-line-2 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-white" />
                    <div className="w-0.5 h-8 border-l border-line-2 border-dashed" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-ink-4 uppercase tracking-widest mb-1">Pickup</p>
                    <p className="text-sm font-bold text-ink truncate">{dispatchModalTrip.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <MapPin size={14} className="text-urgent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-ink-4 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-sm font-bold text-ink truncate">{dispatchModalTrip.returnAddress}</p>
                  </div>
                </div>
              </div>

              {/* Rider Summary */}
              <div className="flex items-center gap-4 px-1 cursor-pointer hover:bg-bg p-2 rounded-xl transition-all" onClick={() => {
                const riderObj = {
                  name: dispatchModalTrip.rider,
                  initials: dispatchModalTrip.rider.split(' ').map((n: string) => n[0]).join(''),
                  mobility: 'Wheelchair',
                  rating: 4.8
                };
                setSelectedRiderProfile(riderObj);
              }}>
                <Avatar initials={dispatchModalTrip.rider.split(' ').map((n: string) => n[0]).join('')} size="sm" />
                <div>
                  <h4 className="text-sm font-bold text-ink">{dispatchModalTrip.rider}</h4>
                  <p className="text-xs font-bold text-ink-4 uppercase tracking-wider">Patient Will Call Service</p>
                </div>
              </div>

              {/* Driver Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h5 className="text-xs font-black text-ink uppercase tracking-widest">Assign Driver</h5>
                  <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">{sortedDrivers.length} Online</span>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    className="w-full bg-bg border border-line-2 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-ink-4/50"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {sortedDrivers.length > 0 ? sortedDrivers.map((driver: any) => (
                    <button
                      key={driver.id}
                      onClick={() => handleQuickDispatch(driver.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${driver.id === dispatchModalTrip.driverId ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-line-2 bg-white hover:border-primary/20 hover:bg-bg'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedDriverProfile(driver); }}>
                          <Avatar initials={driver.initials} size="xs" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${driver.status === 'available' ? 'bg-accent' : 'bg-warning'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-bold text-ink">{driver.name}</p>
                            {driver.id === dispatchModalTrip.driverId && (
                              <Badge variant="primary" className="text-xs py-0 px-1.5 h-4 flex items-center border-none">ORIGINAL</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-ink-4 uppercase tracking-normal">{driver.vehicle.type} · {driver.vehicle.plate}</p>
                            {driver.status !== 'available' && (
                              <span className="text-xs font-bold text-warning-dark uppercase tracking-widest bg-warning/10 px-1 rounded">{driver.status.replace('_', ' ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-ink-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )) : (
                    <div className="p-10 text-center bg-bg rounded-2xl border border-dashed border-line-2">
                      <p className="text-xs font-bold text-ink-4">No matching drivers</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-line-2 bg-bg/50">
              <div className="flex items-start gap-3">
                <Repeat size={14} className="text-primary mt-0.5" />
                <p className="text-xs font-bold text-ink-4 leading-relaxed">
                  Confirmation will instantly notify the driver. All route and rider data will be synchronized to their device.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-ink">Deployment Console</h1>
        <p className="text-sm text-ink-4 mt-0.5">{activeTrips.length} active assignments</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Trip List */}
        <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto pr-1 h-[calc(100vh-200px)] scrollbar-hide">

          <section className="space-y-2">
            <p className="text-xs text-ink-4 px-1 mb-1">Active Trips</p>
            {activeTrips.length > 0 ? activeTrips.map((trip: any) => (
              <Card
                key={trip.id}
                hover
                onClick={() => setSelectedTripId(trip.id)}
                className={`p-4 cursor-pointer transition-all ${selectedTripId === trip.id ? 'border-primary ring-1 ring-primary/10 shadow-sm' : ''} ${trip.isUrgent ? 'border-l-2 border-l-urgent' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-4">#{trip.id}</span>
                    {trip.isUrgent && <span className="bg-urgent text-white text-xs font-medium px-1.5 py-0.5 rounded">Urgent</span>}
                  </div>
                  <TripStatusBadge status={trip.status} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
                  <span className="text-sm font-medium text-ink truncate">{trip?.rider?.name || 'Unknown'}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-4">
                  <div className="flex items-center gap-1.5">
                    <Truck size={11} className="shrink-0" />
                    <span className="truncate">{(drivers || []).find((d: any) => d.id === trip?.driverId)?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span>{trip.requestedPickup || formatTime(trip.scheduledTime)}</span>
                    <span className="text-primary font-medium">{trip.appointmentTime || '—'}</span>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="p-8 text-center bg-bg rounded-xl border border-line-2">
                <p className="text-xs text-ink-4">No active trips</p>
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-xs text-ink-4 px-1 mb-1">Will Call Standby</p>
            {willCallQueue.map(item => (
              <Card key={item.tripId} className="p-4 border-l-2 border-l-warning">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink">{item.rider}</span>
                  <span className="font-mono text-xs text-ink-4">#{item.tripId}</span>
                </div>
                <p className="text-xs text-ink-4 mb-3 flex items-center gap-1"><MapPin size={10} className="text-primary shrink-0" />{item.pickupLocation}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-warning border-none hover:bg-warning/80 text-white"
                  onClick={() => setDispatchModalTrip(item)}
                >
                  Dispatch Return
                </Button>
              </Card>
            ))}
          </section>
        </div>

        {/* Right Column: Map & Detail */}
        <div className="lg:col-span-8 flex flex-col gap-5 overflow-hidden">

          {/* Map */}
          <div className="relative bg-gradient-to-br from-primary-light to-accent-light rounded-xl border border-line-2 overflow-hidden min-h-[260px]">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(41, 105, 205, 0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <line x1="0" y1="175" x2="800" y2="175" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
              <line x1="0" y1="325" x2="800" y2="325" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
              <line x1="240" y1="0" x2="240" y2="500" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
              <line x1="560" y1="0" x2="560" y2="500" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
              <rect x="40" y="50" width="120" height="75" rx="4" fill="rgba(255,255,255,0.1)" />
              <rect x="360" y="200" width="80" height="50" rx="4" fill="rgba(255,255,255,0.1)" />
              <rect x="600" y="75" width="160" height="150" rx="4" fill="rgba(255,255,255,0.1)" />
              <rect x="80" y="350" width="96" height="90" rx="4" fill="rgba(255,255,255,0.1)" />
              <rect x="320" y="375" width="120" height="50" rx="4" fill="rgba(255,255,255,0.1)" />
              <path d="M 240 175 Q 400 50 560 325" fill="none" stroke="#0F6E56" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3" />
              <path d="M 240 175 Q 400 50 560 325" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
              <g transform="translate(560, 325)">
                <circle r="8" fill="#A32D2D" />
                <circle r="12" fill="none" stroke="#A32D2D" strokeWidth="2" strokeOpacity="0.3">
                  <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>

            <div className="absolute inset-0 pointer-events-none">
              {(drivers || []).filter((d: any) => d?.onDuty).map((driver: any, index: number) => {
                const isSelected = selectedDriver?.id === driver?.id;
                const left = driver?.id === 'DRV-2024-8421' ? '30%' : index === 1 ? '70%' : index === 2 ? '15%' : '85%';
                const top = driver?.id === 'DRV-2024-8421' ? '35%' : index === 1 ? '20%' : index === 2 ? '80%' : '75%';
                const status = driver?.id === 'DRV-2024-8421' ? 'in_trip' : index === 3 ? 'break' : 'available';
                const statusColor = (s: string) => s === 'in_trip' ? 'bg-accent' : s === 'break' ? 'bg-warning' : 'bg-primary';
                return (
                  <div
                    key={driver?.id || index}
                    className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 ${statusColor(status)} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white pointer-events-auto cursor-pointer group transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-white z-10' : ''}`}
                    style={{ left, top }}
                    onClick={() => {
                      const t = (trips || []).find((tr: any) => tr?.driverId === driver?.id && ['in_trip', 'en_route', 'arrived', 'assigned'].includes(tr?.status));
                      if (t) setSelectedTripId(t.id);
                    }}
                  >
                    {driver?.initials || '?'}
                    {status === 'in_trip' && <div className="absolute inset-0 rounded-full pulse-dot" />}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-ink text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl">
                      {driver?.name || 'Unknown'} · {status === 'in_trip' ? 'In Trip' : status === 'break' ? 'Break' : 'Available'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute top-3 right-3 flex flex-col gap-1">
              <button className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Plus size={14} /></button>
              <button className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Minus size={14} /></button>
            </div>
          </div>

          {/* Trip Detail Card */}
          {selectedTrip && (
            <Card className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-4">#{selectedTrip.id}</span>
                  <TripStatusBadge status={selectedTrip.status} />
                  <span className="text-xs text-ink-4">Started {selectedTrip.actualPickup || '8:30 AM'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullView(true)}
                    className="p-1.5 rounded-lg border border-line-2 text-ink-4 hover:text-primary hover:border-primary transition-all"
                    title="Focus Mode"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <Button variant="danger" size="sm" icon={AlertTriangle} onClick={() => setShowEmergencyModal(true)}>Emergency</Button>
                </div>
              </div>

              {/* Passenger + Driver */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg hover:bg-bg/80 cursor-pointer transition-all group"
                  onClick={() => setSelectedRiderProfile(selectedTrip.rider)}
                >
                  <Avatar initials={selectedTrip.rider.initials} size="sm" className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Passenger</p>
                    <p className="text-sm font-medium text-ink truncate">{selectedTrip.rider.name}</p>
                    <Badge variant="primary" className="text-xs mt-1">{selectedTrip.mobility}</Badge>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg hover:bg-bg/80 cursor-pointer transition-all group"
                  onClick={() => setSelectedDriverProfile(selectedDriver)}
                >
                  <Avatar initials={selectedDriver?.initials || '??'} size="sm" className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Driver</p>
                    <p className="text-sm font-medium text-ink truncate">{selectedDriver?.name || 'Unassigned'}</p>
                    <span className="text-xs font-mono text-ink-4">{selectedDriver?.vehicle?.plate || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Route + Times */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-bg rounded-xl mb-4 text-xs text-ink-4 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="truncate text-ink">{selectedTrip.pickup}</span>

                {(selectedTrip.stop && !Array.isArray(selectedTrip.stop)) && (
                  <>
                    <MoveRight size={11} className="text-ink-4/50 shrink-0" />
                    <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                    <span className="truncate text-ink">{selectedTrip.stop}</span>
                  </>
                )}

                {Array.isArray(selectedTrip.stops) && selectedTrip.stops.map((s: string, i: number) => (
                  <span key={i} className="flex items-center gap-2 min-w-0">
                    <MoveRight size={11} className="text-ink-4/50 shrink-0" />
                    <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                    <span className="truncate text-ink">{s}</span>
                  </span>
                ))}

                <MoveRight size={11} className="text-ink-4/50 shrink-0" />
                <MapPin size={11} className="text-urgent shrink-0" />
                <span className="truncate text-ink">{selectedTrip.dropoff}</span>

                <div className="ml-auto flex items-center gap-4 shrink-0 pl-3 border-l border-line-2">
                  <div className="text-right">
                    <p className="text-ink-4 leading-none mb-0.5">Appt</p>
                    <p className="text-sm font-semibold text-primary leading-none">{selectedTrip.appointmentTime || '09:45 AM'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-ink-4 leading-none mb-0.5">Pickup</p>
                    <p className="text-sm font-semibold text-ink leading-none">{selectedTrip.requestedPickup || '08:30 AM'}</p>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs text-ink-4">Activity Log</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-accent">Live</span>
                </div>
              </div>

              <div className="relative pl-4 space-y-2.5">
                <div className="absolute left-[5px] top-1 bottom-1 border-l border-dashed border-line-2" />
                {[
                  { time: '08:30 AM', event: 'Assigned', status: 'done' },
                  { time: '08:45 AM', event: 'Patient Loaded', status: 'done' },
                  { time: '09:10 AM', event: 'At Pharmacy Stop', status: 'current' },
                  { time: '—', event: 'En Route to Destination', status: 'upcoming' },
                  { time: '—', event: 'Completed', status: 'upcoming' },
                ].map((log, i) => (
                  <div key={i} className="relative flex items-center gap-3">
                    <div className={`absolute -left-[17px] w-2.5 h-2.5 rounded-full border-2 border-white z-10 ${
                      log.status === 'done' ? 'bg-accent' :
                      log.status === 'current' ? 'bg-primary ring-2 ring-primary/20' : 'bg-line-2'
                    }`} />
                    <span className={`text-xs flex-1 ${log.status === 'upcoming' ? 'text-ink-4' : 'text-ink'}`}>{log.event}</span>
                    <span className={`font-mono text-xs ${log.status === 'upcoming' ? 'text-ink-4' : 'text-primary'}`}>{log.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Focus Mode / Full Detail View Overlay */}
      {isFullView && selectedTrip && (
        <div className="fixed inset-0 z-[500] bg-white animate-in zoom-in-95 duration-300 flex flex-col">
          {/* Top Navigation Bar */}
          <div className="px-8 py-5 border-b border-line-2 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsFullView(false)}
                className="p-3 hover:bg-bg rounded-2xl text-ink-3 transition-all border border-line-2 shadow-sm"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold font-display text-ink tracking-normal">Trip Focus Mode</h2>
                  <Badge variant="accent" dot>Live Tracking</Badge>
                </div>
                <p className="text-sm font-medium text-ink-3">Monitoring active assignment <span className="font-bold text-primary font-mono">#{selectedTrip.id}</span> · {selectedTrip.program || 'General Program'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsFullView(false)} className="p-2 text-ink-4 hover:text-ink hover:bg-bg rounded-xl transition-all"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-12 min-h-0">
            {/* Left Column: Map View */}
            <div className="col-span-7 relative bg-primary-tint/5 border-r border-line-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-light/30 to-accent-light/30">
                {/* Reusing existing map SVG but bigger */}
                <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="none">
                  <pattern id="grid-large" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(41, 105, 205, 0.08)" strokeWidth="1" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid-large)" />
                  {/* Route Line */}
                  <path d="M100 400 Q400 50 700 300" fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeDasharray="10 6" className="animate-dash" />
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-accent)" />
                    </linearGradient>
                  </defs>
                  {/* Markers */}
                  <circle cx="100" cy="400" r="8" fill="var(--color-primary)" className="animate-pulse" />
                  <circle cx="700" cy="300" r="8" fill="var(--color-urgent)" />
                </svg>
              </div>
              {/* Map Floating Controls */}
              <div className="absolute bottom-8 left-8 flex gap-2">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-line-2 shadow-2xl space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center text-accent"><Clock size={20} /></div>
                    <div>
                      <p className="text-xs font-black text-ink-4 uppercase">Est. Completion</p>
                      <p className="text-lg font-black text-ink">10:15 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: High-Density Data Sidebar */}
            <div className="col-span-5 flex flex-col bg-bg overflow-y-auto">
              {/* Participants Section */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  {/* Rider Card */}
                  <Card className="p-5 border-none shadow-sm bg-white">
                    <p className="text-xs font-bold text-ink-4 mb-3">Passenger</p>
                    <div className="flex items-center gap-3">
                      <Avatar initials={selectedTrip.rider.initials} size="md" className="ring-2 ring-primary-tint shrink-0" />
                      <div>
                        <h4 className="text-base font-bold text-ink">{selectedTrip.rider.name}</h4>
                        <p className="text-xs text-ink-4 mt-0.5">{selectedTrip.rider.phone || '(804) 555-0142'}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {selectedTrip.passengerId && <p className="text-xs font-mono text-ink-4">PX: {selectedTrip.passengerId}</p>}
                          {selectedTrip.authorizationId && <p className="text-xs font-mono text-ink-4">Auth: {selectedTrip.authorizationId}</p>}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Driver Card */}
                  <Card className="p-5 border-none shadow-sm bg-white">
                    <p className="text-xs font-bold text-ink-4 mb-3">Operator</p>
                    <div className="flex items-center gap-3">
                      <Avatar initials={selectedDriver?.initials || '??'} size="md" className="ring-2 ring-accent-light shrink-0" />
                      <div>
                        <h4 className="text-base font-bold text-ink">{selectedDriver?.name || 'Unassigned'}</h4>
                        <p className="text-xs text-ink-4 mt-0.5">{selectedDriver?.vehicle?.plate || '---'}</p>
                        <Badge variant="accent" className="text-xs px-1.5 mt-1">{selectedDriver?.vehicle?.type || 'Standard'}</Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Operational Metadata Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-white rounded-xl border border-line-2">
                    <p className="text-xs font-bold text-ink-4 mb-1">Appointment</p>
                    <p className="text-sm font-bold text-primary">{selectedTrip.appointmentTime || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-line-2">
                    <p className="text-xs font-bold text-ink-4 mb-1">Pickup</p>
                    <p className="text-sm font-bold text-ink">{selectedTrip.requestedPickup || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-line-2">
                    <p className="text-xs font-bold text-ink-4 mb-1">Trip Type</p>
                    <p className="text-sm font-bold text-accent">{selectedTrip.type === 'round_trip' ? 'Round Trip' : 'One Way'}</p>
                  </div>
                </div>

                {/* Route Overview */}
                <Card className="p-6 bg-white border border-line-2 shadow-sm">
                  <h5 className="text-xs font-bold text-ink-4 mb-5">Operational Route</h5>
                  <div className="space-y-8 relative">
                    <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-line-2 border-l border-dashed border-line-2" />
                    <div className="relative flex items-center gap-6">
                      <div className="w-5 h-5 rounded-full bg-primary border-4 border-white shadow-sm z-10" />
                      <div>
                        <p className="text-xs font-black text-ink-4 uppercase">Origin</p>
                        <p className="text-sm font-bold text-ink">{selectedTrip.pickup}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-6">
                      <div className="w-5 h-5 rounded-full bg-warning border-4 border-white shadow-sm z-10" />
                      <div>
                        <p className="text-xs font-black text-ink-4 uppercase">Current Stop</p>
                        <p className="text-sm font-bold text-ink">{selectedTrip.stop || 'None Scheduled'}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-6">
                      <div className="w-5 h-5 rounded-full bg-urgent border-4 border-white shadow-sm z-10" />
                      <div>
                        <p className="text-xs font-black text-ink-4 uppercase">Final Destination</p>
                        <p className="text-sm font-bold text-ink">{selectedTrip.dropoff}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Timeline Section */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-ink-4">Activity Log</h5>
                  <div className="space-y-4">
                    {[
                      { time: '08:30 AM', event: 'Dispatched', status: 'done' },
                      { time: '08:42 AM', event: 'On-Site at Pickup', status: 'done' },
                      { time: '08:45 AM', event: 'Passenger Loaded', status: 'done' },
                      { time: '09:10 AM', event: 'Arrived at CVS Stop', status: 'active' },
                      { time: 'Pending', event: 'En Route to Clinic', status: 'upcoming' },
                      { time: 'Pending', event: 'Completion Protocol', status: 'upcoming' }
                    ].map((step, i) => (
                      <div key={i} className={`p-4 rounded-2xl border transition-all ${step.status === 'active' ? 'bg-primary/5 border-primary shadow-lg ring-1 ring-primary/20' : 'bg-white border-line-2'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${step.status === 'done' ? 'bg-accent' :
                                step.status === 'active' ? 'bg-primary animate-pulse' : 'bg-line-2'
                              }`} />
                            <p className={`text-xs font-black uppercase tracking-normal ${step.status === 'upcoming' ? 'text-ink-4' : 'text-ink'}`}>{step.event}</p>
                          </div>
                          <span className={`font-mono text-xs font-bold ${step.status === 'upcoming' ? 'text-ink-4' : 'text-primary'}`}>{step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrips;
