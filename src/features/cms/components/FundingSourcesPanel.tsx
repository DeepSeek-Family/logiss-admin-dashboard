import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Check,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Upload,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/components/ui";
import {
  useGetPayersQuery,
  useCreatePayerMutation,
  useUpdatePayerMutation,
  useGetCountiesQuery,
  useGetCountiesByPayerQuery,
  useGetCountyByIdQuery,
  useSaveCountyMutation,
  useUpdateCountyMutation,
} from "@/redux/api/coverageApi";
import {
  PAYER_TYPE_OPTIONS,
  normalizePayerType,
  payerTypeLabel,
  type PayerType,
} from "@/features/cms/constants/payerTypes";
import {
  PRICING_METHOD_LABELS,
  defaultMileageTiers,
  emptyCoverageDraft,
  findCountyForPayer,
  geoJsonToRings,
  mapCountyToDraft,
  mapDraftToCountyInput,
  methodChipLabel,
  toUiPriceMethod,
  type IMileageTier,
  type PayerCoverageDraft,
  type UiPricingMethod,
} from "@/features/cms/utils/countyHelpers";
import { apiErrorMessage, isMongoId } from "@/features/bookings/utils/helpers";
import { parseGeoJsonDocument, parsePolygons } from "@/utils/geofenceEngine";
import toast from "react-hot-toast";

const METHODS: UiPricingMethod[] = ["flat_rate", "per_mile", "mileage_based"];
const PAYER_QUERY_KEY = "payer";

const typeChipTone = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("government")) return "bg-primary-tint text-primary border-primary/25";
  if (t.includes("county")) return "bg-primary-light text-primary-dark border-primary/20";
  if (t.includes("city")) return "bg-bg text-ink-2 border-line";
  if (t.includes("insurance")) return "bg-primary-tint text-primary border-primary/25";
  if (t.includes("facility")) return "bg-bg text-ink-2 border-line";
  return "bg-bg text-ink-2 border-line";
};

const listChip =
  "inline-flex items-center justify-center box-border h-7 w-[6.5rem] shrink-0 rounded-full px-2.5 text-xs font-medium leading-none truncate border";

const methodChipTone = "bg-white text-ink-2 border-line";

const actionBtn = "h-10 rounded-xl px-4 text-sm";

const labelClass = "text-xs font-semibold text-ink-4 uppercase mb-1.5 block";

const controlBase =
  "h-10 box-border text-sm font-medium text-ink border border-line-2 rounded-xl px-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors";

const controlGrow = `${controlBase} w-full`;
const controlSelect = `${controlBase} w-52`;
const controlValue = `${controlBase} w-32`;

const Field = ({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) => (
  <div className="shrink-0">
    <label htmlFor={htmlFor} className={labelClass}>
      {label}
    </label>
    {children}
  </div>
);

/** Controlled number input that stays empty while typing (no forced 0 on clear). */
const ClearableNumberInput = ({
  value,
  onValueChange,
  className,
  onBlur,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    if (inputRef.current === document.activeElement) return;
    setText(String(value));
  }, [value]);

  const commit = () => {
    const raw = text.trim();
    if (raw === "" || raw === "-") {
      onValueChange(0);
      setText("0");
      return;
    }
    const n = Number(raw);
    const next = Number.isFinite(n) ? n : 0;
    onValueChange(next);
    setText(String(next));
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      type="number"
      className={className}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next === "" || next === "-") return;
        const n = Number(next);
        if (Number.isFinite(n)) onValueChange(n);
      }}
      onBlur={(e) => {
        commit();
        onBlur?.(e);
      }}
    />
  );
};

const MoneyInput = ({
  className,
  wrapperClassName,
  value = 0,
  onValueChange,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
}: {
  className?: string;
  wrapperClassName?: string;
  value?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}) => (
  <div className={`relative ${wrapperClassName ?? "w-32"}`}>
    <span className="absolute text-sm -translate-y-1/2 pointer-events-none left-3 top-1/2 text-ink-4">
      $
    </span>
    <ClearableNumberInput
      step="0.01"
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={`${wrapperClassName ? controlGrow : controlValue} pl-7 min-w-0 ${className || ""}`}
    />
  </div>
);

const cloneDraft = (d: PayerCoverageDraft): PayerCoverageDraft => ({
  ...d,
  mileageTiers: (d.mileageTiers || []).map((t) => ({ ...t })),
  geofencePolygons: parsePolygons(d.geofencePolygons),
  geofenceFileName: d.geofenceFileName || "",
  geofenceFile: d.geofenceFile,
});

const fenceVertexCount = (rings: [number, number][][]) =>
  rings.reduce((n, ring) => n + ring.length, 0);

const areaSummary = (fileName?: string, rings?: [number, number][][]) => {
  if (fileName) return fileName;
  if (rings && rings.length > 0) return "Fence uploaded";
  return "No fence";
};

const EditorSection = ({
  n,
  title,
  subtitle,
  children,
  open,
  onToggle,
  collapsedSummary,
}: {
  n: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  open?: boolean;
  onToggle?: () => void;
  collapsedSummary?: string;
}) => {
  const collapsible = Boolean(onToggle);
  const expanded = !collapsible || Boolean(open);
  return (
    <section className="overflow-hidden bg-white border rounded-xl border-line-2">
      <header
        className={`flex items-center gap-2.5 px-4 ${
          collapsible ? "py-1.5" : "py-3"
        } ${expanded ? "border-b border-line-2" : ""} bg-primary-tint/60`}
      >
        <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shrink-0 bg-primary">
          {n}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center min-w-0 gap-2">
            <h3 className="text-sm font-semibold shrink-0 text-primary">{title}</h3>
            {!expanded && collapsedSummary && (
              <p className="min-w-0 text-xs font-normal truncate text-ink-4">{collapsedSummary}</p>
            )}
          </div>
          {expanded && subtitle && <p className="text-xs text-ink-4 mt-0.5">{subtitle}</p>}
        </div>
        {collapsible && (
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 shrink-0 text-ink-4 hover:text-ink hover:bg-white/80 rounded-xl"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
            onClick={onToggle}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </header>
      {expanded && <div className="p-4 space-y-3">{children}</div>}
    </section>
  );
};

interface FundingSourcesPanelProps {
  canEdit?: boolean;
}

export const FundingSourcesPanel = ({ canEdit = true }: FundingSourcesPanelProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: payersResponse, isLoading, isError, error, refetch } = useGetPayersQuery();
  const { data: countiesResponse } = useGetCountiesQuery();
  const [createPayer, { isLoading: isCreating }] = useCreatePayerMutation();
  const [updatePayer, { isLoading: isSavingPayer }] = useUpdatePayerMutation();
  const [saveCounty, { isLoading: isCreatingCounty }] = useSaveCountyMutation();
  const [updateCounty, { isLoading: isUpdatingCounty }] = useUpdateCountyMutation();

  const payers = payersResponse?.data || [];
  const counties = countiesResponse?.data || [];
  const urlPayerId = searchParams.get(PAYER_QUERY_KEY) || "";
  const selectedId = payers.some((p) => p._id === urlPayerId) ? urlPayerId : payers[0]?._id || "";

  const {
    data: payerCountiesResponse,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
    refetch: refetchPayerCounty,
  } = useGetCountiesByPayerQuery(selectedId, { skip: !isMongoId(selectedId) });

  const [draft, setDraft] = useState<PayerCoverageDraft | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PayerType>("government");
  const [draftPayerType, setDraftPayerType] = useState<PayerType>("government");
  const [coversAreasOpen, setCoversAreasOpen] = useState(true);
  const geofenceInputRef = useRef<HTMLInputElement>(null);
  const hydratedKey = useRef<string | null>(null);

  const selected = payers.find((p) => p._id === selectedId) || null;
  const payerCounties = payerCountiesResponse?.data || [];
  const selectedCounty = selectedId
    ? findCountyForPayer(payerCounties, selectedId) || payerCounties[0]
    : undefined;
  const selectedCountyId = selectedCounty?._id || "";
  const {
    data: countyDetailResponse,
    isLoading: countyDetailLoading,
    isFetching: countyDetailFetching,
  } = useGetCountyByIdQuery(selectedCountyId, { skip: !isMongoId(selectedCountyId) });
  const countyForDraft = countyDetailResponse?.data ?? selectedCounty;

  const selectPayer = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(PAYER_QUERY_KEY, id);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (!payers.length) return;
    if (urlPayerId && payers.some((p) => p._id === urlPayerId)) return;
    selectPayer(payers[0]._id);
  }, [payers, urlPayerId, selectPayer]);

  useEffect(() => {
    hydratedKey.current = null;
    setDraft(null);
  }, [selectedId]);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      hydratedKey.current = null;
      return;
    }
    if (detailLoading) return;
    if (selectedCountyId && (countyDetailLoading || countyDetailFetching)) return;

    const county = countyForDraft;
    const key = `${selected._id}:${county?._id || "empty"}:${county?.updatedAt || ""}`;
    if (hydratedKey.current === key) return;

    setDraftPayerType(normalizePayerType(selected.type));
    setDraft(cloneDraft(mapCountyToDraft(selected, county)));
    setCoversAreasOpen(true);
    hydratedKey.current = key;
  }, [
    selected,
    selectedCountyId,
    countyForDraft,
    detailLoading,
    countyDetailLoading,
    countyDetailFetching,
  ]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payers;
    return payers.filter(
      (p) => p.name.toLowerCase().includes(q) || payerTypeLabel(p.type).toLowerCase().includes(q),
    );
  }, [payers, search]);

  const countyForPayer = (payerId: string) =>
    payerId === selectedId && selectedCounty
      ? selectedCounty
      : findCountyForPayer(counties, payerId);

  const hydrateFromApi = (payerId: string) => {
    const apiPayer = payers.find((p) => p._id === payerId);
    if (!apiPayer) return;
    const county = payerId === selectedId ? countyForDraft : findCountyForPayer(counties, payerId);
    setDraftPayerType(normalizePayerType(apiPayer.type));
    setDraft(cloneDraft(mapCountyToDraft(apiPayer, county)));
    hydratedKey.current = `${payerId}:${county?._id || "empty"}`;
  };

  const patchDraft = (updates: Partial<PayerCoverageDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const applyUiMethod = (m: UiPricingMethod) => {
    const nextMethod = toUiPriceMethod(m);
    setDraft((prev) => {
      if (!prev) return prev;
      const tiers = prev.mileageTiers?.length ? prev.mileageTiers : defaultMileageTiers();
      return {
        ...prev,
        pricingMethod: nextMethod,
        mileageTiers: tiers,
      };
    });
  };

  const addMileageTier = () => {
    if (!draft) return;
    const tiers = draft.mileageTiers || [];
    const lastTier = tiers[tiers.length - 1];
    const nextFrom = lastTier
      ? Number(lastTier.first_miles_price ?? lastTier.starting_mileage ?? 0)
      : 0;
    const span = lastTier
      ? Math.max(
          5,
          Number(lastTier.first_miles_price ?? 0) - Number(lastTier.starting_mileage ?? 0),
        )
      : 5;
    patchDraft({
      mileageTiers: [
        ...tiers,
        {
          starting_mileage: nextFrom,
          first_miles_price: nextFrom + span,
          per_mile_price: 0,
        },
      ],
    });
  };

  const updateMileageTier = (index: number, updates: Partial<IMileageTier>) => {
    if (!draft) return;
    const tiers = [...(draft.mileageTiers || [])];
    if (!tiers[index]) return;
    tiers[index] = { ...tiers[index], ...updates };

    if (updates.starting_mileage !== undefined && index > 0) {
      tiers[index - 1] = {
        ...tiers[index - 1],
        first_miles_price: Number(updates.starting_mileage) || 0,
      };
    }
    if (updates.first_miles_price !== undefined && index < tiers.length - 1) {
      tiers[index + 1] = {
        ...tiers[index + 1],
        starting_mileage: Number(updates.first_miles_price) || 0,
      };
    }

    patchDraft({ mileageTiers: tiers });
  };

  const removeMileageTier = (index: number) => {
    if (!draft) return;
    const tiers = (draft.mileageTiers || []).filter((_, i) => i !== index);
    patchDraft({
      mileageTiers: tiers.length > 0 ? tiers : defaultMileageTiers(),
    });
  };

  const handleSave = async () => {
    if (!selected || !draft) return;
    if (!draft.name.trim()) {
      toast.error("Payer name is required");
      return;
    }
    const typeValue = normalizePayerType(draftPayerType);

    const payload = mapDraftToCountyInput(selected._id, draft);
    if (payload.passengerCopayInside <= 0 && payload.passengerCopayOutside <= 0) {
      toast.error("Set at least one passenger copay (inside or outside).");
      return;
    }

    try {
      await updatePayer({
        id: selected._id,
        body: { name: draft.name.trim(), type: typeValue, isActive: draft.active },
      }).unwrap();
      const countyId = draft.countyId || selectedCounty?._id;
      if (countyId) {
        await updateCounty({ id: countyId, body: payload }).unwrap();
      } else {
        await saveCounty(payload).unwrap();
      }
      patchDraft({
        geofenceFile: undefined,
        geofenceFileName: draft.geofenceFile?.name || draft.geofenceFileName,
      });
      toast.success(countyId ? "Payer updated" : "Payer saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to save payer"));
    }
  };

  const handleCancelEdits = () => {
    if (!selected) return;
    hydrateFromApi(selected._id);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const typeValue = normalizePayerType(newType);
      const res = await createPayer({ name: newName.trim(), type: typeValue }).unwrap();
      const id = res.data?._id;
      if (id) {
        setDraft(cloneDraft(emptyCoverageDraft({ name: newName.trim(), isActive: true })));
        setDraftPayerType(typeValue);
        hydratedKey.current = `${id}:empty`;
        selectPayer(id);
      }
      setNewName("");
      setNewType("government");
      setShowAdd(false);
      toast.success("Payer created");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to create payer"));
    }
  };

  const handleGeofenceFile = async (file: File | undefined) => {
    if (!file || !draft) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error("That file is not valid JSON.");
      return;
    }
    const result = parseGeoJsonDocument(parsed);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    patchDraft({
      geofencePolygons: result.rings,
      geofenceFileName: file.name,
      geofenceFile: file,
    });
    toast.success(`${file.name} loaded. Click Save to keep it.`);
  };

  const clearGeofence = () => {
    patchDraft({ geofencePolygons: [], geofenceFileName: "", geofenceFile: undefined });
    if (geofenceInputRef.current) geofenceInputRef.current.value = "";
  };

  const currentMethod = toUiPriceMethod(draft?.pricingMethod);
  const hasExistingCounty = Boolean(draft?.countyId || selectedCounty?._id);
  const saving = isSavingPayer || isCreatingCounty || isUpdatingCounty || isCreating;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-ink-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading payers…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertTriangle className="text-urgent opacity-60" size={32} />
        <p className="text-sm text-ink-3">{apiErrorMessage(error, "Failed to load payers")}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="type-section-title">Payers</h2>
        {canEdit && (
          <Button
            variant="primary"
            size="md"
            className={actionBtn}
            onClick={() => setShowAdd(true)}
            disabled={saving}
          >
            <Plus size={16} /> Add
          </Button>
        )}
      </div>

      {showAdd && (
        <div className="p-4 space-y-3 border bg-primary/5 border-primary/20 rounded-2xl">
          <p className="text-xs font-bold tracking-wider uppercase text-primary">New Payer</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className={labelClass}>Name</label>
              <input
                className={controlGrow}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Powhatan DSS"
                autoFocus
              />
            </div>
            <Field label="Type">
              <select
                className={controlSelect}
                value={newType}
                onChange={(e) => setNewType(e.target.value as PayerType)}
              >
                {PAYER_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="h-10 flex items-center gap-1.5 px-4 text-sm font-semibold text-ink-3 border border-line-2 rounded-xl bg-white"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="h-10 flex items-center gap-1.5 px-4 text-sm font-semibold text-white bg-primary rounded-xl disabled:opacity-40"
            >
              <Check size={16} /> Create
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">
        <div className="flex flex-col overflow-hidden bg-white border lg:col-span-4 rounded-2xl border-line-2">
          <div className="p-3 border-b border-line-2">
            <div className="relative">
              <Search size={16} className="absolute -translate-y-1/2 left-3 top-1/2 text-ink-4" />
              <input
                className={`${controlGrow} pl-9`}
                placeholder="Search payers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-line-2/60 max-h-[560px]">
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-ink-4">No payers</p>
              </div>
            )}
            {filtered.map((p) => {
              const county = countyForPayer(p._id);
              const isActive = p.isActive !== false;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => selectPayer(p._id)}
                  className={`w-full text-left px-4 py-3.5 border-l-[3px] transition-colors ${
                    selectedId === p._id
                      ? "bg-primary/10 border-l-primary"
                      : "border-l-transparent hover:bg-bg"
                  } ${!isActive ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-ink">{p.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`${listChip} ${typeChipTone(payerTypeLabel(normalizePayerType(p.type)))}`}
                        >
                          {payerTypeLabel(normalizePayerType(p.type))}
                        </span>
                        {county?.priceMethod && (
                          <span className={`${listChip} ${methodChipTone}`}>
                            {methodChipLabel(county.priceMethod)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 w-2.5 h-2.5 rounded-full ${isActive ? "bg-accent" : "bg-line"}`}
                      title={isActive ? "Active" : "Inactive"}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 rounded-2xl border border-line-2 bg-bg flex flex-col min-h-[520px] max-h-[720px] overflow-hidden">
          {detailLoading && !draft ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-3 bg-white text-ink-4">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm">Loading payer coverage…</p>
            </div>
          ) : detailError && !draft ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-3 bg-white text-center px-6">
              <AlertTriangle className="text-urgent opacity-60" size={28} />
              <p className="text-sm text-ink-3">
                {apiErrorMessage(detailErr, "Failed to load coverage")}
              </p>
              <button
                type="button"
                onClick={() => void refetchPayerCounty()}
                className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-primary"
              >
                Retry
              </button>
            </div>
          ) : !draft ? (
            <div className="h-full min-h-[280px] flex items-center justify-center bg-white">
              <p className="text-sm text-ink-4">Select a payer</p>
            </div>
          ) : (
            <>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <EditorSection
                  n={1}
                  title="Who"
                  subtitle="Name, type, and whether this payer is active."
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <label className={labelClass}>Payer name</label>
                      <input
                        className={controlGrow}
                        value={draft.name}
                        onChange={(e) => patchDraft({ name: e.target.value })}
                      />
                    </div>
                    <Field label="Type">
                      <select
                        className={controlSelect}
                        value={draftPayerType}
                        onChange={(e) => {
                          setDraftPayerType(normalizePayerType(e.target.value));
                        }}
                        disabled={!canEdit}
                      >
                        {PAYER_TYPE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <button
                      type="button"
                      onClick={() => patchDraft({ active: !draft.active })}
                      disabled={!canEdit}
                      className={`h-10 flex items-center gap-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                        draft.active
                          ? "bg-accent-light text-accent border-accent/30"
                          : "bg-white text-ink-4 border-line-2"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${draft.active ? "bg-accent" : "bg-line"}`}
                      />
                      {draft.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </EditorSection>

                <EditorSection
                  n={2}
                  title="Covers areas"
                  subtitle="Upload a GeoJSON fence. Pickup and dropoff both inside = inside copay."
                  open={coversAreasOpen}
                  onToggle={() => setCoversAreasOpen((v) => !v)}
                  collapsedSummary={areaSummary(draft.geofenceFileName, draft.geofencePolygons)}
                >
                  <input
                    ref={geofenceInputRef}
                    type="file"
                    accept=".json,.geojson,application/geo+json,application/json"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      void handleGeofenceFile(file);
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={`${actionBtn} min-w-0`}
                      onClick={() => geofenceInputRef.current?.click()}
                    >
                      <Upload size={16} /> Upload JSON
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={actionBtn}
                      onClick={clearGeofence}
                      disabled={
                        !draft.geofenceFileName && (draft.geofencePolygons || []).length === 0
                      }
                    >
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-ink-3">
                    {(() => {
                      const rings = parsePolygons(draft.geofencePolygons);
                      const name = draft.geofenceFileName || "";
                      const savedCounty = selected ? countyForPayer(selected._id) : undefined;
                      const savedRings = savedCounty
                        ? geoJsonToRings(savedCounty.coversAreasGeoJSON)
                        : [];
                      const saved =
                        !draft.geofenceFile &&
                        !!savedCounty &&
                        JSON.stringify(savedRings) === JSON.stringify(rings);
                      if (rings.length === 0) {
                        return "No fence file. Empty fence = all trips inside.";
                      }
                      const pts = fenceVertexCount(rings);
                      const saveHint = saved ? "saved" : "not saved yet — click Save";
                      return `${name || "Fence"} · ${pts} points · ${saveHint}`;
                    })()}
                  </p>
                </EditorSection>

                <EditorSection
                  n={3}
                  title="How priced"
                  subtitle="Choose one pricing method and set the rates."
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <Field label="Pricing method" htmlFor="payer-pricing-method">
                        <select
                          id="payer-pricing-method"
                          className={controlSelect}
                          value={currentMethod}
                          onChange={(e) => applyUiMethod(e.target.value as UiPricingMethod)}
                          disabled={!canEdit}
                        >
                          {METHODS.map((m) => (
                            <option key={m} value={m}>
                              {PRICING_METHOD_LABELS[m]}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {currentMethod === "flat_rate" && (
                        <Field label="Flat rate">
                          <MoneyInput
                            value={draft.flatRate}
                            onValueChange={(n) => patchDraft({ flatRate: n })}
                            disabled={!canEdit}
                          />
                        </Field>
                      )}

                      {currentMethod === "per_mile" && (
                        <>
                          <Field label="Starting fare">
                            <MoneyInput
                              value={draft.startingFare}
                              onValueChange={(n) => patchDraft({ startingFare: n })}
                              disabled={!canEdit}
                            />
                          </Field>
                          <Field label="First miles price">
                            <MoneyInput
                              value={draft.firstMilesPrice}
                              onValueChange={(n) =>
                                patchDraft({ firstMilesPrice: n, includedRate: n })
                              }
                              disabled={!canEdit}
                            />
                          </Field>
                          <Field label="Per mile">
                            <MoneyInput
                              value={draft.perMileRate}
                              onValueChange={(n) => patchDraft({ perMileRate: n })}
                              disabled={!canEdit}
                            />
                          </Field>
                        </>
                      )}
                    </div>

                    {currentMethod === "mileage_based" && (
                      <div className="overflow-hidden bg-white border rounded-xl border-line-2">
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-primary-tint/50 border-b border-line-2">
                          <span className="text-xs font-bold tracking-wide uppercase text-ink-4">
                            From (miles)
                          </span>
                          <span className="text-xs font-bold tracking-wide uppercase text-ink-4">
                            To (miles)
                          </span>
                          <span className="text-xs font-bold tracking-wide uppercase text-ink-4">
                            Rate ($)
                          </span>
                          <span className="pr-1 text-xs font-bold tracking-wide text-right uppercase text-ink-4">
                            Actions
                          </span>
                        </div>

                        <div className="divide-y divide-line-2">
                          {(draft.mileageTiers || []).map((tier, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 bg-white"
                            >
                              <ClearableNumberInput
                                min={0}
                                step={1}
                                className={`${controlGrow} min-w-0`}
                                value={tier.starting_mileage}
                                onValueChange={(n) =>
                                  updateMileageTier(idx, { starting_mileage: n })
                                }
                                disabled={!canEdit}
                                placeholder="0"
                                aria-label={`Bracket ${idx + 1} from miles`}
                              />
                              <ClearableNumberInput
                                min={0}
                                step={1}
                                className={`${controlGrow} min-w-0`}
                                value={tier.first_miles_price}
                                onValueChange={(n) =>
                                  updateMileageTier(idx, { first_miles_price: n })
                                }
                                disabled={!canEdit}
                                placeholder="0"
                                aria-label={`Bracket ${idx + 1} to miles`}
                              />
                              <MoneyInput
                                wrapperClassName="w-full min-w-0"
                                value={tier.per_mile_price}
                                onValueChange={(n) => updateMileageTier(idx, { per_mile_price: n })}
                                disabled={!canEdit}
                                placeholder="0.00"
                                aria-label={`Bracket ${idx + 1} rate`}
                              />
                              <div className="flex justify-end">
                                {canEdit && (draft.mileageTiers || []).length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeMileageTier(idx)}
                                    className="flex items-center justify-center w-10 h-10 transition-colors cursor-pointer shrink-0 text-urgent/80 hover:text-urgent hover:bg-urgent/10 rounded-xl"
                                    title={`Remove bracket ${idx + 1}`}
                                    aria-label={`Remove bracket ${idx + 1}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                ) : (
                                  <span className="w-10 h-10" aria-hidden />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {canEdit && (
                          <div className="px-4 py-3 border-t border-line-2 bg-bg/30">
                            <button
                              type="button"
                              onClick={addMileageTier}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors px-3 py-2 rounded-lg border border-primary/25 bg-primary-tint/40 hover:bg-primary-tint/70 cursor-pointer"
                            >
                              <Plus size={14} /> Add bracket
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </EditorSection>

                <EditorSection
                  n={4}
                  title="Passenger copay"
                  subtitle="Inside and outside amounts for this payer."
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Copay · inside">
                      <MoneyInput
                        value={draft.passengerCopayInside}
                        onValueChange={(n) => patchDraft({ passengerCopayInside: n })}
                      />
                    </Field>
                    <Field label="Copay · outside">
                      <MoneyInput
                        value={draft.passengerCopayOutside}
                        onValueChange={(n) => patchDraft({ passengerCopayOutside: n })}
                      />
                    </Field>
                  </div>
                </EditorSection>
              </div>

              {canEdit && (
                <div className="flex items-center justify-end gap-3 px-5 py-4 bg-white border-t border-line-2 shrink-0">
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={handleCancelEdits}
                    className={`${actionBtn} min-w-[7rem]`}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="button"
                    onClick={() => void handleSave()}
                    className={`${actionBtn} min-w-[7.5rem]`}
                    disabled={saving}
                  >
                    <CheckCircle2 size={16} />
                    {saving ? "Saving…" : hasExistingCounty ? "Update" : "Save"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
