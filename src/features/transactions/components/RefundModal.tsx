import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { money } from '@/utils/helpers';

interface RefundModalProps {
  showRefundModal: any;
  onClose: () => void;
  onConfirm: () => void;
}

export const RefundModal = ({ showRefundModal, onClose, onConfirm }: RefundModalProps) => {
  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-urgent-light text-urgent rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-xl font-semibold text-ink mb-2">Issue Refund?</h3>
        <p className="text-sm text-ink-3 mb-6 leading-relaxed">
          Are you sure you want to refund <span className="font-medium text-ink">{money(showRefundModal.amount)}</span> to <span className="font-medium text-ink">{showRefundModal.rider.name}</span>? This action cannot be undone.
        </p>
        <div className="p-4 bg-bg rounded-xl border border-line-2 mb-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-4">Transaction ID</span>
            <span className="font-mono text-ink">{showRefundModal.id}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-4">Linked Trip</span>
            <span className="font-mono text-ink">{showRefundModal.tripId}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>Confirm Refund</Button>
        </div>
      </div>
    </div>
  );
};
