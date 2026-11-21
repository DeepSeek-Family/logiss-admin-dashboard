import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, LayoutGrid, Pencil, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button } from "@/shared/components/ui";
import { useUpdateDispatcherRoutesMutation } from "@/redux/api/dispatcherManagementApi";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "../permissions";
import { permissionsForUser } from "../utils/permissionLabels";

interface AccessScopeModalProps {
  user: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    permissions?: string[];
  };
  onClose: () => void;
  /** Open straight into edit mode (from the table's "Edit Access" button). */
  startInEdit?: boolean;
}

const normalizeKey = (key: string) => (key.startsWith("/") ? key : `/${key}`);

export const AccessScopeModal = ({ user, onClose, startInEdit = false }: AccessScopeModalProps) => {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "User";
  const role = (user.role || "dispatcher").toLowerCase();
  // Only dispatchers have an editable access scope; admins always have full access.
  const canEdit = role === "dispatcher" && Boolean(user.id);

  const [editing, setEditing] = useState(startInEdit && canEdit);
  const [selected, setSelected] = useState<string[]>(() =>
    (user.permissions || []).map(normalizeKey),
  );
  const [updateRoutes, { isLoading: saving }] = useUpdateDispatcherRoutesMutation();

  // Paths the user already has that are not in the matrix — kept as-is on save.
  const extraKeys = useMemo(
    () => selected.filter((k) => !ALL_PERMISSIONS.includes(k)),
    [selected],
  );

  const items = permissionsForUser(user);
  const byGroup = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const togglePerm = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const toggleGroup = (groupKeys: string[]) =>
    setSelected((prev) => {
      const allOn = groupKeys.every((k) => prev.includes(k));
      return allOn
        ? prev.filter((k) => !groupKeys.includes(k))
        : [...new Set([...prev, ...groupKeys])];
    });

  const setAll = (on: boolean) =>
    setSelected(on ? [...new Set([...ALL_PERMISSIONS, ...extraKeys])] : []);

  const cancelEdit = () => {
    setSelected((user.permissions || []).map(normalizeKey));
    setEditing(false);
  };

  const save = async () => {
    if (!user.id) return;
    try {
      await updateRoutes({ id: user.id, accessScope: selected }).unwrap();
      toast.success("Page access updated");
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to update page access"));
    }
  };

  const close = () => !saving && onClose();

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={close} aria-hidden />
      <div
        className="relative bg-white rounded-2xl shadow-lg max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-line-2"
        role="dialog"
        aria-labelledby="access-scope-title"
      >
        <div className="px-6 py-5 border-b border-line-2 shrink-0 flex items-start justify-between gap-4">
          <div>
            <h3
              id="access-scope-title"
              className="text-lg font-semibold text-ink flex items-center gap-2"
            >
              <LayoutGrid className="text-primary" size={20} />
              {editing ? "Edit page access" : "Page access"}
            </h3>
            <p className="text-sm text-ink-3 mt-0.5">{displayName}</p>
            {user.email ? <p className="text-xs text-ink-4 mt-0.5">{user.email}</p> : null}
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-xl text-ink-4 hover:bg-bg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {editing ? (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-3 border-b border-line-2 bg-bg/40">
              <span className="text-xs text-ink-4">Tap a page to select or unselect it.</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAll(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setAll(false)}
                  className="text-xs font-semibold text-ink-4 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="divide-y divide-line-2">
              {PERMISSION_GROUPS.map((g) => {
                const groupKeys = g.perms.map((p) => p.key);
                const allOn = groupKeys.every((k) => selected.includes(k));
                const someOn = groupKeys.some((k) => selected.includes(k));
                return (
                  <div key={g.group} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-ink-3 uppercase tracking-wide">
                        {g.group}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupKeys)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${allOn ? "bg-primary text-white border-primary" : someOn ? "bg-primary/10 text-primary border-primary/20" : "bg-white text-ink-4 border-line-2 hover:bg-bg"}`}
                      >
                        {allOn ? "All on" : "Select group"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {g.perms.map((p) => {
                        const on = selected.includes(p.key);
                        return (
                          <button
                            type="button"
                            key={p.key}
                            onClick={() => togglePerm(p.key)}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors ${on ? "border-primary/30 bg-primary-tint/20" : "border-line-2 bg-white hover:bg-bg"}`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${on ? "bg-primary border-primary text-white" : "border-line-2 bg-white"}`}
                            >
                              {on && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span
                              className={`text-xs font-medium ${on ? "text-ink font-semibold" : "text-ink-3"}`}
                            >
                              {p.label}
                            </span>
                            <span className="ml-auto text-[10px] text-ink-4 font-mono">{p.key}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {extraKeys.length > 0 && (
                <div className="px-6 py-3">
                  <span className="block mb-2 text-xs font-bold tracking-wide uppercase text-ink-3">
                    Other
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {extraKeys.map((key) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => togglePerm(key)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left border-primary/30 bg-primary-tint/20"
                      >
                        <span className="flex items-center justify-center w-4 h-4 text-white border rounded bg-primary border-primary shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <span className="text-xs font-semibold text-ink font-mono">{key}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
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
        )}

        <div className="px-6 py-4 border-t border-line-2 shrink-0 flex items-center gap-3">
          {editing ? (
            <>
              <Badge variant="primary" className="text-xs">
                {selected.length} page(s) selected
              </Badge>
              <div className="flex gap-3 ml-auto">
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={saving ? Loader2 : undefined}
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={close}>
                Close
              </Button>
              {canEdit && (
                <Button type="button" variant="primary" icon={Pencil} onClick={() => setEditing(true)}>
                  Edit access
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
