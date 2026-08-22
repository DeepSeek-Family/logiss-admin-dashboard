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
          COVERAGE SUB-TABS NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-line-2 shadow-sm w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection('counties')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === 'counties'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <MapPin size={16} />
          <span>Service Counties</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'counties' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            {counties.filter(c => c.status === 'active').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('rules')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === 'rules'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <Sliders size={16} />
          <span>Transit & Base Rules</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'rules' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            Global Policy
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('mobility')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === 'mobility'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <Accessibility size={16} />
          <span>Mobility Types</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'mobility' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            {mobilityTypes.filter(m => m.status === 'active').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('mileage')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === 'mileage'
              ? 'bg-primary text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-bg'
          }`}
        >
          <Layers size={16} />
          <span>Mileage Tiers</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'mileage' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            {pricing.brackets.length}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. COUNTIES & REGIONAL PRICING MANAGEMENT (SIMPLIFIED)
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'counties' && (
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="type-section-title">Service Counties & Local Rates</h2>
              <Badge variant="accent" dot>
                {counties.filter(c => c.status === 'active').length} Active
              </Badge>
            </div>
            <p className="text-xs text-ink-3 mt-1">
              Configure authorized service territories and standard local inside-county passenger fares
            </p>
          </div>

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
                        <div>
                          <p className="text-xs font-semibold text-ink whitespace-nowrap">{c.name}</p>
                          {c.notes && <p className="text-xs text-ink-4 whitespace-nowrap">{c.notes}</p>}
                        </div>
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
          2. TRANSIT RULES & GLOBAL SURCHARGES (NEW DEDICATED TAB)
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'rules' && (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <h2 className="type-section-title">Global Transit Policies & Surcharges</h2>
              <Badge variant="primary">System-Wide</Badge>
            </div>
            <p className="text-xs text-ink-3 mt-1">
              Set standard pickup fees, cross-county border penalties, and dispatch surcharges applied across all regions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Base Pickup Fee */}
            <div className="p-4 rounded-xl border border-line-2 bg-bg/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">Base Dispatch / Pickup Fee ($)</label>
                <DollarSign size={16} className="text-ink-4" />
              </div>
              <p className="text-xs text-ink-4">
                Universal baseline fee added to every booking before distance calculations.
              </p>
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
            <div className="p-4 rounded-xl border border-line-2 bg-bg/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">Cross-County Border Surcharge ($)</label>
                <MapPin size={16} className="text-primary" />
              </div>
              <p className="text-xs text-ink-4">
                Standard surcharge added to passenger fare when a trip crosses county borders.
              </p>
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
            <div className="p-4 rounded-xl border border-line-2 bg-bg/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">Intermediate Waypoint / Stop Fee ($)</label>
                <Plus size={16} className="text-ink-4" />
              </div>
              <p className="text-xs text-ink-4">
                Fee charged per intermediate stop requested along the route.
              </p>
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
            <div className="p-4 rounded-xl border border-line-2 bg-bg/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">After-Hours / Night Surcharge ($)</label>
                <Clock size={16} className="text-ink-4" />
              </div>
              <p className="text-xs text-ink-4">
                Dispatch premium for rides scheduled between 8:00 PM and 6:00 AM.
              </p>
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
            <div className="p-4 rounded-xl border border-line-2 bg-bg/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">Weekend Dispatch Surcharge ($)</label>
                <Sparkles size={16} className="text-ink-4" />
              </div>
              <p className="text-xs text-ink-4">
                Surcharge applied for Saturday and Sunday trip dispatches.
              </p>
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

            {/* Live Pricing Formula Card */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <CheckCircle2 size={16} />
                  <span>How Dynamic Pricing Works</span>
                </div>
                <div className="text-xs text-ink-3 space-y-1.5 mt-2">
                  <p>• <strong>Inside County Fare:</strong> Local Base Fare (${Number(counties[0]?.localFare || 10).toFixed(2)})</p>
                  <p>• <strong>Outside County Fare:</strong> Local Base + Cross-County (${Number((counties[0]?.localFare || 10) + rules.crossCountySurcharge).toFixed(2)})</p>
                  <p>• <strong>Total Ride Cost:</strong> Mileage Tier + Base Fee + Mobility Surcharge</p>
                </div>
              </div>
              <div className="pt-2 border-t border-primary/10">
                <span className="text-xs font-semibold text-primary">Formula automatically linked to Booking engine</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILITY TYPES & SURCHARGE FEES MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'mobility' && (
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="type-section-title">Mobility Requirements & Surcharges</h2>
              <Badge variant="accent" dot>
                {mobilityTypes.filter(m => m.status === 'active').length} Active
              </Badge>
            </div>
            <p className="text-xs text-ink-3 mt-1">
              Add and manage rider mobility equipment options and customized base surcharge fees
            </p>
          </div>

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

        {/* Mobility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mobilityTypes.map((mob) => {
            const IconComponent = ICON_MAP[mob.iconKey || 'Accessibility'] || Accessibility;
            return (
              <div
                key={mob.id}
                className="p-4 rounded-xl border border-line-2 bg-white hover:border-primary/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{mob.name}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            mob.status === 'active'
                              ? 'bg-accent-light text-accent'
                              : 'bg-bg text-ink-4 border border-line-2'
                          }`}
                        >
                          {mob.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                      {mob.fee > 0 ? `+$${Number(mob.fee).toFixed(2)}` : 'Free / $0.00'}
                    </span>
                  </div>

                  <p className="text-xs text-ink-3 line-clamp-2 mt-2">
                    {mob.description || 'Standard requirement for scheduled bookings.'}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-line-2">
                    <button
                      onClick={() => {
                        setSelectedMobility(mob);
                        setIsMobilityModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-ink-3 hover:text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget({
                          type: 'mobility',
                          id: mob.id,
                          label: mob.name,
                        });
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-ink-3 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
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
          3. COUNTY GOVERNMENT MILEAGE BRACKETS
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'mileage' && (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="type-section-title">Government & Mileage Billing Brackets</h2>
            <p className="text-xs text-ink-3">Tiered mileage calculations for county contracts and billing</p>
          </div>
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

        <div className="space-y-2 mt-4 mb-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-ink-3 px-2">
            <span>Min Miles</span>
            <span>Max Miles</span>
            <span>Bracket Rate ($)</span>
            <span></span>
          </div>

          {pricing.brackets.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <input
                type="number"
                step="0.01"
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
                className="h-9 px-3 rounded-lg border border-line-2 text-xs text-ink outline-none focus:border-primary"
                placeholder="Min"
              />
              <input
                type="number"
                step="0.01"
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
                className="h-9 px-3 rounded-lg border border-line-2 text-xs text-ink outline-none focus:border-primary"
                placeholder="Max"
              />
              <input
                type="number"
                step="0.01"
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
                className="h-9 px-3 rounded-lg border border-line-2 text-xs text-ink outline-none focus:border-primary font-semibold"
                placeholder="Rate $"
              />
              {canEdit ? (
                <button
                  type="button"
                  onClick={() =>
                    setPricing({
                      ...pricing,
                      brackets: pricing.brackets.filter((_, idx) => idx !== i),
                    })
                  }
                  className="p-2 text-ink-4 hover:text-urgent rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
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
