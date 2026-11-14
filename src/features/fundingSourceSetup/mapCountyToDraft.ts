import { countyPayerId, type ICounty } from "@/redux/api/coverageApi";
import {
  emptyFundingSourceDraft,
  makeId,
  newBracket,
  newPricingRule,
  newSpaceType,
  newTripReason,
} from "./defaults";
import type {
  FundingSourceDraft,
  GeofenceEntry,
  GeofenceGeometry,
  MileageRounding,
  MileageSource,
  PricingMethod,
  PricingRule,
  SpaceTypeRule,
  TripReasonRule,
} from "./types";

export type ExistingGeofence = {
  name: string;
  geometry: GeofenceGeometry;
  isActive: boolean;
};

const ymd = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const asPricingMethod = (method?: string): PricingMethod => {
  const value = String(method || "").toLowerCase();
  if (value === "base_plus_additional_mileage" || value === "base_plus_mile") {
    return "base_plus_additional_mileage";
  }
  if (value === "mileage_brackets" || value === "mileage_bracket" || value === "mileage_based") {
    return "mileage_brackets";
  }
  return "flat_rate";
};

const mapTripReasons = (county: ICounty): TripReasonRule[] => {
  const rows = county.programRules?.tripReasons || [];
  if (!rows.length) return [newTripReason()];
  return rows.map((r) => ({
    id: makeId(),
    name: r.name || "",
    insideAllowed: r.inside !== "blocked",
    outsideAllowed: r.outside !== "blocked",
    maximumMiles: Number(r.maxMiles) || 0,
  }));
};

const mapSpaceTypes = (county: ICounty): SpaceTypeRule[] => {
  const rows = county.mobilityBillingMap || [];
  if (!rows.length) return [newSpaceType()];
  return rows.map((r) => ({
    id: makeId(),
    spaceType: String(r.spaceType || "").trim(),
    billingClass: String(r.billingClass || "").trim(),
    enabled: r.status !== "disabled",
  }));
};

const mapPricingRules = (county: ICounty): PricingRule[] => {
  const rows = county.pricingRules || [];
  if (rows.length) {
    return rows.map((r) => ({
      id: makeId(),
      name: r.ruleName || "",
      billingClass: r.billingClass || "",
      area: r.area === "outside" || r.area === "both" ? r.area : "inside",
      method: asPricingMethod(r.method),
      flatRate: Number(r.flatRate) || 0,
      includedMiles: Number(r.includedMiles) || 0,
      baseRate: Number(r.baseRate) || 0,
      extraMileRate: Number(r.additionalMileRate) || 0,
      brackets: (r.brackets || []).length
        ? (r.brackets || []).map((b) => ({
            id: makeId(),
            from: Number(b.from) || 0,
            to: Number(b.to) || 0,
            amount: Number(b.amount) || 0,
          }))
        : [newBracket()],
    }));
  }
  return [newPricingRule()];
};

const mapGeofenceEntries = (county: ICounty): GeofenceEntry[] =>
  (county.geofences || []).map((g, index) => ({
    id: makeId(),
    name: g.name?.trim() || `Geofence ${index + 1}`,
    geometryType:
      g.geometry?.type === "MultiPolygon" ? "MultiPolygon" : "Polygon",
    isActive: g.isActive !== false,
  }));

export const extractExistingGeofences = (county: ICounty): ExistingGeofence[] =>
  (county.geofences || [])
    .filter((g) => g.geometry && (g.geometry.type === "Polygon" || g.geometry.type === "MultiPolygon"))
    .map((g, index) => ({
      name: g.name?.trim() || `Geofence ${index + 1}`,
      geometry: {
        type: g.geometry!.type as "Polygon" | "MultiPolygon",
        coordinates: g.geometry!.coordinates,
      },
      isActive: g.isActive !== false,
    }));

export const resolveCountyPayersId = (county: ICounty): string => countyPayerId(county);

export const resolveCountyFundingSourceId = (county: ICounty): string => {
  const raw = county.fundingSourceId;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return String(raw._id || "");
};

export const mapCountyToDraft = (county: ICounty): FundingSourceDraft => {
  const cancel = county.cancellationNoShow;
  const eligibility = county.eligibility;
  const program = county.programRules;
  const reporting = county.reporting;

  return {
    ...emptyFundingSourceDraft,
    name: county.name?.trim() || "",
    organizationType: county.organizationType || "county",
    programName: county.programName || "",
    effectiveFrom: ymd(county.effectiveFrom),
    effectiveUntil: ymd(county.effectiveTo),
    description: county.description || "",
    isActive: county.isActive !== false,
    authorizationRequired: eligibility?.authorizationIdRequired !== false,
    monthlyTripLimit: Number(eligibility?.monthlyTripLimit) || 0,
    overrideAllowed: Boolean(eligibility?.allowAdminOverride),
    riderEligibilityNotes: eligibility?.eligibilityNotes || "",
    extraStopsAllowed: Boolean(program?.extraStopsAllowed),
    companionsAllowed: Boolean(program?.companionsAllowed),
    maximumCompanions: Number(program?.maximumCompanions) || 0,
    companionCharge: Number(program?.companionCharge) || 0,
    tripReasons: mapTripReasons(county),
    geofences: mapGeofenceEntries(county),
    geofenceFiles: [],
    mileageRounding: (county.mileageRounding as MileageRounding) || "none",
    billingMileageSource: (county.mileageSource as MileageSource) || "calculated_route",
    spaceTypes: mapSpaceTypes(county),
    pricingRules: mapPricingRules(county),
    insideCopay: Number(county.passengerCopayInside) || 0,
    outsideCopay: Number(county.passengerCopayOutside) || 0,
    authorizeAtBooking: county.authorizeCopayAtBooking !== false,
    captureOnCompletion: county.captureCopayAfterCompletedTrip !== false,
    freeCancellationHours: Number(cancel?.freeCancellationWindowHours) || 0,
    lateCancellationPassengerCharge: Number(cancel?.lateCancellationPassenger) || 0,
    lateCancellationFundingCharge: Number(cancel?.lateCancellationFundingSource) || 0,
    noShowPassengerCharge: Number(cancel?.noShowPassenger) || 0,
    noShowFundingCharge: Number(cancel?.noShowFundingSource) || 0,
    reportName: reporting?.templateName || "",
    reportFields: reporting?.columns?.length
      ? [...reporting.columns]
      : [...emptyFundingSourceDraft.reportFields],
    complaintSlaHours: Number(reporting?.complaintResponseDeadlineHours) || 72,
    incidentSlaHours: Number(reporting?.safetyIncidentReportingDeadlineHours) || 24,
  };
};
