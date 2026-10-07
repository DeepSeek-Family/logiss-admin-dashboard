import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import {
  RefundModal,
  TransactionsTable,
  mapApiPayment,
  type MappedPayment,
} from '@/features/transactions';
import { Can } from '@/features/userAccess';
import { useGetPaymentsQuery, useLazyExportPaymentsQuery } from '@/redux/api/transitionApi';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

const exportToExcel = (rows: MappedPayment[], filename: string) => {
  const excelData = rows.map((t) => ({
    'Transaction ID': t.id,
    'TXN Number': t.txnNumber,
    'Booking ID': t.tripId,
    Date: t.date ? new Date(t.date).toLocaleString() : '',
    Rider: t.rider.name,
    Email: t.rider.email,
    Contact: t.rider.contact,
    Amount: Number(t.amount.toFixed(2)),
    Status: t.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const headers = Object.keys(excelData[0] || {});
  worksheet['!cols'] = headers.map((h) => {
    const maxLen = excelData.reduce((len, r) => Math.max(len, String((r as any)[h] ?? '').length), h.length);
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, filename);
};

export const Transactions = ({ role }: { role?: string | null }) => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(searchParams.get('searchTerm') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRefundModal, setShowRefundModal] = useState<MappedPayment | null>(null);
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const startDate = fromParam && YMD.test(fromParam) ? fromParam : '';
  const endDate = toParam && YMD.test(toParam) ? toParam : '';

  const filterParams = useMemo(() => ({
    searchTerm: search.trim() || undefined,
    paymentStatus: filter !== 'all' ? filter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [search, filter, startDate, endDate]);

  const { data: paymentsResponse, isFetching, isError, error, refetch } = useGetPaymentsQuery(
    { ...filterParams, page: currentPage, limit: itemsPerPage },
    { refetchOnMountOrArgChange: true },
  );

  const [triggerExport, { isLoading: isExporting }] = useLazyExportPaymentsQuery();

  const payments = useMemo(
    () => (paymentsResponse?.data || []).map((p) => {
      const mapped = mapApiPayment(p);
      return refundedIds.has(mapped.id) ? { ...mapped, status: 'refunded' } : mapped;
    }),
    [paymentsResponse, refundedIds],
  );

  const pagination = paymentsResponse?.pagination;
  const totalItems = pagination?.total ?? payments.length;
  const totalPages = pagination?.totalPage || Math.ceil(totalItems / itemsPerPage) || 1;

  const exportLedger = async () => {
    const today = new Date().toISOString().split('T')[0];
    const range = startDate || endDate
      ? `${startDate || 'start'}_to_${endDate || 'end'}`
      : today;
    const filename = `LOGISS_Transactions_${range}.xlsx`;

    try {
      const result = await triggerExport(filterParams).unwrap();

      if (result && typeof result === 'string') {
        const clean = result.trim();
        let wb: XLSX.WorkBook | null = null;

        try {
          if (clean.startsWith('UEsDB') || clean.startsWith('PK')) {
            wb = XLSX.read(clean, { type: 'base64' });
          } else if (clean.includes(',') || clean.includes('\n')) {
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
      // Fall back to exporting the rows currently loaded.
    }

    if (payments.length === 0) {
      toast.error('No transactions to export.');
      return;
    }
    exportToExcel(payments, filename);
    toast.success('Payment export downloaded as Excel successfully.');
  };

  const handleRefund = () => {
    if (showRefundModal) {
      const id = showRefundModal.id;
      setRefundedIds((prev) => new Set(prev).add(id));
    }
    setShowRefundModal(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="type-page-title">Transactions</h1>
          <p className="text-xs text-ink-3 font-semibold mt-1">
            Payment transactions data and status tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Can role={role} perm="/finance">
            <Button variant="outline" size="sm" icon={Download} onClick={exportLedger} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </Can>
        </div>
      </div>

      <TransactionsTable
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        filter={filter}
        setFilter={(value) => {
          setFilter(value);
          setCurrentPage(1);
        }}
        payments={payments}
        loading={isFetching}
        error={isError ? apiErrorMessage(error, 'Unable to fetch payments') : null}
        onRetry={refetch}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
        onRefundClick={(item) => setShowRefundModal(item)}
        onExportClick={(item) => {
          exportToExcel([item], `LOGISS_${item.shortId}_${new Date().toISOString().split('T')[0]}.xlsx`);
        }}
      />

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
