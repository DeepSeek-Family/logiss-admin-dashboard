import { useEffect, useRef } from "react";
import { Clock, User, X } from "lucide-react";
import { Badge, Button } from "@/shared/components/ui";
import type { SystemLog } from "@/redux/api/systemLogsApi";
import {
  formatAuditValue,
  formatLogTimestamp,
  getSystemLogActorEmail,
  getSystemLogActorName,
  humanizeFieldName,
  isJsonLikeValue,
} from "../utils/formatters";

interface SystemLogDetailsModalProps {
  log: SystemLog | null;
  onClose: () => void;
}

const actionVariant = (action: string) =>
  action === "CREATE" ? "accent" : action === "DELETE" ? "urgent" : "primary";

const DetailValue = ({ value }: { value: unknown }) => {
  const formattedValue = formatAuditValue(value);
  if (isJsonLikeValue(value)) {
    return (
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-bg p-3 text-xs text-ink-2">
        {formattedValue}
      </pre>
    );
  }
  return <span className="break-words text-sm text-ink">{formattedValue}</span>;
};

export const SystemLogDetailsModal = ({ log, onClose }: SystemLogDetailsModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!log) return;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [log, onClose]);

  if (!log) return null;

  const metadataEntries = Object.entries(log.metadata || {});

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close log details"
        className="fixed inset-0 bg-ink/55 backdrop-blur-xs"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-log-details-title"
        tabIndex={-1}
        className="relative z-10 flex max-h-[calc(100vh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line-2 bg-white shadow-lg outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-2 px-5 py-4 sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="system-log-details-title" className="text-lg font-semibold text-ink">
                System log details
              </h2>
              <Badge variant={actionVariant(log.action)}>{log.action || "Unknown"}</Badge>
            </div>
            <p className="mt-1 text-xs text-ink-4">Read-only audit information</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close log details"
            className="rounded-lg p-1.5 text-ink-4 hover:bg-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-line-2 bg-bg/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-4">
                <User size={13} /> Actor
              </p>
              <p className="mt-1.5 text-sm font-semibold text-ink">{getSystemLogActorName(log)}</p>
              <p className="mt-0.5 break-all text-xs text-ink-4">{getSystemLogActorEmail(log)}</p>
            </div>
            <div className="rounded-xl border border-line-2 bg-bg/30 p-3">
              <p className="text-xs font-semibold text-ink-4">Role and module</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">{log.actorRole || "—"}</p>
              <p className="mt-0.5 text-xs capitalize text-ink-4">{log.module || "—"}</p>
            </div>
            <div className="rounded-xl border border-line-2 bg-bg/30 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-4">
                <Clock size={13} /> Timestamp
              </p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {formatLogTimestamp(log.createdAt)}
              </p>
              <p className="mt-0.5 break-all text-xs text-ink-4">{log.createdAt || "—"}</p>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-ink-4">Entity type</p>
              <p className="mt-1 text-sm text-ink">{log.entityType || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-4">Entity ID</p>
              <p className="mt-1 break-all font-mono text-sm text-ink">{log.entityId || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-ink-4">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{log.description || "—"}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Changed fields ({log.changes?.length || 0})
            </h3>
            {log.changes?.length ? (
              <div className="overflow-x-auto rounded-xl border border-line-2">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-bg">
                    <tr>
                      <th className="px-4 py-3 type-th">Field</th>
                      <th className="px-4 py-3 type-th">Before</th>
                      <th className="px-4 py-3 type-th">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-2">
                    {log.changes.map((change, index) => (
                      <tr key={`${change.field}-${index}`}>
                        <td className="px-4 py-3 align-top text-xs font-semibold text-ink">
                          {humanizeFieldName(change.field)}
                        </td>
                        <td className="max-w-xs px-4 py-3 align-top">
                          <DetailValue value={change.before} />
                        </td>
                        <td className="max-w-xs px-4 py-3 align-top">
                          <DetailValue value={change.after} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-line-2 bg-bg/30 p-4 text-sm text-ink-4">
                No field-level changes were recorded.
              </p>
            )}
          </section>

          {metadataEntries.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">Metadata</h3>
              <DetailValue value={log.metadata} />
            </section>
          )}
        </div>
        <div className="flex justify-end border-t border-line-2 bg-bg/30 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
