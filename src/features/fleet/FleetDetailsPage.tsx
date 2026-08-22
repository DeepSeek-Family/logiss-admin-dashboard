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
import { Card, Badge, Avatar, Button, StatCard, TripStatusBadge } from '@/shared/components/ui';
import {
  FleetOverviewTab,
  FleetMaintenanceTab,
  FleetTripsTab,
  FleetComplianceTab,
  FleetAssignmentPanel
} from '@/features/fleet';
import { useFleet } from '@/hooks/useFleet';
import { useDrivers } from '@/hooks/useDrivers';
import { useTrips } from '@/hooks/useTrips';
import { formatTime, formatShortDate, formatDateTime, tripTypeLabel, money } from '@/utils/helpers';

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
          <p className="text-sm text-ink-4">Synchronizing Vehicle Data...</p>
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
        <h2 className="text-2xl font-semibold text-ink mb-2">Vehicle Not Found</h2>
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
              <h1 className="type-page-title">{vehicle.make} {vehicle.model}</h1>
              <Badge variant={vehicle.status === 'available' ? 'accent' : vehicle.status === 'maintenance' ? 'urgent' : 'primary'}>
                {vehicle.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-ink-4 flex items-center gap-2 mt-1">
              <Hash size={14} className="text-primary" /> {vehicle.id} · <span className="text-ink bg-bg px-2 py-0.5 rounded border border-line-2">{vehicle.plate}</span> · {vehicle.year}
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
            <span className="text-sm font-medium">{showSuccess}</span>
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
              {activeTab === 'overview' && <FleetOverviewTab vehicle={vehicle} VEHICLE_IMAGE={VEHICLE_IMAGE} />}

              {activeTab === 'maintenance' && <FleetMaintenanceTab vehicle={vehicle} handleLogService={handleLogService} />}

              {activeTab === 'trips' && <FleetTripsTab vehicleTrips={vehicleTrips} drivers={drivers} setSelectedTripId={setSelectedTripId} />}

              {activeTab === 'compliance' && <FleetComplianceTab vehicle={vehicle} />}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <FleetAssignmentPanel
            vehicle={vehicle}
            driver={driver}
            handleStatusChange={handleStatusChange}
            updatingStatus={updatingStatus}
            setAssigning={setAssigning}
            assigning={assigning}
            assignmentOptions={assignmentOptions}
            getAssignedVehicle={getAssignedVehicle}
            isDriverUnavailable={isDriverUnavailable}
            assigningDriverId={assigningDriverId}
            assignOperator={assignOperator}
          />
        </div>
      </div>

      {/* High-Fidelity Trip Details Modal (Identical to Trip History) */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-ink/55 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border-line-2 ring-1 ring-ink/5 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-line-2 flex items-start justify-between bg-bg/25">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-ink">Trip Ledger Detail</h3>
                  <TripStatusBadge status={selectedTrip.status} />
                </div>
                <p className="text-xs text-ink-3 font-semibold mt-1">Ref ID: <span className="text-ink bg-bg px-2 py-0.5 rounded border border-line-2 uppercase">#{selectedTrip.id}</span> · Authorization: {selectedTrip.authId || selectedTrip.authorizationId || 'County Auth'}</p>
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
                <h4 className="type-th mb-3">Manifest Route & Tracking</h4>
                <div className="relative space-y-6 pl-4 border-l-2 border-line-2">
                  <div className="flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-ink-4 mb-0.5">Pickup Location</p>
                      <p className="text-xs font-medium text-ink leading-relaxed">{selectedTrip.pickup}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-urgent flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <MapPin size={10} className="text-urgent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-ink-4 mb-0.5">Drop-off Destination</p>
                      <p className="text-xs font-medium text-ink leading-relaxed">{selectedTrip.dropoff}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rider & Driver Splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 border-line-2 shadow-sm space-y-4">
                  <h4 className="text-xs font-medium text-primary uppercase tracking-[0.1em]">Rider Profile</h4>
                  <div className="flex items-center gap-4">
                    <Avatar initials={selectedTrip.rider?.initials || '?'} size="lg" />
                    <div>
                      <h5 className="text-sm font-medium text-ink">{selectedTrip.rider?.name}</h5>
                      <p className="text-xs text-ink-4 font-semibold mt-0.5">{selectedTrip.rider?.phone || 'No phone verified'}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-line-2 shadow-sm space-y-4">
                  <h4 className="text-xs font-medium text-accent uppercase tracking-[0.1em]">Driver Assignment</h4>
                  {selectedTrip.driverId ? (
                    <div className="flex items-center gap-4">
                      <Avatar initials={drivers.find((d: any) => d.id === selectedTrip.driverId)?.initials || '?'} size="lg" />
                      <div>
                        <h5 className="text-sm font-medium text-ink">{drivers.find((d: any) => d.id === selectedTrip.driverId)?.name}</h5>
                        <p className="text-xs text-ink-4 font-semibold mt-0.5">{drivers.find((d: any) => d.id === selectedTrip.driverId)?.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-4 py-4">No driver assigned to this trip.</p>
                  )}
                </Card>
              </div>

              {/* Financial Summary */}
              <section className="bg-white rounded-2xl border border-line-2 p-6 shadow-sm">
                <h4 className="type-th mb-4">Financial Allocation Ledger</h4>
                <div className="grid grid-cols-3 gap-4 border-b border-line border-dashed pb-4 mb-4">
                  <div>
                    <p className="text-xs text-ink-4">Total Manifest Cost</p>
                    <p className="text-lg font-semibold text-ink mt-1">${(selectedTrip.cost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">Customer fare</p>
                    <p className="text-lg font-semibold text-ink mt-1">${(selectedTrip.copay || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-4">County Reimbursable</p>
                    <p className="text-lg font-semibold text-primary mt-1">${(selectedTrip.costToCounty != null ? selectedTrip.costToCounty : (selectedTrip.cost || 0)).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-ink-4">
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
