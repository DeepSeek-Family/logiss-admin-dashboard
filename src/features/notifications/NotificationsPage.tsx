import { useMemo, useState } from "react";
import { Megaphone, Loader2, AlertTriangle } from "lucide-react";
import { Pagination } from "@/shared/components/ui";
import { NotificationList } from "@/features/notifications";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
} from "@/redux/api/notificationsApi";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";
import { toast } from "react-hot-toast";
import { useNotifications } from "@/hooks/useNotifications";
const mapApiNotification = (n: {
  _id: string;
  title?: string;
  message?: string;
  text?: string;
  type?: string;
  category?: string;
  read?: boolean;
  createdAt?: string;
}) => ({
  id: n._id,
  type: n.type || "info",
  read: Boolean(n.read),
  icon: Megaphone,
  color: "text-primary",
  bg: "bg-primary-light",
  category: n.category || "",
  title: n.title || "",
  message: n.message || n.text || "",
  time: n.createdAt || new Date().toISOString(),
  action: null as string | null,
});

const Notifications = ({ role: _role }: { role?: string | null }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(
    { page: currentPage, limit: itemsPerPage },
    { refetchOnMountOrArgChange: true },
  );

  const { data: apiUnreadCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [markAllNotificationsRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsReadMutation();

  const {
    notifications: liveBroadcasts,
    markAllRead: markAllLiveRead,
    clear: clearLive,
  } = useNotifications();

  const apiItems = useMemo(() => (data?.data ?? []).map(mapApiNotification), [data]);

  const liveItems = useMemo(
    () =>
      liveBroadcasts.map((n) => ({
        ...n,
        icon: Megaphone,
        color: "text-primary",
        bg: "bg-primary-light",
        time: n.time || new Date().toISOString(),
      })),
    [liveBroadcasts],
  );

  const combined = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...liveItems, ...apiItems].filter((n) => {
      const key = String(n.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [liveItems, apiItems]);

  const localUnread = combined.filter((n) => !n.read).length;
  const unreadCount = Math.max(apiUnreadCount, localUnread);
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPage ?? 1;
  const totalItems = pagination?.total ?? combined.length;

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead().unwrap();
      markAllLiveRead();
      toast.success("All notifications marked as read");
      refetch();
    } catch (e: unknown) {
      toast.error(apiErrorMessage(e, "Failed to mark notifications as read"));
    }
  };

  const clearAll = () => clearLive();

  if (isLoading && combined.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-medium text-white bg-urgent rounded-full px-2 py-0.5 leading-none">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-ink-4 mt-0.5">Fleet, trip, and system alerts</p>
        </div>
        <div className="flex gap-2">
          {(apiUnreadCount > 0 || localUnread > 0) && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={isMarkingAllRead}
              className="text-xs text-primary hover:underline font-semibold disabled:opacity-50"
            >
              {isMarkingAllRead ? "Marking…" : "Mark all as read"}
            </button>
          )}
          {liveBroadcasts.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-ink-4 hover:text-ink font-semibold"
            >
              Clear broadcasts
            </button>
          )}
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-2 text-sm text-urgent bg-urgent/5 border border-urgent/20 rounded-xl px-4 py-3">
          <AlertTriangle size={16} />
          Could not load notifications from the server.
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-auto text-xs font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <NotificationList filtered={combined} />

      {totalItems > 0 && (
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
      )}
    </div>
  );
};

export default Notifications;
