import React, { useState } from 'react';
import { 
  Phone, Repeat, MapPin, Star, Car, AlertTriangle, 
  Copy, ShieldCheck, Plus, ExternalLink, X, User 
} from 'lucide-react';
import { Card, Avatar, Badge, Button } from '@/shared/components/ui';

interface DriverProfileProps {
  selectedDriver: any;
  setSelectedDriverId: (id: string | null) => void;
  role?: string | null;
  trips: any[];
}

export const DriverProfile: React.FC<DriverProfileProps> = ({
  selectedDriver,
  setSelectedDriverId,
  role,
  trips
}) => {
  const [profileTab, setProfileTab] = useState<'overview' | 'trips' | 'docs'>('overview');
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  
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

                {selectedDriver?.counties && selectedDriver.counties.length > 0 && (
                  <Card className="p-6 space-y-6">
                    <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 px-1 border-l-2 border-accent ml-[-1px]">Service Counties</h4>

                    <div className="flex flex-wrap gap-2">
                      {selectedDriver.counties.map((c: string) => (
                        <div key={c} className="px-4 py-2 bg-bg rounded-xl border border-line-2 text-xs font-medium text-ink-3 flex items-center gap-2">
                          <MapPin size={12} /> {c}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
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
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-ink-4">Date of Birth</span>
                        <span className="text-xs text-ink">{selectedDriver?.dob || 'Jan 12, 1988'}</span>
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

                <Card className="p-6">
                  <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-6 px-1 border-l-2 border-accent ml-[-1px]">Experience & Certification</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg rounded-2xl border border-line-2">
                      <p className="text-xs text-ink-4 mb-1">License Class</p>
                      <Badge variant="primary">{selectedDriver?.licenseClass || selectedDriver?.license?.class || 'Class C'}</Badge>
                    </div>
                    <div className="p-4 bg-bg rounded-2xl border border-line-2">
                      <p className="text-xs text-ink-4 mb-1">Driving Experience</p>
                      <span className="text-xs font-medium text-ink-3 mt-1.5 inline-block">{selectedDriver?.experience || '3+ years'}</span>
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
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Trip ID</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Rider</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Route</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Status</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {(() => {
                      const driverTrips = (trips || []).filter((t: any) => t.driverId === selectedDriver?.id);
                      if (driverTrips.length === 0) return <tr><td colSpan={6} className="text-center py-20 font-medium text-ink-4">No Trip History Available</td></tr>;
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
                { 
                  label: 'Driver License', 
                  icon: ShieldCheck, 
                  status: selectedDriver?.license?.status || 'valid', 
                  expiry: selectedDriver?.license?.expires || 'Jan 2026', 
                  id: selectedDriver?.license?.number || 'DL-0123-456',
                  photo: selectedDriver?.license?.photo || null,
                  mockContent: `DMV · Class ${selectedDriver?.licenseClass || selectedDriver?.license?.class || 'C'}\nExpiry: ${selectedDriver?.license?.expires || 'January 15, 2026'}\nRestrictions: None` 
                }
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
                {/* Document Card / Image */}
                <div className="rounded-2xl overflow-hidden border border-line-2 mb-4 bg-bg relative">
                  {/* Premium dynamic driver's license card */}
                  <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white flex flex-col justify-between relative overflow-hidden select-none">
                    {/* Background decorations */}
                    <div className="absolute top-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-accent/20 blur-3xl" />
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-white/10 pb-2 z-10">
                      <div>
                        <h4 className="text-[10px] font-bold tracking-widest text-primary-light uppercase">DRIVER LICENSE</h4>
                        <p className="text-[8px] text-white/50 font-medium">COMMONWEALTH OF VIRGINIA</p>
                      </div>
                      <ShieldCheck size={18} className="text-accent" />
                    </div>

                    {/* Body */}
                    <div className="flex gap-4 items-center my-3 z-10">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {selectedDriver?.image ? (
                          <img src={selectedDriver.image} alt={selectedDriver.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white/80">{selectedDriver?.initials || selectedDriver?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div>
                          <p className="text-[8px] text-white/40 uppercase tracking-wider">Name</p>
                          <p className="text-xs font-semibold truncate leading-none">{selectedDriver?.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[8px] text-white/40 uppercase tracking-wider">License No.</p>
                            <p className="text-[10px] font-mono font-medium truncate leading-none">{viewingDoc.id}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-white/40 uppercase tracking-wider">Class</p>
                            <p className="text-[10px] font-medium leading-none">{selectedDriver?.licenseClass || selectedDriver?.license?.class || 'Class C'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end border-t border-white/10 pt-2 z-10">
                      <div>
                        <p className="text-[7px] text-white/40 uppercase tracking-wider">Date of Birth</p>
                        <p className="text-[9px] font-medium leading-none">{selectedDriver?.dob || 'Jan 12, 1988'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] text-white/40 uppercase tracking-wider">Expires</p>
                        <p className="text-[9px] font-semibold text-warning leading-none">{viewingDoc.expiry}</p>
                      </div>
                    </div>
                  </div>
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

};
