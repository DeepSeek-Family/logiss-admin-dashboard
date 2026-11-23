import React from "react";
import { MapPin } from "lucide-react";
import { useGetCountyNamesQuery } from "@/redux/api/coverageApi";

const DATE_INPUT =
  "bg-white border rounded-xl py-2 px-3 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer";

export interface TripHistoryRangeFiltersProps {
  startDate: string;
  endDate: string;
  /** County id, or "" for all counties. */
  countyId: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCountyIdChange: (value: string) => void;
  dateRangeError?: string | null;
}

export const TripHistoryRangeFilters: React.FC<TripHistoryRangeFiltersProps> = ({
  startDate,
  endDate,
  countyId,
  onStartDateChange,
  onEndDateChange,
  onCountyIdChange,
  dateRangeError,
}) => {
  const { data: countyNamesResponse } = useGetCountyNamesQuery();
  const counties = (countyNamesResponse?.data || []).filter((c) => c.isActive !== false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-4 whitespace-nowrap">Start Date</span>
        <input
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={`${DATE_INPUT} ${dateRangeError ? "border-urgent" : "border-line"}`}
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
          className={`${DATE_INPUT} ${dateRangeError ? "border-urgent" : "border-line"}`}
          aria-invalid={Boolean(dateRangeError)}
        />
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={12} className="text-ink-4" />
        <span className="text-xs text-ink-4">Funding Source</span>
        <select
          value={countyId}
          onChange={(e) => onCountyIdChange(e.target.value)}
          className="bg-white border border-line rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-ink focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none h-9 cursor-pointer appearance-none"
        >
          <option value="">All Funding Sources</option>
          {counties.map((county) => (
            <option key={county._id} value={county._id}>
              {county.name || county._id}
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
