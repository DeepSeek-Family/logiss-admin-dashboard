import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { timeAgo } from '@/utils/helpers';

interface NotificationListProps {
  filtered: any[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const urgentTypes = ['critical', 'warning'];

export const NotificationList = ({ filtered, onMarkRead, onDelete }: NotificationListProps) => {
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-bg border border-line-2 flex items-center justify-center mb-4">
          <Bell size={24} className="text-ink-4 opacity-40" />
        </div>
        <p className="text-sm font-semibold text-ink">You're all caught up</p>
        <p className="text-xs text-ink-4 mt-1">No notifications to show.</p>
      </div>
    );
  }

  // Group into Today vs Earlier
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const today = filtered.filter(n => new Date(n.time).getTime() >= todayStart);
  const earlier = filtered.filter(n => new Date(n.time).getTime() < todayStart);

  const renderItem = (notif: any) => (
    <div
      key={notif.id}
      className={`group flex gap-4 px-5 py-4 rounded-2xl border transition-all cursor-pointer ${
        notif.read
          ? 'border-line-2/60 bg-white hover:bg-bg'
          : urgentTypes.includes(notif.type)
            ? 'border-urgent/20 bg-urgent/[0.03] hover:bg-urgent/[0.06]'
            : 'border-primary/10 bg-primary/[0.03] hover:bg-primary/[0.05]'
      }`}
      onClick={() => onMarkRead(notif.id)}
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
            <span className={`text-[11px] font-bold uppercase tracking-wide ${notif.color}`}>
              {notif.category}
            </span>
          </div>
          <span className="text-[11px] text-ink-4 shrink-0">{timeAgo(notif.time)}</span>
        </div>

        <p className={`text-sm leading-snug ${notif.read ? 'text-ink-3 font-normal' : 'text-ink font-semibold'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-ink-4 leading-relaxed mt-1 line-clamp-2">{notif.message}</p>

        {(notif.action || !notif.read) && (
          <div className="flex items-center gap-3 mt-2">
            {notif.action && (
              <button
                className={`text-xs font-semibold flex items-center gap-1 ${notif.color} hover:opacity-70 transition-opacity`}
                onClick={e => e.stopPropagation()}
              >
                {notif.action} →
              </button>
            )}
            {!notif.read && (
              <button
                className="text-[11px] text-ink-4 hover:text-ink flex items-center gap-1 transition-colors"
                onClick={e => { e.stopPropagation(); onMarkRead(notif.id); }}
              >
                <CheckCheck size={12} /> Mark read
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        className="text-ink-4 hover:text-urgent transition-colors opacity-0 group-hover:opacity-100 shrink-0 p-1 mt-0.5"
        onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {today.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest px-1">Today</p>
          <div className="space-y-2">{today.map(renderItem)}</div>
        </div>
      )}
      {earlier.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest px-1">Earlier</p>
          <div className="space-y-2">{earlier.map(renderItem)}</div>
        </div>
      )}
    </div>
  );
};
