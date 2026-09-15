import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Plus, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useReports } from '@/hooks/useReports';

import {
  CreateReportModal,
  CancelTripModal,
  ReportCard,
  DetailPanel
} from '@/features/reports';

const Reports = ({ role }: { role?: string | null }) => {
  const { reports = [], loading, error, updateReportStatus } = useReports();
  const [activeTab, setActiveTab] = useState('open');
  const [filterPeople, setFilterPeople] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-urgent/10 rounded-full flex items-center justify-center text-urgent mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-semibold text-ink">Connection Issue</h3>
        <p className="text-ink-4 max-w-xs mt-2 mb-6 text-sm">Failed to load incident reports. Please try refreshing.</p>
        <Button variant="primary" onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        <div className="w-56 h-8 bg-line-2 rounded-xl animate-pulse" />
        <div className="h-[600px] bg-bg rounded-2xl animate-pulse border border-line-2" />
      </div>
    );
  }

  const openCount     = (reports || []).filter(r => r?.status === 'open').length;
  const reviewCount   = (reports || []).filter(r => r?.status === 'reviewing').length;
  const resolvedCount = (reports || []).filter(r => r?.status === 'resolved').length;

  const TABS = [
    { id: 'open',      label: 'Open',        count: openCount     },
    { id: 'reviewing', label: 'Under review', count: reviewCount   },
    { id: 'resolved',  label: 'Resolved',    count: resolvedCount },
    { id: 'all',       label: 'All reports', count: (reports || []).length },
  ];

  const filteredReports = (reports || []).filter(r => {
    if (!r) return false;
    const matchTab    = activeTab === 'all' ? true : r.status === activeTab;
    const matchPeople = filterPeople === 'all' ? true : (r.filedBy?.role || '').toLowerCase() === filterPeople;
    const matchPrio   = filterPriority === 'all' ? true : r.severity === filterPriority;
    const q           = (search || '').trim().toLowerCase();
    const matchSearch = !q ? true
      : (r.type || '').toLowerCase().includes(q)
      || (r.filedBy?.name || '').toLowerCase().includes(q)
      || (r.subject?.name || '').toLowerCase().includes(q)
      || String(r.id || '').includes(q);
    return matchTab && matchPeople && matchPrio && matchSearch;
  });

  const selectedReport = selectedReportId
    ? (reports || []).find(r => r?.id === selectedReportId)
    : filteredReports[0] ?? null;

  return (
    <div className="flex flex-col gap-0 animate-in fade-in duration-300 pb-12">
      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => setShowCreateModal(false)}
        />
      )}

      {/* ── PAGE HEADER ────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="type-page-title">Incident Reports</h1>
          <p className="text-sm text-ink-4 mt-0.5">Review safety and operational reports</p>
        </div>
        <Button variant="outline" icon={Plus} onClick={() => setShowCreateModal(true)} className="h-9 text-sm">
          File report
        </Button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 duration-300 text-sm font-medium">
          {toast}
        </div>
      )}

      {/* ── MAIN CARD ────────────────────── */}
      <div className="bg-white border border-line-2 rounded-2xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>

        {/* Tabs row */}
        <div className="flex items-center justify-between px-5 border-b border-line-2">
          {/* Underline tabs */}
          <div className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedReportId(null); }}
                className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-4 hover:text-ink'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-bg text-ink-4'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Split panel body */}
        <div className="flex overflow-hidden" style={{ height: 'calc(100% - 49px)' }}>

          {/* ── LEFT LIST ─────────────────── */}
          <div className="w-[300px] shrink-0 border-r border-line-2 flex flex-col overflow-hidden">
            {/* Search + filters toolbar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line-2">
              <div className="flex-1 flex items-center gap-1.5 bg-bg border border-line-2 rounded-lg px-2.5 py-1.5">
                <Search size={12} className="text-ink-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedReportId(null); }}
                  className="bg-transparent text-xs outline-none w-full text-ink placeholder:text-ink-4"
                />
              </div>
              {/* People filter */}
              <div className="relative">
                <select
                  value={filterPeople}
                  onChange={e => setFilterPeople(e.target.value)}
                  className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-medium bg-bg border border-line-2 rounded-lg text-ink-3 outline-none cursor-pointer"
                >
                  <option value="all">All people</option>
                  <option value="rider">Riders</option>
                  <option value="driver">Drivers</option>
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
              </div>
              {/* Priority filter */}
              <div className="relative">
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-medium bg-bg border border-line-2 rounded-lg text-ink-3 outline-none cursor-pointer"
                >
                  <option value="all">Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
              </div>
            </div>

            {/* Report list */}
            <div className="flex-1 overflow-y-auto">
              {filteredReports.length > 0 ? (
                filteredReports.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    selected={selectedReport?.id === report.id}
                    onClick={() => setSelectedReportId(report.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <div className="w-12 h-12 bg-bg rounded-xl flex items-center justify-center mb-3">
                    <ShieldCheck size={22} className="text-ink-4" />
                  </div>
                  <p className="text-sm font-medium text-ink-4">No incidents found</p>
                  <p className="text-xs text-ink-4 mt-1">Try adjusting filters</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT DETAIL ──────────────── */}
          <div className="flex-1 overflow-hidden bg-white">
            {selectedReport ? (
              <DetailPanel
                report={selectedReport}
                onResolve={() => {
                  updateReportStatus(selectedReport.id, 'resolved');
                  showToast(`Incident #${selectedReport.id} resolved`);
                }}
                onMarkReview={() => {
                  updateReportStatus(selectedReport.id, 'reviewing');
                  showToast(`Incident #${selectedReport.id} marked under review`);
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center mb-4">
                  <ShieldAlert size={28} className="text-ink-4" />
                </div>
                <p className="text-sm font-medium text-ink-4">Select an incident to investigate</p>
                <p className="text-xs text-ink-4 mt-1">Choose a report from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
export { CreateReportModal, CancelTripModal };
