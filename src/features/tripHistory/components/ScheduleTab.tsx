import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Truck, Clock, MapPin, Users, Calendar } from 'lucide-react';
import { Card, Avatar, Badge } from '@/shared/components/ui';
import { formatTime } from '@/utils/helpers';

interface ScheduleTabProps {
  drivers: any[];
  trips: any[];
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ drivers, trips }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Calculate assigned vs unassigned metrics for the specific day
  const dailyTrips = useMemo(() => {
    return (trips || []).filter(t => {
      const tripDate = new Date(t.scheduledTime);
      return tripDate.toDateString() === selectedDate.toDateString() && t.status !== 'cancelled';
    });
  }, [trips, selectedDate]);

  const assignedCount = dailyTrips.filter(t => t.driverId).length;
  const unassignedCount = dailyTrips.filter(t => !t.driverId).length;

  // Timeline configuration: 6 AM to 10 PM
  const START_HOUR = 6;
  const END_HOUR = 22;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  
  const timelineHours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Helper to map a time string/Date to a percentage on the X axis
  const getPercentageFromTime = (dateString: string) => {
    const d = new Date(dateString);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    
    // If before start time, pin to 0
    if (hours < START_HOUR) return 0;
    // If after end time, pin to 100
    if (hours >= END_HOUR && minutes > 0) return 100;
    
    const minutesSinceStart = ((hours - START_HOUR) * 60) + minutes;
    const totalMinutes = TOTAL_HOURS * 60;
    
    return (minutesSinceStart / totalMinutes) * 100;
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Group trips by driver
  const tripsByDriver = useMemo(() => {
    const mapping: Record<string, any[]> = {};
    (drivers || []).forEach(d => {
      mapping[d.id] = dailyTrips.filter(t => t.driverId === d.id).sort((a, b) => 
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      );
    });
    return mapping;
  }, [dailyTrips, drivers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-line-2 shadow-sm">
        
        {/* Date Navigator Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-bg rounded-xl border border-line-2">
          <button onClick={handlePrevDay} className="w-8 h-8 rounded-lg bg-white hover:bg-primary/5 flex items-center justify-center text-ink-3 hover:text-primary transition-all border border-line-2/50 shadow-sm">
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <div className="px-4 text-xs font-semibold text-ink min-w-[140px] text-center flex items-center justify-center gap-2">
            <Calendar size={14} className="text-primary" />
            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <button onClick={handleNextDay} className="w-8 h-8 rounded-lg bg-white hover:bg-primary/5 flex items-center justify-center text-ink-3 hover:text-primary transition-all border border-line-2/50 shadow-sm">
            <ChevronRight size={16} strokeWidth={2} />
          </button>
          {selectedDate.toDateString() !== new Date().toDateString() && (
            <button onClick={handleToday} className="ml-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition-all">
              Today
            </button>
          )}
        </div>

        {/* Standard KPI Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-line-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Truck size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ink-4 uppercase">Assigned</p>
              <p className="text-lg font-bold text-ink leading-none">{assignedCount}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-line-2 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-urgent/10 flex items-center justify-center">
              <Users size={14} className="text-urgent" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ink-4 uppercase">Unassigned</p>
              <p className="text-lg font-bold text-urgent leading-none">{unassignedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Timeline Grid - Clean UI */}
      <Card className="overflow-x-auto relative p-0">
        <div className="min-w-[1200px]">
          {/* Timeline Header (X-Axis) */}
          <div className="sticky top-0 z-30 flex bg-bg border-b border-line-2">
            {/* Driver Column Header */}
            <div className="w-[300px] min-w-[300px] shrink-0 p-4 border-r border-line-2 flex items-center">
              <span className="text-xs font-bold text-ink-3 uppercase">Driver & Fleet</span>
            </div>
            
            {/* Hours Ruler */}
            <div className="flex-1 relative h-16">
              {timelineHours.map((hour, idx) => {
                const leftPercent = (idx / TOTAL_HOURS) * 100;
                const displayHour = hour > 12 ? hour - 12 : hour;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                
                return (
                  <React.Fragment key={hour}>
                    <div className="absolute top-0 bottom-0 border-l border-line-2/40" style={{ left: `${leftPercent}%` }}>
                      <div className="absolute -left-6 top-4 w-12 text-center">
                        <span className="text-[11px] font-bold text-ink-3 tracking-wide">
                          {displayHour} <span className="text-[9px] text-ink-4">{ampm}</span>
                        </span>
                      </div>
                    </div>
                    {/* Half-hour subtle tick */}
                    {idx < TOTAL_HOURS && (
                      <div className="absolute top-1/2 bottom-0 border-l border-dashed border-line-2/20" style={{ left: `${leftPercent + (100 / TOTAL_HOURS / 2)}%` }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Timeline Rows (Drivers) */}
          <div className="divide-y divide-line-2/40 relative pb-10 bg-bg/20">
            {/* Current Time Indicator Line (only show if viewing today) */}
            {selectedDate.toDateString() === new Date().toDateString() && (() => {
              const now = new Date();
              const nowPercent = getPercentageFromTime(now.toISOString());
              if (nowPercent > 0 && nowPercent < 100) {
                return (
                  <div 
                    className="absolute top-0 bottom-0 w-[2px] bg-urgent z-40 pointer-events-none"
                    style={{ left: `calc(300px + calc(calc(100% - 300px) * ${nowPercent / 100}))` }}
                  >
                    <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-urgent shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                    <div className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-urgent/50" />
                  </div>
                );
              }
              return null;
            })()}

          {drivers.map(driver => {
            const driverTrips = tripsByDriver[driver.id] || [];
            
            return (
              <div key={driver.id} className="flex min-h-[90px] group hover:bg-white transition-colors relative z-10">
                {/* Driver Info Sidebar */}
                <div className="w-[300px] min-w-[300px] shrink-0 p-3 border-r border-line-2/40 bg-bg/20 flex flex-col justify-center gap-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <Avatar initials={driver.initials} size="sm" online={driver.onDuty} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{driver.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Truck size={10} className="text-ink-4" />
                        <span className="text-[10px] text-ink-4 truncate">
                          {driver.vehicle?.plate || 'Active'} · {driver.vehicle?.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  {driverTrips.length > 0 && (
                    <div className="flex gap-2 pl-11">
                      <Badge variant="bg" className="text-[9px] py-0">{driverTrips.length} Trips Assigned</Badge>
                    </div>
                  )}
                </div>

                {/* Driver Timeline Area */}
                <div className="flex-1 relative p-2 overflow-hidden bg-white">
                  {/* Subtle Grid Background */}
                  {timelineHours.map((_, idx) => (
                    <div key={`bg-${idx}`} className="absolute top-0 bottom-0 border-l border-line-2/20" style={{ left: `${(idx / TOTAL_HOURS) * 100}%` }} />
                  ))}
                  {timelineHours.map((_, idx) => idx < TOTAL_HOURS && (
                    <div key={`bghalf-${idx}`} className="absolute top-0 bottom-0 border-l border-dashed border-line-2/10" style={{ left: `${(idx / TOTAL_HOURS) * 100 + (100 / TOTAL_HOURS / 2)}%` }} />
                  ))}

                  {/* Render Trips */}
                  {driverTrips.map((trip, idx) => {
                    const startPercent = getPercentageFromTime(trip.scheduledTime);
                    
                    let dropoffTimeStr = trip.dropoffTime;
                    if (!dropoffTimeStr) {
                      const estDropoff = new Date(trip.scheduledTime);
                      estDropoff.setMinutes(estDropoff.getMinutes() + 45); // Assuming 45 min trip
                      dropoffTimeStr = estDropoff.toISOString();
                    }
                    const endPercent = getPercentageFromTime(dropoffTimeStr);
                    
                    const widthPercent = Math.max(endPercent - startPercent, 3); // Minimum 3% width for visibility

                    // Check for gaps (Standby) before this trip
                    let gapElement = null;
                    if (idx > 0) {
                      const prevTrip = driverTrips[idx - 1];
                      let prevEstDropoff = prevTrip.dropoffTime;
                      if (!prevEstDropoff) {
                        const d = new Date(prevTrip.scheduledTime);
                        d.setMinutes(d.getMinutes() + 45);
                        prevEstDropoff = d.toISOString();
                      }
                      const gapStart = getPercentageFromTime(prevEstDropoff);
                      const gapWidth = startPercent - gapStart;

                      if (gapWidth > 2) { // Standby period
                        gapElement = (
                          <div
                            key={`gap-${trip.id}`}
                            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full flex items-center justify-center group/gap cursor-help bg-line-2/40"
                            style={{ left: `${gapStart}%`, width: `${gapWidth}%` }}
                          >
                            <span className="absolute -top-6 text-[9px] font-bold text-ink-4 opacity-0 group-hover/gap:opacity-100 transition-opacity">Standby</span>
                          </div>
                        );
                      }
                    }

                    // Pull-out marker attached to the left of the first trip
                    let pullOut = null;
                    if (idx === 0 && startPercent > 0) {
                      pullOut = (
                        <div key={`pullout-${driver.id}`} className="absolute top-1/2 -translate-y-1/2 -translate-x-[calc(100%+8px)] flex items-center gap-1 z-10" style={{ left: `${startPercent}%` }}>
                          <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-full border border-primary/20">Pull-Out</span>
                          <div className="w-4 border-t-2 border-dashed border-primary/30" />
                        </div>
                      );
                    }

                    return (
                      <React.Fragment key={trip.id}>
                        {pullOut}
                        {gapElement}
                        <div 
                          className="absolute top-2 bottom-2 min-w-[140px] rounded-xl shadow-sm border border-line-2 bg-white hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group/trip z-20 hover:z-30"
                          style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                        >
                          {/* Left Accent Line */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${trip.status === 'in_trip' ? 'bg-urgent' : trip.status === 'completed' ? 'bg-accent' : 'bg-primary'}`} />
                          
                          <div className="flex-1 p-1.5 pl-2.5 flex flex-col">
                            <div className="flex items-start justify-between mb-0.5">
                              <span className="text-[10px] font-bold text-primary">#{trip.id.split('-')[1]}</span>
                              {trip.status === 'in_trip' && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-urgent opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-urgent"></span>
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs font-semibold text-ink truncate mb-1 pr-1">{trip.rider?.name}</p>
                            
                            <div className="flex items-center gap-1 mt-auto bg-bg/50 px-1 py-0.5 rounded w-fit">
                              <Clock size={10} className="text-ink-4 shrink-0" />
                              <span className="text-[9px] font-medium text-ink-3">
                                {formatTime(trip.scheduledTime)}
                              </span>
                            </div>
                          </div>

                          {/* Clean Hover Tooltip */}
                          <div className="absolute opacity-0 pointer-events-none group-hover/trip:opacity-100 transition-opacity duration-150 z-50 bg-white border border-line-2 shadow-lg rounded-xl p-3 w-64 -translate-y-[105%] -translate-x-1/2 left-1/2">
                            <div className="flex justify-between items-start mb-2 border-b border-line-2 pb-2">
                              <Badge variant="primary" className="text-[9px]">{trip.type === 'round_trip' ? 'Round Trip' : 'One Way'}</Badge>
                              <span className="text-[10px] font-bold text-ink-4">{formatTime(trip.scheduledTime)}</span>
                            </div>
                            <p className="text-sm font-bold text-ink mb-2">{trip.rider?.name}</p>
                            <div className="space-y-1.5 mb-2">
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                                <span className="text-[10px] text-ink-3 leading-tight">{trip.pickup}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin size={8} className="text-urgent shrink-0 mt-0.5" />
                                <span className="text-[10px] text-ink-3 leading-tight">{trip.dropoff}</span>
                              </div>
                            </div>
                            {trip.fundingSource && (
                              <div className="pt-2 border-t border-line-2 mt-2">
                                <span className="text-[9px] font-semibold text-ink-4 uppercase">Funding: </span>
                                <span className="text-[10px] font-bold text-ink">{trip.fundingSource}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {drivers.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-line-2 flex items-center justify-center mb-3">
                <Users size={20} className="text-ink-4" />
              </div>
              <p className="text-sm font-semibold text-ink">No Active Operators</p>
              <p className="text-xs text-ink-4 mt-0.5">There are no drivers scheduled for this date.</p>
            </div>
          )}
        </div>
        </div>
      </Card>
    </div>
  );
};
