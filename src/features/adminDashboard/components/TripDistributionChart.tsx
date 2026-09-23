import { Card, Button } from "@/shared/components/ui";
import { useGetDashboardAnalyticsQuery } from "@/redux/apivtwo/dashboardOnvording";
import { Loader } from "@/shared/Lodder";

const barHeight = (value: number, scale: number) =>
  value > 0 ? `${(value / scale) * 100}%` : "4px";

export const TripDistributionChart = () => {
  const {
    data: months = [],
    isLoading,
    isError,
    refetch,
  } = useGetDashboardAnalyticsQuery();

  const peak = months.reduce(
    (max, month) => Math.max(max, month.oneWayTrips, month.roundTripTrips),
    0,
  );
  const scale = peak > 0 ? peak : 4;

  return (
    <Card className="p-6 border-line-2 h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Trip Distribution</h3>
          <p className="text-xs text-ink-4">Monthly breakdown by type</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs text-ink-4">Round Trip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-xs text-ink-4">One Way</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader message="Loading trip distribution..." />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <p className="text-sm text-ink-4">Could not load trip distribution.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : months.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-ink-4">No trip distribution data.</p>
        </div>
      ) : (
        <div className="relative h-[250px] w-full flex items-end justify-between pt-6 mt-4 border-b border-line-2 pb-2">
          <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0">
            {[4, 3, 2, 1, 0].map((line) => (
              <div key={line} className="flex items-center w-full gap-4">
                <span className="w-12 text-right text-xs text-ink-4">
                  {Math.round((scale / 4) * line)}
                </span>
                <div className="flex-1 border-t border-dashed border-line-2"></div>
              </div>
            ))}
          </div>

          <div className="w-full flex items-end justify-around h-full pl-16 z-10 pb-6">
            {months.map((data) => (
              <div
                key={data.month}
                className="relative flex flex-col items-center justify-end h-full w-full group"
              >
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  <div
                    className={`w-3 rounded-t-sm transition-all ${data.roundTripTrips > 0 ? "bg-primary group-hover:bg-primary/80" : "bg-line-2"}`}
                    style={{ height: barHeight(data.roundTripTrips, scale) }}
                    title={`Round trip: ${data.roundTripTrips}`}
                  />
                  <div
                    className={`w-3 rounded-t-sm transition-all ${data.oneWayTrips > 0 ? "bg-accent group-hover:opacity-80" : "bg-line-2"}`}
                    style={{ height: barHeight(data.oneWayTrips, scale) }}
                    title={`One way: ${data.oneWayTrips}`}
                  />
                </div>
                <span className="absolute -bottom-8 text-xs text-ink-4 transition-colors group-hover:text-ink">
                  {data.month.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
