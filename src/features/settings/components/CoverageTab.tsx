import { useState } from 'react';
import {
  MapPin,
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
  Shield,
  Landmark,
  Building2,
} from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';
import {
  usePricing,
  CountyConfig,
  MobilityConfig,
  DEFAULT_TRANSIT_RULES,
} from '@/hooks/usePricing';
import { CountyModal } from './CountyModal';
import { MobilityModal } from './MobilityModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { AreaZoneCard } from './AreaZoneCard';
import { FundingSourcesPanel } from '@/features/cms/components/FundingSourcesPanel';
import { FacilitiesPanel } from '@/features/cms/components/FacilitiesPanel';
import { resolveFenceLists, parsePolygon } from '@/utils/geofenceEngine';
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

type Section = 'counties' | 'funding' | 'fees' | 'facilities';

const actionBtn = 'h-10 rounded-xl px-4 text-sm';

/** Flip to true to restore the Areas tab (CountyModal stays in the tree). */
const SHOW_AREAS_TAB = false;

const ALL_TABS: { id: Section; label: string; icon: any }[] = [
  { id: 'counties', label: 'Areas', icon: MapPin },
  { id: 'funding', label: 'Payers', icon: Landmark },
  { id: 'fees', label: 'Fees', icon: Accessibility },
  { id: 'facilities', label: 'Facilities', icon: Building2 },
];

const TABS = SHOW_AREAS_TAB ? ALL_TABS : ALL_TABS.filter(t => t.id !== 'counties');

export const CoverageTab = ({ role }: CoverageTabProps) => {
  const {
    pricing,
    updateRules,
    addCounty,
    updateCounty,
    deleteCounty,
    addMobility,
    updateMobility,
    deleteMobility,
  } = usePricing();

  const canEdit = role !== 'driver';
  const [activeSection, setActiveSection] = useState<Section>(SHOW_AREAS_TAB ? 'counties' : 'funding');
  const [isCountyModalOpen, setIsCountyModalOpen] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<CountyConfig | null>(null);
  const [mapAreaId, setMapAreaId] = useState<string | null>(null);
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
  const zoneId = mapAreaId && counties.some(c => c.id === mapAreaId) ? mapAreaId : counties[0]?.id || null;

  const handleSaveCounty = (data: Omit<CountyConfig, 'id'>) => {
    if (selectedCounty) {
      updateCounty(selectedCounty.id, data);
      toast.success(`Updated ${data.name}`);
    } else {
      addCounty(data);
      toast.success(`Added ${data.name}`);
    }
    setIsCountyModalOpen(false);
    setSelectedCounty(null);
  };

  const handleSaveMobility = (data: Omit<MobilityConfig, 'id'>) => {
    if (selectedMobility) {
      updateMobility(selectedMobility.id, data);
      toast.success(`Updated ${data.name}`);
    } else {
      addMobility(data);
      toast.success(`Added ${data.name}`);
    }
    setIsMobilityModalOpen(false);
    setSelectedMobility(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'county') {
      deleteCounty(deleteTarget.id);
      toast.success(`Removed ${deleteTarget.label}`);
    } else {
      deleteMobility(deleteTarget.id);
      toast.success(`Removed ${deleteTarget.label}`);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-line-2 w-fit flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const on = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`h-10 px-4 flex items-center gap-2 rounded-xl text-sm font-semibold transition-all ${
                on ? 'bg-primary text-white' : 'text-ink-3 hover:text-ink hover:bg-bg'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {SHOW_AREAS_TAB && activeSection === 'counties' && (
        <section className="rounded-xl border border-line-2 bg-white overflow-hidden">
          <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line-2 bg-primary-tint/60">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-primary">
                1
              </span>
              <div>
                <h2 className="text-sm font-semibold text-primary">Service areas</h2>
                <p className="text-xs text-ink-4 mt-0.5">
                  Each area is the geofence. Prices live on Payers.
                </p>
              </div>
            </div>
            {canEdit && (
              <Button
                variant="primary"
                size="md"
                className={actionBtn}
                onClick={() => {
                  setSelectedCounty(null);
                  setIsCountyModalOpen(true);
                }}
              >
                <Plus size={16} /> Add
              </Button>
            )}
          </header>

          <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-4 bg-bg/40">
            <div className="xl:col-span-7 overflow-x-auto rounded-xl border border-line-2 bg-white">
              <table className="w-full text-left">
                <thead className="bg-bg border-b border-line-2">
                  <tr>
                    <th className="px-4 py-3 type-th">Area</th>
                    <th className="px-4 py-3 type-th w-20">State</th>
                    <th className="px-4 py-3 type-th text-center w-28">Status</th>
                    {canEdit && <th className="px-4 py-3 type-th text-center w-24">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {counties.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-ink-4">
                        No areas yet
                      </td>
                    </tr>
                  ) : (
                    counties.map(c => {
                      const fence = resolveFenceLists(c);
                      return (
                      <tr
                        key={c.id}
                        className={`cursor-pointer ${
                          zoneId === c.id ? 'bg-primary/5' : 'hover:bg-bg/40'
                        }`}
                        onClick={() => setMapAreaId(c.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-ink">{c.name}</p>
                          <p className="text-[11px] text-ink-4 mt-0.5">
                            {parsePolygon(c.polygon).length >= 3
                              ? 'Drawn fence'
                              : fence.zipCodes.length > 0
                                ? `${fence.zipCodes.length} ZIPs`
                                : fence.cities.length > 0
                                  ? `${fence.cities.length} cities`
                                  : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-ink-3">{c.state || 'VA'}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              c.status === 'active'
                                ? 'bg-accent-light text-accent'
                                : 'bg-bg text-ink-4'
                            }`}
                          >
                            {c.status === 'active' ? 'On' : 'Off'}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedCounty(c);
                                  setMapAreaId(c.id);
                                  setIsCountyModalOpen(true);
                                }}
                                className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setDeleteTarget({ type: 'county', id: c.id, label: c.name });
                                }}
                                className="p-1.5 text-urgent hover:bg-urgent/10 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="xl:col-span-5">
              <AreaZoneCard
                areas={counties}
                selectedId={zoneId}
                onSelect={setMapAreaId}
                canEdit={canEdit}
                onEdit={() => {
                  const area = counties.find(c => c.id === zoneId) || null;
                  if (!area) return;
                  setSelectedCounty(area);
                  setIsCountyModalOpen(true);
                }}
              />
            </div>
          </div>
        </section>
      )}

      {activeSection === 'funding' && <FundingSourcesPanel />}

      {activeSection === 'fees' && (
        <div className="space-y-6 w-full max-w-2xl">
        <section className="rounded-xl border border-line-2 bg-white overflow-hidden">
          <header className="flex items-start gap-2.5 px-5 py-4 border-b border-line-2 bg-primary-tint/60">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-primary">
              1
            </span>
            <h2 className="text-sm font-semibold text-primary">Trip add-ons</h2>
          </header>
          <div className="p-5">
            <label className="block max-w-xs text-xs font-semibold text-ink-3">
              Extra stop
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-4">$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={!canEdit}
                  value={rules.stopFee}
                  onChange={e => updateRules({ stopFee: num(e.target.value, 0) })}
                  className="input-base h-10 w-full pl-7"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-line-2 bg-white overflow-hidden">
            <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line-2 bg-primary-tint/60">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white bg-primary">
                  2
                </span>
                <h2 className="text-sm font-semibold text-primary">Mobility</h2>
              </div>
              {canEdit && (
                <Button
                  variant="primary"
                  size="md"
                  className={actionBtn}
                  onClick={() => {
                    setSelectedMobility(null);
                    setIsMobilityModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add
                </Button>
              )}
            </header>
            <div className="p-5">
            <div className="rounded-xl border border-line-2 divide-y divide-line-2">
              {mobilityTypes.map(mob => {
                const IconComponent = ICON_MAP[mob.iconKey || 'Accessibility'] || Accessibility;
                return (
                  <div key={mob.id} className="flex items-center gap-3 min-h-12 py-3 px-4">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <IconComponent size={16} className="text-ink-4 shrink-0" />
                      <span className="text-sm font-semibold text-ink truncate">{mob.name}</span>
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm font-semibold text-ink tabular-nums">
                      {mob.fee > 0 ? `+$${Number(mob.fee).toFixed(2)}` : '$0'}
                    </span>
                    {canEdit && (
                      <div className="flex items-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMobility(mob);
                            setIsMobilityModalOpen(true);
                          }}
                          className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ type: 'mobility', id: mob.id, label: mob.name })
                          }
                          className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
        </section>
        </div>
      )}

      {activeSection === 'facilities' && (
        <Card className="p-5">
          <FacilitiesPanel />
        </Card>
      )}

      {SHOW_AREAS_TAB && (
      <CountyModal
        isOpen={isCountyModalOpen}
        county={selectedCounty}
        onClose={() => {
          setIsCountyModalOpen(false);
          setSelectedCounty(null);
        }}
        onSave={handleSaveCounty}
      />
      )}

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
        title={deleteTarget?.type === 'county' ? 'Remove area' : 'Remove mobility'}
        message={
          deleteTarget?.type === 'county'
            ? 'This area will no longer appear on the service map.'
            : 'Existing trips keep their mobility label.'
        }
        itemLabel={deleteTarget?.label}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
