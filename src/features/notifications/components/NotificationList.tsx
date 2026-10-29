import { Bell, CheckCircle2, MapPin, Truck, Shield } from 'lucide-react';
import { Card } from '@/shared/components/ui';
import { timeAgo } from '@/utils/helpers';

interface NotificationListProps {
  filtered: any[];
}

const urgentTypes = ['critical', 'warning'];

const isGenericNotificationLabel = (value?: string) => {
  const text = (value || '').trim();
  return !text || /^notification$/i.test(text);
};

/** Top row = one uppercase badge; body = message (no duplicate "Notification" headline). */
const notificationDisplay = (notif: { title?: string; category?: string; message?: string }) => {
  const message = (notif.message || '').trim();
  const title = (notif.title || '').trim();
  const category = (notif.category || '').trim();

  const badge =
    !isGenericNotificationLabel(category)
      ? category
      : !isGenericNotificationLabel(title)
        ? title
        : 'Notification';

  const body =
    message ||
    (!isGenericNotificationLabel(title) ? title : '') ||
    (!isGenericNotificationLabel(category) ? category : '');

  const headline =
    message &&
    !isGenericNotificationLabel(title) &&
    title.toLowerCase() !== message.toLowerCase()
      ? title
      : null;

  return { badge, headline, body };
};

export const NotificationList = ({ filtered }: NotificationListProps) => {
  if (filtered.length === 0) {
    const alertHints = [
      { icon: Truck, label: 'Fleet updates' },
      { icon: MapPin, label: 'Trip alerts' },
      { icon: Shield, label: 'System notices' },
    ];

    return (
      <Card className="relative overflow-hidden border border-line-2/70 bg-white shadow-sm ring-1 ring-ink/[0.03]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/[0.07] blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center px-6 py-14 sm:py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 scale-[1.35] rounded-full border border-primary/10 bg-primary/[0.04]" />
            <div className="absolute inset-0 scale-[1.15] rounded-full border border-primary/15" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-white to-primary/5 shadow-sm ring-1 ring-primary/10">
              <Bell size={32} className="text-primary" strokeWidth={1.75} />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white">
                <CheckCircle2 size={16} className="text-accent" strokeWidth={2.25} />
              </span>
            </div>
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
            You&apos;re all caught up
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-3">
            No notifications right now. When trips change, drivers update, or the system sends an alert,
            it will appear here instantly.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {alertHints.map(({ icon: HintIcon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-2/80 bg-bg/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-4"
              >
                <HintIcon size={12} className="text-primary/80" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Group into Today vs Earlier
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const today = filtered.filter(n => new Date(n.time).getTime() >= todayStart);
  const earlier = filtered.filter(n => new Date(n.time).getTime() < todayStart);

  const renderItem = (notif: any) => {
    const { badge, headline, body } = notificationDisplay(notif);

    return (
    <div
      key={notif.id}
      className={`flex gap-4 px-5 py-4 rounded-2xl border transition-colors ${
        notif.read
          ? 'border-line-2/60 bg-white'
          : urgentTypes.includes(notif.type)
            ? 'border-urgent/20 bg-urgent/[0.03]'
            : 'border-primary/10 bg-primary/[0.03]'
      }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.bg}`}>
        <notif.icon size={16} className={notif.color} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-2">
            {!notif.read && (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
                urgentTypes.includes(notif.type) ? 'bg-urgent' : 'bg-primary'
              }`} />
            )}
            <span className={`text-xs font-bold uppercase tracking-wide ${notif.color}`}>
              {badge}
            </span>
          </div>
          <span className="text-xs text-ink-4 shrink-0">{timeAgo(notif.time)}</span>
        </div>

        {headline && (
          <p className={`text-sm leading-snug ${notif.read ? 'text-ink-3 font-normal' : 'text-ink font-semibold'}`}>
            {headline}
          </p>
        )}
        {body && (
          <p
            className={`leading-snug line-clamp-3 ${
              headline
                ? 'text-xs text-ink-4 mt-1'
                : `text-sm ${notif.read ? 'text-ink-3 font-normal' : 'text-ink font-semibold'}`
            }`}
          >
            {body}
          </p>
        )}

        {notif.action && (
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-semibold flex items-center gap-1 ${notif.color}`}>
              {notif.action} →
            </span>
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      {today.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-ink-4 uppercase tracking-widest px-1">Today</p>
          <div className="space-y-2">{today.map(renderItem)}</div>
        </div>
      )}
      {earlier.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-ink-4 uppercase tracking-widest px-1">Earlier</p>
          <div className="space-y-2">{earlier.map(renderItem)}</div>
        </div>
      )}
    </div>
  );
};
