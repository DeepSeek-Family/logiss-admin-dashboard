import { Card } from '@/shared/components/ui';
import { money } from '@/utils/helpers';

interface FundingAllocationProps {
  countyTotal: number;
  copayTotal: number;
  totalRevenue: number;
}

export const FundingAllocation = ({ countyTotal, copayTotal, totalRevenue }: FundingAllocationProps) => {
  return (
    <div className="bg-white border border-line-2 rounded-2xl p-6 shadow-sm">
      <h3 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-4">Funding Stream Allocation</h3>
      
      <div className="space-y-6">
        {/* Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-bg border border-line-2 shadow-inner">
            {totalRevenue > 0 ? (
              <>
                <div 
                  className="bg-primary hover:opacity-90 transition-all duration-300 relative"
                  style={{ width: `${(countyTotal / totalRevenue) * 100}%` }}
                  title={`County Claims: ${money(countyTotal)}`}
                />
                <div 
                  className="bg-accent hover:opacity-90 transition-all duration-300 relative"
                  style={{ width: `${(copayTotal / totalRevenue) * 100}%` }}
                  title={`Patient Copays: ${money(copayTotal)}`}
                />
              </>
            ) : (
              <div className="w-full bg-line-2 flex items-center justify-center text-xs text-ink-4">No data available</div>
            )}
          </div>
        </div>

        {/* Simple Legends */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-line">
            <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
            <div>
              <p className="text-xs font-medium text-ink">County Claims</p>
              <p className="text-sm font-semibold text-primary mt-0.5">{money(countyTotal)} <span className="text-xs text-ink-4">({totalRevenue > 0 ? Math.round((countyTotal / totalRevenue) * 100) : 0}%)</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-line">
            <div className="w-3 h-3 rounded-full bg-accent shrink-0" />
            <div>
              <p className="text-xs font-medium text-ink">Patient Copays</p>
              <p className="text-sm font-semibold text-accent mt-0.5">{money(copayTotal)} <span className="text-xs text-ink-4">({totalRevenue > 0 ? Math.round((copayTotal / totalRevenue) * 100) : 0}%)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
