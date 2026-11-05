import type { ActiveDutySession, IDriverDutyLog } from "@/redux/api/driversApi";
import { formatTime } from "@/utils/helpers";

export const defaultDutyLogRange = (): { from: string; to: string } => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
};

export const formatDutyDate = (isoDate?: string): string => {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDutyTime = (iso?: string | null): string => {
  if (!iso) return "—";
  return formatTime(iso) || "—";
};

export const mapDutyLogRow = (log: IDriverDutyLog) => ({
  id: log._id,
  date: log.date,
  dateLabel: formatDutyDate(log.date),
  isOnDuty: Boolean(log.isOnDuty),
  firstStart: log.firstStartTime,
  lastEnd: log.lastEndTime,
  totalFormatted: log.totalDuration?.formatted || "—",
});

export type MappedDutyLog = ReturnType<typeof mapDutyLogRow>;

export const formatDurationMs = (ms?: number): string => {
  if (ms == null || Number.isNaN(ms) || ms < 0) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

export const openSessionStart = (sessions?: ActiveDutySession[]): string | null => {
  if (!sessions?.length) return null;
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    if (sessions[i].endTime === null) return sessions[i].startTime;
  }
  return null;
};
