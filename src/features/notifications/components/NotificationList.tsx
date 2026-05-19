import { Bell, ChevronRight, Trash2 } from 'lucide-react';
import { timeAgo } from '@/utils/helpers';

interface NotificationListProps {
  filtered: any[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export const NotificationList = ({ filtered, onMarkRead, onDelete }: NotificationListProps) => {
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Bell size={32} className="text-ink-4 opacity-20 mb-4" />
        <p className="text-sm font-medium text-ink">All caught up</p>
        <p className="text-xs text-ink-4 mt-1">No notifications here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map(notif => (
        <div
          key={notif.id}
          className={`flex gap-3 px-4 py-3.5 rounded-xl border transition-all cursor-pointer group ${
            notif.read ? 'border-transparent hover:bg-bg' : 'border-transparent bg-primary/[0.03] hover:bg-primary/[0.05]'
          }`}
          onClick={() => onMarkRead(notif.id)}
        >
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${notif.bg} ${notif.color}`}>
            <notif.icon size={15} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                <span className={`text-xs font-medium ${notif.color}`}>{notif.category}</span>
              </div>
              <span className="text-xs text-ink-4 shrink-0">{timeAgo(notif.time)}</span>
            </div>

            <p className={`text-sm leading-snug mb-1 ${notif.read ? 'text-ink-3 font-normal' : 'text-ink font-medium'}`}>
              {notif.title}
            </p>
            <p className="text-xs text-ink-4 leading-relaxed">{notif.message}</p>

            {(notif.action || !notif.read) && (
              <div className="flex items-center gap-3 mt-2">
                {notif.action && (
                  <button className={`text-xs font-medium flex items-center gap-0.5 ${notif.color} hover:opacity-70 transition-opacity`}>
                    {notif.action} <ChevronRight size={11} />
                  </button>
                )}
                {!notif.read && (
                  <button
                    className="text-xs text-ink-4 hover:text-ink transition-colors"
                    onClick={e => { e.stopPropagation(); onMarkRead(notif.id); }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            className="text-ink-4 hover:text-urgent transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
            onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};
