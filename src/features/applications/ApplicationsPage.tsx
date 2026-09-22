import { useState, useCallback, useMemo } from 'react';

import { Loader2, CheckCircle2, X, MessageSquare, Info, AlertTriangle } from 'lucide-react';

import { Pagination } from '@/shared/components/ui';

import { ApplicationCard, ApplicationDetails } from '@/features/applications';

import {

  useGetDriverApplicationsQuery,

  useUpdateApplicationStatusMutation,

} from '@/redux/api/driversApi';

import { mapApiDriverApplication, type ApplicationUiStatus, type MappedDriverApplication } from '@/features/applications/utils/helpers';

import { apiErrorMessage } from '@/features/bookings/utils/helpers';



type DocStatus = 'uploaded' | 'verified' | 'rejected';

type DocStatuses = Record<string, Record<string, DocStatus>>;



const INITIAL_DOCS = [

  { id: 'dl',   label: 'Driver License Photo',  detail: "Driver's license"    },

  { id: 'ins',  label: 'Insurance Certificate', detail: 'Insurance policy'    },

  { id: 'reg',  label: 'Vehicle Registration',  detail: 'Vehicle registration' },

  { id: 'nemt', label: 'NEMT Certification',    detail: 'NEMT certification'  },

];



const Applications = ({ role }: { role?: string | null }) => {

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const [currentPage, setCurrentPage]     = useState(1);

  const [itemsPerPage, setItemsPerPage]   = useState(10);

  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'info' | 'error' | 'warn' } | null>(null);

  const [docStatuses, setDocStatuses] = useState<DocStatuses>({});

  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, { stage?: number; _status?: ApplicationUiStatus }>>({});



  const listParams = useMemo(() => ({

    page: currentPage,

    limit: itemsPerPage,

  }), [currentPage, itemsPerPage]);



  const { data: appsResponse, isLoading, isError, error, refetch } = useGetDriverApplicationsQuery(listParams, {

    refetchOnMountOrArgChange: true,

  });

  const [updateApplicationStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();



  const applications = useMemo(() => {

    return (appsResponse?.data || []).map((item) => {

      const mapped = mapApiDriverApplication(item);

      const override = localStatusOverrides[mapped.id];

      return override ? { ...mapped, ...override } : mapped;

    });

  }, [appsResponse, localStatusOverrides]);



  const pagination = appsResponse?.pagination;



  const showToast = (msg: string, type: 'success' | 'info' | 'error' | 'warn' = 'success') => {

    setToast({ msg, type });

    setTimeout(() => setToast(null), 3500);

  };



  const defaultDocStatusesForApp = useCallback((app: MappedDriverApplication): Record<string, DocStatus> => {

    const base = Object.fromEntries(INITIAL_DOCS.map(d => [d.id, 'uploaded' as DocStatus]));

    if (app.licenseImage) base.dl = 'verified';

    return base;

  }, []);



  const getDocStatuses = useCallback((appId: string, app?: MappedDriverApplication): Record<string, DocStatus> => {

    if (docStatuses[appId]) return docStatuses[appId];

    if (app) return defaultDocStatusesForApp(app);

    return Object.fromEntries(INITIAL_DOCS.map(d => [d.id, 'uploaded' as DocStatus]));

  }, [docStatuses, defaultDocStatusesForApp]);



  const setOneDocStatus = useCallback((appId: string, docId: string, status: DocStatus, app?: MappedDriverApplication) => {

    setDocStatuses(prev => ({

      ...prev,

      [appId]: { ...getDocStatuses(appId, app), [docId]: status }

    }));

  }, [getDocStatuses]);



  const totalPages = pagination?.totalPage || Math.ceil(applications.length / itemsPerPage) || 1;

  const totalItems = pagination?.total ?? applications.length;



  const selectedApp = selectedAppId

    ? applications.find((a) => a.id === selectedAppId)

    : (applications.length > 0 ? applications[0] : null);



  const stages = [

    { id: 1, label: 'Submitted'        },

    { id: 2, label: 'Under Review'     },

    { id: 3, label: 'Background Check' },

    { id: 4, label: 'Approved'         },

  ];



  const patchStatus = async (app: typeof selectedApp, applicationStatus: string, successMsg: string) => {

    if (!app) return;

    try {

      await updateApplicationStatus({ id: app.id, applicationStatus }).unwrap();

      setLocalStatusOverrides(prev => ({

        ...prev,

        [app.id]: {

          stage: applicationStatus === 'approved' ? 4 : app.stage,

          _status: (applicationStatus === 'approved' ? 'approved' : applicationStatus === 'rejected' ? 'rejected' : app._status) as ApplicationUiStatus,

        },

      }));

      showToast(successMsg, applicationStatus === 'rejected' ? 'error' : 'success');

    } catch (err) {

      showToast(apiErrorMessage(err, 'Failed to update application'), 'error');

    }

  };



  const handleApprove = (app: NonNullable<typeof selectedApp>) => {

    patchStatus(app, 'approved', `${app.name} approved`);

  };



  const handleReject = (app: NonNullable<typeof selectedApp>) => {

    patchStatus(app, 'rejected', `${app.name}'s application rejected`);

  };



  const handleRequestInfo = (app: NonNullable<typeof selectedApp>) => {

    setLocalStatusOverrides(prev => ({

      ...prev,

      [app.id]: { ...prev[app.id], _status: 'info_requested' },

    }));

    showToast(`Info request sent to ${app.name}`, 'info');

  };



  const handleSendToBackgroundCheck = (app: NonNullable<typeof selectedApp>) => {

    setLocalStatusOverrides(prev => ({

      ...prev,

      [app.id]: { stage: 3, _status: 'reviewing' },

    }));

    showToast(`${app.name} sent to Background Check`, 'info');

  };



  if (isLoading && applications.length === 0) {

    return (

      <div className="flex items-center justify-center h-[80vh]">

        <div className="flex flex-col items-center gap-4">

          <Loader2 className="w-10 h-10 text-primary animate-spin" />

          <p className="text-sm text-ink-4">Loading Applications...</p>

        </div>

      </div>

    );

  }



  if (isError) {

    return (

      <div className="flex flex-col items-center justify-center py-20 text-center">

        <AlertTriangle size={48} className="text-urgent mb-4 opacity-50" />

        <h3 className="text-lg font-semibold text-ink mb-2">Failed to load applications</h3>

        <p className="text-ink-3 text-sm mb-4">{apiErrorMessage(error, 'Unable to fetch driver applications')}</p>

        <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">

          Retry

        </button>

      </div>

    );

  }



  const pendingCount = applications.filter((a) => a._status === 'reviewing').length;



  return (

    <div className="flex flex-col gap-6 animate-in fade-in duration-500">

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

        <div className="lg:col-span-5 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-hide">

          {applications.length === 0 ? (

            <div className="py-16 text-center text-sm text-ink-4 border border-dashed border-line-2 rounded-2xl">

              No driver applications found

            </div>

          ) : applications.map((app) => {

            const appDocStatuses = getDocStatuses(app.id, app);

            const verifiedCount = Object.values(appDocStatuses).filter(s => s === 'verified').length;

            return (

              <ApplicationCard

                key={app.id}

                app={app}

                selected={selectedAppId === app.id || (!selectedAppId && applications[0]?.id === app.id)}

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

              totalItems={totalItems}

              itemsPerPage={itemsPerPage}

              onPageChange={setCurrentPage}

              onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}

            />

          </div>

        </div>



        <div className="lg:col-span-7 overflow-y-auto scrollbar-hide">

          {selectedApp ? (

            <ApplicationDetails

              selectedApp={selectedApp}

              stages={stages}

              docStatuses={getDocStatuses(selectedApp.id, selectedApp)}

              onDocStatusChange={(docId, status) => setOneDocStatus(selectedApp.id, docId, status, selectedApp)}

              onApprove={() => handleApprove(selectedApp)}

              onReject={() => handleReject(selectedApp)}

              onRequestInfo={() => handleRequestInfo(selectedApp)}

              onSendToBackgroundCheck={() => handleSendToBackgroundCheck(selectedApp)}

              actionsDisabled={isUpdating}

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

