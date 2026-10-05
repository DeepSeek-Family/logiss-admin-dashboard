import React, { useState, useMemo } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTrips } from '@/hooks/useTrips';
import { usePricing, findFundingPolicy } from '@/hooks/usePricing';

import {
  RefundModal,
  TransactionsTable
} from '@/features/transactions';
import { Can } from '@/features/userAccess';
import { useGetPaymentsQuery, useLazyExportPaymentsQuery } from '@/redux/api/transitionApi';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

const LEDGER_COLUMNS = [
  'Invoice #', 'Trip ID', 'Date', 'Rider', 'Pickup', 'Dropoff',
  'Payer', 'Auth ID', 'Payer Charge', 'Passenger Copay', 'Status', 'Method',
];

function toDayKey(value: string | number | Date | null | undefined): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="flex items-center gap-2 bg-white border border-line-2 rounded-xl pl-2.5 pr-2 h-9 shadow-2xs">
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-4 shrink-0">{label}</span>
      <input
        type="date"
        value={value}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => { try { e.currentTarget.showPicker(); } catch { /* native fallback */ } }}
        className="text-xs font-medium text-ink outline-none bg-transparent cursor-pointer min-w-[9.5rem] [color-scheme:light]"
        aria-label={label}
      />
    </label>
  );
}

export const Transactions = ({ role }: { role?: string | null }) => {
  const { trips, loading } = useTrips();
  const { pricing } = usePricing();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showRefundModal, setShowRefundModal] = useState<any>(null);

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const startDate = fromParam && YMD.test(fromParam) ? fromParam : '';
  const endDate = toParam && YMD.test(toParam) ? toParam : '';

  const setDateRange = (from: string, to: string) => {
    const next = new URLSearchParams(searchParams);
    if (from && YMD.test(from)) next.set('from', from);
    else next.delete('from');
    if (to && YMD.test(to)) next.set('to', to);
    else next.delete('to');
    setSearchParams(next, { replace: true });
  };

  const setStartDate = (value: string) => {
    const from = YMD.test(value) ? value : '';
    const to = from && endDate && from > endDate ? from : endDate;
    setDateRange(from, to);
  };

  const setEndDate = (value: string) => {
    const to = YMD.test(value) ? value : '';
    const from = to && startDate && to < startDate ? to : startDate;
    setDateRange(from, to);
  };

  const { data: paymentsResponse, isLoading: paymentsLoading } = useGetPaymentsQuery({
    search: search || undefined,
    paymentStatus: filter !== 'all' ? filter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const [triggerExport, { isLoading: isExporting }] = useLazyExportPaymentsQuery();

  const livePayments = useMemo(() => {
    if (!paymentsResponse?.data) return [];
    return paymentsResponse.data.map((p: any) => {
      const user = p.userId;
      const userName = typeof user === 'object' && user
        ? [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ')
        : 'Unknown Rider';
      const booking = p.bookingId;
      const bId = typeof booking === 'object' && booking ? (booking.id || booking._id) : (booking || '');

      return {
        id: `TXN-${p._id.slice(-6).toUpperCase()}`,
        rawId: p._id,
        tripId: bId || p._id,
        date: p.createdAt || p.updatedAt,
        rider: {
          name: userName,
          initials: userName.split(' ').map((n: string) => n[0] || '').join('').toUpperCase() || 'R',
          email: typeof user === 'object' ? user?.email : '',
          contact: typeof user === 'object' ? user?.contact : '',
        },
        amount: p.price || 0,
        copay: 0,
        countyShare: p.price || 0,
        status: (p.paymentStatus || 'paid').toLowerCase(),
        method: 'Online Payment',
        fundingSource: 'Self-Pay',
        createdAt: p.createdAt,
      };
    });
  }, [paymentsResponse]);

  // Generate transactions based on trips & backend payments
  const transactions = useMemo(() => {
    const tripTxns = (trips || []).map((t: any) => {
      const copay = t.passengerCopay != null ? t.passengerCopay : (t.copay || 0);
      const countyShare = t.fundingSourceCharge != null
        ? t.fundingSourceCharge
        : (t.costToCounty != null ? t.costToCounty : (t.cost || 0));
      return {
        id: `TXN-${t.id.split('-')[1] || t.id.slice(-4)}`,
        tripId: t.id,
        date: t.scheduledTime,
        rider: t.rider,
        amount: countyShare,
        copay,
        countyShare,
        status: t.paymentStatus === 'charged' || t.paymentStatus === 'Paid' || t.paymentStatus === 'Approved' ? 'paid' : t.paymentStatus === 'refunded' ? 'refunded' : 'pending',
        method: t.paymentMethod || 'Insurance',
        fundingSource: t.fundingSource || t.paymentMethod || 'Self-Pay',
        fundingSourceId: t.fundingSourceId,
        authId: t.authorizationId || t.authId || '',
        miles: t.miles,
        calculatedMiles: t.calculatedMiles,
        actualMiles: t.actualMiles,
        insideCounty: t.insideCounty,
        billingClassId: t.billingClassId,
        billingClassName: t.billingClassName,
        driverName: t.driverName,
        driver: t.driver,
        pickup: t.pickup,
        dropoff: t.dropoff,
        paymentStatus: t.paymentStatus,
      };
    });

    if (livePayments.length > 0) {
      const existingTripIds = new Set(livePayments.map((lp: any) => lp.tripId));
      const filteredTripTxns = tripTxns.filter((tt: any) => !existingTripIds.has(tt.tripId));
      return [...livePayments, ...filteredTripTxns].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return tripTxns.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trips, livePayments]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t: any) => {
      const matchesSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        t.tripId.toLowerCase().includes(q) ||
        (t.rider?.name || '').toLowerCase().includes(q);
      const matchesStatus = filter === 'all' ? true : t.status === filter;
      const day = toDayKey(t.date);
      const matchesStart = !startDate || (!!day && day >= startDate);
      const matchesEnd = !endDate || (!!day && day <= endDate);
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [transactions, search, filter, startDate, endDate]);

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cellForColumn = (col: string, t: any): string => {
    switch (col) {
      case 'Trip ID': return t.tripId;
      case 'Date': return new Date(t.date).toLocaleDateString();
      case 'Rider': return `"${t.rider?.name || 'Unknown'}"`;
      case 'Miles': return String(t.miles ?? '');
      case 'Calculated Miles': return String(t.calculatedMiles ?? t.miles ?? '');
      case 'Actual Miles': return String(t.actualMiles ?? '');
      case 'Inside/Outside': return t.insideCounty === false ? 'Outside' : 'Inside';
      case 'Billing Class': return t.billingClassName || t.billingClassId || '';
      case 'Driver': return `"${t.driverName || t.driver?.name || ''}"`;
      case 'Pickup': return `"${t.pickup || ''}"`;
      case 'Dropoff': return `"${t.dropoff || ''}"`;
      case 'Route': return `"${t.pickup || ''} → ${t.dropoff || ''}"`;
      case 'Passenger Copay': return (t.copay || 0).toFixed(2);
      case 'Payer Charge':
      case 'Funding Source Charge': return (t.countyShare || 0).toFixed(2);
      case 'Auth ID': return `"${t.authId || 'N/A'}"`;
      case 'Status': return t.status;
      default: return '';
    }
  };

  const rowsToCsv = (rows: any[], sourceName?: string) => {
    const policy = sourceName
      ? findFundingPolicy(sourceName, pricing)
      : null;
    const headers = policy?.reportColumns?.length
      ? policy.reportColumns
      : LEDGER_COLUMNS;

    const body = rows.map((t: any) =>
      headers.map(h => {
        if (h === 'Invoice #') return t.id;
        if (h === 'Payer' || h === 'Funding Source') return `"${t.fundingSource || ''}"`;
        if (h === 'Method') return `"${t.method || ''}"`;
        return cellForColumn(h, t) || '';
      }).join(',')
    );
    return [headers.join(','), ...body].join('\n');
  };

  const exportLedger = async () => {
    try {
      const result = await triggerExport({
        search: search || undefined,
        paymentStatus: filter !== 'all' ? filter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }).unwrap();

      if (result) {
        const today = new Date().toISOString().split('T')[0];
        const range = startDate || endDate
          ? `${startDate || 'start'}_to_${endDate || 'end'}`
          : today;
        downloadCSV(`LOGISS_Transactions_${range}.csv`, result);
        toast.success('Payment export downloaded successfully.');
        return;
      }
    } catch {
      // Fallback to client-side CSV generation if backend export API is unavailable or errors
    }

    if (filteredData.length === 0) {
      toast.error('No transactions in this date range to export.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const range = startDate || endDate
      ? `${startDate || 'start'}_to_${endDate || 'end'}`
      : today;
    downloadCSV(`LOGISS_Transactions_${range}.csv`, rowsToCsv(filteredData));
  };

  const handleRefund = () => {
    if (showRefundModal) {
      showRefundModal.status = 'refunded';
    }
    setShowRefundModal(null);
  };

  if ((loading || paymentsLoading) && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading Transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="type-page-title">Transactions</h1>
          <p className="text-xs text-ink-3 font-semibold mt-1">
            Payment transactions data and status tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* <DateField label="From" value={startDate} onChange={setStartDate} max={endDate} />
          <DateField label="To" value={endDate} onChange={setEndDate} min={startDate} /> */}
          <Can role={role} perm="finance.export">
            <Button variant="outline" size="sm" icon={Download} onClick={exportLedger} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export Excel / CSV'}
            </Button>
          </Can>
        </div>
      </div>

      {/* Primary Transaction Table with Status Filtering */}
      <TransactionsTable
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        filteredData={filteredData}
        onRefundClick={(item: any) => setShowRefundModal(item)}
        onExportClick={(item: any) => {
          downloadCSV(`LOGISS_${item.id}_${new Date().toISOString().split('T')[0]}.csv`, rowsToCsv([item]));
        }}
      />

      {/* Refund Modal */}
      {showRefundModal && (
        <RefundModal
          showRefundModal={showRefundModal}
          onClose={() => setShowRefundModal(null)}
          onConfirm={handleRefund}
        />
      )}
    </div>
  );
};

export default Transactions;
