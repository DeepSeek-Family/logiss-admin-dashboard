import React, { useState } from 'react';
import {
  Phone, Mail, MapPin, Star, Car, ShieldCheck, Copy,
  ExternalLink, User, Repeat, ChevronLeft, AlertTriangle
} from 'lucide-react';
import { Avatar, Badge, Button } from '@/shared/components/ui';

interface DriverProfileProps {
  selectedDriver: any;
  setSelectedDriverId: (id: string | null) => void;
  role?: string | null;
  trips: any[];
  onAssignVehicle?: () => void;
  onViewFleet?: () => void;
  assignedVehicle?: { id: string; name: string; type: string; plate: string } | null;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({
  selectedDriver, setSelectedDriverId, role, trips,
  onAssignVehicle, onViewFleet, assignedVehicle
}) => {
  const [profileTab, setProfileTab] = useState<'overview' | 'trips' | 'docs'>('overview');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Use assigned vehicle if admin just assigned one, else fall back to driver data
  const currentVehicle = assignedVehicle
    ? { make: assignedVehicle.name, type: assignedVehicle.type, plate: assignedVehicle.plate }
    : selectedDriver?.vehicle;


  const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'trips', label: 'Trip history', icon: Repeat },
    { id: 'docs', label: 'License', icon: ShieldCheck },
  ];

  return (
    <div className="animate-in fade-in duration-300 pb-12">

      {/* ── BREADCRUMB ───────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-ink-4 mb-6">
        <button onClick={() => setSelectedDriverId(null)} className="flex items-center gap-1 hover:text-ink transition-colors">
          <ChevronLeft size={15} /> Drivers
        </button>
        <span>/</span>
        <span className="text-ink font-medium">{selectedDriver?.name}</span>
      </div>

      {/* ── PROFILE HEADER ───────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        {/* Left: photo + info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {selectedDriver?.image ? (
              <img src={selectedDriver.image} alt={selectedDriver.name}
                className="w-20 h-20 rounded-2xl object-cover border border-line-2" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center text-primary text-xl font-bold border border-line-2">
                {selectedDriver?.initials || '?'}
              </div>
            )}
            {selectedDriver?.onDuty && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-ink">{selectedDriver?.name}</h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Active
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-4">
              <span className="flex items-center gap-1"><MapPin size={13} /> Richmond, VA</span>
              <span className="flex items-center gap-1">
                <Car size={13} /> {selectedDriver?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-8">
          {/* Stats */}
          <div className="flex items-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-ink">{selectedDriver?.totalTrips || 0}</p>
              <p className="text-xs text-ink-4 mt-0.5">Total trips</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning flex items-center gap-1">
                <Star size={18} className="fill-warning" /> {selectedDriver?.rating || 4.9}
              </p>
              <p className="text-xs text-ink-4 mt-0.5">Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">0</p>
              <p className="text-xs text-ink-4 mt-0.5">Reports</p>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" icon={Phone} className="h-9 text-sm"
              onClick={() => selectedDriver?.phone && window.open(`tel:${selectedDriver.phone}`)}>
              Call
            </Button>
            <Button variant="outline" icon={Mail} className="h-9 text-sm"
              onClick={() => selectedDriver?.email && window.open(`mailto:${selectedDriver.email}`)}>
              Email
            </Button>
            {role === 'admin' && (
              <Button variant="primary" className="h-9 text-sm"
                onClick={onAssignVehicle}>
                {assignedVehicle ? 'Reassign Vehicle' : 'Assign Vehicle'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── UNDERLINE TABS ───────────────────────── */}
      <div className="flex items-center gap-6 border-b border-line-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setProfileTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              profileTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-4 hover:text-ink'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────── */}
      {profileTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* LEFT — Personal details (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-line-2 rounded-2xl p-6">
            <h3 className="text-base font-bold text-ink mb-5">Personal details</h3>

            {/* Email — full width */}
            <div className="pb-4 border-b border-line-2">
              <p className="text-xs text-ink-4 mb-0.5">Email</p>
              <p className="text-sm font-medium text-ink">{selectedDriver?.email || '—'}</p>
            </div>

            {/* 2-col grid */}
            <div className="grid grid-cols-2 gap-x-6 pt-4">
              <div className="pb-4 border-b border-line-2">
                <p className="text-xs text-ink-4 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-ink">{selectedDriver?.phone || '—'}</p>
              </div>
              <div className="pb-4 border-b border-line-2">
                <p className="text-xs text-ink-4 mb-0.5">Date of birth</p>
                <p className="text-sm font-medium text-ink">{selectedDriver?.dob || 'Jan 12, 1988'}</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-ink-4 mb-0.5">License class</p>
                <p className="text-sm font-medium text-ink">{selectedDriver?.licenseClass || selectedDriver?.license?.class || 'Class C'}</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-ink-4 mb-0.5">Experience</p>
                <p className="text-sm font-medium text-ink">{selectedDriver?.experience || '3+ years'}</p>
              </div>
            </div>

            {/* Emergency contact */}
            <div className="mt-5 pt-5 border-t border-line-2">
              <h3 className="text-base font-bold text-ink mb-4">Emergency contact</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  {(selectedDriver?.emergencyContact?.name || 'EC').split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{selectedDriver?.emergencyContact?.name || 'Sarah Wilson'}</p>
                  <p className="text-xs text-ink-4">{selectedDriver?.emergencyContact?.relation || 'Wife'}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink-4">
                  <Phone size={14} />
                  <span className="font-medium text-ink">{selectedDriver?.emergencyContact?.phone || '(804) 555-0999'}</span>
                  <button onClick={() => handleCopyPhone(selectedDriver?.emergencyContact?.phone || '')}
                    className="text-ink-4 hover:text-primary transition-colors">
                    {copiedPhone ? <ShieldCheck size={14} className="text-accent" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Vehicle + Counties (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Vehicle card */}
            <div className="bg-white border border-line-2 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-ink">Current vehicle</h3>
                {role === 'admin' && (
                  <button onClick={onViewFleet} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    View vehicle <ExternalLink size={11} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-bg border border-line-2 flex items-center justify-center shrink-0">
                  <Car size={28} className="text-ink-3" />
                </div>
                <div>
                  <p className="text-base font-bold text-ink">{currentVehicle?.make || 'No Vehicle'}</p>
                  <p className="text-sm text-ink-4">{currentVehicle?.type || 'Not assigned'}</p>
                  {currentVehicle?.plate && (
                    <span className="inline-block mt-1.5 text-xs font-semibold text-ink-3 bg-bg border border-line-2 px-2 py-0.5 rounded-lg">
                      {currentVehicle.plate}
                    </span>
                  )}
                  {assignedVehicle && (
                    <p className="text-[10px] text-accent mt-1">✓ Just assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service counties */}
            {selectedDriver?.counties?.length > 0 && (
              <div className="bg-white border border-line-2 rounded-2xl p-6">
                <h3 className="text-base font-bold text-ink mb-3">Service counties</h3>
                <p className="text-sm text-ink-4">
                  {selectedDriver.counties.join(' · ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRIP HISTORY TAB ─────────────────────── */}
      {profileTab === 'trips' && (
        <div className="bg-white border border-line-2 rounded-2xl overflow-hidden animate-in fade-in duration-300">
          {/* Summary stats */}
          <div className="grid grid-cols-4 divide-x divide-line-2 border-b border-line-2">
            {[
              { label: 'Completed Trips', val: selectedDriver?.totalTrips || 0, color: 'text-accent' },
              { label: "Today's Trips", val: selectedDriver?.tripsToday || 0, color: 'text-primary' },
              { label: 'Total Miles', val: '1,240', color: 'text-ink' },
              { label: 'Incidents', val: '0', color: 'text-urgent' },
            ].map(s => (
              <div key={s.label} className="px-6 py-4">
                <p className="text-xs text-ink-4 mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
          <table className="w-full text-left">
            <thead className="bg-bg border-b border-line-2">
              <tr>
                {['Trip ID', 'Date & Time', 'Rider', 'Route', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 type-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {(() => {
                const driverTrips = (trips || []).filter((t: any) =>
                  t.driverId === selectedDriver?.id ||
                  t.driver?.id === selectedDriver?.id ||
                  t.driver?.name === selectedDriver?.name
                );
                if (driverTrips.length === 0) return (
                  <tr><td colSpan={5} className="text-center py-16 text-sm text-ink-4">No trip history</td></tr>
                );
                return driverTrips.map((trip: any) => (
                  <tr key={trip.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3 text-xs text-ink-3">#{trip.id.slice(-4)}</td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-ink">{new Date(trip.scheduledTime).toLocaleDateString()}</p>
                      <p className="text-[10px] text-ink-4">{new Date(trip.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-[10px] font-bold text-primary">
                          {trip.rider?.name?.[0] || 'R'}
                        </div>
                        <span className="text-xs font-medium text-ink">{trip.rider?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <p className="text-xs text-ink-4 truncate">{trip.pickup}</p>
                      <p className="text-xs text-primary truncate">→ {trip.dropoff}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={trip.status === 'completed' ? 'accent' : 'neutral'}>{trip.status}</Badge>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* ── LICENSE TAB ──────────────────────────── */}
      {profileTab === 'docs' && (
        <div className="bg-white border border-line-2 rounded-2xl p-6 animate-in fade-in duration-300 max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-ink">Driver License</h3>
            <Badge variant={selectedDriver?.license?.status === 'valid' ? 'accent' : 'warning'}>
              {selectedDriver?.license?.status || 'Valid'}
            </Badge>
          </div>
          <div className="space-y-3">
            {[
              { k: 'License No.', v: selectedDriver?.license?.number || '—' },
              { k: 'Class', v: selectedDriver?.licenseClass || selectedDriver?.license?.class || 'Class C' },
              { k: 'Expires', v: selectedDriver?.license?.expires || '—' },
              { k: 'Date of Birth', v: selectedDriver?.dob || 'Jan 12, 1988' },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between py-2 border-b border-line-2 last:border-0">
                <span className="text-xs text-ink-4">{k}</span>
                <span className="text-xs font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
