import { useState } from 'react';
import { Plus, Pencil, Check, X, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import {
  useGetFacilitiesQuery,
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
  type FacilityType,
  type IFacility,
} from '@/redux/api/coverageApi';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';
import toast from 'react-hot-toast';

const actionBtn = 'h-10 rounded-xl px-4 text-sm';
const controlClass =
  'h-10 box-border w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

const TYPE_OPTIONS: { label: string; value: FacilityType }[] = [
  { label: 'Hospital', value: 'hospital' },
  { label: 'Clinic', value: 'clinic' },
  { label: 'Program', value: 'program' },
  { label: 'Nursing home', value: 'nursingHome' },
  { label: 'Other', value: 'other' },
];

const typeLabel = (type: string) =>
  TYPE_OPTIONS.find(o => o.value === type)?.label || type;

const typeBadgeVariant: Record<string, string> = {
  hospital: 'primary',
  nursingHome: 'accent',
  program: 'warning',
  clinic: 'bg',
  other: 'bg',
};

interface FacilitiesPanelProps {
  canEdit?: boolean;
}

export const FacilitiesPanel = ({ canEdit = true }: FacilitiesPanelProps) => {
  const { data, isLoading, isError, error, refetch } = useGetFacilitiesQuery();
  const [createFacility, { isLoading: isCreating }] = useCreateFacilityMutation();
  const [updateFacility, { isLoading: isUpdating }] = useUpdateFacilityMutation();

  const items = (data?.data || []).filter(f => !f.isDeleted);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<FacilityType>('hospital');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<FacilityType>('hospital');

  const startEdit = (f: IFacility) => {
    setEditingId(f._id);
    setEditName(f.name);
    setEditType(f.type);
    setShowAddForm(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateFacility({
        id: editingId,
        body: { name: editName.trim(), type: editType },
      }).unwrap();
      toast.success('Facility updated');
      setEditingId(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update facility'));
    }
  };

  const addItem = async () => {
    if (!newName.trim()) return;
    try {
      await createFacility({ name: newName.trim(), type: newType }).unwrap();
      toast.success('Facility created');
      setNewName('');
      setNewType('hospital');
      setShowAddForm(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create facility'));
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-ink-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading facilities…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="text-urgent opacity-60" size={32} />
        <p className="text-sm text-ink-3">{apiErrorMessage(error, 'Failed to load facilities')}</p>
        <button type="button" onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  const busy = isCreating || isUpdating;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="type-section-title">Facilities</h2>
        {canEdit && (
          <Button
            variant="primary"
            size="md"
            className={actionBtn}
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            disabled={busy}
          >
            <Plus size={16} /> Add
          </Button>
        )}
      </div>

      {showAddForm && canEdit && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">New Facility / Program</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-ink-4 uppercase mb-1.5 block">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="e.g. Chippenham Medical Center"
                autoFocus
                className={controlClass}
              />
            </div>
            <div className="w-52">
              <label className="text-xs font-semibold text-ink-4 uppercase mb-1.5 block">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value as FacilityType)} className={controlClass}>
                {TYPE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowAddForm(false); setNewName(''); }} className="h-10 flex items-center gap-1.5 px-4 text-sm font-semibold text-ink-3 border border-line-2 rounded-xl bg-white">
              <X size={16} /> Cancel
            </button>
            <button type="button" onClick={addItem} disabled={!newName.trim() || busy} className="h-10 flex items-center gap-1.5 px-4 text-sm font-semibold text-white bg-primary rounded-xl disabled:opacity-40">
              <Check size={16} /> Add
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line-2 overflow-hidden divide-y divide-line-2/50">
        <div className="grid grid-cols-12 px-4 py-3 bg-bg/60 text-xs font-semibold text-ink-3 border-b border-line-2">
          <div className="col-span-7">Facility / Program</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.length === 0 && (
          <div className="py-10 text-center">
            <Building2 size={24} className="text-ink-4 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink-4">No facilities yet</p>
          </div>
        )}

        {items.map(f => (
          <div
            key={f._id}
            className={`grid grid-cols-12 items-center px-4 py-3 group transition-colors ${editingId === f._id ? 'bg-primary/5' : 'hover:bg-bg/50'} ${f.status === false ? 'opacity-50' : ''}`}
          >
            <div className="col-span-7 pr-4">
              {editingId === f._id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  autoFocus
                  className="w-full text-sm font-medium text-ink border border-primary rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-ink-4 shrink-0" />
                  <span className="text-sm font-medium text-ink truncate">{f.name}</span>
                </div>
              )}
            </div>
            <div className="col-span-3">
              {editingId === f._id ? (
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as FacilityType)}
                  className="text-xs font-medium text-ink border border-line-2 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary"
                >
                  {TYPE_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={typeBadgeVariant[f.type] as any} className="text-xs">{typeLabel(f.type)}</Badge>
              )}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              {canEdit && (editingId === f._id ? (
                <>
                  <button type="button" onClick={saveEdit} disabled={busy} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-ink-4 hover:bg-bg rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => startEdit(f)} className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Pencil size={13} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
