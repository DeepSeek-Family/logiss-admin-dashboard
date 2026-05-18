import { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Clock, ChevronRight, MessageSquare,
  Phone, CheckCircle2, Flag, ArrowRight, ShieldCheck, AlertOctagon,
  MoreVertical, Ban, Slash, Navigation, X, Loader2, Search, Plus
} from 'lucide-react';
import { Card, Avatar, Badge, Button } from '@/shared/components/ui';
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
                <p className="text-sm font-medium text-ink">{r.label}</p>
                <p className="text-xs font-medium text-ink-3 leading-tight mt-0.5">{r.sub}</p>
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
                <p className="text-sm font-medium text-ink">{r.label}</p>
                <p className="text-xs font-medium text-ink-3 leading-tight mt-0.5">{r.sub}</p>
              </div>
              <input type="radio" className="hidden" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
            </label>
          ))}
        </div>
        <div className="p-6 bg-bg/50 border-t border-line-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Free cancellation window active</span>
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
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        selected
          ? 'border-primary/40 bg-primary/5 shadow-sm'
          : 'border-line-2 bg-white hover:border-line hover:bg-bg/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink line-clamp-1 flex-1 mr-2">{report.type}</p>
        <Badge variant={sev.badge} className="text-[10px] px-1.5 py-0 shrink-0">{sev.label}</Badge>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <SevIcon size={11} className={sev.iconClass} />
          <span className="font-mono text-[10px] text-ink-4">{report.id}</span>
        </div>
        <span className="text-[10px] text-ink-4">{timeAgo(report?.submitted)}</span>
      </div>
    </button>
  );
};

// --- WARNING MODAL ---
const SendWarningModal = ({ name, onClose }: { name: string; onClose: () => void }) => {
  const [msg, setMsg] = useState(
    `Dear ${name},\n\nThis is an official warning regarding a recent incident report filed against you. Please review the incident details and ensure compliance with our service guidelines.\n\nFurther violations may result in account suspension.\n\n— Logiss Operations Team`
  );
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-line-2 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-warning-light rounded-xl flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink">Send Warning Notice</h3>
              <p className="text-xs text-ink-4">To: {name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-bg rounded-lg text-ink-4 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">
          <textarea
            rows={8}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink font-medium resize-none outline-none focus:border-warning/50 focus:ring-1 focus:ring-warning/20 transition-all leading-relaxed"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line-2 bg-bg/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" icon={AlertTriangle} className="border-warning/20 text-warning hover:bg-warning-light" onClick={onClose}>
            Send Warning
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- DETAIL PANEL ---

const DetailPanel = ({ report, onResolve }: { report: any; onResolve: () => void }) => {
  const sev = SEVERITY[report.severity as keyof typeof SEVERITY] || SEVERITY.low;
  const SevIcon = sev.icon;
  const [warningTarget, setWarningTarget] = useState<string | null>(null);

  const statusVariant: { [key: string]: string } = {
    open: 'urgent',
    reviewing: 'warning',
    resolved: 'accent',
  };
  const variant = statusVariant[report.status] || 'neutral';

  return (
    <div className="h-full flex flex-col">
      {warningTarget && <SendWarningModal name={warningTarget} onClose={() => setWarningTarget(null)} />}

      {/* Detail Header */}
      <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between bg-bg/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sev.bg}`}>
            <SevIcon size={20} className={sev.iconClass} />
          </div>
          <div>
            <h2 className="text-base font-extrabold font-display text-ink leading-tight">{report.type}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-medium text-ink-3 uppercase">#{report.id}</span>
              <span className="w-1 h-1 bg-line rounded-full" />
              <Badge variant={variant}>{report.status}</Badge>
              {report.severity === 'high' && (
                <>
                  <span className="w-1 h-1 bg-line rounded-full" />
                  <Badge variant="urgent" className="text-[10px] uppercase font-black tracking-wider animate-pulse flex items-center gap-1">
                    <AlertTriangle size={10} /> Safety Alert
                  </Badge>
                </>
              )}
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
          <div className="flex items-center gap-2 px-3 py-2 bg-urgent-light/40 rounded-xl border border-urgent/10 text-urgent text-[11px] font-bold">
            <AlertTriangle size={13} className="shrink-0 animate-pulse" />
            <span>Urgent: Safety violation flagged — immediate dispatch follow-up required.</span>
          </div>
        )}

        {/* Filer vs Subject */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { data: report.filedBy, label: 'Filed by', badge: <Badge variant="neutral" className="text-[10px]">Filer</Badge> },
            { data: report.subject, label: 'Subject', badge: <Badge variant="urgent" className="text-[10px]">Subject</Badge> },
          ].map(({ data, label, badge }) => (
            <div key={label} className="bg-bg/60 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar initials={data?.name?.[0] || '?'} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-medium text-ink truncate">{data?.name || 'Unknown'}</p>
                    {badge}
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{data?.role || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setWarningTarget(data?.name || 'User')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-warning/20 bg-warning-light hover:bg-warning hover:text-white text-warning text-xs font-medium transition-all shrink-0 whitespace-nowrap"
                title="Send Warning"
              >
                <AlertTriangle size={12} />
                Send Warning
              </button>
            </div>
          ))}
        </div>

        {/* Statement */}
        <div>
          <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
            <MessageSquare size={12} /> Statement of Incident
          </h4>
          <div className="bg-bg/40 rounded-2xl p-5 relative">
            <span className="absolute -top-3 left-5 text-xl text-ink-4 font-serif">"</span>
            <p className="text-sm font-medium text-ink-2 leading-relaxed italic">{report.description}</p>
          </div>
        </div>

        {/* Associated Trip */}
        <div>
          <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
            <Flag size={12} /> Associated Record
          </h4>
          <div className="bg-bg/60 rounded-xl p-4 flex items-center justify-between group hover:bg-primary-tint/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                <Navigation size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink font-mono uppercase tracking-normal">Trip #{report.tripId}</p>
                <p className="text-xs text-ink-3 font-medium mt-0.5">Submitted {formatDateTime(report.submitted)}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-white border-t border-line-2 flex items-center justify-end gap-2 shrink-0">
        <Button variant="outline" icon={X} className="text-ink-3 hover:text-ink" onClick={onResolve}>
          Dismiss
        </Button>
        <Button variant="primary" icon={CheckCircle2} className="shadow-sm shadow-primary/20" onClick={onResolve}>
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
          <h1 className="text-3xl font-bold font-display text-ink tracking-normal">Incident Reports</h1>
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
          <Card key={s.label} className={`p-5 flex items-center gap-4 ${s.highlight ? 'ring-2 ring-urgent/20' : ''}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] leading-none">{s.label}</p>
              <p className="text-3xl font-extrabold text-ink mt-1 leading-none">{s.value}</p>
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
                    : 'text-ink-3 hover:text-ink'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-black ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-line-2/60 text-ink-4'
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
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all capitalize ${filterType === type ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary' : 'text-ink-3 hover:text-ink'
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
                <p className="text-sm font-medium text-ink-3">No incidents found</p>
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
                <p className="text-sm font-medium text-ink-3">Select an incident to investigate</p>
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
