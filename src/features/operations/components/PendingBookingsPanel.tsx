import { ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Card, Badge, Button } from "@/shared/components/ui";
import type { RecentPendingBooking } from "@/redux/apivtwo/dashboardOnvording";
import { formatShortDate, formatTime, tripTypeLabel } from "@/utils/helpers";

interface PendingBookingsPanelProps {
  bookings: RecentPendingBooking[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onReviewClick: () => void;
  onRowClick?: (bookingId: string) => void;
}

export const PendingBookingsPanel = ({
  bookings,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onReviewClick,
  onRowClick,
}: PendingBookingsPanelProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-3 sm:px-4 py-3 border-b border-line-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-warning pulse-dot shrink-0"></span>
          <h3 className="text-xs font-medium text-ink truncate">Pending Bookings</h3>
        </div>
        <button
          type="button"
          onClick={onReviewClick}
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          Review all
        </button>
      </div>
      <div className="divide-y divide-line-2">
        {isError ? (
          <div className="px-3 py-5 flex flex-col items-center text-center gap-2">
            <p className="text-xs text-ink-4">
              {errorMessage || "Failed to load pending bookings"}
            </p>
            {onRetry ? (
              <Button variant="outline" icon={RefreshCw} className="h-8 text-xs" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : isLoading ? (
          <div className="px-3 py-6 flex flex-col items-center text-ink-4">
            <Loader2 size={18} className="mb-1.5 animate-spin text-primary" />
            <p className="text-xs">Loading…</p>
          </div>
        ) : bookings.length === 0 ? (
          <p className="px-3 py-5 text-xs text-ink-4 text-center font-medium">
            No pending bookings
          </p>
        ) : (
          bookings.map((booking) => {
            const title =
              booking.tripReason || tripTypeLabel(booking.tripType) || "Pending booking";
            const dateLabel = formatShortDate(booking.serviceDate);
            const pickupLabel = formatTime(booking.pickupTime) || booking.pickupTime;
            const handleOpen = () => (onRowClick ? onRowClick(booking._id) : onReviewClick());
            return (
              <div
                key={booking._id}
                onClick={handleOpen}
                onKeyDown={(e) => e.key === "Enter" && handleOpen()}
                role="button"
                tabIndex={0}
                className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-bg cursor-pointer transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{title}</p>
                  <p className="text-[11px] text-ink-4 truncate">
                    {[dateLabel, pickupLabel].filter(Boolean).join(" · ") || "—"}
                    <span className="hidden xl:inline">
                      {booking.tripType ? ` · ${tripTypeLabel(booking.tripType)}` : ""}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {booking.recurringBooking ? (
                    <Badge
                      variant="primary"
                      className="hidden xl:inline-flex text-[10px] px-1.5 py-0.5 normal-case tracking-normal"
                    >
                      Recurring
                    </Badge>
                  ) : null}
                  <Badge
                    variant="warning"
                    className="text-[10px] px-1.5 py-0.5 normal-case tracking-normal"
                  >
                    Pending
                  </Badge>
                  <ChevronRight
                    size={14}
                    className="text-ink-4 opacity-0 group-hover:opacity-100 hidden sm:block transition-opacity"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
