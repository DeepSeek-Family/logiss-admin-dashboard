import { useState, useMemo } from 'react';
import { Download, Clock, RotateCcw, Loader2, DollarSign } from 'lucide-react';
import { Button, StatCard } from '@/shared/components/ui';
import { useTrips } from '../hooks/useTrips';
import { money } from '../utils/helpers';

import {
  FundingAllocation,
  RefundModal,
  TransactionsTable
} from '@/features/transactions';

const Transactions = ({ role }: { role?: string | null }) => {
  const { trips, loading } = useTrips();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showRefundModal, setShowRefundModal] = useState<any>(null);

  // Generate transactions based on trips
  const transactions = useMemo(() => {
    return (trips || []).map((t: any) => {
      const copay = t.copay || 0;
      const countyShare = t.costToCounty || (t.cost ? t.cost - copay : 0);
      return {
        id: `TXN-${t.id.split('-')[1] || t.id.slice(-4)}`,
        tripId: t.id,
        date: t.scheduledTime,
        rider: t.rider,
        amount: t.cost || 0,
        copay,
        countyShare,
        status: t.paymentStatus === 'charged' || t.paymentStatus === 'Paid' || t.paymentStatus === 'Approved' ? 'paid' : t.paymentStatus === 'refunded' ? 'refunded' : 'pending',
        method: t.paymentMethod || 'Insurance'
      };
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trips]);

  const filteredData = transactions.filter((t: any) => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.tripId.toLowerCase().includes(search.toLowerCase()) ||
      t.rider.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'all' ? true : t.status === filter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalRevenue = transactions.filter((t: any) => t.status === 'paid').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalRefunds = transactions.filter((t: any) => t.status === 'refunded').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalPending = transactions.filter((t: any) => t.status === 'pending').reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const copayTotal = transactions.filter((t: any) => t.status === 'paid').reduce((acc: number, curr: any) => acc + curr.copay, 0);
  const countyTotal = transactions.filter((t: any) => t.status === 'paid').reduce((acc: number, curr: any) => acc + curr.countyShare, 0);

  const handleRefund = () => {
    if (showRefundModal) {
      showRefundModal.status = 'refunded';
    }
    setShowRefundModal(null);
  };

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Compiling Financial Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Financial Transactions</h1>
          <p className="text-sm text-ink-4 mt-0.5">Simple and clean overview of payments, county billing, and claims</p>
        </div>
        <Button variant="outline" size="sm" icon={Download}>Export CSV</Button>
      </div>

      {/* Grid of Key Statistics using Standardized StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Settled Revenue" 
          value={money(totalRevenue)} 
          icon={DollarSign} 
          accent="primary" 
          trend="+12.4%" 
          sub="net collections" 
        />
        <StatCard 
          label="Pending County Claims" 
          value={money(totalPending)} 
          icon={Clock} 
          accent="warning" 
          sub="awaiting review" 
        />
        <StatCard 
          label="Total Refunded" 
          value={money(totalRefunds)} 
          icon={RotateCcw} 
          accent="urgent" 
          sub="returned to source" 
        />
      </div>

      {/* Visual Breakdown of Funding Streams */}
      <FundingAllocation
        countyTotal={countyTotal}
        copayTotal={copayTotal}
        totalRevenue={totalRevenue}
      />

      {/* Main Transactions Ledger */}
      <TransactionsTable
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        filteredData={filteredData}
        onRefundClick={setShowRefundModal}
      />

      {/* Refund Confirmation Modal */}
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
