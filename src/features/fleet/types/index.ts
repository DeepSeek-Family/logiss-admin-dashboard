export interface FleetForm {
  make: string;
  model: string;
  year: string;
  plate: string;
  vin: string;
  type: string;
  seats: string;
  mileage: string;
  nextService: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
}

export const EMPTY_FLEET_FORM: FleetForm = {
  make: '', model: '', year: '', plate: '', vin: '',
  type: 'Ambulatory Van', seats: '',
  mileage: '', nextService: '',
  insuranceProvider: '', insurancePolicy: '', insuranceExpiry: '',
};

export const VEHICLE_TYPES = ['Ambulatory Van', 'Wheelchair Van', 'Stretcher Van'];

export const STATUS_CONFIG: { [key: string]: any } = {
  available: { label: 'Available', dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent-light border-accent/20' },
  in_trip: { label: 'In Trip', dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary-tint/40 border-primary/20' },
  break: { label: 'On Break', dot: 'bg-warning', text: 'text-warning-dark', bg: 'bg-warning-light border-warning/20' },
  off_duty: { label: 'Off Duty', dot: 'bg-ink-4', text: 'text-ink-4', bg: 'bg-bg border-line-2' },
  maintenance: { label: 'In Maintenance', dot: 'bg-urgent', text: 'text-urgent', bg: 'bg-urgent-light border-urgent/20' },
};

export const INSURANCE_BADGE: { [key: string]: any } = { valid: 'accent', expiring: 'warning', expired: 'urgent' };

export const TYPE_BADGE: { [key: string]: any } = {
  'Ambulatory Van': 'primary',
  'Wheelchair Van': 'accent',
  'Stretcher Van': 'warning',
};
