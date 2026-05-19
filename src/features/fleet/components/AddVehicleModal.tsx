import React, { useState } from 'react';
import { Plus, X, Check, Wrench, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { FleetForm, EMPTY_FLEET_FORM, VEHICLE_TYPES } from '../types';

export const AddVehicleModal = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [form, setForm] = useState<FleetForm>(EMPTY_FLEET_FORM);
  const [step, setStep] = useState(1);
  const set = (k: keyof FleetForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-line-2 ring-1 ring-ink/5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-7 border-b border-line-2 bg-bg/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Register New Unit</h2>
              <p className="text-xs text-ink-3 font-semibold mt-1">Deployment Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-urgent-light hover:text-urgent text-ink-4 transition-all flex items-center justify-center border border-transparent hover:border-urgent/10"><X size={20} /></button>
        </div>

        <div className="flex px-8 pt-6 gap-3">
          {['Vehicle Specifications', 'Compliance & Safety'].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${step > i ? 'bg-primary' : 'bg-line-2'}`} />
              <p className={`text-xs font-medium mt-2 ${step === i + 1 ? 'text-primary' : 'text-ink-4'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'Make / Manufacturer', key: 'make', ph: 'Ford' },
                { label: 'Model Series', key: 'model', ph: 'Transit 250' },
                { label: 'Year', key: 'year', ph: '2024' },
                { label: 'License Plate', key: 'plate', ph: 'VA · AAA-0000' }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-ink-4 mb-2.5 ml-1">{field.label}</label>
                  <input
                    className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm text-ink outline-none transition-all placeholder:text-ink-4/50"
                    type="text"
                    placeholder={field.ph}
                    value={form[field.key as keyof FleetForm]}
                    onChange={e => set(field.key as keyof FleetForm, e.target.value)}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs text-ink-4 mb-2.5 ml-1">VIN Number (17 Characters)</label>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm text-ink font-mono outline-none transition-all placeholder:text-ink-4/50 uppercase"
                  placeholder="1FD..."
                  value={form.vin}
                  onChange={e => set('vin', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-4 mb-2.5 ml-1">Configuration Type</label>
                <select
                  className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm text-ink outline-none transition-all cursor-pointer"
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                >
                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-4 mb-2.5 ml-1">Max Passengers</label>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm text-ink outline-none transition-all"
                  type="number"
                  placeholder="4"
                  value={form.seats}
                  onChange={e => set('seats', e.target.value)}
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-bg/40 rounded-2xl p-6 border-2 border-line-2 space-y-5">
                <p className="text-xs font-medium text-ink flex items-center gap-2 mb-2">
                  <Wrench size={14} className="text-primary" /> Maintenance Schedule
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-4 mb-2 ml-1">Current Odometer</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm text-ink outline-none" type="number" placeholder="0" value={form.mileage} onChange={e => set('mileage', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-4 mb-2 ml-1">Next Service Date</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm text-ink outline-none" type="date" value={form.nextService} onChange={e => set('nextService', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="bg-bg/40 rounded-3xl p-6 border-2 border-line-2 space-y-5">
                <p className="text-xs font-medium text-ink flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-accent" /> Insurance Records
                </p>
                <div>
                  <label className="block text-xs font-medium text-ink-4 mb-2 ml-1">Carrier Provider</label>
                  <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm text-ink outline-none" placeholder="e.g., Progressive Commercial" value={form.insuranceProvider} onChange={e => set('insuranceProvider', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-4 mb-2 ml-1">Policy Number</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm text-ink outline-none" placeholder="POL-00000" value={form.insurancePolicy} onChange={e => set('insurancePolicy', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-4 mb-2 ml-1">Expiration Date</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm text-ink outline-none" type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-7 border-t border-line-2 flex items-center justify-between bg-bg/10">
          <button onClick={onClose} className="text-xs font-medium text-ink-4 hover:text-urgent transition-colors">Cancel</button>
          <div className="flex gap-4">
            {step > 1 && <Button variant="outline" className="rounded-xl px-6" onClick={() => setStep(s => s - 1)}>Back</Button>}
            {step < 2
              ? <Button variant="primary" className="rounded-xl px-8" onClick={() => setStep(s => s + 1)}>Continue to Compliance</Button>
              : <Button
                  variant="primary"
                  className="rounded-xl px-8 shadow-xl shadow-primary/20"
                  icon={Check}
                  onClick={() => {
                    const formattedData = {
                      ...form,
                      insurance: {
                        provider: form.insuranceProvider,
                        policy: form.insurancePolicy,
                        expires: form.insuranceExpiry,
                        status: 'valid'
                      }
                    };
                    onSave(formattedData);
                    onClose();
                  }}
                >
                  Finalize Registration
                </Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};
