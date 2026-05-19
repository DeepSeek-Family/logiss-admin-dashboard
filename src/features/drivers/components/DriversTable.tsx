import { Search, Star, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { Card, Avatar, Badge, Pagination } from '@/shared/components/ui';

interface DriversTableProps {
  drivers: any[];
  activeTab: string;
  setActiveTab: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
  currentPage: number;
  setCurrentPage: (val: number) => void;
  totalPages: number;
  paginatedDrivers: any[];
  filteredCount: number;
  itemsPerPage: number;
  onDriverClick: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export const DriversTable = ({
  drivers,
  activeTab,
  setActiveTab,
  search,
  setSearch,
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedDrivers,
  filteredCount,
  itemsPerPage,
  onDriverClick,
  getStatusBadge
}: DriversTableProps) => {
  return (
    <Card className="overflow-hidden border-line-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2 bg-bg/30">
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'All Drivers' },
            { id: 'on_duty', label: 'On Duty' },
            { id: 'off_duty', label: 'Off Duty' },
            { id: 'attention', label: `Needs Attention${(drivers || []).some((d: any) => (d?.pendingDocUpdates || 0) > 0) ? ' (1)' : ''}` },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-primary border border-line'
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
            className="w-full pl-8 pr-3 py-2 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bg/40 border-b border-line-2">
            <tr>
              {['Driver', 'Vehicle', 'Status', 'Trips', 'Compliance'].map(h => (
                <th key={h} className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {paginatedDrivers.map((driver: any) => (
              <tr key={driver.id} className="hover:bg-bg/40 transition-colors group cursor-pointer" onClick={() => onDriverClick(driver.id)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar initials={driver.initials} size="sm" />
                      {driver.onDuty && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white text-[1px]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{driver.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-ink-3 bg-bg px-1.5 py-0.5 rounded border border-line-2">{driver.id}</span>
                        <span className="text-[10px] font-medium text-ink-4 truncate">{driver.email}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-ink whitespace-nowrap">{driver?.vehicle?.make || 'No Vehicle'}</p>
                    <p className="font-mono text-[10px] text-ink-4 mt-0.5">{driver?.vehicle?.plate || '---'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(driver.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-ink">{driver?.tripsToday || 0}</span>
                      <span className="text-[10px] text-ink-4">today</span>
                    </div>
                    <p className="text-[10px] text-ink-4">{(driver?.totalTrips || 0).toLocaleString()} total</p>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-warning mt-0.5">
                      <Star size={9} fill="currentColor" /> {driver?.rating || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {(driver?.pendingDocUpdates || 0) > 0 ? (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-urgent bg-urgent-light px-2 py-1 rounded-full w-fit">
                        <AlertTriangle size={10} /> Needs Review
                      </span>
                      <p className="text-[10px] text-ink-4 ml-2">{driver.pendingDocUpdates} doc(s)</p>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-accent bg-accent-light px-2 py-1 rounded-full w-fit">
                      <ShieldCheck size={10} /> Verified
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4/40 group-hover:text-primary group-hover:bg-primary-light transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedDrivers.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-16 text-center text-ink-4">
                  <Search size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-ink-4">No drivers match your filter</p>
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
      />
    </Card>
  );
};
