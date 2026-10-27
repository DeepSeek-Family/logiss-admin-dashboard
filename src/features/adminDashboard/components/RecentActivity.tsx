import { Activity, Truck } from 'lucide-react';
import { Card, Badge, Button, Avatar, TripStatusBadge } from '@/shared/components/ui';
import { useGetActiveTripsQuery } from '@/redux/apivtwo/dashboardOnvording';
import { Loader } from '@/shared/Lodder';
import { timeAgo } from '@/utils/helpers';
import {
  activeTripBadgeStatus,
  activeTripPassengerInitials,
  activeTripPassengerName,
  activeTripScheduleLabel,
  activeTripSubtitle,
} from '@/features/adminDashboard/utils/activeTripHelpers';

interface RecentActivityProps {
  onNavigate: (path: string) => void;
}

const PREVIEW_LIMIT = 5;

export const RecentActivity = ({ onNavigate }: RecentActivityProps) => {
  const { data, isLoading, isError, refetch } = useGetActiveTripsQuery();

  const trips = data?.data ?? [];
  const total = data?.pagination?.total ?? trips.length;

  const preview = [...trips]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime(),
    )
    .slice(0, PREVIEW_LIMIT);

  return (
    <Card className="p-6 border-line-2 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Activity size={16} className="text-accent" /> Recent Activity
          {total > 0 ? (
            <Badge variant="primary" className="ml-1">
              {total} active
            </Badge>
          ) : null}
        </h3>
        <button
          type="button"
          onClick={() => onNavigate('/operations')}
          className="text-xs font-medium text-primary hover:underline"
        >
          View operations
        </button>
      </div>

      {isLoading ? (
        <Loader message="Loading active trips..." />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <p className="text-sm text-ink-4">Could not load active trips.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : preview.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-ink-4">No active trips right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {preview.map((trip) => {
            const when = timeAgo(trip.updatedAt || trip.createdAt || '');
            const status = activeTripBadgeStatus(trip.bookingStatus);
            return (
              <div
                key={trip._id}
                className="flex items-center justify-between p-3 bg-bg hover:bg-line-2 transition-colors rounded-xl cursor-pointer shadow-sm border border-transparent hover:border-line-2"
                onClick={() => onNavigate('/operations')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initials={activeTripPassengerInitials(trip)} size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink truncate">
                      {activeTripPassengerName(trip)}
                    </p>
                    <p className="text-xs text-ink-4 truncate">
                      {activeTripSubtitle(trip)} · {activeTripScheduleLabel(trip)}
                      {when ? ` · ${when}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Truck size={14} className="text-ink-4 hidden sm:block" aria-hidden />
                  <TripStatusBadge status={status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
