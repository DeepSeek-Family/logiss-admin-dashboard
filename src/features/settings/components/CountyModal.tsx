import { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { CountyConfig } from '@/hooks/usePricing';
import toast from 'react-hot-toast';

interface CountyModalProps {
  isOpen: boolean;
  county: CountyConfig | null;
  onClose: () => void;
  onSave: (data: Omit<CountyConfig, 'id'>) => void;
}

export const CountyModal = ({ isOpen, county, onClose, onSave }: CountyModalProps) => {
  const [form, setForm] = useState({
    name: '',
    state: 'VA',
    localFare: 10,
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (county) {
      setForm({
        name: county.name || '',
        state: county.state || 'VA',
        localFare: county.localFare != null ? county.localFare : 10,
        status: county.status || 'active',
        notes: county.notes || '',
      });
    } else {
      setForm({
        name: '',
        state: 'VA',
        localFare: 10,
        status: 'active',
        notes: '',
      });
    }
    setErrors({});
  }, [county, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = 'County name is required';
    }
    if (form.localFare < 0) {
      newErrors.localFare = 'Local base fare cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: form.name.trim(),
      state: form.state.trim().toUpperCase(),
      localFare: Number(form.localFare),
      status: form.status,
      notes: form.notes.trim(),
    });

    toast.success(county ? 'County updated successfully' : 'County added successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-line-2">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2 bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="type-section-title">{county ? 'Edit Service County' : 'Add New Service County'}</h2>
              <p className="text-xs text-ink-3">Configure regional territory and base local fare rate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-4 hover:text-ink hover:bg-bg rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="type-label block text-ink-3 mb-1.5">
                County / City Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="e.g. Chesterfield County"
                className={`input-base w-full ${errors.name ? 'border-urgent focus:ring-urgent/20' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="type-label block text-ink-3 mb-1.5">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="VA"
                maxLength={3}
                className="input-base w-full uppercase"
              />
            </div>
          </div>

          {/* Local Base Rate */}
          <div className="p-4 rounded-xl bg-bg/60 border border-line-2 space-y-2">
            <label className="text-xs font-medium text-ink block">
              Local County Base Fare ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-ink-4 text-xs font-semibold">$</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={form.localFare}
                onChange={(e) => setForm({ ...form, localFare: parseFloat(e.target.value) || 0 })}
                className="input-base w-full pl-7 font-semibold text-ink"
              />
            </div>
            <p className="text-xs text-ink-4">
              Standard local transit copay for trips originating within this county.
            </p>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="type-label block text-ink-3 mb-1.5">
                Service Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                className="input-base w-full cursor-pointer"
              >
                <option value="active">Active (In Service)</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>

            <div>
              <label className="type-label block text-ink-3 mb-1.5">
                Internal Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional region note..."
                className="input-base w-full"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <CheckCircle2 size={16} className="mr-1.5" />
              {county ? 'Save Changes' : 'Add County'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
