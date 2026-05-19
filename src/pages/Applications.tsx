import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, Pagination } from '@/shared/components/ui';
import { useApplications } from '../hooks/useApplications';

import {
  ApplicationCard,
  ApplicationDetails
} from '@/features/applications';

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
          <p className="text-sm text-ink-4">Loading Applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Driver Applications</h1>
        <p className="text-ink-3 font-semibold mt-1 tracking-normal">Review and approve new driver onboarding requests</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-250px)]">
        {/* Left Column: List */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
          {paginatedApplications.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              selected={selectedAppId === app.id}
              onClick={() => setSelectedAppId(app.id)}
              stages={stages}
            />
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
            <ApplicationDetails
              selectedApp={selectedApp}
              stages={stages}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-bg/30 rounded-3xl border-2 border-dashed border-line-2">
              <p className="text-ink-4 font-medium">Select an application to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
