import { useEffect, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Check,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Upload,
} from 'lucide-react';
import { Button } from '@/shared/components/ui';
import {
  usePricing,
  PRICING_METHOD_LABELS,
  type FundingSourcePolicy,
  type PricingMethod,
} from '@/hooks/usePricing';
import { parseGeoJsonDocument, parsePolygons } from '@/utils/geofenceEngine';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = ['Government', 'County payer', 'City', 'Insurance', 'Self-pay', 'Facility', 'Other'];

type UiPricingMethod = 'flat' | 'included_then_per_mile' | 'mileage_brackets';

const METHODS: UiPricingMethod[] = ['flat', 'included_then_per_mile', 'mileage_brackets'];

const uiMethod = (method: PricingMethod): UiPricingMethod => {
  if (method === 'geofence') return 'flat';
  if (method === 'base_per_mile') return 'included_then_per_mile';
  if (method === 'included_then_per_mile' || method === 'mileage_brackets') return method;
  return 'flat';
};

const sentenceCase = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';

const typeChipTone = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('government')) return 'bg-primary-tint text-primary border-primary/25';
  if (t.includes('county')) return 'bg-primary-light text-primary-dark border-primary/20';
  if (t.includes('city')) return 'bg-bg text-ink-2 border-line';
  if (t.includes('insurance')) return 'bg-primary-tint text-primary border-primary/25';
  if (t.includes('facility')) return 'bg-bg text-ink-2 border-line';
  return 'bg-bg text-ink-2 border-line';
};

const listChip =
  'inline-flex items-center justify-center box-border h-7 w-[6.5rem] shrink-0 rounded-full px-2.5 text-[11px] font-medium leading-none truncate border';

const methodChipTone = 'bg-white text-ink-2 border-line';

const actionBtn = 'h-10 rounded-xl px-4 text-sm';

const labelClass = 'text-xs font-semibold text-ink-4 uppercase mb-1.5 block';

const controlBase =
  'h-10 box-border text-sm font-medium text-ink border border-line-2 rounded-xl px-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

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

const MoneyInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative w-32">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-4">$</span>
    <input type="number" step="0.01" {...props} className={`${controlValue} pl-7`} />
  </div>
);

const methodChip = (method: PricingMethod) => {
  const short: Record<string, string> = {
    flat: 'Flat',
    included_then_per_mile: 'By miles',
    mileage_brackets: 'Brackets',
  };
  return short[uiMethod(method)] || 'Flat';
};

const clonePolicy = (p: FundingSourcePolicy): FundingSourcePolicy => ({
  ...p,
  brackets: (p.brackets || []).map(b => ({ ...b })),
  serviceAreaIds: [...(p.serviceAreaIds || [])],
  geofencePolygons: parsePolygons(p.geofencePolygons),
  geofenceFileName: p.geofenceFileName || '',
});

const fenceVertexCount = (rings: [number, number][][]) =>
  rings.reduce((n, ring) => n + ring.length, 0);

const areaSummary = (fileName?: string, rings?: [number, number][][]) => {
  if (fileName) return fileName;
  if (rings && rings.length > 0) return 'Fence uploaded';
  return 'No fence';
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
    <section className="rounded-xl border border-line-2 bg-white overflow-hidden">
      <header
        className={`flex items-center gap-2.5 px-4 ${
          collapsible ? 'py-1.5' : 'py-3'
        } ${expanded ? 'border-b border-line-2' : ''} bg-primary-tint/60`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-primary">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold shrink-0 text-primary">{title}</h3>
            {!expanded && collapsedSummary && (
              <p className="min-w-0 truncate text-xs font-normal text-ink-4">{collapsedSummary}</p>
            )}
          </div>
          {expanded && subtitle && <p className="text-xs text-ink-4 mt-0.5">{subtitle}</p>}
        </div>
        {collapsible && (
          <button
            type="button"
            className="h-10 w-10 shrink-0 flex items-center justify-center text-ink-4 hover:text-ink hover:bg-white/80 rounded-xl"
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

export const FundingSourcesPanel = () => {
  const {
    pricing,
    addFundingPolicy,
    updateFundingPolicy,
    deleteFundingPolicy,
  } = usePricing();

  const policies = pricing.fundingPolicies || [];
  const [selectedId, setSelectedId] = useState<string | null>(policies[0]?.id || null);
  const [draft, setDraft] = useState<FundingSourcePolicy | null>(() =>
    policies[0] ? clonePolicy(policies[0]) : null
  );
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Government');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [coversAreasOpen, setCoversAreasOpen] = useState(true);
  const geofenceInputRef = useRef<HTMLInputElement>(null);

  const selected = policies.find(p => p.id === selectedId) || null;

  useEffect(() => {
    const current = policies.find(p => p.id === selectedId) || null;
    setDraft(current ? clonePolicy(current) : null);
    setDeleteConfirm(false);
    setCoversAreasOpen(true);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return policies;
    return policies.filter(
      p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
    );
  }, [policies, search]);

  const patchDraft = (updates: Partial<FundingSourcePolicy>) => {
    setDraft(prev => (prev ? { ...prev, ...updates } : prev));
  };

  const applyUiMethod = (m: UiPricingMethod) => {
    setDraft(prev => {
      if (!prev) return prev;
      if (m === 'flat' && prev.pricingMethod === 'geofence') {
        return { ...prev, pricingMethod: 'flat', flatRate: prev.insideRate };
      }
      if (m === 'included_then_per_mile' && prev.pricingMethod === 'base_per_mile') {
        return {
          ...prev,
          pricingMethod: 'included_then_per_mile',
          includedMiles: 0,
          includedRate: prev.baseFare,
        };
      }
      return { ...prev, pricingMethod: m };
    });
  };

  const handleSave = () => {
    if (!selected || !draft) return;
    if (!draft.name.trim()) {
      toast.error('Payer name is required');
      return;
    }
    const method = uiMethod(draft.pricingMethod);
    const geofenceToFlat = draft.pricingMethod === 'geofence';
    const baseToIncluded = draft.pricingMethod === 'base_per_mile';
    updateFundingPolicy(selected.id, {
      name: draft.name.trim(),
      type: draft.type,
      active: draft.active,
      pricingMethod: method,
      flatRate: geofenceToFlat ? draft.insideRate : draft.flatRate,
      baseFare: draft.baseFare,
      perMileRate: draft.perMileRate,
      includedMiles: baseToIncluded ? 0 : draft.includedMiles,
      includedRate: baseToIncluded ? draft.baseFare : draft.includedRate,
      brackets: draft.brackets,
      insideRate: draft.insideRate,
      outsideRate: draft.outsideRate,
      passengerCopayInside: draft.passengerCopayInside,
      passengerCopayOutside: draft.passengerCopayOutside,
      serviceAreaIds: [...(draft.serviceAreaIds || [])],
      geofencePolygons: parsePolygons(draft.geofencePolygons),
      geofenceFileName: draft.geofenceFileName || '',
    });
    toast.success('Payer saved');
  };

  const handleCancelEdits = () => {
    if (!selected) return;
    setDraft(clonePolicy(selected));
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const created = addFundingPolicy({
      name: newName.trim(),
      type: newType,
      pricingMethod: 'included_then_per_mile',
    });
    setSelectedId(created.id);
    setNewName('');
    setNewType('Government');
    setShowAdd(false);
    toast.success('Payer created');
  };

  const handleDelete = () => {
    if (!selected) return;
    const next = policies.filter(p => p.id !== selected.id);
    deleteFundingPolicy(selected.id);
    setSelectedId(next[0]?.id || null);
    setDeleteConfirm(false);
    toast.success('Payer removed');
  };

  const MAX_GEOFENCE_BYTES = 2 * 1024 * 1024;

  const handleGeofenceFile = async (file: File | undefined) => {
    if (!file || !draft) return;
    if (file.size > MAX_GEOFENCE_BYTES) {
      toast.error('File is too large to save (max 2 MB).');
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error('That file is not valid JSON.');
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
    });
    toast.success(`${file.name} loaded. Click Save to keep it.`);
  };

  const clearGeofence = () => {
    patchDraft({ geofencePolygons: [], geofenceFileName: '' });
    if (geofenceInputRef.current) geofenceInputRef.current.value = '';
  };

  const currentMethod = draft ? uiMethod(draft.pricingMethod) : 'flat';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="type-section-title">Payers</h2>
        <Button
          variant="primary"
          size="md"
          className={actionBtn}
          onClick={() => {
            setShowAdd(true);
            setDeleteConfirm(false);
          }}
        >
          <Plus size={16} /> Add
        </Button>
      </div>

      {showAdd && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">New Payer</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className={labelClass}>Name</label>
              <input
                className={controlGrow}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. Powhatan DSS"
                autoFocus
              />
            </div>
            <Field label="Type">
              <select className={controlSelect} value={newType} onChange={e => setNewType(e.target.value)}>
                {TYPE_OPTIONS.map(t => (
                  <option key={t}>{t}</option>
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
        <div className="lg:col-span-4 rounded-2xl border border-line-2 bg-white overflow-hidden flex flex-col">
          <div className="p-3 border-b border-line-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                className={`${controlGrow} pl-9`}
                placeholder="Search payers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-line-2/60 max-h-[560px]">
            {filtered.length === 0 && (
              <div className="py-10 text-center px-4">
                <p className="text-sm font-medium text-ink-4">No payers</p>
              </div>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  setDeleteConfirm(false);
                }}
                className={`w-full text-left px-4 py-3.5 border-l-[3px] transition-colors ${
                  selectedId === p.id
                    ? 'bg-primary/10 border-l-primary'
                    : 'border-l-transparent hover:bg-bg'
                } ${!p.active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`${listChip} ${typeChipTone(p.type)}`}>
                        {sentenceCase(p.type)}
                      </span>
                      <span className={`${listChip} ${methodChipTone}`}>
                        {methodChip(p.pricingMethod)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 w-2.5 h-2.5 rounded-full ${p.active ? 'bg-accent' : 'bg-line'}`}
                    title={p.active ? 'Active' : 'Inactive'}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 rounded-2xl border border-line-2 bg-bg flex flex-col min-h-[520px] max-h-[720px] overflow-hidden">
          {!draft ? (
            <div className="h-full min-h-[280px] flex items-center justify-center bg-white">
              <p className="text-sm text-ink-4">Select a payer</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <EditorSection n={1} title="Who" subtitle="Name, type, and whether this payer is active.">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[180px]">
                      <label className={labelClass}>Payer name</label>
                      <input
                        className={controlGrow}
                        value={draft.name}
                        onChange={e => patchDraft({ name: e.target.value })}
                      />
                    </div>
                    <Field label="Type">
                      <select
                        className={controlSelect}
                        value={draft.type}
                        onChange={e => patchDraft({ type: e.target.value })}
                      >
                        {TYPE_OPTIONS.map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <button
                      type="button"
                      onClick={() => patchDraft({ active: !draft.active })}
                      className={`h-10 flex items-center gap-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                        draft.active
                          ? 'bg-accent-light text-accent border-accent/30'
                          : 'bg-white text-ink-4 border-line-2'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${draft.active ? 'bg-accent' : 'bg-line'}`}
                      />
                      {draft.active ? 'Active' : 'Inactive'}
                    </button>
                    <div className="shrink-0">
                      {deleteConfirm ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="h-10 px-3 text-xs font-bold text-white bg-urgent rounded-xl"
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(false)}
                            className="h-10 px-3 text-xs font-semibold border border-line-2 rounded-xl bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(true)}
                          className="h-10 w-10 flex items-center justify-center text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-xl"
                          title="Delete payer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </EditorSection>

                <EditorSection
                  n={2}
                  title="Covers areas"
                  subtitle="Upload a GeoJSON fence. Pickup and dropoff both inside = inside copay."
                  open={coversAreasOpen}
                  onToggle={() => setCoversAreasOpen(v => !v)}
                  collapsedSummary={areaSummary(draft.geofenceFileName, draft.geofencePolygons)}
                >
                  <input
                    ref={geofenceInputRef}
                    type="file"
                    accept=".json,.geojson,application/geo+json,application/json"
                    className="sr-only"
                    onChange={e => {
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
                      disabled={!draft.geofenceFileName && (draft.geofencePolygons || []).length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-ink-3">
                    {(() => {
                      const rings = parsePolygons(draft.geofencePolygons);
                      const name = draft.geofenceFileName || '';
                      const saved =
                        !!selected &&
                        (selected.geofenceFileName || '') === name &&
                        JSON.stringify(parsePolygons(selected.geofencePolygons)) ===
                          JSON.stringify(rings);
                      if (rings.length === 0) {
                        return 'No fence file. Empty fence = all trips inside.';
                      }
                      const pts = fenceVertexCount(rings);
                      const saveHint = saved ? 'saved' : 'not saved yet — click Save';
                      return `${name || 'Fence'} · ${pts} points · ${saveHint}`;
                    })()}
                  </p>
                </EditorSection>

                <EditorSection
                  n={3}
                  title="How priced"
                  subtitle="Choose one pricing method and set the rates."
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Pricing method" htmlFor="payer-pricing-method">
                      <select
                        id="payer-pricing-method"
                        className={controlSelect}
                        value={currentMethod}
                        onChange={e => applyUiMethod(e.target.value as UiPricingMethod)}
                      >
                        {METHODS.map(m => (
                          <option key={m} value={m}>
                            {PRICING_METHOD_LABELS[m]}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {currentMethod === 'flat' && (
                      <Field label="Flat rate">
                        <MoneyInput
                          value={draft.pricingMethod === 'geofence' ? draft.insideRate : draft.flatRate}
                          onChange={e => {
                            const flatRate = Number(e.target.value) || 0;
                            patchDraft(
                              draft.pricingMethod === 'geofence'
                                ? { pricingMethod: 'flat', flatRate }
                                : { flatRate }
                            );
                          }}
                        />
                      </Field>
                    )}

                    {currentMethod === 'included_then_per_mile' && (
                      <>
                        <Field label="Starting fare">
                          <MoneyInput
                            value={
                              draft.pricingMethod === 'base_per_mile'
                                ? draft.baseFare
                                : draft.includedRate
                            }
                            onChange={e => {
                              const includedRate = Number(e.target.value) || 0;
                              patchDraft(
                                draft.pricingMethod === 'base_per_mile'
                                  ? {
                                      pricingMethod: 'included_then_per_mile',
                                      includedMiles: 0,
                                      includedRate,
                                    }
                                  : { includedRate }
                              );
                            }}
                          />
                        </Field>
                        <Field label="First miles">
                          <input
                            type="number"
                            step="1"
                            className={controlValue}
                            value={draft.pricingMethod === 'base_per_mile' ? 0 : draft.includedMiles}
                            onChange={e =>
                              patchDraft({
                                pricingMethod: 'included_then_per_mile',
                                includedMiles: Number(e.target.value) || 0,
                                includedRate:
                                  draft.pricingMethod === 'base_per_mile'
                                    ? draft.baseFare
                                    : draft.includedRate,
                              })
                            }
                          />
                        </Field>
                        <Field label="Then per mile">
                          <MoneyInput
                            value={draft.perMileRate}
                            onChange={e => patchDraft({ perMileRate: Number(e.target.value) || 0 })}
                          />
                        </Field>
                      </>
                    )}
                  </div>

                  {currentMethod === 'mileage_brackets' && (
                    <div className="overflow-x-auto rounded-xl border border-line-2">
                      <table className="w-full text-left">
                        <thead className="bg-bg border-b border-line-2">
                          <tr>
                            <th className="px-3 py-2.5 type-th">From (miles)</th>
                            <th className="px-3 py-2.5 type-th">To (miles)</th>
                            <th className="px-3 py-2.5 type-th">Rate ($)</th>
                            <th className="px-3 py-2.5 type-th text-center w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-2">
                          {(draft.brackets || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-3 py-6 text-center text-xs text-ink-4">
                                No brackets yet
                              </td>
                            </tr>
                          ) : (
                            (draft.brackets || []).map((b, idx) => (
                              <tr key={idx} className="bg-white">
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    className={controlValue}
                                    value={b.min}
                                    onChange={e => {
                                      const brackets = [...(draft.brackets || [])];
                                      brackets[idx] = { ...brackets[idx], min: Number(e.target.value) || 0 };
                                      patchDraft({ brackets });
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    className={controlValue}
                                    value={b.max}
                                    onChange={e => {
                                      const brackets = [...(draft.brackets || [])];
                                      brackets[idx] = { ...brackets[idx], max: Number(e.target.value) || 0 };
                                      patchDraft({ brackets });
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <MoneyInput
                                    value={b.rate}
                                    onChange={e => {
                                      const brackets = [...(draft.brackets || [])];
                                      brackets[idx] = { ...brackets[idx], rate: Number(e.target.value) || 0 };
                                      patchDraft({ brackets });
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      className="h-10 w-10 flex items-center justify-center text-urgent hover:bg-urgent/10 rounded-xl"
                                      aria-label={`Remove bracket ${idx + 1}`}
                                      onClick={() =>
                                        patchDraft({
                                          brackets: (draft.brackets || []).filter((_, i) => i !== idx),
                                        })
                                      }
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      <div className="px-3 py-2.5 border-t border-line-2 bg-white">
                        <button
                          type="button"
                          className="h-10 px-3 rounded-xl text-sm font-semibold text-primary bg-primary-tint hover:bg-primary-light flex items-center gap-1.5"
                          onClick={() =>
                            patchDraft({
                              brackets: [
                                ...(draft.brackets || []),
                                { min: 0, max: 10, rate: 20 },
                              ],
                            })
                          }
                        >
                          <Plus size={16} /> Add bracket
                        </button>
                      </div>
                    </div>
                  )}
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
                        onChange={e =>
                          patchDraft({ passengerCopayInside: Number(e.target.value) || 0 })
                        }
                      />
                    </Field>
                    <Field label="Copay · outside">
                      <MoneyInput
                        value={draft.passengerCopayOutside}
                        onChange={e =>
                          patchDraft({ passengerCopayOutside: Number(e.target.value) || 0 })
                        }
                      />
                    </Field>
                  </div>
                </EditorSection>
              </div>

              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-line-2 bg-white shrink-0">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={handleCancelEdits}
                  className={`${actionBtn} min-w-[7rem]`}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={handleSave}
                  className={`${actionBtn} min-w-[7.5rem]`}
                >
                  <CheckCircle2 size={16} />
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
