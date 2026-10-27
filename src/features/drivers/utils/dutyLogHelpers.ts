import type { IDriverDutyLog } from '@/redux/api/driversApi'
import { formatTime } from '@/utils/helpers'

export const defaultDutyLogRange = (): { from: string; to: string } => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

export const formatDutyDate = (isoDate?: string): string => {
  if (!isoDate) return '—'
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDutyTime = (iso?: string | null): string => {
  if (!iso) return '—'
  return formatTime(iso) || '—'
}

export const mapDutyLogRow = (log: IDriverDutyLog) => ({
  id: log._id,
  date: log.date,
  dateLabel: formatDutyDate(log.date),
  isOnDuty: Boolean(log.isOnDuty),
  firstStart: log.firstStartTime,
  lastEnd: log.lastEndTime,
  totalFormatted: log.totalDuration?.formatted || '—',
})

export type MappedDutyLog = ReturnType<typeof mapDutyLogRow>
