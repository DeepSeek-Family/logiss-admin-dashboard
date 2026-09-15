import { ChevronRight, Truck, ShieldAlert, ClipboardCheck } from 'lucide-react';
import { Card, Badge, Pagination, SearchInput } from '@/shared/components/ui';
import { AssignDriverCell } from './AssignDriverCell';

const VEHICLE_PLACEHOLDER = '/vehicle-placeholder.svg';

function toSentenceCase(value?: string | null) {
  const text = (value || '').trim();
  if (!text) return '—';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

interface FleetTableProps {
  paginated: any[];
  drivers: any[];
  handleAssign: (vId: string, dId: string | null) => void;
  currentPage: number;
  setCurrentPage: (val: number) => void;
  totalPages: number;
  filteredCount: number;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  filter: string;
  setFilter: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
  stats: any;
  statusConfig: any;
  insuranceBadge: any;
  onNavigate: (path: string) => void;
}

export const FleetTable = ({
  paginated,
  drivers,
  handleAssign,
  currentPage,
  setCurrentPage,
  totalPages,
  filteredCount,
  itemsPerPage,
  setItemsPerPage,
  filter,
  setFilter,
  search,
  setSearch,
  stats,
  statusConfig,
  insuranceBadge,
  onNavigate
}: FleetTableProps) => {
  return (
    <Card className="overflow-hidden border-line-2 shadow-xl shadow-ink/5 ring-1 ring-ink/5 rounded-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-8 py-6 border-b border-line-2 bg-bg/20">
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl shadow-inner ring-1 ring-ink/5 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Units' },
            { id: 'available', label: 'Available' },
            { id: 'in_trip', label: 'In Trip' },
            { id: 'issues', label: `Maintenance${stats.issues ? ` (${stats.issues})` : ''}` },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${filter === tab.id ? 'bg-primary text-white shadow-md' : 'text-ink-4 hover:text-ink hover:bg-bg'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        
        <SearchInput
          className="w-full lg:w-72"
          placeholder="Search Assets, Plates, or IDs..."
          paramName="searchTerm"
          defaultValue={search}
          onSearchChange={(debouncedVal) => {
            setSearch(debouncedVal);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="overflow-auto max-h-[calc(100vh-24rem)]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg/40 border-b border-line-2 sticky top-0 z-10">
            <tr>
              {['Vehicle', 'Vehicle Type', 'Status', 'Operator', 'Mileage', 'Next Service', 'Compliance', ''].map(h => (
                <th key={h} className="px-5 py-2.5 type-th whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {paginated.map((v: any) => {
              const s = statusConfig[v.status] || statusConfig.available;
              const nextServiceDate = v?.nextService ? new Date(v.nextService) : null;
              const nextServiceDays = nextServiceDate ? Math.ceil((nextServiceDate.getTime() - new Date().getTime()) / 86400000) : null;
              const serviceWarning = nextServiceDays !== null && nextServiceDays < 60;

              return (
                <tr key={v.id} className="hover:bg-bg/40 transition-all duration-300 group cursor-pointer" onClick={() => onNavigate(`/fleet/${v.id}`)}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-line overflow-hidden relative">
                        <img src={v.image || VEHICLE_PLACEHOLDER} alt={v.plate} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{v.year} {v.make} {v.model}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-ink-3 bg-bg px-1.5 py-0.5 rounded border border-line-2">{v.plate}</span>
                          <span className="text-xs text-ink-4 font-medium">ID: {v.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-ink">{toSentenceCase(v.type)}</span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      {s.label}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <AssignDriverCell vehicle={v} allDrivers={drivers} onAssign={handleAssign} />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-ink">{(v?.mileage || 0).toLocaleString()}<span className="text-xs text-ink-4 ml-1">mi</span></p>
                    <p className="text-xs text-ink-4 mt-0.5">{v?.seats || 0} seats</p>
                  </td>

                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 ${serviceWarning ? 'text-urgent' : 'text-ink-3'}`}>
                      {serviceWarning ? <ShieldAlert size={12} /> : <ClipboardCheck size={12} className="text-accent" />}
                      <span className="text-xs font-medium">{v.nextService}</span>
                    </div>
                    {serviceWarning && <p className="text-xs font-medium mt-0.5">Due in {nextServiceDays}d</p>}
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant={insuranceBadge[v.insurance?.status] || 'neutral'} className="text-xs font-medium px-2 py-0.5">
                      {v.insurance?.status}
                    </Badge>
                    <p className="text-xs text-ink-4 mt-1 font-medium">Exp {v.insurance?.expires || 'N/A'}</p>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onNavigate(`/fleet/${v.id}`)}
                      className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-ink-4 hover:bg-primary hover:text-white transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="px-8 py-24 text-center">
                  <div className="w-20 h-20 bg-bg rounded-[32px] flex items-center justify-center text-ink-4 mx-auto mb-6 shadow-inner border-2 border-dashed border-line group">
                    <Truck size={40} className="group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-ink">No units match your filter</p>
                  <p className="text-xs text-ink-4 mt-1">Try adjusting your search or filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-bg/20 px-8 py-6 border-t border-line-2">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
        />
      </div>
    </Card>
  );
};
