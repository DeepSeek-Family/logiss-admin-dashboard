export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0=Mon

// Deterministic mock schedule per driver+day
export const getShift = (driverIdx: number, dayIdx: number) => {
  const seed = (driverIdx * 7 + dayIdx) % 6;
  if (seed === 0) return { type: 'heavy', label: '8 Trips', time: '07:00 – 16:00', color: 'primary' };
  if (seed === 1) return { type: 'split', label: '4 Trips', time: '06:00 – 10:00\n14:00 – 18:00', color: 'warning' };
  if (seed === 2) return null; // Off
  if (seed === 3) return { type: 'normal', label: '5 Trips', time: '12:00 – 20:00', color: 'accent' };
  if (seed === 4) return { type: 'light', label: '2 Trips', time: '09:00 – 13:00', color: 'primary' };
  return { type: 'leave', label: 'Leave', time: 'All Day', color: 'neutral' };
};

export const shiftStyle: { [key: string]: string } = {
  primary: 'bg-primary-tint/40 border-primary/20 text-primary',
  warning: 'bg-warning-light/50 border-warning/20 text-warning-dark',
  neutral: 'bg-bg border-line-2 text-ink-3',
  accent: 'bg-accent-light/40 border-accent/20 text-accent-dark',
};
