import { useState, useEffect } from 'react';
import {
  X,
  Accessibility,
  Bed,
  Disc,
  Zap,
  User,
  Info,
  HeartPulse,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { MobilityConfig } from '@/hooks/usePricing';
import toast from 'react-hot-toast';

interface MobilityModalProps {
  isOpen: boolean;
  mobility: MobilityConfig | null;
  onClose: () => void;
  onSave: (data: Omit<MobilityConfig, 'id'>) => void;
}

const AVAILABLE_ICONS = [
  { key: 'User', label: 'Ambulatory', icon: User },
  { key: 'Accessibility', label: 'Wheelchair', icon: Accessibility },
  { key: 'Bed', label: 'Stretcher', icon: Bed },
  { key: 'Disc', label: 'Walker', icon: Disc },
  { key: 'Zap', label: 'Rollator', icon: Zap },
  { key: 'Info', label: 'Cane', icon: Info },
  { key: 'HeartPulse', label: 'Medical', icon: HeartPulse },
  { key: 'Shield', label: 'Special Care', icon: Shield },
  { key: 'Activity', label: 'Assisted', icon: Activity },
];

export const MobilityModal = ({ isOpen, mobility, onClose, onSave }: MobilityModalProps) => {
  const [form, setForm] = useState({
    name: '',
    fee: 0,
    iconKey: 'Accessibility',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (mobility) {
      setForm({
        name: mobility.name || '',
        fee: mobility.fee != null ? mobility.fee : 0,
        iconKey: mobility.iconKey || 'Accessibility',
        description: mobility.description || '',
        status: mobility.status || 'active',
      });
    } else {
      setForm({
        name: '',
        fee: 0,
        iconKey: 'Accessibility',
        description: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [mobility, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = 'Mobility requirement name is required';
    }
    if (form.fee < 0) {
      newErrors.fee = 'Fee cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: form.name.trim(),
      fee: Number(form.fee),
      iconKey: form.iconKey,
      description: form.description.trim(),
      status: form.status,
    });

    toast.success(mobility ? 'Mobility option updated successfully' : 'Mobility option added successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-line-2">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2 bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Accessibility size={18} />
            </div>
            <div>
              <h2 className="type-section-title">{mobility ? 'Edit Mobility Requirement' : 'Add Mobility Requirement'}</h2>
              <p className="text-xs text-ink-3">Configure rider special equipment and extra surcharge fee</p>
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
                Requirement Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="e.g. Bariatric Wheelchair"
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
                Surcharge Fee ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-ink-4 text-xs font-semibold">$</span>
                <input
                  type="number"
                  step="1.00"
                  min="0"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value) || 0 })}
                  className="input-base w-full pl-7"
                />
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="type-label block text-ink-3 mb-1.5">
              Select Icon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = form.iconKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setForm({ ...form, iconKey: item.key })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                        : 'border-line-2 bg-bg/50 text-ink-3 hover:border-line hover:text-ink'
                    }`}
                  >
                    <IconComp size={15} className={isSelected ? 'text-primary' : 'text-ink-4'} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="type-label block text-ink-3 mb-1.5">
              Equipment / Driver Requirements
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Requires vehicle with hydraulic lift and 2 tie-down straps..."
              className="input-base w-full resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="type-label block text-ink-3 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              className="input-base w-full cursor-pointer"
            >
              <option value="active">Active (Available for selection)</option>
              <option value="inactive">Inactive (Hidden from booking form)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <CheckCircle2 size={16} className="mr-1.5" />
              {mobility ? 'Save Changes' : 'Add Mobility'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
