export type FundingSection = "general" | "eligibility" | "programRules" | "geofence" | "spaceTypes" | "pricing" | "copay" | "cancellation" | "reporting";
export interface TripReasonRule { id: string; name: string; insideAllowed: boolean; outsideAllowed: boolean; maximumMiles: number; }
export interface SpaceTypeRule { id: string; spaceType: string; billingClass: string; enabled: boolean; }
export type PricingMethod = "flat_rate" | "base_plus_mile" | "mileage_bracket";
export interface MileageBracket { id: string; from: number; to: number; amount: number; }
export interface PricingRule { id: string; name: string; billingClass: string; area: "inside" | "outside" | "both"; method: PricingMethod; flatRate: number; includedMiles: number; baseRate: number; extraMileRate: number; brackets: MileageBracket[]; }
export interface FundingSourceDraft {
  name: string; organizationType: string; programName: string; effectiveFrom: string; effectiveUntil: string; description: string; isActive: boolean;
  authorizationRequired: boolean; monthlyTripLimit: number; overrideAllowed: boolean; riderEligibilityNotes: string;
  extraStopsAllowed: boolean; companionsAllowed: boolean; maximumCompanions: number; companionCharge: number; tripReasons: TripReasonRule[];
  geofenceFileName: string; geofence: unknown | null; mileageRounding: string; billingMileageSource: string;
  spaceTypes: SpaceTypeRule[]; pricingRules: PricingRule[]; insideCopay: number; outsideCopay: number; authorizeAtBooking: boolean; captureOnCompletion: boolean;
  freeCancellationHours: number; lateCancellationPassengerCharge: number; lateCancellationFundingCharge: number; noShowPassengerCharge: number; noShowFundingCharge: number;
  reportName: string; reportFields: string[]; complaintSlaHours: number; incidentSlaHours: number;
}
