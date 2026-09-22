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
import type { MobilityModalItem } from './MobilityFeesSection';
import toast from 'react-hot-toast';

export interface MobilitySavePayload {
  name: string;
  price: number;
  imageFile?: File;
}

interface MobilityModalProps {
  isOpen: boolean;
  mobility: MobilityModalItem | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (data: MobilitySavePayload) => void | Promise<void>;
}

export const MobilityModal = ({ isOpen, mobility, saving = false, onClose, onSave }: MobilityModalProps) => {
  const [form, setForm] = useState({
    name: '',
    price: 0,
    iconPreview: '',
  });
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobility) {
      setForm({
        name: mobility.name || '',
        price: mobility.price != null ? mobility.price : 0,
        iconPreview: mobility.iconUrl || '',
      });
    } else {
      setForm({ name: '', price: 0, iconPreview: '' });
    }
    setImageFile(undefined);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [mobility, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Icon file size must be under 2MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(prev => ({ ...prev, iconPreview: (e.target?.result as string) || '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!form.name.trim()) newErrors.name = 'Mobility name is required';
    if (form.price < 0) newErrors.price = 'Fee cannot be negative';
    if (!mobility && !imageFile) newErrors.image = 'Icon image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({
      name: form.name.trim(),
      price: Number(form.price),
      imageFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-line-2">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2 bg-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Accessibility size={18} />
            </div>
            <div>
              <h2 className="type-section-title">{mobility ? 'Edit Mobility Requirement' : 'Add Mobility Requirement'}</h2>
              <p className="text-xs text-ink-3">Name, surcharge fee, and icon (uploaded as image)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-4 hover:text-ink hover:bg-bg rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="type-label block text-ink-3 mb-1.5">Requirement Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="e.g. Ambulatory"
                className={`input-base w-full ${errors.name ? 'border-urgent focus:ring-urgent/20' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="type-label block text-ink-3 mb-1.5">Surcharge Fee ($) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-ink-4 text-xs font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className="input-base w-full pl-7 font-bold text-ink"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="type-label block text-ink-3 mb-1.5">
              Icon image {!mobility && '*'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />

            {form.iconPreview ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-line-2 bg-bg/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-line-2 flex items-center justify-center p-2 shadow-xs">
                    <img src={form.iconPreview} alt="Icon preview" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{imageFile ? imageFile.name : 'Current icon'}</p>
                    <p className="text-xs text-ink-4">Sent as form field &quot;image&quot;</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Replace
                  </Button>
                  <button
                    type="button"
                    title="Remove Icon"
                    onClick={() => {
                      setImageFile(undefined);
                      setForm(prev => ({ ...prev, iconPreview: mobility?.iconUrl || '' }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
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
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group ${
                  errors.image ? 'border-urgent bg-urgent/5' : 'border-line-2 hover:border-primary/50 bg-bg/30 hover:bg-primary/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-line-2 flex items-center justify-center text-ink-3 group-hover:text-primary group-hover:border-primary/30 transition-all shadow-xs">
                  <UploadCloud size={20} />
                </div>
                <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                  Click to upload icon or drag & drop
                </p>
                <p className="text-xs text-ink-4">PNG or JPG (max 2MB) — same as Postman &quot;image&quot; field</p>
              </div>
            )}
            {errors.image && (
              <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.image}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              <CheckCircle2 size={16} className="mr-1.5" />
              {saving ? 'Saving…' : mobility ? 'Save Changes' : 'Add Mobility'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
