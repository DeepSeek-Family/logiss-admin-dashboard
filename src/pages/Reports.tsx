import { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Clock, ChevronRight, MessageSquare,
  Phone, CheckCircle2, Flag, ArrowRight, ShieldCheck, AlertOctagon,
  MoreVertical, Ban, Slash, Navigation, X, Loader2, Search, Plus
} from 'lucide-react';
import { Card, Avatar, Badge, Button } from '../components/ui';
import { useReports } from '../hooks/useReports';
import { timeAgo, formatDateTime } from '../utils/helpers';

const CreateReportModal = ({ onClose, onSave }: { onClose: () => void; onSave: (reason: string) => void }) => {
  const [reason, setReason] = useState('Rider not present');
  const reasons = [
    { id: 'Rider not present', label: 'Rider not present', sub: 'Rider is not available at the pickup location.' },
    { id: 'Incorrect pickup location', label: 'Incorrect pickup location', sub: 'Pickup address is missing or cannot be located.' },
    { id: 'Rider behavior issue', label: 'Rider behavior issue', sub: 'Rider behavior caused a problem during the trip.' },
    { id: 'Excessive wait time', label: 'Excessive wait time', sub: 'Rider caused an unusually long wait at pickup.' },
    { id: 'Other reason', label: 'Other reason', sub: "I'll explain to dispatch if needed" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <Card className="relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-line-2">
        <div className="flex items-center justify-between p-6 border-b border-line-2 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-urgent-light rounded-xl flex items-center justify-center border border-urgent/10">
              <AlertOctagon size={20} className="text-urgent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink leading-none">Report Incident</h2>
              <p className="text-xs text-ink-3 mt-1 font-medium">Flag a safety or service issue for internal review.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg text-ink-4 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
          {reasons.map(r => (
            <label key={r.id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${reason === r.id ? 'border-urgent bg-urgent-light/20 shadow-sm' : 'border-line-2 hover:border-line'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${reason === r.id ? 'border-urgent' : 'border-line-2'}`}>
                {reason === r.id && <div className="w-2.5 h-2.5 rounded-full bg-urgent" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{r.label}</p>
                <p className="text-[10px] font-medium text-ink-3 leading-tight mt-0.5">{r.sub}</p>
              </div>
              <input type="radio" className="hidden" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
            </label>
          ))}
        </div>
        <div className="p-6 bg-bg/50 border-t border-line-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => onSave(reason)}>File Report</Button>
        </div>
      </Card>
    </div>
  );
};

const CancelTripModal = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = useState('Rider Request');
  const reasons = [
    { id: 'Rider Request', label: 'Rider Requested Cancellation', sub: 'Rider called to cancel due to personal reasons or schedule change.' },
    { id: 'No Driver', label: 'No Driver Available', sub: 'Could not find a compatible driver for this time/route.' },
    { id: 'Vehicle Issue', label: 'Vehicle / Technical Issue', sub: 'Assigned vehicle breakdown or system-related error.' },
    { id: 'No Show', label: 'Rider No-Show', sub: 'Driver reached pickup point but rider was not present.' },
    { id: 'Admin Error', label: 'Administrative / Duplicate', sub: 'Incorrect data entry or duplicate booking found.' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <Card className="relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-line-2">
        <div className="flex items-center justify-between p-6 border-b border-line-2 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-urgent-light rounded-xl flex items-center justify-center border border-urgent/10">
              <AlertTriangle size={20} className="text-urgent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink leading-none">Cancel Booking</h2>
              <p className="text-xs text-ink-3 mt-1 font-medium">Please select the official reason for this cancellation.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg text-ink-4 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
          {reasons.map(r => (
            <label key={r.id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${reason === r.id ? 'border-urgent bg-urgent-light/20 shadow-sm' : 'border-line-2 hover:border-line'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${reason === r.id ? 'border-urgent' : 'border-line-2'}`}>
                {reason === r.id && <div className="w-2.5 h-2.5 rounded-full bg-urgent" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{r.label}</p>
                <p className="text-[10px] font-medium text-ink-3 leading-tight mt-0.5">{r.sub}</p>
              </div>
              <input type="radio" className="hidden" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
            </label>
          ))}
        </div>
        <div className="p-6 bg-bg/50 border-t border-line-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Free cancellation window active</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Keep Booking</Button>
            <Button variant="danger" onClick={() => onConfirm(reason)}>Confirm Cancellation</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- SEVERITY CONFIG ---

const SEVERITY = {
  high: { icon: AlertOctagon, iconClass: 'text-urgent', badge: 'urgent', bg: 'bg-urgent-light', label: 'High' },
  medium: { icon: AlertTriangle, iconClass: 'text-warning', badge: 'warning', bg: 'bg-warning-light', label: 'Medium' },
  low: { icon: ShieldAlert, iconClass: 'text-ink-4', badge: 'neutral', bg: 'bg-bg', label: 'Low' },
};

// --- REPORT LIST ITEM ---

const ReportCard = ({ report, selected, onClick }: { report: any; selected: boolean; onClick: () => void }) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;
  const SevIcon = sev.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-sm ${selected
          ? 'border-primary bg-primary-tint/10 shadow-sm'
          : 'border-line-2 bg-white hover:border-line'
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <SevIcon size={16} className={sev.iconClass} />
          <span className="font-mono text-[10px] font-bold text-ink-3 uppercase">#{report.id}</span>
        </div>
        <Badge variant={sev.badge}>{sev.label}</Badge>
      </div>

      <p className="text-sm font-bold text-ink mb-3 line-clamp-1">{report.type}</p>

      <div className="flex items-center gap-2.5">
        <div className="flex -space-x-2">
          <Avatar initials={report?.filedBy?.name?.[0] || '?'} size="xs" className="ring-2 ring-white" />
          <div className="w-5 h-5 rounded-full bg-bg flex items-center justify-center ring-2 ring-white">
            <ArrowRight size={8} className="text-ink-4" />
          </div>
          <Avatar initials={report?.subject?.name?.[0] || '?'} size="xs" className="ring-2 ring-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-ink truncate">{report?.filedBy?.name || 'Unknown'}</p>
          <p className="text-[9px] text-ink-3 font-semibold uppercase tracking-wide">vs {report?.subject?.name || 'Unknown'}</p>
        </div>
        <span className="text-[9px] font-bold text-ink-4 whitespace-nowrap shrink-0">{timeAgo(report?.submitted)}</span>
      </div>
    </button>
  );
};

// --- DETAIL PANEL ---

const DetailPanel = ({ report, onResolve }: { report: any; onResolve: () => void }) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;
  const SevIcon = sev.icon;

  const statusVariant: { [key: string]: string } = {
    open: 'urgent',
    reviewing: 'warning',
    resolved: 'accent',
  };
  const variant = statusVariant[report.status] || 'neutral';

  return (
    <div className="h-full flex flex-col">
      {/* Detail Header */}
      <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between bg-bg/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sev.bg}`}>
            <SevIcon size={20} className={sev.iconClass} />
          </div>
          <div>
            <h2 className="text-base font-extrabold font-display text-ink leading-tight">{report.type}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] font-bold text-ink-3 uppercase">#{report.id}</span>
              <span className="w-1 h-1 bg-line rounded-full" />
              <Badge variant={variant}>{report.status}</Badge>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-bg rounded-lg text-ink-4 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Detail Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* High severity alert */}
        {report.severity === 'high' && (
          <div className="bg-urgent-light/60 p-4 rounded-2xl border border-urgent/20 flex items-start gap-3">
            <AlertTriangle className="text-urgent mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-xs font-extrabold text-urgent uppercase tracking-widest mb-1">Immediate Attention Required</p>
              <p className="text-xs font-medium text-urgent/80 leading-relaxed">
                This incident has been flagged for a potential safety violation. Review the details and contact the parties immediately.
              </p>
            </div>
          </div>
        )}

        {/* Filer vs Subject */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { data: report.filedBy, label: 'Claimant (Filer)', badge: <Badge variant="neutral">Filer</Badge> },
            { data: report.subject, label: 'Subject (Accused)', badge: <Badge variant="urgent">Subject</Badge> },
          ].map(({ data, label, badge }) => (
            <div key={label} className="bg-bg rounded-2xl border border-line-2 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest">{label}</p>
                {badge}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Avatar initials={data?.name?.[0] || '?'} size="md" />
                <div>
                  <p className="text-sm font-bold text-ink leading-tight">{data?.name || 'Unknown'}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{data?.role || 'N/A'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Phone} className="flex-1">Call</Button>
                <Button variant="outline" size="sm" icon={MessageSquare} className="flex-1">Chat</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Statement */}
        <div>
          <h4 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageSquare size={12} /> Statement of Incident
          </h4>
          <div className="bg-white rounded-2xl border-2 border-line-2 p-5 shadow-sm relative">
            <span className="absolute -top-3 left-5 bg-white px-2 text-xl text-line font-serif">"</span>
            <p className="text-sm font-medium text-ink-2 leading-relaxed italic">{report.description}</p>
          </div>
        </div>

        {/* Associated Trip */}
        <div>
          <h4 className="text-[10px] font-bold text-ink-4 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Flag size={12} /> Associated Record
          </h4>
          <div className="bg-bg rounded-xl border border-line-2 p-4 flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary border border-line-2">
                <Navigation size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink font-mono uppercase tracking-tighter">Trip #{report.tripId}</p>
                <p className="text-[10px] text-ink-3 font-medium mt-0.5">Submitted {formatDateTime(report.submitted)}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-white border-t border-line-2 flex gap-3 shrink-0">
        <Button variant="outline" icon={Slash} className="flex-1 text-ink-3 hover:text-ink" onClick={onResolve}>
          Dismiss
        </Button>
        <Button variant="outline" icon={AlertTriangle} className="flex-1 border-warning/20 text-warning hover:bg-warning-light">
          Warning
        </Button>
        <Button variant="primary" icon={CheckCircle2} className="flex-1 shadow-sm shadow-primary/20" onClick={onResolve}>
          Resolve
        </Button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

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
        <h3 className="text-xl font-bold text-ink">Connection Issue</h3>
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
          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Incident Reports</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-wide">Monitor and resolve safety alerts and operational reports</p>
        </div>
        <Button variant="danger" icon={Plus} onClick={() => setShowCreateModal(true)}>
          File Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: openCount, sub: 'needs action', icon: AlertOctagon, color: 'bg-urgent-light text-urgent', highlight: openCount > 0 },
          { label: 'Under Review', value: reviewCount, sub: 'being investigated', icon: Clock, color: 'bg-warning-light text-warning', highlight: false },
          { label: 'Resolved', value: resolvedCount, sub: 'cases closed', icon: CheckCircle2, color: 'bg-accent-light text-accent', highlight: false },
          { label: 'Total Reports', value: (reports || []).length, sub: 'all time', icon: Flag, color: 'bg-primary-light text-primary', highlight: false },
        ].map(s => (
          <Card key={s.label} className={`p-5 flex items-center gap-4 ${s.highlight ? 'border-urgent/20' : ''}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-ink-4 uppercase tracking-wider leading-none">{s.label}</p>
              <p className="text-3xl font-extrabold text-ink mt-1 leading-none">{s.value}</p>
              <p className="text-[10px] text-ink-4 mt-1">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Panel */}
      <Card className="overflow-hidden border-line-2 flex flex-col" style={{ minHeight: '520px' }}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-line-2 bg-bg/30 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedReportId(null); }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                    ? 'bg-white shadow-sm text-primary border border-line'
                    : 'text-ink-3 hover:text-ink'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-line-2 text-ink-4'
                    }`}>
                    {tab.count}
                  </span>
                )}
                {tab.dot && activeTab !== tab.id && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-urgent" />
                )}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Source Filter */}
            <div className="flex bg-white border border-line rounded-xl overflow-hidden">
              {['all', 'rider', 'driver'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-[10px] font-bold transition-all capitalize ${filterType === type ? 'bg-primary text-white' : 'text-ink-3 hover:text-ink hover:bg-bg'
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
                className="pl-8 pr-3 py-1.5 bg-white border border-line rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none w-44"
              />
            </div>
          </div>
        </div>

        {/* Split Panel Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Report List */}
          <div className="w-[320px] shrink-0 border-r border-line-2 overflow-y-auto p-4 space-y-2.5 bg-bg/20">
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
                <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center border border-line-2 mb-4">
                  <ShieldCheck size={28} className="text-ink-4" />
                </div>
                <p className="text-sm font-bold text-ink-3">No incidents found</p>
                <p className="text-xs text-ink-4 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Right — Detail View */}
          <div className="flex-1 overflow-hidden">
            {selectedReport ? (
              <DetailPanel
                report={selectedReport}
                onResolve={() => setActiveTab('resolved')}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center border border-line-2 mb-4">
                  <ShieldAlert size={32} className="text-ink-4" />
                </div>
                <p className="text-sm font-bold text-ink-3">Select an incident to investigate</p>
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
