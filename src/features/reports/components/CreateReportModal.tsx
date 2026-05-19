import { useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';

interface CreateReportModalProps {
  onClose: () => void;
  onSave: (reason: string) => void;
}

export const CreateReportModal = ({ onClose, onSave }: CreateReportModalProps) => {
  const [reason, setReason] = useState('Rider not present');
  const reasons = [
    { id: 'Rider not present', label: 'Rider not present', sub: 'Rider is not available at the pickup location.' },
    { id: 'Incorrect pickup location', label: 'Incorrect pickup location', sub: 'Pickup address is missing or cannot be located.' },
    { id: 'Rider behavior issue', label: 'Rider behavior issue', sub: 'Rider behavior caused a problem during the trip.' },
    { id: 'Excessive wait time', label: 'Excessive wait time', sub: 'Rider caused an unusually long wait at pickup.' },
    { id: 'Other reason', label: 'Other reason', sub: "I'll explain to dispatch if needed" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <Card className="relative w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-line-2">
        <div className="flex items-center justify-between p-6 border-b border-line-2 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-urgent-light rounded-xl flex items-center justify-center border border-urgent/10">
              <AlertOctagon size={20} className="text-urgent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink leading-none">Report Incident</h2>
              <p className="text-xs text-ink-3 mt-1 font-medium">Flag a safety or service issue for internal review.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg text-ink-4 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
          {reasons.map(r => (
            <label key={r.id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${reason === r.id ? 'border-urgent bg-urgent-light/20 shadow-sm' : 'border-line-2 hover:border-line'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${reason === r.id ? 'border-urgent' : 'border-line-2'}`}>
                {reason === r.id && <div className="w-2.5 h-2.5 rounded-full bg-urgent" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{r.label}</p>
                <p className="text-xs font-medium text-ink-3 leading-tight mt-0.5">{r.sub}</p>
              </div>
              <input type="radio" className="hidden" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
            </label>
          ))}
        </div>
        <div className="p-6 bg-bg/50 border-t border-line-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => onSave(reason)}>File Report</Button>
        </div>
      </Card>
    </div>
  );
};
