import { useState } from 'react';
import {
  Search, Phone, Mail, MapPin, Activity, 
  Calendar, Star, ChevronRight, AlertTriangle, Users, History
} from 'lucide-react';
import { Card, Avatar, Badge, Button, Pagination } from '../components/UI';
import { useRiders } from '../hooks/useRiders';
import { useTrips } from '../hooks/useTrips';

const Riders = ({ role }) => {
  const { riders, loading, error } = useRiders();
  const { trips } = useTrips();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
           {[1,2,3,4].map(i => <div key={i} className="h-24 bg-bg rounded-2xl animate-pulse"></div>)}
         </div>
         <div className="h-[400px] bg-bg rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={48} className="text-urgent mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-ink mb-2">Failed to load riders</h3>
        <p className="text-ink-3 text-sm">{error}</p>
      </div>
    );
  }

  const filteredRiders = (riders || []).filter(r => {
    const nameMatch = (r?.name || '').toLowerCase().includes((search || '').toLowerCase());
    const idMatch = (r?.id || '').toLowerCase().includes((search || '').toLowerCase());
    let matchesTab = true;
    if (activeTab === 'active') matchesTab = r?.status === 'active';
    if (activeTab === 'inactive') matchesTab = r?.status !== 'active';
    return (nameMatch || idMatch) && matchesTab;
  });

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = filteredRiders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedRider = (riders || []).find(r => r.id === selectedRiderId);

  if (selectedRider) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedRiderId(null)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-ink-3 hover:text-ink hover:bg-white rounded-xl transition-all shadow-sm border border-line-2 bg-bg"
          >
            ← Back to Riders List
          </button>
          <div className="flex gap-3">
            <Button variant="outline" icon={Phone}>Call</Button>
            <Button variant="outline" icon={Mail}>Email</Button>
            {role === 'admin' && <Button variant="primary">Edit Rider</Button>}
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-accent to-accent-dark p-8 h-40 relative">
            <div className="absolute -bottom-10 left-8">
              <div className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-xl">
                {selectedRider?.image ? (
                  <img src={selectedRider.image} alt={selectedRider.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <Avatar initials={selectedRider?.initials || '?'} size="full" shape="square" className="rounded-xl overflow-hidden" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-14 px-8 pb-8 space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black font-display text-ink leading-tight">{selectedRider?.name || 'Unknown Rider'}</h2>
                <div className="flex items-center gap-4 mt-1.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-ink-4 uppercase tracking-widest">Passenger ID</span>
                    <span className="font-mono text-sm font-black text-primary tracking-tighter uppercase">{selectedRider?.passengerId || 'P-NOTFOUND'}</span>
                  </div>
                  <div className="w-px h-8 bg-line-2"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-ink-4 uppercase tracking-widest">Source / Program</span>
                    <span className="text-sm font-black text-ink uppercase tracking-tight">{selectedRider?.source || 'Chesterfield County'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {selectedRider?.status === 'active' ? (
                  <Badge variant="accent" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest" dot>Eligible</Badge>
                ) : (
                  <Badge variant="neutral" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">Inactive</Badge>
                )}
                <span className="text-[10px] text-ink-4 font-bold">Joined {selectedRider?.joinedDate ? new Date(selectedRider.joinedDate).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-bg rounded-xl p-5 border border-line-2">
                <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-1">Total Trips</p>
                <p className="text-2xl font-black text-ink">{(selectedRider?.totalTrips || 0).toLocaleString()}</p>
              </div>
              <div className="bg-bg rounded-xl p-5 border border-line-2">
                <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-1">Space Type</p>
                <p className="text-xl font-black text-primary uppercase">{selectedRider?.mobility || 'AMB'}</p>
              </div>
              <div className="bg-bg rounded-xl p-5 border border-line-2">
                <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-1">Rating</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <Star size={18} fill="#F59E0B" className="text-warning" />
                   <p className="text-xl font-black text-ink">{selectedRider?.rating || 0}</p>
                </div>
              </div>
              <div className="bg-bg rounded-xl p-5 border border-line-2">
                <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-1">Billing Class</p>
                <p className="text-sm font-black text-ink mt-1 uppercase truncate">{selectedRider?.paymentMethod || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-line-2">
                      <div className="p-2.5 bg-white rounded-lg text-ink-3 shadow-sm"><Phone size={18} /></div>
                      <span className="text-base font-bold text-ink">{selectedRider?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-line-2">
                      <div className="p-2.5 bg-white rounded-lg text-ink-3 shadow-sm"><Mail size={18} /></div>
                      <span className="text-base font-bold text-ink">{selectedRider?.email || 'N/A'}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-ink uppercase tracking-widest mb-4 mt-6">Emergency Contact</h4>
                  <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-line-2">
                    <div className="p-2.5 bg-urgent-light text-urgent rounded-lg shadow-sm"><AlertTriangle size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-ink">{selectedRider?.emergencyContact?.name || 'N/A'}</p>
                      <p className="text-xs font-medium text-ink-3">{selectedRider?.emergencyContact?.relation || 'N/A'} · {selectedRider?.emergencyContact?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h4 className="text-sm font-bold text-ink uppercase tracking-widest mb-4 mt-6">Default Locations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-line-2">
                      <div className="p-2.5 bg-white rounded-lg text-ink-3 shadow-sm"><MapPin size={18} /></div>
                      <div>
                        <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-0.5">Home/Pickup</p>
                        <p className="text-sm font-bold text-ink">{selectedRider?.defaultPickup || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-bg rounded-xl border border-line-2">
                      <div className="p-2.5 bg-white rounded-lg text-primary shadow-sm"><Activity size={18} /></div>
                      <div>
                        <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-0.5">Primary Facility</p>
                        <p className="text-sm font-bold text-ink">{selectedRider?.defaultDropoff || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Trip History</h4>
                  <div className="space-y-3">
                    {(() => {
                      const riderTrips = (trips || []).filter(t => t.rider?.name === selectedRider?.name || (t.rider && selectedRider && t.rider.initials === selectedRider.initials));
                      if (riderTrips.length === 0) {
                        return (
                          <div className="text-center py-8 bg-bg rounded-xl border border-line-2">
                             <p className="text-sm font-bold text-ink-3">No trips recorded</p>
                          </div>
                        );
                      }
                      return riderTrips.slice(0, 5).map((trip, i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 bg-bg rounded-xl border border-line-2 hover:border-line transition-all group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-ink-4 uppercase tracking-tighter">#{trip.id.slice(-4)}</span>
                            <Badge variant={trip.status === 'completed' ? 'accent' : 'neutral'} className="text-[9px] uppercase">
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-ink-4 font-bold uppercase tracking-widest">Type</p>
                              <p className="text-xs font-bold text-ink truncate capitalize">{trip.type?.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-ink-4 font-bold uppercase tracking-widest">Date</p>
                              <p className="text-xs font-bold text-ink truncate">{new Date(trip.scheduledTime).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-ink-4 mt-1">
                             <MapPin size={12} className="shrink-0" />
                             <span className="text-[10px] font-medium truncate">{trip.pickup}</span>
                             <span className="text-[10px] mx-1">→</span>
                             <span className="text-[10px] font-medium truncate text-primary">{trip.dropoff}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-display text-ink tracking-tight">Rider Directory</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-wide">Manage patient profiles, mobility needs, and trip history</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Riders',  value: (riders || []).length,                               sub: 'registered accounts',  icon: Users,       color: 'bg-primary-light text-primary' },
          { label: 'Active',        value: (riders || []).filter(r => r?.status === 'active').length, sub: 'active passengers',    icon: Activity,    color: 'bg-accent-light text-accent'   },
        ].map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider leading-none">{s.label}</p>
              <p className="text-3xl font-extrabold text-ink mt-1 leading-none">{s.value}</p>
              <p className="text-[10px] text-ink-4 mt-1">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden border-line-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2 bg-bg/30">
          <div className="flex items-center gap-1">
            {[
              { id: 'all',       label: 'All Riders' },
              { id: 'active',   label: 'Active' },
              { id: 'inactive',  label: 'Inactive' },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-primary border border-line' : 'text-ink-3 hover:text-ink'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
            <input type="text" placeholder="Search name, ID..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none"
              value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg/40 border-b border-line-2">
              <tr>
                {['Rider', 'Passenger ID', 'Source / Program', 'Status', 'Mobility', 'Trips', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold text-ink-4 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {paginatedRiders.map(rider => (
                <tr key={rider.id} className="hover:bg-bg/40 transition-colors group cursor-pointer" onClick={() => setSelectedRiderId(rider.id)}>
                  <td className="px-5 py-4">
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
                        <p className="text-sm font-black text-ink truncate leading-tight">{rider.name}</p>
                        <p className="text-[10px] font-medium text-ink-4 truncate">{rider.phone || '---'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[11px] font-black text-ink-3 uppercase tracking-tighter">{rider?.passengerId || 'P-NOTFOUND'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                       <span className="text-[10px] font-black text-ink-2 uppercase tracking-wide">{rider?.source || 'Chesterfield'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                     <Badge variant={rider.status === 'active' ? 'accent' : 'neutral'} className="text-[9px] font-black uppercase tracking-widest">{rider.status === 'active' ? 'Eligible' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-bold text-ink whitespace-nowrap uppercase tracking-tighter">{rider.mobility || 'AMB'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-black text-ink">{(rider?.totalTrips || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight size={16} className="text-ink-4 group-hover:translate-x-1 transition-transform" />
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
