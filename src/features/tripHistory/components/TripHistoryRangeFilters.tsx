import React from 'react';
import { DollarSign } from 'lucide-react';
import { useGetAllPayersQuery } from '@/redux/api/bookingApi';

const DATE_INPUT =
  'bg-white border rounded-xl py-2 px-3 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer';

export interface TripHistoryRangeFiltersProps {
  startDate: string;
  endDate: string;
  payerId: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPayerIdChange: (value: string) => void;
  dateRangeError?: string | null;
}

export const TripHistoryRangeFilters: React.FC<TripHistoryRangeFiltersProps> = ({
  startDate,
  endDate,
  payerId,
  onStartDateChange,
  onEndDateChange,
  onPayerIdChange,
  dateRangeError,
}) => {
  const { data: payersResponse } = useGetAllPayersQuery();
  const payers = payersResponse?.data || [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-4 whitespace-nowrap">Start Date</span>
        <input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={`${DATE_INPUT} ${dateRangeError ? 'border-urgent' : 'border-line'}`}
          aria-invalid={Boolean(dateRangeError)}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-4 whitespace-nowrap">End Date</span>
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={`${DATE_INPUT} ${dateRangeError ? 'border-urgent' : 'border-line'}`}
          aria-invalid={Boolean(dateRangeError)}
        />
      </div>
      <div className="flex items-center gap-2">
        <DollarSign size={12} className="text-ink-4" />
        <span className="text-xs text-ink-4">Payer</span>
        <select
          value={payerId}
          onChange={(e) => onPayerIdChange(e.target.value)}
          className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
        >
          <option value="">All</option>
          {payers.map((payer) => (
            <option key={payer._id} value={payer._id}>
              {payer.name || payer.title || payer.payerName || payer._id}
            </option>
          ))}
        </select>
      </div>
      {dateRangeError ? (
        <p className="text-xs text-urgent whitespace-nowrap">{dateRangeError}</p>
      ) : null}
    </div>
  );
};
