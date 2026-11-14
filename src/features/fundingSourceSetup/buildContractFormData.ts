import type { PayerType } from "@/features/cms/constants/payerTypes";
import type {
  FundingSourceDraft,
  GeofenceGeometry,
  PricingMethod,
  PricingRule,
} from "./types";

export type FundingSourceOrgType =
  | "government"
  | "county"
  | "municipal"
  | "facility"
  | "private"
  | "other";

export type ApiPricingMethod =
  | "flat_rate"
  | "base_plus_additional_mileage"
  | "mileage_brackets"
  | "per_mile"
  | "mileage_based"
  | "first_x_miles";

export type ApiPriceMethod = "flat_rate" | "per_mile" | "mileage_based" | "first_x_miles";

const toApiPricingMethod = (method: PricingMethod): ApiPricingMethod => {
  if (method === "base_plus_mile" || method === "base_plus_additional_mileage") {
    return "base_plus_additional_mileage";
  }
  if (method === "mileage_bracket" || method === "mileage_brackets") {
    return "mileage_brackets";
  }
  return "flat_rate";
};

const toCountyPriceMethod = (method: ApiPricingMethod): ApiPriceMethod => {
  if (method === "base_plus_additional_mileage") return "first_x_miles";
  if (method === "mileage_brackets") return "mileage_based";
  if (method === "per_mile" || method === "mileage_based" || method === "first_x_miles") {
    return method;
  }
  return "flat_rate";
};

export const mapOrganizationToFundingSourceType = (
  organizationType: string,
): FundingSourceOrgType => {
  const value = organizationType.trim().toLowerCase();
  if (value === "county") return "county";
  if (value === "government") return "government";
  if (value === "private") return "private";
  if (value === "municipal") return "municipal";
  if (value === "facility") return "facility";
  return "other";
};

export const mapOrganizationToPayerType = (organizationType: string): PayerType => {
  const value = organizationType.trim().toLowerCase();
  if (value === "county") return "country_payer";
  if (value === "government") return "government";
  if (value === "private") return "self_pay";
  if (value === "facility") return "facility";
  return "other";
};

const chargeOutcome = (passenger: number, funding: number) => {
  if (passenger > 0 && funding > 0) return "both";
  if (passenger > 0) return "passenger_only";
  if (funding > 0) return "funding_source_only";
  return "none";
};

const mapPricingRule = (rule: PricingRule) => {
  const method = toApiPricingMethod(rule.method);
  return {
    ruleName: rule.name.trim(),
    billingClass: rule.billingClass.trim(),
    area: rule.area,
    method,
    flatRate: Number(rule.flatRate) || 0,
    includedMiles: Number(rule.includedMiles) || 0,
    baseRate: Number(rule.baseRate) || 0,
    additionalMileRate: Number(rule.extraMileRate) || 0,
    brackets: rule.brackets.map((b) => ({
      from: Number(b.from) || 0,
      to: Number(b.to) || 0,
      amount: Number(b.amount) || 0,
    })),
  };
};

/** Top-level price fields required by county Zod when priceMethod is set. */
const topLevelFromFirstRule = (rule: PricingRule) => {
  const method = toApiPricingMethod(rule.method);
  const priceMethod = toCountyPriceMethod(method);
  if (priceMethod === "flat_rate") {
    return { priceMethod, flat_rate_price: rule.flatRate ?? 0 };
  }
  if (priceMethod === "first_x_miles") {
    return {
      priceMethod,
      initial_miles: rule.includedMiles ?? 0,
      initial_charge: rule.baseRate ?? 0,
      additional_per_mile: rule.extraMileRate ?? 0,
    };
  }
  if (priceMethod === "mileage_based") {
    return {
      priceMethod,
      mileage_brackets: rule.brackets.map((b) => ({
        min_mileage: b.from,
        max_mileage: b.to,
        charge: b.amount,
      })),
    };
  }
  return {
    priceMethod,
    base_rate: rule.baseRate ?? 0,
    per_mile_rate: rule.extraMileRate ?? 0,
  };
};

export type BuildContractBodyArgs = {
  draft: FundingSourceDraft;
  payersId: string;
  fundingSourceId?: string | null;
  /** Built just-in-time on submit from the original uploaded files. */
  geofences: Array<{ name: string; geometry: GeofenceGeometry; isActive: boolean }>;
  /** When set and geofences omitted path — prefer raw file upload for large JSON. */
  geofenceFile?: File | null;
};

/** JSON body shape for County create/update (contract sections). */
export const buildCountyContractBody = ({
  draft,
  payersId,
  fundingSourceId,
  geofences,
}: BuildContractBodyArgs): Record<string, unknown> => {
  const pricingRules = draft.pricingRules
    .filter((r) => r.name.trim() && r.billingClass.trim())
    .map(mapPricingRule);

  const firstRule = draft.pricingRules.find((r) => r.name.trim() && r.billingClass.trim());
  const topLevel = firstRule
    ? topLevelFromFirstRule(firstRule)
    : { priceMethod: "flat_rate" as const, flat_rate_price: 0 };

  const body: Record<string, unknown> = {
    payersId,
    name: draft.name.trim(),
    organizationType: draft.organizationType,
    programName: draft.programName.trim() || undefined,
    description: draft.description.trim() || undefined,
    effectiveFrom: draft.effectiveFrom || undefined,
    effectiveTo: draft.effectiveUntil || undefined,
    isActive: draft.isActive,
    ...topLevel,
    geofences,
    eligibility: {
      authorizationIdRequired: draft.authorizationRequired,
      monthlyTripLimit: draft.monthlyTripLimit,
      allowAdminOverride: draft.overrideAllowed,
      eligibilityNotes: draft.riderEligibilityNotes.trim() || undefined,
    },
    programRules: {
      extraStopsAllowed: draft.extraStopsAllowed,
      companionsAllowed: draft.companionsAllowed,
      maximumCompanions: draft.maximumCompanions,
      companionCharge: draft.companionCharge,
      tripReasons: draft.tripReasons
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name.trim(),
          inside: r.insideAllowed ? "allowed" : "blocked",
          outside: r.outsideAllowed ? "allowed" : "blocked",
          maxMiles: r.maximumMiles > 0 ? r.maximumMiles : null,
        })),
    },
    mileageRounding: draft.mileageRounding,
    mileageSource: draft.billingMileageSource,
    mobilityBillingMap: draft.spaceTypes
      .filter((r) => r.spaceType.trim() && r.billingClass.trim())
      .map((r) => ({
        spaceType: r.spaceType.trim(),
        billingClass: r.billingClass.trim(),
        status: r.enabled ? "enabled" : "disabled",
      })),
    pricingRules,
    passengerCopayInside: draft.insideCopay,
    passengerCopayOutside: draft.outsideCopay,
    authorizeCopayAtBooking: draft.authorizeAtBooking,
    captureCopayAfterCompletedTrip: draft.captureOnCompletion,
    cancellationNoShow: {
      freeCancellationWindowHours: draft.freeCancellationHours,
      lateCancellationPassenger: draft.lateCancellationPassengerCharge,
      lateCancellationFundingSource: draft.lateCancellationFundingCharge,
      noShowPassenger: draft.noShowPassengerCharge,
      noShowFundingSource: draft.noShowFundingCharge,
    },
    chargeRules: {
      cancellation: chargeOutcome(
        draft.lateCancellationPassengerCharge,
        draft.lateCancellationFundingCharge,
      ),
      noShow: chargeOutcome(draft.noShowPassengerCharge, draft.noShowFundingCharge),
    },
    reporting: {
      templateName: draft.reportName.trim() || undefined,
      columns: draft.reportFields,
      complaintResponseDeadlineHours: draft.complaintSlaHours,
      safetyIncidentReportingDeadlineHours: draft.incidentSlaHours,
    },
  };

  if (fundingSourceId) body.fundingSourceId = fundingSourceId;

  return body;
};

/** Multipart FormData for POST/PATCH /counties (parseCountyUpload reads `data` + optional `file`). */
export const buildCountyContractFormData = (args: BuildContractBodyArgs): FormData => {
  const body = buildCountyContractBody(args);
  const formData = new FormData();

  // Always send numeric price fields as real numbers inside JSON `data`
  // (FormData string fields were dropping / failing Zod when priceMethod=flat_rate).
  const firstRule = args.draft.pricingRules.find((r) => r.name.trim() && r.billingClass.trim());
  const priceMethod = String(body.priceMethod || "flat_rate");
  const payload: Record<string, unknown> = {
    ...body,
    priceMethod,
  };

  if (priceMethod === "flat_rate") {
    const flat =
      Number(body.flat_rate_price) ||
      Number(firstRule?.flatRate) ||
      0;
    payload.flat_rate_price = flat;
  } else if (priceMethod === "first_x_miles") {
    payload.initial_miles = Number(body.initial_miles ?? firstRule?.includedMiles) || 0;
    payload.initial_charge = Number(body.initial_charge ?? firstRule?.baseRate) || 0;
    payload.additional_per_mile = Number(body.additional_per_mile ?? firstRule?.extraMileRate) || 0;
  } else if (priceMethod === "mileage_based") {
    payload.mileage_brackets =
      body.mileage_brackets ??
      firstRule?.brackets?.map((b) => ({
        min_mileage: b.from,
        max_mileage: b.to,
        charge: b.amount,
      })) ??
      [];
  } else if (priceMethod === "per_mile") {
    payload.base_rate = Number(body.base_rate ?? firstRule?.baseRate) || 0;
    payload.per_mile_rate = Number(body.per_mile_rate ?? firstRule?.extraMileRate) || 0;
  }

  const useFile = Boolean(args.geofenceFile) && (!args.geofences || args.geofences.length === 0);
  if (useFile) {
    delete payload.geofences;
  } else if (!Array.isArray(payload.geofences) || (payload.geofences as unknown[]).length === 0) {
    delete payload.geofences;
  }

  // Drop undefined keys so parseCountyUpload does not keep junk.
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  formData.append("data", JSON.stringify(payload));
  if (useFile && args.geofenceFile) {
    formData.append("file", args.geofenceFile);
  }

  return formData;
};
