import { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Download,
  RotateCcw,
  Clock,
  AlertCircle,
  Loader2,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { Card, Badge, Avatar, Button, StatCard } from '../components/ui';
import { useTrips } from '../hooks/useTrips';
import { formatShortDate, money } from '../utils/helpers';

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
          <p className="text-sm font-bold text-ink-3">Compiling Financial Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink tracking-normal">Financial Transactions</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">Simple and clean overview of payments, county billing, and claims</p>
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
      <div className="bg-white border border-line-2 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-black text-ink-4 uppercase tracking-widest mb-4">Funding Stream Allocation</h3>
        
        <div className="space-y-6">
          {/* Stacked Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-bg border border-line-2 shadow-inner">
              {totalRevenue > 0 ? (
                <>
                  <div 
                    className="bg-primary hover:opacity-90 transition-all duration-300 relative"
                    style={{ width: `${(countyTotal / totalRevenue) * 100}%` }}
                    title={`County Claims: ${money(countyTotal)}`}
                  />
                  <div 
                    className="bg-accent hover:opacity-90 transition-all duration-300 relative"
                    style={{ width: `${(copayTotal / totalRevenue) * 100}%` }}
                    title={`Patient Copays: ${money(copayTotal)}`}
                  />
                </>
              ) : (
                <div className="w-full bg-line-2 flex items-center justify-center text-xs text-ink-4">No data available</div>
              )}
            </div>
          </div>

          {/* Simple Legends */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-line">
              <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink">County Claims</p>
                <p className="text-sm font-black text-primary mt-0.5">{money(countyTotal)} <span className="text-xs font-bold text-ink-4">({totalRevenue > 0 ? Math.round((countyTotal / totalRevenue) * 100) : 0}%)</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-line">
              <div className="w-3 h-3 rounded-full bg-accent shrink-0" />
              <div>
                <p className="text-xs font-bold text-ink">Patient Copays</p>
                <p className="text-sm font-black text-accent mt-0.5">{money(copayTotal)} <span className="text-xs font-bold text-ink-4">({totalRevenue > 0 ? Math.round((copayTotal / totalRevenue) * 100) : 0}%)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transactions Ledger */}
      <Card className="overflow-hidden border-line-2 shadow-sm">
        <div className="p-6 border-b border-line-2 bg-bg/30 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" size={20} />
            <input
              type="text"
              placeholder="Search by TXN ID, Trip ID, or Rider..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-line rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-bg p-1 rounded-xl border border-line shadow-inner">
            {['all', 'paid', 'pending', 'refunded'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-primary' : 'text-ink-3 hover:text-ink-2 hover:bg-white/50'}`}
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
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest">Rider</th>
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest">Breakdown</th>
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-ink-4 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {filteredData.map((txn: any) => (
                <tr key={txn.id} className="hover:bg-primary-tint/20 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-ink font-mono">{txn.id}</p>
                    <p className="text-[10px] text-ink-4 font-mono mt-0.5">Ref: {txn.tripId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-ink">{formatShortDate(txn.date)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={txn.rider.initials} size="xs" />
                      <div>
                        <p className="text-xs font-bold text-ink">{txn.rider.name}</p>
                        <p className="text-[10px] text-ink-4 font-bold uppercase tracking-wider mt-0.5">{txn.method}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5 text-[11px] font-medium text-ink-3">
                      <span>Copay: <span className="font-bold text-ink font-mono">{money(txn.copay)}</span></span>
                      <span>County: <span className="font-bold text-ink font-mono">{money(txn.countyShare)}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-ink font-mono">{money(txn.amount)}</p>
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
                        className="text-urgent hover:bg-urgent-light border-urgent/20 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold" 
                        onClick={() => setShowRefundModal(txn)}
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
              <p className="font-bold">No transactions found</p>
              <p className="text-xs">Adjust your search or filter options.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-urgent-light text-urgent rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">Issue Refund?</h3>
            <p className="text-sm text-ink-3 mb-6 leading-relaxed">
              Are you sure you want to refund <span className="font-bold text-ink">{money(showRefundModal.amount)}</span> to <span className="font-bold text-ink">{showRefundModal.rider.name}</span>? This action cannot be undone.
            </p>
            <div className="p-4 bg-bg rounded-xl border border-line-2 mb-6 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ink-4 font-bold">Transaction ID</span>
                <span className="text-ink font-mono font-bold">{showRefundModal.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-4 font-bold">Linked Trip</span>
                <span className="text-ink font-mono font-bold">{showRefundModal.tripId}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRefundModal(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleRefund}>Confirm Refund</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
