import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { Card, Badge, Button } from "@/shared/components/ui";

import {
  DashboardStats,
  TripDistributionChart,
  QuickActions,
  ActiveIncidents,
  RecentActivity,
} from "@/features/adminDashboard";
const AdminDashboard = ({ role: _role }: { role?: string | null }) => {
  const navigate = useNavigate();

  return (
    <div className="pb-12 space-y-8 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title">Executive Dashboard</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            Platform-wide overview and business performance metrics
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-light/30 border border-accent/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs font-medium text-accent">Live</span>
        </div>
      </div>

      {/* KPI Stats */}
      <DashboardStats onNavigate={navigate} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Analytics */}
        <div className="lg:col-span-2">
          <TripDistributionChart />
        </div>

        {/* Action Tiles & Status */}
        <div className="space-y-5 ">
          <QuickActions onNavigate={navigate} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActiveIncidents onNavigate={navigate} />

        <RecentActivity onNavigate={navigate} />
      </div>
    </div>
  );
};

export default AdminDashboard;
