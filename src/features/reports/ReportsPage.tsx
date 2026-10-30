import { useMemo, useState } from "react";
import { AlertTriangle, Eye, Search, X } from "lucide-react";
import { Button, Pagination } from "@/shared/components/ui";
import { Loader } from "@/shared/Lodder";
import { useGetAllReportsQuery, type IIncidentReport } from "@/redux/apivtwo/dashboardOnvording";
import { DetailPanel } from "@/features/reports";
import { formatDateTime } from "@/utils/helpers";
import {
  formatReportUser,
  reportCategory,
  reportPersonName,
  reportStatusVariant,
  statusLabel,
} from "./utils/helpers";

const REPORT_STATUS_TABS = [
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
  { id: "resolved", label: "Resolved" },
] as const;

const Reports = ({ role: _role }: { role?: string | null }) => {
  const [activeTab, setActiveTab] = useState<(typeof REPORT_STATUS_TABS)[number]["id"]>("pending");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<IIncidentReport | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const listParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      search?: string;
      reportStatus?: string;
    } = {
      page: currentPage,
      limit: itemsPerPage,
    };
    const q = search.trim();
    if (q) params.search = q;
    params.reportStatus = activeTab === "resolved" ? "approved" : activeTab;
    return params;
  }, [currentPage, itemsPerPage, search, activeTab]);

  const countOnlyParams = useMemo(() => ({ page: 1, limit: 1 }), []);

  const {
    data: reportsResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAllReportsQuery(listParams, { refetchOnMountOrArgChange: true });

  const { data: pendingCountResponse } = useGetAllReportsQuery(
    { ...countOnlyParams, reportStatus: "pending" },
    { refetchOnMountOrArgChange: true },
  );
  const { data: resolvedCountResponse } = useGetAllReportsQuery(
    { ...countOnlyParams, reportStatus: "approved" },
    { refetchOnMountOrArgChange: true },
  );
  const { data: rejectedCountResponse } = useGetAllReportsQuery(
    { ...countOnlyParams, reportStatus: "rejected" },
    { refetchOnMountOrArgChange: true },
  );

  const reports = reportsResponse?.data ?? [];
  const pagination = reportsResponse?.pagination;
  const totalPages = pagination?.totalPage ?? 1;
  const totalItems = pagination?.total ?? reports.length;

  const tabCounts = useMemo(
    () => ({
      pending: pendingCountResponse?.pagination?.total,
      rejected: rejectedCountResponse?.pagination?.total,
      resolved: resolvedCountResponse?.pagination?.total,
    }),
    [
      pendingCountResponse?.pagination?.total,
      rejectedCountResponse?.pagination?.total,
      resolvedCountResponse?.pagination?.total,
    ],
  );

  const statusTabs = useMemo(
    () =>
      REPORT_STATUS_TABS.map((tab) => ({
        ...tab,
        count: activeTab === tab.id ? totalItems : tabCounts[tab.id],
      })),
    [activeTab, totalItems, tabCounts],
  );

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as (typeof REPORT_STATUS_TABS)[number]["id"]);
    setCurrentPage(1);
    setSelectedReport(null);
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-page-title">Incident Reports</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            Review filed reports and the trips they belong to
          </p>
        </div>
        <label className="flex w-full sm:w-72 items-center gap-2 rounded-lg border border-line-2 bg-white px-3 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
          <Search size={16} className="shrink-0 text-ink-4" />
          <input
            type="search"
            placeholder="Search reports..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
          />
        </label>
      </header>

      <section className="overflow-hidden rounded-xl border border-line-2 bg-white shadow-sm">
        <div className="flex min-h-14 items-center justify-between border-b border-line-2 px-4 sm:px-5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-ink-4 hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${
                      activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-bg text-ink-4"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {isFetching && !isLoading && (
            <span className="hidden text-xs text-ink-4 sm:block">Updating…</span>
          )}
        </div>

        {isLoading && reports.length === 0 ? (
          <div className="min-h-72">
            <Loader message="Loading reports..." />
          </div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <AlertTriangle size={24} className="mb-3 text-urgent" />
            <p className="text-sm font-semibold text-ink">Could not load reports</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : reports.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-bg/70">
                  <tr className="border-b border-line-2">
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-ink-4">Report</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-ink-4">
                      Concern
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-ink-4">
                      Assigned to
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-ink-4">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase text-ink-4">Filed</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-ink-4">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {reports.map((report) => (
                    <tr key={report._id} className="transition-colors hover:bg-bg/40">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {reportPersonName(report, "userId")}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-4">
                          Filed by {reportPersonName(report, "reportedBy")}
                        </p>
                      </td>
                      <td className="max-w-64 px-5 py-4">
                        <p className="truncate text-sm text-ink" title={reportCategory(report)}>
                          {reportCategory(report)}
                        </p>
                        {report.reason && (
                          <p className="mt-0.5 truncate text-xs text-ink-4" title={report.reason}>
                            {report.reason}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-3">
                        {report.assignedUserId ? (
                          formatReportUser(report.assignedUserId)
                        ) : (
                          <span className="text-ink-4">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            reportStatusVariant(report.reportStatus) === "warning"
                              ? "bg-warning/10 text-warning"
                              : reportStatusVariant(report.reportStatus) === "urgent"
                                ? "bg-urgent/10 text-urgent"
                                : "bg-accent/10 text-accent"
                          }`}
                        >
                          {activeTab === "resolved" ? "Resolved" : statusLabel(report.reportStatus)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-ink-3">
                        {formatDateTime(report.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          title="Review report"
                          aria-label={`Review report from ${reportPersonName(report, "userId")}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line-2 text-ink-3 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.max(1, totalPages)}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-sm font-semibold text-ink">No {activeTab} reports</p>
            <p className="mt-1 text-xs text-ink-4">Try a different search term.</p>
          </div>
        )}
      </section>

      {selectedReport && (
        <div
          className="fixed inset-0 z-[200] flex justify-end bg-ink/40 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedReport(null);
          }}
        >
          <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <div className="flex h-12 shrink-0 items-center justify-end border-b border-line-2 px-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                aria-label="Close report details"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-bg hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <DetailPanel reportId={selectedReport._id} previewReport={selectedReport} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Reports;
