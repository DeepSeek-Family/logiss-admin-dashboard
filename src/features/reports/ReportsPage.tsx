import { useMemo, useState } from "react";
import { AlertTriangle, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button, Pagination } from "@/shared/components/ui";
import { Loader } from "@/shared/Lodder";
import { useGetAllReportsQuery } from "@/redux/apivtwo/dashboardOnvording";
import { DetailPanel, ReportCard } from "@/features/reports";

const REPORT_STATUS_TABS = [
  { id: "all", label: "All reports" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Solved" },
  { id: "rejected", label: "Rejected" },
] as const;

const Reports = ({ role: _role }: { role?: string | null }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
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
    if (activeTab !== "all") params.reportStatus = activeTab;
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

  const { data: allCountResponse } = useGetAllReportsQuery(countOnlyParams, {
    refetchOnMountOrArgChange: true,
  });
  const { data: pendingCountResponse } = useGetAllReportsQuery(
    { ...countOnlyParams, reportStatus: "pending" },
    { refetchOnMountOrArgChange: true },
  );
  const { data: approvedCountResponse } = useGetAllReportsQuery(
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
      all: allCountResponse?.pagination?.total,
      pending: pendingCountResponse?.pagination?.total,
      approved: approvedCountResponse?.pagination?.total,
      rejected: rejectedCountResponse?.pagination?.total,
    }),
    [
      allCountResponse?.pagination?.total,
      pendingCountResponse?.pagination?.total,
      approvedCountResponse?.pagination?.total,
      rejectedCountResponse?.pagination?.total,
    ],
  );

  const statusTabs = useMemo(
    () =>
      REPORT_STATUS_TABS.map((tab) => ({
        ...tab,
        count:
          activeTab === tab.id
            ? totalItems
            : tabCounts[tab.id as keyof typeof tabCounts],
      })),
    [activeTab, totalItems, tabCounts],
  );

  const selectedReport =
    reports.find((report) => report._id === selectedReportId) ??
    reports[0] ??
    null;

  const resetListSelection = () => setSelectedReportId(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    resetListSelection();
  };

  return (
    <div className="flex flex-col gap-0 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="type-page-title">Incident Reports</h1>
          <p className="text-sm text-ink-4 mt-0.5">
            Review filed reports and the trips they belong to
          </p>
        </div>
      </div>

      <div
        className="bg-white border border-line-2 rounded-2xl shadow-sm overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <div className="flex items-center justify-between px-5 border-b border-line-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-ink-4 hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "bg-bg text-ink-4"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex overflow-hidden flex-1 min-h-0">
          <div className="w-[320px] shrink-0 border-r border-line-2 flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-line-2">
              <div className="flex w-full items-center gap-1.5 bg-bg border border-line-2 rounded-lg px-2.5 py-1.5">
                <Search size={12} className="text-ink-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                    resetListSelection();
                  }}
                  className="bg-transparent text-xs outline-none w-full min-w-0 text-ink placeholder:text-ink-4"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading && reports.length === 0 ? (
                <Loader message="Loading reports..." />
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <div className="w-12 h-12 bg-urgent/10 rounded-xl flex items-center justify-center mb-3 text-urgent">
                    <AlertTriangle size={22} />
                  </div>
                  <p className="text-sm font-medium text-ink">
                    Could not load reports
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : reports.length > 0 ? (
                <>
                  {isFetching && (
                    <p className="text-[10px] text-ink-4 px-3 py-1.5 border-b border-line-2 bg-bg/50">
                      Updating…
                    </p>
                  )}
                  {reports.map((report) => (
                    <ReportCard
                      key={report._id}
                      report={report}
                      selected={selectedReport?._id === report._id}
                      onClick={() => setSelectedReportId(report._id)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <div className="w-12 h-12 bg-bg rounded-xl flex items-center justify-center mb-3">
                    <ShieldCheck size={22} className="text-ink-4" />
                  </div>
                  <p className="text-sm font-medium text-ink-4">
                    No reports found
                  </p>
                  <p className="text-xs text-ink-4 mt-1">
                    Try another status or search
                  </p>
                </div>
              )}
            </div>

            <div className="shrink-0 overflow-x-auto border-t border-line-2">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, totalPages)}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  resetListSelection();
                }}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                  resetListSelection();
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-white min-w-0">
            {selectedReport ? (
              <DetailPanel reportId={selectedReport._id} previewReport={selectedReport} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-14 h-14 bg-bg rounded-2xl flex items-center justify-center mb-4">
                  <ShieldAlert size={28} className="text-ink-4" />
                </div>
                <p className="text-sm font-medium text-ink-4">
                  Select a report to review
                </p>
                <p className="text-xs text-ink-4 mt-1">
                  Choose a report from the list on the left
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
