import type { mapApiBooking } from "@/features/bookings/utils/helpers";
import type { MappedDriver } from "@/features/drivers/utils/helpers";

/** UI booking shape shared by Trip History, Schedule, map, and run views. */
export type TripHistoryRecord = ReturnType<typeof mapApiBooking> & Record<string, any>;

/** Driver mapper output with optional scheduling metadata populated by the page. */
export type TripHistoryDriver = MappedDriver & Record<string, any>;

export type TripUpdatePayload = Record<string, any>;

export type TripUpdateHandler = (
  bookingId: string,
  updates: TripUpdatePayload,
  skipConfirmation?: boolean,
) => void | Promise<void>;
