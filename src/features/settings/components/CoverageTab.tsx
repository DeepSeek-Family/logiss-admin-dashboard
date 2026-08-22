import { useState } from 'react';
import {
  MapPin,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Accessibility,
  Bed,
  Disc,
  Zap,
  User,
  Info,
  HeartPulse,
  Activity,
  Layers,
  Sparkles,
  DollarSign,
  Sliders,
  Clock,
  HelpCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Card, Badge, Button } from '@/shared/components/ui';
import {
  usePricing,
  DEFAULT_PRICING,
  DEFAULT_TRANSIT_RULES,
  CountyConfig,
  MobilityConfig,
  TransitRulesConfig
} from '@/hooks/usePricing';
import { CountyModal } from './CountyModal';
import { MobilityModal } from './MobilityModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import toast from 'react-hot-toast';

interface CoverageTabProps {
  role?: string | null;
}

const num = (v: string, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const ICON_MAP: { [key: string]: any } = {
  User,
  Accessibility,
  Bed,
  Disc,
  Zap,
  Info,
  HeartPulse,
  Shield,
  Activity,
};

export const CoverageTab = ({ role }: CoverageTabProps) => {
  const {
    pricing,
    setPricing,
    updateRules,
    addCounty,
    updateCounty,
    deleteCounty,
    addMobility,
    updateMobility,
    deleteMobility,
  } = usePricing();

  const canEdit = role !== 'driver';

  const [activeSection, setActiveSection] = useState<'counties' | 'rules' | 'mobility' | 'mileage'>('counties');

  // Modals state
  const [isCountyModalOpen, setIsCountyModalOpen] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<CountyConfig | null>(null);

  const [isMobilityModalOpen, setIsMobilityModalOpen] = useState(false);
  const [selectedMobility, setSelectedMobility] = useState<MobilityConfig | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'county' | 'mobility';
    id: string;
    label: string;
  } | null>(null);

  const counties = pricing.counties || [];
  const mobilityTypes = pricing.mobilityTypes || [];
  const rules = pricing.rules || DEFAULT_TRANSIT_RULES;

  const handleSaveCounty = (data: Omit<CountyConfig, 'id'>) => {
    if (selectedCounty) {
      updateCounty(selectedCounty.id, data);
    } else {
      addCounty(data);
    }
  };

  const handleSaveMobility = (data: Omit<MobilityConfig, 'id'>) => {
    if (selectedMobility) {
      updateMobility(selectedMobility.id, data);
    } else {
      addMobility(data);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'county') {
      deleteCounty(deleteTarget.id);
      toast.success(`County "${deleteTarget.label}" deleted`);
    } else if (deleteTarget.type === 'mobility') {
      deleteMobility(deleteTarget.id);
      toast.success(`Mobility requirement "${deleteTarget.label}" deleted`);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-200 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          COVERAGE SUB-TABS NAVIGATION (CLEAN & MINIMAL)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-line-2 shadow-sm w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection('counties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSection === 'counties'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <MapPin size={16} />
          <span>Service Counties</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSection === 'rules'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <Sliders size={16} />
          <span>Transit Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('mobility')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSection === 'mobility'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <Accessibility size={16} />
          <span>Mobility Requirements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('mileage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeSection === 'mileage'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <Layers size={16} />
          <span>Mileage Tiers</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. COUNTIES & REGIONAL PRICING MANAGEMENT (SIMPLIFIED)
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'counties' && (
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="type-section-title">Service Counties & Rates</h2>

          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedCounty(null);
                setIsCountyModalOpen(true);
              }}
            >
              <Plus size={14} className="mr-1" /> Add County
            </Button>
          )}
        </div>

        {/* Counties Table - Crisp & Clean */}
        <div className="overflow-x-auto rounded-xl border border-line-2 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-bg border-b border-line-2">
              <tr>
                <th className="px-4 py-3 type-th whitespace-nowrap min-w-[220px]">County / Territory</th>
                <th className="px-4 py-3 type-th whitespace-nowrap min-w-[80px]">State</th>
                <th className="px-4 py-3 type-th whitespace-nowrap text-right min-w-[140px]">Local Base Fare</th>
                <th className="px-4 py-3 type-th whitespace-nowrap text-center min-w-[100px]">Status</th>
                {canEdit && <th className="px-4 py-3 type-th whitespace-nowrap text-center min-w-[95px]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {counties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-ink-4">
                    No service counties configured. Click "+ Add County" to create one.
                  </td>
                </tr>
              ) : (
                counties.map((c) => (
                  <tr key={c.id} className="hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3.5 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <MapPin size={15} />
                        </div>
                        <span className="text-xs font-semibold text-ink whitespace-nowrap">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-ink-3 whitespace-nowrap min-w-[80px]">
                      {c.state || 'VA'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap min-w-[140px]">
                      <span className="text-xs font-bold text-ink bg-bg px-2.5 py-1 rounded-lg border border-line-2">
                        ${Number(c.localFare || 10).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap min-w-[100px]">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === 'active'
                            ? 'bg-accent-light text-accent'
                            : 'bg-bg text-ink-4 border border-line-2'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap min-w-[95px]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit County"
                            onClick={() => {
                              setSelectedCounty(c);
                              setIsCountyModalOpen(true);
                            }}
                            className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            title="Delete County"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'county',
                                id: c.id,
                                label: c.name,
                              });
                            }}
                            className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. TRANSIT RULES & GLOBAL SURCHARGES
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'rules' && (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="type-section-title">Global Transit & Base Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Base Pickup Fee */}
            <div className="p-4 rounded-xl border border-line-2 bg-white space-y-2">
              <label className="text-xs font-semibold text-ink block">Base Dispatch / Pickup Fee ($)</label>
              <div className="relative pt-1">
                <span className="absolute left-3 top-3.5 text-ink-4 text-xs font-semibold">$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={!canEdit}
                  value={rules.basePickupFee}
                  onChange={e => updateRules({ basePickupFee: num(e.target.value, 0) })}
                  className="input-base w-full pl-7 font-bold text-ink"
                />
              </div>
            </div>

            {/* Cross-County Surcharge */}
            <div className="p-4 rounded-xl border border-line-2 bg-white space-y-2">
              <label className="text-xs font-semibold text-ink block">Cross-County Surcharge ($)</label>
              <div className="relative pt-1">
                <span className="absolute left-3 top-3.5 text-ink-4 text-xs font-semibold">+$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={!canEdit}
                  value={rules.crossCountySurcharge}
                  onChange={e => updateRules({ crossCountySurcharge: num(e.target.value, 6) })}
                  className="input-base w-full pl-8 font-bold text-primary"
                />
              </div>
            </div>

            {/* Intermediate Stop Fee */}
            <div className="p-4 rounded-xl border border-line-2 bg-white space-y-2">
              <label className="text-xs font-semibold text-ink block">Waypoint / Stop Fee ($)</label>
              <div className="relative pt-1">
                <span className="absolute left-3 top-3.5 text-ink-4 text-xs font-semibold">+$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={!canEdit}
                  value={rules.stopFee}
                  onChange={e => updateRules({ stopFee: num(e.target.value, 5) })}
                  className="input-base w-full pl-8 font-bold text-ink"
                />
              </div>
            </div>

            {/* Night Surcharge */}
            <div className="p-4 rounded-xl border border-line-2 bg-white space-y-2">
              <label className="text-xs font-semibold text-ink block">Night Surcharge (8 PM - 6 AM) ($)</label>
              <div className="relative pt-1">
                <span className="absolute left-3 top-3.5 text-ink-4 text-xs font-semibold">+$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={!canEdit}
                  value={rules.nightSurcharge}
                  onChange={e => updateRules({ nightSurcharge: num(e.target.value, 15) })}
                  className="input-base w-full pl-8 font-bold text-ink"
                />
              </div>
            </div>

            {/* Weekend Surcharge */}
            <div className="p-4 rounded-xl border border-line-2 bg-white space-y-2">
              <label className="text-xs font-semibold text-ink block">Weekend Surcharge ($)</label>
              <div className="relative pt-1">
                <span className="absolute left-3 top-3.5 text-ink-4 text-xs font-semibold">+$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={!canEdit}
                  value={rules.weekendSurcharge}
                  onChange={e => updateRules({ weekendSurcharge: num(e.target.value, 10) })}
                  className="input-base w-full pl-8 font-bold text-ink"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILITY TYPES & SURCHARGE FEES (COMPACT & CLEAN)
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'mobility' && (
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="type-section-title">Mobility Requirements</h2>

          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedMobility(null);
                setIsMobilityModalOpen(true);
              }}
            >
              <Plus size={14} className="mr-1" /> Add Mobility Type
            </Button>
          )}
        </div>

        {/* Clean, Compact Mobility Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mobilityTypes.map((mob) => {
            const IconComponent = ICON_MAP[mob.iconKey || 'Accessibility'] || Accessibility;
            return (
              <div
                key={mob.id}
                className="p-3.5 rounded-xl border border-line-2 bg-white hover:border-primary/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <IconComponent size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{mob.name}</h3>
                    <span className="text-xs font-bold text-primary">
                      {mob.fee > 0 ? `+$${Number(mob.fee).toFixed(2)}` : 'Free / $0.00'}
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      title="Edit"
                      onClick={() => {
                        setSelectedMobility(mob);
                        setIsMobilityModalOpen(true);
                      }}
                      className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => {
                        setDeleteTarget({
                          type: 'mobility',
                          id: mob.id,
                          label: mob.name,
                        });
                      }}
                      className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MILEAGE BILLING BRACKETS
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'mileage' && (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="type-section-title">Mileage Billing Brackets</h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setPricing({
                  ...DEFAULT_PRICING,
                  brackets: DEFAULT_PRICING.brackets.map(b => ({ ...b })),
                  items: DEFAULT_PRICING.items.map(i => ({ ...i })),
                  counties: DEFAULT_PRICING.counties.map(c => ({ ...c })),
                  mobilityTypes: DEFAULT_PRICING.mobilityTypes.map(m => ({ ...m })),
                });
                toast.success('Default rates restored');
              }}
              className="text-xs font-medium text-ink-4 hover:text-primary transition-colors"
            >
              Reset defaults
            </button>
          )}
        </div>

        <div className="space-y-2.5 mt-4 mb-4">
          <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 text-xs font-semibold text-ink-3 px-1">
            <span>Min Miles</span>
            <span>Max Miles</span>
            <span>Billing Rate ($)</span>
            <span></span>
          </div>

          {pricing.brackets.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 items-center">
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  disabled={!canEdit}
                  value={b.min}
                  onChange={e =>
                    setPricing({
                      ...pricing,
                      brackets: pricing.brackets.map((row, idx) =>
                        idx === i ? { ...row, min: num(e.target.value, row.min) } : row
                      ),
                    })
                  }
                  className="input-base w-full pr-8 text-xs font-semibold text-ink"
                  placeholder="Min"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-ink-4 font-medium pointer-events-none">mi</span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  disabled={!canEdit}
                  value={b.max}
                  onChange={e =>
                    setPricing({
                      ...pricing,
                      brackets: pricing.brackets.map((row, idx) =>
                        idx === i ? { ...row, max: num(e.target.value, row.max) } : row
                      ),
                    })
                  }
                  className="input-base w-full pr-8 text-xs font-semibold text-ink"
                  placeholder="Max"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-ink-4 font-medium pointer-events-none">mi</span>
              </div>

              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-ink-4 font-medium pointer-events-none">$</span>
                <input
                  type="number"
                  step="0.50"
                  disabled={!canEdit}
                  value={b.rate}
                  onChange={e =>
                    setPricing({
                      ...pricing,
                      brackets: pricing.brackets.map((row, idx) =>
                        idx === i ? { ...row, rate: num(e.target.value, row.rate) } : row
                      ),
                    })
                  }
                  className="input-base w-full pl-6 text-xs font-bold text-ink"
                  placeholder="0.00"
                />
              </div>

              {canEdit ? (
                <button
                  type="button"
                  title="Remove Tier"
                  onClick={() =>
                    setPricing({
                      ...pricing,
                      brackets: pricing.brackets.filter((_, idx) => idx !== i),
                    })
                  }
                  className="p-2 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-all flex items-center justify-center"
                >
                  <Trash2 size={15} />
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>

        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const last = pricing.brackets[pricing.brackets.length - 1];
              setPricing({
                ...pricing,
                brackets: [
                  ...pricing.brackets,
                  {
                    min: last ? Number((last.max + 0.01).toFixed(2)) : 0,
                    max: (last?.max || 0) + 10,
                    rate: (last?.rate || 0) + 20,
                  },
                ],
              });
            }}
            className="text-xs text-primary"
          >
            <Plus size={13} className="mr-1" /> Add Mileage Tier
          </Button>
        )}
      </Card>
      )}

      {/* Modals */}
      <CountyModal
        isOpen={isCountyModalOpen}
        county={selectedCounty}
        onClose={() => {
          setIsCountyModalOpen(false);
          setSelectedCounty(null);
        }}
        onSave={handleSaveCounty}
      />

      <MobilityModal
        isOpen={isMobilityModalOpen}
        mobility={selectedMobility}
        onClose={() => {
          setIsMobilityModalOpen(false);
          setSelectedMobility(null);
        }}
        onSave={handleSaveMobility}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'county' ? 'Delete Service County' : 'Delete Mobility Requirement'}
        message={
          deleteTarget?.type === 'county'
            ? 'Are you sure you want to remove this service county from the system?'
            : 'Are you sure you want to remove this mobility option? Any bookings referencing this will remain intact.'
        }
        itemLabel={deleteTarget?.label}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
