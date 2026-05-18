import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Users, BarChart3, AlertTriangle,
  ChevronRight, Clock, MapPin, Circle,
  Loader2, FileWarning, UserPlus,
  CalendarDays, MoveRight, Repeat
} from 'lucide-react';
import { Card, StatCard, Avatar, Badge, TripStatusBadge, Button, Pagination } from '@/shared/components/ui';
import { opsStats, drivers } from '../data/mockData';
import { formatTime, formatShortDate } from '../utils/helpers';
import { useTrips } from '../hooks/useTrips';
import { useReports } from '../hooks/useReports';

const Operations = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { trips, loading: tripsLoading } = useTrips();
  const { reports, loading: reportsLoading } = useReports();

  const loading = tripsLoading || reportsLoading;

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
  const activeTrips = (trips || []).filter((t: any) => ['in_trip', 'assigned', 'pending_review', 'en_route', 'arrived'].includes(t?.status));
  const pendingTrips = (trips || []).filter((t: any) => t?.status === 'pending_review');
  const openReports = (reports || []).filter((r: any) => r?.status === 'open');

  const totalPages = Math.ceil(activeTrips.length / itemsPerPage);
  const paginatedActiveTrips = activeTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusIcon = (status: string) => {
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
          <h1 className="text-3xl font-bold font-display text-ink tracking-normal">Fleet Operations</h1>
          <p className="text-sm text-ink-3 font-medium mt-1 tracking-normal">Managing {trips.length} active and scheduled assignments</p>
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
          <div><p className="text-xs font-bold text-ink">Review Bookings</p><p className="text-xs font-medium text-warning-dark">{pendingTrips.length} awaiting</p></div>
        </button>

        <button onClick={() => navigate('/live')} className="flex items-center gap-3 bg-accent-light/40 hover:bg-accent-light/70 border border-accent/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-accent pulse-dot" /></div>
          <div><p className="text-xs font-bold text-ink">Live Map</p><p className="text-xs font-medium text-accent">Real-time tracking</p></div>
        </button>

        <button onClick={() => navigate('/trips?tab=schedule')} className="flex items-center gap-3 bg-primary-tint/40 hover:bg-primary-tint/70 border border-primary/10 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"><CalendarDays size={18} className="text-primary" /></div>
          <div><p className="text-xs font-bold text-ink">Fleet Schedule</p><p className="text-xs font-medium text-primary">Shift management</p></div>
        </button>

        <button onClick={() => navigate('/reports')} className="flex items-center gap-3 bg-urgent-light/40 hover:bg-urgent-light/70 border border-urgent/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-urgent/10 rounded-lg flex items-center justify-center flex-shrink-0"><FileWarning size={18} className="text-urgent" /></div>
          <div><p className="text-xs font-bold text-ink">Open Reports</p><p className="text-xs font-medium text-urgent">{openReports.length} reports</p></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Active Trips</h2>
              <button onClick={() => navigate('/trips')} className="text-xs font-bold text-primary hover:underline">View all →</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-bg/60 border-b border-line-2">
                    <th className="px-6 py-4 text-xs font-semibold text-ink-4 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-ink-4 uppercase tracking-widest">Rider</th>
                    <th className="px-6 py-4 text-xs font-semibold text-ink-4 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-xs font-semibold text-ink-4 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-ink-4 uppercase tracking-widest">Driver</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {paginatedActiveTrips.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-4 font-medium">No active trips today.</td></tr>
                  ) : paginatedActiveTrips.map((trip: any) => {
                    const driver = (drivers || []).find((d: any) => d.id === trip?.driverId);
                    return (
                      <tr key={trip.id} className="hover:bg-bg/40 transition-colors group cursor-pointer" onClick={() => navigate('/live')}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-ink-3 tracking-normal uppercase">#{trip.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
                            <span className="text-sm font-bold text-ink">{trip?.rider?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-ink">{formatTime(trip?.scheduledTime)}</p>
                          <p className="text-xs text-ink-4">{formatShortDate(trip?.scheduledTime)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TripStatusBadge status={trip.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Truck size={14} className="text-ink-4" />
                            <span className="text-sm font-medium text-ink-3">{driver?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <ChevronRight size={16} className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
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
            <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning pulse-dot"></span><h3 className="text-xs font-bold text-ink">Pending Bookings</h3></div><button onClick={() => navigate('/bookings')} className="text-xs font-bold text-primary hover:underline">Review all</button></div>
            <div className="divide-y divide-line-2">
              {pendingTrips.slice(0, 4).map((trip: any) => (
                <div key={trip?.id} onClick={() => navigate('/bookings')} className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"><div className="flex items-center gap-2.5 min-w-0"><Avatar initials={trip?.rider?.initials || '?'} size="xs" /><div className="min-w-0"><p className="text-xs font-bold text-ink truncate">{trip?.rider?.name || 'Unknown'}</p><p className="text-xs text-ink-4 whitespace-nowrap">{formatShortDate(trip?.scheduledTime)} · {formatTime(trip?.scheduledTime)}</p></div></div><ChevronRight size={14} className="text-ink-4 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" /></div>
              ))}
              {pendingTrips.length === 0 && <p className="px-4 py-5 text-xs text-ink-4 text-center font-medium">All bookings reviewed ✓</p>}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between"><div className="flex items-center gap-2"><FileWarning size={14} className="text-urgent" /><h3 className="text-xs font-bold text-ink">Open Reports</h3></div><button onClick={() => navigate('/reports')} className="text-xs font-bold text-primary hover:underline">View all</button></div>
            <div className="divide-y divide-line-2">
              {openReports.slice(0, 4).map(report => (
                <div key={report?.id} onClick={() => navigate('/reports')} className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"><div className="min-w-0"><p className="text-xs font-bold text-ink truncate">{report?.type || 'Incident'}</p><p className="text-xs text-ink-4">By {report?.filedBy?.name || 'Unknown'}</p></div><Badge variant={report?.severity === 'high' ? 'urgent' : 'warning'} className="flex-shrink-0 ml-2">{report?.severity || 'medium'}</Badge></div>
              ))}
              {openReports.length === 0 && <p className="px-4 py-5 text-xs text-ink-4 text-center font-medium">No open reports ✓</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Operations;
