import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Building2 } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import { useFacilities, type Facility } from '@/hooks/useFacilities';

const actionBtn = 'h-10 rounded-xl px-4 text-sm';
const controlClass =
  'h-10 box-border w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

const TYPE_OPTIONS = ['Hospital', 'Nursing Home', 'Program', 'Clinic', 'Other'];

const typeBadgeVariant: Record<string, string> = {
  Hospital: 'primary',
  'Nursing Home': 'accent',
  Program: 'warning',
  Clinic: 'bg',
  Other: 'bg',
};

export const FacilitiesPanel = () => {
  const { facilities: items, setFacilities: setItems } = useFacilities();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Hospital');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const startEdit = (f: Facility) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditType(f.type);
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    setItems(prev => prev.map(f => f.id === editingId ? { ...f, name: editName.trim(), type: editType } : f));
    setEditingId(null);
  };

  const toggleActive = (id: number) => setItems(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  const deleteItem = (id: number) => { setItems(prev => prev.filter(f => f.id !== id)); setDeleteConfirmId(null); };

  const addItem = () => {
    if (!newName.trim()) return;
    setItems(prev => [...prev, { id: Date.now(), name: newName.trim(), type: newType, active: true }]);
    setNewName('');
    setNewType('Hospital');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="type-section-title">Facilities</h2>
        <Button
          variant="primary"
          size="md"
          className={actionBtn}
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
        >
          <Plus size={16} /> Add
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">New Facility / Program</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-ink-4 uppercase mb-1.5 block">Name</label>
              <input
                type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder="e.g. St. Francis Medical Center" autoFocus
                className={controlClass}
              />
            </div>
            <div className="w-52">
              <label className="text-xs font-semibold text-ink-4 uppercase mb-1.5 block">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)} className={controlClass}>
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowAddForm(false); setNewName(''); }} className="h-10 flex items-center gap-1.5 px-4 text-sm font-semibold text-ink-3 border border-line-2 rounded-xl bg-white"><X size={16} /> Cancel</button>
            <button type="button" onClick={addItem} disabled={!newName.trim()} className="h-10 flex items-center gap-1.5 px-4 text-sm font-semibold text-white bg-primary rounded-xl disabled:opacity-40"><Check size={16} /> Add</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line-2 overflow-hidden divide-y divide-line-2/50">
        <div className="grid grid-cols-12 px-4 py-3 bg-bg/60 text-xs font-semibold text-ink-3 border-b border-line-2">
          <div className="col-span-6">Facility / Program</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.length === 0 && (
          <div className="py-10 text-center">
            <Building2 size={24} className="text-ink-4 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink-4">No facilities yet</p>
          </div>
        )}

        {items.map(f => (
          <div key={f.id} className={`grid grid-cols-12 items-center px-4 py-3 group transition-colors ${editingId === f.id ? 'bg-primary/5' : 'hover:bg-bg/50'} ${!f.active ? 'opacity-50' : ''}`}>
            <div className="col-span-6 pr-4">
              {editingId === f.id ? (
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }} autoFocus className="w-full text-sm font-medium text-ink border border-primary rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/10" />
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-ink-4 shrink-0" />
                  <span className="text-sm font-medium text-ink truncate">{f.name}</span>
                </div>
              )}
            </div>
            <div className="col-span-2">
              {editingId === f.id ? (
                <select value={editType} onChange={e => setEditType(e.target.value)} className="text-xs font-medium text-ink border border-line-2 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary">
                  {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              ) : (
                <Badge variant={typeBadgeVariant[f.type] as any} className="text-xs">{f.type}</Badge>
              )}
            </div>
            <div className="col-span-2 flex justify-center">
              {editingId === f.id ? null : (
                <button onClick={() => toggleActive(f.id)} className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${f.active ? 'bg-accent' : 'bg-line-2'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${f.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              )}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              {editingId === f.id ? (
                <>
                  <button onClick={saveEdit} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-ink-4 hover:bg-bg rounded-lg transition-colors"><X size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(f)} className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Pencil size={13} /></button>
                  {deleteConfirmId === f.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteItem(f.id)} className="px-2 py-1 text-xs font-bold text-white bg-urgent rounded-lg">Delete</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs font-semibold text-ink-4 border border-line-2 rounded-lg bg-white">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(f.id)} className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
