import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  User,
  Car,
  ShieldCheck,
  AlertCircle,
  Mail,
  Phone,
  FileCheck,
  XCircle,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Card, Avatar, Badge, Button, Pagination } from '../components/ui';
import { useApplications } from '../hooks/useApplications';
import { timeAgo } from '../utils/helpers';

const Applications = ({ role }: { role?: string | null }) => {
  const { applications, loading } = useApplications();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil((applications || []).length / itemsPerPage);
  const paginatedApplications = (applications || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedApp: any = selectedAppId
    ? (applications || []).find((a: any) => a.id === selectedAppId)
    : (paginatedApplications.length > 0 ? paginatedApplications[0] : null);

  const stages = [
    { id: 1, label: 'Submitted' },
    { id: 2, label: 'Under Review' },
    { id: 3, label: 'Background Check' },
    { id: 4, label: 'Approved' }
  ];

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-ink-3">Loading Applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Driver Applications</h1>
        <p className="text-ink-3 font-semibold mt-1 tracking-tight">Review and approve new driver onboarding requests</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-250px)]">
        {/* Left Column: List */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
          {paginatedApplications.map(app => (
            <Card
              key={app.id}
              hover
              onClick={() => setSelectedAppId(app.id)}
              className={`p-5 cursor-pointer transition-all border-2 rounded-2xl ${selectedAppId === app.id ? 'border-primary bg-primary-tint/20 shadow-lg shadow-primary/5' : 'border-line-2'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs font-bold text-ink-4 tracking-tighter uppercase">#{app?.id || '---'}</span>
                <span className="text-xs font-bold text-ink-4">{app?.submitted ? timeAgo(app.submitted) : '---'}</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Avatar initials={app?.initials || '?'} size="sm" />
                <div>
                  <h4 className="text-sm font-bold text-ink">{app?.name || 'Applicant'}</h4>
                  <p className="text-xs font-semibold text-ink-3 flex items-center gap-1">
                    <MapPin size={10} /> {app?.county || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Badge variant="neutral">{app?.vehicle?.type || 'Standard'}</Badge>
                <Badge variant="neutral">{app?.experience || '0'} exp</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className={app?.stage === 4 ? 'text-accent' : 'text-warning'}>Stage {app?.stage || 0}/4: {stages.find(s => s.id === app?.stage)?.label || 'Pending'}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${s < (app?.stage || 0) ? 'bg-accent' : (s === app?.stage ? 'bg-warning' : 'bg-line-2')}`}></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
          <div className="mt-auto pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={applications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Right Column: Detail */}
        <div className="lg:col-span-7 overflow-y-auto pr-2 scrollbar-hide">
          {selectedApp ? (
            <Card className="flex flex-col h-fit rounded-2xl border-2 border-line-2 shadow-sm">
              <div className="p-6 border-b border-line-2 flex items-center justify-between bg-tint/10">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold text-ink-3 tracking-tighter">#{selectedApp?.id || '---'}</span>
                  <h2 className="text-lg font-bold font-display text-ink">Application Details</h2>
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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${s.id < (selectedApp?.stage || 0) ? 'bg-accent border-accent text-white' :
                              (s.id === selectedApp?.stage ? 'bg-white border-warning text-warning ring-4 ring-warning-light' : 'bg-white border-line-2 text-ink-4')
                            }`}>
                            {s.id < (selectedApp?.stage || 0) ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{s.id}</span>}
                          </div>
                          <span className={`text-xs font-bold ${s.id === selectedApp?.stage ? 'text-warning' : (s.id < (selectedApp?.stage || 0) ? 'text-accent' : 'text-ink-4')}`}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Personal Information */}
                <section>
                  <h4 className="text-xs font-bold text-ink mb-4">Personal Information</h4>
                  <div className="flex items-center gap-6">
                    <Avatar initials={selectedApp.initials} size="xl" />
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
                      <div>
                        <p className="text-xs font-bold text-ink-4 mb-0.5">Full Name</p>
                        <p className="text-sm font-bold text-ink">{selectedApp?.name || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink-4 mb-0.5">County</p>
                        <p className="text-sm font-bold text-ink">{selectedApp?.county || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink-4 mb-0.5">Phone</p>
                        <p className="text-sm font-bold text-ink">{selectedApp?.phone || '(804) 555-0000'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink-4 mb-0.5">Email</p>
                        <p className="text-sm font-bold text-ink">{selectedApp?.email || (selectedApp?.name ? `${selectedApp.name.toLowerCase().replace(' ', '.')}@email.com` : '---')}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-8">
                  {/* Driver's License */}
                  <section>
                    <h4 className="text-xs font-bold text-ink mb-3">Driver's License</h4>
                    <div className="bg-bg rounded-xl border border-line-2 p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-ink-4 mb-0.5">License No.</p>
                        <p className="text-xs font-bold font-mono text-ink tracking-tight uppercase">{selectedApp?.license?.number || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink-4 mb-0.5">Class</p>
                        <p className="text-xs font-bold text-ink">{selectedApp?.license?.class || 'Standard'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-bold text-ink-4 mb-0.5">Expires</p>
                        <p className="text-xs font-bold text-ink">{selectedApp?.license?.expires || '---'}</p>
                      </div>
                    </div>
                  </section>

                  {/* Vehicle & Insurance */}
                  <section>
                    <h4 className="text-xs font-bold text-ink mb-3">Vehicle & Insurance</h4>
                    <div className="bg-bg rounded-xl border border-line-2 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-ink-4" />
                        <p className="text-xs font-bold text-ink">{selectedApp?.vehicle?.year || ''} {selectedApp?.vehicle?.make || 'No Vehicle'}</p>
                        <Badge variant="neutral">{selectedApp?.vehicle?.type || 'Standard'}</Badge>
                      </div>
                      <div className="flex justify-between items-center border-t border-line-2 pt-2">
                        <div>
                          <p className="text-xs font-bold text-ink-4 mb-0.5">Policy</p>
                          <p className="text-xs font-bold font-mono text-ink tracking-tight uppercase">INS-88291</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-ink-4 mb-0.5">Expires</p>
                          <p className="text-xs font-bold text-ink">2025-12-14</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Certifications */}
                <section>
                  <h4 className="text-xs font-bold text-ink mb-3">Certifications & Experience</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(selectedApp?.certs || []).map((cert: string) => (
                      <Badge key={cert} variant="accent" className="py-1 px-3">{cert} Certified</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-bg rounded-xl border border-line-2">
                      <p className="text-xs font-bold text-ink-4 mb-0.5">Experience</p>
                      <p className="text-xs font-bold text-ink">{selectedApp?.experience || '0 years'}</p>
                    </div>
                    <div className="p-3 bg-bg rounded-xl border border-line-2">
                      <p className="text-xs font-bold text-ink-4 mb-0.5">Background Check</p>
                      <p className="text-xs font-bold text-accent flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Authorized
                      </p>
                    </div>
                  </div>
                </section>

                {/* Checklist */}
                <section>
                  <h4 className="text-xs font-bold text-ink mb-3">Document Verification</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Driver License Photo', verified: true },
                      { label: 'Insurance Certificate', verified: true },
                      { label: 'Vehicle Registration', verified: false },
                      { label: 'NEMT Certification', verified: true }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-bg border border-line-2">
                        <span className="text-xs font-bold text-ink">{item.label}</span>
                        {item.verified ? (
                          <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
                            <CheckCircle2 size={14} /> Verified
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-warning text-xs font-bold">
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
          ) : (
            <div className="h-full flex items-center justify-center bg-bg/30 rounded-3xl border-2 border-dashed border-line-2">
              <p className="text-ink-4 font-bold">Select an application to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
