import React from 'react';
import { Badge } from './Badge';

export const TripStatusBadge = ({ status, className = '' }: { status: string; className?: string }) => {
  const config: { [key: string]: any } = {
    pending_review: { variant: 'warning', label: 'Pending Review' },
    assigned: { variant: 'primary', label: 'Assigned' },
    confirmed: { variant: 'primary', label: 'Confirmed' },
    dispatched: { variant: 'solid_primary', label: 'Dispatched', dot: true },
    en_route: { variant: 'solid_primary', label: 'En Route', dot: true },
    arrived: { variant: 'warning', label: 'Arrived' },
    in_trip: { variant: 'solid_accent', label: 'In Trip', dot: true },
    completed: { variant: 'accent', label: 'Completed' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
    no_show: { variant: 'urgent', label: 'No Show' },
  };

  const { variant, label, dot } = config[status] || { variant: 'neutral', label: status };
  return <Badge variant={variant} dot={dot} className={className}>{label}</Badge>;
};
