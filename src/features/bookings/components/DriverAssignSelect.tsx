import React from 'react';
import { toast } from 'react-hot-toast';
import { suggestDrivers } from '../utils/suggestDriver';

interface DriverAssignSelectProps {
  trip: any;
  drivers: any[];
  /** All trips — used to read each candidate driver's same-day route/workload. */
  allTrips: any[];
  onAssign: (driverId: string) => void;
  className?: string;
}

/**
 * Driver picker with route-aware ranking + force-assign.
 * Ranking (availability, vehicle fit, time-overlap, route-area continuity, schedule
 * slack, mileage/workload) lives in suggestDrivers — shared with Auto-Assign and the
 * AI panel. Options show the driver name only. A flagged driver (busy / off-duty /
 * wrong vehicle) can still be picked — dispatcher override — but surfaces a warning.
 */
export const DriverAssignSelect: React.FC<DriverAssignSelectProps> = ({
  trip, drivers, allTrips, onAssign, className = '',
}) => {
  const scored = suggestDrivers(trip, drivers, allTrips);

  const handle = (id: string) => {
    onAssign(id);
    if (!id) return;
    const s = scored.find(x => String(x.driver.id) === String(id));
    if (s?.conflict) toast(`${s.driver.name} has an overlapping trip — force-assigned`, { icon: '⚠️' });
    else if (s && !s.fit) toast(`${s.driver.name}'s vehicle may not fit a ${trip.mobility} rider — assigned anyway`, { icon: '⚠️' });
    else if (s && !s.driver.onDuty) toast(`${s.driver.name} is off-duty — assigned anyway`, { icon: '⚠️' });
  };

  return (
    <select
      value={String(trip.driverId || '')}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handle(e.target.value)}
      className={className}
    >
      <option value="">Unassigned</option>
      {scored.map(s => (
        <option key={s.driver.id} value={s.driver.id}>
          {s.driver.name}
        </option>
      ))}
    </select>
  );
};
