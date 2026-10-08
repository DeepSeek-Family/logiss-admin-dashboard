import { useState } from 'react';
import {
  CheckCircle2, MapPin, Phone, Mail, XCircle,
  FileCheck, FileText, Eye, X,
} from 'lucide-react';
import { Avatar, Button } from '@/shared/components/ui';
import type { MappedDriverApplication } from '../utils/helpers';

const STAGES = [
  { id: 1, label: 'Submitted' },
  { id: 2, label: 'Under Review' },
  { id: 3, label: 'Background Check' },
  { id: 4, label: 'Approved' },
];

const APP_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Under Review', color: 'text-warning bg-warning/10' },
  reviewing: { label: 'Under Review', color: 'text-warning bg-warning/10' },
  approved: { label: 'Approved', color: 'text-accent bg-accent/10' },
  rejected: { label: 'Rejected', color: 'text-urgent bg-urgent/10' },
};

const na = (value?: string | number | null) => {
  if (value === 0) return '0';
  const text = value == null ? '' : String(value).trim();
  return text || 'N/A';
};

interface ApplicationDetailsProps {
  selectedApp: MappedDriverApplication;
  onReject?: () => void;
  onApprove?: () => void;
  actionsDisabled?: boolean;
}

export const ApplicationDetails = ({
  selectedApp,
  onReject,
  onApprove,
  actionsDisabled = false,
}: ApplicationDetailsProps) => {
  const stageIndex = selectedApp.stage || 2;
  const appStatus = selectedApp.status || 'pending';
  const isApproved = appStatus === 'approved';
  const isRejected = appStatus === 'rejected';
  const isFrozen = isApproved || isRejected;
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const docs = [
    { id: 'dl', label: 'Driver License Photo', detail: "Driver's license", images: selectedApp.licenseImages || [] },
    { id: 'ins', label: 'Insurance Certificate', detail: 'Insurance policy', images: [] as string[] },
    { id: 'reg', label: 'Vehicle Registration', detail: 'Vehicle registration', images: [] as string[] },
    { id: 'nemt', label: 'NEMT Certification', detail: 'NEMT certification', images: [] as string[] },
  ];
  const providedCount = docs.filter((doc) => doc.images.length > 0).length;

  return (
    <>
      {viewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewUrl(null)}>
          <div className="bg-white rounded-2xl border border-line-2 shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-line-2">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-ink-4" />
                <span className="text-sm font-semibold text-ink">Driver License Photo</span>
              </div>
              <button type="button" onClick={() => setViewUrl(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-4 hover:bg-bg transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="bg-bg flex items-center justify-center p-4 min-h-64">
              <img src={viewUrl} alt="Driver license" className="max-h-80 w-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-white rounded-2xl border border-line-2 shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-line-2">
          <p className="text-xs text-ink-4 mb-3">#{selectedApp.id || 'N/A'}</p>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar initials={selectedApp.initials || '?'} src={selectedApp.image} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-ink">{selectedApp.name || 'N/A'}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-ink-4 mt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {selectedApp.county || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Phone size={12} /> {selectedApp.phone || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Mail size={12} /> {selectedApp.email || 'N/A'}</span>
                </div>
              </div>
            </div>
            {(() => {
              const sc = APP_STATUS_CFG[appStatus] || APP_STATUS_CFG.pending;
              return (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${sc.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {sc.label}
                </span>
              );
            })()}
          </div>

          <div className="mt-5 flex items-start">
            {STAGES.map((s, i) => {
              const done = s.id < stageIndex;
              const active = s.id === stageIndex;
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && <div className={`absolute top-3 right-1/2 w-full h-0.5 ${done || active ? 'bg-accent' : 'bg-line-2'}`} />}
                  {i < STAGES.length - 1 && <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done ? 'bg-accent' : 'bg-line-2'}`} />}
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 bg-white ${
                    done ? 'border-accent bg-accent text-white' :
                    active ? 'border-warning text-warning ring-4 ring-warning/10' : 'border-line-2 text-ink-4'
                  }`}>
                    {done ? <CheckCircle2 size={13} strokeWidth={2.5} /> : s.id}
                  </div>
                  <span className={`mt-1.5 text-[10px] font-medium text-center leading-tight ${active ? 'text-warning' : done ? 'text-accent' : 'text-ink-4'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isApproved && (
            <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 bg-accent/8 border border-accent/20 rounded-xl">
              <CheckCircle2 size={15} className="text-accent shrink-0" />
              <p className="text-xs font-semibold text-accent">Application approved</p>
            </div>
          )}
          {isRejected && (
            <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 bg-urgent/6 border border-urgent/20 rounded-xl">
              <XCircle size={15} className="text-urgent shrink-0" />
              <p className="text-xs font-semibold text-urgent">Application rejected</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 px-6 py-5 border-b border-line-2">
            <div className="col-span-2">
              <p className="text-sm font-bold text-ink mb-4">Driver & qualifications</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><p className="text-[10px] text-ink-4 mb-0.5">License number</p><p className="text-xs font-semibold text-ink">{na(selectedApp.licenseNumber)}</p></div>
                <div><p className="text-[10px] text-ink-4 mb-0.5">Class</p><p className="text-xs font-semibold text-ink">{selectedApp.licenseClass ? `Class ${selectedApp.licenseClass}` : 'N/A'}</p></div>
                <div><p className="text-[10px] text-ink-4 mb-0.5">Expires</p><p className="text-xs font-semibold text-ink">{na(selectedApp.licenseExpires)}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-[10px] text-ink-4 mb-0.5">Experience</p><p className="text-xs font-semibold text-ink">{na(selectedApp.experience)}</p></div>
                <div>
                  <p className="text-[10px] text-ink-4 mb-1">Certifications</p>
                  <p className="text-xs font-semibold text-ink">N/A</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-4 mb-0.5">Background Check</p>
                  <p className="text-xs font-semibold text-ink">N/A</p>
                </div>
              </div>
            </div>
            <div className="border-l border-line-2 pl-6">
              <p className="text-sm font-bold text-ink mb-4">Vehicle & insurance</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: 'Vehicle', v: 'N/A' },
                  { k: 'Vehicle type', v: 'N/A' },
                  { k: 'Policy', v: 'N/A' },
                  { k: 'Insurance expires', v: 'N/A' },
                ].map(({ k, v }) => (
                  <div key={k}><p className="text-[10px] text-ink-4 mb-0.5">{k}</p><p className="text-xs font-semibold text-ink">{v}</p></div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-ink">Documents</p>
              <span className={`text-xs font-semibold ${providedCount === docs.length ? 'text-accent' : 'text-ink-4'}`}>
                {providedCount}/{docs.length} provided
              </span>
            </div>
            <div className="border border-line-2 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_2fr_auto_auto] gap-3 px-4 py-2 bg-bg border-b border-line-2">
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Document</span>
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Details</span>
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Status</span>
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Actions</span>
              </div>
              {docs.map((doc) => {
                const provided = doc.images.length > 0;
                return (
                  <div key={doc.id} className={`grid grid-cols-[2fr_2fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-line-2 last:border-0 ${provided ? 'bg-accent/3' : 'bg-white'}`}>
                    <div className="flex items-center gap-2">
                      {provided ? <CheckCircle2 size={14} className="text-accent" /> : <FileText size={14} className="text-ink-3" />}
                      <span className="text-xs font-medium text-ink">{doc.label}</span>
                    </div>
                    <span className="text-xs text-ink-4">{provided ? doc.detail : 'N/A'}</span>
                    {provided ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-accent/8 border-accent/20 text-accent">
                        <CheckCircle2 size={10} /> Provided
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-ink-4">N/A</span>
                    )}
                    <div className="flex items-center gap-1">
                      {provided ? (
                        <button
                          type="button"
                          onClick={() => setViewUrl(doc.images[0])}
                          title="View document"
                          className="w-7 h-7 rounded-lg border border-line-2 flex items-center justify-center text-ink-4 hover:text-primary hover:border-primary/30 transition-all bg-white"
                        >
                          <Eye size={12} />
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-ink-4 w-7 text-center">N/A</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-white border-t border-line-2 flex items-center gap-3">
          {!isFrozen ? (
            <>
              <button
                type="button"
                onClick={onReject}
                disabled={actionsDisabled}
                className="flex items-center gap-1.5 text-sm font-semibold text-urgent hover:opacity-75 transition-opacity disabled:opacity-40"
              >
                <XCircle size={16} /> Reject
              </button>
              <div className="flex-1" />
              <Button variant="primary" icon={FileCheck} className="h-9 text-sm" onClick={onApprove} disabled={actionsDisabled}>
                Approve application
              </Button>
            </>
          ) : (
            <p className={`text-sm font-semibold ${isApproved ? 'text-accent' : 'text-urgent'}`}>
              {isApproved ? 'Application approved' : 'Application rejected'}
            </p>
          )}
        </div>
      </div>
    </>
  );
};
