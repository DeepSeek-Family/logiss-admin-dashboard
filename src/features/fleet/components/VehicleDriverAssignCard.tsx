import { useEffect, useMemo, useState } from 'react';
import { User, Check } from 'lucide-react';
import { Card, Button, EntitySearchSelect } from '@/shared/components/ui';
import { useGetDriversQuery } from '@/redux/api/driversApi';
import { useAssignVehicleDriverMutation } from '@/redux/api/vehiclesMangeApi';
import { mapApiDriver } from '@/features/drivers/utils/helpers';
import { driverToSelectItem } from '@/features/fleet/utils/entitySelectMappers';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';
import toast from 'react-hot-toast';

const resolveAssignedDriverId = (vehicle: Record<string, unknown> | undefined): string => {
  if (!vehicle) return '';
  const driverId = vehicle.driverId;
  if (driverId && typeof driverId === 'object' && driverId !== null && '_id' in driverId) {
    return String((driverId as { _id?: string })._id || '');
  }
  if (typeof driverId === 'string') return driverId;
  if (typeof vehicle.assignedDriverId === 'string') return vehicle.assignedDriverId;
  return '';
};

interface VehicleDriverAssignCardProps {
  vehicleId: string;
  vehicle?: Record<string, unknown>;
  onAssigned?: () => void;
}

export const VehicleDriverAssignCard = ({
  vehicleId,
  vehicle,
  onAssigned,
}: VehicleDriverAssignCardProps) => {
  const assignedFromApi = useMemo(() => resolveAssignedDriverId(vehicle), [vehicle]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(assignedFromApi || null);

  useEffect(() => {
    setSelectedDriverId(assignedFromApi || null);
  }, [assignedFromApi, vehicleId]);

  const { data: driversResponse, isLoading: driversLoading } = useGetDriversQuery(
    { page: 1, limit: 200 },
    { refetchOnMountOrArgChange: true },
  );
  const [assignVehicleDriver, { isLoading: assigning }] = useAssignVehicleDriverMutation();

  const drivers = useMemo(
    () => (driversResponse?.data || []).map(mapApiDriver),
    [driversResponse],
  );

  const driverItems = useMemo(() => drivers.map(driverToSelectItem), [drivers]);

  const handleAssign = async () => {
    if (!selectedDriverId) {
      toast.error('Select a driver first');
      return;
    }
    try {
      await assignVehicleDriver({
        driverId: selectedDriverId,
        vehicleId,
      }).unwrap();
      toast.success('Driver assigned to this vehicle');
      onAssigned?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to assign driver'));
    }
  };

  return (
    <Card className="p-6 !overflow-visible relative z-10">
      <h4 className="type-th mb-4 flex items-center gap-2">
        <User size={14} className="text-primary" /> Driver allocation
      </h4>

      <EntitySearchSelect
        label="Driver"
        required
        entityKind="person"
        triggerIcon={User}
        items={driverItems}
        valueId={selectedDriverId}
        onChange={(id) => setSelectedDriverId(id)}
        placeholder="Select a driver from list…"
        searchPlaceholder="Search drivers by name, phone…"
        selectedBadge="Assigned"
        loading={driversLoading}
        emptyListText="No drivers available"
      />

      <Button
        variant="primary"
        icon={Check}
        className="w-full h-10 mt-4"
        disabled={!selectedDriverId || assigning || driversLoading}
        onClick={() => void handleAssign()}
      >
        {assigning ? 'Assigning…' : assignedFromApi ? 'Update assignment' : 'Assign driver'}
      </Button>
    </Card>
  );
};
