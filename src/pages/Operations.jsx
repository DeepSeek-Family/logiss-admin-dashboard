import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, Users, BarChart3, AlertTriangle,
  ChevronRight, Clock, MapPin, Circle, 
  Loader2, FileWarning, UserPlus,
  CalendarDays, MoveRight, Repeat
} from 'lucide-react';
import { Card, StatCard, Avatar, Badge, TripStatusBadge, Button, Pagination } from '../components/UI';
import { opsStats, drivers } from '../data/mockData';
import { formatTime, formatShortDate } from '../utils/helpers';
import { useTrips } from '../hooks/useTrips';
import { useReports } from '../hooks/useReports';
import { useApplications } from '../hooks/useApplications';

const Operations = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { trips, loading: tripsLoading } = useTrips();
  const { reports, loading: reportsLoading } = useReports();
  const { applications, loading: appsLoading } = useApplications();

  const loading = tripsLoading || reportsLoading || appsLoading;

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-ink-3">Loading Operations...</p>
        </div>
      </div>
    );
  }

  // All trips relevant to today
  const activeTrips = (trips || []).filter(t => ['in_trip', 'assigned', 'pending_review', 'en_route', 'arrived'].includes(t?.status));
  const pendingTrips = (trips || []).filter(t => t?.status === 'pending_review');
  const openReports = (reports || []).filter(r => r?.status === 'open');

  const totalPages = Math.ceil(activeTrips.length / itemsPerPage);
  const paginatedActiveTrips = activeTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusIcon = (status) => {
    if (status === 'in_trip' || status === 'en_route' || status === 'arrived')
      return <span className="w-2 h-2 rounded-full bg-accent pulse-dot flex-shrink-0" />;
    if (status === 'assigned')
      return <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />;
    if (status === 'pending_review')
      return <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />;
    return <span className="w-2 h-2 rounded-full bg-line flex-shrink-0" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-display text-ink tracking-tight">Today's Schedule</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-wide">{todayLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Trips Today" value={opsStats.todaysTrips} sub={`${pendingTrips.length} pending`} icon={Truck} accent="primary" />
        <StatCard label="On Duty Now" value={`${opsStats.driversOnDuty}/${opsStats.driversTotal}`} sub="Active fleet" icon={Users} accent="accent" />
        <StatCard label="Success Rate" value={`${opsStats.completionRate}%`} sub="Avg rating" icon={BarChart3} accent="accent" trend="+2.1%" />
        <StatCard label="Action Required" value={pendingTrips.length + openReports.length} sub="Needs attention" icon={AlertTriangle} accent="warning" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => navigate('/bookings')} className="flex items-center gap-3 bg-warning-light/60 hover:bg-warning-light border border-warning/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0"><Clock size={18} className="text-warning-dark" /></div>
          <div><p className="text-xs font-extrabold text-ink">Review Bookings</p><p className="text-[10px] font-bold text-warning-dark">{pendingTrips.length} awaiting</p></div>
        </button>

        <button onClick={() => navigate('/live')} className="flex items-center gap-3 bg-accent-light/40 hover:bg-accent-light/70 border border-accent/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-accent pulse-dot" /></div>
          <div><p className="text-xs font-extrabold text-ink">Live Map</p><p className="text-[10px] font-bold text-accent">Real-time tracking</p></div>
        </button>

        <button onClick={() => navigate('/schedule')} className="flex items-center gap-3 bg-primary-tint/40 hover:bg-primary-tint/70 border border-primary/10 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"><CalendarDays size={18} className="text-primary" /></div>
          <div><p className="text-xs font-extrabold text-ink">Fleet Schedule</p><p className="text-[10px] font-bold text-primary">Shift management</p></div>
        </button>

        <button onClick={() => navigate('/reports')} className="flex items-center gap-3 bg-urgent-light/40 hover:bg-urgent-light/70 border border-urgent/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-urgent/10 rounded-lg flex items-center justify-center flex-shrink-0"><FileWarning size={18} className="text-urgent" /></div>
          <div><p className="text-xs font-extrabold text-ink">Open Reports</p><p className="text-[10px] font-bold text-urgent">{openReports.length} reports</p></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-line-2 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-ink">Active Trips</h2>
              <button onClick={() => navigate('/trips')} className="text-xs font-bold text-primary hover:underline">View all →</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg/60 border-b border-line-2">
                    <th className="px-5 py-2.5 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Rider & ID</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-ink-4 uppercase tracking-widest hidden lg:table-cell">Source / County</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-ink-4 uppercase tracking-widest hidden md:table-cell">Route</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-ink-4 uppercase tracking-widest">Time (Appt)</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-ink-4 uppercase tracking-widest hidden md:table-cell">Driver</th>
                    <th className="px-5 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {paginatedActiveTrips.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-ink-4 font-medium">No active trips today.</td></tr>
                  ) : paginatedActiveTrips.map(trip => {
                    const driver = (drivers || []).find(d => d.id === trip?.driverId);
                    return (
                      <tr key={trip?.id} onClick={() => navigate(trip?.status === 'pending_review' ? '/bookings' : '/live')} className="hover:bg-bg cursor-pointer transition-colors group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {statusIcon(trip?.status)}
                            <TripStatusBadge status={trip?.status} />
                            {trip?.isUrgent && <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" title="Urgent Priority"></div>}
                          </div>
                        </td>
                        <td className="px-5 py-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink leading-none truncate flex items-center gap-2">
                                {trip?.rider?.name || 'Unknown'}
                                <span className="font-mono text-[9px] font-medium text-ink-4 bg-bg px-1 rounded uppercase tracking-tighter">#{trip?.id?.split('-')[1]}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">ID: {trip?.rider?.passengerId || '---'}</p>
                                <span className="w-1 h-1 rounded-full bg-line-3"></span>
                                <p className="text-[9px] text-ink-3 font-medium uppercase tracking-widest">{trip?.mobility || 'AMB'}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2 hidden lg:table-cell">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">{trip?.source || 'Chesterfield'}</p>
                            </div>
                            {trip?.dropoff && trip?.source && !trip.dropoff.toLowerCase().includes(trip.source.split(' ')[0].toLowerCase()) && (
                              <p className="text-[7px] font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">Cross-Jurisdiction</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 hidden lg:table-cell">
                          <div className="flex flex-col gap-0.5 relative pl-3.5">
                            <div className="absolute left-[4.5px] top-[6px] bottom-[6px] w-[1px] bg-line-2"></div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-ink relative"><div className="absolute -left-[12px] w-1.5 h-1.5 rounded-full bg-primary border border-white"></div><span className="truncate max-w-[120px]">{trip?.pickup}</span></div>
                            
                            {trip?.stops?.map((stop, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[8px] font-medium text-ink-4 relative">
                                <div className="absolute -left-[10.5px] w-1 h-1 rounded-full bg-line-3 border border-white"></div>
                                <span className="truncate max-w-[120px] italic">{stop.address}</span>
                              </div>
                            ))}

                            <div className="flex items-center gap-2 text-[10px] font-bold text-ink-3 relative"><div className="absolute -left-[12px] w-1.5 h-1.5 rounded-full bg-indigo-500 border border-white"></div><span className="truncate max-w-[120px]">{trip?.dropoff}</span></div>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="text-xs font-black text-ink">{formatTime(trip?.scheduledTime)}</p>
                          <p className="text-[10px] text-ink font-bold">Appt: {trip?.appointmentTime || '---'}</p>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          {driver ? 
                            <p className="text-xs font-bold text-ink whitespace-nowrap">{driver.name}</p> : 
                            <span className="text-[10px] italic text-ink-4">Unassigned</span>
                          }
                        </td>
                        <td className="px-5 py-3 text-right">
                          <ChevronRight size={15} className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={activeTrips.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning pulse-dot"></span><h3 className="text-xs font-extrabold text-ink">Pending Bookings</h3></div><button onClick={() => navigate('/bookings')} className="text-[10px] font-bold text-primary hover:underline">Review all →</button></div>
            <div className="divide-y divide-line-2">
              {pendingTrips.slice(0, 4).map(trip => (
                <div key={trip?.id} onClick={() => navigate('/bookings')} className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"><div className="flex items-center gap-2.5 min-w-0"><Avatar initials={trip?.rider?.initials || '?'} size="xs" /><div className="min-w-0"><p className="text-xs font-bold text-ink truncate">{trip?.rider?.name || 'Unknown'}</p><p className="text-[10px] text-ink-4 whitespace-nowrap">{formatShortDate(trip?.scheduledTime)} · {formatTime(trip?.scheduledTime)}</p></div></div><ChevronRight size={14} className="text-ink-4 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" /></div>
              ))}
              {pendingTrips.length === 0 && <p className="px-4 py-5 text-xs text-ink-4 text-center font-medium">All bookings reviewed ✓</p>}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between"><div className="flex items-center gap-2"><FileWarning size={14} className="text-urgent" /><h3 className="text-xs font-extrabold text-ink">Open Reports</h3></div><button onClick={() => navigate('/reports')} className="text-[10px] font-bold text-primary hover:underline">View all →</button></div>
            <div className="divide-y divide-line-2">
              {openReports.slice(0, 3).map(report => (
                <div key={report?.id} onClick={() => navigate('/reports')} className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"><div className="min-w-0"><p className="text-xs font-bold text-ink truncate">{report?.type || 'Incident'}</p><p className="text-[10px] text-ink-4">By {report?.filedBy?.name || 'Unknown'}</p></div><Badge variant={report?.severity === 'high' ? 'urgent' : 'warning'} className="flex-shrink-0 ml-2">{report?.severity || 'medium'}</Badge></div>
              ))}
              {openReports.length === 0 && <p className="px-4 py-5 text-xs text-ink-4 text-center font-medium">No open reports ✓</p>}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between"><div className="flex items-center gap-2"><UserPlus size={14} className="text-primary" /><h3 className="text-xs font-extrabold text-ink">Applications</h3></div><button onClick={() => navigate('/applications')} className="text-[10px] font-bold text-primary hover:underline">Review →</button></div>
            <div className="divide-y divide-line-2">
              {(applications || []).slice(0, 3).map(app => (
                <div key={app?.id} onClick={() => navigate('/applications')} className="px-4 py-3 flex items-center gap-3 hover:bg-bg cursor-pointer transition-colors"><Avatar initials={app?.initials || '?'} size="xs" /><div className="flex-1 min-w-0"><p className="text-xs font-bold text-ink truncate">{app?.name || 'Applicant'}</p><div className="w-full bg-line-2 h-1 rounded-full mt-1.5 overflow-hidden"><div className="bg-warning h-full rounded-full transition-all" style={{ width: `${((app?.stage || 0) / 4) * 100}%` }} /></div></div><span className="text-[10px] font-bold text-ink-4 flex-shrink-0">Step {app?.stage || 0}/4</span></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Operations;
