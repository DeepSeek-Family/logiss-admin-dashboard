import { useSyncExternalStore } from 'react';

// Plain, serializable in-app notification (no React component fields) so it can be
// persisted. The UI maps `type`/`category` to an icon at render time.
export interface AppNotification {
  id: number;
  type: 'critical' | 'warning' | 'success' | 'info';
  category: string;
  title: string;
  message: string;
  time: string;        // ISO
  read: boolean;
  action?: string | null;
  audience?: string;   // for broadcasts: who it went to
}

const STORAGE_KEY = 'logiss-notifications';
const listeners = new Set<() => void>();

const load = (): AppNotification[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
};

let store: AppNotification[] = load();

const persist = () => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
};
const commit = (next: AppNotification[]) => { store = next; persist(); listeners.forEach(l => l()); };

export const notificationsStore = {
  get: () => store,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
};

/** Deliver a new in-app notification (e.g. a super-admin broadcast). */
export const pushNotification = (n: Omit<AppNotification, 'id' | 'read'> & { id?: number; read?: boolean }) => {
  // Date.now() can't be used in some sandboxes; the caller passes `time`, so derive a
  // monotonic-ish id from it plus the current length to stay unique.
  const id = n.id ?? (new Date(n.time).getTime() + store.length + 1);
  commit([{ read: false, ...n, id }, ...store]);
};

/** Reactive access to the in-app notifications feed. */
export function useNotifications() {
  const notifications = useSyncExternalStore(notificationsStore.subscribe, notificationsStore.get, notificationsStore.get);
  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markRead: (id: number) => commit(store.map(n => (n.id === id ? { ...n, read: true } : n))),
    markAllRead: () => commit(store.map(n => ({ ...n, read: true }))),
    remove: (id: number) => commit(store.filter(n => n.id !== id)),
    clear: () => commit([]),
  };
}
