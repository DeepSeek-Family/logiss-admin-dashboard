import { createPortal } from 'react-dom';
import { X, Check, LayoutGrid } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { permissionsForUser } from '../utils/permissionLabels';

interface AccessScopeModalProps {
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    permissions?: string[];
  };
  onClose: () => void;
}

export const AccessScopeModal = ({ user, onClose }: AccessScopeModalProps) => {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'User';
  const items = permissionsForUser(user);
  const byGroup = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-line-2"
        role="dialog"
        aria-labelledby="access-scope-title"
      >
        <div className="px-6 py-5 border-b border-line-2 shrink-0 flex items-start justify-between gap-4">
          <div>
            <h3 id="access-scope-title" className="text-lg font-semibold text-ink flex items-center gap-2">
              <LayoutGrid className="text-primary" size={20} />
              Page access
            </h3>
            <p className="text-sm text-ink-3 mt-0.5">{displayName}</p>
            {user.email ? <p className="text-xs text-ink-4 mt-0.5">{user.email}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ink-4 hover:bg-bg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {items.length === 0 ? (
            <p className="text-sm text-ink-4 text-center py-8">No page permissions assigned.</p>
          ) : (
            Object.entries(byGroup).map(([group, groupItems]) => (
              <div key={group}>
                <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2">{group}</p>
                <ul className="space-y-1.5">
                  {groupItems.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-bg/60 border border-line-2 text-sm"
                    >
                      <span className="w-5 h-5 rounded-md bg-accent/15 text-accent flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="font-medium text-ink">{item.label}</span>
                      <span className="text-xs text-ink-4 ml-auto font-mono">{item.key}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-line-2 shrink-0 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
