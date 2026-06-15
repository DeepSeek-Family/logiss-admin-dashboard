import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Users, BarChart3, AlertTriangle,
  Clock, CalendarDays, FileWarning, Loader2
} from 'lucide-react';
import { StatCard } from '@/shared/components/ui';
import { opsStats } from '../data/mockData';
import { useTrips } from '../hooks/useTrips';
import { useReports } from '../hooks/useReports';

import {
  ActiveTripsTable,
  PendingBookingsPanel,
  OpenReportsPanel
} from '@/features/operations';

const Operations = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { trips, loading: tripsLoading } = useTrips();
  const { reports, loading: reportsLoading } = useReports();

  const loading = tripsLoading || reportsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading Operations...</p>
        </div>
      </div>
    );
  }

  // All trips relevant to today
  const activeTrips = (trips || []).filter((t: any) =>
    ['in_trip', 'assigned', 'pending_review', 'en_route', 'arrived'].includes(t?.status)
  );
  const pendingTrips = (trips || []).filter((t: any) => t?.status === 'pending_review');
  const openReports = (reports || []).filter((r: any) => r?.status === 'open');

  const totalPages = Math.ceil(activeTrips.length / itemsPerPage);
  const paginatedActiveTrips = activeTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Fleet Operations</h1>
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
          <div><p className="text-xs font-medium text-ink">Review Bookings</p><p className="text-xs font-medium text-warning-dark">{pendingTrips.length} awaiting</p></div>
        </button>

        <button onClick={() => navigate('/live')} className="flex items-center gap-3 bg-accent-light/40 hover:bg-accent-light/70 border border-accent/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-accent pulse-dot" /></div>
          <div><p className="text-xs font-medium text-ink">Live Map</p><p className="text-xs font-medium text-accent">Real-time tracking</p></div>
        </button>

        <button onClick={() => navigate('/trips?tab=schedule')} className="flex items-center gap-3 bg-primary-tint/40 hover:bg-primary-tint/70 border border-primary/10 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0"><CalendarDays size={18} className="text-primary" /></div>
          <div><p className="text-xs font-medium text-ink">Fleet Schedule</p><p className="text-xs font-medium text-primary">Shift management</p></div>
        </button>

        <button onClick={() => navigate('/reports')} className="flex items-center gap-3 bg-urgent-light/40 hover:bg-urgent-light/70 border border-urgent/20 rounded-xl px-4 py-3 transition-all hover:translate-y-[-2px] text-left">
          <div className="w-9 h-9 bg-urgent/10 rounded-lg flex items-center justify-center flex-shrink-0"><FileWarning size={18} className="text-urgent" /></div>
          <div><p className="text-xs font-medium text-ink">Open Reports</p><p className="text-xs font-medium text-urgent">{openReports.length} reports</p></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveTripsTable
            paginatedActiveTrips={paginatedActiveTrips}
            activeTripsCount={activeTrips.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
            onRowClick={() => navigate('/live')}
          />
        </div>

        <div className="space-y-4">
          <PendingBookingsPanel
            pendingTrips={pendingTrips}
            onReviewClick={() => navigate('/bookings')}
          />
          <OpenReportsPanel
            openReports={openReports}
            onReviewClick={() => navigate('/reports')}
          />
        </div>
      </div>
    </div>
  );
};

export default Operations;
