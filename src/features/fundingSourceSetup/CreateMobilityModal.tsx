import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Accessibility, AlertTriangle, ImagePlus, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { useCreateMobilityMutation, type IMobility } from "@/redux/api/mobilityApi";
import { checkUploadFile } from "@/shared/utils/fileSecurity";
import { getUserFacingApiError } from "@/utils/apiError";

interface CreateMobilityModalProps {
  /** Existing mobility names, to block duplicates (case-insensitive). */
  existingNames: string[];
  onClose: () => void;
  /** Called with the new mobility so the caller can select it. */
  onCreated?: (mobility: IMobility) => void;
}

const MAX_ICON_BYTES = 2 * 1024 * 1024;

const inputClass =
  "mt-1.5 h-10 w-full rounded-xl border border-line-2 bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

/** Create a mobility type (e.g. Wheelchair) without leaving the funding source form. */
export const CreateMobilityModal = ({
  existingNames,
  onClose,
  onCreated,
}: CreateMobilityModalProps) => {
  const [createMobility, { isLoading }] = useCreateMobilityMutation();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, onClose]);

  useEffect(
    () => () => {
      if (iconPreview) URL.revokeObjectURL(iconPreview);
    },
    [iconPreview],
  );

  const pickIcon = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_ICON_BYTES) {
      setError("Icon must be under 2 MB.");
      return;
    }
    const problem = await checkUploadFile(file, "image");
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setIcon(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const clearIcon = () => {
    setIcon(null);
    setIconPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const amount = Number(price);
    if (!trimmed) return setError("Mobility name is required.");
    if (existingNames.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())) {
      return setError(`"${trimmed}" already exists — pick it from the list instead.`);
    }
    if (price.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      return setError("Price must be 0 or more.");
    }

    try {
      const res = await createMobility({
        name: trimmed,
        price: amount,
        ...(icon ? { image: icon } : {}),
      }).unwrap();
      if (!res.data?._id) throw new Error("Mobility was created but no id was returned");
      toast.success(`Mobility "${trimmed}" created`);
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : getUserFacingApiError(err));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 sm:p-6">
      <div className="absolute inset-0" onClick={() => !isLoading && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-mobility-title"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line-2 px-6 py-5">
          <div>
            <h3
              id="create-mobility-title"
              className="flex items-center gap-2 text-lg font-semibold text-ink"
            >
              <Accessibility className="text-primary" size={20} /> New Mobility
            </h3>
            <p className="mt-0.5 text-sm text-ink-3">
              A rider mobility need, e.g. Ambulatory or Wheelchair.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-ink-4 transition-colors hover:bg-bg hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <label className="block text-sm font-medium">
              Name *
              <input
                className={inputClass}
                value={name}
                maxLength={60}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Wheelchair"
                autoFocus
              />
            </label>

            <label className="block text-sm font-medium">
              Price *
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (error) setError("");
                }}
              />
            </label>

            <div>
              <span className="block text-sm font-medium">Icon</span>
              <div className="mt-1.5 flex items-center gap-3">
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt=""
                    className="h-10 w-10 rounded-lg border border-line-2 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-line-2 text-ink-4">
                    <ImagePlus size={16} />
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10"
                  onClick={() => fileRef.current?.click()}
                >
                  {icon ? "Change" : "Upload"}
                </Button>
                {icon && (
                  <button
                    type="button"
                    onClick={clearIcon}
                    className="text-xs font-semibold text-urgent hover:underline"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => void pickIcon(e.target.files?.[0])}
                />
              </div>
              <p className="mt-1 text-xs text-ink-4">Optional · PNG or JPG, up to 2 MB.</p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-6 mb-4 flex items-center gap-2 rounded-xl border border-urgent/20 bg-urgent-light px-4 py-3 text-xs font-semibold text-urgent"
            >
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex shrink-0 justify-end gap-3 border-t border-line-2 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isLoading ? "Creating…" : "Create mobility"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
