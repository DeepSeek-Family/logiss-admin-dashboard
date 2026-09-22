import { Search, ChevronRight, ChevronDown, UserCheck, UserX, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, Avatar, Badge, Pagination } from '@/shared/components/ui';

interface RidersTableProps {
  activeTab: string;
  setActiveTab: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
  currentPage: number;
  setCurrentPage: (val: number) => void;
  totalPages: number;
  paginatedRiders: any[];
  filteredCount: number;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  onRiderClick: (id: string) => void;
  updateRiderStatus: (id: string, status: string) => void;
  openStatusId: string | null;
  setOpenStatusId: (id: string | null) => void;
}

export const RidersTable = ({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedRiders,
  filteredCount,
  itemsPerPage,
  setItemsPerPage,
  onRiderClick,
  updateRiderStatus,
  openStatusId,
  setOpenStatusId
}: RidersTableProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2/50 bg-bg/20">
        <div className="flex items-center gap-1 bg-bg/60 p-0.5 rounded-xl">
          {[
            { id: 'all', label: 'All Riders' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
                  : 'text-ink-4 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={14} />
          <input
            type="text"
            placeholder="Search name, ID..."
            className="w-full pl-8 pr-3 py-2 bg-bg/60 focus:bg-white rounded-xl text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bg/10 border-b border-line-2/50">
            <tr>
              {['Rider', 'IDs', 'County / Payer', 'Status', 'Mobility', 'Contact', 'Trips', ''].map(h => (
                <th key={h} className="px-5 py-2.5 type-th whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2/50">
            {paginatedRiders.map(rider => (
              <tr key={rider.id} className="hover:bg-bg/30 transition-colors group cursor-pointer" onClick={() => onRiderClick(rider.id)}>
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
                      <p className="text-sm font-medium text-ink truncate">{rider.name}</p>
                      <p className="text-xs font-medium text-ink-4 truncate">{rider.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-ink-3">
                      <span className="text-ink-4 mr-0.5">ID:</span> {rider.passengerId || rider.id}
                    </span>
                    <span className="text-xs text-primary">
                      <span className="text-primary-dark/60 mr-0.5">AUTH:</span> {rider.authorizationId || rider.authId || '---'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    {rider.county && (
                      <span className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full w-fit">
                        {rider.county}
                      </span>
                    )}
                    {rider.source && <Badge variant="outline" className="font-medium text-primary border-primary/20 bg-primary/5 w-fit">{rider.source}</Badge>}
                    {!rider.county && !rider.source && <span className="text-xs text-ink-4">—</span>}
                  </div>
                </td>
                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => setOpenStatusId(openStatusId === rider.id ? null : rider.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-0 transition-all ${
                        rider.status === 'active'
                          ? 'text-accent bg-accent-light/35'
                          : rider.status === 'suspended'
                          ? 'text-warning border-warning/15 bg-warning-light/40'
                          : rider.status === 'banned'
                          ? 'text-urgent bg-urgent-light/45'
                          : 'text-ink-4 bg-bg'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'active' ? 'bg-accent' : rider.status === 'suspended' ? 'bg-warning' : rider.status === 'banned' ? 'bg-urgent' : 'bg-ink-4'}`} />
                      {(rider.status || 'inactive').toUpperCase()}
                      <ChevronDown size={10} />
                    </button>
                    {openStatusId === rider.id && (
                      <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-line-2 rounded-xl shadow-xl w-44 py-1 animate-in fade-in duration-150">
                        <p className="px-3 py-2 type-th border-b border-line-2 mb-1">Change Status</p>
                        {[
                          { value: 'active', label: 'Set Active', icon: UserCheck, color: 'text-accent hover:bg-accent-light/30' },
                          { value: 'suspended', label: 'Suspend Rider', icon: UserX, color: 'text-warning hover:bg-warning-light/40' },
                          { value: 'banned', label: 'Ban Rider', icon: Ban, color: 'text-urgent hover:bg-urgent-light/40' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            disabled={rider.status === opt.value}
                            onClick={() => {
                              updateRiderStatus(rider.id, opt.value);
                              setOpenStatusId(null);
                              toast.success(rider.name + ' marked as ' + opt.value);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${opt.color}`}
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
                  {rider.mobility ? (
                    <Badge
                      variant={
                        rider.mobility === 'Wheelchair' ? 'accent' :
                        rider.mobility === 'Ambulatory' ? 'neutral' : 'warning'
                      }
                      className="font-medium py-0.5 px-2 text-xs rounded-full"
                    >
                      {rider.mobility}
                    </Badge>
                  ) : (
                    <span className="text-xs text-ink-4">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-ink-3">{rider?.phone || '---'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-ink">{(rider?.totalTrips || 0).toLocaleString()}</span>
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
                  <p className="text-sm font-medium text-ink-4">No riders match your filter</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
      />
    </Card>
  );
};
