import type { FundingSourceDraft, MileageBracket, PricingRule, SpaceTypeRule, TripReasonRule } from "./types";
let idSeq = 0;
export const makeId = () =>
  `${Date.now()}-${(++idSeq).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const newTripReason = (): TripReasonRule => ({ id: makeId(), name: "", insideAllowed: true, outsideAllowed: false, maximumMiles: 0 });
export const newSpaceType = (): SpaceTypeRule => ({ id: makeId(), mobilityId: "", spaceType: "", billingClass: "", enabled: true });
/** New brackets start where the previous one ends and are open-ended until a "To" is typed. */
export const newBracket = (from = 0): MileageBracket => ({ id: makeId(), from, to: null, amount: 0 });
export const newPricingRule = (): PricingRule => ({ id: makeId(), name: "", billingClass: "", area: "inside", method: "flat_rate", flatRate: 0, includedMiles: 0, baseRate: 0, extraMileRate: 0, brackets: [newBracket()] });
export const emptyFundingSourceDraft: FundingSourceDraft = {
  name: "", organizationType: "county", programName: "", effectiveFrom: "", effectiveUntil: "", description: "", isActive: true,
  authorizationRequired: true, monthlyTripLimit: 0, dailyTripLimit: 0, overrideAllowed: false, riderEligibilityNotes: "", extraStopsAllowed: false, companionsAllowed: false,
  maximumCompanions: 0, companionCharge: 0, tripReasons: [newTripReason()], geofences: [], geofenceFiles: [], mileageRounding: "none", mileagePrecision: 0, billingMileageSource: "calculated_route",
  spaceTypes: [newSpaceType()], pricingRules: [newPricingRule()], insideCopay: 0, outsideCopay: 0, authorizeAtBooking: true, captureOnCompletion: true,
  freeCancellationHours: 2, lateCancellationPassengerCharge: 0, lateCancellationFundingCharge: 0, noShowPassengerCharge: 0, noShowFundingCharge: 0,
  reportName: "", reportFields: ["Passenger Name", "Authorization ID", "Trip ID", "Pickup", "Drop-off", "Mileage", "Inside/Outside", "Funding Source Charge"], complaintSlaHours: 72, incidentSlaHours: 24,
};
