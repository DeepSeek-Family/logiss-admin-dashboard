export type FundingSection =
  | "general"
  | "eligibility"
  | "programRules"
  | "geofence"
  | "spaceTypes"
  | "pricing"
  | "copay"
  | "cancellation"
  | "reporting";

export interface TripReasonRule {
  id: string;
  name: string;
  insideAllowed: boolean;
  outsideAllowed: boolean;
  maximumMiles: number;
}

export interface SpaceTypeRule {
  id: string;
  spaceType: string;
  billingClass: string;
  enabled: boolean;
}

/** UI + API contract methods (`base_plus_mile` / `mileage_bracket` kept as aliases). */
export type PricingMethod =
  | "flat_rate"
  | "base_plus_mile"
  | "base_plus_additional_mileage"
  | "mileage_bracket"
  | "mileage_brackets";

export type MileageRounding = "none" | "nearest" | "up" | "down";
export type MileageSource = "calculated_route" | "actual_gps" | "straight_line";

export interface MileageBracket {
  id: string;
  from: number;
  to: number;
  amount: number;
}

export interface PricingRule {
  id: string;
  name: string;
  billingClass: string;
  area: "inside" | "outside" | "both";
  method: PricingMethod;
  flatRate: number;
  includedMiles: number;
  baseRate: number;
  extraMileRate: number;
  brackets: MileageBracket[];
}

export type GeofenceGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

/** Lightweight list row — heavy coordinates must never sit in React state. */
export interface GeofenceEntry {
  id: string;
  name: string;
  geometryType: "Polygon" | "MultiPolygon";
  isActive: boolean;
  sourceFileName?: string;
}

/** File chip only — GeoJSON is sent as multipart `file` on save (server extracts fences). */
export interface GeofenceFileChip {
  id: string;
  name: string;
  sizeBytes: number;
}

export interface FundingSourceDraft {
  name: string;
  organizationType: string;
  programName: string;
  effectiveFrom: string;
  effectiveUntil: string;
  description: string;
  isActive: boolean;
  authorizationRequired: boolean;
  monthlyTripLimit: number;
  overrideAllowed: boolean;
  riderEligibilityNotes: string;
  extraStopsAllowed: boolean;
  companionsAllowed: boolean;
  maximumCompanions: number;
  companionCharge: number;
  tripReasons: TripReasonRule[];
  geofences: GeofenceEntry[];
  geofenceFiles: GeofenceFileChip[];
  mileageRounding: MileageRounding;
  billingMileageSource: MileageSource;
  spaceTypes: SpaceTypeRule[];
  pricingRules: PricingRule[];
  insideCopay: number;
  outsideCopay: number;
  authorizeAtBooking: boolean;
  captureOnCompletion: boolean;
  freeCancellationHours: number;
  lateCancellationPassengerCharge: number;
  lateCancellationFundingCharge: number;
  noShowPassengerCharge: number;
  noShowFundingCharge: number;
  reportName: string;
  reportFields: string[];
  complaintSlaHours: number;
  incidentSlaHours: number;
}
