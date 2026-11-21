import { useState } from "react";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmationModal } from "@/shared/components/ui";
import {
  useBulkAssignDriversMutation,
  useGetAllAssignedBookingsQuery,
} from "@/redux/api/bookingApi";
import { apiErrorMessage } from "../utils/helpers";

type Props = {
  /** Same county filter the list uses ("all" = no filter). */
  countyFilter?: string;
  /** When rows are selected, only those are assigned. */
  selectedTrips?: string[];
  onAssigned?: () => void;
  className?: string;
};

/**
 * "Ready to Assign" toolbar button: the server worker shuffles the on-duty
 * drivers and hands them unassigned bookings one at a time; each driver gets a push.
 */
export const RandomAssignButton = ({
  countyFilter,
  selectedTrips = [],
  onAssigned,
  className = "",
}: Props) => {
  const countyId = countyFilter && countyFilter !== "all" ? countyFilter : undefined;
  const { data: unassignedResponse } = useGetAllAssignedBookingsQuery({
    page: 1,
    limit: 1,
    unassign: true,
    ...(countyId ? { countyId } : {}),
  });
  const unassignedCount = unassignedResponse?.pagination?.total ?? 0;

  const [bulkAssign, { isLoading }] = useBulkAssignDriversMutation();
  const [open, setOpen] = useState(false);

  const useSelection = selectedTrips.length > 0;
  const targetCount = useSelection ? selectedTrips.length : unassignedCount;

  const run = async () => {
    try {
      const body = useSelection
        ? { bookingIds: selectedTrips }
        : countyId
          ? { countyId }
          : {};
      const res = await bulkAssign(body).unwrap();
      const r = res.data;
      toast.success(
        `${r.assigned} booking(s) assigned to ${r.totalDrivers} active driver(s)` +
          (r.skipped.length ? ` · ${r.skipped.length} skipped` : ""),
      );
      onAssigned?.();
    } catch (e: any) {
      toast.error(apiErrorMessage(e, "Random assign failed"));
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={isLoading || targetCount === 0}
        onClick={() => setOpen(true)}
        title="Randomly assign active (on-duty) drivers to unassigned bookings"
        className={`inline-flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:pointer-events-none ${className}`}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Shuffle size={14} />}
        {isLoading
          ? "Assigning…"
          : useSelection
            ? `Auto-Assign ${selectedTrips.length} Selected to Active Drivers`
            : `Auto-Assign ${unassignedCount} Unassigned to Active Drivers`}
      </button>

      <ConfirmationModal
        isOpen={open}
        title="Auto-Assign Bookings to Active Drivers"
        message={
          useSelection
            ? `Randomly assign active drivers to the ${selectedTrips.length} selected booking(s), one at a time? Bookings that already have a driver are skipped. Each driver gets a push notification.`
            : `Randomly assign active drivers to all ${unassignedCount} unassigned booking(s), one at a time? Each driver gets a push notification.`
        }
        confirmText="Assign"
        variant="primary"
        isLoading={isLoading}
        onConfirm={run}
        onClose={() => !isLoading && setOpen(false)}
      />
    </>
  );
};
