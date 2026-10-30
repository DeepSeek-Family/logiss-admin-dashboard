import { useState } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { Button } from "./Button";
import type { FileExportType } from "@/utils/fileExportDownload";

const EXPORT_OPTIONS: { type: FileExportType; label: string }[] = [
  { type: "excel", label: "Excel (.xlsx)" },
  { type: "csv", label: "CSV (.csv)" },
  { type: "pdf", label: "PDF (.pdf)" },
];

interface ExportFormatMenuProps {
  onExport: (type: FileExportType) => void | Promise<void>;
  exportingType?: FileExportType | null;
  disabled?: boolean;
  buttonLabel?: string;
}

export const ExportFormatMenu = ({
  onExport,
  exportingType = null,
  disabled = false,
  buttonLabel = "Export",
}: ExportFormatMenuProps) => {
  const [open, setOpen] = useState(false);
  const isBusy = Boolean(exportingType);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        icon={isBusy ? Loader2 : Download}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className={`shadow-sm border-line text-ink-3 hover:text-ink hover:bg-bg transition-all h-9 pr-2 ${isBusy ? "[&_svg]:animate-spin opacity-70" : ""}`}
      >
        <span className="flex items-center gap-1">
          {isBusy && exportingType ? `Exporting ${exportingType.toUpperCase()}…` : buttonLabel}
          <ChevronDown
            size={14}
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </span>
      </Button>

      {open && !disabled ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[168px] py-1 bg-white border border-line-2 rounded-xl shadow-lg">
            {EXPORT_OPTIONS.map((option) => {
              const loading = exportingType === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-ink hover:bg-bg transition-colors disabled:opacity-60 flex items-center gap-2"
                  onClick={async () => {
                    setOpen(false);
                    await onExport(option.type);
                  }}
                >
                  {loading ? <Loader2 size={12} className="animate-spin shrink-0" /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};
