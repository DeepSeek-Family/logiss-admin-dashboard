import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Users, BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import { StatCard } from "@/shared/components/ui";
import { useTrips } from "@/hooks/useTrips";
import {
  useGetAllReportsQuery,
  useGetRecentPendingBookingsQuery,
} from "@/redux/apivtwo/dashboardOnvording";
import { useGetAllActiveDriversQuery } from "@/redux/api/driversApi";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";
import { ROUTES } from "@/constants/routes";

import { ActiveTripsTable, PendingBookingsPanel, OpenReportsPanel } from "@/features/operations";

const canViewDashboardWidgets = (role?: string | null) =>
  !role || role === "admin" || role === "dispatcher";

const Operations = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { trips, loading: tripsLoading } = useTrips();
  const { data: reportsData, isLoading: reportsLoading } = useGetAllReportsQuery({
    page: 1,
    limit: 100,
  });
  const {
    data: activeDriversRes,
    isLoading: activeDriversLoading,
    isError: activeDriversError,
    error: activeDriversErr,
    refetch: refetchActiveDrivers,
  } = useGetAllActiveDriversQuery(
    { page: currentPage, limit: itemsPerPage, sort: "-createdAt" },
    { skip: !canViewDashboardWidgets(role), refetchOnMountOrArgChange: true },
  );
  const {
    data: pendingBookingsRes,
    isLoading: pendingBookingsLoading,
    isError: pendingBookingsError,
    error: pendingBookingsErr,
    refetch: refetchPendingBookings,
  } = useGetRecentPendingBookingsQuery(undefined, {
    skip: !canViewDashboardWidgets(role),
    refetchOnMountOrArgChange: true,
  });
  const reports = reportsData?.data ?? [];
  const activeDuties = activeDriversRes?.data ?? [];
  const onDutyTotal = activeDriversRes?.pagination?.total ?? 0;
  const recentPendingBookings = pendingBookingsRes?.data ?? [];

  const loading = tripsLoading || reportsLoading || activeDriversLoading;
  const showInitialLoader = loading && !(trips?.length || activeDuties.length || reports?.length);

  const pendingTrips = (trips || []).filter((t: any) => t?.status === "pending_review");
  const openReports = (reports || []).filter((r) => {
    const s = String(r?.reportStatus || "").toLowerCase();
    return s === "open" || s === "pending" || s === "reviewing";
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const tripsToday = (trips || []).filter((t: any) => {
    const d = t?.serviceDate || t?.scheduledTime;
    return d && String(d).slice(0, 10) === todayKey;
  }).length;
  const completedToday = (trips || []).filter((t: any) => {
    const d = t?.serviceDate || t?.scheduledTime;
    return t?.status === "completed" && d && String(d).slice(0, 10) === todayKey;
  }).length;
  const completionRate = tripsToday > 0 ? Math.round((completedToday / tripsToday) * 100) : 0;

  if (showInitialLoader) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading operations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title">Fleet Operations</h1>
          <p className="text-sm text-ink-3 font-medium mt-1 tracking-normal flex items-center gap-2">
            Managing {trips.length} active and scheduled assignments
            {loading ? (
              <Loader2 size={14} className="animate-spin text-primary" aria-label="Refreshing" />
            ) : null}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Trips Today"
          value={tripsToday}
          sub={`${pendingTrips.length} pending`}
          icon={Truck}
          accent="primary"
        />
        <StatCard
          label="On Duty Now"
          value={onDutyTotal}
          sub="Active fleet"
          icon={Users}
          accent="accent"
        />
        <StatCard
          label="Completed Today"
          value={`${completionRate}%`}
          sub={`${completedToday} of ${tripsToday || "—"} trips`}
          icon={BarChart3}
          accent="accent"
        />
        <StatCard
          label="Action Required"
          value={pendingTrips.length + openReports.length}
          sub="Needs attention"
          icon={AlertTriangle}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveTripsTable
            duties={activeDuties}
            pagination={activeDriversRes?.pagination}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            isLoading={activeDriversLoading}
            isError={activeDriversError}
            errorMessage={apiErrorMessage(activeDriversErr, "Failed to load on-duty drivers")}
            onRetry={refetchActiveDrivers}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="space-y-4">
          <PendingBookingsPanel
            bookings={recentPendingBookings}
            isLoading={pendingBookingsLoading}
            isError={pendingBookingsError}
            errorMessage={apiErrorMessage(pendingBookingsErr, "Failed to load pending bookings")}
            onRetry={refetchPendingBookings}
            onReviewClick={() => navigate(`${ROUTES.bookings}?tab=pending`)}
            onRowClick={() => navigate(`${ROUTES.bookings}?tab=pending`)}
          />
          <OpenReportsPanel openReports={openReports} onReviewClick={() => navigate("/reports")} />
        </div>
      </div>
    </div>
  );
};

export default Operations;
