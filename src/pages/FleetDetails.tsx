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
  Package, Map as MapIcon, ArrowRight, UserPlus,
  Navigation, MessageSquare
} from 'lucide-react';
import { Card, Badge, Avatar, Button, StatCard, TripStatusBadge } from '../components/ui';
import { useFleet } from '../hooks/useFleet';
import { useDrivers } from '../hooks/useDrivers';
import { useTrips } from '../hooks/useTrips';
import { formatTime, formatShortDate, formatDateTime, tripTypeLabel, money } from '../utils/helpers';

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
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

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
  const selectedTrip = selectedTripId ? (trips || []).find((t: any) => t.id === selectedTripId) : null;

  const assignmentOptions = [...(drivers || [])].sort((a: any, b: any) => {
    const rank = (d: any) => {
      if (d.id === vehicle?.assignedDriverId) return 0;
      if (d.status === 'available' && d.onDuty) return 1;
      if (d.onDuty) return 2;
      if (d.status === 'off_duty') return 3;
      return 4;
    };

    return rank(a) - rank(b);
  });

  const getAssignedVehicle = (driverId: string) => (
    (vehicles || []).find((v: any) => v.assignedDriverId === driverId)
  );

  const isDriverUnavailable = (driverOption: any) => (
    driverOption.id !== vehicle?.assignedDriverId && driverOption.status === 'in_trip'
  );

  const assignOperator = async (driverOption: any) => {
    if (isDriverUnavailable(driverOption)) return;

    try {
      setAssigningDriverId(driverOption.id);
      const updatedVehicle = await handleAssign(vehicle.id, driverOption.id);
      setVehicle(updatedVehicle);
      setAssigning(false);
      setShowSuccess(`Driver ${driverOption.name} assigned successfully!`);
      setTimeout(() => setShowSuccess(null), 3000);
    } catch {
      setShowSuccess('Unable to assign this operator. Please try again.');
      setTimeout(() => setShowSuccess(null), 3000);
    } finally {
      setAssigningDriverId(null);
    }
  };

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
                                <p className="type-label text-ink-4">Last Known Base</p>
                                <p className="text-xs font-bold text-ink mt-0.5">Loggiskabir Main Dispatch Base</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                  <p className="type-label text-accent">Stationary · Signal High</p>
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
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-extrabold text-ink">Trip Logs</h3>
                      <p className="text-xs text-ink-3 font-medium font-sans">Recent operational history and rider fulfillments for this vehicle</p>
                    </div>
                    <Button variant="outline" size="sm" icon={FileText}>Generate Report</Button>
                  </div>

                  <Card className="overflow-hidden border border-line-2 shadow-sm">
                    <div className="overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-bg/50 border-b border-line-2">
                            <th className="px-4 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap">Trip ID</th>
                            <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap">Date & Pickup</th>
                            <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap">Rider</th>
                            <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap">Driver</th>
                            <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap">Route</th>
                            <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap text-right">Cost</th>
                            <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-2">
                          {vehicleTrips.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-ink-4 text-sm font-semibold">
                                No trip history recorded for this vehicle.
                              </td>
                            </tr>
                          ) : (
                            vehicleTrips.map((trip: any) => {
                              const driverObj = (drivers || []).find((d: any) => d.id === trip.driverId);
                              return (
                                <tr
                                  key={trip.id}
                                  onClick={() => setSelectedTripId(trip.id)}
                                  className="hover:bg-primary-tint/20 transition-colors group cursor-pointer animate-in fade-in"
                                >
                                  <td className="px-4 py-4">
                                    <span className="text-xs font-bold text-ink tracking-normal uppercase whitespace-nowrap">#{trip.id}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-medium text-ink whitespace-nowrap">
                                        {new Date(trip.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="text-xs font-semibold text-ink">
                                        Pickup: {trip.requestedPickup || new Date(trip.scheduledTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar initials={trip.rider?.initials || '?'} size="xs" />
                                      <span className="text-xs font-bold text-ink whitespace-nowrap">{trip.rider?.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {driverObj ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar initials={driverObj.initials} size="xs" />
                                        <span className="text-xs font-bold text-ink whitespace-nowrap">{driverObj.name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs font-bold text-ink-4">Unassigned</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full border-2 border-primary shrink-0" />
                                      <span className="text-xs font-semibold text-ink max-w-[120px] truncate">{trip.pickup || '---'}</span>
                                      <ArrowRight size={12} className="text-ink-4 shrink-0 mx-1" />
                                      <MapPin size={13} className="text-urgent shrink-0" />
                                      <span className="text-xs font-semibold text-ink-2 max-w-[120px] truncate">{trip.dropoff || '---'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="font-mono text-xs font-bold text-ink">${(trip.cost || 0).toFixed(2)}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <TripStatusBadge status={trip.status} />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
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
                <p className="type-label text-ink-4">Vehicle State</p>
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
                      <Badge variant="primary-light" className="font-black uppercase">Lvl 4 Dispatch</Badge>
                      <span className="flex items-center gap-1 type-action text-warning"><Star size={12} fill="currentColor" /> {driver.rating} Avg</span>
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

                <Button variant="outline" icon={User} className="w-full h-11 rounded-lg type-body-sm font-semibold" onClick={() => setAssigning(true)}>Reassign Operator</Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center text-ink-4 mx-auto mb-6 border-2 border-dashed border-line shadow-inner group hover:border-primary/30 transition-all">
                  <User size={32} className="group-hover:text-primary transition-colors" />
                </div>
                <p className="text-lg font-black text-ink mb-1.5 tracking-normal">Operator Vacancy</p>
                <p className="text-xs text-ink-3 mb-10 font-medium px-4">Vehicle requires an authorized driver assignment to resume active duties.</p>
                <Button variant="primary" icon={User} className="w-full h-11 rounded-lg type-body-sm font-semibold" onClick={() => setAssigning(true)}>Initialize Assignment</Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modern Assignment Modal */}
      {assigning && (
        <div className="fixed inset-0 bg-ink/55 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-line-2 ring-1 ring-ink/5">
            <div className="px-6 py-5 border-b border-line-2 flex items-start justify-between bg-white">
              <div>
                <h3 className="type-panel-title">Operator Assignment</h3>
                <p className="type-caption text-ink-3 mt-1">Deploying driver for unit <span className="text-primary font-bold">#{vehicle.plate}</span></p>
              </div>
              <button
                onClick={() => setAssigning(false)}
                className="w-10 h-10 rounded-lg bg-bg border border-line-2 flex items-center justify-center text-ink-4 hover:text-urgent hover:border-urgent/20 transition-all"
                aria-label="Close operator assignment"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
              {assignmentOptions.map((d: any) => {
                const assignedVehicle = getAssignedVehicle(d.id);
                const unavailable = isDriverUnavailable(d);
                const isCurrent = d.id === vehicle.assignedDriverId;

                return (
                <button
                  key={d.id}
                  onClick={() => assignOperator(d)}
                  disabled={unavailable || assigningDriverId === d.id}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all group ${
                    isCurrent
                      ? 'bg-primary-light/40 border-primary/20'
                      : unavailable
                        ? 'bg-bg/50 border-line-2 opacity-60 cursor-not-allowed'
                        : 'bg-white border-line-2 hover:border-primary/25 hover:bg-bg'
                  }`}
                >
                  <div className="relative">
                    <Avatar initials={d.initials} size="lg" online={d.onDuty} className="group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-base font-bold text-ink group-hover:text-primary transition-colors truncate">{d.name}</p>
                      {isCurrent && <Badge variant="primary" className="shrink-0">Current</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Badge variant={d.onDuty ? 'accent' : 'neutral'} className="uppercase">{d.status.replace('_', ' ')}</Badge>
                      <div className="flex items-center gap-1.5">
                        <Star size={12} className="text-warning fill-warning" />
                        <span className="type-action text-ink-3">{d.rating}</span>
                      </div>
                      {assignedVehicle && (
                        <span className="type-caption text-ink-4">
                          Assigned to {assignedVehicle.id === vehicle.id ? 'this unit' : assignedVehicle.plate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    unavailable ? 'bg-line-2 text-ink-4' : 'bg-bg text-ink-3 group-hover:bg-primary group-hover:text-white'
                  }`}>
                    {assigningDriverId === d.id ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                  </div>
                </button>
              );})}
            </div>
          </Card>
        </div>
      )}

      {/* High-Fidelity Trip Details Modal (Identical to Trip History) */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-ink/55 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border-line-2 ring-1 ring-ink/5 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-line-2 flex items-start justify-between bg-bg/25">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black font-display text-ink tracking-tight">Trip Ledger Detail</h3>
                  <TripStatusBadge status={selectedTrip.status} />
                </div>
                <p className="text-xs text-ink-3 font-semibold mt-1">Ref ID: <span className="font-mono text-ink bg-bg px-2 py-0.5 rounded border border-line-2 uppercase">#{selectedTrip.id}</span> · Authorization: {selectedTrip.authId || selectedTrip.authorizationId || 'County Auth'}</p>
              </div>
              <button
                onClick={() => setSelectedTripId(null)}
                className="w-10 h-10 rounded-xl bg-white border border-line-2 flex items-center justify-center text-ink-4 hover:text-urgent hover:border-urgent/25 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[580px] overflow-y-auto scrollbar-hide">
              {/* Route Ledger Card */}
              <section className="bg-bg/40 rounded-2xl border border-line-2 p-6 shadow-inner space-y-4">
                <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-3">Manifest Route & Tracking</h4>
                <div className="relative space-y-6 pl-4 border-l-2 border-line-2">
                  <div className="flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-ink-4 mb-0.5">Pickup Location</p>
                      <p className="text-xs font-bold text-ink leading-relaxed uppercase">{selectedTrip.pickup}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-urgent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <MapPin size={10} className="text-urgent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-ink-4 mb-0.5">Drop-off Destination</p>
                      <p className="text-xs font-bold text-ink leading-relaxed uppercase">{selectedTrip.dropoff}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rider & Driver Splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 border-line-2 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-primary uppercase tracking-widest">Rider Profile</h4>
                  <div className="flex items-center gap-4">
                    <Avatar initials={selectedTrip.rider?.initials || '?'} size="lg" />
                    <div>
                      <h5 className="text-sm font-bold text-ink">{selectedTrip.rider?.name}</h5>
                      <p className="text-xs text-ink-4 font-semibold mt-0.5">{selectedTrip.rider?.phone || 'No phone verified'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-line-2 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-accent uppercase tracking-widest">Driver Assignment</h4>
                  {selectedTrip.driverId ? (
                    <div className="flex items-center gap-4">
                      <Avatar initials={drivers.find((d: any) => d.id === selectedTrip.driverId)?.initials || '?'} size="lg" />
                      <div>
                        <h5 className="text-sm font-bold text-ink">{drivers.find((d: any) => d.id === selectedTrip.driverId)?.name}</h5>
                        <p className="text-xs text-ink-4 font-semibold mt-0.5">{drivers.find((d: any) => d.id === selectedTrip.driverId)?.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-4 font-bold uppercase py-4">No driver assigned to this trip.</p>
                  )}
                </Card>
              </div>

              {/* Financial Summary */}
              <section className="bg-white rounded-2xl border border-line-2 p-6 shadow-sm">
                <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-4">Financial Allocation Ledger</h4>
                <div className="grid grid-cols-3 gap-4 border-b border-line border-dashed pb-4 mb-4">
                  <div>
                    <p className="text-xs text-ink-4">Total Manifest Cost</p>
                    <p className="text-lg font-black text-ink mt-1 font-mono">${(selectedTrip.cost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">Rider Copay</p>
                    <p className="text-lg font-black text-ink mt-1 font-mono">${(selectedTrip.copay || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">County Reimbursable</p>
                    <p className="text-lg font-black text-primary mt-1 font-mono">${((selectedTrip.cost || 0) - (selectedTrip.copay || 0)).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-ink-4 uppercase">
                  <span>Billing Source: {selectedTrip.source || 'County Care'}</span>
                  <span>Mobility Type: {selectedTrip.type || 'Ambulatory'}</span>
                </div>
              </section>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FleetDetails;
