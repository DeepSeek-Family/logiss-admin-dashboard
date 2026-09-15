import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useRiders } from '@/hooks/useRiders';
import { useTrips } from '@/hooks/useTrips';

import {
  RiderProfile,
  RiderKpiStrip,
  RidersTable,
  EditRiderModal
} from '@/features/riders';

const Riders = ({ role }: { role?: string | null }) => {
  const { riders, loading, error, updateRiderStatus, updateRider } = useRiders();
  const { trips } = useTrips();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [profileTab, setProfileTab] = useState<'overview' | 'trips'>('overview');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSuccessToast, setEditSuccessToast] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-48 h-8 bg-line-2 rounded-xl animate-pulse"></div>
            <div className="w-64 h-4 bg-line-2 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-bg rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="h-[400px] bg-bg rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={48} className="text-urgent mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-ink mb-2">Failed to load riders</h3>
        <p className="text-ink-3 text-sm">{error}</p>
      </div>
    );
  }

  const filteredRiders = (riders || []).filter((r: any) => {
    const nameMatch = (r?.name || '').toLowerCase().includes((search || '').toLowerCase());
    const idMatch = (r?.id || '').toLowerCase().includes((search || '').toLowerCase());
    let matchesTab = true;
    if (activeTab === 'active') matchesTab = r?.status === 'active';
    if (activeTab === 'inactive') matchesTab = r?.status !== 'active';
    return (nameMatch || idMatch) && matchesTab;
  });

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);
  const paginatedRiders = filteredRiders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedRider = (riders || []).find((r: any) => r.id === selectedRiderId);

  if (selectedRider) {
    return (
      <>
        {showEditModal && (
          <EditRiderModal
            rider={selectedRider}
            onClose={() => setShowEditModal(false)}
            onSave={(updated) => {
              updateRider(selectedRider.id, updated);
              setShowEditModal(false);
              setEditSuccessToast(true);
              setTimeout(() => setEditSuccessToast(false), 3000);
            }}
          />
        )}

        {editSuccessToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <Check size={15} /> Rider profile updated successfully
          </div>
        )}

        <RiderProfile
          selectedRider={selectedRider}
          trips={trips}
          role={role}
          onBack={() => setSelectedRiderId(null)}
          profileTab={profileTab}
          setProfileTab={setProfileTab}
          copiedPhone={copiedPhone}
          onCopyPhone={handleCopyPhone}
          onEditRider={() => setShowEditModal(true)}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title">Rider Directory</h1>
          <p className="text-sm text-ink-4 mt-0.5">Manage patient profiles, mobility needs, and trip history</p>
        </div>
      </div>

      {/* KPI Strip */}
      <RiderKpiStrip riders={riders} />

      {/* Table Card */}
      <RidersTable
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        search={search}
        setSearch={setSearch}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        paginatedRiders={paginatedRiders}
        filteredCount={filteredRiders.length}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onRiderClick={setSelectedRiderId}
        updateRiderStatus={updateRiderStatus}
        openStatusId={openStatusId}
        setOpenStatusId={setOpenStatusId}
      />
    </div>
  );
};

export default Riders;
