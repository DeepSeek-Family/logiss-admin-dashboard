import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'urgent' | 'accent' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    primary: {
      iconBg: 'bg-primary/10 text-primary border-primary/20',
      icon: CheckCircle2,
      btnVariant: 'primary' as const,
    },
    accent: {
      iconBg: 'bg-accent/10 text-accent border-accent/20',
      icon: CheckCircle2,
      btnVariant: 'accent' as const,
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: AlertTriangle,
      btnVariant: 'primary' as const,
    },
    urgent: {
      iconBg: 'bg-urgent/10 text-urgent border-urgent/20',
      icon: AlertTriangle,
      btnVariant: 'danger' as const,
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const IconComponent = currentVariant.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-line-2 p-6 animate-in zoom-in-95 fade-in duration-200 z-10">
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-bg transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border shrink-0 ${currentVariant.iconBg}`}>
            <IconComponent size={24} />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-semibold text-ink leading-snug">{title}</h3>
            <p className="text-xs text-ink-4 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-line-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={currentVariant.btnVariant}
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
