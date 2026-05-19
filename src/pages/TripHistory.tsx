import { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Truck, Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/shared/components/ui';
import { useTrips } from '../hooks/useTrips';
import { useDrivers } from '../hooks/useDrivers';
import { useFleet } from '../hooks/useFleet';

import { StatusUpdateModal, TripDetailsModal, TripArchiveTab, ShiftScheduleTab } from '@/features/tripHistory';

const TripHistory = ({ role }: { role?: string | null }) => {
  const { trips, loading: tripsLoading } = useTrips();
  const { drivers, loading: driversLoading } = useDrivers();
  const { vehicles, loading: fleetLoading } = useFleet();

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = location.pathname.includes('/schedule') ? 'schedule' : (searchParams.get('tab') || 'trips');

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<any>(null);

  const loading = tripsLoading || driversLoading || fleetLoading;

  const selectedTrip = selectedTripId ? (trips || []).find((t: any) => t?.id === selectedTripId) : null;

  if (loading && (trips.length === 0 || drivers.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading trip records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {editingCell && (
        <StatusUpdateModal
          item={editingCell.item}
          date={editingCell.date}
          onClose={() => setEditingCell(null)}
        />
      )}

      {selectedTrip && (
        <TripDetailsModal
          key={selectedTrip.id}
          trip={selectedTrip}
          drivers={drivers}
          onClose={() => setSelectedTripId(null)}
        />
      )}

      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        {activeTab === 'trips' ? (
          <div>
            <h1 className="text-2xl font-semibold text-ink">Trip History</h1>
            <p className="text-sm text-ink-4 mt-0.5">Archived and active records for LOGISS fleet</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-ink">Fleet Schedule</h1>
            <p className="text-sm text-ink-4 mt-0.5">Coordinate shifts, vehicle availability, and operator assignments</p>
          </div>
        )}
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex items-center gap-1 bg-bg/60 p-0.5 rounded-xl w-fit shadow-sm border border-line-2/40">
        <button
          onClick={() => setSearchParams({ tab: 'trips' })}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'trips'
              ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
              : 'text-ink-4 hover:text-ink'
          }`}
        >
          <Truck size={14} />
          Trip Archive
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'schedule' })}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'schedule'
              ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
              : 'text-ink-4 hover:text-ink'
          }`}
        >
          <Calendar size={14} />
          Driver & Fleet Shifts
        </button>
      </div>

      {/* ────────────────── TRIP HISTORY TAB VIEW ────────────────── */}
      {activeTab === 'trips' && (
        <TripArchiveTab
          trips={trips}
          drivers={drivers}
          setSelectedTripId={setSelectedTripId}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      )}

      {/* ────────────────── SHIFT SCHEDULE TAB VIEW ────────────────── */}
      {activeTab === 'schedule' && (
        <ShiftScheduleTab
          drivers={drivers}
          vehicles={vehicles}
          setEditingCell={setEditingCell}
        />
      )}
    </div>
  );
};

export default TripHistory;
