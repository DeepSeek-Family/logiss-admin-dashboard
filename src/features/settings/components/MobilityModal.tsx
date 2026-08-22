import { useState, useEffect, useRef } from 'react';
import {
  X,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Trash2,
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

export const MobilityModal = ({ isOpen, mobility, onClose, onSave }: MobilityModalProps) => {
  const [form, setForm] = useState({
    name: '',
    fee: 0,
    iconUrl: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobility) {
      setForm({
        name: mobility.name || '',
        fee: mobility.fee != null ? mobility.fee : 0,
        iconUrl: mobility.iconUrl || '',
        description: mobility.description || '',
        status: mobility.status || 'active',
      });
    } else {
      setForm({
        name: '',
        fee: 0,
        iconUrl: '',
        description: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [mobility, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (SVG, PNG, JPG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Icon file size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setForm((prev) => ({
        ...prev,
        iconUrl: result,
      }));
      toast.success('Icon uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = 'Mobility name is required';
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
      iconUrl: form.iconUrl || undefined,
      description: form.description.trim(),
      status: form.status,
    });

    toast.success(mobility ? 'Mobility option updated' : 'Mobility option added');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-line-2">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2 bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Accessibility size={18} />
            </div>
            <div>
              <h2 className="type-section-title">{mobility ? 'Edit Mobility Requirement' : 'Add Mobility Requirement'}</h2>
              <p className="text-xs text-ink-3">Configure rider special equipment and surcharge fee</p>
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
                <span className="absolute left-3 top-2.5 text-ink-4 text-xs font-semibold">$</span>
                <input
                  type="number"
                  step="1.00"
                  min="0"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value) || 0 })}
                  className="input-base w-full pl-7 font-bold text-ink"
                />
              </div>
            </div>
          </div>

          {/* Icon Upload (Direct & Pure) */}
          <div>
            <label className="type-label block text-ink-3 mb-1.5">
              Upload Icon
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {form.iconUrl ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-line-2 bg-bg/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-line-2 flex items-center justify-center p-2 shadow-xs">
                    <img src={form.iconUrl} alt="Uploaded Icon" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">Custom Icon Loaded</p>
                    <p className="text-xs text-ink-4">SVG, PNG, or WebP</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <button
                    type="button"
                    title="Remove Icon"
                    onClick={() => setForm({ ...form, iconUrl: '' })}
                    className="p-2 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-line-2 hover:border-primary/50 bg-bg/30 hover:bg-primary/5 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-line-2 flex items-center justify-center text-ink-3 group-hover:text-primary group-hover:border-primary/30 transition-all shadow-xs">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                    Click to upload icon or drag & drop
                  </p>
                  <p className="text-xs text-ink-4">
                    Supports SVG, PNG, or JPG (Max 2MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Switch Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-line-2 bg-bg/40">
            <div>
              <p className="text-xs font-semibold text-ink">Service Status</p>
              <p className="text-xs text-ink-4">
                {form.status === 'active' ? 'Active (Available in booking forms)' : 'Inactive (Disabled / Hidden)'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.status === 'active'}
              onClick={() => setForm({ ...form, status: form.status === 'active' ? 'inactive' : 'active' })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.status === 'active' ? 'bg-primary' : 'bg-line-2'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
