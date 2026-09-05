import { useState, useCallback } from 'react';
import { Loader2, CheckCircle2, X, MessageSquare, Info } from 'lucide-react';
import { Pagination } from '@/shared/components/ui';
import { useApplications } from '@/hooks/useApplications';
import { ApplicationCard, ApplicationDetails } from '@/features/applications';

// Doc status per app, keyed by appId → docId → status
type DocStatus = 'uploaded' | 'verified' | 'rejected';
type DocStatuses = Record<string, Record<string, DocStatus>>;

// App overrides (stage/status changes admin makes locally)
type AppStatus = 'reviewing' | 'info_requested' | 'approved' | 'rejected';
type AppOverrides = Record<string, { stage?: number; status?: AppStatus }>;

const INITIAL_DOCS = [
  { id: 'dl',   label: 'Driver License Photo',  detail: "Driver's license"    },
  { id: 'ins',  label: 'Insurance Certificate', detail: 'Insurance policy'    },
  { id: 'reg',  label: 'Vehicle Registration',  detail: 'Vehicle registration' },
  { id: 'nemt', label: 'NEMT Certification',    detail: 'NEMT certification'  },
];

const Applications = ({ role }: { role?: string | null }) => {
  const { applications, loading } = useApplications();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [itemsPerPage, setItemsPerPage]   = useState(10);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'info' | 'error' | 'warn' } | null>(null);

  // ── Global state for doc verification (persists across app switches) ──
  const [docStatuses, setDocStatuses] = useState<DocStatuses>({});
  // ── Global state for app-level status overrides ──
  const [appOverrides, setAppOverrides] = useState<AppOverrides>({});

  const showToast = (msg: string, type: 'success' | 'info' | 'error' | 'warn' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Get doc statuses for a specific app (default all "uploaded")
  const getDocStatuses = useCallback((appId: string): Record<string, DocStatus> => {
    if (docStatuses[appId]) return docStatuses[appId];
    return Object.fromEntries(INITIAL_DOCS.map(d => [d.id, 'uploaded' as DocStatus]));
  }, [docStatuses]);

  // Set a single doc status
  const setOneDocStatus = useCallback((appId: string, docId: string, status: DocStatus) => {
    setDocStatuses(prev => ({
      ...prev,
      [appId]: { ...getDocStatuses(appId), [docId]: status }
    }));
  }, [getDocStatuses]);

  // Set all doc statuses for an app
  const setAllDocStatuses = useCallback((appId: string, statuses: Record<string, DocStatus>) => {
    setDocStatuses(prev => ({ ...prev, [appId]: statuses }));
  }, []);

  const getAppOverride = (appId: string) => appOverrides[appId] || {};

  const paginatedApplications = (applications || []).slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );
  const totalPages = Math.ceil((applications || []).length / itemsPerPage);

  // Merge app data with overrides
  const mergedApps = paginatedApplications.map((app: any) => {
    const ov = getAppOverride(app.id);
    return { ...app, stage: ov.stage ?? app.stage, _status: ov.status ?? 'reviewing' };
  });

  const selectedApp = selectedAppId
    ? mergedApps.find((a: any) => a.id === selectedAppId)
    : (mergedApps.length > 0 ? mergedApps[0] : null);

  const stages = [
    { id: 1, label: 'Submitted'        },
    { id: 2, label: 'Under Review'     },
    { id: 3, label: 'Background Check' },
    { id: 4, label: 'Approved'         },
  ];

  // ── Action handlers ─────────────────────────────────
  const handleApprove = (app: any) => {
    setAppOverrides(prev => ({
      ...prev,
      [app.id]: { stage: 4, status: 'approved' }
    }));
    showToast(`${app.name} approved — moved to Stage 4`, 'success');
  };

  const handleReject = (app: any) => {
    setAppOverrides(prev => ({
      ...prev,
      [app.id]: { ...getAppOverride(app.id), status: 'rejected' }
    }));
    showToast(`${app.name}'s application rejected`, 'error');
  };

  const handleRequestInfo = (app: any) => {
    setAppOverrides(prev => ({
      ...prev,
      [app.id]: { ...getAppOverride(app.id), status: 'info_requested' }
    }));
    showToast(`Info request sent to ${app.name}`, 'info');
  };

  const handleSendToBackgroundCheck = (app: any) => {
    setAppOverrides(prev => ({
      ...prev,
      [app.id]: { stage: 3, status: 'reviewing' }
    }));
    showToast(`${app.name} sent to Background Check`, 'info');
  };

  if (loading && (!applications || applications.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading Applications...</p>
        </div>
      </div>
    );
  }

  const pendingCount = mergedApps.filter((a: any) => a._status === 'reviewing').length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' ? 'bg-accent' :
          toast.type === 'error'   ? 'bg-urgent' :
          toast.type === 'warn'    ? 'bg-warning' : 'bg-primary'
        }`}>
          {toast.type === 'success' && <CheckCircle2 size={15} />}
          {toast.type === 'info'    && <MessageSquare size={15} />}
          {toast.type === 'error'   && <X size={15} />}
          {toast.type === 'warn'    && <Info size={15} />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="type-page-title">Driver Applications</h1>
        <p className="text-ink-3 font-semibold mt-1 tracking-normal">
          Review and approve new driver onboarding requests
          {pendingCount > 0 && <span className="ml-2 text-warning">· {pendingCount} pending review</span>}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-220px)]">
        {/* Left: App List */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-hide">
          {mergedApps.map((app: any) => {
            const appDocStatuses = getDocStatuses(app.id);
            const verifiedCount = Object.values(appDocStatuses).filter(s => s === 'verified').length;
            return (
              <ApplicationCard
                key={app.id}
                app={app}
                selected={selectedAppId === app.id || (!selectedAppId && mergedApps[0]?.id === app.id)}
                onClick={() => setSelectedAppId(app.id)}
                stages={stages}
                appStatus={app._status}
                docsVerified={verifiedCount}
                docsTotal={INITIAL_DOCS.length}
              />
            );
          })}
          <div className="mt-auto pt-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={(applications || []).length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-7 overflow-y-auto scrollbar-hide">
          {selectedApp ? (
            <ApplicationDetails
              selectedApp={selectedApp}
              stages={stages}
              docStatuses={getDocStatuses(selectedApp.id)}
              onDocStatusChange={(docId, status) => setOneDocStatus(selectedApp.id, docId, status)}
              onApprove={() => handleApprove(selectedApp)}
              onReject={() => handleReject(selectedApp)}
              onRequestInfo={() => handleRequestInfo(selectedApp)}
              onSendToBackgroundCheck={() => handleSendToBackgroundCheck(selectedApp)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-bg/30 rounded-3xl border-2 border-dashed border-line-2">
              <p className="text-ink-4 font-medium">Select an application to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
