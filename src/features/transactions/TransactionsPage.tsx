import React, { useState, useMemo } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
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

  const exportToExcel = (rows: any[], filename: string, sourceName?: string) => {
    const policy = sourceName ? findFundingPolicy(sourceName, pricing) : null;
    const headers = policy?.reportColumns?.length ? policy.reportColumns : LEDGER_COLUMNS;

    const excelData = rows.map((t: any) => {
      const row: Record<string, any> = {};
      headers.forEach(h => {
        if (h === 'Invoice #') row[h] = t.id || '';
        else if (h === 'Trip ID') row[h] = t.tripId || '';
        else if (h === 'Date') row[h] = t.date ? new Date(t.date).toLocaleDateString() : '';
        else if (h === 'Rider') row[h] = t.rider?.name || 'Unknown';
        else if (h === 'Pickup') row[h] = t.pickup || '';
        else if (h === 'Dropoff') row[h] = t.dropoff || '';
        else if (h === 'Route') row[h] = `${t.pickup || ''} → ${t.dropoff || ''}`;
        else if (h === 'Payer' || h === 'Funding Source') row[h] = t.fundingSource || '';
        else if (h === 'Auth ID') row[h] = t.authId || 'N/A';
        else if (h === 'Payer Charge' || h === 'Funding Source Charge') row[h] = Number((t.countyShare || 0).toFixed(2));
        else if (h === 'Passenger Copay') row[h] = Number((t.copay || 0).toFixed(2));
        else if (h === 'Status') row[h] = t.status || '';
        else if (h === 'Method') row[h] = t.method || '';
        else if (h === 'Miles') row[h] = t.miles ?? '';
        else if (h === 'Calculated Miles') row[h] = t.calculatedMiles ?? t.miles ?? '';
        else if (h === 'Actual Miles') row[h] = t.actualMiles ?? '';
        else if (h === 'Inside/Outside') row[h] = t.insideCounty === false ? 'Outside' : 'Inside';
        else if (h === 'Billing Class') row[h] = t.billingClassName || t.billingClassId || '';
        else if (h === 'Driver') row[h] = t.driverName || t.driver?.name || '';
        else row[h] = '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const colWidths = headers.map(h => {
      let maxLen = h.length;
      excelData.forEach(r => {
        const valStr = String(r[h] ?? '');
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, filename);
  };

  const exportLedger = async () => {
    const today = new Date().toISOString().split('T')[0];
    const range = startDate || endDate
      ? `${startDate || 'start'}_to_${endDate || 'end'}`
      : today;
    const filename = `LOGISS_Transactions_${range}.xlsx`;

    try {
      const result = await triggerExport({
        search: search || undefined,
        paymentStatus: filter !== 'all' ? filter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }).unwrap();

      if (result && typeof result === 'string') {
        const clean = result.trim();
        let wb: XLSX.WorkBook | null = null;

        try {
          if (clean.startsWith('UEsDB') || clean.startsWith('PK')) {
            // Base64 encoded XLSX binary file from backend
            wb = XLSX.read(clean, { type: 'base64' });
          } else if (clean.includes(',') || clean.includes('\n')) {
            // Plain text CSV string from backend
            wb = XLSX.read(clean, { type: 'string' });
          }
        } catch {
          wb = null;
        }

        if (wb && wb.SheetNames && wb.SheetNames.length > 0) {
          XLSX.writeFile(wb, filename);
          toast.success('Payment export downloaded as Excel successfully.');
          return;
        }
      }
    } catch {
      // Fallback to client-side formatted Excel generation
    }

    if (filteredData.length === 0) {
      toast.error('No transactions in this date range to export.');
      return;
    }
    exportToExcel(filteredData, filename);
    toast.success('Payment export downloaded as Excel successfully.');
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
              {isExporting ? 'Exporting...' : 'Export Excel'}
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
          exportToExcel([item], `LOGISS_${item.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
