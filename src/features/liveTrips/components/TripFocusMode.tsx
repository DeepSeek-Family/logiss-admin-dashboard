import React from 'react';
import { X, Clock, ChevronLeft } from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';

interface TripFocusModeProps {
  selectedTrip: any;
  selectedDriver: any;
  setIsFullView: (val: boolean) => void;
}

export const TripFocusMode: React.FC<TripFocusModeProps> = ({
  selectedTrip,
  selectedDriver,
  setIsFullView
}) => {
  if (!selectedTrip) return null;

  return (
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
              <h2 className="text-2xl font-semibold text-ink">Trip Focus Mode</h2>
              <Badge variant="accent" dot>Live Tracking</Badge>
            </div>
            <p className="text-sm font-medium text-ink-3">Monitoring active assignment <span className="font-medium text-primary font-mono">#{selectedTrip.id}</span> · {selectedTrip.program || 'General Program'}</p>
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
                  <p className="text-[10px] font-medium text-ink-4 uppercase">Est. Completion</p>
                  <p className="text-lg font-semibold text-ink">10:15 AM</p>
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
                <p className="text-xs text-ink-4 mb-3">Passenger</p>
                <div className="flex items-center gap-3">
                  <Avatar initials={selectedTrip.rider.initials} size="md" className="ring-2 ring-primary-tint shrink-0" />
                  <div>
                    <h4 className="text-base font-semibold text-ink">{selectedTrip.rider.name}</h4>
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
                <p className="text-xs text-ink-4 mb-3">Operator</p>
                <div className="flex items-center gap-3">
                  <Avatar initials={selectedDriver?.initials || '??'} size="md" className="ring-2 ring-accent-light shrink-0" />
                  <div>
                    <h4 className="text-base font-semibold text-ink">{selectedDriver?.name || 'Unassigned'}</h4>
                    <p className="text-xs text-ink-4 mt-0.5">{selectedDriver?.vehicle?.plate || '---'}</p>
                    <Badge variant="accent" className="text-xs px-1.5 mt-1">{selectedDriver?.vehicle?.type || 'Standard'}</Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Operational Metadata Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-xl border border-line-2">
                <p className="text-xs text-ink-4 mb-1">Appointment</p>
                <p className="text-sm font-medium text-primary">{selectedTrip.appointmentTime || 'N/A'}</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-line-2">
                <p className="text-xs text-ink-4 mb-1">Pickup</p>
                <p className="text-sm font-medium text-ink">{selectedTrip.requestedPickup || 'N/A'}</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-line-2">
                <p className="text-xs text-ink-4 mb-1">Trip Type</p>
                <p className="text-sm font-medium text-accent">{selectedTrip.type === 'round_trip' ? 'Round Trip' : 'One Way'}</p>
              </div>
            </div>

            {/* Route Overview */}
            <Card className="p-6 bg-white border border-line-2 shadow-sm">
              <h5 className="text-xs text-ink-4 mb-5">Operational Route</h5>
              <div className="space-y-8 relative">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-line-2 border-l border-dashed border-line-2" />
                <div className="relative flex items-center gap-6">
                  <div className="w-5 h-5 rounded-full bg-primary border-4 border-white shadow-sm z-10" />
                  <div>
                    <p className="text-[10px] font-medium text-ink-4 uppercase">Origin</p>
                    <p className="text-sm font-medium text-ink">{selectedTrip.pickup}</p>
                  </div>
                </div>
                <div className="relative flex items-center gap-6">
                  <div className="w-5 h-5 rounded-full bg-warning border-4 border-white shadow-sm z-10" />
                  <div>
                    <p className="text-[10px] font-medium text-ink-4 uppercase">Current Stop</p>
                    <p className="text-sm font-medium text-ink">{selectedTrip.stop || 'None Scheduled'}</p>
                  </div>
                </div>
                <div className="relative flex items-center gap-6">
                  <div className="w-5 h-5 rounded-full bg-urgent border-4 border-white shadow-sm z-10" />
                  <div>
                    <p className="text-[10px] font-medium text-ink-4 uppercase">Final Destination</p>
                    <p className="text-sm font-medium text-ink">{selectedTrip.dropoff}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline Section */}
            <div className="space-y-4">
              <h5 className="text-xs text-ink-4">Activity Log</h5>
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
                        <p className={`text-xs font-medium ${step.status === 'upcoming' ? 'text-ink-4' : 'text-ink'}`}>{step.event}</p>
                      </div>
                      <span className={`font-mono text-xs ${step.status === 'upcoming' ? 'text-ink-4' : 'text-primary'}`}>{step.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
