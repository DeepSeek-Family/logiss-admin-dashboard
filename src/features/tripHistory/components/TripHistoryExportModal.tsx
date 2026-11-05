import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import {
  useGetTripHistoryExportFieldsQuery,
  type ITripHistoryExportField,
} from "@/redux/api/bookingApi";
import type { FileExportType } from "@/utils/fileExportDownload";

const FORMAT_OPTIONS: Array<{
  type: FileExportType;
  label: string;
  detail: string;
  icon: typeof FileSpreadsheet;
}> = [
  { type: "excel", label: "Excel", detail: ".xlsx", icon: FileSpreadsheet },
  { type: "csv", label: "CSV", detail: ".csv", icon: FileText },
];

interface TripHistoryExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  selectedBookingCount: number;
  onClose: () => void;
  onExport: (type: FileExportType, fields: string[]) => Promise<boolean>;
}

export const TripHistoryExportModal = ({
  isOpen,
  isExporting,
  selectedBookingCount,
  onClose,
  onExport,
}: TripHistoryExportModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [format, setFormat] = useState<FileExportType>("excel");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching, isError, refetch } = useGetTripHistoryExportFieldsQuery(
    undefined,
    { skip: !isOpen },
  );
  const fields = data?.data || [];

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      setSelectedKeys([]);
      setSearch("");
      return;
    }
    dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && fields.length > 0 && !initializedRef.current) {
      setSelectedKeys(fields.map((field) => field.key));
      initializedRef.current = true;
    }
  }, [fields, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isExporting, isOpen, onClose]);

  useEffect(() => {
    if (isOpen && isError) {
      toast.error("Could not load the columns available for export. Please try again.", {
        id: "trip-history-export-fields-error",
      });
    }
  }, [isError, isOpen]);

  const visibleFields = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fields;
    return fields.filter(
      (field) =>
        field.header.toLowerCase().includes(term) || field.key.toLowerCase().includes(term),
    );
  }, [fields, search]);

  if (!isOpen) return null;

  const selectedSet = new Set(selectedKeys);
  const toggleField = (field: ITripHistoryExportField) => {
    setSelectedKeys((current) =>
      current.includes(field.key)
        ? current.filter((key) => key !== field.key)
        : fields
            .filter((item) => current.includes(item.key) || item.key === field.key)
            .map((item) => item.key),
    );
  };

  const submit = async () => {
    if (selectedKeys.length === 0 || isExporting) return;
    const succeeded = await onExport(format, selectedKeys);
    if (succeeded) onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="fixed inset-0 bg-ink/55 backdrop-blur-xs animate-in fade-in duration-200"
        aria-label="Close export dialog"
        disabled={isExporting}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-export-title"
        aria-describedby="trip-export-description"
        tabIndex={-1}
        className="relative z-10 flex max-h-[min(760px,calc(100vh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line-2 bg-white shadow-2xl outline-none animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-2 px-5 py-4 sm:px-6">
          <div>
            <h2 id="trip-export-title" className="text-lg font-semibold text-ink">
              Export trip history
            </h2>
            <p id="trip-export-description" className="mt-1 text-xs leading-relaxed text-ink-4">
              Choose a file format and the columns to include. Columns stay in the order shown.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close export dialog"
            className="rounded-lg p-1.5 text-ink-4 transition-colors hover:bg-bg hover:text-ink disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {selectedBookingCount > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary-tint/40 px-3.5 py-2.5 text-xs text-primary-dark">
              This export will include only the {selectedBookingCount} selected booking
              {selectedBookingCount === 1 ? "" : "s"}.
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-ink">File format</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FORMAT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = format === option.type;
                return (
                  <label
                    key={option.type}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${active ? "border-primary bg-primary-tint/40 text-primary-dark" : "border-line-2 text-ink-3 hover:bg-bg"}`}
                  >
                    <input
                      type="radio"
                      name="trip-export-format"
                      value={option.type}
                      checked={active}
                      disabled={isExporting}
                      onChange={() => setFormat(option.type)}
                      className="sr-only"
                    />
                    <Icon size={18} aria-hidden="true" />
                    <span className="text-xs font-semibold">{option.label}</span>
                    <span className="ml-auto text-[11px] text-ink-4">{option.detail}</span>
                    {active && <Check size={14} aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <section aria-labelledby="trip-export-columns-title">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 id="trip-export-columns-title" className="text-xs font-semibold text-ink">
                  Columns
                </h3>
                <p className="mt-0.5 text-[11px] text-ink-4" aria-live="polite">
                  {selectedKeys.length} of {fields.length} selected
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!fields.length || isExporting}
                  onClick={() => setSelectedKeys(fields.map((field) => field.key))}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-tint disabled:opacity-40"
                >
                  Select all
                </button>
                <button
                  type="button"
                  disabled={!selectedKeys.length || isExporting}
                  onClick={() => setSelectedKeys([])}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-4 hover:bg-bg hover:text-ink disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>
            </div>

            {fields.length > 8 && (
              <label className="relative mb-2 block">
                <span className="sr-only">Search export columns</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={15} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search columns..."
                  className="h-9 w-full rounded-xl border border-line-2 bg-white pl-9 pr-3 text-xs text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
            )}

            <div className="min-h-36 overflow-hidden rounded-xl border border-line-2">
              {isLoading || (isFetching && !data) ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-ink-4">
                  <Loader2 size={22} className="animate-spin text-primary" />
                  <span className="text-xs">Loading available columns...</span>
                </div>
              ) : isError ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
                  <AlertCircle size={22} className="text-urgent" />
                  <p className="text-xs font-medium text-ink">Could not load export columns.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : fields.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center px-4 text-center text-xs text-ink-4">
                  No exportable columns are available for your account.
                </div>
              ) : visibleFields.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center px-4 text-center text-xs text-ink-4">
                  No columns match “{search}”.
                </div>
              ) : (
                <div className="grid max-h-64 grid-cols-1 overflow-y-auto p-2 sm:grid-cols-2">
                  {visibleFields.map((field) => (
                    <label
                      key={field.key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-ink transition-colors hover:bg-bg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSet.has(field.key)}
                        disabled={isExporting}
                        onChange={() => toggleField(field)}
                        className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
                      />
                      <span className="min-w-0 truncate font-medium" title={field.header}>
                        {field.header}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line-2 bg-bg/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            icon={isExporting ? Loader2 : Download}
            disabled={isExporting || isLoading || isError || selectedKeys.length === 0}
            onClick={submit}
            className={isExporting ? "[&_svg]:animate-spin" : ""}
          >
            {isExporting
              ? "Preparing export..."
              : `Export ${format === "excel" ? "Excel" : format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
