import React from 'react';
import { FileText, MapPin, ArrowRight } from 'lucide-react';
import { Button, Card, Avatar, TripStatusBadge } from '@/shared/components/ui';

interface FleetTripsTabProps {
  vehicleTrips: any[];
  drivers: any[];
  setSelectedTripId: (id: string) => void;
}

export const FleetTripsTab: React.FC<FleetTripsTabProps> = ({ vehicleTrips, drivers, setSelectedTripId }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-ink">Trip Logs</h3>
          <p className="text-xs text-ink-3 font-medium font-sans">Recent operational history and rider fulfillments for this vehicle</p>
        </div>
        <Button variant="outline" size="sm" icon={FileText}>Generate Report</Button>
      </div>

      <Card className="overflow-hidden border border-line-2 shadow-sm">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/50 border-b border-line-2">
                <th className="px-4 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Trip ID</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Date & Pickup</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Rider</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Driver</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">Route</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-right">Cost</th>
                <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {vehicleTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-ink-4 text-sm font-semibold">
                    No trip history recorded for this vehicle.
                  </td>
                </tr>
              ) : (
                vehicleTrips.map((trip: any) => {
                  const driverObj = (drivers || []).find((d: any) => d.id === trip.driverId);
                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setSelectedTripId(trip.id)}
                      className="hover:bg-primary-tint/20 transition-colors group cursor-pointer animate-in fade-in"
                    >
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-ink-3 whitespace-nowrap">#{trip.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-ink whitespace-nowrap">
                            {new Date(trip.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-xs font-semibold text-ink">
                            Pickup: {trip.requestedPickup || new Date(trip.scheduledTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar initials={trip.rider?.initials || '?'} size="xs" />
                          <span className="text-xs font-medium text-ink whitespace-nowrap">{trip.rider?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {driverObj ? (
                          <div className="flex items-center gap-2">
                            <Avatar initials={driverObj.initials} size="xs" />
                            <span className="text-xs font-medium text-ink whitespace-nowrap">{driverObj.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-4">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                          <span className="text-xs font-semibold text-ink max-w-[120px] truncate">{trip.pickup || '---'}</span>
                          <ArrowRight size={12} className="text-ink-4 shrink-0 mx-1" />
                          <MapPin size={13} className="text-urgent shrink-0" />
                          <span className="text-xs font-semibold text-ink-2 max-w-[120px] truncate">{trip.dropoff || '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-xs text-ink">${(trip.cost || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <TripStatusBadge status={trip.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
