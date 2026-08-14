import { ChevronRight, Truck } from 'lucide-react';
import { Card, Avatar, TripStatusBadge, Pagination } from '@/shared/components/ui';
import { formatTime, formatShortDate } from '@/utils/helpers';
import { drivers } from '@/data/mockData';

interface ActiveTripsTableProps {
  paginatedActiveTrips: any[];
  activeTripsCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  onRowClick: () => void;
}

export const ActiveTripsTable = ({
  paginatedActiveTrips,
  activeTripsCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onRowClick
}: ActiveTripsTableProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">Active Trips</h2>
        <button onClick={onRowClick} className="text-xs font-medium text-primary hover:underline">View all →</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg/60 border-b border-line-2">
              <th className="px-5 py-2.5 type-th">ID</th>
              <th className="px-5 py-2.5 type-th">Rider</th>
              <th className="px-5 py-2.5 type-th">Time</th>
              <th className="px-5 py-2.5 type-th">Status</th>
              <th className="px-5 py-2.5 type-th">Driver</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {paginatedActiveTrips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-4 font-medium">No active trips today.</td>
              </tr>
            ) : (
              paginatedActiveTrips.map((trip: any) => {
                const driver = (drivers || []).find((d: any) => d.id === trip?.driverId);
                return (
                  <tr key={trip.id} className="hover:bg-bg/40 transition-colors group cursor-pointer" onClick={onRowClick}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-medium text-ink-3 tracking-normal uppercase">#{trip.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar initials={trip?.rider?.initials || '?'} size="xs" />
                        <span className="text-sm font-medium text-ink">{trip?.rider?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-ink">{formatTime(trip?.scheduledTime)}</p>
                      <p className="text-xs text-ink-4">{formatShortDate(trip?.scheduledTime)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TripStatusBadge status={trip.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-ink-4" />
                        <span className="text-sm font-medium text-ink-3">{driver?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <ChevronRight size={16} className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={activeTripsCount}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    </Card>
  );
};
