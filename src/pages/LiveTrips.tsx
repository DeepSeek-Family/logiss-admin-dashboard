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
import { EmergencyProtocolModal, LiveTripRiderProfile, LiveTripDriverProfile, QuickDispatchModal, TripFocusMode, TripMap } from '@/features/liveTrips';
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
          <p className="text-sm text-ink-4">Loading Live Trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Side Profile Drawer for Rider */}
      <LiveTripRiderProfile profile={selectedRiderProfile} onClose={() => setSelectedRiderProfile(null)} />

      {/* Side Profile Drawer for Driver */}
      <LiveTripDriverProfile profile={selectedDriverProfile} onClose={() => setSelectedDriverProfile(null)} />

      {showEmergencyModal && <EmergencyProtocolModal onClose={() => setShowEmergencyModal(false)} />}

      <QuickDispatchModal
        dispatchModalTrip={dispatchModalTrip}
        setDispatchModalTrip={setDispatchModalTrip}
        driverSearch={driverSearch}
        setDriverSearch={setDriverSearch}
        sortedDrivers={sortedDrivers}
        handleQuickDispatch={handleQuickDispatch}
        setSelectedRiderProfile={setSelectedRiderProfile}
        setSelectedDriverProfile={setSelectedDriverProfile}
      />


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
          <TripMap drivers={drivers} trips={trips} selectedDriver={selectedDriver} setSelectedTripId={setSelectedTripId} />

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
      {isFullView && (
        <TripFocusMode
          selectedTrip={selectedTrip}
          selectedDriver={selectedDriver}
          setIsFullView={setIsFullView}
        />
      )}
    </div>
  );
};

export default LiveTrips;
