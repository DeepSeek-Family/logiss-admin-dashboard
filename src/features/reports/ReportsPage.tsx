import { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Flag, ShieldCheck, ShieldAlert, Plus, Search } from 'lucide-react';
import { Card, Badge, Button } from '@/shared/components/ui';
import { useReports } from '@/hooks/useReports';

import {
  CreateReportModal,
  CancelTripModal,
  ReportCard,
  DetailPanel
} from '@/features/reports';

const Reports = ({ role }: { role?: string | null }) => {
  const { reports = [], loading, error } = useReports();
  const [activeTab, setActiveTab] = useState('open');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-urgent-light rounded-full flex items-center justify-center text-urgent mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-semibold text-ink">Connection Issue</h3>
        <p className="text-ink-3 max-w-xs mt-2 mb-6">We encountered an error while fetching the incident reports. Please try refreshing the page.</p>
        <Button variant="primary" onClick={() => window.location.reload()}>Refresh Dashboard</Button>
      </div>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="space-y-2">
          <div className="w-56 h-8 bg-line-2 rounded-xl animate-pulse" />
          <div className="w-72 h-4 bg-line-2 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-bg rounded-2xl animate-pulse border border-line-2" />)}
        </div>
        <div className="h-[520px] bg-bg rounded-2xl animate-pulse border border-line-2" />
      </div>
    );
  }

  const openCount = (reports || []).filter(r => r?.status === 'open').length;
  const reviewCount = (reports || []).filter(r => r?.status === 'reviewing').length;
  const resolvedCount = (reports || []).filter(r => r?.status === 'resolved').length;

  const filteredReports = (reports || []).filter(r => {
    if (!r) return false;
    const matchesTab = activeTab === 'all' ? true : r.status === activeTab;
    const matchesSource = filterType === 'all' ? true : (r.filedBy?.role || '').toLowerCase() === filterType;
    const searchLower = (search || '').trim().toLowerCase();
    const matchesSearch = searchLower === '' ? true
      : (r.type || '').toLowerCase().includes(searchLower)
      || (r.filedBy?.name || '').toLowerCase().includes(searchLower)
      || (r.subject?.name || '').toLowerCase().includes(searchLower)
      || String(r.id || '').includes(searchLower);
    return matchesTab && matchesSource && matchesSearch;
  });

  const selectedReport = selectedReportId
    ? (reports || []).find(r => r?.id === selectedReportId)
    : filteredReports[0] ?? null;

  const TABS = [
    { id: 'open', label: 'Open', count: openCount, dot: openCount > 0 },
    { id: 'reviewing', label: 'Reviewing', count: reviewCount, dot: false },
    { id: 'resolved', label: 'Resolved', count: resolvedCount, dot: false },
    { id: 'all', label: 'All Reports', count: (reports || []).length, dot: false },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => setShowCreateModal(false)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title">Incident Reports</h1>
          <p className="text-sm text-ink-4 mt-0.5">Monitor and resolve safety alerts and operational reports</p>
        </div>
        <Button variant="danger" icon={Plus} onClick={() => setShowCreateModal(true)}>
          File Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: openCount, sub: 'needs action', icon: AlertTriangle, color: 'bg-urgent-light text-urgent', highlight: openCount > 0 },
          { label: 'Under Review', value: reviewCount, sub: 'being investigated', icon: Clock, color: 'bg-warning-light text-warning', highlight: false },
          { label: 'Resolved', value: resolvedCount, sub: 'cases closed', icon: CheckCircle2, color: 'bg-accent-light text-accent', highlight: false },
          { label: 'Total Reports', value: (reports || []).length, sub: 'all time', icon: Flag, color: 'bg-primary-light text-primary', highlight: false },
        ].map(s => (
          <Card key={s.label} className={`p-5 flex items-center gap-4 ${s.highlight ? 'ring-2 ring-urgent/20' : ''}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="type-th leading-none">{s.label}</p>
              <p className="text-3xl font-semibold text-ink mt-1 leading-none">{s.value}</p>
              <p className="text-xs text-ink-4 mt-1">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Panel */}
      <Card className="overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2/50 bg-bg/20 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-bg/60 p-0.5 rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedReportId(null); }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
                    : 'text-ink-4 hover:text-ink'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-line-2/60 text-ink-4'
                    }`}>
                    {tab.count}
                  </span>
                )}
                {tab.dot && activeTab !== tab.id && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-urgent animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Source Filter */}
            <div className="flex bg-bg/60 p-0.5 rounded-xl">
              {['all', 'rider', 'driver'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all capitalize ${filterType === type ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary' : 'text-ink-4 hover:text-ink'
                    }`}
                >
                  {type === 'all' ? 'All' : `${type}s`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={13} />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedReportId(null); }}
                className="pl-8 pr-3 py-1.5 bg-bg/60 focus:bg-white rounded-xl text-xs font-medium focus:ring-4 focus:ring-primary/10 outline-none w-44 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Split Panel Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Report List */}
          <div className="w-[300px] shrink-0 border-r border-line-2/40 overflow-y-auto p-3 space-y-1.5 bg-bg/10">
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
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-8 py-16">
                <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck size={28} className="text-ink-4" />
                </div>
                <p className="text-sm font-medium text-ink-4">No incidents found</p>
                <p className="text-xs text-ink-4 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Right — Detail View */}
          <div className="flex-1 overflow-hidden bg-white">
            {selectedReport ? (
              <DetailPanel
                report={selectedReport}
                onResolve={() => setActiveTab('resolved')}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-bg/5">
                <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center mb-4">
                  <ShieldAlert size={32} className="text-ink-4" />
                </div>
                <p className="text-sm font-medium text-ink-4">Select an incident to investigate</p>
                <p className="text-xs text-ink-4 mt-1">Choose a report from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
export { CreateReportModal, CancelTripModal };
