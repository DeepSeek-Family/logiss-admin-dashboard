import React, { useState } from 'react';
import {
  Phone, Mail, Car, ShieldCheck,
  ExternalLink, User, Repeat, ChevronLeft, Loader2, FileText, Ban
} from 'lucide-react';
import { Avatar, Badge, Button, Pagination } from '@/shared/components/ui';
import { formatShortDate, formatTime, tripTypeLabel } from '@/utils/helpers';
import { resolveMediaUrl } from '@/utils/imageUrl';
import { RouteTimeline, TRIP_STATUS_VARIANT } from '@/features/riders/components/RouteTimeline';

interface DriverProfileProps {
  selectedDriver: any;
  setSelectedDriverId: (id: string | null) => void;
  role?: string | null;
  trips: any[];
  tripsLoading?: boolean;
  tripsTotal?: number;
  tripsPage?: number;
  tripsTotalPages?: number;
  tripsPerPage?: number;
  onTripsPageChange?: (page: number) => void;
  onAssignVehicle?: () => void;
  onViewFleet?: () => void;
  assignedVehicle?: { id: string; name: string; type: string; plate: string } | null;
  onToggleBan?: () => void;
  banToggleLoading?: boolean;
}

export const DriverProfile: React.FC<DriverProfileProps> = ({
  selectedDriver, setSelectedDriverId, role, trips,
  tripsLoading, tripsTotal, tripsPage = 1, tripsTotalPages = 1, tripsPerPage = 10, onTripsPageChange,
  onAssignVehicle, onViewFleet, assignedVehicle, onToggleBan, banToggleLoading
}) => {
  const [profileTab, setProfileTab] = useState<'overview' | 'trips' | 'docs'>('overview');
  const [preview, setPreview] = useState<string | null>(null);
  const licenseImages: string[] =
    selectedDriver?.licenseImages?.length
      ? selectedDriver.licenseImages
      : selectedDriver?.license?.images?.length
        ? selectedDriver.license.images
        : selectedDriver?.license?.image
          ? [selectedDriver.license.image]
          : [];
  const na = (value?: string | number | null) => {
    const text = value == null ? '' : String(value).trim();
    return text && text !== '—' ? text : 'N/A';
  };
  const appStatus = String(selectedDriver?.applicationStatus || 'pending').toLowerCase();

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
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                selectedDriver?.isBanned
                  ? 'text-urgent bg-urgent/10'
                  : appStatus === 'approved'
                    ? 'text-accent bg-accent/10'
                    : appStatus === 'rejected'
                      ? 'text-urgent bg-urgent/10'
                      : 'text-warning bg-warning/10'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {selectedDriver?.isBanned ? 'Banned' : appStatus}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-ink-4">
              <span className="flex items-center gap-1"><Phone size={13} /> {na(selectedDriver?.phone)}</span>
              <span className="flex items-center gap-1"><Mail size={13} /> {na(selectedDriver?.email)}</span>
            </div>
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-8">
          {/* Stats */}
          <div className="flex items-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-ink">{tripsTotal ?? selectedDriver?.totalTrips ?? 0}</p>
              <p className="text-xs text-ink-4 mt-0.5">Total trips</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{selectedDriver?.isOnDuty ? 'Yes' : 'No'}</p>
              <p className="text-xs text-ink-4 mt-0.5">On duty</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{selectedDriver?.isAdminVerified ? 'Yes' : 'No'}</p>
              <p className="text-xs text-ink-4 mt-0.5">Verified</p>
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
            {onToggleBan && (
              <Button
                variant={selectedDriver?.isBanned ? 'primary' : 'outline'}
                icon={Ban}
                className={`h-9 text-sm ${selectedDriver?.isBanned ? '' : 'text-urgent border-urgent/30 hover:bg-urgent hover:text-white'}`}
                onClick={onToggleBan}
                disabled={banToggleLoading}
              >
                {banToggleLoading ? 'Updating…' : selectedDriver?.isBanned ? 'Unban driver' : 'Ban driver'}
              </Button>
            )}
            {/* {role === 'admin' && (
              <Button variant="primary" className="h-9 text-sm"
                onClick={onAssignVehicle}>
                {assignedVehicle ? 'Reassign Vehicle' : 'Assign Vehicle'}
              </Button>
            )} */}
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
                <p className="text-sm font-medium text-ink">{na(selectedDriver?.dob)}</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-ink-4 mb-0.5">License class</p>
                <p className="text-sm font-medium text-ink">{na(selectedDriver?.license?.class)}</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-ink-4 mb-0.5">Experience</p>
                <p className="text-sm font-medium text-ink">{na(selectedDriver?.experience)}</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg border-b border-line-2">
                <tr>
                  {['Trip ID', 'Date & Time', 'Rider', 'Route', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 type-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {tripsLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-sm text-ink-4">
                      <Loader2 size={20} className="mx-auto mb-2 animate-spin text-primary" />
                      Loading trip history
                    </td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-sm text-ink-4">No trip history</td></tr>
                ) : trips.map((trip: any) => (
                  <tr key={trip.id} className="align-top hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-bg px-2 py-1 font-mono text-[11px] font-medium text-ink-3">
                        #{String(trip.id || '').slice(-6)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-medium text-ink">{formatShortDate(trip.serviceDate || trip.scheduledTime) || '—'}</p>
                      <p className="text-[10px] text-ink-4">{formatTime(trip.pickupTime || trip.scheduledTime) || '—'}</p>
                      {trip.isRecurring && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Repeat size={9} /> Recurring
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar initials={trip.rider?.initials || 'R'} src={resolveMediaUrl(trip.rider?.profile)} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink truncate">{trip.rider?.name || '—'}</p>
                          <p className="text-[10px] text-ink-4">{tripTypeLabel(trip.tripType || trip.type || '')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RouteTimeline
                        points={[
                          { kind: 'pickup', raw: trip.pickupLocationRaw ?? trip.pickup },
                          { kind: 'stop', raw: trip.stopAddressRaw },
                          { kind: 'dropoff', raw: trip.dropOffLocationRaw ?? trip.dropoff },
                        ]}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        dot
                        variant={TRIP_STATUS_VARIANT[String(trip.rawStatus || trip.status || '').toLowerCase()] ?? 'neutral'}
                        className="capitalize whitespace-nowrap"
                      >
                        {String(trip.rawStatus || trip.status || '').replace(/[-_]/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {onTripsPageChange && (tripsTotal ?? 0) > 0 && (
            <Pagination
              currentPage={tripsPage}
              totalPages={tripsTotalPages}
              totalItems={tripsTotal ?? trips.length}
              itemsPerPage={tripsPerPage}
              onPageChange={onTripsPageChange}
            />
          )}
        </div>
      )}

      {/* ── LICENSE TAB ──────────────────────────── */}
      {profileTab === 'docs' && (
        <div className="bg-white border border-line-2 rounded-2xl p-6 animate-in fade-in duration-300 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-ink">Driver License</h3>
            <span className="text-xs font-semibold text-ink-4">
              {licenseImages.length ? `${licenseImages.length} image${licenseImages.length > 1 ? 's' : ''}` : 'N/A'}
            </span>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { k: 'License No.', v: na(selectedDriver?.license?.number) },
              { k: 'Class', v: na(selectedDriver?.license?.class) },
              { k: 'Expires', v: na(selectedDriver?.license?.expires) },
              { k: 'Date of Birth', v: na(selectedDriver?.dob) },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between py-2 border-b border-line-2 last:border-0">
                <span className="text-xs text-ink-4">{k}</span>
                <span className="text-xs font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
          {licenseImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {licenseImages.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setPreview(url)}
                  className="overflow-hidden rounded-xl border border-line-2 bg-bg aspect-[4/3]"
                >
                  <img src={url} alt="Driver license" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line-2 px-4 py-6 text-sm text-ink-4">
              <FileText size={16} /> N/A
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="License" className="max-h-[80vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
