import { useState, useMemo } from 'react';
import { Download, Clock, RotateCcw, Loader2, DollarSign, Receipt, Landmark } from 'lucide-react';
import { Button, StatCard, Card } from '@/shared/components/ui';
import { useTrips } from '@/hooks/useTrips';
import { money } from '@/utils/helpers';

import {
  FundingAllocation,
  RefundModal,
  TransactionsTable
} from '@/features/transactions';
import { FundingSourcesPanel } from '@/features/cms/components/FundingSourcesPanel';
import { Can } from '@/features/userAccess';

const Transactions = ({ role }: { role?: string | null }) => {
  const { trips, loading } = useTrips();
  const [activeTab, setActiveTab] = useState<'invoices' | 'funding_sources'>('invoices');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showRefundModal, setShowRefundModal] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Generate transactions based on trips
  const transactions = useMemo(() => {
    return (trips || []).map((t: any) => {
      const copay = t.copay || 0;
      const countyShare = t.costToCounty != null ? t.costToCounty : (t.cost || 0);
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
        authId: t.authorizationId || t.authId || '',
      };
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trips]);

  const filteredData = transactions.filter((t: any) => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.tripId.toLowerCase().includes(search.toLowerCase()) ||
      t.rider.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'all' ? true : t.status === filter;
    const day = t.date ? new Date(t.date) : null;
    const matchesStart = !startDate || (day && day >= new Date(startDate + 'T00:00:00'));
    const matchesEnd = !endDate || (day && day <= new Date(endDate + 'T23:59:59'));
    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  });

  // Calculate totals (respect date range / search / status)
  const totalRevenue = filteredData.filter((t: any) => t.status === 'paid').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalRefunds = filteredData.filter((t: any) => t.status === 'refunded').reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalPending = filteredData.filter((t: any) => t.status === 'pending').reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const copayTotal = filteredData.filter((t: any) => t.status === 'paid').reduce((acc: number, curr: any) => acc + curr.copay, 0);
  const countyTotal = filteredData.filter((t: any) => t.status === 'paid').reduce((acc: number, curr: any) => acc + curr.countyShare, 0);

  // Per funding-source roll-up for invoicing / reconciliation.
  const bySource = useMemo(() => {
    const m: Record<string, any> = {};
    filteredData.forEach((t: any) => {
      const s = t.fundingSource || 'Self-Pay';
      if (!m[s]) m[s] = { source: s, count: 0, billed: 0, copay: 0, county: 0, paid: 0, pending: 0 };
      m[s].count++;
      m[s].billed += t.amount;
      m[s].copay += t.copay;
      m[s].county += t.countyShare;
      if (t.status === 'paid') m[s].paid += t.amount;
      if (t.status === 'pending') m[s].pending += t.amount;
    });
    return Object.values(m).sort((a: any, b: any) => b.billed - a.billed);
  }, [filteredData]);

  const downloadCSV = (filename: string, lines: string[]) => {
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rowsToCsv = (rows: any[]) => {
    const headers = ['Invoice #', 'Trip ID', 'Date', 'Rider', 'Funding Source', 'Auth ID', 'County Cost', 'Customer Fare', 'Cost to County', 'Status', 'Method'];
    const body = rows.map((t: any) => [
      t.id, t.tripId,
      new Date(t.date).toLocaleDateString(),
      `"${t.rider?.name || 'Unknown'}"`,
      `"${t.fundingSource}"`,
      `"${t.authId || 'N/A'}"`,
      (t.amount || 0).toFixed(2),
      (t.copay || 0).toFixed(2),
      (t.countyShare || 0).toFixed(2),
      t.status, `"${t.method}"`,
    ].join(','));
    return [headers.join(','), ...body];
  };

  // Per-source invoice: trips for one funding source + a totals footer.
  const generateInvoice = (source: string) => {
    const rows = filteredData.filter((t: any) => (t.fundingSource || 'Self-Pay') === source);
    if (rows.length === 0) return;
    const billed = rows.reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const copay = rows.reduce((s: number, t: any) => s + (t.copay || 0), 0);
    const county = rows.reduce((s: number, t: any) => s + (t.countyShare || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const lines = [
      `Invoice — ${source}`,
      `Generated,${today}`,
      `Trips,${rows.length}`,
      '',
      ...rowsToCsv(rows),
      '',
      `TOTALS,,,,,,${billed.toFixed(2)},${copay.toFixed(2)},${county.toFixed(2)}`,
    ];
    downloadCSV(`Invoice_${source.replace(/[^a-z0-9]+/gi, '-')}_${today}.csv`, lines);
  };

  // Full ledger export (respects the current search/status filter).
  const exportLedger = () => {
    if (filteredData.length === 0) return;
    downloadCSV(`LOGISS_Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`, rowsToCsv(filteredData));
  };

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
          <p className="text-sm text-ink-4">Compiling Finance Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="type-page-title">Finance & Billing</h1>
          <p className="text-sm text-ink-4 mt-0.5">Comprehensive overview of revenue collections, county claims, and funding sources</p>
        </div>

        {activeTab === 'invoices' && (
          <Can role={role} perm="finance.export">
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border border-line-2 rounded-xl py-2 px-2.5 text-xs font-medium text-ink outline-none h-9 cursor-pointer shadow-sm" title="Start date" />
              <span className="text-xs text-ink-4">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border border-line-2 rounded-xl py-2 px-2.5 text-xs font-medium text-ink outline-none h-9 cursor-pointer shadow-sm" title="End date" />
              <Button variant="outline" size="sm" icon={Download} onClick={exportLedger}>Export CSV</Button>
            </div>
          </Can>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-line-2 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'invoices'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-ink-3 hover:text-ink hover:bg-bg border border-line-2'
          }`}
        >
          <Receipt size={14} />
          <span>Invoices & Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('funding_sources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'funding_sources'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-ink-3 hover:text-ink hover:bg-bg border border-line-2'
          }`}
        >
          <Landmark size={14} />
          <span>Funding Sources</span>
        </button>
      </div>

      {/* Tab 1: INVOICES & LEDGER */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in duration-300">
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

          {/* Invoices by Funding Source — per-source reconciliation & invoice export */}
          <div className="bg-white border border-line-2 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line-2">
              <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-ink">Invoices by Funding Source</h3>
              </div>
              <span className="text-xs text-ink-4">{bySource.length} sources</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg/50 border-b border-line-2">
                  <tr>
                    {['Funding Source', 'Trips', 'Total Billed', 'Copay', 'Cost to County', 'Paid', 'Pending', ''].map((h, i) => (
                      <th key={h || i} className={`px-5 py-3 type-th whitespace-nowrap ${i >= 2 && i <= 6 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {bySource.map((s: any) => (
                    <tr key={s.source} className="hover:bg-bg/40 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-semibold text-ink whitespace-nowrap">{s.source}</td>
                      <td className="px-5 py-3.5 text-xs text-ink-3 whitespace-nowrap">{s.count}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-ink text-right whitespace-nowrap">{money(s.billed)}</td>
                      <td className="px-5 py-3.5 text-xs text-ink-3 text-right whitespace-nowrap">{money(s.copay)}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-primary text-right whitespace-nowrap">{money(s.county)}</td>
                      <td className="px-5 py-3.5 text-xs text-accent font-semibold text-right whitespace-nowrap">{money(s.paid)}</td>
                      <td className="px-5 py-3.5 text-xs text-warning font-semibold text-right whitespace-nowrap">{money(s.pending)}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => generateInvoice(s.source)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Download Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Transactions Ledger */}
          <TransactionsTable
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            filteredData={filteredData}
            onRefundClick={(item: any) => setShowRefundModal(item)}
          />
        </div>
      )}

      {/* Tab 2: FUNDING SOURCES MANAGEMENT */}
      {activeTab === 'funding_sources' && (
        <div className="animate-in fade-in duration-300">
          <Card className="p-6">
            <FundingSourcesPanel />
          </Card>
        </div>
      )}

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
