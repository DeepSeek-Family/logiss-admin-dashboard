import React from 'react';
import { Shield, ClipboardCheck, FileText, Wrench, ShieldCheck } from 'lucide-react';
import { Badge } from '@/shared/components/ui';

interface FleetComplianceTabProps {
  vehicle: any;
}

export const FleetComplianceTab: React.FC<FleetComplianceTabProps> = ({ vehicle }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
      <div className="space-y-8">
        <h3 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 border-b border-line-2 pb-2">Insurance & Coverage</h3>
        <div className="bg-bg/40 rounded-3xl border border-line-2 p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield size={120} />
          </div>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent-light/20 text-accent flex items-center justify-center shadow-inner">
              <Shield size={32} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] leading-none">Policy Number</p>
              <p className="text-2xl font-semibold text-ink mt-2">{vehicle.insurance?.policy || 'N/A'}</p>
            </div>
          </div>
          <div className="pt-6 border-t border-line-2 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Expiration Date</span>
              <span className="text-sm text-ink">{vehicle.insurance?.expires || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Carrier</span>
              <span className="text-sm font-semibold text-primary">{vehicle.insurance?.provider || 'N/A'}</span>
            </div>
            <Badge variant={vehicle.insurance?.status === 'valid' ? 'accent' : 'warning'} className="w-full justify-center py-3 text-xs font-medium rounded-xl">
              {vehicle.insurance?.status.toUpperCase() || 'UNKNOWN'} PROTECTION ACTIVE
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5 border-b border-line-2 pb-2">Operating Authorities</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            ['DOT Operating Authority', 'Active', 'accent', ClipboardCheck],
            ['City Business License', 'Active', 'accent', FileText],
            ['Safety Inspection', 'Due 09/24', 'warning', Wrench],
            ['Fleet Bio-Safety Cert', 'Active', 'accent', ShieldCheck]
          ].map(([label, status, color, Icon]: any) => (
            <div key={label} className="flex items-center justify-between p-5 bg-bg/40 rounded-2xl border border-line-2 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-4">
                <Icon size={16} className="text-ink-3 group-hover:text-primary" />
                <span className="text-xs font-medium text-ink">{label}</span>
              </div>
              <Badge variant={color as any} className="text-xs font-medium px-3">{status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
