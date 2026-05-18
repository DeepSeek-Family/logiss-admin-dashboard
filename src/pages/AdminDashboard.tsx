import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Car,
  Calendar,
  Activity,
  AlertTriangle,
  FileCheck,
  CreditCard,
  Shield,
  FileText,
  Flag,
  RotateCcw,
  Settings,
  UserPlus,
  Wrench,
  Loader2,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { Card, StatCard, Badge, Avatar, Button } from '@/shared/components/ui';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { money } from '../utils/helpers';

interface MonthlyData {
  month: string;
  trips: number;
  revenue: number;
}

const AdminDashboard = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState('2026');

  const { trips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();

  const loading = tripsLoading || driversLoading;

  // KPI Calculations
  const totalVehicles = (drivers || []).filter((d: any) => d?.vehicle).length;
  const activeDrivers = (drivers || []).filter((d: any) => d?.status === 'active').length;
  const totalTripsThisMonth = (trips || []).filter((t: any) => t?.scheduledTime && new Date(t.scheduledTime).getMonth() === new Date().getMonth()).length;
  const revenueThisMonth = (trips || [])
    .filter((t: any) => t?.scheduledTime && new Date(t.scheduledTime).getMonth() === new Date().getMonth() && t.status === 'completed')
    .reduce((acc: number, curr: any) => acc + (curr?.cost || 0), 0);

  // Mock Monthly Revenue Data (for 12 months)
  const monthlyData: MonthlyData[] = [
    { month: 'Jan', trips: 420, revenue: 12500 },
    { month: 'Feb', trips: 380, revenue: 11200 },
    { month: 'Mar', trips: 450, revenue: 13800 },
    { month: 'Apr', trips: totalTripsThisMonth + 300, revenue: revenueThisMonth + 10000 },
    { month: 'May', trips: 0, revenue: 0 },
    { month: 'Jun', trips: 0, revenue: 0 },
    { month: 'Jul', trips: 0, revenue: 0 },
    { month: 'Aug', trips: 0, revenue: 0 },
    { month: 'Sep', trips: 0, revenue: 0 },
    { month: 'Oct', trips: 0, revenue: 0 },
    { month: 'Nov', trips: 0, revenue: 0 },
    { month: 'Dec', trips: 0, revenue: 0 },
  ];

  const maxRevenue = 15000; // For chart scaling

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Synchronizing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Executive Dashboard</h1>
          <p className="text-sm text-ink-4 mt-0.5">Platform-wide overview and business performance metrics</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-light/30 border border-accent/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-accent">Live</span>
        </div>
      </div>

      {/* KPI Stats - Now Interactive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => navigate('/fleet')}>
          <StatCard
            label="Total Fleet Vehicles"
            value={totalVehicles}
            icon={Car}
            trend="+2 this month"
            accent="primary"
          />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => navigate('/drivers')}>
          <StatCard
            label="Total Active Drivers"
            value={activeDrivers}
            icon={Users}
            trend="8 pending approval"
            accent="accent"
          />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => navigate('/bookings')}>
          <StatCard
            label="Total Trips (Month)"
            value={totalTripsThisMonth + 300}
            icon={Calendar}
            trend="+12% vs last month"
            accent="primary"
          />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => navigate('/transactions')}>
          <StatCard
            label="Revenue (Month)"
            value={money(revenueThisMonth + 10000)}
            icon={TrendingUp}
            trend="+8% vs last month"
            accent="accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics - spans 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-line-2 h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-semibold text-ink">Trip Distribution</h3>
                <p className="text-xs text-ink-4">Monthly breakdown by type</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-xs text-ink-4">Round Trip</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent" /><span className="text-xs text-ink-4">One Way</span></div>
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-bg border border-line rounded-xl py-2 px-4 text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer"
              >
                <option value="2026">2026 Fiscal</option>
                <option value="2025">2025 Fiscal</option>
              </select>
            </div>

            <div className="relative h-[250px] w-full flex items-end justify-between pt-6 mt-4 border-b border-line-2 pb-2">
              <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
                {[4, 3, 2, 1, 0].map(line => (
                  <div key={line} className="flex items-center w-full gap-4">
                    <span className="w-12 text-right text-xs text-ink-4 font-mono">{money((maxRevenue / 4) * line)}</span>
                    <div className="flex-1 border-t border-dashed border-line-2"></div>
                  </div>
                ))}
              </div>

              <div className="w-full flex items-end justify-around h-full pl-16 z-10 pb-6">
                {monthlyData.map((data, idx) => {
                  const tripHeight = (data.trips / 500) * 100;
                  const revenueHeight = (data.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="relative flex flex-col items-center justify-end h-full w-full group">
                      <div className="flex items-end gap-1 w-full justify-center h-full">
                        <div className="w-3 bg-primary/20 rounded-t-sm transition-all group-hover:bg-primary/40" style={{ height: `${tripHeight}%` }}></div>
                        <div className="w-3 bg-accent rounded-t-sm transition-all group-hover:opacity-80 shadow-sm" style={{ height: `${revenueHeight}%` }}></div>
                      </div>
                      <span className="absolute -bottom-8 text-xs text-ink-4 transition-colors group-hover:text-ink">{data.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Action Tiles & Status */}
        <div className="space-y-6">
          <Card className="p-6 border-line-2 shadow-sm">
            <h3 className="text-xs font-medium text-ink-4 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/fleet')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
                <Car className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
                <p className="text-xs font-medium text-ink">Fleet Manager</p>
              </button>
              <button onClick={() => navigate('/bookings')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
                <Calendar className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
                <p className="text-xs font-medium text-ink">Trip Logs</p>
              </button>
              <button onClick={() => navigate('/transactions')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
                <RotateCcw className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
                <p className="text-xs font-medium text-ink">Refunds</p>
              </button>
              <button onClick={() => navigate('/settings')} className="p-4 bg-bg border border-line-2 rounded-2xl hover:border-primary/50 hover:bg-white transition-all text-center group shadow-sm hover:shadow-md">
                <Settings className="mx-auto mb-2 text-ink-3 group-hover:text-primary transition-colors" size={20} />
                <p className="text-xs font-medium text-ink">Global Config</p>
              </button>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-ink text-white overflow-hidden relative shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="accent" dot>System Healthy</Badge>
              </div>
              <h3 className="text-sm font-semibold mb-1">Server Status</h3>
              <p className="text-xs text-ink-4/80 mb-4">All nodes operating at peak capacity</p>
              <div className="flex gap-1 h-8 items-end">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
                  <div key={i} className="flex-1 bg-accent/30 rounded-t-[1px]" style={{ height: `${40 + Math.random() * 60}%` }}></div>
                ))}
              </div>
            </div>
            <Activity className="absolute -bottom-4 -right-4 text-white/5" size={120} />
          </Card>

          <Card className="p-6 border-urgent/20 bg-urgent-light/20 shadow-sm border border-dashed">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-urgent flex items-center gap-2">
                <Wrench size={14} /> Fleet Maintenance
              </h3>
              <Badge variant="urgent">2 Pending</Badge>
            </div>
            <p className="text-xs text-ink-3 mb-4 leading-relaxed">Vehicles <strong>VEH-001</strong> and <strong>VEH-005</strong> require immediate inspection based on mileage milestones.</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/fleet')}>Review Maintenance</Button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-line-2 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Flag size={16} className="text-urgent" /> Active Incident Reports</h3>
            <button onClick={() => navigate('/reports')} className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'Safety Violation', id: 'REP-4821', severity: 'high', time: '14m ago' },
              { type: 'Vehicle Damage', id: 'REP-4819', severity: 'medium', time: '1h ago' },
              { type: 'No-Show Dispute', id: 'REP-4815', severity: 'low', time: '3h ago' },
              { type: 'Late Arrival', id: 'REP-4812', severity: 'low', time: '5h ago' },
              { type: 'Driver Feedback', id: 'REP-4809', severity: 'medium', time: 'Yesterday' },
            ].map((rep, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-bg hover:bg-line-2 transition-colors rounded-xl cursor-pointer shadow-sm border border-transparent hover:border-line-2" onClick={() => navigate('/reports')}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rep.severity === 'high' ? 'bg-urgent-light text-urgent' : rep.severity === 'medium' ? 'bg-warning-light text-warning-dark' : 'bg-primary-light text-primary'}`}>
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink">{rep.type}</p>
                    <p className="text-xs text-ink-4 font-mono">{rep.id} · {rep.time}</p>
                  </div>
                </div>
                <Badge variant={rep.severity === 'high' ? 'urgent' : rep.severity === 'medium' ? 'warning' : 'accent'}>
                  {rep.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-line-2 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Activity size={16} className="text-accent" /> Recent Activity</h3>
            <button onClick={() => navigate('/trips')} className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-5">
            {[
              { icon: CreditCard, color: 'text-accent', text: 'New payment received from Rider #882', time: '5m ago' },
              { icon: AlertTriangle, color: 'text-urgent', text: 'Unassigned trip delay alert in Chesterfield', time: '12m ago' },
              { icon: UserPlus, color: 'text-primary', text: 'New dispatcher account created for Sarah J.', time: '1h ago' },
              { icon: CheckCircle2, color: 'text-accent', text: 'Daily fleet inspection completed for Unit #VEH-003', time: '2h ago' },
              { icon: Truck, color: 'text-primary', text: 'Trip LOGISS-2841 successfully completed by David W.', time: '4h ago' },
            ].map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-1">
                <div className={`mt-0.5 ${act.color} bg-bg p-1.5 rounded-lg shadow-sm`}><act.icon size={14} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink leading-tight">{act.text}</p>
                  <p className="text-xs text-ink-4 mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default AdminDashboard;
