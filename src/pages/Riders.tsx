import { useState } from 'react';
import {
  Search, Phone, Mail, MapPin, Activity,
  Calendar, Star, ChevronRight, AlertTriangle, Users, History,
  User, Repeat, ShieldCheck, Copy, ExternalLink,
  UserX, UserCheck, Ban, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, Avatar, Badge, Button, Pagination } from '../components/ui';
import { useRiders } from '../hooks/useRiders';
import { useTrips } from '../hooks/useTrips';

const Riders = ({ role }: { role?: string | null }) => {
  const { riders, loading, error, updateRiderStatus } = useRiders();
  const { trips } = useTrips();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [profileTab, setProfileTab] = useState<'overview' | 'trips'>('overview');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
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
        <h3 className="text-lg font-semibold text-ink mb-2">Failed to load riders</h3>
        <p className="text-ink-3 text-sm">{error}</p>
      </div>
    );
  }

  const filteredRiders = (riders || []).filter((r: any) => {
    const nameMatch = (r?.name || '').toLowerCase().includes((search || '').toLowerCase());
    const idMatch = (r?.id || '').toLowerCase().includes((search || '').toLowerCase());
    let matchesTab = true;
    if (activeTab === 'active') matchesTab = r?.status === 'active';
    if (activeTab === 'inactive') matchesTab = r?.status !== 'active';
    return (nameMatch || idMatch) && matchesTab;
  });

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = filteredRiders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedRider = (riders || []).find((r: any) => r.id === selectedRiderId);

  if (selectedRider) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedRiderId(null)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-ink-3 hover:text-ink hover:bg-white rounded-xl transition-all shadow-sm border border-line-2 bg-bg"
          >
            â† Back to Riders List
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
                <h2 className="text-2xl font-bold font-display text-ink tracking-normal">{selectedRider?.name || 'Unknown Rider'}</h2>
                <Badge variant={selectedRider?.status === 'active' ? 'accent' : 'neutral'}>{selectedRider?.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                {selectedRider?.source && <Badge variant="outline" className="text-xs font-bold text-primary border-primary/20 bg-primary/5 uppercase">{selectedRider.source}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-ink-4 text-xs font-medium">
                <span className="flex items-center gap-1.5"><Star size={12} className="text-warning fill-warning" /> {selectedRider?.rating || 4.9} rating</span>
                <span className="font-mono text-xs bg-bg px-2 py-0.5 rounded border border-line-2 text-ink-3">PX: {selectedRider?.passengerId || selectedRider?.id || '---'}</span>
                <span className="font-mono text-xs bg-bg px-2 py-0.5 rounded border border-line-2 text-primary">Auth: {selectedRider?.authorizationId || selectedRider?.authId || '---'}</span>
                <span className="text-ink-4">Joined {selectedRider?.joinedDate ? new Date(selectedRider.joinedDate).toLocaleDateString() : 'â€”'}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-3 bg-bg rounded-xl border border-line-2 text-center">
                <p className="text-xs text-ink-4 mb-0.5">Trips</p>
                <p className="text-xl font-bold text-ink">{selectedRider?.totalTrips || 0}</p>
              </div>
              <div className="px-4 py-3 bg-bg rounded-xl border border-line-2 text-center">
                <p className="text-xs text-ink-4 mb-0.5">Mobility</p>
                <p className="text-sm font-bold text-primary mt-1">{selectedRider?.mobility || 'Ambulatory'}</p>
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
                  <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 px-1 border-l-2 border-primary ml-[-1px]">Mobility & Payment</h4>
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
                  <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 px-1 border-l-2 border-accent ml-[-1px]">Default Locations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                      <div className="p-2 bg-white rounded-lg text-ink-3 shadow-sm shrink-0"><MapPin size={14} /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-ink-4 uppercase tracking-widest mb-0.5">Home/Pickup</p>
                        <p className="text-xs font-medium text-ink truncate">{selectedRider?.defaultPickup || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                      <div className="p-2 bg-white rounded-lg text-primary shadow-sm shrink-0"><Activity size={14} /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-ink-4 uppercase tracking-widest mb-0.5">Primary Facility</p>
                        <p className="text-xs font-medium text-ink truncate">{selectedRider?.defaultDropoff || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 px-1 border-l-2 border-primary ml-[-1px]">Contact Details</h4>
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
                    <h4 className="text-xs font-black text-urgent uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertTriangle size={14} /> Emergency Contact
                    </h4>
                    <div className="p-4 bg-white rounded-2xl border border-urgent/10">
                      <p className="text-sm font-black text-ink">{selectedRider?.emergencyContact?.name || 'N/A'}</p>
                      <p className="text-xs font-black text-ink-4 uppercase mt-0.5">{selectedRider?.emergencyContact?.relation || 'N/A'}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 p-3 bg-bg rounded-xl border border-line-2 text-xs font-black text-primary text-center tracking-widest">
                          {selectedRider?.emergencyContact?.phone || 'N/A'}
                        </div>
                        <button
                          onClick={() => handleCopyPhone(selectedRider?.emergencyContact?.phone || '')}
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
              </div>
            </>
          )}

          {profileTab === 'trips' && (
            <div className="lg:col-span-3 space-y-6 animate-in fade-in duration-300">
              <Card className="overflow-hidden border-none shadow-xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-bg border-b border-line-2">
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Trip ID</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Type</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Route</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Status</th>
                      <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {(() => {
                      const riderTrips = (trips || []).filter((t: any) => t.rider?.name === selectedRider?.name || (t.rider && selectedRider && t.rider.initials === selectedRider.initials));
                      if (riderTrips.length === 0) return <tr><td colSpan={6} className="text-center py-20 font-bold text-ink-4">No Trip History Available</td></tr>;
                      return riderTrips.map((trip: any) => (
                        <tr key={trip.id} className="hover:bg-bg/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-medium text-ink">#{trip.id.slice(-4)}</td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-ink">{new Date(trip.scheduledTime).toLocaleDateString()}</p>
                            <p className="text-xs text-ink-4 uppercase">{new Date(trip.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-medium text-ink capitalize">{trip.type?.replace('_', ' ')}</p>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-xs font-black text-ink-4 truncate mb-0.5">{trip.pickup}</p>
                            <p className="text-xs font-black text-primary truncate uppercase">To: {trip.dropoff}</p>
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
  }

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink tracking-normal">Rider Directory</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">Manage patient profiles, mobility needs, and trip history</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Riders', value: (riders || []).length, sub: 'registered accounts', icon: Users, color: 'bg-primary-light text-primary' },
          { label: 'Active', value: (riders || []).filter(r => r?.status === 'active').length, sub: 'active passengers', icon: Activity, color: 'bg-accent-light text-accent' },
          { label: 'Suspended', value: (riders || []).filter(r => r?.status === 'suspended').length, sub: 'temporarily restricted', icon: AlertTriangle, color: 'bg-warning-light text-warning-dark' },
          { label: 'Banned', value: (riders || []).filter(r => r?.status === 'banned').length, sub: 'access revoked', icon: Star, color: 'bg-urgent-light text-urgent' },
        ].map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-4 leading-none">{s.label}</p>
              <p className="text-2xl font-bold text-ink mt-1 leading-none">{s.value}</p>
              <p className="text-xs text-ink-4 mt-1">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2/50 bg-bg/20">
          <div className="flex items-center gap-1 bg-bg/60 p-0.5 rounded-xl">
            {[
              { id: 'all', label: 'All Riders' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary' : 'text-ink-3 hover:text-ink'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
            <input type="text" placeholder="Search name, ID..."
              className="w-full pl-8 pr-3 py-2 bg-bg/60 focus:bg-white rounded-xl text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg/10 border-b border-line-2/50">
              <tr>
                {['Rider', 'IDs', 'County / Source', 'Status', 'Mobility', 'Contact', 'Trips', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2/50">
              {paginatedRiders.map(rider => (
                <tr key={rider.id} className="hover:bg-bg/30 transition-colors group cursor-pointer" onClick={() => setSelectedRiderId(rider.id)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 w-10 h-10">
                        {rider.image ? (
                          <img src={rider.image} alt={rider.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Avatar initials={rider.initials} size="sm" />
                        )}
                        {rider.status === 'active' && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white"></span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{rider.name}</p>
                        <p className="text-xs font-medium text-ink-4 truncate">{rider.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-ink-3"><span className="text-ink-4 mr-0.5">PX:</span> {rider.passengerId || rider.id}</span>
                      <span className="text-xs font-bold text-primary"><span className="text-primary-dark/60 mr-0.5">AUTH:</span> {rider.authorizationId || rider.authId || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {rider.county && (
                        <span className="px-2.5 py-1 bg-primary/5 text-primary text-[10px] font-extrabold uppercase tracking-wider rounded-full w-fit">
                          {rider.county}
                        </span>
                      )}
                      {rider.source && <Badge variant="outline" className="font-black text-primary border-primary/20 bg-primary/5 uppercase w-fit">{rider.source}</Badge>}
                      {!rider.county && !rider.source && <span className="text-xs text-ink-4">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenStatusId(openStatusId === rider.id ? null : rider.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border-0 transition-all ${rider.status === 'active' ? 'text-accent bg-accent-light/35' : rider.status === 'suspended' ? 'text-warning border-warning/15 bg-warning-light/40' : rider.status === 'banned' ? 'text-urgent bg-urgent-light/45' : 'text-ink-4 bg-bg'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'active' ? 'bg-accent' : rider.status === 'suspended' ? 'bg-warning' : rider.status === 'banned' ? 'bg-urgent' : 'bg-ink-4'}`} />
                        {(rider.status || 'inactive').toUpperCase()}
                        <ChevronDown size={10} />
                      </button>
                      {openStatusId === rider.id && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-line-2 rounded-xl shadow-xl w-44 py-1 animate-in fade-in duration-150">
                          <p className="px-3 py-2 text-[10px] font-black text-ink-4 uppercase tracking-widest border-b border-line-2 mb-1">Change Status</p>
                          {[
                            { value: 'active', label: 'Set Active', icon: UserCheck, color: 'text-accent hover:bg-accent-light/30' },
                            { value: 'suspended', label: 'Suspend Rider', icon: UserX, color: 'text-warning hover:bg-warning-light/40' },
                            { value: 'banned', label: 'Ban Rider', icon: Ban, color: 'text-urgent hover:bg-urgent-light/40' },
                          ].map(opt => (
                            <button
                               key={opt.value}
                               disabled={rider.status === opt.value}
                               onClick={() => { updateRiderStatus(rider.id, opt.value); setOpenStatusId(null); toast.success(rider.name + ' marked as ' + opt.value); }}
                               className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${opt.color}`}
                            >
                              <opt.icon size={13} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        rider.mobility === 'Wheelchair' ? 'accent' :
                        rider.mobility === 'Ambulatory' ? 'neutral' : 'warning'
                      }
                      className="font-bold py-0.5 px-2 text-xs rounded-full"
                    >
                      {rider.mobility || 'Ambulatory'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-ink-3">{rider?.phone || '---'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-ink">{(rider?.totalTrips || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight size={16} className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </tr>
              ))}
              {paginatedRiders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-ink-4">
                    <Search size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold text-ink-3">No riders match your filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRiders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
};

export default Riders;
