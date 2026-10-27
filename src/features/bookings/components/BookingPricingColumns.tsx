import { money } from '@/utils/helpers';
import { formatPricingZone, zoneBadgeTone } from '@/features/bookings/utils/helpers';

type PricingRow = {
  pricingZoneLabel?: string;
  primaryPricingZone?: string;
  insideCounty?: boolean;
  billingMileage?: number;
  passengerCopay?: number;
  copay?: number;
  fundingSourceCharge?: number;
  costToCounty?: number;
  cost?: number;
};

export const BookingZoneCell = ({ row }: { row: PricingRow }) => {
  const label =
    row.pricingZoneLabel ||
    (row.primaryPricingZone ? formatPricingZone(row.primaryPricingZone) : '') ||
    (row.insideCounty === true ? 'Inside' : row.insideCounty === false ? 'Outside' : '');

  if (!label) {
    return <span className="text-xs text-ink-4">—</span>;
  }

  const toneZone = row.primaryPricingZone || label.split(':').pop()?.trim() || label;

  return (
    <span
      className={`inline-flex items-center max-w-[140px] px-2 py-0.5 rounded-full text-xs font-semibold border truncate ${zoneBadgeTone(toneZone)}`}
      title={label}
    >
      {label}
    </span>
  );
};

export const BookingMilesCell = ({ row }: { row: PricingRow }) => {
  const miles = row.billingMileage;
  if (miles == null || !Number.isFinite(miles) || miles <= 0) {
    return <span className="text-xs text-ink-4 tabular-nums">—</span>;
  }
  return (
    <span className="text-xs font-medium text-ink tabular-nums whitespace-nowrap">
      {miles.toFixed(1)}
      <span className="text-ink-4 ml-0.5">mi</span>
    </span>
  );
};

export const BookingCopayCell = ({ row }: { row: PricingRow }) => (
  <span className="text-xs font-semibold text-ink tabular-nums whitespace-nowrap">
    {money(row.passengerCopay ?? row.copay ?? 0)}
  </span>
);

export const BookingPayerChargeCell = ({ row }: { row: PricingRow }) => (
  <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
    {money(row.fundingSourceCharge ?? row.costToCounty ?? row.cost ?? 0)}
  </span>
);

export const BOOKING_PRICING_HEADERS = ['Zone', 'Miles', 'Passenger copay', 'Payer charge'] as const;
