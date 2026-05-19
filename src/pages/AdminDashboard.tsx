import { useNavigate } from 'react-router-dom';
import { Loader2, Wrench } from 'lucide-react';
import { Card, Badge, Button } from '@/shared/components/ui';

import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { money } from '../utils/helpers';

import {
  DashboardStats,
  TripDistributionChart,
  QuickActions,
  ActiveIncidents,
  RecentActivity
} from '@/features/adminDashboard';

interface MonthlyData {
  month: string;
  trips: number;
  revenue: number;
}

const AdminDashboard = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();

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

      {/* KPI Stats */}
      <DashboardStats
        totalVehicles={totalVehicles}
        activeDrivers={activeDrivers}
        totalTripsThisMonth={totalTripsThisMonth}
        revenueThisMonth={revenueThisMonth}
        onNavigate={navigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics */}
        <div className="lg:col-span-2">
          <TripDistributionChart
            monthlyData={monthlyData}
            maxRevenue={maxRevenue}
          />
        </div>

        {/* Action Tiles & Status */}
        <div className="space-y-5">
          <QuickActions onNavigate={navigate} />

          <Card className="p-5 border-line-2 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Wrench size={15} className="text-urgent" /> Fleet Maintenance
              </h3>
              <Badge variant="urgent">2 Pending</Badge>
            </div>
            <p className="text-xs text-ink-4 mb-4 leading-relaxed">Vehicles <strong className="text-ink">VEH-001</strong> and <strong className="text-ink">VEH-005</strong> require immediate inspection based on mileage milestones.</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/fleet')}>Review Maintenance</Button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveIncidents onNavigate={navigate} />

        <RecentActivity onNavigate={navigate} />
      </div>

    </div>
  );
};

export default AdminDashboard;
