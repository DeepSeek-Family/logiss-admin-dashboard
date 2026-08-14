import { MapPin, Shield, Plus, Trash2 } from 'lucide-react';
import { Card, Badge } from '@/shared/components/ui';
import { usePricing, DEFAULT_PRICING } from '@/hooks/usePricing';

const COUNTIES = ['Chesterfield', 'Henrico', 'Hanover', 'Richmond City', 'Powhatan', 'Goochland'];

interface CoverageTabProps {
  role?: string | null;
}

const num = (v: string, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export const CoverageTab = ({ role }: CoverageTabProps) => {
  const { pricing, setPricing } = usePricing();
  const canEdit = role === 'admin' || role === 'dispatcher';

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-200 space-y-5">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-ink-4">Active Service Counties</p>
          <Badge variant="accent" dot>{COUNTIES.length} Active</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {COUNTIES.map(c => (
            <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg rounded-full border border-line-2 text-xs font-semibold text-ink-2">
              <MapPin size={11} className="text-ink-4" /> {c}
            </span>
          ))}
          {role === 'admin' && (
            <button className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-line rounded-full text-xs text-ink-4 hover:text-primary hover:border-primary/40 transition-colors">
              + Add County
            </button>
          )}
        </div>
        <p className="text-xs text-ink-4 mt-5 flex items-center gap-1.5">
          <Shield size={11} /> Pickup/dropoff text is used to flag inside vs outside until GPS geofence codes are loaded.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-ink">Pricing</p>
          {canEdit && (
            <button
              type="button"
              onClick={() => setPricing({ ...DEFAULT_PRICING, brackets: DEFAULT_PRICING.brackets.map(b => ({ ...b })), items: DEFAULT_PRICING.items.map(i => ({ ...i })) })}
              className="text-xs text-ink-4 hover:text-primary"
            >
              Reset defaults
            </button>
          )}
        </div>
        <p className="text-xs text-ink-4 mb-5">Customer sees only the flat fare. County/government uses brackets and service items. Saved on this console.</p>

        <p className="type-th mb-2">Customer flat fare (per leg)</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <label className="text-xs text-ink-3">
            Inside county
            <input
              type="number" step="0.01" min="0" disabled={!canEdit}
              value={pricing.customerInside}
              onChange={e => setPricing({ ...pricing, customerInside: num(e.target.value, pricing.customerInside) })}
              className="mt-1 w-full h-9 px-3 rounded-lg border border-line-2 text-sm text-ink outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>
          <label className="text-xs text-ink-3">
            Outside county
            <input
              type="number" step="0.01" min="0" disabled={!canEdit}
              value={pricing.customerOutside}
              onChange={e => setPricing({ ...pricing, customerOutside: num(e.target.value, pricing.customerOutside) })}
              className="mt-1 w-full h-9 px-3 rounded-lg border border-line-2 text-sm text-ink outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>
        </div>

        <p className="type-th mb-2">County / government brackets (miles)</p>
        <div className="space-y-2 mb-3">
          {pricing.brackets.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <input type="number" step="0.01" disabled={!canEdit} value={b.min}
                onChange={e => setPricing({ ...pricing, brackets: pricing.brackets.map((row, idx) => idx === i ? { ...row, min: num(e.target.value, row.min) } : row) })}
                className="h-9 px-2 rounded-lg border border-line-2 text-xs text-ink outline-none" placeholder="Min" />
              <input type="number" step="0.01" disabled={!canEdit} value={b.max}
                onChange={e => setPricing({ ...pricing, brackets: pricing.brackets.map((row, idx) => idx === i ? { ...row, max: num(e.target.value, row.max) } : row) })}
                className="h-9 px-2 rounded-lg border border-line-2 text-xs text-ink outline-none" placeholder="Max" />
              <input type="number" step="0.01" disabled={!canEdit} value={b.rate}
                onChange={e => setPricing({ ...pricing, brackets: pricing.brackets.map((row, idx) => idx === i ? { ...row, rate: num(e.target.value, row.rate) } : row) })}
                className="h-9 px-2 rounded-lg border border-line-2 text-xs text-ink outline-none" placeholder="Rate $" />
              {canEdit ? (
                <button type="button" onClick={() => setPricing({ ...pricing, brackets: pricing.brackets.filter((_, idx) => idx !== i) })} className="p-2 text-ink-4 hover:text-urgent">
                  <Trash2 size={14} />
                </button>
              ) : <span />}
            </div>
          ))}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              const last = pricing.brackets[pricing.brackets.length - 1];
              setPricing({ ...pricing, brackets: [...pricing.brackets, { min: last ? last.max + 0.01 : 0, max: (last?.max || 0) + 10, rate: last?.rate || 0 }] });
            }}
            className="text-xs text-primary font-medium inline-flex items-center gap-1 mb-6"
          >
            <Plus size={12} /> Add bracket
          </button>
        )}

        <p className="type-th mb-2 mt-2">County billing items</p>
        <label className="text-xs text-ink-3 block mb-3">
          Pickup fee
          <input
            type="number" step="0.01" min="0" disabled={!canEdit}
            value={pricing.pickupFee}
            onChange={e => setPricing({ ...pricing, pickupFee: num(e.target.value, pricing.pickupFee) })}
            className="mt-1 w-full h-9 px-3 rounded-lg border border-line-2 text-sm text-ink outline-none"
          />
        </label>
        <div className="space-y-2">
          {pricing.items.map((item, i) => (
            <div key={item.id} className="grid grid-cols-[1fr_100px_auto] gap-2 items-center">
              <input
                disabled={!canEdit}
                value={item.label}
                onChange={e => setPricing({ ...pricing, items: pricing.items.map((row, idx) => idx === i ? { ...row, label: e.target.value, id: e.target.value || row.id } : row) })}
                className="h-9 px-3 rounded-lg border border-line-2 text-xs text-ink outline-none"
              />
              <input
                type="number" step="0.01" disabled={!canEdit} value={item.amount}
                onChange={e => setPricing({ ...pricing, items: pricing.items.map((row, idx) => idx === i ? { ...row, amount: num(e.target.value, row.amount) } : row) })}
                className="h-9 px-2 rounded-lg border border-line-2 text-xs text-ink outline-none"
              />
              {canEdit ? (
                <button type="button" onClick={() => setPricing({ ...pricing, items: pricing.items.filter((_, idx) => idx !== i) })} className="p-2 text-ink-4 hover:text-urgent">
                  <Trash2 size={14} />
                </button>
              ) : <span />}
            </div>
          ))}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setPricing({ ...pricing, items: [...pricing.items, { id: `item-${Date.now()}`, label: 'New item', amount: 0 }] })}
            className="text-xs text-primary font-medium inline-flex items-center gap-1 mt-3"
          >
            <Plus size={12} /> Add billing item
          </button>
        )}
      </Card>
    </div>
  );
};
