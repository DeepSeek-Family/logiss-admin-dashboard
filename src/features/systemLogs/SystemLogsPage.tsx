import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Pagination, QueryFeedback } from "@/shared/components/ui";
import {
  useGetSystemLogsQuery,
  type SystemLog,
  type SystemLogsQueryParams,
} from "@/redux/api/systemLogsApi";
import { SystemLogDetailsModal } from "./components/SystemLogDetailsModal";
import {
  formatLogTimestamp,
  getSystemLogActorEmail,
  getSystemLogActorName,
} from "./utils/formatters";

const DEFAULT_PAGE_SIZE = 20;
const ACTION_OPTIONS = ["CREATE", "UPDATE", "DELETE"];
const ROLE_OPTIONS = ["SUPER_ADMIN", "DISPATCHER"];

const actionVariant = (action: string) =>
  action === "CREATE" ? "accent" : action === "DELETE" ? "urgent" : "primary";

const roleVariant = (role: string) => (role === "SUPER_ADMIN" ? "primary" : "warning");

const safePositiveNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const SystemLogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = safePositiveNumber(searchParams.get("page"), 1);
  const limit = safePositiveNumber(searchParams.get("limit"), DEFAULT_PAGE_SIZE);
  const moduleFilter = searchParams.get("module") || "";
  const actorRole = searchParams.get("actorRole") || "";
  const action = searchParams.get("action") || "";
  const entityIdFromUrl = searchParams.get("entityId") || "";
  const [entityIdInput, setEntityIdInput] = useState(entityIdFromUrl);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  useEffect(() => setEntityIdInput(entityIdFromUrl), [entityIdFromUrl]);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    });
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (entityIdInput.trim() === entityIdFromUrl) return;
      updateFilters({ entityId: entityIdInput.trim(), page: 1 });
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [entityIdInput, entityIdFromUrl]);

  const queryParams = useMemo<SystemLogsQueryParams>(
    () => ({
      page,
      limit,
      ...(moduleFilter ? { module: moduleFilter } : {}),
      ...(actorRole ? { actorRole } : {}),
      ...(action ? { action } : {}),
      ...(entityIdFromUrl ? { entityId: entityIdFromUrl } : {}),
    }),
    [page, limit, moduleFilter, actorRole, action, entityIdFromUrl],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetSystemLogsQuery(queryParams);
  const logs = data?.data || [];
  const pagination = data?.pagination;
  const moduleOptions = useMemo(
    () => Array.from(new Set(["booking", ...logs.map((log) => log.module).filter(Boolean)])).sort(),
    [logs],
  );

  const resetFilters = () => {
    setEntityIdInput("");
    setSearchParams(new URLSearchParams({ limit: String(DEFAULT_PAGE_SIZE) }));
  };

  const errorStatus = error && typeof error === "object" && "status" in error ? error.status : null;
  const errorMessage =
    errorStatus === 403
      ? "You do not have permission to view system logs."
      : "System logs could not be loaded. Please try again.";

  return (
    <div className="space-y-6   duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={24} />
            <h1 className="type-page-title">System Logs</h1>
          </div>
          <p className="mt-1 text-sm text-ink-4">
            Read-only administrative activity and change history
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={RefreshCw}
          disabled={isFetching}
          onClick={() => refetch()}
          className={isFetching ? "[&_svg]:animate-spin" : ""}
        >
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden border-line-2 shadow-sm">
        <div className="border-b border-line-2 bg-bg/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-ink-4">Module</span>
              <select
                value={moduleFilter}
                onChange={(event) => updateFilters({ module: event.target.value, page: 1 })}
                className="h-10 w-full rounded-xl border border-line-2 bg-white px-3 text-xs font-medium text-ink outline-none focus:border-primary"
              >
                <option value="">All modules</option>
                {moduleOptions.map((moduleName) => (
                  <option key={moduleName} value={moduleName}>
                    {moduleName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-ink-4">Actor role</span>
              <select
                value={actorRole}
                onChange={(event) => updateFilters({ actorRole: event.target.value, page: 1 })}
                className="h-10 w-full rounded-xl border border-line-2 bg-white px-3 text-xs font-medium text-ink outline-none focus:border-primary"
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {roleName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-ink-4">Action</span>
              <select
                value={action}
                onChange={(event) => updateFilters({ action: event.target.value, page: 1 })}
                className="h-10 w-full rounded-xl border border-line-2 bg-white px-3 text-xs font-medium text-ink outline-none focus:border-primary"
              >
                <option value="">All actions</option>
                {ACTION_OPTIONS.map((actionName) => (
                  <option key={actionName} value={actionName}>
                    {actionName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-ink-4">Entity / booking ID</span>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                <input
                  value={entityIdInput}
                  onChange={(event) => setEntityIdInput(event.target.value)}
                  placeholder="Enter entity ID"
                  className="h-10 w-full rounded-xl border border-line-2 bg-white pl-9 pr-3 text-xs text-ink outline-none focus:border-primary"
                />
              </div>
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={resetFilters}
                className="h-10 w-full"
              >
                Reset filters
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-5" aria-label="Loading system logs">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-bg" />
            ))}
          </div>
        ) : isError ? (
          <QueryFeedback
            title={errorStatus === 403 ? "Access denied" : "Unable to load system logs"}
            message={errorMessage}
            onRetry={refetch}
          />
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Activity size={42} className="mb-3 text-ink-4/30" />
            <h2 className="text-base font-semibold text-ink">No system logs found</h2>
            <p className="mt-1 text-sm text-ink-4">Try adjusting or resetting the filters.</p>
          </div>
        ) : (
          <>
            <div
              className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}
            >
              <table className="w-full min-w-[1180px] text-left">
                <thead className="bg-bg">
                  <tr>
                    <th className="px-4 py-3 type-th">Date and time</th>
                    <th className="px-4 py-3 type-th">Actor</th>
                    <th className="px-4 py-3 type-th">Role</th>
                    <th className="px-4 py-3 type-th">Action</th>
                    <th className="px-4 py-3 type-th">Module</th>
                    <th className="px-4 py-3 type-th">Description</th>
                    <th className="px-4 py-3 type-th">Target ID</th>
                    <th className="px-4 py-3 type-th text-center">Changes</th>
                    <th className="px-4 py-3 type-th">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      tabIndex={0}
                      onClick={() => setSelectedLog(log)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedLog(log);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-primary-tint/20 focus:bg-primary-tint/20 focus:outline-none"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-ink">
                        {formatLogTimestamp(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-ink">
                          {getSystemLogActorName(log)}
                        </p>
                        <p
                          className="mt-0.5 max-w-[190px] truncate text-xs text-ink-4"
                          title={getSystemLogActorEmail(log)}
                        >
                          {getSystemLogActorEmail(log)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleVariant(log.actorRole)}>
                          {log.actorRole || "Unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(log.action)}>{log.action || "Unknown"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold capitalize text-ink-2">
                        {log.module || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="max-w-[260px] truncate text-xs text-ink-2"
                          title={log.description}
                        >
                          {log.description || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="block max-w-[160px] truncate font-mono text-xs text-ink-3"
                          title={log.entityId}
                        >
                          {log.entityId || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-ink">
                        {log.changes?.length || 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-tint"
                        >
                          <Eye size={13} /> View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination?.page || page}
              totalPages={pagination?.totalPage || 1}
              totalItems={pagination?.total || 0}
              itemsPerPage={pagination?.limit || limit}
              itemsPerPageOptions={[10, 20, 50, 100]}
              onPageChange={(nextPage) => updateFilters({ page: nextPage })}
              onItemsPerPageChange={(nextLimit) => updateFilters({ limit: nextLimit, page: 1 })}
            />
          </>
        )}
      </Card>

      <SystemLogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};

export default SystemLogsPage;
