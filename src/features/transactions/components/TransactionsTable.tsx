import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Copy, Loader2, Mail, Phone } from 'lucide-react';
import { Card, Badge, Avatar, Pagination } from '@/shared/components/ui';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { formatShortDate, money } from '@/utils/helpers';
import type { MappedPayment } from '../utils/helpers';

const STATUS_FILTERS = ['all', 'paid', 'pending'];

const STATUS_VARIANT: Record<string, string> = {
  paid: 'accent',
  pending: 'warning',
  refunded: 'urgent',
};

const formatClock = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface TransactionsTableProps {
  search: string;
  onSearchChange: (val: string) => void;
  filter: string;
  setFilter: (val: string) => void;
  payments: MappedPayment[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  search,
  onSearchChange,
  filter,
  setFilter,
  payments,
  loading,
  error,
  onRetry,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <Card className="overflow-hidden border-line-2 shadow-sm p-0">
      <div className="p-4 border-b border-line-2 bg-white flex flex-col md:flex-row gap-3 justify-between items-center">
        <SearchInput
          paramName="searchTerm"
          placeholder="Search by rider, email, TXN number..."
          className="max-w-md w-full"
          defaultValue={search}
          onSearchChange={(value) => {
            if (value !== search) onSearchChange(value);
          }}
        />

        <div className="flex items-center gap-3">
          {loading && <Loader2 size={14} className="animate-spin text-primary" />}
          <div className="flex bg-bg/70 p-1 rounded-xl border border-line-2 gap-0.5">
            {STATUS_FILTERS.map((f) => (
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
      </div>

      {error ? (
        <div className="p-12 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3 text-urgent opacity-50" />
          <p className="text-sm font-semibold text-ink">Failed to load transactions</p>
          <p className="text-xs text-ink-4 mt-1 mb-4">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold">
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg/40 border-b border-line-2">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3">Transaction</th>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3">Booking</th>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3">Rider</th>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3">Contact</th>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3 text-right">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-ink-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-line-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {payments.map((txn) => (
                <tr key={txn.id} className="hover:bg-bg/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold text-ink">{txn.shortId}</span>
                    {txn.txnNumber && (
                      <button
                        type="button"
                        onClick={() => copy(txn.txnNumber, `txn-${txn.id}`)}
                        title="Copy transaction number"
                        className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-ink-4 hover:text-primary transition-colors"
                      >
                        <span className="truncate max-w-[180px]">{txn.txnNumber}</span>
                        {copiedId === `txn-${txn.id}` ? <Check size={11} className="text-accent" /> : <Copy size={11} />}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {txn.tripId ? (
                      <span className="inline-flex rounded-md bg-bg px-2 py-1 font-mono text-[11px] font-medium text-ink-3" title={txn.tripId}>
                        #{txn.tripId.slice(-6)}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-4">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-xs font-medium text-ink">{formatShortDate(txn.date) || '—'}</p>
                    <p className="text-[10px] text-ink-4">{formatClock(txn.date)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={txn.rider.initials} src={txn.rider.image} size="sm" />
                      <span className="text-xs font-semibold text-ink truncate max-w-[160px]">{txn.rider.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5 text-xs">
                      {txn.rider.email ? (
                        <a href={`mailto:${txn.rider.email}`} className="flex items-center gap-1.5 text-ink-2 hover:text-primary">
                          <Mail size={11} className="text-ink-4" /> <span className="truncate max-w-[180px]">{txn.rider.email}</span>
                        </a>
                      ) : null}
                      {txn.rider.contact ? (
                        <a href={`tel:${txn.rider.contact}`} className="flex items-center gap-1.5 text-ink-4 hover:text-primary">
                          <Phone size={11} /> {txn.rider.contact}
                        </a>
                      ) : null}
                      {!txn.rider.email && !txn.rider.contact && <span className="text-ink-4">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-primary tabular-nums">{money(txn.amount)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <Badge dot variant={STATUS_VARIANT[txn.status] ?? 'neutral'} className="capitalize">
                      {txn.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="p-12 text-center text-ink-4">
              {loading ? (
                <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
              ) : (
                <AlertCircle size={36} className="mx-auto mb-3 opacity-30 text-ink-4" />
              )}
              <p className="text-sm font-semibold text-ink">{loading ? 'Loading transactions' : 'No transactions found'}</p>
              {!loading && (
                <p className="text-xs text-ink-4 mt-1">
                  {search ? `No results for "${search}".` : 'Try adjusting your search or status filter.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!error && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </Card>
  );
};
