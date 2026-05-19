import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface SendWarningModalProps {
  name: string;
  onClose: () => void;
}

export const SendWarningModal = ({ name, onClose }: SendWarningModalProps) => {
  const [msg, setMsg] = useState(
    `Dear ${name},\n\nThis is an official warning regarding a recent incident report filed against you. Please review the incident details and ensure compliance with our service guidelines.\n\nFurther violations may result in account suspension.\n\n— Logiss Operations Team`
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-line-2 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-warning-light rounded-xl flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-ink">Send Warning Notice</h3>
              <p className="text-xs text-ink-4">To: {name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-bg rounded-lg text-ink-4 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5">
          <textarea
            rows={8}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            className="w-full bg-bg border border-line-2 rounded-xl px-4 py-3 text-sm text-ink font-medium resize-none outline-none focus:border-warning/50 focus:ring-1 focus:ring-warning/20 transition-all leading-relaxed"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line-2 bg-bg/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" icon={AlertTriangle} className="border-warning/20 text-warning hover:bg-warning-light" onClick={onClose}>
            Send Warning
          </Button>
        </div>
      </div>
    </div>
  );
};
