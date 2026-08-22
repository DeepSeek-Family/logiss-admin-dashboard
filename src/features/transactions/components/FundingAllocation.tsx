import React from 'react';
import { money } from '@/utils/helpers';
import { Landmark, Users } from 'lucide-react';

interface FundingAllocationProps {
  countyTotal: number;
  copayTotal: number;
  totalRevenue: number;
}

export const FundingAllocation: React.FC<FundingAllocationProps> = ({ countyTotal, copayTotal, totalRevenue }) => {
  const streamTotal = countyTotal + copayTotal || totalRevenue;
  const countyPercent = streamTotal > 0 ? Math.round((countyTotal / streamTotal) * 100) : 0;
  const copayPercent = streamTotal > 0 ? Math.round((copayTotal / streamTotal) * 100) : 0;

  return (
    <div className="bg-white border border-line-2 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink">Funding Stream Allocation</h3>
          <p className="text-xs text-ink-4 mt-0.5">Distribution between County Claims and Rider Copays</p>
        </div>
        <span className="text-xs font-bold text-ink bg-bg px-2.5 py-1 rounded-lg border border-line-2">
          Total: {money(streamTotal)}
        </span>
      </div>

      {/* Modern Stacked Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-bg border border-line-2/50">
          {streamTotal > 0 ? (
            <>
              <div
                className="bg-primary transition-all duration-500 rounded-l-full"
                style={{ width: `${(countyTotal / streamTotal) * 100}%` }}
                title={`County Claims: ${money(countyTotal)} (${countyPercent}%)`}
              />
              <div
                className="bg-accent transition-all duration-500 rounded-r-full"
                style={{ width: `${(copayTotal / streamTotal) * 100}%` }}
                title={`Customer Fare: ${money(copayTotal)} (${copayPercent}%)`}
              />
            </>
          ) : (
            <div className="w-full bg-line-2/50 flex items-center justify-center text-xs text-ink-4">No data available</div>
          )}
        </div>
      </div>

      {/* Clean Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <Landmark size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-3">County Subsidies &amp; Claims</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-primary">{money(countyTotal)}</span>
              <span className="text-xs font-semibold text-primary/70">({countyPercent}%)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-accent/5 border border-accent/10">
          <div className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-3">Customer Copay &amp; Self-Pay</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-accent">{money(copayTotal)}</span>
              <span className="text-xs font-semibold text-accent/70">({copayPercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
