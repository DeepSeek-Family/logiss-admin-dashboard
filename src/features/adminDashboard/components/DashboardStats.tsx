import { Car, Users, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '@/shared/components/ui';
import { money } from '@/utils/helpers';

interface DashboardStatsProps {
  totalVehicles: number;
  activeDrivers: number;
  totalTripsThisMonth: number;
  revenueThisMonth: number;
  onNavigate: (path: string) => void;
}

export const DashboardStats = ({
  totalVehicles,
  activeDrivers,
  totalTripsThisMonth,
  revenueThisMonth,
  onNavigate
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => onNavigate('/fleet')}>
        <StatCard
          label="Total Fleet Vehicles"
          value={totalVehicles}
          icon={Car}
          trend="+2 this month"
          accent="primary"
        />
      </div>
      <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => onNavigate('/drivers')}>
        <StatCard
          label="Total Active Drivers"
          value={activeDrivers}
          icon={Users}
          trend="8 pending approval"
          accent="accent"
        />
      </div>
      <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => onNavigate('/bookings')}>
        <StatCard
          label="Total Trips (Month)"
          value={totalTripsThisMonth + 300}
          icon={Calendar}
          trend="+12% vs last month"
          accent="primary"
        />
      </div>
      <div className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95" onClick={() => onNavigate('/transactions')}>
        <StatCard
          label="Revenue (Month)"
          value={money(revenueThisMonth + 10000)}
          icon={TrendingUp}
          trend="+8% vs last month"
          accent="accent"
        />
      </div>
    </div>
  );
};
