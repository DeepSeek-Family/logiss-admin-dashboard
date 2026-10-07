import React from 'react';
import {
  Phone, Mail, MapPin, Activity, Star,
  ShieldCheck, Copy, User, Repeat, ChevronLeft, Loader2
} from 'lucide-react';
import { Badge, Button, Pagination } from '@/shared/components/ui';
import { formatShortDate, formatTime, tripTypeLabel } from '@/utils/helpers';

interface RiderProfileProps {
  selectedRider: any;
  trips: any[];
  tripsLoading?: boolean;
  tripsTotal?: number;
  tripsPage?: number;
  tripsTotalPages?: number;
  tripsPerPage?: number;
  onTripsPageChange?: (page: number) => void;
  role?: string | null;
  onBack: () => void;
  profileTab: 'overview' | 'trips';
  setProfileTab: (tab: 'overview' | 'trips') => void;
  copiedPhone: boolean;
  onCopyPhone: (phone: string) => void;
  onEditRider?: () => void;
}

export const RiderProfile: React.FC<RiderProfileProps> = ({
  selectedRider, trips, tripsLoading, tripsTotal, tripsPage = 1, tripsTotalPages = 1, tripsPerPage = 10,
  onTripsPageChange, role, onBack,
  profileTab, setProfileTab, copiedPhone, onCopyPhone, onEditRider
}) => {
  const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'trips', label: 'Trip history', icon: Repeat },
  ];

  return (
    <div className="animate-in fade-in duration-300 pb-12">

      {/* ── BREADCRUMB ───────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-ink-4 mb-6">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-ink transition-colors">
          <ChevronLeft size={15} /> Riders
        </button>
        <span>/</span>
        <span className="text-ink font-medium">{selectedRider?.name}</span>
      </div>

      {/* ── PROFILE HEADER ───────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {selectedRider?.image ? (
              <img src={selectedRider.image} alt={selectedRider.name}
                className="w-20 h-20 rounded-2xl object-cover border border-line-2" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center text-primary text-xl font-bold border border-line-2">
                {selectedRider?.initials || '?'}
              </div>
            )}
            {selectedRider?.status === 'active' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-ink">{selectedRider?.name || 'Unknown'}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                selectedRider?.status === 'active'
                  ? 'text-accent bg-accent/10'
                  : selectedRider?.status === 'banned'
                  ? 'text-urgent bg-urgent/10'
                  : 'text-ink-3 bg-bg border border-line-2'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedRider?.status === 'active' ? 'bg-accent' : selectedRider?.status === 'banned' ? 'bg-urgent' : 'bg-ink-3'
                }`} />
                {(selectedRider?.status || 'inactive').charAt(0).toUpperCase() + (selectedRider?.status || 'inactive').slice(1)}
              </span>
              {selectedRider?.source && (
                <span className="text-xs font-medium text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full">
                  {selectedRider.source}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-4">
              {selectedRider?.rating != null && (
                <span className="flex items-center gap-1"><Star size={13} className="text-warning fill-warning" /> {selectedRider.rating} rating</span>
              )}
              <span className="bg-bg px-2 py-0.5 rounded border border-line-2 text-xs text-ink-3">
                ID: {selectedRider?.passengerId || selectedRider?.id || '—'}
              </span>
              {selectedRider?.authorizationId && (
                <span className="bg-primary/5 px-2 py-0.5 rounded border border-primary/20 text-xs text-primary">
                  AUTH: {selectedRider.authorizationId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-ink">{tripsTotal ?? (trips.length || selectedRider?.totalTrips || 0)}</p>
              <p className="text-xs text-ink-4 mt-0.5">Total trips</p>
            </div>
            {selectedRider?.mobility && (
              <div>
                <p className="text-lg font-bold text-primary">{selectedRider.mobility}</p>
                <p className="text-xs text-ink-4 mt-0.5">Mobility</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              icon={Phone}
              className="h-9 text-sm"
              onClick={() => selectedRider?.phone && window.open(`tel:${selectedRider.phone}`)}
            >
              Call
            </Button>
            <Button
              variant="outline"
              icon={Mail}
              className="h-9 text-sm"
              onClick={() => selectedRider?.email && window.open(`mailto:${selectedRider.email}`)}
            >
              Email
            </Button>
            {role === 'admin' && (
              <Button
                variant="primary"
                className="h-9 text-sm"
                onClick={onEditRider}
              >
                Edit Rider
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

      {/* ── OVERVIEW ─────────────────────────────── */}
      {profileTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* LEFT — Contact & Mobility (3 cols) */}
          <div className={`${selectedRider?.defaultPickup || selectedRider?.defaultDropoff ? 'lg:col-span-3' : 'lg:col-span-5'} bg-white border border-line-2 rounded-2xl p-6`}>
            <h3 className="text-base font-bold text-ink mb-5">Contact & Mobility</h3>

            {/* Email full width */}
            <div className="pb-4 border-b border-line-2">
              <p className="text-xs text-ink-4 mb-0.5">Email</p>
              <p className="text-sm font-medium text-ink">{selectedRider?.email || '—'}</p>
            </div>

            {/* 2-col */}
            <div className="grid grid-cols-2 gap-x-6 pt-4">
              <div className="pb-4 border-b border-line-2">
                <p className="text-xs text-ink-4 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-ink">{selectedRider?.phone || '—'}</p>
              </div>
              <div className="pb-4 border-b border-line-2">
                <p className="text-xs text-ink-4 mb-0.5">Date of Birth</p>
                <p className="text-sm font-medium text-ink">{formatShortDate(selectedRider?.dateOfBirth) || '—'}</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-ink-4 mb-0.5">Auth ID</p>
                <p className="text-sm font-medium text-ink">{selectedRider?.authorizationId || selectedRider?.authId || '—'}</p>
              </div>
              <div className="pt-4">
                <p className="text-xs text-ink-4 mb-0.5">Member since</p>
                <p className="text-sm font-medium text-ink">{formatShortDate(selectedRider?.joinedDate || selectedRider?.createdAt) || '—'}</p>
              </div>
            </div>

            {/* Emergency contact */}
            {(selectedRider?.emergencyContact?.name || selectedRider?.emergencyContact?.phone) && (
              <div className="mt-5 pt-5 border-t border-line-2">
                <h3 className="text-base font-bold text-ink mb-4">Emergency contact</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {(selectedRider?.emergencyContact?.name || 'EC').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{selectedRider?.emergencyContact?.name || '—'}</p>
                    <p className="text-xs text-ink-4">{selectedRider?.emergencyContact?.relation || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink-4">
                    <Phone size={14} />
                    <span className="font-medium text-ink">{selectedRider?.emergencyContact?.phone || '—'}</span>
                    <button onClick={() => onCopyPhone(selectedRider?.emergencyContact?.phone || '')}
                      className="text-ink-4 hover:text-primary transition-colors">
                      {copiedPhone ? <ShieldCheck size={14} className="text-accent" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Locations (2 cols) */}
          {(selectedRider?.defaultPickup || selectedRider?.defaultDropoff) && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-line-2 rounded-2xl p-6">
                <h3 className="text-base font-bold text-ink mb-4">Default locations</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-bg border border-line-2 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={15} className="text-ink-4" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-0.5">Home / Pickup</p>
                      <p className="text-sm font-medium text-ink">{selectedRider?.defaultPickup || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity size={15} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-4 mb-0.5">Primary Facility</p>
                      <p className="text-sm font-medium text-ink">{selectedRider?.defaultDropoff || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TRIP HISTORY TAB ─────────────────────── */}
      {profileTab === 'trips' && (
        <div className="bg-white border border-line-2 rounded-2xl overflow-hidden animate-in fade-in duration-300">
          <table className="w-full text-left">
            <thead className="bg-bg border-b border-line-2">
              <tr>
                {['Trip ID', 'Date & Time', 'Type', 'Route', 'Status'].map(h => (
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
                <tr key={trip.id} className="hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3 text-xs text-ink-3">#{String(trip.id || '').slice(-6)}</td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-ink">{formatShortDate(trip.serviceDate || trip.scheduledTime) || '—'}</p>
                    <p className="text-[10px] text-ink-4">{formatTime(trip.pickupTime || trip.scheduledTime) || '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs text-ink">{tripTypeLabel(trip.tripType || trip.type || '')}</p>
                    {trip.isRecurring && <p className="text-[10px] text-primary">Recurring</p>}
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-xs text-ink-4 truncate">{trip.pickup || '—'}</p>
                    <p className="text-xs text-primary truncate">→ {trip.dropoff || '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={['completed', 'trip-completed'].includes(String(trip.rawStatus || trip.status).toLowerCase()) ? 'accent' : 'neutral'}
                      className="capitalize"
                    >
                      {String(trip.rawStatus || trip.status || '').replace(/[-_]/g, ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
};
