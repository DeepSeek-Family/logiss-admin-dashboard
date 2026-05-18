import { useState } from 'react';
import {
  Plus, Search, Phone, Mail, Car, MapPin, ShieldCheck,
  CalendarClock, AlertTriangle, Star, ChevronRight, ExternalLink,
  X, User, UserPlus, Truck, FileCheck, Users, Repeat, Copy
} from 'lucide-react';
import { Card, Avatar, Badge, Button, Pagination } from '../components/ui';
import { useDrivers } from '../hooks/useDrivers';
import { useTrips } from '../hooks/useTrips';

const COUNTIES = ['Chesterfield', 'Henrico', 'Richmond City', 'Hanover', 'Goochland', 'Powhatan'];
const VEHICLE_TYPES = ['Ambulatory Van', 'Wheelchair Van', 'Stretcher Van'];

const EMPTY_FORM: DriverForm = {
  name: '', email: '', phone: '',
  licenseNumber: '', licenseExpiry: '',
  insurancePolicy: '', insuranceExpiry: '',
  certNumber: '', certExpiry: '',
  vehicleMake: '', vehicleModel: '', vehicleYear: '',
  vehiclePlate: '', vehicleColor: '', vehicleType: 'Ambulatory Van',
  counties: [],
};

interface DriverForm {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  certNumber: string;
  certExpiry: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
  counties: string[];
}

const AddDriverModal = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
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
        <div className="px-8 py-6 border-b border-line-2 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary shadow-sm">
                <UserPlus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Driver Onboarding</h2>
                <p className="text-xs text-ink-4 mt-1">Step {step} of 4 — {steps[step - 1]}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-bg text-ink-4 transition-all hover:rotate-90">
              <X size={20} />
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

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
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
                <p className="text-xs font-bold text-ink leading-relaxed">Select the counties where this driver will provide NEMT services. Multiple selection is allowed.</p>
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
                <p className="text-xs font-bold text-ink-4 group-hover:text-ink transition-colors">Click to upload vehicle registration documents</p>
              </div>
            </div>
          )}
        </div>

        {stepError && (
          <div className="mx-8 mb-4 px-4 py-3 bg-urgent-light rounded-xl border border-urgent/20 text-xs font-medium text-urgent flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle size={14} className="shrink-0" /> {stepError}
          </div>
        )}

        <div className="px-8 py-6 border-t border-line-2 bg-bg/30 flex items-center justify-between">
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

const Drivers = ({ role }: { role?: string | null }) => {
  const { drivers, loading, error, addDriver } = useDrivers();
  const { trips } = useTrips();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [profileTab, setProfileTab] = useState<'overview' | 'trips' | 'docs'>('overview');
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const itemsPerPage = 8;

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-48 h-8 bg-line-2 rounded-xl animate-pulse"></div>
            <div className="w-64 h-4 bg-line-2 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-bg rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="h-[400px] bg-bg rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={48} className="text-urgent mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-ink mb-2">Failed to load drivers</h3>
        <p className="text-ink-3 text-sm">{error}</p>
      </div>
    );
  }

  const filteredDrivers = (drivers || []).filter((d: any) => {
    const nameMatch = (d?.name || '').toLowerCase().includes((search || '').toLowerCase());
    const idMatch = (d?.id || '').toLowerCase().includes((search || '').toLowerCase());
    let matchesTab = true;
    if (activeTab === 'on_duty') matchesTab = d?.onDuty;
    if (activeTab === 'off_duty') matchesTab = !d?.onDuty;
    if (activeTab === 'attention') matchesTab = (d?.pendingDocUpdates || 0) > 0;
    return (nameMatch || idMatch) && matchesTab;
  });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedDriver = (drivers || []).find((d: any) => d.id === selectedDriverId);

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: any } = {
      available: { variant: 'accent', label: 'Available' },
      in_trip: { variant: 'solid_accent', label: 'In Trip' },
      break: { variant: 'warning', label: 'On Break' },
      off_duty: { variant: 'neutral', label: 'Off Duty' },
    };
    const { variant, label } = config[status] || { variant: 'neutral', label: status };
    return <Badge variant={variant} className="w-fit">{label}</Badge>;
  };


  if (selectedDriver) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedDriverId(null); setProfileTab('overview'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-4 hover:text-ink hover:bg-white rounded-xl transition-all shadow-sm border border-line-2 bg-bg"
          >
            ← Back to Drivers List
          </button>
          <div className="flex gap-3">
            <Button variant="outline" icon={Phone}>Call</Button>
            {role === 'admin' && <Button variant="primary" icon={Repeat}>Assign Vehicle</Button>}
          </div>
        </div>

        {/* Clean Profile Header */}
        <Card className="p-6 border border-line-2 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative shrink-0">
              {selectedDriver?.image ? (
                <img src={selectedDriver.image} alt={selectedDriver.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-line-2" />
              ) : (
                <Avatar initials={selectedDriver?.initials || '?'} size="xl" shape="square" className="rounded-2xl" />
              )}
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-semibold text-ink">{selectedDriver?.name}</h2>
                <Badge variant="accent">Active</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-ink-4 text-xs font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={12} /> Richmond, VA</span>
                <span className="flex items-center gap-1.5"><Star size={12} className="text-warning fill-warning" /> {selectedDriver?.rating || 4.9} rating</span>
                <span className="font-mono text-xs bg-bg px-2 py-0.5 rounded border border-line-2 text-ink-3">{selectedDriver?.id}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-3 bg-bg rounded-xl border border-line-2 text-center">
                <p className="text-xs text-ink-4 mb-0.5">Trips</p>
                <p className="text-xl font-semibold text-ink">{selectedDriver?.totalTrips || 0}</p>
              </div>
              <div className="px-4 py-3 bg-bg rounded-xl border border-line-2 text-center">
                <p className="text-xs text-ink-4 mb-0.5">Reports</p>
                <p className="text-xl font-semibold text-warning">0</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-bg p-1 rounded-xl border border-line-2 w-fit">
          {[
            { id: 'overview', label: 'Profile Overview', icon: User },
            { id: 'trips', label: 'Trip History', icon: Repeat },
            { id: 'docs', label: 'Licence', icon: ShieldCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                profileTab === tab.id ? 'bg-white text-primary shadow-sm border border-line-2' : 'text-ink-4 hover:text-ink'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {profileTab === 'overview' && (
            <>
              <div className="lg:col-span-1 space-y-6">
                <Card className="p-6 space-y-6">
                  <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 px-1 border-l-2 border-primary ml-[-1px]">Current Unit</h4>
                  <div className="p-5 bg-primary-tint/10 rounded-2xl border border-primary/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm"><Car size={24} /></div>
                      <div>
                        <p className="text-sm font-medium text-ink">{selectedDriver?.vehicle?.make || 'No Vehicle Assigned'}</p>
                        <p className="text-xs text-ink-4">{selectedDriver?.vehicle?.type || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-line-2">
                      <span className="text-xs text-ink-4">License Plate</span>
                      <span className="text-xs font-medium text-primary font-mono">{selectedDriver?.vehicle?.plate || '---'}</span>
                    </div>
                    {role === 'admin' && (
                      <Button variant="outline" size="sm" className="w-full mt-4 bg-white" icon={Repeat}>Change Assignment</Button>
                    )}
                  </div>
                </Card>

                <Card className="p-6 space-y-6">
                  <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 px-1 border-l-2 border-accent ml-[-1px]">Service Counties</h4>

                  <div className="flex flex-wrap gap-2">
                    {(selectedDriver?.counties || ['Richmond', 'Henrico']).map((c: string) => (
                      <div key={c} className="px-4 py-2 bg-bg rounded-xl border border-line-2 text-xs font-medium text-ink-3 flex items-center gap-2">
                        <MapPin size={12} /> {c}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-6 px-1 border-l-2 border-primary ml-[-1px]">Personal Details</h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                        <span className="text-xs text-ink-4">Email Address</span>
                        <span className="text-xs text-ink">{selectedDriver?.email}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                        <span className="text-xs text-ink-4">Phone Number</span>
                        <span className="text-xs text-ink">{selectedDriver?.phone}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                        <span className="text-xs text-ink-4">Date of Birth</span>
                        <span className="text-xs text-ink">{selectedDriver?.dob || 'Jan 12, 1988'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                        <span className="text-xs text-ink-4">SSN (Last 4)</span>
                        <span className="text-xs text-ink">***-**-4421</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-urgent/10 bg-urgent-light/5">
                    <h4 className="text-[10px] font-medium text-urgent uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-urgent" /> Emergency Contact
                    </h4>

                    <div className="p-4 bg-white rounded-2xl border border-urgent/10">
                      <p className="text-sm font-medium text-ink">{selectedDriver?.emergencyContact?.name || 'Robert Wilson'}</p>
                      <p className="text-xs text-ink-4 mt-0.5">{selectedDriver?.emergencyContact?.relation || 'Brother'}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 p-3 bg-bg rounded-xl border border-line-2 text-xs font-medium text-primary text-center">
                          {selectedDriver?.emergencyContact?.phone || '(804) 555-0012'}
                        </div>
                        <button
                          onClick={() => handleCopyPhone(selectedDriver?.emergencyContact?.phone || '(804) 555-0012')}
                          title="Copy number"
                          className="w-9 h-9 bg-white rounded-xl border border-line-2 flex items-center justify-center text-ink-4 hover:text-primary hover:border-primary/30 transition-all shrink-0"
                        >
                          {copiedPhone ? <ShieldCheck size={14} className="text-accent" /> : <Copy size={14} />}
                        </button>
                        <Button variant="outline" size="sm" className="bg-white shrink-0"><Phone size={14} /></Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-6 px-1 border-l-2 border-accent ml-[-1px]">Experience & Certification</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg rounded-2xl border border-line-2">
                      <p className="text-xs text-ink-4 mb-1">License Class</p>
                      <Badge variant="primary">{selectedDriver?.licenseClass || 'Class C'}</Badge>
                    </div>
                    <div className="p-4 bg-bg rounded-2xl border border-line-2">
                      <p className="text-xs text-ink-4 mb-1">Endorsements</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedDriver?.endorsements || ['Van', 'Bus']).map((e: string) => (
                          <span key={e} className="px-2 py-0.5 bg-accent-light text-accent text-xs font-medium rounded">{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {profileTab === 'trips' && (
            <div className="lg:col-span-3 space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Completed Trips', val: selectedDriver?.totalTrips || 0, color: 'text-accent' },
                  { label: 'Today\'s Trips', val: selectedDriver?.tripsToday || 0, color: 'text-primary' },
                  { label: 'Total Miles', val: '1,240', color: 'text-ink' },
                  { label: 'Incident Reports', val: '0', color: 'text-urgent' }
                ].map(stat => (
                  <Card key={stat.label} className="p-6 text-center">
                    <p className="text-xs text-ink-4 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-semibold ${stat.color}`}>{stat.val}</p>
                  </Card>
                ))}
              </div>
              
              <Card className="overflow-hidden border-none shadow-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-bg border-b border-line-2">
                      <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em]">Trip ID</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em]">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em]">Rider</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em]">Route</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em]">Status</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-ink-4 uppercase tracking-[0.1em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {(() => {
                      const driverTrips = (trips || []).filter((t: any) => t.driverId === selectedDriver?.id);
                      if (driverTrips.length === 0) return <tr><td colSpan={6} className="text-center py-20 font-bold text-ink-4">No Trip History Available</td></tr>;
                      return driverTrips.map((trip: any) => (
                        <tr key={trip.id} className="hover:bg-bg/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-ink-3">#{trip.id.slice(-4)}</td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-ink">{new Date(trip.scheduledTime).toLocaleDateString()}</p>
                            <p className="text-xs text-ink-4">{new Date(trip.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Avatar initials={trip.rider?.name?.[0] || 'R'} size="xs" />
                              <span className="text-xs font-medium text-ink">{trip.rider?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-xs text-ink-4 truncate mb-0.5">{trip.pickup}</p>
                            <p className="text-xs text-primary truncate">→ {trip.dropoff}</p>
                          </td>
                          <td className="px-6 py-4"><Badge variant={trip.status === 'completed' ? 'accent' : 'neutral'}>{trip.status}</Badge></td>
                          <td className="px-6 py-4">
                            <button className="p-2 hover:bg-white rounded-lg text-ink-4 hover:text-primary transition-all border border-transparent hover:border-line-2"><ExternalLink size={14} /></button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {profileTab === 'docs' && (
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {[
                { label: 'Driver License', icon: ShieldCheck, status: 'valid', expiry: 'Jan 2026', id: 'DL-0123-456',
                  mockContent: 'Virginia DMV · Class C Commercial\nExpiry: January 15, 2026\nEndorsements: Passenger (P), School Bus (S)\nRestrictions: None' }
              ].map((doc) => (
                <Card key={doc.label} className="p-5 group hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${doc.status === 'valid' ? 'bg-accent-light text-accent' : 'bg-warning-light text-warning'}`}>
                      <doc.icon size={18} />
                    </div>
                    <Badge variant={doc.status === 'valid' ? 'accent' : 'warning'}>{doc.status}</Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-ink mb-1">{doc.label}</h4>
                  <p className="text-xs text-ink-4 mb-4 font-mono">ID: {doc.id} · Exp: {doc.expiry}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="flex-1 py-2 bg-bg hover:bg-primary-light/30 rounded-lg text-xs font-medium text-ink hover:text-primary transition-all border border-line-2 flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={12} /> View File
                    </button>
                    <button className="w-9 h-9 bg-bg hover:bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink-4 transition-all hover:border-primary/30">
                      <Plus size={14} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Document Viewer Modal */}
        {viewingDoc && (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6" onClick={() => setViewingDoc(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-line-2" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-line-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${viewingDoc.status === 'valid' ? 'bg-accent-light text-accent' : 'bg-warning-light text-warning'}`}>
                    <viewingDoc.icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{viewingDoc.label}</h3>
                    <p className="text-xs text-ink-4 font-mono">{viewingDoc.id}</p>
                  </div>
                </div>
                <button onClick={() => setViewingDoc(null)} className="p-1.5 hover:bg-bg rounded-lg text-ink-4 transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                {/* Document Image */}
                <div className="rounded-2xl overflow-hidden border border-line-2 mb-4 bg-bg">
                  <img
                    src="/docs/license-mock.png"
                    alt={viewingDoc.label}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {/* Document Meta */}
                <div className="bg-bg rounded-2xl border border-line-2 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Document ID</span>
                    <span className="text-xs font-mono text-ink">{viewingDoc.id}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Expiry Date</span>
                    <span className="text-xs text-ink">{viewingDoc.expiry}</span>
                  </div>
                </div>
                <Badge variant={viewingDoc.status === 'valid' ? 'accent' : 'warning'} className="w-full justify-center py-2">
                  {viewingDoc.status === 'valid' ? '✓ Document Valid' : '⚠ Expiring Soon — Exp: ' + viewingDoc.expiry}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {showAddModal && (
        <AddDriverModal
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              await addDriver(data);
              setShowAddModal(false);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Driver Network</h1>
          <p className="text-sm text-ink-4 mt-0.5">Manage driver accounts and compliance auditing</p>
        </div>
        {role === 'admin' && (
          <Button variant="primary" icon={UserPlus} onClick={() => setShowAddModal(true)}>Create Driver Account</Button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Drivers', value: (drivers || []).length, sub: 'registered accounts', icon: Users, color: 'bg-primary-light text-primary' },
          { label: 'On Duty', value: (drivers || []).filter((d: any) => d?.onDuty).length, sub: 'currently active', icon: Car, color: 'bg-accent-light text-accent' },
          { label: 'In Trip', value: (drivers || []).filter((d: any) => d?.status === 'in_trip').length, sub: 'on the road now', icon: Truck, color: 'bg-primary-light/60 text-primary' },
          { label: 'Needs Attention', value: (drivers || []).filter((d: any) => (d?.pendingDocUpdates || 0) > 0).length, sub: 'document issues', icon: AlertTriangle, color: 'bg-urgent-light text-urgent' },
        ].map((s: any) => (
          <Card key={s.label} className={`p-5 flex items-center gap-4 ${s.label === 'Needs Attention' && s.value > 0 ? 'border-urgent/20' : ''}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-4 leading-none">{s.label}</p>
              <p className="text-2xl font-semibold text-ink mt-1 leading-none">{s.value}</p>
              <p className="text-xs text-ink-4 mt-1">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden border-line-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2 bg-bg/30">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Drivers' },
              { id: 'on_duty', label: 'On Duty' },
              { id: 'off_duty', label: 'Off Duty' },
              { id: 'attention', label: `Needs Attention${(drivers || []).some((d: any) => (d?.pendingDocUpdates || 0) > 0) ? ' (1)' : ''}` },
            ].map((tab: any) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-primary border border-line' : 'text-ink-4 hover:text-ink'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
            <input type="text" placeholder="Search name, ID..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none"
              value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg/40 border-b border-line-2">
              <tr>
                {['Info', 'Vehicle', 'Status', 'Activity', 'Compliance'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {paginatedDrivers.map((driver: any) => (
                <tr key={driver.id} className="hover:bg-bg/40 transition-colors group cursor-pointer" onClick={() => setSelectedDriverId(driver.id)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar initials={driver.initials} size="sm" />
                        {driver.onDuty && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white"></span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{driver.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-ink-3 bg-bg px-1.5 py-0.5 rounded border border-line-2">{driver.id}</span>
                          <span className="text-[10px] font-medium text-ink-4 truncate">{driver.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-ink whitespace-nowrap">{driver?.vehicle?.make || 'No Vehicle'}</p>
                      <p className="font-mono text-[10px] text-ink-4 mt-0.5">{driver?.vehicle?.plate || '---'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {getStatusBadge(driver.status)}
                      <span className="flex items-center gap-1 text-[11px] font-medium text-warning">
                        <Star size={10} fill="currentColor" /> {driver?.rating || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-ink">{driver?.tripsToday || 0}</span>
                        <span className="text-[10px] text-ink-4">today</span>
                      </div>
                      <p className="text-[10px] text-ink-4 mt-0.5">{(driver?.totalTrips || 0).toLocaleString()} total</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(driver?.pendingDocUpdates || 0) > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-urgent bg-urgent-light px-2 py-1 rounded-full w-fit">
                          <AlertTriangle size={10} /> Needs Review
                        </span>
                        <p className="text-[10px] text-ink-4 ml-2">{driver.pendingDocUpdates} doc(s)</p>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-accent bg-accent-light px-2 py-1 rounded-full w-fit">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 group-hover:text-primary group-hover:bg-primary-light transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedDrivers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-ink-4">
                    <Search size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-ink-4">No drivers match your filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDrivers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
};

export default Drivers;
