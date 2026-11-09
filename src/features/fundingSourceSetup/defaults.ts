import type { FundingSourceDraft, MileageBracket, PricingRule, SpaceTypeRule, TripReasonRule } from "./types";
export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const newTripReason = (): TripReasonRule => ({ id: makeId(), name: "", insideAllowed: true, outsideAllowed: false, maximumMiles: 0 });
export const newSpaceType = (): SpaceTypeRule => ({ id: makeId(), spaceType: "", billingClass: "", enabled: true });
export const newBracket = (): MileageBracket => ({ id: makeId(), from: 0, to: 0, amount: 0 });
export const newPricingRule = (): PricingRule => ({ id: makeId(), name: "", billingClass: "", area: "inside", method: "flat_rate", flatRate: 0, includedMiles: 0, baseRate: 0, extraMileRate: 0, brackets: [newBracket()] });
export const emptyFundingSourceDraft: FundingSourceDraft = {
  name: "", organizationType: "county", programName: "", effectiveFrom: "", effectiveUntil: "", description: "", isActive: true,
  authorizationRequired: true, monthlyTripLimit: 0, overrideAllowed: false, riderEligibilityNotes: "", extraStopsAllowed: false, companionsAllowed: false,
  maximumCompanions: 0, companionCharge: 0, tripReasons: [newTripReason()], geofenceFileName: "", geofence: null, mileageRounding: "exact", billingMileageSource: "calculated",
  spaceTypes: [newSpaceType()], pricingRules: [newPricingRule()], insideCopay: 0, outsideCopay: 0, authorizeAtBooking: true, captureOnCompletion: true,
  freeCancellationHours: 2, lateCancellationPassengerCharge: 0, lateCancellationFundingCharge: 0, noShowPassengerCharge: 0, noShowFundingCharge: 0,
  reportName: "", reportFields: ["Passenger Name", "Authorization ID", "Trip ID", "Pickup", "Drop-off", "Mileage", "Inside/Outside", "Funding Source Charge"], complaintSlaHours: 72, incidentSlaHours: 24,
};
