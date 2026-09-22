import type { IBooking, IBookingDriver, IBookingUser, IMobilityRequirement } from '@/redux/api/bookingApi';

export const WEEKDAY_KEY_TO_NAME: Record<string, string> = {
  '0': 'sunday',
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday',
};

export const to24hTime = (val?: string): string => {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = parseInt(m[1], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

/** Convert a time input (`09:15` or `09:15 AM`) into the API's `09:15 AM` format. */
export const toApiTime = (val?: string): string => {
  if (!val) return '';
  const s = String(val).trim();
  const already12h = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (already12h) {
    const h = String(parseInt(already12h[1], 10)).padStart(2, '0');
    return `${h}:${already12h[2]} ${already12h[3].toUpperCase()}`;
  }
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  let h = parseInt(m[1], 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m[2]} ${ap}`;
};

export const toYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const toLocationValue = (value: string): number | null => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (/^\d{5}$/.test(trimmed)) return Number(trimmed);
  const zip = trimmed.match(/\b(\d{5})\b/);
  if (zip) return Number(zip[1]);
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && trimmed !== '') return numeric;
  return null;
};

export { imageUrl, resolveMediaUrl } from '@/utils/imageUrl';

export const isMongoId = (value?: string): boolean => /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());

export const apiErrorMessage = (err: any, fallback = 'Request failed'): string => {
  const messages = err?.data?.errorMessages;
  if (Array.isArray(messages) && messages.length) {
    return messages.map((m: any) => m?.message).filter(Boolean).join('. ');
  }
  return err?.data?.message || err?.error || fallback;
};

export const weekdayKeysToNames = (keys: string[]): string[] =>
  keys.map((k) => WEEKDAY_KEY_TO_NAME[k] || String(k).toLowerCase()).filter(Boolean);

export const isRoundTrip = (type?: string): boolean => {
  const t = String(type || '').toLowerCase();
  return t === 'round-trip' || t === 'round_trip';
};

export const combineServiceDateTime = (serviceDate?: string, time?: string): string | undefined => {
  if (!serviceDate) return undefined;
  const ymd = String(serviceDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!ymd) return serviceDate;
  const t24 = to24hTime(time) || '00:00';
  const [hh, mm] = t24.split(':').map(Number);
  return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), hh || 0, mm || 0).toISOString();
};

const personName = (person?: Pick<IBookingUser, 'firstName' | 'middleName' | 'lastName'> | null): string => {
  if (!person) return '';
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const personInitials = (person?: Pick<IBookingUser, 'firstName' | 'lastName'> | null): string => {
  if (!person) return '';
  return `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase();
};

export const mapApiBooking = (b: IBooking) => {
  const userObj = typeof b.userId === 'object' && b.userId ? (b.userId as IBookingUser) : null;
  const driverObj = typeof b.driverId === 'object' && b.driverId ? (b.driverId as IBookingDriver) : null;
  const mobilityObj =
    typeof b.mobilityRequirements === 'object' && b.mobilityRequirements
      ? (b.mobilityRequirements as IMobilityRequirement)
      : null;
  const payerObj = typeof b.payerSource === 'object' && b.payerSource ? b.payerSource : null;

  const riderName = personName(userObj) || 'Rider';
  const driverName = personName(driverObj) || undefined;
  const pickupTime = b.pickupTime || '';
  const appointmentTime = b.appointmentTime || '';
  const returnTime = b.returnTime || '';

  let mappedStatus = String(b.bookingStatus || 'pending').toLowerCase();
  if (mappedStatus === 'pending') mappedStatus = 'pending_review';

  const tripType = b.tripType || 'one-way';

  return {
    id: b._id,
    _id: b._id,
    passengerId: userObj?.id || userObj?._id || (typeof b.userId === 'string' ? b.userId : ''),
    rider: {
      name: riderName,
      initials: personInitials(userObj) || 'R',
      profile: userObj?.profile,
      phone: (userObj as any)?.phone,
      email: (userObj as any)?.email,
    },
    pickup: b.pickupLocation != null ? String(b.pickupLocation) : 'N/A',
    dropoff: b.dropOffLocation != null ? String(b.dropOffLocation) : 'N/A',
    stops: b.stopAddress != null && b.stopAddress !== '' ? [String(b.stopAddress)] : [],
    mobility: mobilityObj?.name || (typeof b.mobilityRequirements === 'string' ? b.mobilityRequirements : 'Ambulatory'),
    mobilityPrice: mobilityObj?.price || 0,
    status: mappedStatus,
    rawStatus: b.bookingStatus,
    scheduledTime: combineServiceDateTime(b.serviceDate, pickupTime) || b.createdAt || new Date().toISOString(),
    serviceDate: b.serviceDate,
    pickupTime,
    requestedPickup: pickupTime,
    appointmentTime,
    returnTime,
    returnPickup: returnTime,
    driverId: driverObj?._id || driverObj?.id || (typeof b.driverId === 'string' ? b.driverId : undefined),
    driverName,
    tripType,
    type: tripType,
    tripReason: b.tripReason,
    reason: b.tripReason,
    passengerSeats: b.passengerSeats || 1,
    programContext: b.programContext,
    fundingSource: payerObj?.name || b.programContext || '',
    fundingSourceId: payerObj?._id || (typeof b.payerSource === 'string' ? b.payerSource : undefined),
    isRecurring: Boolean(b.recurringBooking),
    recurringDays: b.selectedDate || [],
    endDate: b.endDate,
    tripNote: b.tripNote,
    notes: b.tripNote,
    internalPrivateNote: b.internalPrivateNote,
    privateNotes: b.internalPrivateNote,
    price: b.price || mobilityObj?.price || 0,
    cost: b.price || mobilityObj?.price || 0,
    passengerCopay: 0,
    fundingSourceCharge: b.price || mobilityObj?.price || 0,
    recurringBatchId: b.recurringBatchId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
};

export const extractBookingPeople = (bookings: IBooking[]) => {
  const users = new Map<string, IBookingUser>();
  const drivers = new Map<string, IBookingDriver>();
  const mobility = new Map<string, IMobilityRequirement>();

  bookings.forEach((b) => {
    if (typeof b.userId === 'object' && b.userId?._id) users.set(b.userId._id, b.userId);
    if (typeof b.driverId === 'object' && b.driverId?._id) drivers.set(b.driverId._id, b.driverId);
    if (typeof b.mobilityRequirements === 'object' && b.mobilityRequirements?._id) {
      mobility.set(b.mobilityRequirements._id, b.mobilityRequirements);
    }
  });

  return {
    users: Array.from(users.values()),
    drivers: Array.from(drivers.values()),
    mobility: Array.from(mobility.values()),
  };
};

// Helper: check if two time windows overlap (within 1.5 hours either side)
export const hasTimeConflict = (existingTrip: any, candidateTime: string | null) => {
  if (!existingTrip.scheduledTime || !candidateTime) return false;
  const existing = new Date(existingTrip.scheduledTime).getTime();
  const candidate = new Date(candidateTime).getTime();
  if (Number.isNaN(existing) || Number.isNaN(candidate)) return false;
  const BUFFER_MS = 90 * 60 * 1000; // 1.5 hour buffer
  return Math.abs(existing - candidate) < BUFFER_MS;
};

// Helper: check if driver vehicle type matches trip mobility need
export const isVehicleMatch = (driver: any, booking: any) => {
  if (!booking?.mobility || booking.mobility.toLowerCase() === 'standard') return true;
  const need = booking.mobility.toLowerCase();
  const type = driver.vehicle?.type?.toLowerCase() || '';
  if (need.includes('wheelchair') || need.includes('stretcher')) return type.includes(need.split(' ')[0]);
  return true; // ambulatory / cane can use any van
};
