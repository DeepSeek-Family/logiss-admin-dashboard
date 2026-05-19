import { useState } from 'react';
import { Card } from '@/shared/components/ui';
import { money } from '@/utils/helpers';

interface MonthlyData {
  month: string;
  trips: number;
  revenue: number;
}

interface TripDistributionChartProps {
  monthlyData: MonthlyData[];
  maxRevenue: number;
}

export const TripDistributionChart = ({ monthlyData, maxRevenue }: TripDistributionChartProps) => {
  const [yearFilter, setYearFilter] = useState('2026');

  return (
    <Card className="p-6 border-line-2 h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Trip Distribution</h3>
          <p className="text-xs text-ink-4">Monthly breakdown by type</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><span className="text-xs text-ink-4">Round Trip</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent" /><span className="text-xs text-ink-4">One Way</span></div>
        </div>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-bg border border-line rounded-xl py-2 px-4 text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
      </div>

      <div className="relative h-[250px] w-full flex items-end justify-between pt-6 mt-4 border-b border-line-2 pb-2">
        <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
          {[4, 3, 2, 1, 0].map(line => (
            <div key={line} className="flex items-center w-full gap-4">
              <span className="w-12 text-right text-xs text-ink-4 font-mono">{money((maxRevenue / 4) * line)}</span>
              <div className="flex-1 border-t border-dashed border-line-2"></div>
            </div>
          ))}
        </div>

        <div className="w-full flex items-end justify-around h-full pl-16 z-10 pb-6">
          {monthlyData.map((data, idx) => {
            const tripHeight = (data.trips / 500) * 100;
            const revenueHeight = (data.revenue / maxRevenue) * 100;
            return (
              <div key={idx} className="relative flex flex-col items-center justify-end h-full w-full group">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  <div
                    className={`w-3 rounded-t-sm transition-all ${tripHeight > 0 ? 'bg-primary group-hover:bg-primary/80' : 'bg-line-2'}`}
                    style={{ height: tripHeight > 0 ? `${tripHeight}%` : '4px' }}
                  />
                  <div
                    className={`w-3 rounded-t-sm transition-all ${revenueHeight > 0 ? 'bg-accent group-hover:opacity-80' : 'bg-line-2'}`}
                    style={{ height: revenueHeight > 0 ? `${revenueHeight}%` : '4px' }}
                  />
                </div>
                <span className="absolute -bottom-8 text-xs text-ink-4 transition-colors group-hover:text-ink">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
