import {
  CheckCircle2,
  Car,
  ShieldCheck,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  FileCheck
} from 'lucide-react';
import { Card, Avatar, Badge, Button } from '@/shared/components/ui';

interface ApplicationDetailsProps {
  selectedApp: any;
  stages: { id: number; label: string }[];
}

export const ApplicationDetails = ({ selectedApp, stages }: ApplicationDetailsProps) => {
  return (
    <Card className="flex flex-col h-fit rounded-2xl border-2 border-line-2 shadow-sm">
      <div className="p-6 border-b border-line-2 flex items-center justify-between bg-tint/10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-4 tracking-normal">#{selectedApp?.id || '---'}</span>
          <h2 className="text-lg font-semibold text-ink">Application Details</h2>
        </div>
        <Badge variant="warning">{stages.find(s => s.id === selectedApp?.stage)?.label || 'Pending'}</Badge>
      </div>

      <div className="p-6 space-y-8">
        {/* Stage Timeline */}
        <section>
          <div className="bg-bg p-4 rounded-xl border border-line-2">
            <div className="flex justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-line-2 -translate-y-1/2 -z-10 mx-10"></div>
              {stages.map(s => (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-bg px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    s.id < (selectedApp?.stage || 0) ? 'bg-accent border-accent text-white' :
                    (s.id === selectedApp?.stage ? 'bg-white border-warning text-warning ring-4 ring-warning-light' : 'bg-white border-line-2 text-ink-4')
                  }`}>
                    {s.id < (selectedApp?.stage || 0) ? <CheckCircle2 size={16} /> : <span className="text-xs font-medium">{s.id}</span>}
                  </div>
                  <span className={`text-xs font-medium ${s.id === selectedApp?.stage ? 'text-warning' : (s.id < (selectedApp?.stage || 0) ? 'text-accent' : 'text-ink-4')}`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section>
          <h4 className="text-sm font-semibold text-ink mb-4">Personal Information</h4>
          <div className="flex items-center gap-6">
            <Avatar initials={selectedApp.initials} size="xl" />
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
              <div>
                <p className="text-xs text-ink-4 mb-0.5">Full Name</p>
                <p className="text-sm font-medium text-ink">{selectedApp?.name || '---'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-4 mb-0.5">County</p>
                <p className="text-sm font-medium text-ink">{selectedApp?.county || '---'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-4 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-ink">{selectedApp?.phone || '(804) 555-0000'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-4 mb-0.5">Email</p>
                <p className="text-sm font-medium text-ink">{selectedApp?.email || (selectedApp?.name ? `${selectedApp.name.toLowerCase().replace(' ', '.')}@email.com` : '---')}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-8">
          {/* Driver's License */}
          <section>
            <h4 className="text-sm font-semibold text-ink mb-3">Driver's License</h4>
            <div className="bg-bg rounded-xl border border-line-2 p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-4 mb-0.5">License No.</p>
                <p className="text-xs text-ink">{selectedApp?.license?.number || '---'}</p>
              </div>
              <div>
                <p className="text-xs text-ink-4 mb-0.5">Class</p>
                <p className="text-xs font-medium text-ink">{selectedApp?.license?.class || 'Standard'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-ink-4 mb-0.5">Expires</p>
                <p className="text-xs font-medium text-ink">{selectedApp?.license?.expires || '---'}</p>
              </div>
            </div>
          </section>

          {/* Vehicle & Insurance */}
          <section>
            <h4 className="text-sm font-semibold text-ink mb-3">Vehicle & Insurance</h4>
            <div className="bg-bg rounded-xl border border-line-2 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Car size={14} className="text-ink-4" />
                <p className="text-xs font-medium text-ink">{selectedApp?.vehicle?.year || ''} {selectedApp?.vehicle?.make || 'No Vehicle'}</p>
                <Badge variant="neutral">{selectedApp?.vehicle?.type || 'Standard'}</Badge>
              </div>
              <div className="flex justify-between items-center border-t border-line-2 pt-2">
                <div>
                  <p className="text-xs text-ink-4 mb-0.5">Policy</p>
                  <p className="text-xs text-ink">INS-88291</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-4 mb-0.5">Expires</p>
                  <p className="text-xs font-medium text-ink">2025-12-14</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Certifications */}
        <section>
          <h4 className="text-sm font-semibold text-ink mb-3">Certifications & Experience</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {(selectedApp?.certs || []).map((cert: string) => (
              <Badge key={cert} variant="accent" className="py-1 px-3">{cert} Certified</Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-bg rounded-xl border border-line-2">
              <p className="text-xs text-ink-4 mb-0.5">Experience</p>
              <p className="text-xs font-medium text-ink">{selectedApp?.experience || '0 years'}</p>
            </div>
            <div className="p-3 bg-bg rounded-xl border border-line-2">
              <p className="text-xs text-ink-4 mb-0.5">Background Check</p>
              <p className="text-xs text-accent flex items-center gap-1.5">
                <ShieldCheck size={14} /> Authorized
              </p>
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section>
          <h4 className="text-sm font-semibold text-ink mb-3">Document Verification</h4>
          <div className="space-y-2">
            {[
              { label: 'Driver License Photo', verified: true },
              { label: 'Insurance Certificate', verified: true },
              { label: 'Vehicle Registration', verified: false },
              { label: 'NEMT Certification', verified: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-bg border border-line-2">
                <span className="text-xs font-medium text-ink">{item.label}</span>
                {item.verified ? (
                  <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
                    <CheckCircle2 size={14} /> Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-warning text-xs font-medium">
                    <AlertCircle size={14} /> Pending
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-4 bg-white border-t border-line-2 flex gap-3 sticky bottom-0">
        <Button variant="ghost" className="text-urgent hover:bg-urgent-light flex-1" icon={XCircle}>Reject</Button>
        <Button variant="outline" className="flex-1" icon={MoreHorizontal}>Request Info</Button>
        <Button variant="primary" className="flex-1" icon={FileCheck}>Approve</Button>
      </div>
    </Card>
  );
};
