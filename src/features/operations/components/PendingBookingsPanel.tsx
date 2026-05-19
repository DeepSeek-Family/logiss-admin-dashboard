import { ChevronRight } from 'lucide-react';
import { Card, Avatar } from '@/shared/components/ui';
import { formatTime, formatShortDate } from '@/utils/helpers';

interface PendingBookingsPanelProps {
  pendingTrips: any[];
  onReviewClick: () => void;
}

export const PendingBookingsPanel = ({ pendingTrips, onReviewClick }: PendingBookingsPanelProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3.5 border-b border-line-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning pulse-dot"></span>
          <h3 className="text-xs font-medium text-ink">Pending Bookings</h3>
        </div>
        <button onClick={onReviewClick} className="text-xs font-medium text-primary hover:underline">Review all</button>
      </div>
      <div className="divide-y divide-line-2">
        {pendingTrips.slice(0, 4).map((trip: any) => (
          <div
            key={trip?.id}
            onClick={onReviewClick}
            className="px-4 py-3 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">{trip?.rider?.name || 'Unknown'}</p>
                <p className="text-xs text-ink-4 whitespace-nowrap">
                  {formatShortDate(trip?.scheduledTime)} · {formatTime(trip?.scheduledTime)}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-ink-4 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
          </div>
        ))}
        {pendingTrips.length === 0 && (
          <p className="px-4 py-5 text-xs text-ink-4 text-center font-medium">All bookings reviewed ✓</p>
        )}
      </div>
    </Card>
  );
};
