import React, { useState } from 'react';
import { 
  Search, X, MapPin, CalendarClock, Plus, 
  Accessibility, Bed, User as UserIcon, Disc, Info, 
  Clock, Navigation, ShieldCheck, Phone, ArrowRight
} from 'lucide-react';
import { Avatar, Button } from './UI';

interface ManualTripModalProps {
  trips: any[];
  onClose: () => void;
  onSave: (trip: any) => void;
}

const mobilityOptions = [
  { id: 'Ambulatory', label: 'Ambulatory', icon: UserIcon },
  { id: 'Wheelchair', label: 'Wheelchair', icon: Accessibility },
  { id: 'Walker', label: 'Walker', icon: Disc },
  { id: 'Stretcher', label: 'Stretcher', icon: Bed },
  { id: 'Cane', label: 'Cane', icon: Info }
];

// Move helper outside to prevent re-creation on every render
const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-1 h-3.5 bg-primary rounded-full" />
    {Icon && <Icon size={14} className="text-primary" />}
    <h4 className="text-[11px] font-black text-ink uppercase tracking-wider">{title}</h4>
  </div>
);

export const ManualTripModal: React.FC<ManualTripModalProps> = ({ trips = [], onClose, onSave }) => {
  const [userType, setUserType] = useState('new');
  const [existingSearch, setExistingSearch] = useState('');
  const [selectedExistingRider, setSelectedExistingRider] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    authId: '',
    pickup: '',
    stops: [] as string[],
    dropoff: '',
    scheduledTime: '',
    appointmentTime: '',
    returnTime: '',
    willCall: false,
    mobility: 'Ambulatory',
    type: 'one_way',
  });

  const addStop = () => setForm(f => ({ ...f, stops: [...f.stops, ''] }));
  const removeStop = (idx: number) => setForm(f => ({ ...f, stops: f.stops.filter((_, i) => i !== idx) }));
  const updateStop = (idx: number, val: string) => setForm(f => ({ ...f, stops: f.stops.map((s, i) => i === idx ? val : s) }));

  const inputClass = "w-full bg-white border border-line-2 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:text-ink-4 shadow-sm";

  // Safe access to existing riders
  const existingRiders = Array.from(
    new Map((trips || []).filter(t => t?.rider?.name).map(t => [t.rider.name, t.rider])).values()
  );

  const filteredRiders = existingSearch
    ? existingRiders.filter((r: any) =>
      r?.name?.toLowerCase().includes(existingSearch.toLowerCase()) ||
      (r?.phone && r.phone.includes(existingSearch))
    )
    : [];

  const selectRider = (rider: any) => {
    if (!rider) return;
    const parts = (rider.name || '').split(' ');
    setForm(prev => ({
      ...prev,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      phone: rider.phone || '',
    }));
    setSelectedExistingRider(rider);
    setExistingSearch(rider.name || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'existing' && !selectedExistingRider) return;
    const fullName = `${form.firstName} ${form.middleName ? form.middleName + ' ' : ''}${form.lastName}`.trim();
    const initials = form.firstName && form.lastName
      ? form.firstName[0] + form.lastName[0]
      : form.firstName ? form.firstName[0] + (form.firstName[1] || '')
        : 'UN';

    onSave({
      ...form,
      id: `LOGISS-${Date.now().toString().slice(-4)}`,
      rider: { name: fullName || 'Unknown Rider', initials: initials.toUpperCase(), phone: form.phone },
      status: 'pending_review',
      submittedTime: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-md z-[60] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border border-line-2">
        <div className="flex items-center justify-between px-8 py-5 border-b border-line-2 bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-ink tracking-tight">Manual Booking Console</h3>
            <p className="text-[11px] text-ink-4 font-bold uppercase tracking-widest mt-0.5">Administrator Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-xl text-ink-4 transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-8 custom-scrollbar">
          <div className="flex items-center bg-bg p-1 rounded-2xl mb-8 border border-line-2 shadow-inner max-w-xs mx-auto">
            {['new', 'existing'].map(t => (
              <button
                key={t}
                type="button"
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${userType === t ? 'bg-white shadow-md text-primary ring-1 ring-line-2' : 'text-ink-4'}`}
                onClick={() => setUserType(t)}
              >
                {t === 'new' ? 'GUEST' : 'EXISTING'}
              </button>
            ))}
          </div>

          <form id="manual-booking-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              <SectionHeader title="Passenger Details" icon={UserIcon} />

              {userType === 'existing' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      className={inputClass}
                      placeholder="Search rider..."
                      value={existingSearch}
                      onChange={e => { setExistingSearch(e.target.value); setSelectedExistingRider(null); }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-4"><Search size={18} /></div>
                  </div>
                  {existingSearch && !selectedExistingRider && (
                    <div className="border border-line-2 rounded-2xl overflow-hidden divide-y divide-line-2 max-h-48 overflow-y-auto shadow-lg bg-white">
                      {filteredRiders.length > 0 ? filteredRiders.map((r: any, i: number) => (
                        <button key={i} type="button" onClick={() => selectRider(r)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors text-left">
                          <Avatar initials={r?.initials || '??'} size="xs" />
                          <div>
                            <p className="text-xs font-bold text-ink">{r?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-ink-4">{r?.phone || 'No phone'}</p>
                          </div>
                        </button>
                      )) : (
                        <p className="px-4 py-3 text-xs text-ink-4">No records found</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input required className={inputClass} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First Name" />
                    <input required className={inputClass} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last Name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input className={inputClass} value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} placeholder="M.I. (Optional)" />
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
                      <input className={`${inputClass} pl-10`} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number" />
                    </div>
                  </div>
                  <div className="relative">
                    <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" />
                    <input className={`${inputClass} pl-10`} value={form.authId} onChange={e => setForm({ ...form, authId: e.target.value })} placeholder="Authorization ID / Insurance" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <SectionHeader title="Route Selection" icon={Navigation} />
              <div className="space-y-4">
                <div className="relative pl-10">
                  <div className="absolute left-0 top-2.5 w-4 h-4 rounded-full border-2 border-primary bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-primary" /></div>
                  <div className="absolute left-2 top-8 bottom-[-32px] w-0.5 border-l-2 border-dashed border-line-2" />
                  <input required className={inputClass} value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })} placeholder="Pickup Address" />
                </div>
                {form.stops.map((stop, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-0 top-2.5 w-4 h-4 rounded-full border-2 border-warning bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-warning" /></div>
                    <div className="absolute left-2 top-8 bottom-[-32px] w-0.5 border-l-2 border-dashed border-line-2" />
                    <div className="flex gap-2">
                      <input required className={inputClass} value={stop} onChange={e => updateStop(idx, e.target.value)} placeholder={`Stop ${idx + 1}`} />
                      <button type="button" onClick={() => removeStop(idx)} className="p-2 text-urgent"><X size={18} /></button>
                    </div>
                  </div>
                ))}
                <div className="relative pl-10">
                  <div className="absolute left-0 top-2.5 w-4 h-4 rounded-full border-2 border-urgent bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-urgent" /></div>
                  <input required className={inputClass} value={form.dropoff} onChange={e => setForm({ ...form, dropoff: e.target.value })} placeholder="Destination Address" />
                </div>
                <button type="button" onClick={addStop} className="ml-10 text-[11px] font-bold text-primary flex items-center gap-1"><Plus size={14} /> ADD STOP</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <SectionHeader title="Scheduling" icon={Clock} />
                <div className="space-y-4">
                  <input required type="datetime-local" className={inputClass} value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} />
                  <div className="flex bg-bg p-1 rounded-xl border border-line-2">
                    {['one_way', 'round_trip'].map(t => (
                      <button key={t} type="button" onClick={() => setForm({...form, type: t as any})} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${form.type === t ? 'bg-white shadow-sm text-primary' : 'text-ink-4'}`}>
                        {t.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <SectionHeader title="Mobility" icon={ShieldCheck} />
                <div className="grid grid-cols-3 gap-2">
                  {mobilityOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm({ ...form, mobility: opt.id })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${form.mobility === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-line-2 bg-white hover:border-primary/20'}`}
                    >
                      <div className={`p-2 rounded-lg ${form.mobility === opt.id ? 'bg-primary text-white' : 'bg-bg text-ink-4'}`}>
                        <opt.icon size={16} />
                      </div>
                      <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-8 py-5 border-t border-line-2 bg-bg flex gap-4 shrink-0 rounded-b-3xl">
          <button className="flex-1 py-3.5 bg-white border border-line-2 text-sm font-bold text-ink rounded-2xl" onClick={onClose}>Cancel</button>
          <button type="submit" form="manual-booking-form" className="flex-1 py-3.5 bg-primary text-sm font-bold text-white rounded-2xl shadow-lg flex items-center justify-center gap-2">
             Create Trip <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
