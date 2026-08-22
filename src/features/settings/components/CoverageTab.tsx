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
  DollarSign
} from 'lucide-react';
import { Card, Badge, Button } from '@/shared/components/ui';
import {
  usePricing,
  DEFAULT_PRICING,
  CountyConfig,
  MobilityConfig
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
    addCounty,
    updateCounty,
    deleteCounty,
    addMobility,
    updateMobility,
    deleteMobility
  } = usePricing();

  const canEdit = role === 'admin' || role === 'dispatcher';

  // County modal states
  const [isCountyModalOpen, setIsCountyModalOpen] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<CountyConfig | null>(null);

  // Mobility modal states
  const [isMobilityModalOpen, setIsMobilityModalOpen] = useState(false);
  const [selectedMobility, setSelectedMobility] = useState<MobilityConfig | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'county' | 'mobility';
    id: string;
    label: string;
  } | null>(null);

  const counties = pricing.counties || [];
  const mobilityTypes = pricing.mobilityTypes || [];

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

  const [activeSection, setActiveSection] = useState<'counties' | 'mobility' | 'mileage'>('counties');

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
          <span>Service Counties & Rates</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'counties' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            {counties.filter(c => c.status === 'active').length} Active
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
          <span>Mobility Requirements</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'mobility' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            {mobilityTypes.filter(m => m.status === 'active').length} Active
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
          <span>Mileage Billing Brackets</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSection === 'mileage' ? 'bg-white/20 text-white' : 'bg-bg text-ink-3 border border-line-2'
          }`}>
            {pricing.brackets.length} Tiers
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. COUNTIES & REGIONAL PRICING MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {activeSection === 'counties' && (
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="type-section-title">Service Counties & Pricing</h2>
              <Badge variant="accent" dot>
                {counties.filter(c => c.status === 'active').length} Active
              </Badge>
            </div>
            <p className="text-xs text-ink-3 mt-1">
              Add, edit, or configure customized inside/outside fare rates for each regional service county
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

        {/* Counties Table */}
        <div className="overflow-x-auto rounded-xl border border-line-2 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-bg border-b border-line-2">
              <tr>
                <th className="px-4 py-3 type-th whitespace-nowrap min-w-[200px]">County Name</th>
                <th className="px-4 py-3 type-th whitespace-nowrap min-w-[70px]">State</th>
                <th className="px-4 py-3 type-th whitespace-nowrap text-right min-w-[120px]">Inside Fare</th>
                <th className="px-4 py-3 type-th whitespace-nowrap text-right min-w-[120px]">Outside Fare</th>
                <th className="px-4 py-3 type-th whitespace-nowrap text-right min-w-[110px]">Pickup Fee</th>
                <th className="px-4 py-3 type-th whitespace-nowrap text-center min-w-[95px]">Status</th>
                {canEdit && <th className="px-4 py-3 type-th whitespace-nowrap text-center min-w-[95px]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {counties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-ink-4">
                    No service counties configured. Click "+ Add County" to create one.
                  </td>
                </tr>
              ) : (
                counties.map((c) => (
                  <tr key={c.id} className="hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-3.5 min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <MapPin size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink whitespace-nowrap">{c.name}</p>
                          {c.notes && <p className="text-xs text-ink-4 whitespace-nowrap">{c.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-ink-3 whitespace-nowrap min-w-[70px]">
                      {c.state || 'VA'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap min-w-[120px]">
                      <span className="text-xs font-semibold text-ink">
                        ${Number(c.insideRate || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap min-w-[120px]">
                      <span className="text-xs font-semibold text-ink">
                        ${Number(c.outsideRate || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap min-w-[110px]">
                      <span className="text-xs font-medium text-ink-3">
                        ${Number(c.pickupFee || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap min-w-[95px]">
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
