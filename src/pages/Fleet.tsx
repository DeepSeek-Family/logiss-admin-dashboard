import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Truck, AlertTriangle, CheckCircle2, Clock,
  Wrench, ShieldCheck, X, Check, Plus, Search,
  User, ChevronRight, FileText, Calendar, Gauge,
  CreditCard, MapPin, Star, Hash, Shield, Info, Loader2,
  Settings, Zap, ShieldAlert, ClipboardCheck, LayoutGrid, List,
  Activity
} from 'lucide-react';
import { Card, Badge, Avatar, Button, Pagination } from '../components/ui';
import { useFleet } from '../hooks/useFleet';
import { useDrivers } from '../hooks/useDrivers';
import { useTrips } from '../hooks/useTrips';

const VEHICLE_TYPES = ['Ambulatory Van', 'Wheelchair Van', 'Stretcher Van'];

interface FleetForm {
  make: string;
  model: string;
  year: string;
  plate: string;
  vin: string;
  type: string;
  seats: string;
  mileage: string;
  nextService: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
}

const EMPTY_FORM: FleetForm = {
  make: '', model: '', year: '', plate: '', vin: '',
  type: 'Ambulatory Van', seats: '',
  mileage: '', nextService: '',
  insuranceProvider: '', insurancePolicy: '', insuranceExpiry: '',
};

const VEHICLE_PLACEHOLDER = "C:\\Users\\being\\.gemini\\antigravity\\brain\\f72299ac-f7db-4b11-8522-53b8903b8c83\\modern_medical_transport_van_1777469722489.png";

const AddVehicleModal = ({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) => {
  const [form, setForm] = useState<FleetForm>(EMPTY_FORM);
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
              <h2 className="text-xl font-bold font-display text-ink tracking-tight">Register New Unit</h2>
              <p className="text-xs text-ink-3 font-semibold mt-1">Deployment Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-urgent-light hover:text-urgent text-ink-4 transition-all flex items-center justify-center border border-transparent hover:border-urgent/10"><X size={20} /></button>
        </div>

        <div className="flex px-8 pt-6 gap-3">
          {['Vehicle Specifications', 'Compliance & Safety'].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${step > i ? 'bg-primary' : 'bg-line-2'}`} />
              <p className={`text-xs font-bold mt-2 ${step === i + 1 ? 'text-primary' : 'text-ink-4'}`}>{s}</p>
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
                  <label className="block text-xs font-bold text-ink-4 mb-2.5 ml-1">{field.label}</label>
                  <input
                    className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm font-bold text-ink outline-none transition-all placeholder:text-ink-4/50"
                    type="text"
                    placeholder={field.ph}
                    value={form[field.key as keyof FleetForm]}
                    onChange={e => set(field.key as keyof FleetForm, e.target.value)}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-ink-4 mb-2.5 ml-1">VIN Number (17 Characters)</label>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm font-bold text-ink font-mono outline-none transition-all placeholder:text-ink-4/50 uppercase"
                  placeholder="1FD..."
                  value={form.vin}
                  onChange={e => set('vin', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-4 mb-2.5 ml-1">Configuration Type</label>
                <select
                  className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm font-bold text-ink outline-none transition-all cursor-pointer"
                  value={form.type}
                  onChange={e => set('type', e.target.value)}
                >
                  {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-4 mb-2.5 ml-1">Max Passengers</label>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-bg border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm font-bold text-ink outline-none transition-all"
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
                <p className="text-xs font-bold text-ink flex items-center gap-2 mb-2">
                  <Wrench size={14} className="text-primary" /> Maintenance Schedule
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-ink-4 uppercase tracking-widest mb-2 ml-1">Current Odometer</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm font-bold text-ink outline-none" type="number" placeholder="0" value={form.mileage} onChange={e => set('mileage', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-ink-4 uppercase tracking-widest mb-2 ml-1">Next Service Date</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm font-bold text-ink outline-none" type="date" value={form.nextService} onChange={e => set('nextService', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="bg-bg/40 rounded-3xl p-6 border-2 border-line-2 space-y-5">
                <p className="text-xs font-bold text-ink flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-accent" /> Insurance Records
                </p>
                <div>
                  <label className="block text-[9px] font-black text-ink-4 uppercase tracking-widest mb-2 ml-1">Carrier Provider</label>
                  <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm font-bold text-ink outline-none" placeholder="e.g., Progressive Commercial" value={form.insuranceProvider} onChange={e => set('insuranceProvider', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-ink-4 uppercase tracking-widest mb-2 ml-1">Policy Number</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm font-bold text-ink outline-none" placeholder="POL-00000" value={form.insurancePolicy} onChange={e => set('insurancePolicy', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-ink-4 uppercase tracking-widest mb-2 ml-1">Expiration Date</label>
                    <input className="w-full h-11 px-4 rounded-xl bg-white border border-line-2 focus:border-primary/30 text-sm font-bold text-ink outline-none" type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-7 border-t border-line-2 flex items-center justify-between bg-bg/10">
          <button onClick={onClose} className="text-xs font-bold text-ink-4 hover:text-urgent transition-colors">Abort</button>
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

const statusConfig: { [key: string]: any } = {
  available: { label: 'Available', dot: 'bg-accent', text: 'text-accent', bg: 'bg-accent-light border-accent/20' },
  in_trip: { label: 'In Trip', dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary-tint/40 border-primary/20' },
  break: { label: 'On Break', dot: 'bg-warning', text: 'text-warning-dark', bg: 'bg-warning-light border-warning/20' },
  off_duty: { label: 'Off Duty', dot: 'bg-ink-4', text: 'text-ink-4', bg: 'bg-bg border-line-2' },
  maintenance: { label: 'In Maintenance', dot: 'bg-urgent', text: 'text-urgent', bg: 'bg-urgent-light border-urgent/20' },
};

const insuranceBadge: { [key: string]: any } = { valid: 'accent', expiring: 'warning', expired: 'urgent' };

const typeBadge: { [key: string]: any } = {
  'Ambulatory Van': 'primary',
  'Wheelchair Van': 'accent',
  'Stretcher Van': 'warning',
};

const AssignDriverCell = ({ vehicle, allDrivers, onAssign }: { vehicle: any; allDrivers: any[]; onAssign: (vId: string, dId: string | null) => void }) => {
  const [open, setOpen] = useState(false);
  const driver = allDrivers.find(d => d.id === vehicle.assignedDriverId);

  return (
    <div className="relative">
      {driver ? (
        <div className="flex items-center gap-3">
          <Avatar initials={driver.initials} size="xs" online={driver.onDuty} className="ring-2 ring-white shadow-sm" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink truncate tracking-tight">{driver.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-4 font-semibold flex items-center gap-0.5"><Star size={8} className="fill-warning text-warning" /> {driver.rating}</span>
              <span className="text-xs text-primary font-bold">#{driver.totalTrips}T</span>
            </div>
          </div>
          <button onClick={() => setOpen(o => !o)} className="ml-1 w-6 h-6 rounded-lg bg-bg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
            <Settings size={12} />
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg border border-dashed border-line text-xs font-bold text-ink-4 hover:text-primary hover:border-primary/30 transition-all">
          <User size={12} /> Assign Operator
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-[24px] border border-line-2 shadow-2xl z-50 py-2 animate-in slide-in-from-top-3 duration-200 ring-1 ring-ink/5">
          <div className="px-4 py-2 border-b border-line-2 mb-2">
            <p className="text-xs font-bold text-ink-4">Select Deployment Operator</p>
          </div>
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {allDrivers.map(d => (
              <button key={d.id} onClick={() => { onAssign(vehicle.id, d.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors group">
                <Avatar initials={d.initials} size="xs" online={d.onDuty} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-bold text-ink truncate group-hover:text-primary transition-colors">{d.name}</p>
                  <p className="text-xs text-ink-4 font-bold">{d.status.replace('_', ' ')}</p>
                </div>
                {vehicle.assignedDriverId === d.id && <CheckCircle2 size={14} className="text-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
          {vehicle.assignedDriverId && (
            <button onClick={() => { onAssign(vehicle.id, null); setOpen(false); }}
              className="w-full px-4 py-3 text-xs font-bold text-urgent hover:bg-urgent-light transition-colors text-center border-t border-line-2 mt-2">
              Vacate Unit Assignment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Fleet = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const { vehicles, loading: fleetLoading, addVehicle, handleAssign } = useFleet();
  const { drivers, loading: driversLoading } = useDrivers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loading = fleetLoading || driversLoading;

  const filtered = (vehicles || []).filter((v: any) => {
    const q = (search || '').toLowerCase();
    const matchSearch = !q || (v?.make || '').toLowerCase().includes(q) || (v?.model || '').toLowerCase().includes(q)
      || (v?.plate || '').toLowerCase().includes(q) || (v?.id || '').toLowerCase().includes(q);
    const matchTab =
      filter === 'available' ? v?.status === 'available' :
        filter === 'in_trip' ? v?.status === 'in_trip' :
          filter === 'issues' ? (v?.insurance?.status !== 'valid' || v?.status === 'maintenance') : true;
    return matchSearch && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: (vehicles || []).length,
    available: (vehicles || []).filter((v: any) => v?.status === 'available').length,
    inTrip: (vehicles || []).filter((v: any) => v?.status === 'in_trip').length,
    issues: (vehicles || []).filter((v: any) => v?.insurance?.status !== 'valid' || v?.status === 'maintenance').length,
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-sm font-bold text-ink-3 tracking-wide">Initializing Fleet Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} onSave={addVehicle} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Fleet Management</h1>
          <p className="text-ink-3 text-sm mt-1">Real-time asset tracking, compliance auditing, and operator logistics</p>
        </div>
        {role === 'admin' && (
          <Button variant="primary" className="rounded-2xl px-8 py-6 shadow-xl shadow-primary/20" icon={Plus} onClick={() => setShowAddModal(true)}>Deploy New Unit</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Fleet Assets', value: stats.total, sub: 'Managed Units', icon: Truck, color: 'from-primary to-primary/80', iconColor: 'text-white' },
          { label: 'Mission Ready', value: stats.available, sub: 'Active Duty', icon: Zap, color: 'from-accent to-accent/80', iconColor: 'text-white' },
          { label: 'Live Deployments', value: stats.inTrip, sub: 'En Route', icon: Activity, color: 'from-primary-tint to-primary/60', iconColor: 'text-white' },
          { label: 'Risk & Service', value: stats.issues, sub: 'Attention Required', icon: ShieldAlert, color: 'from-urgent to-urgent/80', iconColor: 'text-white' },
        ].map(s => (
          <Card key={s.label} className={`p-6 flex items-center gap-5 border-none shadow-xl ring-1 ring-ink/5 bg-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.color} opacity-5 -mr-12 -mt-12 rounded-full`} />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${s.color} shadow-lg shadow-primary/10 group-hover:rotate-6 transition-transform duration-500`}>
              <s.icon size={24} className="text-white" />
            </div>
            <div className="min-w-0 relative z-10">
              <p className="text-xs font-bold text-ink-4 leading-none mb-2">{s.label}</p>
              <p className="text-2xl font-bold text-ink tracking-tight leading-none">{s.value}</p>
              <p className="text-xs font-medium text-ink-3 mt-2 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-line-2" /> {s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-line-2 shadow-xl shadow-ink/5 ring-1 ring-ink/5 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-8 py-6 border-b border-line-2 bg-bg/20">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl shadow-inner ring-1 ring-ink/5 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: 'All Units' },
              { id: 'available', label: 'Available' },
              { id: 'in_trip', label: 'In Trip' },
              { id: 'issues', label: `Maintenance${stats.issues ? ` (${stats.issues})` : ''}` },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === tab.id ? 'bg-primary text-white shadow-md' : 'text-ink-4 hover:text-ink hover:bg-bg'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" size={16} />
            <input type="text" placeholder="Search Assets, Plates, or IDs..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl text-xs font-bold text-ink shadow-sm ring-1 ring-ink/5 outline-none transition-all placeholder:text-ink-4/60"
              value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg/40 border-b border-line-2">
              <tr>
                {['Asset Details', 'Vehicle Type', 'Status', 'Operator', 'Telematics', 'Next Service', 'Compliance', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {paginated.map((v: any) => {
                const s = statusConfig[v.status] || statusConfig.available;
                const nextServiceDate = v?.nextService ? new Date(v.nextService) : null;
                const nextServiceDays = nextServiceDate ? Math.ceil((nextServiceDate.getTime() - new Date().getTime()) / 86400000) : null;
                const serviceWarning = nextServiceDays !== null && nextServiceDays < 60;

                return (
                  <tr key={v.id} className="hover:bg-bg/40 transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-line overflow-hidden relative">
                          <img src={v.image || VEHICLE_PLACEHOLDER} alt={v.plate} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate tracking-tight">{v.year} {v.make} {v.model}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-bold text-ink-2 bg-bg px-1.5 py-0.5 rounded border border-line-2">{v.plate}</span>
                            <span className="text-xs text-ink-4 font-medium">ID: {v.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={typeBadge[v.type] || 'neutral'} className="text-xs font-bold px-2 py-0.5">{v.type}</Badge>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <AssignDriverCell vehicle={v} allDrivers={drivers} onAssign={handleAssign} />
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-ink tracking-tight">{(v?.mileage || 0).toLocaleString()}<span className="text-xs text-ink-4 font-medium ml-1">mi</span></p>
                      <p className="text-xs font-medium text-ink-4 mt-0.5">{v?.seats || 0} Capacity</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 ${serviceWarning ? 'text-urgent' : 'text-ink-3'}`}>
                        {serviceWarning ? <ShieldAlert size={12} /> : <ClipboardCheck size={12} className="text-accent" />}
                        <span className="text-xs font-bold">{v.nextService}</span>
                      </div>
                      {serviceWarning && <p className="text-xs font-medium mt-0.5">Due in {nextServiceDays}d</p>}
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant={insuranceBadge[v.insurance?.status] || 'neutral'} className="text-xs font-bold px-2 py-0.5">
                        {v.insurance?.status}
                      </Badge>
                      <p className="text-xs text-ink-4 mt-1 font-medium italic">Exp {v.insurance?.expires || 'N/A'}</p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/fleet/${v.id}`)}
                        className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-ink-4 hover:bg-primary hover:text-white transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-24 text-center">
                    <div className="w-20 h-20 bg-bg rounded-[32px] flex items-center justify-center text-ink-4 mx-auto mb-6 shadow-inner border-2 border-dashed border-line group">
                      <Truck size={40} className="group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-lg font-black text-ink tracking-tight">No Matching Assets Identified</p>
                    <p className="text-sm font-medium text-ink-3 mt-1">Refine your search parameters or filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-bg/20 px-8 py-6 border-t border-line-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>
    </div>
  );
};

export default Fleet;
