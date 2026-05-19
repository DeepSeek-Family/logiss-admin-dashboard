import { Search, AlertCircle } from 'lucide-react';
import { Card, Badge, Avatar, Button } from '@/shared/components/ui';
import { formatShortDate, money } from '@/utils/helpers';

interface TransactionsTableProps {
  search: string;
  setSearch: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  filteredData: any[];
  onRefundClick: (txn: any) => void;
}

export const TransactionsTable = ({
  search,
  setSearch,
  filter,
  setFilter,
  filteredData,
  onRefundClick
}: TransactionsTableProps) => {
  return (
    <Card className="overflow-hidden border-line-2 shadow-sm">
      <div className="p-6 border-b border-line-2 bg-bg/30 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" size={20} />
          <input
            type="text"
            placeholder="Search by TXN ID, Trip ID, or Rider..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-line rounded-xl text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-bg p-1 rounded-xl border border-line shadow-inner">
          {['all', 'paid', 'pending', 'refunded'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-white shadow-sm text-primary' : 'text-ink-4 hover:text-ink-2 hover:bg-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg/50 border-b border-line-2">
            <tr>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Transaction ID</th>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Date</th>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Rider</th>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Breakdown</th>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Amount</th>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Status</th>
              <th className="px-6 py-4 text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {filteredData.map((txn: any) => (
              <tr key={txn.id} className="hover:bg-primary-tint/20 transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <p className="text-xs font-mono text-ink-3">{txn.id}</p>
                  <p className="text-[10px] text-ink-4 font-mono mt-0.5">Ref: {txn.tripId}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-ink">{formatShortDate(txn.date)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={txn.rider.initials} size="xs" />
                    <div>
                      <p className="text-xs font-medium text-ink">{txn.rider.name}</p>
                      <p className="text-[10px] text-ink-4 mt-0.5">{txn.method}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5 text-[11px] font-medium text-ink-3">
                    <span>Copay: <span className="font-medium text-ink font-mono">{money(txn.copay)}</span></span>
                    <span>County: <span className="font-medium text-ink font-mono">{money(txn.countyShare)}</span></span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-mono text-ink">{money(txn.amount)}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={txn.status === 'paid' ? 'accent' : txn.status === 'refunded' ? 'urgent' : 'warning'} className="uppercase text-[10px] w-fit">
                    {txn.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {txn.status === 'paid' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-urgent hover:bg-urgent-light border-urgent/20 opacity-0 group-hover:opacity-100 transition-all text-xs font-medium"
                      onClick={() => onRefundClick(txn)}
                    >
                      Refund
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-12 text-center text-ink-4">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-ink">No transactions found</p>
            <p className="text-xs">Adjust your search or filter options.</p>
          </div>
        )}
      </div>
    </Card>
  );
};
