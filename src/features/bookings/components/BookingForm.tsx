import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User as UserIcon, Navigation, Clock,
  ShieldCheck, Car, Plus, Minus, Search, X,
  AlertCircle, Info, Phone, ArrowRight, Repeat,
  Accessibility, Bed, User, Disc, Zap, FileText,
  DollarSign, Activity, MapPin, Users, Mail, Tag, Building2, Stethoscope, Lock
} from 'lucide-react';
import { Card, Badge, Avatar, Button, MultiDatePicker } from '@/shared/components/ui';
import { useTrips } from '@/hooks/useTrips';
import { useDrivers } from '@/hooks/useDrivers';
import { money } from '@/utils/helpers';
import { FUNDING_SOURCES, riders } from '@/data/mockData';
import toast from 'react-hot-toast';
import { tripService } from '@/services/tripService';

export const inputClass = "w-full px-3 py-1.5 bg-white border border-line-2 rounded-lg text-sm text-ink outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-ink-4 h-9 shadow-sm";
export const disabledInputClass = "w-full px-3 py-1.5 bg-bg border border-line-2 rounded-lg text-sm text-ink-3 outline-none opacity-50 cursor-not-allowed h-9 shadow-none";

export const mobilityOptions = [
  { id: 'Ambulatory', label: 'Ambulatory', icon: User },
  { id: 'Wheelchair', label: 'Wheelchair', icon: Accessibility },
  { id: 'Walker', label: 'Walker', icon: Disc },
  { id: 'Rollator', label: 'Rollator', icon: Zap },
  { id: 'Cane', label: 'Cane', icon: Info }
];

export const BookingForm = () => {
  const navigate = useNavigate();
  const { trips } = useTrips();
  const { drivers } = useDrivers();

  const [userType, setUserType] = useState('guest');
  const [existingSearch, setExistingSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [fleetSearch, setFleetSearch] = useState('');

  // Recurring Booking state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const prevDayRef = useRef<string>('');
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    authId: '',
    passengerId: '',
    fundingSource: '',
    program: '',
    source: '',
    authNotes: '',
    insideCounty: true,
    pickup: '',
    dropoff: '',
    stops: [] as string[],
    appointmentTime: '',
    requestedPickup: '',
    returnPickup: '',
    tripType: 'one-way',
    isWillCall: false,
    mobility: '',
    tripReason: 'Medical Appointment',
    totalSeats: 1,
    additionalNotes: '',
    privateNotes: '',
    grossFare: 0,
    countyContribution: 38.00,
    manualFareOverride: false,
    advancePaid: 0
  });

  const filteredRiders = existingSearch.trim() === ''
    ? []
    : (riders || []).filter(r => 
        (r.name || '').toLowerCase().includes(existingSearch.toLowerCase()) ||
        (r.email || '').toLowerCase().includes(existingSearch.toLowerCase()) ||
        (r.phone || '').includes(existingSearch)
      );

  const handleSelectRider = (rider: any) => {
    const parts = (rider.name || '').split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    
    setForm(prev => ({
      ...prev,
      firstName,
      middleName: '',
      lastName,
      phone: rider.phone || '',
      email: rider.email || '',
      passengerId: rider.passengerId || '',
      authId: rider.authorizationId || '',
      fundingSource: rider.fundingSource || '',
      source: rider.source || '',
      program: rider.program || '',
      mobility: rider.mobility || '',
      pickup: rider.defaultPickup || '',
      dropoff: rider.defaultDropoff || '',
    }));
    setExistingSearch('');
    setUserType('guest'); // Switch back to guest view to verify/edit
    toast.success(`Populated profile details for ${rider.name}!`);
  };

  const baseRates: any = { Ambulatory: 45, Wheelchair: 65, Walker: 55, Rollator: 55, Cane: 45 };

  // Calculate the dates for repeating booking
  const getRecurringDates = () => {
    if (selectedDates.length === 0 || selectedDates.length > 1 || !recurringEndDate || recurringDays.length === 0) return [];
    
    // Use the first selected date as the start for recurring logic
    const startDate = new Date(selectedDates[0]);
    startDate.setHours(0, 0, 0, 0);
    
    const end = new Date(recurringEndDate + 'T00:00:00');
    const dates: Date[] = [];
    const current = new Date(startDate);

    // Limit check to avoid infinite loops if end date is set far in the future
    let iterations = 0;
    while (current <= end && iterations < 365) {
      const day = current.getDay().toString();
      if (recurringDays.includes(day)) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
      iterations++;
    }
    return dates;
  };

  const recurringDates = isRecurring ? getRecurringDates() : [];

  useEffect(() => {
    if (!form.manualFareOverride && form.mobility) {
      const base = baseRates[form.mobility] || 50;
      let total = base + (form.stops.length * 15);
      if (form.tripType === 'round-trip') total *= 1.8;
      setForm(prev => ({ ...prev, grossFare: Math.round(total) }));
    }
  }, [form.mobility, form.stops.length, form.tripType, form.manualFareOverride]);

  // Auto-select the day of the week of the first Service Date
  useEffect(() => {
    if (isRecurring && selectedDates.length > 0) {
      const dayOfWeek = selectedDates[0].getDay().toString();
      setRecurringDays(prev => {
        let updated = [...prev];
        // If we auto-selected a day before, remove it
        if (prevDayRef.current && prevDayRef.current !== dayOfWeek) {
          updated = updated.filter(d => d !== prevDayRef.current);
        }
        // Add the new day if it's not already there
        if (!updated.includes(dayOfWeek)) {
          updated.push(dayOfWeek);
        }
        return updated;
      });
      prevDayRef.current = dayOfWeek;
    }
  }, [isRecurring, selectedDates]);

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
    if (isRecurring && recurringDays.length === 0) {
      toast.error('Please select at least one day for recurring booking');
      return;
    }
    if (isRecurring && !recurringEndDate) {
      toast.error('Please select an end date for recurring booking');
      return;
    }
    if (isRecurring && new Date(recurringEndDate) < selectedDates[0]) {
      toast.error('End date cannot be earlier than start date');
      return;
    }
    
    if (selectedDates.length === 0) {
      toast.error('Please select at least one service date');
      return;
    }

    const toastId = toast.loading(
      isRecurring 
        ? `Scheduling ${recurringDates.length} recurring trips...` 
        : `Dispatching ${selectedDates.length > 1 ? selectedDates.length + ' trips' : 'trip record'}...`
    );

    const datesToSchedule = isRecurring ? recurringDates : selectedDates;
    
    // Create and save each trip
    datesToSchedule.forEach((date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const scheduledTime = `${dateStr}T${form.requestedPickup || '08:00'}:00`;
      
      const dropoffDate = new Date(date);
      const [hours, minutes] = (form.requestedPickup || '08:00').split(':').map(Number);
      dropoffDate.setHours(hours);
      dropoffDate.setMinutes(minutes + 45);
      const dY = dropoffDate.getFullYear();
      const dM = String(dropoffDate.getMonth() + 1).padStart(2, '0');
      const dD = String(dropoffDate.getDate()).padStart(2, '0');
      const dH = String(dropoffDate.getHours()).padStart(2, '0');
      const dMin = String(dropoffDate.getMinutes()).padStart(2, '0');
      const dropoffTime = `${dY}-${dM}-${dD}T${dH}:${dMin}:00`;

      const name = `${form.firstName} ${form.lastName}`.trim();
      const initials = `${form.firstName.charAt(0) || ''}${form.lastName.charAt(0) || ''}`.toUpperCase();

      const newTrip = {
        id: `LOGISS-${Math.floor(1000 + Math.random() * 9000)}`,
        rider: {
          name,
          initials: initials || '?',
          phone: form.phone,
          email: form.email,
          passengerId: form.passengerId
        },
        status: selectedDriver ? 'assigned' : 'pending_review',
        driverId: selectedDriver ? selectedDriver.id : undefined,
        type: form.tripType === 'round-trip' ? 'round_trip' : 'one_way',
        mobility: form.mobility,
        pickup: form.pickup,
        dropoff: form.dropoff,
        stops: form.stops,
        scheduledTime,
        dropoffTime,
        miles: 10.0,
        cost: form.grossFare,
        copay: totalCopay,
        fundingSource: form.fundingSource || 'Self-Pay',
        insideCounty: form.insideCounty,
        reason: form.tripReason,
        authNotes: form.authNotes,
        source: form.source || 'Chesterfield County',
        program: form.program || 'General Medical'
      };

      tripService.createTrip(newTrip);
    });

    setTimeout(() => {
      toast.success(
        isRecurring
          ? `${recurringDates.length} recurring trips successfully scheduled!`
          : `${selectedDates.length} trip(s) successfully dispatched!`, 
        {
          id: toastId,
          icon: '✅',
          style: { borderRadius: '12px', background: '#059669', color: '#fff' },
        }
      );
      setTimeout(() => navigate(selectedDriver ? '/live' : '/bookings'), 1000);
    }, 1200);
  };


  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-3.5 bg-primary rounded-full" />
      {Icon && <Icon size={16} className="text-primary/80" />}
      <h3 className="text-xs font-medium text-ink">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-[1300px] mx-auto pb-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-line-2 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-line-2 rounded-lg text-ink-2 hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-semibold text-ink">Manual Dispatch</h1>
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
                  <button key={t} type="button" onClick={() => setUserType(t)} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${userType === t ? 'bg-white shadow-sm text-primary' : 'text-ink-4'}`}>
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
                      <label className="text-xs font-medium text-ink-3">First Name</label>
                      <input className={inputClass} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-ink-3">Middle</label>
                      <input className={inputClass} value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} placeholder="M.I." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-ink-3">Last Name</label>
                      <input className={inputClass} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-ink-3">Phone Number</label>
                      <input className={inputClass} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(804) 555-0000" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-ink-3">Email Address</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                        <input className={`${inputClass} pl-8`} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rider@example.com" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-ink-3">Customer ID</label>
                      <div className="relative">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                        <input className={`${inputClass} pl-8`} value={form.passengerId} onChange={e => setForm({ ...form, passengerId: e.target.value })} placeholder="PX-2024-XXXX" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-ink-3">Auth ID</label>
                      <input className={inputClass} value={form.authId} onChange={e => setForm({ ...form, authId: e.target.value })} placeholder="AUTH-XXXX-XXXX" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink-3">Authorization Notes</label>
                    <div className="relative">
                      <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                      <input className={`${inputClass} pl-8`} value={form.authNotes} onChange={e => setForm({ ...form, authNotes: e.target.value })} placeholder="e.g. Approved for 10 trips this month, door-to-door escort allowed" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input className={inputClass} placeholder="Search records by name, email, or phone..." value={existingSearch} onChange={e => setExistingSearch(e.target.value)} />
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
                  </div>
                  {filteredRiders.length > 0 && (
                    <div className="border border-line-2 rounded-xl bg-bg/50 divide-y divide-line-2 max-h-56 overflow-y-auto shadow-inner p-1">
                      {filteredRiders.map(rider => (
                        <button
                          key={rider.id}
                          type="button"
                          onClick={() => handleSelectRider(rider)}
                          className="w-full text-left p-3 hover:bg-white rounded-lg transition-all flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">{rider.name}</p>
                            <p className="text-[10px] text-ink-4 mt-0.5">{rider.email} · {rider.phone}</p>
                          </div>
                          <Badge variant="bg" className="bg-white border border-line-2 text-[10px] font-medium text-ink-3">
                            {rider.passengerId}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {existingSearch.trim() !== '' && filteredRiders.length === 0 && (
                    <div className="text-center p-4 border border-dashed border-line-2 rounded-xl text-xs text-ink-4">
                      No matching riders found.
                    </div>
                  )}
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
                <label className="text-xs font-medium text-ink-2 mb-1 block">Pickup Address</label>
                <input required className={inputClass} value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })} placeholder="Pickup address" />
              </div>
              {form.stops.map((stop, idx) => (
                <div key={idx} className="relative pl-9">
                  <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-warning bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-warning" /></div>
                  <div className="absolute left-1.5 top-8 bottom-[-32px] w-0.5 border-l border-dashed border-line-2" />
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-ink-3">Stop {idx + 1}</label>
                    <button type="button" onClick={() => setForm({ ...form, stops: form.stops.filter((_, i) => i !== idx) })} className="text-xs font-medium text-urgent">Remove</button>
                  </div>
                  <input className={inputClass} value={stop} onChange={e => { const s = [...form.stops]; s[idx] = e.target.value; setForm({ ...form, stops: s }); }} placeholder="Stop address" />
                </div>
              ))}
              <div className="relative pl-9">
                <div className="absolute left-0 top-3 w-4 h-4 rounded-full border border-urgent bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-urgent" /></div>
                <label className="text-xs font-medium text-ink-2 mb-1 block">Dropoff Address</label>
                <input required className={inputClass} value={form.dropoff} onChange={e => setForm({ ...form, dropoff: e.target.value })} placeholder="Destination address" />
              </div>
              <button type="button" onClick={() => setForm({ ...form, stops: [...form.stops, ''] })} className="ml-9 text-xs font-medium text-primary hover:underline">+ Add Stop</button>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="3. Mobility Requirements" icon={ShieldCheck} />
            <div className="flex items-center gap-2 overflow-x-hidden">
              {mobilityOptions.map(opt => (
                <button key={opt.id} type="button" onClick={() => setForm({ ...form, mobility: opt.id })} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${form.mobility === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-line-2 bg-bg hover:border-primary/20'}`}>
                  <opt.icon size={16} className={form.mobility === opt.id ? 'text-primary' : 'text-ink-2'} />
                  <span className="text-xs font-medium text-ink">{opt.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="4. Trip Notes & Instructions" icon={FileText} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-ink-3 flex items-center gap-1.5 mb-2">
                  <User size={14} /> Instructions for Driver
                </label>
                <textarea className={`${inputClass} min-h-[120px] resize-none py-3 text-sm leading-relaxed`} value={form.additionalNotes} onChange={e => setForm({ ...form, additionalNotes: e.target.value })} placeholder="Enter special instructions for the driver (e.g. Call when arrived)..." />
                <p className="text-[10px] text-ink-4 mt-1.5">Visible in Driver App</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-urgent flex items-center gap-1.5 mb-2">
                  <Lock size={14} /> Internal Private Notes
                </label>
                <textarea className={`${inputClass} min-h-[120px] resize-none py-3 text-sm leading-relaxed bg-urgent/5 border-urgent/20 focus:ring-urgent/10 focus:border-urgent`} value={form.privateNotes} onChange={e => setForm({ ...form, privateNotes: e.target.value })} placeholder="Enter internal notes for dispatchers (e.g. Billing issues, specific client habits)..." />
                <p className="text-[10px] text-urgent/70 mt-1.5 font-medium">Hidden from Drivers & Customers</p>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Card className="p-6 border-line-2 bg-white shadow-none">
            <SectionHeader title="5. Trip Configuration" icon={Activity} />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Trip Type</label>
                <div className="flex bg-bg p-1 rounded-lg border border-line-2">
                  {['one-way', 'round-trip'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, tripType: t as any })} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${form.tripType === t ? 'bg-primary text-white shadow-md' : 'text-ink-4'}`}>
                      {t === 'one-way' ? 'One Way' : 'Round Trip'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Trip Reason</label>
                <select className={inputClass} value={form.tripReason} onChange={e => setForm({ ...form, tripReason: e.target.value })}>
                  <option value="Medical Appointment">Medical Appointment</option>
                  <option value="Dialysis">Dialysis</option>
                  <option value="Chemotherapy">Chemotherapy</option>
                  <option value="Physical Therapy">Physical Therapy</option>
                  <option value="Hospital Discharge">Hospital Discharge</option>
                  <option value="Specialist Visit">Specialist Visit</option>
                  <option value="Routine Checkup">Routine Checkup</option>
                  <option value="Eye Exam">Eye Exam</option>
                  <option value="Dental">Dental</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-line-2 mt-5">
              <label className="text-xs font-medium text-ink-2">Passenger Seats</label>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setForm({ ...form, totalSeats: Math.max(1, form.totalSeats - 1) })} className="p-2 bg-white border border-line-2 rounded-lg hover:bg-bg"><Minus size={16} /></button>
                <span className="text-base font-semibold text-ink w-6 text-center">{form.totalSeats}</span>
                <button type="button" onClick={() => setForm({ ...form, totalSeats: form.totalSeats + 1 })} className="p-2 bg-white border border-line-2 rounded-lg hover:bg-bg"><Plus size={16} /></button>
              </div>
            </div>

            {/* Funding Source & Program Context */}
            <div className="pt-5 border-t border-line-2 mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Funding Source</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                  <select className={`${inputClass} pl-8`} value={form.fundingSource} onChange={e => setForm({ ...form, fundingSource: e.target.value })}>
                    <option value="">Select source...</option>
                    {FUNDING_SOURCES.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">County Jurisdiction</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                  <select className={`${inputClass} pl-8`} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                    <option value="">Select county...</option>
                    <option value="Chesterfield County">Chesterfield County</option>
                    <option value="Henrico County">Henrico County</option>
                    <option value="Hanover County">Hanover County</option>
                    <option value="Richmond City">Richmond City</option>
                    <option value="Goochland County">Goochland County</option>
                    <option value="Powhatan County">Powhatan County</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Program Context</label>
                <div className="relative">
                  <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                  <select className={`${inputClass} pl-8`} value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                    <option value="">Select program...</option>
                    <option value="Senior Transport">Senior Transport</option>
                    <option value="DSS Medical">DSS Medical</option>
                    <option value="Adult Day Care">Adult Day Care</option>
                    <option value="Facility Discharge">Facility Discharge</option>
                    <option value="General Medical">General Medical</option>
                    <option value="Routine Dialysis">Routine Dialysis</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inside / Outside County */}
            <div className="pt-5 border-t border-line-2 mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-ink-2">Trip Jurisdiction</p>
                <p className="text-[10px] text-ink-4 mt-0.5">Is this trip within the county boundaries?</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${!form.insideCounty ? 'text-urgent' : 'text-ink-4'}`}>Outside</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, insideCounty: !form.insideCounty })}
                  className={`w-9 h-5 rounded-full relative transition-all ${form.insideCounty ? 'bg-accent' : 'bg-urgent/70'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.insideCounty ? 'right-0.5' : 'left-0.5'}`} />
                </button>
                <span className={`text-xs font-medium ${form.insideCounty ? 'text-accent' : 'text-ink-4'}`}>Inside</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-white shadow-none !overflow-visible">
            <SectionHeader title="6. Service Scheduling" icon={Clock} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Service Date(s)</label>
                <MultiDatePicker 
                  selected={selectedDates} 
                  onSelect={(days) => setSelectedDates(days || [])} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Appt Time</label>
                <input type="time" className={inputClass} value={form.appointmentTime} onChange={e => setForm({ ...form, appointmentTime: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-3">Pickup Time</label>
                <input type="time" className={inputClass} value={form.requestedPickup} onChange={e => setForm({ ...form, requestedPickup: e.target.value })} />
              </div>
            </div>
            {form.tripType === 'round-trip' && (
              <div className="mt-6 pt-5 border-t border-line-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-medium text-ink-2">Return Time</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink-3">Will Call</span>
                    <button type="button" onClick={() => setForm({ ...form, isWillCall: !form.isWillCall })} className={`w-9 h-5 rounded-full relative transition-all ${form.isWillCall ? 'bg-primary' : 'bg-line-2'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.isWillCall ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <input type="time" disabled={form.isWillCall} className={form.isWillCall ? disabledInputClass : inputClass} value={form.isWillCall ? '' : form.returnPickup} onChange={e => setForm({ ...form, returnPickup: e.target.value })} />
              </div>
            )}

            {/* Recurring Booking Option */}
            <div className="mt-6 pt-5 border-t border-line-2">
              <div className="flex justify-between items-center">
                <div className={`flex items-center gap-2 ${selectedDates.length > 1 ? 'opacity-50' : ''}`}>
                  <Repeat size={14} className={selectedDates.length > 1 ? 'text-ink-4' : 'text-primary'} />
                  <div>
                    <p className="text-xs font-medium text-ink-2">Recurring Booking</p>
                    <p className="text-[10px] font-medium text-ink-4">
                      {selectedDates.length > 1 
                        ? "Disabled because multiple custom dates are selected" 
                        : "Schedule repeating trips for dialysis, therapy, etc."}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  disabled={selectedDates.length > 1}
                  onClick={() => setIsRecurring(!isRecurring)} 
                  className={`w-9 h-5 rounded-full relative transition-all ${selectedDates.length > 1 ? 'bg-line-2 cursor-not-allowed' : isRecurring ? 'bg-primary' : 'bg-line-2'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isRecurring && selectedDates.length <= 1 ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              {isRecurring && selectedDates.length <= 1 && (
                <div className="mt-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
                  {/* Select Days of the Week */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-ink-3">Select Days of the Week</label>
                    <div className="flex justify-between gap-1 bg-bg p-1.5 rounded-xl border border-line-2">
                      {[
                        { key: '1', short: 'Mon', label: 'M' },
                        { key: '2', short: 'Tue', label: 'T' },
                        { key: '3', short: 'Wed', label: 'W' },
                        { key: '4', short: 'Thu', label: 'T' },
                        { key: '5', short: 'Fri', label: 'F' },
                        { key: '6', short: 'Sat', label: 'S' },
                        { key: '0', short: 'Sun', label: 'S' }
                      ].map(day => {
                        const isSelected = recurringDays.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => {
                              setRecurringDays(prev => 
                                prev.includes(day.key) 
                                  ? prev.filter(k => k !== day.key) 
                                  : [...prev, day.key]
                              );
                            }}
                            className={`flex-1 aspect-square md:h-9 flex items-center justify-center text-xs font-medium rounded-lg transition-all ${isSelected ? 'bg-primary text-white shadow-md' : 'text-ink-4 hover:bg-white'}`}
                            title={day.short}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-ink-3">Repeat Until (End Date)</label>
                    <input 
                      type="date" 
                      min={selectedDates.length > 0 ? selectedDates[0].toISOString().split('T')[0] : ''} 
                      className={inputClass} 
                      value={recurringEndDate} 
                      onChange={e => setRecurringEndDate(e.target.value)} 
                    />
                  </div>

                  {/* Real-time schedule preview */}
                  {recurringDates.length > 0 && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">🗓️ Schedule Preview</span>
                        <Badge variant="primary" className="text-[10px] font-medium px-2 py-0.5">{recurringDates.length} Trips Total</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                        {recurringDates.map((date, idx) => (
                          <span 
                            key={idx} 
                            className="bg-white border border-line-2 text-ink text-[10px] font-medium px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap animate-in zoom-in-50 duration-200"
                          >
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-[10px] text-ink-4 font-semibold italic">
                        * Recurring trips will be generated at the scheduled time of {form.requestedPickup || form.appointmentTime || 'N/A'} for each date above.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Multi-Date Schedule Preview (when NOT recurring) */}
            {!isRecurring && selectedDates.length > 0 && (
              <div className="mt-6 pt-5 border-t border-line-2">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">🗓️ Selected Dates Preview</span>
                    <Badge variant="primary" className="text-[10px] font-medium px-2 py-0.5">{selectedDates.length} {selectedDates.length === 1 ? 'Trip' : 'Trips'} Total</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedDates.map((date, idx) => (
                      <span 
                        key={idx} 
                        className="flex items-center gap-1 bg-white border border-line-2 text-ink text-[10px] font-medium px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap animate-in zoom-in-50 duration-200"
                      >
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        <button 
                          type="button" 
                          onClick={() => setSelectedDates(selectedDates.filter(d => d.getTime() !== date.getTime()))} 
                          className="hover:bg-urgent/10 hover:text-urgent p-0.5 rounded-full transition-colors ml-0.5"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
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
                        <p className="text-xs font-medium text-ink truncate">{d.name}</p>
                        {selectedDriver?.id === d.id && (
                          <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-md font-medium">Assigned</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-3">{d.vehicle?.plate || 'Active'}</p>
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
                <p className="text-xs font-medium text-ink-4 italic px-1">Optional: Leave unselected to dispatch later</p>
              )}
            </div>
          </Card>

          <Card className="p-6 border-line-2 bg-bg/20 shadow-none">
            <SectionHeader title="8. Fare & Payment Audit" icon={DollarSign} />
            {!form.mobility ? (
              <p className="text-xs font-medium text-ink-3 text-center py-6">Select mobility requirement</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium text-ink-4">
                  <span>Gross Fare</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink-3">$</span>
                    <input type="number" readOnly={!form.manualFareOverride} className={`w-20 text-right bg-transparent border-b outline-none text-sm ${form.manualFareOverride ? 'border-primary text-primary' : 'border-transparent text-ink'}`} value={form.grossFare} onChange={e => setForm({ ...form, grossFare: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-medium text-urgent/80 border-b border-line-2 pb-4">
                  <span>County Contribution</span>
                  <span>-${form.countyContribution}</span>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-xs font-medium text-ink-3">Total Copay</p>
                    <p className="text-xl font-semibold text-primary">{money(totalCopay)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-ink-3 mb-2">Advance</p>
                    <div className="relative w-32 ml-auto">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-3">$</span>
                      <input type="number" className="w-full pl-8 pr-3 py-1.5 bg-white border border-line-2 rounded-lg text-sm text-ink text-right outline-none shadow-sm" value={form.advancePaid} onChange={e => setForm({ ...form, advancePaid: Number(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-line-2 flex justify-between items-center shadow-sm mt-2">
                  <div>
                    <p className="text-xs font-medium text-ink-3">Due to Driver (Per Trip)</p>
                    <p className="text-lg font-semibold text-ink">{money(dueToDriver)}</p>
                  </div>
                  <Badge variant={dueToDriver > 0 ? "warning" : "accent"} className="text-xs py-1.5 px-5 font-medium">
                    {dueToDriver > 0 ? "Cash" : "Paid"}
                  </Badge>
                </div>

                {isRecurring && recurringDates.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex justify-between items-center mt-2.5 animate-in zoom-in-95 duration-200">
                    <div>
                      <p className="text-xs font-medium text-primary">Recurring Total</p>
                      <p className="text-[10px] font-semibold text-ink-3">{money(form.grossFare)} × {recurringDates.length} trips</p>
                    </div>
                    <p className="text-lg font-semibold text-primary">{money(form.grossFare * recurringDates.length)}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Button variant="primary" type="submit" className="w-full py-4 text-sm font-medium shadow-lg shadow-primary/10 transition-all" icon={ArrowRight}>
            Complete & Dispatch
          </Button>
        </div>
      </form>
    </div>
  );
}
