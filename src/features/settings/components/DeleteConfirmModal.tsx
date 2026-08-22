import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal = ({
  isOpen,
  title,
  message,
  itemLabel,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-line-2 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-urgent-light flex items-center justify-center text-urgent shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="type-section-title text-ink">{title}</h3>
            <p className="text-xs text-ink-3">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-ink-2 mb-4 leading-relaxed">
          {message}
          {itemLabel && (
            <span className="block mt-2 font-semibold text-ink px-3 py-1.5 bg-bg rounded-lg border border-line-2">
              {itemLabel}
            </span>
          )}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={15} className="mr-1.5" />
            Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
};
