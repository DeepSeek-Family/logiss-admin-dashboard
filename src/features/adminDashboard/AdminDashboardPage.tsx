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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
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

      {/* KPI Stats */}
      <DashboardStats onNavigate={navigate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics */}
        <div className="lg:col-span-2">
          <TripDistributionChart />
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
            <p className="text-xs text-ink-4 mb-4 leading-relaxed">
              Vehicles <strong className="text-ink">VEH-001</strong> and{" "}
              <strong className="text-ink">VEH-005</strong> require immediate
              inspection based on mileage milestones.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/fleet")}
            >
              Review Maintenance
            </Button>
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
