// Helper: check if two time windows overlap (within 1.5 hours either side)
export const hasTimeConflict = (existingTrip: any, candidateTime: string | null) => {
  if (!existingTrip.scheduledTime || !candidateTime) return false;
  const existing = new Date(existingTrip.scheduledTime).getTime();
  const candidate = new Date(candidateTime).getTime();
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
