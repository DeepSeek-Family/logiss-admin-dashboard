import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, DollarSign, GripVertical } from 'lucide-react';
import { Badge } from '@/shared/components/ui';

const DEFAULT_SOURCES = [
  { id: 1, name: 'Medicaid - VA', type: 'Government', active: true },
  { id: 2, name: 'Medicare', type: 'Government', active: true },
  { id: 3, name: 'Chesterfield County', type: 'County', active: true },
  { id: 4, name: 'Henrico County', type: 'County', active: true },
  { id: 5, name: 'Richmond City', type: 'Municipal', active: true },
  { id: 6, name: 'Hanover County', type: 'County', active: true },
  { id: 7, name: 'Self-Pay', type: 'Private', active: true },
  { id: 8, name: 'Insurance', type: 'Private', active: true },
  { id: 9, name: 'Facility Paid', type: 'Facility', active: true },
  { id: 10, name: 'DSS', type: 'Government', active: true },
];

const TYPE_OPTIONS = ['Government', 'County', 'Municipal', 'Private', 'Facility', 'Other'];

const typeBadgeVariant: Record<string, string> = {
  Government: 'primary',
  County: 'accent',
  Municipal: 'bg',
  Private: 'bg',
  Facility: 'bg',
  Other: 'bg',
};

interface Source {
  id: number;
  name: string;
  type: string;
  active: boolean;
}

export const FundingSourcesPanel = () => {
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Government');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const startEdit = (source: Source) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditType(source.type);
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    setSources(prev =>
      prev.map(s => s.id === editingId ? { ...s, name: editName.trim(), type: editType } : s)
    );
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const toggleActive = (id: number) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteSource = (id: number) => {
    setSources(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
  };

  const addSource = () => {
    if (!newName.trim()) return;
    const newSource: Source = {
      id: Date.now(),
      name: newName.trim(),
      type: newType,
      active: true,
    };
    setSources(prev => [...prev, newSource]);
    setNewName('');
    setNewType('Government');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Funding Sources</p>
          <p className="text-xs text-ink-4 mt-0.5">
            {sources.filter(s => s.active).length} active · {sources.filter(s => !s.active).length} disabled
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Add Source
        </button>
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">New Funding Source</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-ink-4 uppercase mb-1 block">Source Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSource()}
                placeholder="e.g. Powhatan County"
                autoFocus
                className="w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="w-40">
              <label className="text-[10px] font-semibold text-ink-4 uppercase mb-1 block">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              >
                {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-3 hover:text-ink rounded-lg border border-line-2 bg-white transition-colors"
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={addSource}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={13} /> Add Source
            </button>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="rounded-2xl border border-line-2 overflow-hidden divide-y divide-line-2/50">
        {/* Column Header */}
        <div className="grid grid-cols-12 px-4 py-2.5 bg-bg text-[10px] font-bold text-ink-4 uppercase tracking-wider">
          <div className="col-span-1" />
          <div className="col-span-5">Source Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {sources.length === 0 && (
          <div className="py-10 text-center">
            <DollarSign size={24} className="text-ink-4 mx-auto mb-2" />
            <p className="text-sm font-semibold text-ink-4">No funding sources yet</p>
          </div>
        )}

        {sources.map(source => (
          <div
            key={source.id}
            className={`grid grid-cols-12 items-center px-4 py-3 group transition-colors ${editingId === source.id ? 'bg-primary/5' : 'hover:bg-bg/50'} ${!source.active ? 'opacity-50' : ''}`}
          >
            {/* Drag handle placeholder */}
            <div className="col-span-1 flex items-center">
              <GripVertical size={14} className="text-line-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Name */}
            <div className="col-span-5 pr-4">
              {editingId === source.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                  className="w-full text-sm font-medium text-ink border border-primary rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign size={13} className="text-ink-4 shrink-0" />
                  <span className="text-sm font-medium text-ink truncate">{source.name}</span>
                </div>
              )}
            </div>

            {/* Type */}
            <div className="col-span-2">
              {editingId === source.id ? (
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  className="text-xs font-medium text-ink border border-line-2 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary"
                >
                  {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              ) : (
                <Badge variant={typeBadgeVariant[source.type] as any} className="text-[9px]">
                  {source.type}
                </Badge>
              )}
            </div>

            {/* Status Toggle */}
            <div className="col-span-2 flex justify-center">
              {editingId === source.id ? null : (
                <button
                  onClick={() => toggleActive(source.id)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${source.active ? 'bg-accent' : 'bg-line-2'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${source.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-1">
              {editingId === source.id ? (
                <>
                  <button onClick={saveEdit} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEdit} className="p-1.5 text-ink-4 hover:bg-bg rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(source)}
                    className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil size={13} />
                  </button>
                  {deleteConfirmId === source.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteSource(source.id)} className="px-2 py-1 text-[10px] font-bold text-white bg-urgent rounded-lg">Delete</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-[10px] font-semibold text-ink-4 border border-line-2 rounded-lg bg-white">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(source.id)}
                      className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-ink-4 text-center">
        Changes sync to Booking Form, Trip History, and Reports immediately.
      </p>
    </div>
  );
};
