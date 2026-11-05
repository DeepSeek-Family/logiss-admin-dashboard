import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Card, Avatar, Badge, Button, Pagination } from "@/shared/components/ui";
import type { ActiveDriverDuty, PaginationMeta } from "@/redux/api/driversApi";
import { driverFullName, driverInitials } from "@/features/drivers/utils/helpers";
import {
  formatDutyDate,
  formatDutyTime,
  formatDurationMs,
  openSessionStart,
} from "@/features/drivers/utils/dutyLogHelpers";
import { resolveMediaUrl } from "@/utils/imageUrl";

interface ActiveTripsTableProps {
  duties: ActiveDriverDuty[];
  pagination?: PaginationMeta;
  currentPage: number;
  itemsPerPage: number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

export const ActiveTripsTable = ({
  duties,
  pagination,
  currentPage,
  itemsPerPage,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onPageChange,
  onItemsPerPageChange,
}: ActiveTripsTableProps) => {
  const totalItems = pagination?.total ?? 0;
  const totalPages = pagination?.totalPage ?? 1;

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">On-Duty Drivers</h2>
        {totalItems > 0 ? (
          <span className="text-xs font-medium text-ink-4">{totalItems} on duty</span>
        ) : null}
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <AlertTriangle size={36} className="mb-3 text-urgent opacity-60" />
          <p className="mb-3 text-sm text-ink-3">
            {errorMessage || "Failed to load on-duty drivers"}
          </p>
          {onRetry ? (
            <Button variant="outline" icon={RefreshCw} className="h-9 text-sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-sm text-ink-4">
          <Loader2 size={24} className="mb-2 animate-spin text-primary" />
          Loading on-duty drivers
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg/60 border-b border-line-2">
                <th className="px-3 xl:px-5 py-2.5 type-th">Driver</th>
                <th className="hidden xl:table-cell px-5 py-2.5 type-th">Contact</th>
                <th className="hidden xl:table-cell px-5 py-2.5 type-th">Duty date</th>
                <th className="px-3 xl:px-5 py-2.5 type-th">Status</th>
                <th className="hidden xl:table-cell px-5 py-2.5 type-th">Session start</th>
                <th className="px-3 xl:px-5 py-2.5 type-th">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {duties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-4 font-medium">
                    No on-duty drivers.
                  </td>
                </tr>
              ) : (
                duties.map((duty) => {
                  const driver = duty.driverId;
                  const name = driverFullName(driver) || "Driver";
                  const sessionStart = openSessionStart(duty.sessions);
                  return (
                    <tr key={duty._id} className="hover:bg-bg/40 transition-colors">
                      <td className="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            initials={driverInitials(driver)}
                            src={resolveMediaUrl(driver?.profile)}
                            size="xs"
                            online
                          />
                          <div className="min-w-0 max-w-[140px] xl:max-w-none">
                            <p className="text-sm font-medium text-ink truncate">{name}</p>
                            <p className="text-xs text-ink-4 truncate">{driver?.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium text-ink-3">
                        {driver?.contact || "—"}
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-ink">{formatDutyDate(duty.date)}</p>
                        <p className="text-xs text-ink-4 tabular-nums">{duty.date}</p>
                      </td>
                      <td className="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <Badge variant="accent" dot className="whitespace-nowrap">
                          On Duty
                        </Badge>
                      </td>
                      <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium tabular-nums text-ink">
                        {sessionStart ? formatDutyTime(sessionStart) : "—"}
                      </td>
                      <td className="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-sm font-bold tabular-nums text-primary">
                        {formatDurationMs(duty.totalDurationMs)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    </Card>
  );
};
