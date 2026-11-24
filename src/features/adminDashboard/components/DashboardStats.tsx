import { Car, Users, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "@/shared/components/ui";
import { money } from "@/utils/helpers";
import { ROUTES } from "@/constants/routes";
import { useGetDashboardOverviewQuery } from "@/redux/apivtwo/dashboardOnvording";
import { Loader } from "@/shared/Lodder";

interface DashboardStatsProps {
  onNavigate: (path: string) => void;
}

export const DashboardStats = ({ onNavigate }: DashboardStatsProps) => {
  const { data: dashboardOverview, isLoading } = useGetDashboardOverviewQuery();
  if (isLoading) {
    return <Loader message="Loading dashboard data..." fullScreen={true} />;
  }
  const dashboardData = dashboardOverview?.data;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div
        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        onClick={() => onNavigate("/fleet")}
      >
        <StatCard
          label="Total Fleet"
          value={`${dashboardData?.totalVehicles} Vehicles`}
          icon={Car}
          accent="primary"
        />
      </div>
      <div
        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        onClick={() => onNavigate("/drivers")}
      >
        <StatCard
          label="Total Active Drivers"
          value={`${dashboardData?.totalDrivers} Drivers`}
          icon={Users}
          accent="accent"
        />
      </div>
      <div
        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        onClick={() => onNavigate("/bookings")}
      >
        <StatCard
          label="Total Trips (Month)"
          value={`${dashboardData?.totalTrips ?? 0} Trips`}
          icon={Calendar}
          accent="primary"
        />
      </div>
      <div
        className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        onClick={() => onNavigate(ROUTES.transactions)}
      >
        <StatCard
          label="Revenue (Month)"
          value={`${money(dashboardData?.totalRevenue ?? 0)} USD`}
          icon={TrendingUp}
          accent="accent"
        />
      </div>
    </div>
  );
};
