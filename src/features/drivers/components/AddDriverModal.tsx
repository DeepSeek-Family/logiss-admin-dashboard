import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X, AlertTriangle, Check, UploadCloud, Eye, EyeOff, ShieldCheck, FileText, KeyRound } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import {
  DRIVER_EXPERIENCE_OPTIONS,
  DRIVER_LICENSE_CLASS_OPTIONS,
  normalizeContact,
  normalizeDriverExperience,
  normalizeLicenseClass,
  type ICreateDriverInput,
} from '@/features/drivers/utils/createDriverForm';
import type { DriverExperience, DriverLicenseClass } from '@/redux/api/driversApi';

type LicensePhotoState = {
  file: File;
  name: string;
  size: string;
  previewUrl?: string;
};

interface AddDriverModalProps {
  onClose: () => void;
  onSave: (data: ICreateDriverInput) => Promise<void>;
  saving?: boolean;
}

export const AddDriverModal = ({ onClose, onSave, saving = false }: AddDriverModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    middleName: '',
    dob: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    experience: '1-3 years' as DriverExperience,
    licenseNumber: '',
    licenseExpiry: '',
    licenseClass: 'C' as DriverLicenseClass,
    licensePhotos: [] as LicensePhotoState[],
  });

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);

  const set = (key: string, val: any) => setForm((prev: any) => ({ ...prev, [key]: val }));

  const validateStep = (): string => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.dob) {
        return 'Please fill in all required personal information fields.';
      }
      if (!normalizeContact(form.phone)) {
        return 'Enter a valid contact number, for example +8801712345678.';
      }
      if (!form.password) return 'Password is required.';
      if (form.password.length < 6) return 'Password must be at least 6 characters.';
      return '';
    }
    if (step === 2) {
      if (!form.licenseNumber?.trim()) return 'License number is required.';
      if (!form.licenseExpiry) return 'License expiry date is required.';
      if (!normalizeDriverExperience(form.experience)) return 'Please select a valid driving experience.';
      if (!form.licensePhotos?.length) return 'Please upload at least one license photo.';
      return '';
    }
    if (step === 3) {
      if (!confirmedCheckbox) {
        return 'You must confirm that your information is accurate to submit.';
      }
      return '';
    }
    return '';
  };

  const addLicenseFiles = (files: File[]) => {
    const current: LicensePhotoState[] = form.licensePhotos || [];
    const room = 3 - current.length;
    if (room <= 0) {
      setStepError('You can upload up to 3 license images.');
      return;
    }
    const next = files.slice(0, room);
    const tooBig = next.find((file) => file.size > 10 * 1024 * 1024);
    if (tooBig) {
      setStepError('Each license file must be under 10MB.');
      return;
    }
    setStepError('');
    set('licensePhotos', [
      ...current,
      ...next.map((file) => ({
        file,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      })),
    ]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addLicenseFiles(files);
    e.target.value = '';
  };

  const removeLicensePhoto = (index: number) => {
    const current: LicensePhotoState[] = form.licensePhotos || [];
    const removed = current[index];
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    set('licensePhotos', current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const errorMsg = validateStep();
    if (errorMsg) {
      setStepError(errorMsg);
      return;
    }

    const licenseImages = ((form.licensePhotos || []) as LicensePhotoState[]).map((item) => item.file).slice(0, 3);
    if (licenseImages.length === 0) {
      setStepError('Please upload at least one license photo.');
      return;
    }

    const contact = normalizeContact(form.phone);
    if (!contact) {
      setStepError('Enter a valid contact number, for example +8801712345678.');
      return;
    }
    if (!form.password?.trim()) {
      setStepError('Password is required.');
      return;
    }

    setStepError('');
    try {
      await onSave({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName?.trim() || undefined,
        dateOfBirth: form.dob,
        contact,
        email: form.email.trim(),
        password: form.password.trim(),
        driverExperience: normalizeDriverExperience(form.experience) || '1-3 years',
        licenseNumber: form.licenseNumber.trim(),
        licenseClass: normalizeLicenseClass(form.licenseClass),
        expirationDate: form.licenseExpiry,
        licenseImages,
      });
    } catch {
      // Parent shows toast; keep modal open for corrections
    }
  };

  const steps = ['Personal Information', 'Driver\'s License', 'Review & Submit'];

  return createPortal(
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-line-2">
        {/* Header */}
        <div className="px-6 py-5 border-b border-line-2 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-light rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">Create Driver Account</h2>
                <p className="text-xs text-ink-4">Step {step} of 3 — {steps[step - 1]}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg text-ink-4 transition-all hover:rotate-90">
              <X size={18} />
            </button>
          </div>
          
          {/* Custom Sleek Stepper */}
          <div className="flex gap-2.5 mt-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step > i 
                      ? 'bg-primary shadow-[0_0_12px_rgba(41,105,205,0.4)]' 
                      : 'bg-line-2'
                  }`} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">First Name *</label>
                  <input 
                    className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                    value={form.firstName} 
                    onChange={e => set('firstName', e.target.value)} 
                    placeholder="David" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">Last Name *</label>
                  <input 
                    className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                    value={form.lastName} 
                    onChange={e => set('lastName', e.target.value)} 
                    placeholder="Wilson" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Middle Name (Optional)</label>
                <input 
                  className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                  value={form.middleName} 
                  onChange={e => set('middleName', e.target.value)} 
                  placeholder="Middle name or initial" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">Date of Birth *</label>
                  <input 
                    type="date" 
                    className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                    value={form.dob} 
                    onChange={e => set('dob', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">Phone *</label>
                  <input 
                    className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                    value={form.phone} 
                    onChange={e => set('phone', e.target.value)} 
                    placeholder="+8801712345678" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Email Address *</label>
                <input 
                  type="email" 
                  className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                  value={form.email} 
                  onChange={e => set('email', e.target.value)} 
                  placeholder="d.wilson@email.com" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-bg border border-line-2 rounded-xl pl-4 pr-10 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Set a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Driver's license */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Years of driving experience *</label>
                <select 
                  className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all appearance-none cursor-pointer focus:bg-white" 
                  value={form.experience} 
                  onChange={e => set('experience', e.target.value)}
                >
                  {DRIVER_EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">License number *</label>
                  <input 
                    className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white uppercase" 
                    value={form.licenseNumber} 
                    onChange={e => set('licenseNumber', e.target.value)} 
                    placeholder="DL-VA-XXXXX" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 mb-1.5">License class *</label>
                  <select 
                    className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all appearance-none cursor-pointer focus:bg-white" 
                    value={form.licenseClass} 
                    onChange={e => set('licenseClass', e.target.value)}
                  >
                    {DRIVER_LICENSE_CLASS_OPTIONS.map((option) => (
                      <option key={option} value={option}>Class {option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Expiry date *</label>
                <input 
                  type="date" 
                  className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all focus:bg-white" 
                  value={form.licenseExpiry} 
                  onChange={e => set('licenseExpiry', e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">License photos * <span className="font-medium text-ink-4">(up to 3)</span></label>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="driver-license-file"
                />

                {(form.licensePhotos || []).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {(form.licensePhotos as LicensePhotoState[]).map((photo, index) => (
                      <div key={`${photo.name}-${index}`} className="p-3 bg-accent-light/10 border border-accent/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {photo.previewUrl ? (
                            <img src={photo.previewUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-line-2 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center text-accent shrink-0">
                              <FileText size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{photo.name}</p>
                            <p className="text-xs text-ink-4">{photo.size}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeLicensePhoto(index)} className="text-xs font-semibold text-urgent hover:underline shrink-0">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(form.licensePhotos || []).length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 bg-bg border-2 border-dashed border-line-2 rounded-2xl text-center cursor-pointer hover:bg-white hover:border-primary transition-all group"
                  >
                    <UploadCloud size={28} className="mx-auto text-ink-4 mb-2 group-hover:text-primary transition-all" />
                    <p className="text-xs font-semibold text-ink">Add license image ({(form.licensePhotos || []).length}/3)</p>
                    <p className="text-xs text-ink-4 mt-0.5">JPEG, PNG, or WebP (max 10MB each)</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Personal Info Recap */}
              <div className="p-4 bg-bg rounded-2xl border border-line-2 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-ink-4 uppercase tracking-[0.05em]">Personal Information</h3>
                  <button 
                    onClick={() => { setStepError(''); setStep(1); }} 
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <p className="text-ink-4">Full name</p>
                    <p className="font-semibold text-ink">{`${form.firstName} ${form.middleName ? form.middleName + ' ' : ''}${form.lastName}`}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">Date of birth</p>
                    <p className="font-semibold text-ink">{form.dob ? new Date(form.dob).toLocaleDateString() : '---'}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">Phone</p>
                    <p className="font-semibold text-ink">{form.phone}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">Email</p>
                    <p className="font-semibold text-ink truncate">{form.email}</p>
                  </div>
                  <div className="col-span-2 pt-2 mt-1 border-t border-line-2">
                    <p className="text-ink-4 mb-1">Account setup</p>
                    <div className="flex items-center gap-1.5">
                      <KeyRound size={11} className="text-accent" />
                      <p className="font-semibold text-accent">Password will be set</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Recap */}
              <div className="p-4 bg-bg rounded-2xl border border-line-2 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-ink-4 uppercase tracking-[0.05em]">Driver's license</h3>
                  <button 
                    onClick={() => { setStepError(''); setStep(2); }} 
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div>
                    <p className="text-ink-4">Experience</p>
                    <p className="font-semibold text-ink">{form.experience}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">License number</p>
                    <p className="font-semibold text-ink uppercase ">{form.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">Expiry</p>
                    <p className="font-semibold text-ink">{form.licenseExpiry ? new Date(form.licenseExpiry).toLocaleDateString() : '---'}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">Class</p>
                    <p className="font-semibold text-ink">{form.licenseClass}</p>
                  </div>
                  <div className="col-span-2 pt-1">
                    <p className="text-ink-4 mb-1">Photo</p>
                    <div className="flex items-center gap-1.5 text-accent font-semibold">
                      <Check size={12} strokeWidth={3} />
                      <span>{(form.licensePhotos || []).length} image{(form.licensePhotos || []).length === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="p-4 bg-primary-light/10 border border-primary/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-ink leading-relaxed">What happens after you submit</h4>
                <div className="space-y-2.5 text-xs text-ink-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-white border border-line rounded-lg flex items-center justify-center font-bold text-primary shrink-0">1</span>
                    <p className="leading-normal">
                      <><strong className="text-ink">Account created</strong><br />The driver logs in with the email and password you set.</>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-white border border-line rounded-lg flex items-center justify-center font-bold text-primary shrink-0">2</span>
                    <p className="leading-normal"><strong className="text-ink">Document & background check</strong><br />Our team reviews the submitted license and driving record.</p>
                  </div>
                </div>
                <p className="text-xs text-ink-4 pl-7">Typically 3-5 business days. You'll receive an email either way.</p>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer p-1">
                <input 
                  type="checkbox" 
                  checked={confirmedCheckbox}
                  onChange={e => setConfirmedCheckbox(e.target.checked)}
                  className="mt-1 rounded border-line-2 text-primary focus:ring-primary focus:ring-offset-2 shrink-0 cursor-pointer w-4 h-4"
                />
                <span className="text-xs font-medium text-ink-3 leading-relaxed select-none">
                  I confirm that the information provided is accurate and authorize LOGGIS to verify their documents, driving record, and background.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Error Messaging */}
        {stepError && (
          <div className="mx-6 mb-4 px-4 py-3 bg-urgent-light rounded-xl border border-urgent/20 text-xs font-semibold text-urgent flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle size={14} className="shrink-0" /> 
            <span>{stepError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-line-2 bg-bg/30 flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-semibold text-ink-4 hover:text-ink transition-colors">Cancel</button>
          
          <div className="flex gap-3">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => { setStepError(''); setStep(s => s - 1); }}
              >
                Previous
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                variant="primary"
                disabled={saving}
                onClick={() => {
                  const err = validateStep();
                  if (err) { setStepError(err); return; }
                  setStepError('');
                  setStep(s => s + 1);
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={ShieldCheck}
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? 'Submitting…' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

