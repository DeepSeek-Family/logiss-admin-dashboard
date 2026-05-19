import React, { useState } from 'react';
import { UserPlus, X, AlertTriangle, Car } from 'lucide-react';
import { Button } from '@/shared/components/ui';

const COUNTIES = ['Chesterfield', 'Henrico', 'Richmond City', 'Hanover', 'Goochland', 'Powhatan'];
const VEHICLE_TYPES = ['Ambulatory Van', 'Wheelchair Van', 'Stretcher Van'];

export const AddDriverModal = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [form, setForm] = useState<any>({
    firstName: '', lastName: '', middleName: '', dob: '', phone: '', email: '',
    ssnLast4: '', address: '', city: '', state: 'VA', zip: '',
    licenseNumber: '', licenseState: 'VA', licenseExpiry: '', licenseClass: 'Class C',
    endorsements: [], counties: [],
    vehicleMake: '', vehicleModel: '', vehicleYear: '', vehiclePlate: '', vehicleType: 'Ambulatory Van'
  });
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');

  const set = (key: string, val: any) => setForm((prev: any) => ({ ...prev, [key]: val }));
  
  const toggleItem = (listKey: string, item: string) => {
    const list = [...(form[listKey] || [])];
    const index = list.indexOf(item);
    if (index > -1) list.splice(index, 1);
    else list.push(item);
    set(listKey, list);
  };

  const validateStep = (): string => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.phone || !form.email) return 'Basic personal info is required';
      if (!form.ssnLast4 || form.ssnLast4.length !== 4) return 'Valid SSN (Last 4) is required';
      return '';
    }
    if (step === 2) {
      if (!form.licenseNumber || !form.licenseExpiry) return 'License details are required';
      return '';
    }
    if (step === 3) {
      if (form.counties.length === 0) return 'Select at least one service county';
      return '';
    }
    return '';
  };

  const steps = ['Personal', 'License', 'Service Area', 'Vehicle'];

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line-2 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center text-primary shadow-sm">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">Driver Onboarding</h2>
                <p className="text-xs text-ink-4">Step {step} of 4 — {steps[step - 1]}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg text-ink-4 transition-all hover:rotate-90">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${step > i ? 'bg-primary shadow-[0_0_10px_rgba(41,105,205,0.3)]' : 'bg-line-2'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-4 mb-2">First Name *</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="David" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-4 mb-2">Middle Name</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="A." />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-ink-4 mb-2">Last Name *</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Wilson" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">Date of Birth *</label>
                  <input type="date" className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.dob} onChange={e => set('dob', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">SSN (Last 4) *</label>
                  <input maxLength={4} className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all font-mono" value={form.ssnLast4} onChange={e => set('ssnLast4', e.target.value)} placeholder="0000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">Phone *</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(804) 555-0000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">Email *</label>
                  <input type="email" className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.email} onChange={e => set('email', e.target.value)} placeholder="david.w@logiss.com" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">License Number *</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all font-mono" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="T000-000-000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">License Class *</label>
                  <select className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all appearance-none" value={form.licenseClass} onChange={e => set('licenseClass', e.target.value)}>
                    <option>Class A</option>
                    <option>Class B</option>
                    <option>Class C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-4 mb-3">Endorsements</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Van', 'Bus', 'T-Endors', 'N-Endors'].map(item => (
                    <button key={item} onClick={() => toggleItem('endorsements', item)}
                      className={`px-4 py-3 rounded-xl border text-xs font-medium transition-all ${form.endorsements.includes(item) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-bg text-ink-3 border-line-2 hover:border-line'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-4 mb-2">Expiration Date *</label>
                <input type="date" className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-6 bg-primary-tint/10 rounded-2xl border border-primary/10">
                <p className="text-xs text-ink leading-relaxed">Select the counties where this driver will provide NEMT services. Multiple selection is allowed.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COUNTIES.map(c => (
                  <button key={c} onClick={() => toggleItem('counties', c)}
                    className={`px-4 py-4 rounded-2xl border text-xs font-medium transition-all flex items-center justify-between group ${form.counties.includes(c) ? 'bg-white border-primary text-primary shadow-md' : 'bg-bg text-ink-4 border-line-2 hover:border-line'}`}>
                    {c}
                    {form.counties.includes(c) && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink-4 mb-2">Vehicle Type *</label>
                  <select className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all appearance-none" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                    {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">Make *</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all" value={form.vehicleMake} onChange={e => set('vehicleMake', e.target.value)} placeholder="Ford" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2">Plate *</label>
                  <input className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-primary transition-all font-mono" value={form.vehiclePlate} onChange={e => set('vehiclePlate', e.target.value)} placeholder="VA-0000" />
                </div>
              </div>
              <div className="p-6 bg-bg rounded-2xl border border-dashed border-line-2 text-center group cursor-pointer hover:bg-white hover:border-primary transition-all">
                <Car className="mx-auto text-ink-4 mb-2 group-hover:text-primary transition-colors" size={24} />
                <p className="text-xs text-ink-4 group-hover:text-ink transition-colors">Click to upload vehicle registration documents</p>
              </div>
            </div>
          )}
        </div>

        {stepError && (
          <div className="mx-8 mb-4 px-4 py-3 bg-urgent-light rounded-xl border border-urgent/20 text-xs font-medium text-urgent flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle size={14} className="shrink-0" /> {stepError}
          </div>
        )}

        <div className="px-6 py-4 border-t border-line-2 bg-bg/30 flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-medium text-ink-4 hover:text-ink transition-colors">Cancel</button>
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => { setStepError(''); setStep(s => s - 1); }}>← Previous</Button>
            )}
            {step < 4 ? (
              <Button variant="primary" onClick={() => {
                const err = validateStep();
                if (err) { setStepError(err); return; }
                setStepError('');
                setStep(s => s + 1);
              }}>Next Step →</Button>
            ) : (
              <Button variant="primary" icon={UserPlus} onClick={() => {
                const err = validateStep();
                if (err) { setStepError(err); return; }
                onSave(form);
                onClose();
              }}>Complete Registration</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
