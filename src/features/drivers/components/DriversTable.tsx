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
  setItemsPerPage: (size: number) => void;
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
  setItemsPerPage,
  onDriverClick,
  getStatusBadge
}: DriversTableProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-line bg-white">
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
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-light text-primary'
                  : 'text-ink-3 hover:text-ink hover:bg-bg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} />
          <input
            type="text"
            placeholder="Search name, ID..."
            className="w-full pl-9 pr-3 py-2 bg-bg border border-line rounded-lg text-sm font-medium text-ink placeholder:text-ink-3 focus:ring-2 focus:ring-primary/15 outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-bg border-b border-line">
            <tr>
              {['Driver', 'Vehicle', 'Status', 'Trips', 'Compliance'].map(h => (
                <th key={h} className="px-5 py-2.5 type-th whitespace-nowrap">
                  {h}
                </th>
              ))}
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paginatedDrivers.map((driver: any) => (
              <tr key={driver.id} className="hover:bg-primary-tint/40 transition-colors group cursor-pointer" onClick={() => onDriverClick(driver.id)}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar initials={driver.initials} size="sm" />
                      {driver.onDuty && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink leading-tight truncate">{driver.name}</p>
                      <p className="text-xs font-medium text-ink-3 mt-0.5 truncate">
                        <span className="text-ink-2">{driver.id}</span>
                        {driver.email ? <span> · {driver.email}</span> : null}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-semibold text-ink whitespace-nowrap">{driver?.vehicle?.make || 'No Vehicle'}</p>
                  <p className="text-xs font-medium text-ink-2 mt-0.5">{driver?.vehicle?.plate || '—'}</p>
                </td>
                <td className="px-5 py-3">
                  {getStatusBadge(driver.status)}
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-semibold text-ink tabular-nums">
                    {driver?.tripsToday || 0} <span className="text-xs font-medium text-ink-3">today</span>
                  </p>
                  <p className="text-xs font-medium text-ink-3 mt-0.5 flex items-center gap-1.5">
                    {(driver?.totalTrips || 0).toLocaleString()} total
                    <span className="inline-flex items-center gap-0.5 text-warning font-semibold">
                      <Star size={12} fill="currentColor" /> {driver?.rating || 0}
                    </span>
                  </p>
                </td>
                <td className="px-5 py-3">
                  {(driver?.pendingDocUpdates || 0) > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-urgent">
                      <AlertTriangle size={14} /> Needs review · {driver.pendingDocUpdates}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <ChevronRight size={18} className="inline text-ink-3 group-hover:text-primary" />
                </td>
              </tr>
            ))}
            {paginatedDrivers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <Search size={28} className="mx-auto mb-2 text-ink-3" />
                  <p className="text-sm font-medium text-ink-3">No drivers match your filter</p>
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
