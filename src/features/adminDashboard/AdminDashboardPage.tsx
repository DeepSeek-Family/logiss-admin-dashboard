import { useNavigate } from "react-router-dom";

import {
  DashboardStats,
  TripDistributionChart,
  ActiveIncidents,
} from "@/features/adminDashboard";

const AdminDashboard = ({ role: _role }: { role?: string | null }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] min-h-0 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="type-page-title">Executive Dashboard</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            Platform-wide overview and business performance metrics
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-light/30 border border-accent/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-accent">Live</span>
        </div>
      </div>

      <div className="shrink-0">
        <DashboardStats onNavigate={navigate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 min-h-0 h-full">
          <TripDistributionChart />
        </div>
        <div className="min-h-0 h-full">
          <ActiveIncidents onNavigate={navigate} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
