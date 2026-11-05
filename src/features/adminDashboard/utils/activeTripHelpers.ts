import type { IBooking, IBookingDriver, IBookingUser } from "@/redux/api/bookingApi";

export const activeTripPassengerName = (trip: IBooking): string => {
  const user = trip.userId;
  if (!user || typeof user === "string") return "Passenger";
  return (
    [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ").trim() || "Passenger"
  );
};

export const activeTripPassengerInitials = (trip: IBooking): string => {
  const user = trip.userId;
  if (!user || typeof user === "string") return "P";
  const u = user as IBookingUser;
  return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "P";
};

export const activeTripDriverName = (trip: IBooking): string => {
  const driver = trip.driverId;
  if (!driver) return "Unassigned";
  if (typeof driver === "string") return "Assigned";
  const d = driver as IBookingDriver;
  return [d.firstName, d.lastName].filter(Boolean).join(" ").trim() || "Assigned";
};

/** Map API bookingStatus to TripStatusBadge keys. */
export const activeTripBadgeStatus = (bookingStatus?: string): string => {
  const key = String(bookingStatus || "pending")
    .toLowerCase()
    .replace(/-/g, "_");
  if (key === "in_progress") return "in_trip";
  return key;
};

export const activeTripScheduleLabel = (trip: IBooking): string => {
  const date = trip.serviceDate?.trim();
  const time = trip.pickupTime?.trim() || trip.appointmentTime?.trim();
  if (date && time) return `${date} · ${time}`;
  return date || time || "—";
};

export const activeTripSubtitle = (trip: IBooking): string => {
  const reason = trip.tripReason?.trim();
  const driver = activeTripDriverName(trip);
  if (reason) return `${reason} · Driver: ${driver}`;
  return `Driver: ${driver}`;
};
