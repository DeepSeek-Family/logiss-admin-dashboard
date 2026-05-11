import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Truck, AlertTriangle, Wrench, ShieldCheck,
  ChevronLeft, Calendar, FileText, Hash,
  User, Star, Phone, Info, Loader2,
  Activity, MapPin, Gauge, Clock, Shield,
  MoreVertical, Settings, History, Layers,
  Power, Zap, Fuel, Thermometer, Radio,
  ArrowUpRight, ArrowDownRight, CheckCircle2,
  ChevronRight, X, Plus, ClipboardCheck,
  Package, Map as MapIcon
} from 'lucide-react';
import { Card, Badge, Avatar, Button, StatCard } from '../components/ui';
import { useFleet } from '../hooks/useFleet';
import { useDrivers } from '../hooks/useDrivers';
import { useTrips } from '../hooks/useTrips';

const FleetDetails = ({ role }: { role?: string | null }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { vehicles, loading: fleetLoading, handleAssign, updateStatus } = useFleet();
  const { drivers, loading: driversLoading } = useDrivers();
  const { trips } = useTrips();

  const [vehicle, setVehicle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const VEHICLE_IMAGE = "/login-bg.png";

  useEffect(() => {
    if (vehicles.length > 0) {
      const found = vehicles.find((v: any) => v.id === id);
      if (found) {
        setVehicle(found);
      }
    }
  }, [id, vehicles]);

  if (fleetLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-ink-3">Synchronizing Vehicle Data...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8">
        <div className="w-20 h-20 bg-urgent-light text-urgent rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-extrabold text-ink mb-2">Vehicle Not Found</h2>
        <p className="text-ink-3 mb-8 max-w-sm">The vehicle with ID #{id} could not be located in the system.</p>
        <Button variant="primary" onClick={() => navigate('/fleet')}>Back to Fleet</Button>
      </div>
    );
  }

  const driver = (drivers || []).find((d: any) => d.id === vehicle?.assignedDriverId);
  const vehicleTrips = (trips || []).filter((t: any) => t.vehicleId === vehicle?.id);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    if (vehicle?.id) {
      await updateStatus(vehicle.id, newStatus);
    }
    setUpdatingStatus(false);
    setShowSuccess(`Status updated to ${newStatus}`);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleLogService = () => {
    setShowSuccess("Service logged successfully! Maintenance records updated.");
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'trips', label: 'Trip History', icon: History },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/fleet')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-line-2 text-ink-3 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black font-display text-ink tracking-normal">{vehicle.make} {vehicle.model}</h1>
              <Badge variant={vehicle.status === 'available' ? 'accent' : vehicle.status === 'maintenance' ? 'urgent' : 'primary'}>
                {vehicle.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-ink-3 font-semibold flex items-center gap-2 mt-1 uppercase tracking-wider text-xs">
              <Hash size={14} className="text-primary" /> {vehicle.id} · <span className="font-mono text-ink bg-bg px-2 py-0.5 rounded border border-line-2">{vehicle.plate}</span> · {vehicle.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(role === 'admin' || role === 'dispatcher') && (
            <Button variant="outline" icon={Wrench} onClick={handleLogService}>Log Service</Button>
          )}
          <Button variant="primary" icon={Settings}>Configure Vehicle</Button>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-accent text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">{showSuccess}</span>
          </div>
          <button onClick={() => setShowSuccess(null)}><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats and Tabs */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Odometer" value={`${vehicle.mileage.toLocaleString()} mi`} icon={Gauge} sub="Last sync 2h ago" />
            <StatCard label="Total Trips" value={vehicleTrips.length} icon={History} sub="Past 30 days" />
            <StatCard label="Insurance" value={vehicle.insurance?.status || 'Active'} icon={Shield} accent={vehicle.insurance?.status === 'valid' ? 'accent' : 'warning'} sub={vehicle.insurance?.expires} />
            <StatCard label="Capacity" value={vehicle.seats} icon={User} accent="primary" sub="Rider limit" />
          </div>

          {/* Main Content Area */}
          <Card className="overflow-hidden border-none shadow-sm">
            <div className="flex items-center gap-1 bg-bg p-1 rounded-xl border border-line-2 mb-6 w-fit mx-6 mt-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-primary shadow-sm border border-line-2' : 'text-ink-4 hover:text-ink'
                  }`}
                >
                  <tab.icon size={14} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                  <div className="space-y-6">
                    <Card className="p-6">
                      <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-4">Vehicle Specifications</h4>
                      <div className="space-y-4">
                        {[
                          ['Category', vehicle.type],
                          ['Max Occupancy', `${vehicle.seats} Riders`],
                          ['Exterior Color', vehicle.color],
                          ['VIN Identification', vehicle.vin],
                          ['Model Year', vehicle.year],
                          ['Service Status', vehicle.status.replace('_', ' ')]
                        ].map(([l, v]) => (
                          <div key={l} className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                            <span className="text-xs font-bold text-ink-4">{l}</span>
                            <span className="text-xs font-bold text-ink capitalize">{v}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-4">Special Equipment</h4>
                      <div className="p-4 bg-primary-tint/10 rounded-2xl border border-primary/10 flex gap-3">
                        <Info size={16} className="text-primary shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-ink-3 leading-relaxed">
                          Equipped with hydraulic wheelchair lift, emergency oxygen supply, and reinforced cabin floor for medical safety compliance.
                        </p>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="p-6">
                      <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-4">Operational Context</h4>
                      <div className="aspect-[4/3] bg-bg rounded-xl border border-line-2 relative overflow-hidden group shadow-sm">
                        <img
                          src={VEHICLE_IMAGE}
                          alt="Fleet Vehicle"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-line-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <MapIcon size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-ink-4 uppercase tracking-widest">Last Known Base</p>
                                <p className="text-xs font-bold text-ink mt-0.5">Loggiskabir Main Dispatch Base</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Stationary · Signal High</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-extrabold text-ink">Service Registry</h3>
                      <p className="text-xs text-ink-3 font-medium">Detailed history of repairs and preventative maintenance</p>
                    </div>
                    <Button variant="primary-light" size="sm" icon={Plus} onClick={handleLogService}>Add Registry Entry</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(vehicle.maintenance || []).map((log: any, i: number) => (
                      <div key={i} className="flex items-center gap-5 p-5 bg-bg/40 rounded-3xl border border-line-2 hover:border-primary/20 hover:bg-white hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-line-2 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                          <Wrench size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-bold text-ink">{log.type}</p>
                            <div className="flex items-center gap-4">
                              <Badge variant="neutral" className="text-xs font-black">{log.shop}</Badge>
                              <p className="text-sm font-black text-ink tracking-normal">${log.cost}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold text-ink-4 uppercase tracking-[0.15em]">
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {log.date}</span>
                            <span className="w-1 h-1 rounded-full bg-line-2" />
                            <span className="flex items-center gap-1.5"><Gauge size={12} /> {log.mileage.toLocaleString()} mi</span>
                            <span className="w-1 h-1 rounded-full bg-line-2" />
                            <span className="flex items-center gap-1.5 text-accent"><ClipboardCheck size={12} /> Verified</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'trips' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-extrabold text-ink">Trip Logs</h3>
                      <p className="text-xs text-ink-3 font-medium">Recent operational history and rider fulfillments</p>
                    </div>
                    <Button variant="outline" size="sm" icon={FileText}>Generate Report</Button>
                  </div>
                  <div className="space-y-3">
                    {vehicleTrips.slice(0, 10).map((trip: any, i: number) => (
                      <div key={i} className="flex items-center gap-5 p-5 bg-bg/40 rounded-3xl border border-line-2 hover:border-line hover:bg-white transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-ink-4 group-hover:text-primary transition-all border border-transparent group-hover:border-primary/20 shadow-sm">
                          <Truck size={20} />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                          <div className="col-span-1">
                            <p className="text-xs font-black text-ink">{trip.rider.name}</p>
                            <p className="text-xs text-ink-4 font-bold uppercase tracking-widest mt-1">Ref: #{trip.id.slice(-6)}</p>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-line-2 shrink-0" />
                              <p className="text-xs font-bold text-ink-3 truncate uppercase">{trip.pickup}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <p className="text-xs font-black text-ink truncate uppercase">{trip.dropoff}</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-4">
                            <div className="text-right mr-2">
                              <p className="text-xs font-black text-ink uppercase tracking-wider">{new Date(trip.scheduledTime).toLocaleDateString()}</p>
                              <p className="text-xs text-ink-4 font-bold uppercase tracking-widest">Completed</p>
                            </div>
                            <Badge variant="accent" className="text-xs font-black uppercase px-3">VAL</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
                  <div className="space-y-8">
                    <h3 className="text-xs font-black text-ink-4 uppercase tracking-[0.25em] mb-5 border-b border-line-2 pb-2">Insurance & Coverage</h3>
                    <div className="bg-bg/40 rounded-3xl border border-line-2 p-8 space-y-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Shield size={120} />
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-accent-light/20 text-accent flex items-center justify-center shadow-inner">
                          <Shield size={32} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-ink-4 uppercase tracking-[0.2em] leading-none">Policy Number</p>
                          <p className="text-2xl font-black text-ink mt-2 tracking-normal">{vehicle.insurance?.policy || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-line-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-ink-4 uppercase tracking-[0.15em]">Expiration Date</span>
                          <span className="text-sm font-black text-ink">{vehicle.insurance?.expires || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-ink-4 uppercase tracking-[0.15em]">Carrier</span>
                          <span className="text-sm font-black text-primary">{vehicle.insurance?.provider || 'N/A'}</span>
                        </div>
                        <Badge variant={vehicle.insurance?.status === 'valid' ? 'accent' : 'warning'} className="w-full justify-center py-3 text-xs font-black tracking-[0.2em] rounded-xl">
                          {vehicle.insurance?.status.toUpperCase() || 'UNKNOWN'} PROTECTION ACTIVE
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-xs font-black text-ink-4 uppercase tracking-[0.25em] mb-5 border-b border-line-2 pb-2">Operating Authorities</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        ['DOT Operating Authority', 'Active', 'accent', ClipboardCheck],
                        ['City Business License', 'Active', 'accent', FileText],
                        ['Safety Inspection', 'Due 09/24', 'warning', Wrench],
                        ['Fleet Bio-Safety Cert', 'Active', 'accent', ShieldCheck]
                      ].map(([label, status, color, Icon]: any) => (
                        <div key={label} className="flex items-center justify-between p-5 bg-bg/40 rounded-2xl border border-line-2 hover:border-primary/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <Icon size={16} className="text-ink-3 group-hover:text-primary" />
                            <span className="text-xs font-bold text-ink">{label}</span>
                          </div>
                          <Badge variant={color as any} className="text-xs font-black uppercase tracking-widest px-3">{status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Dynamic Control Hub */}
          <Card className="p-6 border-line-2 shadow-sm">
            <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-6">Operational Control</h4>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm ${vehicle.status === 'available' ? 'bg-accent-light text-accent' :
                  vehicle.status === 'maintenance' ? 'bg-urgent-light text-urgent' : 'bg-ink/5 text-ink'
                }`}>
                {vehicle.status === 'available' ? <Power size={24} /> : vehicle.status === 'maintenance' ? <Wrench size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <p className="text-[10px] font-black text-ink-4 uppercase tracking-widest">Vehicle State</p>
                <p className="text-lg font-black text-ink capitalize mt-0.5">{vehicle.status.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: 'available', label: 'Set to Active / Available', icon: Power, color: 'accent' },
                { id: 'maintenance', label: 'Flag for Maintenance', icon: Wrench, color: 'urgent' },
                { id: 'off_duty', label: 'Recall to Base / Off-Duty', icon: Clock, color: 'ink-4' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStatusChange(s.id)}
                  disabled={updatingStatus || vehicle.status === s.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left group ${vehicle.status === s.id
                      ? 'bg-ink border-ink text-white shadow-sm'
                      : 'bg-white border-line-2 text-ink-4 hover:border-primary/20 hover:text-primary hover:bg-bg'
                    }`}
                >
                  <s.icon size={16} className={vehicle.status === s.id ? 'text-white' : 'group-hover:text-primary transition-colors'} />
                  <span className="text-xs font-bold">{s.label}</span>
                  {updatingStatus && vehicle.status === s.id && <Loader2 size={14} className="ml-auto animate-spin" />}
                  {vehicle.status === s.id && !updatingStatus && <CheckCircle2 size={14} className="ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </Card>

          {/* Assignment & Driver Hub */}
          <Card className="p-6 border-line-2 shadow-sm">
            <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-6">Operator Fulfillment</h4>
            {driver ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar initials={driver.initials} size="lg" online={driver.onDuty} className="ring-2 ring-bg" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{driver.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="primary-light" className="text-[10px] font-black uppercase">Lvl 4 Dispatch</Badge>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-warning"><Star size={10} fill="currentColor" /> {driver.rating} Avg</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-line-2">
                    <span className="text-xs font-bold text-ink-4 flex items-center gap-2"><Phone size={14} /> Terminal</span>
                    <span className="text-xs font-bold text-ink">{driver.phone}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-line-2">
                    <span className="text-xs font-bold text-ink-4 flex items-center gap-2"><Package size={14} /> Assignments</span>
                    <span className="text-xs font-bold text-ink">{driver.totalTrips} Trips</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em]" onClick={() => setAssigning(true)}>Reassign Operator</Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center text-ink-4 mx-auto mb-6 border-2 border-dashed border-line shadow-inner group hover:border-primary/30 transition-all">
                  <User size={32} className="group-hover:text-primary transition-colors" />
                </div>
                <p className="text-lg font-black text-ink mb-1.5 tracking-normal">Operator Vacancy</p>
                <p className="text-xs text-ink-3 mb-10 font-medium px-4">Vehicle requires an authorized driver assignment to resume active duties.</p>
                <Button variant="primary" className="w-full rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em]" onClick={() => setAssigning(true)}>Initialize Assignment</Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modern Assignment Modal */}
      {assigning && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-line-2 ring-1 ring-ink/5">
            <div className="p-10 border-b border-line-2 flex items-center justify-between bg-bg/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <User size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-ink tracking-normal">Operator Assignment</h3>
                <p className="text-xs text-ink-3 font-medium mt-1">Deploying driver for unit <span className="text-primary font-bold">#{vehicle.plate}</span></p>
              </div>
              <button onClick={() => setAssigning(false)} className="w-14 h-14 rounded-2xl bg-white border border-line-2 flex items-center justify-center text-ink-4 hover:text-urgent hover:border-urgent/20 transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>
            <div className="p-10 space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide">
              {drivers.filter((d: any) => !d.vehicleId || d.vehicleId === vehicle.id).map((d: any) => (
                <button
                  key={d.id}
                  onClick={() => { handleAssign(vehicle.id, d.id); setAssigning(false); setShowSuccess(`Driver ${d.name} assigned successfully!`); setTimeout(() => setShowSuccess(null), 3000); }}
                  className="w-full flex items-center gap-6 p-6 rounded-[32px] hover:bg-bg transition-all border-2 border-transparent hover:border-primary/20 text-left group"
                >
                  <div className="relative">
                    <Avatar initials={d.initials} size="lg" online={d.onDuty} className="group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-ink group-hover:text-primary transition-colors tracking-normal">{d.name}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Badge variant={d.onDuty ? 'accent' : 'neutral'} className="text-xs font-black uppercase px-2 py-0.5">{d.status}</Badge>
                      <div className="flex items-center gap-1.5">
                        <Star size={12} className="text-warning fill-warning" />
                        <span className="text-xs font-black text-ink-3">{d.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center text-ink-3 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={20} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FleetDetails;
