import React from 'react';
import {
  Phone, Mail, MapPin, Activity, Star, AlertTriangle,
  User, Repeat, ShieldCheck, Copy, ExternalLink, Badge as BadgeIcon
} from 'lucide-react';
import { Card, Avatar, Badge, Button } from '@/shared/components/ui';

interface RiderProfileProps {
  selectedRider: any;
  trips: any[];
  role?: string | null;
  onBack: () => void;
  profileTab: 'overview' | 'trips';
  setProfileTab: (tab: 'overview' | 'trips') => void;
  copiedPhone: boolean;
  onCopyPhone: (phone: string) => void;
}

export const RiderProfile: React.FC<RiderProfileProps> = ({
  selectedRider, trips, role, onBack,
  profileTab, setProfileTab, copiedPhone, onCopyPhone
}) => (
  <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-4 hover:text-ink hover:bg-white rounded-xl transition-all shadow-sm border border-line-2 bg-bg"
      >
        ← Back to Riders List
      </button>
      <div className="flex gap-3">
        <Button variant="outline" icon={Phone}>Call</Button>
        <Button variant="outline" icon={Mail}>Email</Button>
        {role === 'admin' && <Button variant="primary">Edit Rider</Button>}
      </div>
    </div>

    {/* Clean Profile Header */}
    <Card className="p-6 border border-line-2 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative shrink-0">
          {selectedRider?.image ? (
            <img src={selectedRider.image} alt={selectedRider.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-line-2" />
          ) : (
            <Avatar initials={selectedRider?.initials || '?'} size="xl" shape="square" className="rounded-2xl" />
          )}
          {selectedRider?.status === 'active' && <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full border-2 border-white" />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold text-ink">{selectedRider?.name || 'Unknown Rider'}</h2>
            <Badge variant={selectedRider?.status === 'active' ? 'accent' : 'neutral'}>{selectedRider?.status === 'active' ? 'Active' : 'Inactive'}</Badge>
            {selectedRider?.source && <Badge variant="outline" className="text-xs font-medium text-primary border-primary/20 bg-primary/5">{selectedRider.source}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-ink-4 text-xs font-medium">
            <span className="flex items-center gap-1.5"><Star size={12} className="text-warning fill-warning" /> {selectedRider?.rating || 4.9} rating</span>
            <span className="text-xs bg-bg px-2 py-0.5 rounded border border-line-2 text-ink-3">PX: {selectedRider?.passengerId || selectedRider?.id || '---'}</span>
            <span className="text-xs bg-bg px-2 py-0.5 rounded border border-line-2 text-primary">Auth: {selectedRider?.authorizationId || selectedRider?.authId || '---'}</span>
            <span className="text-ink-4">Joined {selectedRider?.joinedDate ? new Date(selectedRider.joinedDate).toLocaleDateString() : '—'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-3 bg-bg rounded-xl border border-line-2 text-center">
            <p className="text-xs text-ink-4 mb-0.5">Trips</p>
            <p className="text-xl font-semibold text-ink">{selectedRider?.totalTrips || 0}</p>
          </div>
          <div className="px-4 py-3 bg-bg rounded-xl border border-line-2 text-center">
            <p className="text-xs text-ink-4 mb-0.5">Mobility</p>
            <p className="text-sm font-semibold text-primary mt-1">{selectedRider?.mobility || 'Ambulatory'}</p>
          </div>
        </div>
      </div>
    </Card>

    {/* Tabs */}
    <div className="flex items-center gap-1 bg-bg p-1 rounded-xl border border-line-2 w-fit">
      {[
        { id: 'overview', label: 'Profile Overview', icon: User },
        { id: 'trips', label: 'Trip History', icon: Repeat },
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
              <h4 className="type-th mb-5 px-1 border-l-2 border-primary ml-[-1px]">Mobility & Payment</h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                    <span className="text-xs text-ink-4">Mobility Need</span>
                    <span className="text-xs font-medium text-ink">{selectedRider?.mobility || 'Ambulatory'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                    <span className="text-xs text-ink-4">Default Payment</span>
                    <span className="text-xs font-medium text-ink">{selectedRider?.paymentMethod || 'N/A'}</span>
                  </div>
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <h4 className="type-th mb-5 px-1 border-l-2 border-accent ml-[-1px]">Default Locations</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                  <div className="p-2 bg-white rounded-lg text-ink-3 shadow-sm shrink-0"><MapPin size={14} /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Home/Pickup</p>
                    <p className="text-xs font-medium text-ink truncate">{selectedRider?.defaultPickup || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                  <div className="p-2 bg-white rounded-lg text-primary shadow-sm shrink-0"><Activity size={14} /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-4 mb-0.5">Primary Facility</p>
                    <p className="text-xs font-medium text-ink truncate">{selectedRider?.defaultDropoff || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="type-th mb-5 px-1 border-l-2 border-primary ml-[-1px]">Contact Details</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                    <span className="text-xs text-ink-4">Phone Number</span>
                    <span className="text-xs font-medium text-ink">{selectedRider?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-line-2 border-dashed">
                    <span className="text-xs text-ink-4">Email Address</span>
                    <span className="text-xs font-medium text-ink">{selectedRider?.email || 'N/A'}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-urgent/10 bg-urgent-light/5">
                <h4 className="text-xs font-medium text-urgent uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} /> Emergency Contact
                </h4>
                <div className="p-4 bg-white rounded-2xl border border-urgent/10">
                  <p className="text-sm font-semibold text-ink">{selectedRider?.emergencyContact?.name || 'N/A'}</p>
                  <p className="text-xs text-ink-4 mt-0.5">{selectedRider?.emergencyContact?.relation || 'N/A'}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 p-3 bg-bg rounded-xl border border-line-2 text-xs font-medium text-primary text-center">
                      {selectedRider?.emergencyContact?.phone || 'N/A'}
                    </div>
                    <button
                      onClick={() => onCopyPhone(selectedRider?.emergencyContact?.phone || '')}
                      title="Copy number"
                      className="w-10 h-10 bg-white rounded-xl border border-line-2 flex items-center justify-center text-ink-4 hover:text-primary hover:border-primary/30 transition-all shrink-0"
                    >
                      {copiedPhone ? <ShieldCheck size={16} className="text-accent" /> : <Copy size={16} />}
                    </button>
                    <button
                      title="Call number"
                      className="w-10 h-10 bg-white rounded-xl border border-line-2 flex items-center justify-center text-ink-4 hover:text-primary hover:border-primary/30 transition-all shrink-0"
                    >
                      <Phone size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {profileTab === 'trips' && (
        <div className="lg:col-span-3 space-y-6 animate-in fade-in duration-300">
          <Card className="overflow-hidden border-none shadow-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg border-b border-line-2">
                  <th className="px-5 py-2.5 type-th">Trip ID</th>
                  <th className="px-5 py-2.5 type-th">Date & Time</th>
                  <th className="px-5 py-2.5 type-th">Type</th>
                  <th className="px-5 py-2.5 type-th">Route</th>
                  <th className="px-5 py-2.5 type-th">Status</th>
                  <th className="px-5 py-2.5 type-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {(() => {
                  const riderTrips = (trips || []).filter((t: any) => t.rider?.name === selectedRider?.name || (t.rider && selectedRider && t.rider.initials === selectedRider.initials));
                  if (riderTrips.length === 0) return <tr><td colSpan={6} className="text-center py-20 font-medium text-ink-4">No Trip History Available</td></tr>;
                  return riderTrips.map((trip: any) => (
                    <tr key={trip.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-ink-3">#{trip.id.slice(-4)}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-ink">{new Date(trip.scheduledTime).toLocaleDateString()}</p>
                        <p className="text-xs text-ink-4">{new Date(trip.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-ink capitalize">{trip.type?.replace('_', ' ')}</p>
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
    </div>
  </div>
);
