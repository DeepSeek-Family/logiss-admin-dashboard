import React, { useMemo, useState } from 'react'
import { AlertTriangle, Clock, Loader2, RefreshCw } from 'lucide-react'
import { Badge, Button, EmptyState, Pagination } from '@/shared/components/ui'
import { useGetDriverDutyLogsQuery } from '@/redux/api/driversApi'
import { apiErrorMessage } from '@/features/bookings/utils/helpers'
import { defaultDutyLogRange, formatDutyTime, mapDutyLogRow } from '../utils/dutyLogHelpers'

const LOGS_LIMIT = 10

interface DriverWorkHistoryTabProps {
  driverId: string
}

export const DriverWorkHistoryTab: React.FC<DriverWorkHistoryTabProps> = ({ driverId }) => {
  const initialRange = useMemo(() => defaultDutyLogRange(), [])
  const [draftFrom, setDraftFrom] = useState(initialRange.from)
  const [draftTo, setDraftTo] = useState(initialRange.to)
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, isError, error, refetch } = useGetDriverDutyLogsQuery(
    { driverId, from, to, page, limit: LOGS_LIMIT },
    { skip: !driverId, refetchOnMountOrArgChange: true },
  )

  const logs = useMemo(() => (data?.data || []).map(mapDutyLogRow), [data])
  const pagination = data?.pagination
  const totalPages = pagination?.totalPage || 1
  const totalItems = pagination?.total ?? logs.length

  const applyRange = () => {
    setFrom(draftFrom)
    setTo(draftTo)
    setPage(1)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line-2 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-4">From</label>
          <input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            className="h-9 rounded-lg border border-line-2 bg-bg px-3 text-sm text-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-4">To</label>
          <input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            className="h-9 rounded-lg border border-line-2 bg-bg px-3 text-sm text-ink"
          />
        </div>
        <Button variant="primary" className="h-9 text-sm" onClick={applyRange} disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Apply'}
        </Button>
        {(isLoading || isFetching) && (
          <Loader2 size={18} className="mb-2 animate-spin text-primary" aria-hidden />
        )}
      </div>

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line-2 bg-white py-14 text-center">
          <AlertTriangle size={36} className="mb-3 text-urgent opacity-60" />
          <p className="mb-3 text-sm text-ink-3">{apiErrorMessage(error, 'Failed to load work history')}</p>
          <Button variant="outline" icon={RefreshCw} className="h-9 text-sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isError && isLoading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line-2 bg-white py-20 text-sm text-ink-4">
          <Loader2 size={24} className="mb-2 animate-spin text-primary" />
          Loading work history
        </div>
      )}

      {!isError && !isLoading && logs.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No duty logs"
          description="No work history for this date range."
        />
      )}

      {!isError && !isLoading && logs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line-2 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="border-b border-line-2 bg-bg/80">
                <tr>
                  {['Date', 'Status', 'First start', 'Last end', 'Total hours'].map((h) => (
                    <th key={h} className="type-th whitespace-nowrap px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {logs.map((log) => {
                  const lastEndLabel = log.lastEnd
                    ? formatDutyTime(log.lastEnd)
                    : log.isOnDuty
                      ? 'in_progress'
                      : '—'
                  return (
                  <tr key={log.id} className="hover:bg-bg/40">
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-ink">{log.dateLabel}</p>
                      <p className="text-[10px] text-ink-4 tabular-nums">{log.date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={log.isOnDuty ? 'accent' : 'neutral'} dot className="capitalize whitespace-nowrap">
                        {log.isOnDuty ? 'On duty' : 'Off duty'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium tabular-nums text-ink">
                      {formatDutyTime(log.firstStart)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium tabular-nums text-ink">
                      {lastEndLabel === 'in_progress' ? (
                        <span className="font-semibold text-accent">In progress</span>
                      ) : (
                        lastEndLabel
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold tabular-nums text-primary">
                      {log.totalFormatted}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={LOGS_LIMIT}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  )
}
