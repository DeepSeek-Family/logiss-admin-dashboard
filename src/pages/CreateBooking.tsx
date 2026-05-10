import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User as UserIcon, Navigation, Clock,
  ShieldCheck, Car, Plus, Minus, Search, X,
  AlertCircle, Info, Phone, ArrowRight, Repeat,
  Accessibility, Bed, User, Disc, Zap, FileText,
  DollarSign, Activity, MapPin, Users
} from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../components/ui';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { money } from '../utils/helpers';
import toast from 'react-hot-toast';

const inputClass = "w-full px-3 py-1.5 bg-white border border-line-2 rounded-lg text-sm font-semibold text-ink outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-ink-4 placeholder:font-normal h-9 shadow-sm";
const disabledInputClass = "w-full px-3 py-1.5 bg-bg border border-line-2 rounded-lg text-sm font-semibold text-ink-3 outline-none opacity-50 cursor-not-allowed placeholder:font-normal h-9 shadow-none";

const mobilityOptions = [
  { id: 'Ambulatory', label: 'Ambulatory', icon: User },
  { id: 'Wheelchair', label: 'Wheelchair', icon: Accessibility },
  { id: 'Walker', label: 'Walker', icon: Disc },
  { id: 'Rollator', label: 'Rollator', icon: Zap },
  { id: 'Cane', label: 'Cane', icon: Info }
];

export default function CreateBooking() {
  const navigate = useNavigate();
  const { trips } = useTrips();
  const { drivers } = useDrivers();

  const [userType, setUserType] = useState('guest');
  const [existingSearch, setExistingSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [fleetSearch, setFleetSearch] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    authId: '',
    pickup: '',
    dropoff: '',
    stops: [] as string[],
    date: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    requestedPickup: '',
    returnPickup: '',
    tripType: 'one-way',
    isWillCall: false,
    mobility: '',
    tripReason: 'Medical',
    totalSeats: 1,
    additionalNotes: '',
    grossFare: 0,
    countyContribution: 38.00,
    manualFareOverride: false,
    advancePaid: 0
  });

  const baseRates: any = { Ambulatory: 45, Wheelchair: 65, Walker: 55, Rollator: 55, Cane: 45 };

  useEffect(() => {
    if (!form.manualFareOverride && form.mobility) {
      const base = baseRates[form.mobility] || 50;
      let total = base + (form.stops.length * 15);
      if (form.tripType === 'round-trip') total *= 1.8;
      setForm(prev => ({ ...prev, grossFare: Math.round(total) }));
    }
  }, [form.mobility, form.stops.length, form.tripType, form.manualFareOverride]);

  const totalCopay = Math.max(0, form.grossFare - form.countyContribution);
  const dueToDriver = Math.max(0, totalCopay - form.advancePaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickup || !form.dropoff) {
      toast.error('Please enter pickup and dropoff addresses');
      return;
    }
    if (!form.mobility) {
      toast.error('Please select mobility requirement');
      return;
    }

    const toastId = toast.loading('Dispatching trip record...');
    setTimeout(() => {
      toast.success('Trip successfully dispatched!', {
        id: toastId,
        icon: '✅',
        style: { borderRadius: '12px', background: '#059669', color: '#fff' },
      });
      setTimeout(() => navigate('/live'), 1000);
    }, 1200);
  };

  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-3.5 bg-primary rounded-full" />
      {Icon && <Icon size={16} className="text-primary/80" />}
      <h3 className="text-xs font-bold text-ink-2 tracking-tight">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-[1300px] mx-auto pb-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-line-2 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-line-2 rounded-lg text-ink-2 hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold text-ink tracking-tight">Manual Dispatch</h1>
        </div>
        <Badge variant="bg" className="bg-bg text-ink-2 border border-line-2 px-4 py-1 text-xs">Live Console</Badge>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <Card className="p-6 border-line-2 bg-white shadow-none">
            <div className="flex justify-between items-center mb-6">
              <SectionHeader title="1. Passenger Identification" icon={UserIcon} />
              <div className="flex bg-bg p-1 rounded-lg border border-line-2">
                {['guest', 'existing'].map(t => (
                  <button key={t} type="button" onClick={() => setUserType(t)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${userType === t ? 'bg-white shadow-sm text-primary' : 'text-ink-3'}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {userType === 'guest' ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-3">First Name</label>
                      <input className={inputClass} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-3">Middle</label>
                      <input className={inputClass} value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} placeholder="M.I." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-3">Last Name</label>
                      <input className={inputClass} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-3">Phone Number</label>
                      <input className={inputClass} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ink-3">Auth ID</label>
                      <input className={inputClass} value={form.authId} onChange={e => setForm({ ...form, authId: e.target.value })} placeholder="Authorization" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <input className={inputClass} placeholder="Search records..." value={existingSearch} onChange={e => setExistingSearch(e.target.value)} />
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="2. Pickup & Dropoff" icon={Navigation} />
            <div className="space-y-5">
              <div className="relative pl-9">
                <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-primary bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-primary" /></div>
                <div className="absolute left-1.5 top-8 bottom-[-32px] w-0.5 border-l border-dashed border-line-2" />
                <label className="text-xs font-bold text-ink-2 mb-1 block">Pickup Address</label>
                <input required className={inputClass} value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })} placeholder="Pickup address" />
              </div>
              {form.stops.map((stop, idx) => (
                <div key={idx} className="relative pl-9">
                  <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-warning bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-warning" /></div>
                  <div className="absolute left-1.5 top-8 bottom-[-32px] w-0.5 border-l border-dashed border-line-2" />
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-ink-3">Stop {idx + 1}</label>
                    <button type="button" onClick={() => setForm({ ...form, stops: form.stops.filter((_, i) => i !== idx) })} className="text-xs font-bold text-urgent">Remove</button>
                  </div>
                  <input className={inputClass} value={stop} onChange={e => { const s = [...form.stops]; s[idx] = e.target.value; setForm({ ...form, stops: s }); }} placeholder="Stop address" />
                </div>
              ))}
              <div className="relative pl-9">
                <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-urgent bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-urgent" /></div>
                <label className="text-xs font-bold text-ink-2 mb-1 block">Dropoff Address</label>
                <input required className={inputClass} value={form.dropoff} onChange={e => setForm({ ...form, dropoff: e.target.value })} placeholder="Destination address" />
              </div>
              <button type="button" onClick={() => setForm({ ...form, stops: [...form.stops, ''] })} className="ml-9 text-xs font-bold text-primary hover:underline">+ Add Stop</button>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="3. Mobility Requirements" icon={ShieldCheck} />
            <div className="flex items-center gap-2 overflow-x-hidden">
              {mobilityOptions.map(opt => (
                <button key={opt.id} type="button" onClick={() => setForm({ ...form, mobility: opt.id })} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${form.mobility === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-line-2 bg-bg hover:border-primary/20'}`}>
                  <opt.icon size={16} className={form.mobility === opt.id ? 'text-primary' : 'text-ink-2'} />
                  <span className="text-xs font-bold text-ink-2 tracking-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="4. Additional Trip Notes" icon={FileText} />
            <textarea className={`${inputClass} min-h-[150px] resize-none py-3 text-sm leading-relaxed`} value={form.additionalNotes} onChange={e => setForm({ ...form, additionalNotes: e.target.value })} placeholder="Enter special instructions for driver and dispatcher..." />
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="5. Trip Configuration" icon={Activity} />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-3">Trip Type</label>
                <div className="flex bg-bg p-1 rounded-lg border border-line-2">
                  {['one-way', 'round-trip'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, tripType: t as any })} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${form.tripType === t ? 'bg-primary text-white shadow-md' : 'text-ink-3'}`}>
                      {t === 'one-way' ? 'One Way' : 'Round Trip'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-3">Trip Reason</label>
                <select className={inputClass} value={form.tripReason} onChange={e => setForm({ ...form, tripReason: e.target.value })}>
                  <option value="Medical">Medical</option>
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-line-2 mt-5">
              <label className="text-xs font-bold text-ink-2">Passenger Seats</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setForm({ ...form, totalSeats: Math.max(1, form.totalSeats - 1) })} className="p-2 bg-white border border-line-2 rounded-lg hover:bg-bg"><Minus size={16} /></button>
                <span className="text-base font-bold text-ink w-6 text-center">{form.totalSeats}</span>
                <button type="button" onClick={() => setForm({ ...form, totalSeats: form.totalSeats + 1 })} className="p-2 bg-white border border-line-2 rounded-lg hover:bg-bg"><Plus size={16} /></button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="6. Service Scheduling" icon={Clock} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-3">Service Date</label>
                <input type="date" className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-3">Appt Time</label>
                <input type="time" className={inputClass} value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-3">Pickup Time</label>
                <input type="time" className={inputClass} value={form.requestedPickup} onChange={e => setForm({ ...form, requestedPickup: e.target.value })} />
              </div>
            </div>
            {form.tripType === 'round-trip' && (
              <div className="mt-6 pt-5 border-t border-line-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-ink-2">Return Time</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-3">Will Call</span>
                    <button type="button" onClick={() => setForm({ ...form, isWillCall: !form.isWillCall })} className={`w-9 h-5 rounded-full relative transition-all ${form.isWillCall ? 'bg-primary' : 'bg-line-2'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isWillCall ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <input type="time" disabled={form.isWillCall} className={form.isWillCall ? disabledInputClass : inputClass} value={form.isWillCall ? '' : form.returnPickup} onChange={e => setForm({ ...form, returnPickup: e.target.value })} />
              </div>
            )}
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="7. Driver Allocation" icon={Car} />
            <div className="space-y-5">
              <div className="relative">
                <input className={inputClass} placeholder="Search drivers..." value={fleetSearch} onChange={e => setFleetSearch(e.target.value)} />
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1.5">
                {(drivers || []).filter(d => d.name.toLowerCase().includes(fleetSearch.toLowerCase())).map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDriver(selectedDriver?.id === d.id ? null : d)}
                    className={`w-full p-3.5 border rounded-xl flex items-center gap-4 transition-all ${selectedDriver?.id === d.id ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-md' : 'border-line-2 bg-bg/50 hover:border-primary/20'}`}
                  >
                    <Avatar initials={d.initials} size="sm" online={d.onDuty} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-ink truncate">{d.name}</p>
                        {selectedDriver?.id === d.id && (
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">Assigned</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-3 font-bold">{d.vehicle?.plate || 'Active'}</p>
                    </div>
                    {selectedDriver?.id === d.id ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                        <ShieldCheck size={12} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-line-2" />
                    )}
                  </button>
                ))}
              </div>
              {!selectedDriver && (
                <p className="text-[12px] font-bold text-ink-4 italic px-1">Optional: Leave unselected to dispatch later</p>
              )}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-bg/20 shadow-none">
            <SectionHeader title="8. Fare & Payment Audit" icon={DollarSign} />
            {!form.mobility ? (
              <p className="text-xs font-bold text-ink-3 text-center py-6">Select mobility requirement</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold text-ink-2">
                  <span>Gross Fare</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-3">$</span>
                    <input type="number" readOnly={!form.manualFareOverride} className={`w-20 text-right bg-transparent border-b outline-none font-bold text-sm ${form.manualFareOverride ? 'border-primary text-primary' : 'border-transparent text-ink'}`} value={form.grossFare} onChange={e => setForm({ ...form, grossFare: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-bold text-urgent border-b border-line-2 pb-4">
                  <span>County Contribution</span>
                  <span>-${form.countyContribution}</span>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-xs font-bold text-ink-3">Total Copay</p>
                    <p className="text-xl font-black text-primary tracking-tighter">{money(totalCopay)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-ink-3 mb-2">Advance</p>
                    <div className="relative w-32 ml-auto">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-3">$</span>
                      <input type="number" className="w-full pl-8 pr-3 py-1.5 bg-white border border-line-2 rounded-lg text-sm font-bold text-ink text-right outline-none shadow-sm" value={form.advancePaid} onChange={e => setForm({ ...form, advancePaid: Number(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-line-2 flex justify-between items-center shadow-sm mt-2">
                  <div>
                    <p className="text-xs font-bold text-ink-3">Due to Driver</p>
                    <p className="text-lg font-black text-ink">{money(dueToDriver)}</p>
                  </div>
                  <Badge variant={dueToDriver > 0 ? "warning" : "accent"} className="text-xs py-1.5 px-5 font-bold">
                    {dueToDriver > 0 ? "Cash" : "Paid"}
                  </Badge>
                </div>
              </div>
            )}
          </Card>

          <Button variant="primary" type="submit" className="w-full py-4 text-sm font-bold shadow-lg shadow-primary/10 transition-all" icon={ArrowRight}>
            Complete & Dispatch
          </Button>
        </div>
      </form>
    </div>
  );
}
