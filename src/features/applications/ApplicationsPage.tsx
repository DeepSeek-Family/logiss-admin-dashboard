import { useMemo, useState } from "react";
import { CheckCircle2, FileCheck, X } from "lucide-react";
import { Badge, EmptyState, Pagination, QueryFeedback } from "@/shared/components/ui";
import { ApplicationCard, ApplicationDetails } from "@/features/applications";
import ApplicationsPageSkeleton from "./components/ApplicationsPageSkeleton";
import {
  useGetDriverApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from "@/redux/api/driversApi";
import {
  mapApiDriverApplication,
  type MappedDriverApplication,
} from "@/features/applications/utils/helpers";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";

const Applications = ({ role: _role }: { role?: string | null }) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [localStatusOverrides, setLocalStatusOverrides] = useState<
    Record<string, { status?: string; applicationStatus?: string; isAdminVerifiedDriver?: boolean }>
  >({});

  const listParams = useMemo(
    () => ({ page: currentPage, limit: itemsPerPage }),
    [currentPage, itemsPerPage],
  );

  const {
    data: appsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDriverApplicationsQuery(listParams, { refetchOnMountOrArgChange: true });
  const [updateApplicationStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();

  const applications = useMemo(
    () =>
      (appsResponse?.data || []).map((item) => {
        const mapped = mapApiDriverApplication(item);
        const override = localStatusOverrides[mapped.id];
        return override ? { ...mapped, ...override } : mapped;
      }),
    [appsResponse, localStatusOverrides],
  );

  const pagination = appsResponse?.pagination;
  const totalPages = pagination?.totalPage || Math.ceil(applications.length / itemsPerPage) || 1;
  const totalItems = pagination?.total ?? applications.length;
  const selectedApp: MappedDriverApplication | null = selectedAppId
    ? applications.find((application) => application.id === selectedAppId) || applications[0] || null
    : applications[0] || null;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const patchStatus = async (
    app: MappedDriverApplication,
    applicationStatus: "approved" | "rejected",
    successMsg: string,
  ) => {
    const isAdminVerifiedDriver = applicationStatus === "approved";
    try {
      await updateApplicationStatus({
        id: app.id,
        applicationStatus,
        isAdminVerifiedDriver,
      }).unwrap();
      setLocalStatusOverrides((previous) => ({
        ...previous,
        [app.id]: { status: applicationStatus, applicationStatus, isAdminVerifiedDriver },
      }));
      showToast(successMsg, isAdminVerifiedDriver ? "success" : "error");
    } catch (requestError) {
      showToast(apiErrorMessage(requestError, "Failed to update application"), "error");
    }
  };

  if (isLoading && applications.length === 0) return <ApplicationsPageSkeleton />;

  if (isError && applications.length === 0) {
    return (
      <QueryFeedback
        title="Failed to load applications"
        message={apiErrorMessage(error, "Unable to fetch driver applications")}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
      {toast ? (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-md ${toast.type === "success" ? "bg-accent" : "bg-urgent"}`}
        >
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-page-title">Driver Applications</h1>
          <p className="mt-1 text-sm text-ink-3">
            Review and manage new driver onboarding requests.
          </p>
        </div>
        {totalItems > 0 ? <Badge variant="primary">{totalItems} total</Badge> : null}
      </div>

      {applications.length === 0 ? (
        <section className="flex min-h-[460px] items-center justify-center rounded-xl border border-line-2 bg-white px-6 py-12">
          <div className="max-w-md">
            <EmptyState
              icon={FileCheck}
              title="No applications"
              description="There are no driver onboarding requests to review right now. New submissions will appear here automatically."
            />
          </div>
        </section>
      ) : (
        <div className="grid min-h-[560px] grid-cols-1 gap-5 lg:h-[calc(100vh-190px)] lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line-2 bg-white">
            <div className="flex items-center justify-between border-b border-line-2 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Application queue</h2>
                <p className="mt-0.5 text-xs text-ink-4">Select a driver to review</p>
              </div>
              <span className="rounded-md bg-bg px-2 py-1 text-xs font-semibold tabular-nums text-ink-3">
                {totalItems}
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  app={application}
                  selected={selectedApp?.id === application.id}
                  onClick={() => setSelectedAppId(application.id)}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </section>

          <section className="min-h-0 overflow-y-auto">
            <ApplicationDetails
              selectedApp={selectedApp!}
              onApprove={() => patchStatus(selectedApp!, "approved", `${selectedApp!.name} approved`)}
              onReject={() =>
                patchStatus(selectedApp!, "rejected", `${selectedApp!.name}'s application rejected`)
              }
              actionsDisabled={isUpdating}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default Applications;
