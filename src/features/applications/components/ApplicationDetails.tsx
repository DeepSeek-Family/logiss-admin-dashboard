import { useState } from 'react';
import {
  CheckCircle2, MapPin, Phone, Mail, XCircle,
  FileCheck, Eye, X, ImageIcon,
} from 'lucide-react';
import { Avatar, Button } from '@/shared/components/ui';
import type { MappedDriverApplication } from '../utils/helpers';

const APP_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-warning bg-warning/10' },
  approved: { label: 'Approved', color: 'text-accent bg-accent/10' },
  rejected: { label: 'Rejected', color: 'text-urgent bg-urgent/10' },
};

const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
  let display = '—';
  if (typeof value === 'boolean') display = value ? 'Yes' : 'No';
  else if (value === 0) display = '0';
  else if (value != null && String(value).trim()) display = String(value).trim();

  return (
    <div>
      <p className="text-[10px] text-ink-4 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-ink break-all">{display}</p>
    </div>
  );
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
  const appStatus = selectedApp.status || 'pending';
  const isApproved = appStatus === 'approved';
  const isRejected = appStatus === 'rejected';
  const isFrozen = isApproved || isRejected;
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const sc = APP_STATUS_CFG[appStatus] || APP_STATUS_CFG.pending;

  return (
    <>
      {viewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewUrl(null)}>
          <div className="bg-white rounded-2xl border border-line-2 shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-line-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={15} className="text-ink-4" />
                <span className="text-sm font-semibold text-ink">License image</span>
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
          <p className="text-xs text-ink-4 mb-3 font-mono">{selectedApp.id}</p>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar initials={selectedApp.initials || '?'} src={selectedApp.image} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-ink">{selectedApp.name}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-ink-4 mt-1">
                  {selectedApp.county && (
                    <span className="flex items-center gap-1"><MapPin size={12} /> {selectedApp.county}</span>
                  )}
                  {selectedApp.phone && (
                    <span className="flex items-center gap-1"><Phone size={12} /> {selectedApp.phone}</span>
                  )}
                  {selectedApp.email && (
                    <span className="flex items-center gap-1"><Mail size={12} /> {selectedApp.email}</span>
                  )}
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${sc.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {sc.label}
            </span>
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

          <div className="px-6 py-5 border-b border-line-2">
            <p className="text-sm font-bold text-ink mb-4">Applicant</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="First name" value={selectedApp.firstName} />
              <Field label="Last name" value={selectedApp.lastName} />
              <Field label="Date of birth" value={selectedApp.dateOfBirth} />
              <Field label="Authorization ID" value={selectedApp.authorizationID} />
              <Field label="Role" value={selectedApp.role} />
              <Field label="County" value={selectedApp.county} />
              <Field label="Contact" value={selectedApp.phone} />
              <Field label="Email" value={selectedApp.email} />
              <Field label="Verified" value={selectedApp.verified} />
              <Field label="Banned" value={selectedApp.isBanned} />
              <Field label="On duty" value={selectedApp.isOnDuty} />
              <Field label="Trips" value={selectedApp.trip} />
              <Field label="Admin verified driver" value={selectedApp.isAdminVerifiedDriver} />
              <Field label="Application status" value={selectedApp.applicationStatus} />
              <Field label="Applied" value={selectedApp.createdAt} />
              <Field label="Updated" value={selectedApp.updatedAt} />
            </div>
          </div>

          <div className="px-6 py-5 border-b border-line-2">
            <p className="text-sm font-bold text-ink mb-4">License & experience</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Experience" value={selectedApp.driverExperience} />
              <Field label="License number" value={selectedApp.licenseNumber} />
              <Field label="License class" value={selectedApp.licenseClass} />
              <Field label="Expiration" value={selectedApp.licenseExpires} />
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-ink">License images</p>
              <span className="text-xs font-semibold text-ink-4">
                {selectedApp.licenseImages.length} file{selectedApp.licenseImages.length === 1 ? '' : 's'}
              </span>
            </div>
            {selectedApp.licenseImages.length === 0 ? (
              <p className="text-xs text-ink-4 py-4 text-center border border-dashed border-line-2 rounded-xl">No license images uploaded</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedApp.licenseImages.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setViewUrl(url)}
                    className="group relative aspect-[4/3] rounded-xl border border-line-2 overflow-hidden bg-bg hover:border-primary/40 transition-colors"
                  >
                    <img src={url} alt={`License ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                ))}
              </div>
            )}
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
