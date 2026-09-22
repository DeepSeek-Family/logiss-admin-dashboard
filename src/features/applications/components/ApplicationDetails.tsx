import { useState } from 'react';
import {
  CheckCircle2, MapPin, Phone, Mail, AlertCircle, XCircle,
  MessageSquare, FileCheck, ShieldCheck, FileText,
  Eye, Check, X, Download, ZoomIn, ArrowRight
} from 'lucide-react';
import { Avatar, Button } from '@/shared/components/ui';

type DocStatus = 'uploaded' | 'verified' | 'rejected';
interface Doc { id: string; label: string; detail: string; }

const DOCS: Doc[] = [
  { id: 'dl',   label: 'Driver License Photo',  detail: "Driver's license"    },
  { id: 'ins',  label: 'Insurance Certificate', detail: 'Insurance policy'    },
  { id: 'reg',  label: 'Vehicle Registration',  detail: 'Vehicle registration' },
  { id: 'nemt', label: 'NEMT Certification',    detail: 'NEMT certification'  },
];

const STATUS_CFG: Record<DocStatus, { label: string; color: string; bg: string }> = {
  uploaded: { label: 'Uploaded', color: 'text-ink-3',  bg: 'bg-bg border-line-2'        },
  verified: { label: 'Verified', color: 'text-accent', bg: 'bg-accent/8 border-accent/20' },
  rejected: { label: 'Rejected', color: 'text-urgent', bg: 'bg-urgent/8 border-urgent/20' },
};

const APP_STATUS_CFG: Record<string, { label: string; color: string }> = {
  reviewing:        { label: 'Under Review',   color: 'text-warning bg-warning/10'    },
  info_requested:   { label: 'Awaiting Info',  color: 'text-primary bg-primary/10'    },
  approved:         { label: 'Approved',       color: 'text-accent bg-accent/10'      },
  rejected:         { label: 'Rejected',       color: 'text-urgent bg-urgent/10'      },
};

interface ApplicationDetailsProps {
  selectedApp: any;
  stages: { id: number; label: string }[];
  docStatuses: Record<string, DocStatus>;
  onDocStatusChange: (docId: string, status: DocStatus) => void;
  onReject?: () => void;
  onRequestInfo?: () => void;
  onApprove?: () => void;
  onSendToBackgroundCheck?: () => void;
  actionsDisabled?: boolean;
}

export const ApplicationDetails = ({
  selectedApp, stages,
  docStatuses, onDocStatusChange,
  onReject, onRequestInfo, onApprove, onSendToBackgroundCheck, actionsDisabled = false,
}: ApplicationDetailsProps) => {
  const stageIndex    = selectedApp?.stage || 0;
  const appStatus     = selectedApp?._status || 'reviewing';
  const [viewDoc, setViewDoc] = useState<Doc | null>(null);

  const verifiedCount = DOCS.filter(d => docStatuses[d.id] === 'verified').length;
  const allVerified   = verifiedCount === DOCS.length;
  const pendingCount  = DOCS.filter(d => docStatuses[d.id] === 'uploaded').length;
  const rejectedCount = DOCS.filter(d => docStatuses[d.id] === 'rejected').length;

  const isApproved = appStatus === 'approved';
  const isRejected = appStatus === 'rejected';
  const isFrozen   = isApproved || isRejected;

  return (
    <>
      {/* ── DOCUMENT VIEWER MODAL ────────────────── */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl border border-line-2 shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-line-2">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-ink-4" />
                <span className="text-sm font-semibold text-ink">{viewDoc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Download size={13} /> Download
                </button>
                <button onClick={() => setViewDoc(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-4 hover:bg-bg transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="h-64 bg-bg flex flex-col items-center justify-center text-ink-4">
              <ZoomIn size={32} className="opacity-25 mb-2" />
              <p className="text-sm font-medium">Document Preview</p>
              <p className="text-xs mt-1 opacity-60">{viewDoc.detail} · uploaded by applicant</p>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 border-t border-line-2 bg-white">
              {(() => { const s = docStatuses[viewDoc.id] || 'uploaded'; const c = STATUS_CFG[s];
                return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.bg} ${c.color}`}>
                  {s === 'verified' && <CheckCircle2 size={11} />}
                  {s === 'rejected' && <XCircle size={11} />}
                  {s === 'uploaded' && <AlertCircle size={11} />}
                  {c.label}
                </span>;
              })()}
              <div className="flex-1" />
              {!isFrozen && <>
                <button onClick={() => { onDocStatusChange(viewDoc.id, 'rejected'); setViewDoc(null); }}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-urgent border border-urgent/20 hover:bg-urgent/5 transition-colors">
                  <X size={13} /> Reject
                </button>
                <button onClick={() => { onDocStatusChange(viewDoc.id, 'verified'); setViewDoc(null); }}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent/90 transition-colors">
                  <Check size={13} /> Mark Verified
                </button>
              </>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-white rounded-2xl border border-line-2 shadow-sm overflow-hidden">

        {/* ── HEADER ─────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-line-2">
          <p className="text-xs text-ink-4 mb-3">#{selectedApp?.id || '---'}</p>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar initials={selectedApp?.initials || '?'} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-ink">{selectedApp?.name || '—'}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-ink-4 mt-1">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {selectedApp?.county || '—'}</span>
                  <span className="flex items-center gap-1"><Phone size={12} /> {selectedApp?.phone || '—'}</span>
                  <span className="flex items-center gap-1"><Mail size={12} /> {selectedApp?.email || '—'}</span>
                </div>
              </div>
            </div>
            {/* App status pill */}
            {(() => { const sc = APP_STATUS_CFG[appStatus] || APP_STATUS_CFG.reviewing;
              return <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${sc.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {sc.label}
              </span>;
            })()}
          </div>

          {/* Stage progress */}
          <div className="mt-5 flex items-start">
            {stages.map((s, i) => {
              const done = s.id < stageIndex, active = s.id === stageIndex;
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && <div className={`absolute top-3 right-1/2 w-full h-0.5 ${done || active ? 'bg-accent' : 'bg-line-2'}`} />}
                  {i < stages.length - 1 && <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done ? 'bg-accent' : 'bg-line-2'}`} />}
                  <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 bg-white ${
                    done   ? 'border-accent bg-accent text-white' :
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

        {/* ── SCROLLABLE BODY ──────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Approved / Rejected banner */}
          {isApproved && (
            <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 bg-accent/8 border border-accent/20 rounded-xl">
              <CheckCircle2 size={15} className="text-accent shrink-0" />
              <p className="text-xs font-semibold text-accent">Application approved — driver notified.</p>
            </div>
          )}
          {isRejected && (
            <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 bg-urgent/6 border border-urgent/20 rounded-xl">
              <XCircle size={15} className="text-urgent shrink-0" />
              <p className="text-xs font-semibold text-urgent">Application rejected — applicant notified.</p>
            </div>
          )}

          {/* Doc alert (only while reviewing) */}
          {!isFrozen && (pendingCount > 0 || rejectedCount > 0) && (
            <div className={`mx-6 mt-4 flex items-center justify-between px-4 py-3 rounded-xl border ${
              rejectedCount > 0 ? 'bg-urgent/6 border-urgent/20' : 'bg-warning/8 border-warning/20'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle size={15} className={`${rejectedCount > 0 ? 'text-urgent' : 'text-warning'} mt-0.5 shrink-0`} />
                <div>
                  <p className={`text-xs font-semibold ${rejectedCount > 0 ? 'text-urgent' : 'text-warning'}`}>
                    {rejectedCount > 0
                      ? `${rejectedCount} doc${rejectedCount > 1 ? 's' : ''} rejected — request resubmission`
                      : `${pendingCount} doc${pendingCount > 1 ? 's' : ''} pending review`}
                  </p>
                  <p className="text-xs text-ink-4">Click 👁 to view · ✓ to verify · ✗ to reject</p>
                </div>
              </div>
            </div>
          )}

          {/* ── QUALIFICATIONS + VEHICLE ────────── */}
          <div className="grid grid-cols-3 gap-6 px-6 py-5 border-b border-line-2">
            <div className="col-span-2">
              <p className="text-sm font-bold text-ink mb-4">Driver & qualifications</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { k: 'License number', v: selectedApp?.license?.number || '—' },
                  { k: 'Class',          v: selectedApp?.license?.class  || 'Class C' },
                  { k: 'Expires',        v: selectedApp?.license?.expires || '—' },
                ].map(({ k, v }) => (
                  <div key={k}><p className="text-[10px] text-ink-4 mb-0.5">{k}</p><p className="text-xs font-semibold text-ink">{v}</p></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-[10px] text-ink-4 mb-0.5">Experience</p><p className="text-xs font-semibold text-ink">{selectedApp?.experience || '—'}</p></div>
                <div>
                  <p className="text-[10px] text-ink-4 mb-1">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {(selectedApp?.certs?.length ? selectedApp.certs : ['NEMT','CPR']).map((c: string) => (
                      <span key={c} className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 size={9} /> {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div><p className="text-[10px] text-ink-4 mb-0.5">Background Check</p>
                  <p className="text-xs font-semibold text-accent flex items-center gap-1"><ShieldCheck size={12} /> Authorized</p>
                </div>
              </div>
            </div>
            <div className="border-l border-line-2 pl-6">
              <p className="text-sm font-bold text-ink mb-4">Vehicle & insurance</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: 'Vehicle',           v: selectedApp?.vehicle?.make || '—' },
                  { k: 'Vehicle type',      v: selectedApp?.vehicle?.type || '—' },
                  { k: 'Policy',            v: 'INS-88291'   },
                  { k: 'Insurance expires', v: 'Dec 14, 2025' },
                ].map(({ k, v }) => (
                  <div key={k}><p className="text-[10px] text-ink-4 mb-0.5">{k}</p><p className="text-xs font-semibold text-ink">{v}</p></div>
                ))}
              </div>
            </div>
          </div>

          {/* ── DOCUMENTS TABLE ──────────────────── */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-ink">Documents</p>
              <span className={`text-xs font-semibold ${allVerified ? 'text-accent' : 'text-ink-4'}`}>
                {verifiedCount}/{DOCS.length} verified
              </span>
            </div>
            <div className="border border-line-2 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_2fr_auto_auto] gap-3 px-4 py-2 bg-bg border-b border-line-2">
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Document</span>
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Details</span>
                <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Status</span>
                {!isFrozen && <span className="text-[10px] font-bold text-ink-4 uppercase tracking-wide">Actions</span>}
              </div>
              {DOCS.map(doc => {
                const st  = (docStatuses[doc.id] || 'uploaded') as DocStatus;
                const sc  = STATUS_CFG[st];
                return (
                  <div key={doc.id} className={`grid gap-3 items-center px-4 py-3 border-b border-line-2 last:border-0 transition-colors ${
                    isFrozen ? 'grid-cols-[2fr_2fr_auto]' : 'grid-cols-[2fr_2fr_auto_auto]'
                  } ${st === 'rejected' ? 'bg-urgent/4' : st === 'verified' ? 'bg-accent/3' : 'bg-white hover:bg-bg/50'}`}>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className={st === 'verified' ? 'text-accent' : st === 'rejected' ? 'text-urgent' : 'text-ink-3'} />
                      <span className="text-xs font-medium text-ink">{doc.label}</span>
                    </div>
                    <span className="text-xs text-ink-4">{doc.detail}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                      {st === 'verified' && <CheckCircle2 size={10} />}
                      {st === 'rejected' && <XCircle size={10} />}
                      {st === 'uploaded' && <AlertCircle size={10} />}
                      {sc.label}
                    </span>
                    {!isFrozen && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewDoc(doc)} title="View document"
                          className="w-7 h-7 rounded-lg border border-line-2 flex items-center justify-center text-ink-4 hover:text-primary hover:border-primary/30 transition-all bg-white">
                          <Eye size={12} />
                        </button>
                        {st !== 'verified' && (
                          <button onClick={() => onDocStatusChange(doc.id, 'verified')} title="Mark verified"
                            className="w-7 h-7 rounded-lg border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all bg-white">
                            <Check size={12} />
                          </button>
                        )}
                        {st !== 'rejected' && (
                          <button onClick={() => onDocStatusChange(doc.id, 'rejected')} title="Reject document"
                            className="w-7 h-7 rounded-lg border border-urgent/20 flex items-center justify-center text-urgent hover:bg-urgent hover:text-white transition-all bg-white">
                            <X size={12} />
                          </button>
                        )}
                        {st !== 'uploaded' && (
                          <button onClick={() => onDocStatusChange(doc.id, 'uploaded')} title="Reset"
                            className="w-7 h-7 rounded-lg border border-line-2 flex items-center justify-center text-ink-4 hover:bg-bg text-[10px] transition-all bg-white">
                            ↩
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!isFrozen && !allVerified && (
              <p className="text-xs text-ink-4 mt-2 text-center">Verify all {DOCS.length} documents to enable approval</p>
            )}
          </div>
        </div>

        {/* ── ACTION BAR ─────────────────────────── */}
        <div className="px-6 py-3 bg-white border-t border-line-2 flex items-center gap-3">
          {!isFrozen ? (
            <>
              <button onClick={onReject} disabled={actionsDisabled}
                className="flex items-center gap-1.5 text-sm font-semibold text-urgent hover:opacity-75 transition-opacity disabled:opacity-40">
                <XCircle size={16} /> Reject
              </button>
              <div className="flex-1" />
              <Button variant="outline" icon={MessageSquare} className="h-9 text-sm" onClick={onRequestInfo} disabled={actionsDisabled}>
                Request info
              </Button>
              {stageIndex === 2 && allVerified && (
                <Button variant="outline" icon={ArrowRight} className="h-9 text-sm border-primary/30 text-primary" onClick={onSendToBackgroundCheck} disabled={actionsDisabled}>
                  Background Check
                </Button>
              )}
              <div className="relative group">
                <Button variant="primary" icon={FileCheck} className={`h-9 text-sm ${!allVerified || actionsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  onClick={allVerified && !actionsDisabled ? onApprove : undefined}
                  disabled={actionsDisabled}>
                  Approve application
                </Button>
                {!allVerified && (
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-ink text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-10">
                    Verify all {DOCS.length} documents first ({verifiedCount}/{DOCS.length})
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className={`text-sm font-semibold ${isApproved ? 'text-accent' : 'text-urgent'}`}>
              {isApproved ? '✓ Application approved' : '✗ Application rejected'}
            </p>
          )}
        </div>
      </div>
    </>
  );
};
