import {
  Component,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Accessibility,
  Banknote,
  CalendarRange,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  FileBarChart,
  Loader2,
  MapPinned,
  Plus,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, Card } from "@/shared/components/ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";
import {
  useCreatePayerMutation,
  useCreateCountyContractMutation,
  useGetCountyByIdQuery,
  useUpdateCountyContractMutation,
  unwrapCounty,
} from "@/redux/api/coverageApi";
import {
  useCreateFundingSourceMutation,
  useUpdateFundingSourceMutation,
} from "@/redux/api/fundingSourcesApi";
import {
  buildCountyContractFormData,
  mapOrganizationToFundingSourceType,
  mapOrganizationToPayerType,
} from "./buildContractFormData";
import {
  emptyFundingSourceDraft,
  newBracket,
  newPricingRule,
  newSpaceType,
  newTripReason,
} from "./defaults";
import { GeofenceUploadField, mergeGeoJsonFiles } from "./GeofenceUploadField";
import {
  extractExistingGeofences,
  mapCountyToDraft,
  resolveCountyFundingSourceId,
  resolveCountyPayersId,
  type ExistingGeofence,
} from "./mapCountyToDraft";
import type {
  FundingSection,
  FundingSourceDraft,
  MileageRounding,
  MileageSource,
  PricingRule,
  SpaceTypeRule,
  TripReasonRule,
} from "./types";

const input =
  "mt-1.5 h-10 w-full rounded-xl border border-line-2 bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const sections: {
  id: FundingSection;
  label: string;
  description: string;
  icon: typeof Settings2;
}[] = [
  {
    id: "general",
    label: "General information",
    description: "Identify the funding organization and define when its contract is active.",
    icon: Settings2,
  },
  {
    id: "eligibility",
    label: "Rider eligibility",
    description: "Control authorization, monthly usage limits and administrative exceptions.",
    icon: Users,
  },
  {
    id: "programRules",
    label: "Transportation program rules",
    description:
      "Define allowed trip purposes, service-area permissions, mileage limits, stops and companions.",
    icon: ClipboardCheck,
  },
  {
    id: "geofence",
    label: "Service area and mileage",
    description:
      "Upload one or more GeoJSON files (multiple OK). EPSG:2284 Chesterfield exports auto-convert to WGS84 on save; each Feature becomes a named fence.",
    icon: MapPinned,
  },
  {
    id: "spaceTypes",
    label: "Mobility needs and billing classes",
    description: "Map each rider mobility requirement to the contract class used for billing.",
    icon: Accessibility,
  },
  {
    id: "pricing",
    label: "Funding source pricing",
    description: "Create one or more inside/outside pricing rules for each billing class.",
    icon: Banknote,
  },
  {
    id: "copay",
    label: "Passenger copay",
    description:
      "Keep the passenger payment separate from the amount billed to the funding source.",
    icon: CircleDollarSign,
  },
  {
    id: "cancellation",
    label: "Cancellation and no-show charges",
    description:
      "Configure free-cancellation timing and separate passenger and funding-source charges.",
    icon: CalendarRange,
  },
  {
    id: "reporting",
    label: "Reporting and service deadlines",
    description: "Choose report columns and set complaint and safety-incident response deadlines.",
    icon: FileBarChart,
  },
];

const Toggle = ({
  on,
  setOn,
  label,
  note,
}: {
  on: boolean;
  setOn: (v: boolean) => void;
  label: string;
  note?: string;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-line-2 bg-bg/40 px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      {note && <p className="mt-0.5 text-xs text-ink-4">{note}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);
const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <label className="block text-sm font-medium text-ink-2">
    {label}
    <input
      className={input}
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

const firstErrorSection = (next: Record<string, string>): FundingSection => {
  if (next.name || next.effectiveFrom) return "general";
  if (next.tripReasons) return "programRules";
  if (next.geofences) return "geofence";
  if (next.spaceTypes) return "spaceTypes";
  if (next.pricing) return "pricing";
  return "general";
};

class SetupErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[FundingSourceSetup] render crash", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-urgent/30 bg-urgent/5 p-6">
          <h2 className="text-base font-semibold text-urgent">Page crashed while rendering</h2>
          <p className="mt-2 text-sm text-ink-2 whitespace-pre-wrap">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const FundingSourceSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = (searchParams.get("id") || "").trim();
  const isEdit = Boolean(editId);

  const {
    data: countyResponse,
    isLoading: countyLoading,
    isError: countyError,
    error: countyErr,
  } = useGetCountyByIdQuery(editId, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [draft, setDraft] = useState<FundingSourceDraft>(() => ({
    ...emptyFundingSourceDraft,
    tripReasons: [newTripReason()],
    spaceTypes: [newSpaceType()],
    pricingRules: [newPricingRule()],
    reportFields: [...emptyFundingSourceDraft.reportFields],
    geofences: [],
    geofenceFiles: [],
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reportFieldDraft, setReportFieldDraft] = useState("");
  const [editHydrated, setEditHydrated] = useState(false);
  /** Parent keeps files in a ref so the giant form does not rebuild on every pick. */
  const uploadedFilesRef = useRef<File[]>([]);
  const existingGeofencesRef = useRef<ExistingGeofence[]>([]);
  const editMetaRef = useRef<{ payersId: string; fundingSourceId: string }>({
    payersId: "",
    fundingSourceId: "",
  });
  const [createPayer] = useCreatePayerMutation();
  const [createFundingSource] = useCreateFundingSourceMutation();
  const [updateFundingSource] = useUpdateFundingSourceMutation();
  const [createCountyContract] = useCreateCountyContractMutation();
  const [updateCountyContract] = useUpdateCountyContractMutation();

  useEffect(() => {
    if (!isEdit) {
      setEditHydrated(false);
      existingGeofencesRef.current = [];
      editMetaRef.current = { payersId: "", fundingSourceId: "" };
      return;
    }
    const county = countyResponse?.data;
    if (!county?._id) return;
    setDraft(mapCountyToDraft(county));
    existingGeofencesRef.current = extractExistingGeofences(county);
    editMetaRef.current = {
      payersId: resolveCountyPayersId(county),
      fundingSourceId: resolveCountyFundingSourceId(county),
    };
    uploadedFilesRef.current = [];
    setEditHydrated(true);
  }, [isEdit, countyResponse?.data]);

  const set = <K extends keyof FundingSourceDraft>(key: K, value: FundingSourceDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Funding Source name is required";
    if (!draft.effectiveFrom) next.effectiveFrom = "Effective date is required";
    if (!draft.tripReasons.some((r) => r.name.trim()))
      next.tripReasons = "Add at least one trip reason";
    if (!draft.spaceTypes.some((r) => r.spaceType.trim() && r.billingClass.trim()))
      next.spaceTypes = "Add at least one mapping";
    if (!draft.pricingRules.some((r) => r.name.trim() && r.billingClass.trim()))
      next.pricing = "Add at least one pricing rule";
    const hasNewFiles = uploadedFilesRef.current.length > 0;
    const hasExistingFences = existingGeofencesRef.current.length > 0;
    if (!hasNewFiles && !(isEdit && hasExistingFences)) {
      next.geofences = "Upload at least one GeoJSON geofence file";
    }
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) {
      toast.error("Complete the required configuration");
      const section = firstErrorSection(next);
      window.requestAnimationFrame(() =>
        document
          .querySelector(`[data-funding-section='${section}']`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
      return;
    }

    setSaving(true);
    try {
      let geofenceFile: File | null = null;
      let geofences = existingGeofencesRef.current;
      if (hasNewFiles) {
        geofenceFile = await mergeGeoJsonFiles(uploadedFilesRef.current);
        if (!geofenceFile) {
          setErrors((e) => ({ ...e, geofences: "Upload at least one GeoJSON geofence file" }));
          toast.error("Geofence file is missing — please re-upload");
          setSaving(false);
          return;
        }
        geofences = [];
      }

      if (isEdit && editId) {
        const payersId = editMetaRef.current.payersId;
        if (!payersId) throw new Error("This county is missing payersId — cannot update");
        const fundingSourceId = editMetaRef.current.fundingSourceId || undefined;
        const formData = buildCountyContractFormData({
          draft,
          payersId,
          fundingSourceId,
          geofences,
          geofenceFile,
        });
        await updateCountyContract({ id: editId, formData, payersId }).unwrap();
        if (fundingSourceId) {
          try {
            await updateFundingSource({
              id: fundingSourceId,
              body: {
                name: draft.name.trim(),
                type: mapOrganizationToFundingSourceType(draft.organizationType),
                programName: draft.programName.trim() || undefined,
                description: draft.description.trim() || undefined,
                effectiveFrom: draft.effectiveFrom || undefined,
                effectiveUntil: draft.effectiveUntil || undefined,
                status: draft.isActive,
                defaultCountyId: editId,
              },
            }).unwrap();
          } catch {
            /* county PATCH succeeded; FS sync is best-effort */
          }
        }
        toast.success(`${draft.name.trim()} contract updated`);
        navigate(ROUTES.fundingSources);
        return;
      }

      const payerRes = await createPayer({
        name: draft.name.trim(),
        type: mapOrganizationToPayerType(draft.organizationType),
        isActive: draft.isActive,
      }).unwrap();
      const payersId = payerRes.data?._id;
      if (!payersId) throw new Error("Payer was created but no id was returned");

      const fsRes = await createFundingSource({
        name: draft.name.trim(),
        type: mapOrganizationToFundingSourceType(draft.organizationType),
        programName: draft.programName.trim() || undefined,
        description: draft.description.trim() || undefined,
        effectiveFrom: draft.effectiveFrom || undefined,
        effectiveUntil: draft.effectiveUntil || undefined,
        status: draft.isActive,
      }).unwrap();
      const fundingSourceId = fsRes.data?._id;

      const formData = buildCountyContractFormData({
        draft,
        payersId,
        fundingSourceId,
        geofences: [],
        geofenceFile,
      });
      const countyRes = await createCountyContract({ formData, payersId }).unwrap();
      const county = unwrapCounty(countyRes);
      const countyId = county?._id;

      if (fundingSourceId && countyId) {
        try {
          await updateFundingSource({
            id: fundingSourceId,
            body: { defaultCountyId: countyId },
          }).unwrap();
        } catch {
          /* contract exists; linking defaultCountyId is best-effort */
        }
      }

      toast.success(`${draft.name.trim()} contract created`);
      navigate(ROUTES.fundingSources);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : apiErrorMessage(
              err,
              isEdit
                ? "Could not update Funding Source Contract"
                : "Could not create Funding Source Contract",
            );
      setFormError(message);
      if (/WGS84|CRS|GeoJSON|Feature/i.test(message)) {
        setErrors((e) => ({ ...e, geofences: message }));
        window.requestAnimationFrame(() =>
          document
            .querySelector("[data-funding-section='geofence']")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  const updateReason = (id: string, patch: Partial<TripReasonRule>) =>
    set(
      "tripReasons",
      draft.tripReasons.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  const updateSpace = (id: string, patch: Partial<SpaceTypeRule>) =>
    set(
      "spaceTypes",
      draft.spaceTypes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  const updatePricing = (id: string, patch: Partial<PricingRule>) =>
    set(
      "pricingRules",
      draft.pricingRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const general = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <label className="block text-sm font-medium md:col-span-2">
        Funding Source name *
        <input
          className={input}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Chesterfield County"
        />
        {errors.name && <p className="mt-1 text-xs text-urgent">{errors.name}</p>}
      </label>
      <label className="block text-sm font-medium">
        Organization type
        <select
          className={input}
          value={draft.organizationType}
          onChange={(e) => set("organizationType", e.target.value)}
        >
          <option value="county">County government</option>
          <option value="government">Government program</option>
          <option value="private">Private pay</option>
          <option value="other">Other contract</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Program / contract name
        <input
          className={input}
          value={draft.programName}
          onChange={(e) => set("programName", e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium">
        Effective from *
        <input
          className={input}
          type="date"
          value={draft.effectiveFrom}
          onChange={(e) => set("effectiveFrom", e.target.value)}
        />
        {errors.effectiveFrom && <p className="mt-1 text-xs text-urgent">{errors.effectiveFrom}</p>}
      </label>
      <label className="block text-sm font-medium">
        Effective until
        <input
          className={input}
          type="date"
          value={draft.effectiveUntil}
          onChange={(e) => set("effectiveUntil", e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium md:col-span-2">
        Description
        <textarea
          className={`${input} h-24 py-2.5`}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <div className="md:col-span-2">
        <Toggle
          on={draft.isActive}
          setOn={(v) => set("isActive", v)}
          label="Active Funding Source"
        />
      </div>
    </div>
  );
  const eligibility = (
    <div className="space-y-4">
      <Toggle
        on={draft.authorizationRequired}
        setOn={(v) => set("authorizationRequired", v)}
        label="Authorization ID required"
        note="Block bookings without an active authorization."
      />
      <NumberField
        label="Monthly trip limit (0 = unlimited)"
        value={draft.monthlyTripLimit}
        onChange={(v) => set("monthlyTripLimit", v)}
      />
      <Toggle
        on={draft.overrideAllowed}
        setOn={(v) => set("overrideAllowed", v)}
        label="Allow Admin override"
        note="Require a reason and retain the original violation."
      />
      <label className="block text-sm font-medium">
        Eligibility notes
        <textarea
          className={`${input} h-24 py-2.5`}
          value={draft.riderEligibilityNotes}
          onChange={(e) => set("riderEligibilityNotes", e.target.value)}
        />
      </label>
    </div>
  );
  const programRules = (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Toggle
          on={draft.extraStopsAllowed}
          setOn={(v) => set("extraStopsAllowed", v)}
          label="Extra stops allowed"
        />
        <Toggle
          on={draft.companionsAllowed}
          setOn={(v) => set("companionsAllowed", v)}
          label="Companions allowed"
        />
        {draft.companionsAllowed && (
          <>
            <NumberField
              label="Maximum companions"
              value={draft.maximumCompanions}
              onChange={(v) => set("maximumCompanions", v)}
            />
            <NumberField
              label="Companion charge"
              value={draft.companionCharge}
              onChange={(v) => set("companionCharge", v)}
            />
          </>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Trip reason rules</h3>
          <p className="text-xs text-ink-4">Inside/outside permission and mileage limits.</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => set("tripReasons", [...draft.tripReasons, newTripReason()])}
        >
          <Plus size={14} /> Add reason
        </Button>
      </div>
      {errors.tripReasons && <p className="text-xs text-urgent">{errors.tripReasons}</p>}
      {draft.tripReasons.map((r) => (
        <div
          key={r.id}
          className="grid gap-3 rounded-xl border border-line-2 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
        >
          <input
            className={input}
            value={r.name}
            onChange={(e) => updateReason(r.id, { name: e.target.value })}
            placeholder="Medical, Work…"
          />
          <label className="text-xs font-medium">
            Inside
            <select
              className={input}
              value={String(r.insideAllowed)}
              onChange={(e) => updateReason(r.id, { insideAllowed: e.target.value === "true" })}
            >
              <option value="true">Allowed</option>
              <option value="false">Blocked</option>
            </select>
          </label>
          <label className="text-xs font-medium">
            Outside
            <select
              className={input}
              value={String(r.outsideAllowed)}
              onChange={(e) => updateReason(r.id, { outsideAllowed: e.target.value === "true" })}
            >
              <option value="true">Allowed</option>
              <option value="false">Blocked</option>
            </select>
          </label>
          <NumberField
            label="Max miles"
            value={r.maximumMiles}
            onChange={(v) => updateReason(r.id, { maximumMiles: v })}
          />
          <button
            aria-label="Remove reason"
            onClick={() =>
              set(
                "tripReasons",
                draft.tripReasons.filter((x) => x.id !== r.id),
              )
            }
            className="mt-6 h-10 p-2 text-urgent"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
  const geofence = (
    <div className="space-y-5">
      {isEdit && draft.geofences.length > 0 ? (
        <div className="rounded-xl border border-line-2 bg-bg/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-4">
            Current geofences ({draft.geofences.length})
          </p>
          <ul className="mt-2 space-y-1">
            {draft.geofences.map((g) => (
              <li key={g.id} className="text-sm text-ink">
                {g.name}
                <span className="ml-2 text-xs text-ink-4">
                  {g.geometryType}
                  {g.isActive ? "" : " · inactive"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-4">
            Upload a new GeoJSON only if you want to replace these fences.
          </p>
        </div>
      ) : null}
      <GeofenceUploadField
        onFilesChange={(files) => {
          uploadedFilesRef.current = files;
        }}
      />
      {errors.geofences && <p className="text-xs text-urgent">{errors.geofences}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Mileage rounding
          <select
            className={input}
            value={draft.mileageRounding}
            onChange={(e) => set("mileageRounding", e.target.value as MileageRounding)}
          >
            <option value="none">None (exact)</option>
            <option value="nearest">Nearest</option>
            <option value="up">Always round up</option>
            <option value="down">Always round down</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Billing mileage source
          <select
            className={input}
            value={draft.billingMileageSource}
            onChange={(e) => set("billingMileageSource", e.target.value as MileageSource)}
          >
            <option value="calculated_route">Calculated route mileage</option>
            <option value="actual_gps">Actual driver GPS mileage</option>
            <option value="straight_line">Straight-line mileage</option>
          </select>
        </label>
      </div>
    </div>
  );
  const spaceTypes = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => set("spaceTypes", [...draft.spaceTypes, newSpaceType()])}
        >
          <Plus size={14} /> Add mapping
        </Button>
      </div>
      {errors.spaceTypes && <p className="text-xs text-urgent">{errors.spaceTypes}</p>}
      {draft.spaceTypes.map((r) => (
        <div
          key={r.id}
          className="grid gap-3 rounded-xl border border-line-2 p-4 md:grid-cols-[1fr_1fr_160px_auto]"
        >
          <label className="text-xs font-medium">
            Space Type
            <input
              className={input}
              value={r.spaceType}
              onChange={(e) => updateSpace(r.id, { spaceType: e.target.value })}
              placeholder="Walker, WAV…"
            />
          </label>
          <label className="text-xs font-medium">
            Billing Class
            <input
              className={input}
              value={r.billingClass}
              onChange={(e) => updateSpace(r.id, { billingClass: e.target.value })}
              placeholder="AMB, WAV…"
            />
          </label>
          <label className="text-xs font-medium">
            Status
            <select
              className={input}
              value={String(r.enabled)}
              onChange={(e) => updateSpace(r.id, { enabled: e.target.value === "true" })}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <button
            aria-label="Remove mapping"
            onClick={() =>
              set(
                "spaceTypes",
                draft.spaceTypes.filter((x) => x.id !== r.id),
              )
            }
            className="mt-6 h-10 p-2 text-urgent"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
  const pricing = (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => set("pricingRules", [...draft.pricingRules, newPricingRule()])}
        >
          <Plus size={14} /> Add pricing rule
        </Button>
      </div>
      {errors.pricing && <p className="text-xs text-urgent">{errors.pricing}</p>}
      {draft.pricingRules.map((r) => (
        <div key={r.id} className="space-y-4 rounded-xl border border-line-2 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-xs font-medium">
              Rule name
              <input
                className={input}
                value={r.name}
                onChange={(e) => updatePricing(r.id, { name: e.target.value })}
              />
            </label>
            <label className="text-xs font-medium">
              Billing Class
              <input
                className={input}
                value={r.billingClass}
                onChange={(e) => updatePricing(r.id, { billingClass: e.target.value })}
              />
            </label>
            <label className="text-xs font-medium">
              Area
              <select
                className={input}
                value={r.area}
                onChange={(e) =>
                  updatePricing(r.id, { area: e.target.value as PricingRule["area"] })
                }
              >
                <option value="inside">Inside</option>
                <option value="outside">Outside</option>
                <option value="both">Both</option>
              </select>
            </label>
            <label className="text-xs font-medium">
              Method
              <select
                className={input}
                value={
                  r.method === "base_plus_additional_mileage"
                    ? "base_plus_mile"
                    : r.method === "mileage_brackets"
                      ? "mileage_bracket"
                      : r.method
                }
                onChange={(e) =>
                  updatePricing(r.id, { method: e.target.value as PricingRule["method"] })
                }
              >
                <option value="flat_rate">Flat rate</option>
                <option value="base_plus_mile">Base + additional mileage</option>
                <option value="mileage_bracket">Mileage brackets</option>
              </select>
            </label>
          </div>
          {r.method === "flat_rate" && (
            <NumberField
              label="Flat rate"
              value={r.flatRate}
              onChange={(v) => updatePricing(r.id, { flatRate: v })}
            />
          )}
          {(r.method === "base_plus_mile" || r.method === "base_plus_additional_mileage") && (
            <div className="grid gap-3 md:grid-cols-3">
              <NumberField
                label="Included miles"
                value={r.includedMiles}
                onChange={(v) => updatePricing(r.id, { includedMiles: v })}
              />
              <NumberField
                label="Base rate"
                value={r.baseRate}
                onChange={(v) => updatePricing(r.id, { baseRate: v })}
              />
              <NumberField
                label="Additional-mile rate"
                value={r.extraMileRate}
                onChange={(v) => updatePricing(r.id, { extraMileRate: v })}
              />
            </div>
          )}
          {(r.method === "mileage_bracket" || r.method === "mileage_brackets") && (
            <div className="space-y-2">
              {r.brackets.map((b) => (
                <div key={b.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <input
                    aria-label="From mileage"
                    className={input}
                    type="number"
                    value={b.from}
                    onChange={(e) =>
                      updatePricing(r.id, {
                        brackets: r.brackets.map((x) =>
                          x.id === b.id ? { ...x, from: Number(e.target.value) } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label="To mileage"
                    className={input}
                    type="number"
                    value={b.to}
                    onChange={(e) =>
                      updatePricing(r.id, {
                        brackets: r.brackets.map((x) =>
                          x.id === b.id ? { ...x, to: Number(e.target.value) } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label="Bracket amount"
                    className={input}
                    type="number"
                    value={b.amount}
                    onChange={(e) =>
                      updatePricing(r.id, {
                        brackets: r.brackets.map((x) =>
                          x.id === b.id ? { ...x, amount: Number(e.target.value) } : x,
                        ),
                      })
                    }
                  />
                  <button
                    aria-label="Remove bracket"
                    onClick={() =>
                      updatePricing(r.id, { brackets: r.brackets.filter((x) => x.id !== b.id) })
                    }
                    className="mt-1 p-2 text-urgent"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => updatePricing(r.id, { brackets: [...r.brackets, newBracket()] })}
              >
                <Plus size={13} /> Add bracket
              </Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-urgent"
              onClick={() =>
                set(
                  "pricingRules",
                  draft.pricingRules.filter((x) => x.id !== r.id),
                )
              }
            >
              <Trash2 size={14} /> Remove rule
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
  const copay = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          label="Inside passenger copay"
          value={draft.insideCopay}
          onChange={(v) => set("insideCopay", v)}
        />
        <NumberField
          label="Outside passenger copay"
          value={draft.outsideCopay}
          onChange={(v) => set("outsideCopay", v)}
        />
      </div>
      <Toggle
        on={draft.authorizeAtBooking}
        setOn={(v) => set("authorizeAtBooking", v)}
        label="Authorize copay at booking"
      />
      <Toggle
        on={draft.captureOnCompletion}
        setOn={(v) => set("captureOnCompletion", v)}
        label="Automatically capture after completed trip"
      />
    </div>
  );
  const cancellation = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumberField
        label="Free cancellation window (hours)"
        value={draft.freeCancellationHours}
        onChange={(v) => set("freeCancellationHours", v)}
      />
      <div />
      <NumberField
        label="Late cancellation — passenger"
        value={draft.lateCancellationPassengerCharge}
        onChange={(v) => set("lateCancellationPassengerCharge", v)}
      />
      <NumberField
        label="Late cancellation — Funding Source"
        value={draft.lateCancellationFundingCharge}
        onChange={(v) => set("lateCancellationFundingCharge", v)}
      />
      <NumberField
        label="No-show — passenger"
        value={draft.noShowPassengerCharge}
        onChange={(v) => set("noShowPassengerCharge", v)}
      />
      <NumberField
        label="No-show — Funding Source"
        value={draft.noShowFundingCharge}
        onChange={(v) => set("noShowFundingCharge", v)}
      />
    </div>
  );
  const reporting = (
    <div className="space-y-5">
      <label className="block text-sm font-medium">
        Report template name
        <input
          className={input}
          value={draft.reportName}
          onChange={(e) => set("reportName", e.target.value)}
          placeholder="For example, Chesterfield Monthly Transportation Report"
        />
      </label>
      <div>
        <p className="text-sm font-semibold">Columns included in the exported report</p>
        <div className="mt-2 flex gap-2">
          <input
            className={input}
            value={reportFieldDraft}
            onChange={(e) => setReportFieldDraft(e.target.value)}
            placeholder="Enter a column name, such as Driver Name"
          />
          <Button
            variant="outline"
            onClick={() => {
              const value = reportFieldDraft.trim();
              if (!value) return;
              set("reportFields", [...draft.reportFields, value]);
              setReportFieldDraft("");
            }}
          >
            <Plus size={13} /> Add column
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {draft.reportFields.map((field, i) => (
            <span
              key={`${field}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-line-2 bg-bg px-3 py-1.5 text-xs"
            >
              {field}
              <button
                aria-label={`Remove ${field}`}
                onClick={() =>
                  set(
                    "reportFields",
                    draft.reportFields.filter((_, n) => n !== i),
                  )
                }
                className="text-urgent"
              >
                Remove
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          label="Complaint response deadline (hours)"
          value={draft.complaintSlaHours}
          onChange={(v) => set("complaintSlaHours", v)}
        />
        <NumberField
          label="Safety incident reporting deadline (hours)"
          value={draft.incidentSlaHours}
          onChange={(v) => set("incidentSlaHours", v)}
        />
      </div>
    </div>
  );
  const panels: Record<FundingSection, ReactNode> = {
    general,
    eligibility,
    programRules,
    geofence,
    spaceTypes,
    pricing,
    copay,
    cancellation,
    reporting,
  };

  if (isEdit && (countyLoading || (!countyError && !editHydrated))) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-ink-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading contract…</p>
      </div>
    );
  }

  if (isEdit && !countyLoading && (countyError || !countyResponse?.data)) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-ink-3">
          {apiErrorMessage(countyErr, "Could not load this contract")}
        </p>
        <Button variant="primary" size="md" onClick={() => navigate(ROUTES.fundingSources)}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <SetupErrorBoundary>
      <div className="space-y-6 pb-12">
        <div>
          <div className="mb-2">
            <Badge variant="primary-light">Super Admin only</Badge>
          </div>
          <h1 className="type-page-title">
            {isEdit ? "Edit Funding Source Contract" : "Create a Funding Source Contract"}
          </h1>
          <p className="mt-1 text-sm text-ink-4">
            {isEdit
              ? "Update this county contract. Changes are saved with PATCH /counties/:id."
              : "Configure the complete county or transportation-program contract in one place."}
          </p>
        </div>
        <div className="space-y-5">
          {sections.map(({ id, label, description, icon: Icon }, index) => (
            <Card key={id} data-funding-section={id} className="scroll-mt-24 p-5 sm:p-6">
              <div className="mb-5 flex items-start gap-3 border-b border-line-2 pb-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                  <Icon size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">{label}</h2>
                    <Badge variant="neutral">Section {index + 1}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-4">{description}</p>
                </div>
              </div>
              {panels[id]}
            </Card>
          ))}
        </div>
        <div className="space-y-3 rounded-xl border border-line-2 bg-white p-4">
          {formError && (
            <p className="rounded-xl border border-urgent/30 bg-urgent/5 px-3 py-2 text-sm text-urgent whitespace-pre-wrap">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.fundingSources)} disabled={saving}>
              Cancel
            </Button>
            <Button
              icon={saving ? Loader2 : Check}
              className={saving ? "[&_svg]:animate-spin" : ""}
              onClick={save}
              disabled={saving}
            >
              {saving
                ? isEdit
                  ? "Saving…"
                  : "Creating contract…"
                : isEdit
                  ? "Save changes"
                  : "Create Funding Source Contract"}
            </Button>
          </div>
        </div>
      </div>
    </SetupErrorBoundary>
  );
};
export default FundingSourceSetupPage;
