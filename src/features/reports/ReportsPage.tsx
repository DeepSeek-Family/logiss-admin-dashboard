import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button, Pagination } from "@/shared/components/ui";
import { Loader } from "@/shared/Lodder";
import { useGetAllReportsQuery } from "@/redux/apivtwo/dashboardOnvording";
import { tripTypeLabel } from "@/utils/helpers";
import { DetailPanel, ReportCard } from "@/features/reports";
import { statusLabel } from "./utils/helpers";

const Reports = ({ role: _role }: { role?: string | null }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [tripType, setTripType] = useState("all");
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
      tripType?: string;
    } = {
      page: currentPage,
      limit: itemsPerPage,
    };
    const q = search.trim();
    if (q) params.search = q;
    if (activeTab !== "all") params.reportStatus = activeTab;
    if (tripType !== "all") params.tripType = tripType;
    return params;
  }, [currentPage, itemsPerPage, search, activeTab, tripType]);

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

  const reports = reportsResponse?.data ?? [];
  const pagination = reportsResponse?.pagination;
  const totalPages = pagination?.totalPage ?? 1;
  const totalItems = pagination?.total ?? reports.length;

  const statusTabs = useMemo(() => {
    const statuses = new Set<string>();
    reports.forEach((report) => {
      if (report.reportStatus) statuses.add(report.reportStatus);
    });
    const allTotal = allCountResponse?.pagination?.total;
    return [
      {
        id: "all",
        label: "All reports",
        count: activeTab === "all" ? totalItems : allTotal,
      },
      ...Array.from(statuses).map((id) => ({
        id,
        label: statusLabel(id),
        count: activeTab === id ? totalItems : undefined,
      })),
    ];
  }, [reports, activeTab, totalItems, allCountResponse?.pagination?.total]);

  const tripTypes = useMemo(() => {
    const types = new Set<string>();
    reports.forEach((report) => {
      const trip = report.tripId;
      if (trip && typeof trip !== "string" && trip.tripType) {
        types.add(trip.tripType);
      }
    });
    return Array.from(types);
  }, [reports]);

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
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line-2">
              <div className="flex-1 flex items-center gap-1.5 bg-bg border border-line-2 rounded-lg px-2.5 py-1.5">
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
                  className="bg-transparent text-xs outline-none w-full text-ink placeholder:text-ink-4"
                />
              </div>
              <div className="relative">
                <select
                  value={tripType}
                  onChange={(e) => {
                    setTripType(e.target.value);
                    setCurrentPage(1);
                    resetListSelection();
                  }}
                  className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-medium bg-bg border border-line-2 rounded-lg text-ink-3 outline-none cursor-pointer"
                >
                  <option value="all">All types</option>
                  {tripTypes.map((type) => (
                    <option key={type} value={type}>
                      {tripTypeLabel(type)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={10}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none"
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
              <DetailPanel reportId={selectedReport._id} />
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
