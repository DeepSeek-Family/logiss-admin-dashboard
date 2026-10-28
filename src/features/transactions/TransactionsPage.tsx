import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  TransactionsTable,
  mapApiPayment,
} from '@/features/transactions';
import { Can } from '@/features/userAccess';
import { useGetPaymentsQuery, useExportPaymentsMutation } from '@/redux/api/transitionApi';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';
import { ExportFormatMenu } from '@/shared/components/ui';
import { parseExportErrorMessage, type FileExportType } from '@/utils/fileExportDownload';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export const Transactions = ({ role }: { role?: string | null }) => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(searchParams.get('searchTerm') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const startDate = fromParam && YMD.test(fromParam) ? fromParam : '';
  const endDate = toParam && YMD.test(toParam) ? toParam : '';

  const listFilterParams = useMemo(
    () => ({
      searchTerm: search.trim() || undefined,
      paymentStatus: filter !== 'all' ? filter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [search, filter, startDate, endDate],
  );

  const { data: paymentsResponse, isFetching, isError, error, refetch } = useGetPaymentsQuery(
    { ...listFilterParams, page: currentPage, limit: itemsPerPage },
    { refetchOnMountOrArgChange: true },
  );

  const [exportPayments] = useExportPaymentsMutation();
  const [exportingType, setExportingType] = useState<FileExportType | null>(null);

  const payments = useMemo(
    () => (paymentsResponse?.data || []).map(mapApiPayment),
    [paymentsResponse],
  );

  const pagination = paymentsResponse?.pagination;
  const totalItems = pagination?.total ?? payments.length;
  const totalPages = pagination?.totalPage || Math.ceil(totalItems / itemsPerPage) || 1;

  const handleExport = async (type: FileExportType) => {
    setExportingType(type);
    try {
      await exportPayments({ ...listFilterParams, type }).unwrap();
      toast.success(`Payments exported as ${type.toUpperCase()}`);
    } catch (e: unknown) {
      const err = e as FetchBaseQueryError
      if (err && typeof err === 'object' && 'status' in err) {
        toast.error(await parseExportErrorMessage(err))
      } else {
        toast.error(apiErrorMessage(e, 'Failed to export payments'))
      }
    } finally {
      setExportingType(null);
    }
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
            <ExportFormatMenu exportingType={exportingType} onExport={handleExport} />
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
      />
    </div>
  );
};

export default Transactions;
