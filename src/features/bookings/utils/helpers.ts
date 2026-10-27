import type {
  IBooking,
  IBookingDriver,
  IBookingPricingLeg,
  IBookingUser,
  IMobilityRequirement,
} from '@/redux/api/bookingApi';

export type DriverAssignmentFilter = 'all' | 'assigned' | 'unassigned'

/** Maps UI filter to `unassign` query param for approved/schedule/history lists. */
export const assignFilterToUnassignQuery = (
  filter: DriverAssignmentFilter,
): boolean | undefined => {
  if (filter === 'unassigned') return true
  if (filter === 'assigned') return false
  return undefined
}

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

/** Minutes from midnight for HTML `<input type="time">` value (`HH:mm`). */
export const parseTimeInputToMinutes = (value?: string): number | null => {
  if (!value?.trim()) return null;
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
};

export const MIN_PICKUP_BEFORE_APPOINTMENT_MIN = 30;
/** Soft cap — warn if pickup is unusually early. */
export const MAX_PICKUP_BEFORE_APPOINTMENT_MIN = 240;
export const MIN_RETURN_AFTER_APPOINTMENT_MIN = 30;

export interface ScheduleTimeValidation {
  errors: string[];
  warnings: string[];
  pickupLeadMinutes: number | null;
}

export function validateServiceScheduleTimes(input: {
  requestedPickup?: string;
  appointmentTime?: string;
  returnPickup?: string;
  tripType?: string;
  isWillCall?: boolean;
}): ScheduleTimeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pickupMin = parseTimeInputToMinutes(input.requestedPickup);
  const apptMin = parseTimeInputToMinutes(input.appointmentTime);

  if (input.requestedPickup && pickupMin == null) {
    errors.push('Pickup time is not valid.');
  }
  if (input.appointmentTime && apptMin == null) {
    errors.push('Appointment time is not valid.');
  }

  let pickupLeadMinutes: number | null = null;

  if (pickupMin != null && apptMin != null) {
    pickupLeadMinutes = apptMin - pickupMin;
    if (pickupLeadMinutes <= 0) {
      errors.push('Pickup time cannot be at or after appointment time.');
    } else if (pickupLeadMinutes < MIN_PICKUP_BEFORE_APPOINTMENT_MIN) {
      errors.push(
        `Pickup must be at least ${MIN_PICKUP_BEFORE_APPOINTMENT_MIN} minutes before appointment (currently ${pickupLeadMinutes} min).`,
      );
    } else if (pickupLeadMinutes > MAX_PICKUP_BEFORE_APPOINTMENT_MIN) {
      warnings.push(
        `Pickup is ${Math.round(pickupLeadMinutes / 60)} hours before appointment — confirm this is intentional.`,
      );
    }
  }

  const isRound = input.tripType === 'round-trip';
  if (isRound && !input.isWillCall) {
    const returnMin = parseTimeInputToMinutes(input.returnPickup);
    if (!input.returnPickup?.trim()) {
      errors.push('Return pickup time is required for round trips, or turn on Will Call.');
    } else if (returnMin == null) {
      errors.push('Return time is not valid.');
    } else if (apptMin != null) {
      const afterAppt = returnMin - apptMin;
      if (afterAppt <= 0) {
        errors.push('Return pickup must be after appointment time.');
      } else if (afterAppt < MIN_RETURN_AFTER_APPOINTMENT_MIN) {
        warnings.push(
          `Return is only ${afterAppt} min after appointment — allow time for the visit or adjust return time.`,
        );
      }
    }
  }

  return { errors, warnings, pickupLeadMinutes };
}

export const toLocationValue = (value: any): [number, number] | null => {
  if (value == null || value === '') return null;
  const loc = to2NumArrayLoc(value);
  return loc || null;
};

/**
 * Picker and geocode points are [latitude, longitude].
 * MongoDB GeoJSON expects [longitude, latitude].
 * A first value outside ±90 is already longitude, so it is left as-is.
 */
export const toGeoJsonPosition = (pair: [number, number]): [number, number] => {
  const [a, b] = pair;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return pair;
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) return [a, b];
  return [b, a];
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

import { detectCountyFromAddress, extractGpsFromAddress } from '@/utils/geofenceEngine';

const personInitials = (person?: Pick<IBookingUser, 'firstName' | 'lastName'> | null): string => {
  if (!person) return '';
  return `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase();
};

export const to2NumArrayLoc = (val: any): [number, number] | undefined => {
  if (val == null || val === '') return undefined;

  if (Array.isArray(val)) {
    if (val.length >= 2) {
      const n1 = Number(val[0]);
      const n2 = Number(val[1]);
      if (Number.isFinite(n1) && Number.isFinite(n2)) {
        return [n1, n2];
      }
    } else if (val.length === 1) {
      const n1 = Number(val[0]);
      if (Number.isFinite(n1)) return [n1, 0];
    }
  }

  const strVal = String(val).trim();
  if (!strVal) return undefined;

  const nums = strVal.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (nums && nums.length >= 2) {
    if (Number.isFinite(nums[0]) && Number.isFinite(nums[1])) {
      return [nums[0], nums[1]];
    }
  }

  const extracted = extractGpsFromAddress(strVal);
  if (extracted) return extracted;

  const detected = detectCountyFromAddress(strVal);
  if (detected.matchedBy !== 'fallback' && detected.gpsEstimate && detected.gpsEstimate.length === 2) {
    return detected.gpsEstimate;
  }

  if (nums && nums.length === 1 && Number.isFinite(nums[0])) {
    return [nums[0], 0];
  }

  return [37.5407, -77.4360];
};

export const parseLatLng = (val: any): { lat: number; lng: number } | null => {
  if (val == null || val === '') return null;
  const loc = to2NumArrayLoc(val);
  if (!loc || !Number.isFinite(loc[0]) || !Number.isFinite(loc[1])) return null;
  let [n1, n2] = loc;
  if (Math.abs(n1) > 90 && Math.abs(n2) <= 90) {
    return { lat: n2, lng: n1 };
  }
  return { lat: n1, lng: n2 };
};

export const extractBookingStopsCoords = (b: any): { lat: number; lng: number }[] => {
  if (!b) return [];
  const rawStops = b.stopAddressRaw ?? b.stops ?? b.stopAddress ?? b.stop;
  if (!rawStops) return [];

  if (Array.isArray(rawStops)) {
    if (rawStops.length === 2 && typeof rawStops[0] === 'number' && typeof rawStops[1] === 'number') {
      const parsed = parseLatLng(rawStops);
      return parsed ? [parsed] : [];
    }
    const results: { lat: number; lng: number }[] = [];
    rawStops.forEach((item: any) => {
      const parsed = parseLatLng(item);
      if (parsed) results.push(parsed);
    });
    return results;
  }

  const parsed = parseLatLng(rawStops);
  return parsed ? [parsed] : [];
};

export const formatLocationString = (val: any): string => {
  if (val == null || val === '') return 'N/A';
  if (Array.isArray(val)) {
    const clean = val.filter((x) => x != null && x !== '');
    if (clean.length === 2 && !isNaN(Number(clean[0])) && !isNaN(Number(clean[1]))) {
      return `${clean[0]}, ${clean[1]}`;
    }
    return clean.join(', ');
  }
  return String(val);
};

const pricingNum = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export const normalizePricingLegs = (raw: unknown): IBookingPricingLeg[] => {
  if (!Array.isArray(raw)) return []
  return raw.filter((item) => item && typeof item === 'object') as IBookingPricingLeg[]
}

export const formatPricingZone = (zone?: string | null): string => {
  const z = String(zone || '').trim().toLowerCase()
  if (!z) return ''
  if (z === 'inside') return 'Inside'
  if (z === 'outside') return 'Outside'
  return z.charAt(0).toUpperCase() + z.slice(1)
}

/** Primary zone label for table County column (from API pricingLegs). */
export const pricingZonesDisplay = (legs: IBookingPricingLeg[]): string => {
  if (!legs.length) return ''
  if (legs.length === 1) return formatPricingZone(legs[0].zone)
  return legs
    .map((leg) => {
      const legLabel =
        String(leg.leg || '').toLowerCase() === 'return'
          ? 'Return'
          : String(leg.leg || '').toLowerCase() === 'outbound'
            ? 'Out'
            : 'Leg'
      return `${legLabel}: ${formatPricingZone(leg.zone) || '—'}`
    })
    .join(' · ')
}

export const sumPricingLegs = (legs: IBookingPricingLeg[]) => ({
  passengerCoPay: legs.reduce((sum, leg) => sum + pricingNum(leg.passengerCoPay), 0),
  fundingSourceCharge: legs.reduce((sum, leg) => sum + pricingNum(leg.fundingSourceCharge), 0),
  billingMileage: legs.reduce((sum, leg) => sum + pricingNum(leg.billingMileage), 0),
})

export const zoneBadgeTone = (zone?: string | null): string => {
  const z = String(zone || '').trim().toLowerCase()
  if (z === 'inside') return 'text-accent bg-accent/10 border-accent/25'
  if (z === 'outside') return 'text-urgent bg-urgent/10 border-urgent/25'
  return 'text-ink-3 bg-bg border-line-2'
}

/** Payer display name from populated `countyId.payersId` (e.g. "Dhaka City"). */
export const countyPayerNameFromBooking = (booking: {
  countyId?: IBooking['countyId']
}): string => {
  const county = booking.countyId
  if (!county || typeof county !== 'object') return ''
  const payersId = county.payersId
  if (payersId && typeof payersId === 'object') {
    const name = payersId.name || payersId.title || payersId.payerName
    if (name && String(name).trim()) return String(name).trim()
  }
  return ''
}

export const payerSourceObjectLabel = (payer: unknown): string => {
  if (!payer || typeof payer !== 'object') return ''
  const p = payer as { name?: string; title?: string; payerName?: string }
  return String(p.name || p.title || p.payerName || '').trim()
}

export const parseStopsArray = (stopAddressVal: any): string[] => {
  if (stopAddressVal == null || stopAddressVal === '') return [];
  if (Array.isArray(stopAddressVal)) {
    const clean = stopAddressVal.filter((x) => x != null && x !== '');
    if (clean.length === 2 && !isNaN(Number(clean[0])) && !isNaN(Number(clean[1]))) {
      return [`${clean[0]}, ${clean[1]}`];
    }
    return clean.map((s) => (Array.isArray(s) ? formatLocationString(s) : String(s)));
  }
  return [String(stopAddressVal)];
};

export const mapApiBooking = (b: IBooking) => {
  const userObj = typeof b.userId === 'object' && b.userId ? (b.userId as IBookingUser) : null;
  const driverObj = typeof b.driverId === 'object' && b.driverId ? (b.driverId as IBookingDriver) : null;
  const mobilityObj =
    typeof b.mobilityRequirements === 'object' && b.mobilityRequirements
      ? (b.mobilityRequirements as IMobilityRequirement)
      : null;
  const rawMobilityId = mobilityObj?._id || (typeof b.mobilityRequirements === 'string' && isMongoId(b.mobilityRequirements) ? b.mobilityRequirements : undefined);
  const payerObj = typeof b.payerSource === 'object' && b.payerSource ? b.payerSource : null;
  const countyPayerName = countyPayerNameFromBooking(b);
  const payerSourceName = payerSourceObjectLabel(payerObj);
  const fundingSourceLabel = countyPayerName || payerSourceName || b.programContext || '';

  const riderName = personName(userObj) || 'Rider';
  const driverName = personName(driverObj) || undefined;
  const pickupTime = b.pickupTime || '';
  const appointmentTime = b.appointmentTime || '';
  const returnTime = b.returnTime || '';

  let mappedStatus = String(b.bookingStatus || 'pending').toLowerCase();
  if (mappedStatus === 'pending') mappedStatus = 'pending_review';

  const tripType = b.tripType || 'one-way';
  const pricingLegs = normalizePricingLegs((b as IBooking).pricingLegs)
  const legTotals = sumPricingLegs(pricingLegs)
  const primaryZone = pricingLegs[0]?.zone
  const pricingZoneLabel = pricingZonesDisplay(pricingLegs)
  const passengerCopay =
    b.passengerCoPay != null ? pricingNum(b.passengerCoPay) : legTotals.passengerCoPay
  const fundingSourceCharge =
    b.organizationContribution != null
      ? pricingNum(b.organizationContribution)
      : legTotals.fundingSourceCharge || pricingNum(b.price)
  const billingMileage =
    legTotals.billingMileage > 0 ? legTotals.billingMileage : undefined

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
    pickup: formatLocationString(b.pickupLocation),
    pickupLocationRaw: b.pickupLocation,
    dropoff: formatLocationString(b.dropOffLocation),
    dropOffLocationRaw: b.dropOffLocation,
    stops: parseStopsArray(b.stopAddress),
    stopAddressRaw: b.stopAddress,
    mobility: mobilityObj?.name || (typeof b.mobilityRequirements === 'string' && !isMongoId(b.mobilityRequirements) ? b.mobilityRequirements : 'Ambulatory'),
    mobilityId: rawMobilityId,
    mobilityRequirementsId: rawMobilityId,
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
    countyPayerName,
    fundingSource: fundingSourceLabel,
    paymentMethod: fundingSourceLabel,
    fundingSourceId: payerObj?._id || (typeof b.payerSource === 'string' ? b.payerSource : undefined),
    countyId:
      typeof b.countyId === 'object' && b.countyId?._id
        ? b.countyId._id
        : typeof b.countyId === 'string'
          ? b.countyId
          : undefined,
    isRecurring: Boolean(b.recurringBooking),
    recurringDays: b.selectedDate || [],
    endDate: b.endDate,
    tripNote: b.tripNote,
    notes: b.tripNote,
    internalPrivateNote: b.internalPrivateNote,
    privateNotes: b.internalPrivateNote,
    price: passengerCopay,
    cost: fundingSourceCharge,
    copay: passengerCopay,
    passengerCopay,
    fundingSourceCharge,
    totalPrice: b.totalPrice,
    organizationContribution: b.organizationContribution,
    passengerCoPay: b.passengerCoPay,
    pricingLegs,
    pricingZoneLabel,
    primaryPricingZone: primaryZone,
    billingMileage,
    billingMileageSource: b.billingMileageSource,
    insideCounty:
      primaryZone === 'inside' ? true : primaryZone === 'outside' ? false : undefined,
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

/** Convert front-end edit patch objects to the exact backend IBooking schema payload structure. */
export const mapPatchToApiPayload = (patch: Record<string, any>): Record<string, any> => {
  const payload: Record<string, any> = {};

  // 1. Service Date (serviceDate) -> "2026-10-16"
  const dateVal = patch.serviceDate || patch.scheduledDate || patch.scheduledTime;
  if (dateVal) {
    payload.serviceDate = String(dateVal).slice(0, 10);
  }

  // 2. Pickup Time (pickupTime) -> "09:22 AM"
  const pickupTimeVal = patch.pickupTime || patch.requestedPickup || patch.scheduledTimeOfDay;
  if (pickupTimeVal) {
    payload.pickupTime = toApiTime(pickupTimeVal);
  }

  // 3. Appointment Time (appointmentTime) -> "08:00 AM"
  if (patch.appointmentTime) {
    payload.appointmentTime = toApiTime(patch.appointmentTime);
  }

  // 4. Return Time (returnTime) -> "12:30 PM"
  const returnTimeVal = patch.returnTime || patch.returnPickup;
  if (returnTimeVal) {
    payload.returnTime = toApiTime(returnTimeVal);
  }

  // 5. Pickup Location (pickupLocation) -> GeoJSON [longitude, latitude]
  const pickupLocVal = patch.pickupLocation !== undefined ? patch.pickupLocation : patch.pickup;
  if (pickupLocVal !== undefined && pickupLocVal !== null && pickupLocVal !== '') {
    const locArr = to2NumArrayLoc(pickupLocVal);
    if (locArr) payload.pickupLocation = toGeoJsonPosition(locArr);
  }

  // 6. Dropoff Location (dropOffLocation) -> GeoJSON [longitude, latitude]
  const dropoffLocVal = patch.dropOffLocation !== undefined ? patch.dropOffLocation : patch.dropoff;
  if (dropoffLocVal !== undefined && dropoffLocVal !== null && dropoffLocVal !== '') {
    const locArr = to2NumArrayLoc(dropoffLocVal);
    if (locArr) payload.dropOffLocation = toGeoJsonPosition(locArr);
  }

  // 7. Stop Address (stopAddress) -> GeoJSON [longitude, latitude]
  const stopAddressVal = patch.stopAddress !== undefined ? patch.stopAddress : (Array.isArray(patch.stops) ? patch.stops[0] : patch.stop);
  if (stopAddressVal !== undefined && stopAddressVal !== null && stopAddressVal !== '') {
    const locArr = to2NumArrayLoc(stopAddressVal);
    if (locArr) payload.stopAddress = toGeoJsonPosition(locArr);
  }

  // 8. Mobility Requirements (mobilityRequirements) -> Mongo ObjectId string
  let mobVal = patch.mobilityRequirements || patch.mobilityId || patch.mobility;
  if (typeof mobVal === 'object' && mobVal != null) {
    mobVal = mobVal._id || mobVal.id;
  }
  if (mobVal && isMongoId(String(mobVal))) {
    payload.mobilityRequirements = String(mobVal);
  }

  // 9. Trip Note / Driver Instructions (tripNote)
  const tripNoteVal = patch.tripNote !== undefined ? patch.tripNote : patch.notes;
  if (tripNoteVal !== undefined) {
    payload.tripNote = String(tripNoteVal);
  }

  // 10. Internal Private Note (internalPrivateNote)
  const privateNoteVal = patch.internalPrivateNote !== undefined ? patch.internalPrivateNote : patch.privateNotes;
  if (privateNoteVal !== undefined) {
    payload.internalPrivateNote = String(privateNoteVal);
  }

  // 11. Trip Type (tripType) -> "round-trip" | "one-way"
  const tripTypeVal = patch.tripType || patch.type;
  if (tripTypeVal) {
    payload.tripType = tripTypeVal === 'round_trip' ? 'round-trip' : String(tripTypeVal);
  }

  // 12. Trip Reason (tripReason)
  const reasonVal = patch.tripReason !== undefined ? patch.tripReason : patch.reason;
  if (reasonVal !== undefined) {
    payload.tripReason = String(reasonVal);
  }

  // 13. Passenger Seats (passengerSeats) -> number
  const seatsVal = patch.passengerSeats !== undefined ? patch.passengerSeats : patch.passengers;
  if (seatsVal !== undefined) {
    payload.passengerSeats = Number(seatsVal) || 1;
  }

  // 14. Payer Source (payerSource) -> Mongo ObjectId string
  let payerVal = patch.payerSource || patch.fundingSourceId;
  if (typeof payerVal === 'object' && payerVal != null) {
    payerVal = payerVal._id || payerVal.id;
  }
  if (payerVal && isMongoId(String(payerVal))) {
    payload.payerSource = String(payerVal);
  }

  // 15. Program Context (programContext)
  const progVal = patch.programContext !== undefined ? patch.programContext : patch.source;
  if (progVal !== undefined) {
    payload.programContext = String(progVal);
  }

  // 16. Driver ID (driverId) -> Mongo ObjectId string, string ID or null
  if ('driverId' in patch) {
    let driverVal = patch.driverId;
    if (typeof driverVal === 'object' && driverVal != null) {
      driverVal = driverVal._id || driverVal.id;
    }
    payload.driverId = driverVal ? String(driverVal) : null;
  }


  // 17. Booking Status (bookingStatus) & Approval (isApproved)
  if ('isApproved' in patch) {
    payload.isApproved = patch.isApproved;
  }
  if ('bookingStatus' in patch) {
    payload.bookingStatus = patch.bookingStatus;
  } else if ('status' in patch) {
    const s = String(patch.status).toLowerCase();
    if (s === 'approved') {
      payload.isApproved = 'approved';
      payload.bookingStatus = 'assigned';
    } else if (s === 'rejected' || s === 'cancelled') {
      payload.isApproved = 'rejected';
      payload.bookingStatus = 'cancelled';
    } else {
      payload.bookingStatus = patch.status;
    }
  }

  // 18. Price (price) -> number
  const priceVal = patch.price !== undefined ? patch.price : (patch.fundingSourceCharge !== undefined ? patch.fundingSourceCharge : patch.cost);
  if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
    const numPrice = Number(priceVal);
    if (!Number.isNaN(numPrice)) {
      payload.price = numPrice;
    }
  }

  return payload;
};

