import { useMemo, useState } from 'react';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { Pagination, EmptyState, QueryFeedback } from '@/shared/components/ui';
import { FileCheck } from 'lucide-react';
import { ApplicationCard, ApplicationDetails } from '@/features/applications';
import {
  useGetDriverApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from '@/redux/api/driversApi';
import { mapApiDriverApplication, type MappedDriverApplication } from '@/features/applications/utils/helpers';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';

const Applications = ({ role: _role }: { role?: string | null }) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, { status?: string; applicationStatus?: string; isAdminVerifiedDriver?: boolean }>
  >({});

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
  const totalPages = pagination?.totalPage || Math.ceil(applications.length / itemsPerPage) || 1;
  const totalItems = pagination?.total ?? applications.length;

  const selectedApp: MappedDriverApplication | null = selectedAppId
    ? applications.find((a) => a.id === selectedAppId) || applications[0] || null
    : applications[0] || null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const patchStatus = async (app: MappedDriverApplication, applicationStatus: 'approved' | 'rejected', successMsg: string) => {
    const isAdminVerifiedDriver = applicationStatus === 'approved';
    try {
      await updateApplicationStatus({ id: app.id, applicationStatus, isAdminVerifiedDriver }).unwrap();
      setLocalStatusOverrides((prev) => ({
        ...prev,
        [app.id]: {
          status: applicationStatus,
          applicationStatus,
          isAdminVerifiedDriver: isAdminVerifiedDriver,
        },
      }));
      showToast(successMsg, isAdminVerifiedDriver ? 'success' : 'error');
    } catch (err) {
      showToast(apiErrorMessage(err, 'Failed to update application'), 'error');
    }
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

  if (isError && applications.length === 0) {
    return (
      <QueryFeedback
        title="Failed to load applications"
        message={apiErrorMessage(error, 'Unable to fetch driver applications')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-accent' : 'bg-urgent'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="type-page-title">Driver Applications</h1>
        <p className="text-ink-3 font-semibold mt-1 tracking-normal">
          Review and approve new driver onboarding requests
          {totalItems > 0 && <span className="ml-2 text-ink-4">· {totalItems} total</span>}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-220px)]">
        <div className="lg:col-span-5 flex flex-col gap-2.5 overflow-y-auto pr-1 scrollbar-hide">
          {applications.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="No applications"
              description="New driver onboarding requests will appear here for review."
            />
          ) : applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              selected={selectedApp?.id === app.id}
              onClick={() => setSelectedAppId(app.id)}
            />
          ))}
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
              onApprove={() => patchStatus(selectedApp, 'approved', `${selectedApp.name} approved`)}
              onReject={() => patchStatus(selectedApp, 'rejected', `${selectedApp.name}'s application rejected`)}
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
