import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useFleet } from '../hooks/useFleet';
import { useDrivers } from '../hooks/useDrivers';

import {
  AddVehicleModal,
  FleetKpiStrip,
  FleetTable,
  STATUS_CONFIG as statusConfig,
  INSURANCE_BADGE as insuranceBadge,
  TYPE_BADGE as typeBadge
} from '@/features/fleet';

const Fleet = ({ role }: { role?: string | null }) => {
  const navigate = useNavigate();
  const { vehicles, loading: fleetLoading, addVehicle, handleAssign } = useFleet();
  const { drivers, loading: driversLoading } = useDrivers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loading = fleetLoading || driversLoading;

  const filtered = (vehicles || []).filter((v: any) => {
    const q = (search || '').toLowerCase();
    const matchSearch = !q || (v?.make || '').toLowerCase().includes(q) || (v?.model || '').toLowerCase().includes(q)
      || (v?.plate || '').toLowerCase().includes(q) || (v?.id || '').toLowerCase().includes(q);
    const matchTab =
      filter === 'available' ? v?.status === 'available' :
        filter === 'in_trip' ? v?.status === 'in_trip' :
          filter === 'issues' ? (v?.insurance?.status !== 'valid' || v?.status === 'maintenance') : true;
    return matchSearch && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: (vehicles || []).length,
    available: (vehicles || []).filter((v: any) => v?.status === 'available').length,
    inTrip: (vehicles || []).filter((v: any) => v?.status === 'in_trip').length,
    issues: (vehicles || []).filter((v: any) => v?.insurance?.status !== 'valid' || v?.status === 'maintenance').length,
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} onSave={addVehicle} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Fleet Management</h1>
          <p className="text-sm text-ink-4 mt-0.5">Asset tracking, compliance auditing, and operator logistics</p>
        </div>
        {role === 'admin' && (
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Vehicle</Button>
        )}
      </div>

      {/* KPI Strip */}
      <FleetKpiStrip stats={stats} />

      {/* Fleet Table Card */}
      <FleetTable
        paginated={paginated}
        drivers={drivers}
        handleAssign={handleAssign}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        filteredCount={filtered.length}
        itemsPerPage={itemsPerPage}
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        stats={stats}
        statusConfig={statusConfig}
        typeBadge={typeBadge}
        insuranceBadge={insuranceBadge}
        onNavigate={navigate}
      />
    </div>
  );
};

export default Fleet;
