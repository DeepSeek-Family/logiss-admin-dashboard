interface TripDurationSource {
  duration?: unknown;
  miles?: unknown;
  [key: string]: unknown;
}

export const formatLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const parseLocalDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};

export const isSameCalendarDay = (firstDate: Date, secondDate: Date): boolean =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60_000);

export const estimateTripDurationMinutes = (trip: TripDurationSource): number => {
  const parsedDuration = Number.parseInt(String(trip?.duration ?? ""), 10);
  if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
    return Math.min(parsedDuration, 180);
  }

  const miles = Number(trip?.miles);
  if (Number.isFinite(miles) && miles > 0) {
    return Math.min(150, Math.round(miles * 3) + 12);
  }

  return 45;
};

export const parseClockTimeToMinutes = (clockTime?: string): number | null => {
  if (!clockTime) return null;
  const match = String(clockTime).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const formatDurationMinutes = (minutes: number): string => {
  const roundedMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  return hours
    ? `${hours}h${remainingMinutes ? ` ${remainingMinutes}m` : ""}`
    : `${remainingMinutes}m`;
};

export const isInvalidDateRange = (startDate: string, endDate: string): boolean =>
  Boolean(startDate && endDate && endDate < startDate);
