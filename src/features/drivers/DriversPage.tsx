import { useState } from 'react';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { Badge, Button } from '@/shared/components/ui';
import { useDrivers } from '@/hooks/useDrivers';
import { useTrips } from '@/hooks/useTrips';

import {
  AddDriverModal,
  DriverProfile,
  DriverKpiStrip,
  DriversTable
} from '@/features/drivers';

const Drivers = ({ role }: { role?: string | null }) => {
  const { drivers, loading, error, addDriver } = useDrivers();
  const { trips } = useTrips();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300 pb-12">
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
        <h3 className="text-lg font-semibold text-ink mb-2">Failed to load drivers</h3>
        <p className="text-ink-3 text-sm">{error}</p>
      </div>
    );
  }

  const filteredDrivers = (drivers || []).filter((d: any) => {
    const nameMatch = (d?.name || '').toLowerCase().includes((search || '').toLowerCase());
    const idMatch = (d?.id || '').toLowerCase().includes((search || '').toLowerCase());
    let matchesTab = true;
    if (activeTab === 'on_duty') matchesTab = d?.onDuty;
    if (activeTab === 'off_duty') matchesTab = !d?.onDuty;
    if (activeTab === 'attention') matchesTab = (d?.pendingDocUpdates || 0) > 0;
    return (nameMatch || idMatch) && matchesTab;
  });

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedDriver = (drivers || []).find((d: any) => d.id === selectedDriverId);

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: any } = {
      available: { variant: 'accent', label: 'Available' },
      in_trip: { variant: 'solid_accent', label: 'In Trip' },
      break: { variant: 'warning', label: 'On Break' },
      off_duty: { variant: 'neutral', label: 'Off Duty' },
    };
    const { variant, label } = config[status] || { variant: 'neutral', label: status };
    return <Badge variant={variant} className="w-fit">{label}</Badge>;
  };

  if (selectedDriver) {
    return (
      <DriverProfile
        selectedDriver={selectedDriver}
        setSelectedDriverId={setSelectedDriverId}
        role={role}
        trips={trips}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-300 pb-12">
      {showAddModal && (
        <AddDriverModal
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              await addDriver(data);
              setShowAddModal(false);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-page-title">Driver Network</h1>
          <p className="text-sm font-medium text-ink-3 mt-1">Manage driver accounts and compliance</p>
        </div>
        {role === 'admin' && (
          <Button variant="primary" icon={UserPlus} onClick={() => setShowAddModal(true)}>Create Driver Account</Button>
        )}
      </div>

      {/* KPI Strip */}
      <DriverKpiStrip drivers={drivers} />

      {/* Table Card */}
      <DriversTable
        drivers={drivers}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        search={search}
        setSearch={setSearch}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        paginatedDrivers={paginatedDrivers}
        filteredCount={filteredDrivers.length}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onDriverClick={setSelectedDriverId}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default Drivers;
