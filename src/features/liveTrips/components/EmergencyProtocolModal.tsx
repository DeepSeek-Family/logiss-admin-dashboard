import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

interface EmergencyProtocolModalProps {
  onClose: () => void;
}

export const EmergencyProtocolModal: React.FC<EmergencyProtocolModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-urgent-light rounded-xl flex items-center justify-center text-urgent">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-ink">Emergency Protocol</h3>
          <p className="text-xs text-ink-4">Active incident response</p>
        </div>
      </div>
      <div className="space-y-3">
        <a href="tel:911" className="flex items-center justify-between p-4 bg-urgent-light rounded-xl border border-urgent/20 hover:bg-urgent/10 transition-colors">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-urgent" />
            <div>
              <p className="text-sm font-medium text-ink">Call 911</p>
              <p className="text-xs text-ink-4">Police / Ambulance</p>
            </div>
          </div>
          <span className="text-xs font-medium text-urgent">911</span>
        </a>
        <a href="tel:+18045550911" className="flex items-center justify-between p-4 bg-bg rounded-xl border border-line-2 hover:bg-primary-light transition-colors">
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-ink">Logiss Emergency Line</p>
              <p className="text-xs text-ink-4">(804) 555-0911</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">Call</span>
        </a>
      </div>
      <button
        onClick={onClose}
        className="w-full mt-4 py-2.5 text-sm font-medium text-ink-4 hover:text-ink transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);
