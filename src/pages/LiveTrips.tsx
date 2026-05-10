import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Truck,
  Plus,
  Minus,
  Battery,
  Wifi,
  Loader2,
  ExternalLink,
  MoveRight,
  MapPin
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge } from '../components/ui';
import { willCallQueue } from '../data/mockData';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { tripTypeLabel } from '../utils/helpers';

const LiveTrips = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState<string>('LOGISS-2847');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const { trips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();

  const loading = tripsLoading || driversLoading;

  const activeTrips = (trips || []).filter((t: any) =>
    ['en_route', 'arrived', 'in_trip', 'assigned'].includes(t?.status || '')
  );

  const selectedTrip = (trips || []).find((t: any) => t?.id === selectedTripId) || (activeTrips.length > 0 ? activeTrips[0] : null);
  const selectedDriver = selectedTrip ? (drivers || []).find((d: any) => d?.id === selectedTrip.driverId) : null;

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

      <div>
        <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Deployment Console</h1>
        <p className="text-sm text-ink-3 font-medium mt-1 tracking-tight">Monitoring {activeTrips.length} active operational assignments</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 h-[calc(100vh-200px)] scrollbar-hide">
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-ink-4 px-1">Active Trips</h3>
            {activeTrips.length > 0 ? activeTrips.map((trip: any) => (
              <Card
                key={trip.id}
                hover
                onClick={() => setSelectedTripId(trip.id)}
                className={`p-3 cursor-pointer transition-all ${selectedTripId === trip.id ? 'border-primary bg-primary-tint/30 ring-2 ring-primary/5 shadow-md shadow-primary/5' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-bold text-ink-4 tracking-tighter uppercase">#{trip.id}</span>
                  <TripStatusBadge status={trip.status} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
                  <h4 className="text-sm font-bold text-ink truncate">{trip?.rider?.name || 'Unknown'}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck size={12} className="text-ink-4" />
                    <span className="text-sm font-medium text-ink-3">{(drivers || []).find((d: any) => d.id === trip?.driverId)?.name || 'Unknown'}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-ink-4">{(drivers || []).find((d: any) => d.id === trip?.driverId)?.vehicle?.plate || '---'}</span>
                </div>
              </Card>
            )) : (
              <div className="p-8 text-center bg-bg rounded-xl border border-line-2">
                <p className="text-xs font-bold text-ink-4">No active trips currently</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-ink-4 px-1">Will Call Standby</h3>
            {willCallQueue.map(item => (
              <Card key={item.tripId} className="p-3 bg-warning-light/50 border-warning/10 shadow-sm shadow-warning/5">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="warning">Awaiting Return</Badge>
                  <span className="font-mono text-xs font-bold text-ink-4 uppercase">#{item.tripId}</span>
                </div>
                <p className="text-xs font-bold text-ink mb-1">{item.rider}</p>
                <p className="text-xs text-ink-3 mb-3">Picked up at {item.pickupLocation}</p>
                <Button variant="outline" size="sm" className="w-full text-warning border-warning/20 hover:bg-warning-light" onClick={() => navigate('/bookings')}>
                  Dispatch Return Trip
                </Button>
              </Card>
            ))}
          </section>
        </div>

        {/* Right Column: Map & Detail */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
          {/* Stylized Map Container */}
          <div className="relative flex-1 bg-gradient-to-br from-primary-light to-accent-light rounded-2xl border border-line-2 overflow-hidden shadow-inner min-h-[420px]">
            {/* SVG Background */}
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

              <path
                d="M 240 175 Q 400 50 560 325"
                fill="none"
                stroke="#0F6E56"
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.3"
              />
              <path
                d="M 240 175 Q 400 50 560 325"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              <g transform="translate(560, 325)">
                <circle r="8" fill="#A32D2D" />
                <circle r="12" fill="none" stroke="#A32D2D" strokeWidth="2" strokeOpacity="0.3">
                  <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>

            {/* Driver Markers */}
            <div className="absolute inset-0 pointer-events-none">
              {(drivers || []).filter((d: any) => d?.onDuty).map((driver: any, index: number) => {
                const isSelected = selectedDriver?.id === driver?.id;
                // Mock positions if not provided
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

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1">
              <button className="w-8 h-8 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Plus size={16} /></button>
              <button className="w-8 h-8 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Minus size={16} /></button>
            </div>

          </div>

          {/* Selected Trip Detail Card */}
          {selectedTrip && (
            <Card className="p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold text-ink-3 tracking-tighter">#{selectedTrip.id}</span>
                  <TripStatusBadge status={selectedTrip.status} />
                  <span className="text-xs font-semibold text-ink-4">Started {selectedTrip.actualPickup || '8:30 AM'}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={Phone}>Rider</Button>
                  <Button variant="outline" size="sm" icon={Phone}>Driver</Button>
                  <Button variant="danger" size="sm" icon={AlertTriangle} onClick={() => setShowEmergencyModal(true)}>Emergency</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div
                  className="flex gap-4 p-3 rounded-2xl hover:bg-bg cursor-pointer transition-all border border-transparent hover:border-line-2"
                  onClick={() => navigate('/riders')}
                >
                  <Avatar initials={selectedTrip.rider.initials} size="md" />
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-sm font-bold text-ink">{selectedTrip.rider.name}</h4>
                      <ExternalLink size={12} className="text-ink-4" />
                    </div>
                    <p className="text-xs font-semibold text-ink-4 mb-2">{selectedTrip.rider.phone || '(804) 555-0142'}</p>
                    <div className="flex gap-1.5"><Badge variant="primary">{selectedTrip.mobility}</Badge><Badge variant="neutral">{tripTypeLabel(selectedTrip.type)}</Badge></div>
                  </div>
                </div>

                <div
                  className="flex gap-4 p-3 rounded-2xl hover:bg-bg cursor-pointer transition-all border border-transparent hover:border-line-2"
                  onClick={() => navigate('/drivers')}
                >
                  <Avatar initials={selectedDriver?.initials || '??'} size="md" />
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-sm font-bold text-ink">{selectedDriver?.name || 'Unassigned'}</h4>
                      <ExternalLink size={12} className="text-ink-4" />
                    </div>
                    <p className="text-xs font-semibold text-ink-4 mb-2">{selectedDriver?.vehicle?.make || 'No Vehicle'} · {selectedDriver?.vehicle?.plate || '---'}</p>
                    <Badge variant="accent">{selectedDriver?.vehicle?.type || 'Standard'}</Badge>
                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-ink-4">
                      <span className="flex items-center gap-1">On duty since 08:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-line-2">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-0.5 leading-none">Origin</p>
                      <p className="text-xs font-bold text-ink max-w-[140px] truncate leading-tight">{selectedTrip.pickup}</p>
                    </div>
                  </div>

                  <div className="text-ink-4/30"><MoveRight size={14} /></div>

                  {/* Handle legacy 'stop' string and new 'stops' array */}
                  {selectedTrip.stop && !Array.isArray(selectedTrip.stop) && (
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-0.5 leading-none">Stop</p>
                        <p className="text-xs font-bold text-ink max-w-[140px] truncate leading-tight">{selectedTrip.stop}</p>
                      </div>
                    </div>
                  )}

                  {Array.isArray(selectedTrip.stops) && selectedTrip.stops.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-warning shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-0.5 leading-none">Stop {i + 1}</p>
                          <p className="text-xs font-bold text-ink max-w-[140px] truncate leading-tight">{s}</p>
                        </div>
                      </div>
                      <div className="text-ink-4/30"><MoveRight size={14} /></div>
                    </div>
                  ))}

                  <div className="flex items-center gap-3">
                    <MapPin size={13} className="text-urgent shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider mb-0.5 leading-none">Destination</p>
                      <p className="text-xs font-bold text-ink max-w-[140px] truncate leading-tight">{selectedTrip.dropoff}</p>
                    </div>
                  </div>
                </div>
                <Button variant="primary-light" size="sm" icon={MessageSquare} className="ml-auto">Message Driver</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTrips;
