import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService } from '../services/tripService';
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
  Clock,
  Navigation,
  CheckCircle2,
  MapPin,
  X
} from 'lucide-react';
import { Card, Avatar, Badge, Button, TripStatusBadge } from '../components/UI';
import { willCallQueue } from '../data/mockData';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { tripTypeLabel, formatTime } from '../utils/helpers';

const LiveTrips = () => {
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState('LOGISS-2847');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  const { trips, loading: tripsLoading, refresh } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();
  const [localWillCall, setLocalWillCall] = useState(willCallQueue);
  const [toast, setToast] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  const loading = tripsLoading || driversLoading;

  const activeTrips = (trips || []).filter(t => 
    ['en_route', 'arrived', 'in_trip', 'assigned'].includes(t?.status)
  );

  const selectedTrip = (trips || []).find(t => t?.id === selectedTripId) || (activeTrips.length > 0 ? activeTrips[0] : null);
  const selectedDriver = selectedTrip ? (drivers || []).find(d => d?.id === selectedTrip.driverId) : null;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDispatchReturn = async (item) => {
    try {
      setDispatchingId(item.tripId);
      
      // Update status AND route in "DB"
      // For return trips, we swap pickup/dropoff or use willCall info
      const existingTrip = trips.find(t => t.id === item.tripId);
      const updatedData = {
        status: 'en_route',
        pickup: item.pickupLocation || (existingTrip?.dropoff || 'Current Location'),
        dropoff: item.returnAddress || (existingTrip?.pickup || 'Original Pickup'),
        actualPickup: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      };

      await tripService.updateTrip(item.tripId, updatedData);
      
      // Refresh global trips state
      await refresh();
      
      // Remove from local will call list
      setLocalWillCall(prev => prev.filter(q => q.tripId !== item.tripId));
      
      // Select the trip on map
      setSelectedTripId(item.tripId);
      
      showToast(`Return trip for ${item.rider} dispatched. Route set to ${updatedData.dropoff}.`);
    } catch (err) {
      console.error('Dispatch failed:', err);
      showToast('Failed to dispatch return trip. Please try again.');
    } finally {
      setDispatchingId(null);
    }
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-ink text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-sm font-bold pr-4 border-r border-white/10">{toast}</p>
          <button onClick={() => setToast(null)} className="text-white/40 hover:text-white transition-colors pl-2">
            <X size={16} />
          </button>
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
                <h3 className="text-base font-extrabold text-ink">Emergency Protocol</h3>
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
        <h1 className="text-4xl font-black font-display text-ink tracking-tight">Deployment Console</h1>
        <p className="text-ink-3 font-semibold mt-1 tracking-wide">Monitoring {activeTrips.length} active operational assignments</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 h-[calc(100vh-200px)] scrollbar-hide">
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-ink-4 uppercase tracking-widest px-1">Active Trips</h3>
            {activeTrips.length > 0 ? activeTrips.map(trip => (
              <Card 
                key={trip.id} 
                hover 
                onClick={() => setSelectedTripId(trip.id)}
                className={`p-4 cursor-pointer transition-all relative overflow-hidden ${selectedTripId === trip.id ? 'border-primary bg-primary-tint/30 ring-2 ring-primary/5 shadow-md' : ''}`}
              >
                {trip?.isUrgent && <div className="absolute top-0 right-0 w-16 h-16"><div className="absolute top-0 right-0 w-full h-full bg-warning/10 rotate-45 translate-x-8 -translate-y-8"></div><div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></div></div>}
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[10px] font-black text-ink-3 tracking-tighter uppercase">#{trip.id}</span>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{trip?.source || 'Chesterfield'}</span>
                  </div>
                  <TripStatusBadge status={trip.status} />
                </div>
                <div className="flex items-center gap-2.5 mb-4">
                  <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-ink truncate">{trip?.rider?.name || 'Unknown'}</h4>
                    <p className="text-[9px] font-bold text-ink-4">ID: {trip?.rider?.passengerId || '---'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-line-2/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary-light" className="text-[8px] font-black px-1.5 py-0">{trip?.mobility || 'AMB'}</Badge>
                    <div className="flex items-center gap-1">
                      <Truck size={10} className="text-ink-4" />
                      <span className="text-[10px] font-bold text-ink-3 truncate max-w-[80px]">{(drivers || []).find(d => d.id === trip?.driverId)?.name?.split(' ')[0] || '---'}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-ink-4">{(drivers || []).find(d => d.id === trip?.driverId)?.vehicle?.plate?.split(' ')[1] || '---'}</span>
                </div>
              </Card>
            )) : (
              <div className="p-8 text-center bg-bg rounded-xl border border-line-2">
                <p className="text-xs font-bold text-ink-4">No active trips currently</p>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-ink-4 uppercase tracking-widest px-1">Will Call Standby</h3>
            {localWillCall.map(item => (
              <Card key={item.tripId} className="p-3 bg-warning-light/50 border-warning/10 shadow-sm shadow-warning/5">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="warning">Awaiting Return</Badge>
                  <span className="font-mono text-[10px] font-bold text-ink-4 uppercase">#{item.tripId}</span>
                </div>
                <p className="text-xs font-bold text-ink mb-0.5">{item.rider}</p>
                <p className="text-[9px] font-bold text-primary mb-1.5 uppercase tracking-wider">ID: {item.passengerId || '---'}</p>
                <p className="text-[10px] text-ink-3 mb-3">Picked up at {item.pickupLocation}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-warning border-warning/20 hover:bg-warning-light flex items-center justify-center gap-2"
                  disabled={dispatchingId === item.tripId}
                  onClick={() => handleDispatchReturn(item)}
                >
                  {dispatchingId === item.tripId ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    'Dispatch Return Trip'
                  )}
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
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(41, 105, 205, 0.05)" strokeWidth="1"/>
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
              
              {/* Dynamic Route Path */}
              {selectedTrip && (
                <>
                  <path 
                    d={selectedTrip.id.includes('2840') ? "M 560 325 Q 400 450 240 175" : "M 240 175 Q 400 50 560 325"} 
                    fill="none" 
                    stroke={selectedTrip.status === 'en_route' ? '#2969CD' : '#0F6E56'} 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeOpacity="0.4"
                    className="transition-all duration-1000"
                  />
                  <path 
                    d={selectedTrip.id.includes('2840') ? "M 560 325 Q 400 450 240 175" : "M 240 175 Q 400 50 560 325"} 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeDasharray="6 6" 
                    strokeLinecap="round"
                    className="animate-[dash_20s_linear_infinite]"
                  />

                  {/* Start Point */}
                  <circle cx={selectedTrip.id.includes('2840') ? 560 : 240} cy={selectedTrip.id.includes('2840') ? 325 : 175} r="5" fill="white" stroke="#2969CD" strokeWidth="2" />
                  
                  {/* End Point (Destination) */}
                  <g transform={`translate(${selectedTrip.id.includes('2840') ? 240 : 560}, ${selectedTrip.id.includes('2840') ? 175 : 325})`}>
                    <circle r="8" fill="#A32D2D" />
                    <circle r="12" fill="none" stroke="#A32D2D" strokeWidth="2" strokeOpacity="0.3">
                      <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </>
              )}
            </svg>

            {/* Driver Markers */}
            <div className="absolute inset-0 pointer-events-none">
              {(drivers || []).filter(d => d?.onDuty).map((driver, index) => {
                const isSelected = selectedDriver?.id === driver?.id;
                // Mock positions if not provided
                const left = driver?.id === 'DRV-2024-8421' ? '30%' : index === 1 ? '70%' : index === 2 ? '15%' : '85%';
                const top = driver?.id === 'DRV-2024-8421' ? '35%' : index === 1 ? '20%' : index === 2 ? '80%' : '75%';
                const status = driver?.id === 'DRV-2024-8421' ? 'in_trip' : index === 3 ? 'break' : 'available';
                
                const statusColor = s => s === 'in_trip' ? 'bg-accent' : s === 'break' ? 'bg-warning' : 'bg-primary';
                
                return (
                  <div
                    key={driver?.id || index}
                    className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 ${statusColor(status)} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white pointer-events-auto cursor-pointer group transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-white z-10' : ''}`}
                    style={{ left, top }}
                    onClick={() => {
                      const t = (trips || []).find(tr => tr?.driverId === driver?.id && ['in_trip','en_route','arrived','assigned'].includes(tr?.status));
                      if (t) setSelectedTripId(t.id);
                    }}
                  >
                    {driver?.initials || '?'}
                    {status === 'in_trip' && <div className="absolute inset-0 rounded-full pulse-dot" />}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-ink text-white px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl">
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

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-line-2 flex flex-col gap-2 shadow-sm">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span><span className="text-[10px] font-bold text-ink-3">In Trip</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span><span className="text-[10px] font-bold text-ink-3">Available</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning"></span><span className="text-[10px] font-bold text-ink-3">On Break</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="text-[10px] font-bold text-ink-3">Destination</span></div>
            </div>
          </div>

          {/* Selected Trip Detail Card */}
          {selectedTrip && (
            <Card className="p-8 shadow-md border-line-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-black text-ink-3 tracking-tighter uppercase mb-0.5">#{selectedTrip.id}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedTrip?.source || 'Chesterfield County'}</span>
                  </div>
                  <TripStatusBadge status={selectedTrip.status} />
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-4">
                    <Clock size={14} className="text-primary" />
                    <span>Started {selectedTrip.actualPickup || '8:30 AM'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" icon={AlertTriangle} onClick={() => setShowEmergencyModal(true)}>Emergency</Button>
                </div>
              </div>

              {/* Progress Bar Section */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black text-ink uppercase tracking-widest">Trip Progress</p>
                  <p className="text-[10px] font-bold text-primary uppercase">Estimated Arrival: {selectedTrip.actualDropoff || '--:--'}</p>
                </div>
                <div className="w-full bg-line-2 h-2.5 rounded-full overflow-hidden flex">
                   <div className="bg-primary h-full transition-all duration-1000" style={{ width: selectedTrip.status === 'in_trip' ? '65%' : selectedTrip.status === 'arrived' ? '100%' : '20%' }}></div>
                   {selectedTrip.status === 'in_trip' && <div className="bg-primary/30 h-full w-full animate-pulse"></div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-8">
                <div className="flex gap-4">
                  <Avatar initials={selectedTrip.rider.initials} size="md" />
                  <div>
                    <h4 className="text-sm font-black text-ink mb-1">{selectedTrip.rider.name}</h4>
                    <p className="text-[10px] font-bold text-ink-3 mb-2">ID: {selectedTrip.rider.passengerId || '---'} · {selectedTrip.rider.phone || '---'}</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-1.5"><Badge variant="primary-light" className="text-[9px] font-black">{selectedTrip.mobility || 'AMB'}</Badge><Badge variant="neutral" className="text-[9px] font-black">{tripTypeLabel(selectedTrip.type)}</Badge></div>
                      <div>
                        <p className="text-[9px] font-bold text-ink-4 uppercase tracking-widest">Auth ID</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-tight">{selectedTrip?.authId || 'PENDING'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 border-l border-line-2 pl-8">
                  <Avatar initials={selectedDriver?.initials || '??'} size="md" online={selectedDriver?.onDuty} />
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-ink mb-1">{selectedDriver?.name || 'Unassigned'}</h4>
                    <p className="text-[10px] font-bold text-ink-3 mb-2">{selectedDriver?.vehicle?.make || 'No Vehicle'} · {selectedDriver?.vehicle?.plate || '---'}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="accent" className="text-[9px] font-black uppercase">{selectedDriver?.vehicle?.type || 'Standard'}</Badge>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-ink-4">
                        <span className="flex items-center gap-1"><Battery size={12} className="text-accent" /> {selectedDriver?.battery ?? '--'}%</span>
                        <span className="flex items-center gap-1"><Wifi size={12} className="text-accent" /> {selectedDriver?.connectivity ?? 'LTE'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 pt-6 border-t border-line-2">
                 <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Navigation size={11} className="text-primary" /> Route Detail</p>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm border border-white"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold text-ink-4 uppercase mb-0.5">Pickup</p>
                            <p className="text-xs font-bold text-ink leading-tight">{selectedTrip.pickup}</p>
                          </div>
                        </div>

                        {selectedTrip?.stops?.map((stop, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-line-3 mt-1.5 shrink-0 ml-0.5"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[8px] font-bold text-ink-4 uppercase mb-0.5 flex items-center gap-1.5">
                                Stop {idx + 1}
                              </p>
                              <p className="text-[10px] font-medium text-ink-3 italic leading-tight">{stop.address}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-3 pt-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-sm border border-white"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold text-ink-4 uppercase mb-0.5">Drop-off</p>
                            <p className="text-xs font-bold text-ink leading-tight">{selectedTrip.dropoff}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Clock size={11} className="text-primary" /> Timing Details</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[9px] font-bold text-ink-4 uppercase mb-0.5">Scheduled</p><p className="text-xs font-black text-ink">{formatTime(selectedTrip.scheduledTime)}</p></div>
                        <div><p className="text-[9px] font-bold text-ink-4 uppercase mb-0.5">Appointment</p><p className="text-xs font-black text-ink-3">{selectedTrip.appointmentTime || '---'}</p></div>
                      </div>
                    </div>
                    <div className="pt-2 flex gap-2">
                       <Button variant="primary" size="md" className="flex-1" icon={MessageSquare}>Message</Button>
                       <Button variant="outline" size="md" className="flex-1" icon={Phone}>Call</Button>
                    </div>
                 </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTrips;
