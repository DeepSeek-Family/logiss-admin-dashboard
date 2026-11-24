import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Headset, Loader2, Send, ShieldCheck, User, Users, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { pushNotification } from "@/hooks/useNotifications";
import { useSendPushNotificationMutation } from "@/redux/api/pushNotificationsApi";
import { useGetRidersQuery } from "@/redux/api/ridersApi";
import { useGetDriversQuery } from "@/redux/api/driversApi";

const MESSAGE_MAX = 200;

interface SendPushNotificationModalProps {
  onClose: () => void;
  /** Called after a successful send so the page can show the new entry. */
  onSent?: () => void;
}

export const SendPushNotificationModal = ({ onClose, onSent }: SendPushNotificationModalProps) => {
  const { data: driversResponse } = useGetDriversQuery();
  const { data: ridersResponse } = useGetRidersQuery();
  const [sendPushNotification, { isLoading: isSending }] = useSendPushNotificationMutation();

  const driversCount = driversResponse?.data?.length || 0;
  const ridersCount = ridersResponse?.data?.length || 0;

  const AUDIENCES = useMemo(
    () => [
      {
        id: "all_riders",
        apiAudience: "USER",
        label: "All Riders",
        icon: User,
        channel: "Rider app",
        count: ridersCount,
      },
      {
        id: "all_drivers",
        apiAudience: "DRIVER",
        label: "All Drivers",
        icon: Users,
        channel: "Driver app",
        count: driversCount,
      },
      {
        id: "all",
        apiAudience: "ALL",
        label: "All (Riders & Drivers)",
        icon: ShieldCheck,
        channel: "All Apps",
        count: driversCount + ridersCount,
      },
      {
        id: "dispatchers",
        apiAudience: "USER",
        label: "Dispatchers",
        icon: Headset,
        channel: "Dashboard",
        count: 1,
      },
      {
        id: "facility_users",
        apiAudience: "USER",
        label: "Facility Users",
        icon: Building2,
        channel: "Dashboard",
        count: 1,
      },
    ],
    [driversCount, ridersCount],
  );

  const [audience, setAudience] = useState<string>("all_riders");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const selected = AUDIENCES.find((a) => a.id === audience) || AUDIENCES[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSending, onClose]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please enter a title and message.");
      return;
    }

    const sentAt = new Date().toISOString();
    try {
      await sendPushNotification({
        title: title.trim(),
        description: message.trim(),
        audience: selected.apiAudience || "ALL",
      }).unwrap();

      if (["dispatchers", "facility_users"].includes(selected.id)) {
        pushNotification({
          type: "info",
          category: "Broadcast",
          title: title.trim(),
          message: message.trim(),
          time: sentAt,
          action: null,
          audience: selected.label,
        });
      }

      toast.success(`Push sent to ${selected.label}`);
      onSent?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.error || "Failed to send notification");
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={() => !isSending && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-push-title"
        className="relative bg-white rounded-2xl shadow-lg max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-line-2 shrink-0 flex items-start justify-between gap-4">
          <div>
            <h3
              id="send-push-title"
              className="text-xl font-semibold text-ink flex items-center gap-2"
            >
              <Send className="text-primary" size={20} /> New Push Notification
            </h3>
            <p className="text-sm text-ink-3 mt-0.5">
              Broadcast a real-time alert to rider/driver apps or internal staff.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-bg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <fieldset>
              <legend className="text-xs font-semibold text-ink-3 mb-2">Audience</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AUDIENCES.map((a) => {
                  const on = audience === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setAudience(a.id)}
                      className={`text-left p-3 rounded-xl border-2 transition-colors ${on ? "border-primary bg-primary-tint/20" : "border-line-2 bg-bg hover:border-primary/40"}`}
                    >
                      <a.icon size={16} className={on ? "text-primary" : "text-ink-4"} />
                      <p
                        className={`text-xs font-semibold mt-1.5 ${on ? "text-primary" : "text-ink"}`}
                      >
                        {a.label}
                      </p>
                      <p className="text-xs text-ink-4 mt-0.5">
                        {a.count} · {a.channel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="push-title" className="block text-xs font-semibold text-ink-3 mb-1.5">
                Title *
              </label>
              <input
                id="push-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                autoFocus
                className="w-full text-sm font-semibold text-ink border border-line-2 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="push-message" className="text-xs font-semibold text-ink-3">
                  Message *
                </label>
                <span className="text-xs text-ink-4 tabular-nums">
                  {message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                id="push-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                placeholder="Write your message..."
                rows={4}
                className="w-full text-sm text-ink border border-line-2 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-line-2 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSending || !title.trim() || !message.trim()}>
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSending ? "Sending…" : `Send to ${selected.label} (${selected.count})`}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
