import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Headset,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Badge, Button, Pagination } from "@/shared/components/ui";
import { useGetNotificationsQuery } from "@/redux/api/notificationsApi";
import { SendPushNotificationModal } from "./components/SendPushNotificationModal";

interface SentLog {
  id: string;
  audience: string;
  audienceLabel: string;
  title: string;
  message: string;
  sentAt: string;
}

const audienceLabelFromApi = (audience?: string) => {
  const a = String(audience || "").toUpperCase();
  if (a === "DRIVER") return "All Drivers";
  if (a === "USER") return "All Riders";
  if (a === "ALL") return "All (Riders & Drivers)";
  return audience || "Broadcast";
};

const AudienceIcon = ({ label }: { label: string }) => {
  const Icon = label.includes("Driver")
    ? label.includes("Rider")
      ? ShieldCheck
      : Users
    : label.includes("Rider")
      ? User
      : label.includes("Facility")
        ? Building2
        : label.includes("Dispatcher")
          ? Headset
          : ShieldCheck;
  return <Icon size={14} className="text-primary" />;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatSentAt = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const TH = "px-5 py-3 text-xs font-semibold uppercase text-ink-4";

const PushNotifications = ({ role }: { role?: string | null }) => {
  const [showSend, setShowSend] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(10);
  const isAllowed = !role || role === "admin";

  const {
    data: notificationsResponse,
    isLoading: logsLoading,
    isFetching: logsFetching,
    isError: logsError,
    refetch: refetchLogs,
  } = useGetNotificationsQuery({ page: logPage, limit: logsPerPage }, { skip: !isAllowed });

  const logsTotal = notificationsResponse?.pagination?.total ?? 0;
  const logsTotalPages = Math.max(
    1,
    notificationsResponse?.pagination?.totalPage ?? Math.ceil(logsTotal / logsPerPage),
  );

  const logs: SentLog[] = useMemo(
    () =>
      (notificationsResponse?.data || []).map((n) => ({
        id: n._id,
        audience: String(n.audience || ""),
        audienceLabel: audienceLabelFromApi(n.audience),
        title: n.title || n.text || "Notification",
        message: n.message || n.text || "",
        sentAt: n.createdAt || n.updatedAt || new Date().toISOString(),
      })),
    [notificationsResponse],
  );

  // Only the super-admin can broadcast push notifications.
  if (!isAllowed) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-urgent/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={26} className="text-urgent" />
        </div>
        <h1 className="text-lg font-semibold text-ink">Restricted</h1>
        <p className="text-sm text-ink-4 mt-1">
          Push notifications can only be sent by a Super Admin.
        </p>
      </div>
    );
  }

  const handleSent = () => {
    // Show the newest entry: jump back to the first page.
    if (logPage !== 1) setLogPage(1);
    else refetchLogs();
  };

  return (
    <div className="flex flex-col gap-5 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="type-page-title">Push Notifications</h1>
            <Badge variant="primary" className="text-xs whitespace-nowrap">
              <ShieldCheck size={11} className="inline mr-1" />
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-ink-4 mt-1">
            Broadcast real-time alerts to rider/driver apps or internal staff
          </p>
        </div>
        <Button onClick={() => setShowSend(true)} className="shrink-0">
          <Plus size={16} /> New Push Notification
        </Button>
      </header>

      <section className="overflow-hidden rounded-xl border border-line-2 bg-white shadow-sm">
        <div className="flex min-h-14 items-center justify-between border-b border-line-2 px-4 sm:px-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            Sent History
            {logsTotal > 0 && (
              <span className="text-xs font-medium text-ink-4 tabular-nums">({logsTotal})</span>
            )}
          </h2>
          {logsFetching && !logsLoading && (
            <Loader2 size={16} className="animate-spin text-primary" aria-label="Refreshing" />
          )}
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-4">
            <Loader2 size={18} className="animate-spin text-primary" />
            Loading history…
          </div>
        ) : logsError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-urgent">Could not load notification history.</p>
            <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
              Try again
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bell size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">No notifications sent yet</p>
              <p className="text-xs text-ink-4 mt-1">
                Notifications you broadcast will appear here.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowSend(true)}>
              <Plus size={14} /> New Push Notification
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`overflow-x-auto transition-opacity ${logsFetching ? "opacity-60" : ""}`}
              aria-busy={logsFetching}
            >
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-bg/70">
                  <tr className="border-b border-line-2">
                    <th className={TH}>Notification</th>
                    <th className={TH}>Audience</th>
                    <th className={`${TH} text-right`}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-line-2 last:border-b-0 hover:bg-bg/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 align-top max-w-0 w-[60%]">
                        <p className="text-sm font-semibold text-ink truncate" title={log.title}>
                          {log.title}
                        </p>
                        {log.message && (
                          <p className="text-xs text-ink-4 line-clamp-2 mt-0.5" title={log.message}>
                            {log.message}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-primary/5 px-2.5 py-1 text-xs font-semibold text-ink-2 whitespace-nowrap">
                          <AudienceIcon label={log.audienceLabel} />
                          {log.audienceLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 align-top text-right whitespace-nowrap">
                        <p className="text-xs font-medium text-ink-2">{formatSentAt(log.sentAt)}</p>
                        <p className="text-xs text-ink-4 mt-0.5">{timeAgo(log.sentAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line-2">
              <Pagination
                currentPage={logPage}
                totalPages={logsTotalPages}
                totalItems={logsTotal}
                itemsPerPage={logsPerPage}
                onPageChange={setLogPage}
                onItemsPerPageChange={(size) => {
                  setLogsPerPage(size);
                  setLogPage(1);
                }}
              />
            </div>
          </>
        )}
      </section>

      {showSend && (
        <SendPushNotificationModal onClose={() => setShowSend(false)} onSent={handleSent} />
      )}
    </div>
  );
};

export default PushNotifications;
