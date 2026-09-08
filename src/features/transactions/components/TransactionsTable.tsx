import React from 'react';
import { Search, AlertCircle, FileDown } from 'lucide-react';
import { Card, Badge, Avatar } from '@/shared/components/ui';
import { formatShortDate, money } from '@/utils/helpers';

interface TransactionsTableProps {
  search: string;
  setSearch: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  filteredData: any[];
  onRefundClick: (txn: any) => void;
  onExportClick: (txn: any) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  search,
  setSearch,
  filter,
  setFilter,
  filteredData,
  onRefundClick,
  onExportClick
}) => {
  return (
    <Card className="overflow-hidden border-line-2 shadow-sm p-0">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-line-2 bg-white flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" size={16} />
          <input
            type="text"
            placeholder="Search by TXN ID, Trip ID, or Rider..."
            className="w-full pl-10 pr-4 py-2 bg-bg/50 border border-line-2 rounded-xl text-xs font-medium text-ink focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-bg/70 p-1 rounded-xl border border-line-2 gap-0.5">
          {['all', 'paid', 'pending', 'refunded'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-white shadow-xs text-primary font-bold'
                  : 'text-ink-3 hover:text-ink hover:bg-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg/40 border-b border-line-2">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3">Transaction</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3">Date</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3">Rider</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3">Payer</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3 text-right">Copay / Payer Charge</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3 text-right">Payer Charge</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3 text-center">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-ink-3 text-right min-w-[132px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {filteredData.map((txn: any) => (
              <tr key={txn.id} className="hover:bg-bg/30 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold text-ink">{txn.id}</span>
                  <span className="block text-xs font-normal text-ink-4 mt-0.5">Ref: {txn.tripId}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-ink-2 whitespace-nowrap">
                  {formatShortDate(txn.date)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={txn.rider?.initials || 'R'} size="xs" />
                    <span className="text-xs font-semibold text-ink truncate max-w-[140px]">{txn.rider?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-bg border border-line-2 text-ink-2">
                    {txn.fundingSource || txn.method || 'Self-Pay'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="text-xs space-y-0.5">
                    <div className="text-ink-4">Passenger Copay: <span className="text-ink-2 font-medium">{money(txn.copay)}</span></div>
                    <div className="text-ink-4">Payer Charge: <span className="text-primary font-semibold">{money(txn.countyShare)}</span></div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <span className="text-xs font-bold text-primary">{money(txn.amount)}</span>
                </td>
                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                  <Badge
                    variant={txn.status === 'paid' ? 'accent' : txn.status === 'refunded' ? 'urgent' : 'warning'}
                    className="text-xs font-semibold capitalize"
                  >
                    {txn.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Export CSV"
                      onClick={() => onExportClick(txn)}
                      className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <FileDown size={14} />
                    </button>
                    {txn.status === 'paid' && (
                      <button
                        type="button"
                        onClick={() => onRefundClick(txn)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-urgent hover:bg-urgent/10 transition-colors"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="p-12 text-center text-ink-4">
            <AlertCircle size={36} className="mx-auto mb-3 opacity-30 text-ink-4" />
            <p className="text-sm font-semibold text-ink">No transactions found</p>
            <p className="text-xs text-ink-4 mt-1">Try adjusting your search criteria or date filter.</p>
          </div>
        )}
      </div>
    </Card>
  );
};
