import { useEffect, useMemo, useState } from "react";
import { Car, Check } from "lucide-react";
import { Button, EntitySearchSelect } from "@/shared/components/ui";
import {
  vehicleToSelectItem,
  type AssignableVehicle,
} from "@/features/fleet/utils/entitySelectMappers";

export type { AssignableVehicle };

interface VehicleSearchPickerProps {
  vehicles: AssignableVehicle[];
  loading?: boolean;
  assignedVehicle?: AssignableVehicle | null;
  onAssign: (vehicleId: string) => Promise<void>;
  assigning?: boolean;
}

export const VehicleSearchPicker = ({
  vehicles,
  loading,
  assignedVehicle,
  onAssign,
  assigning,
}: VehicleSearchPickerProps) => {
  const [pickedId, setPickedId] = useState<string | null>(assignedVehicle?.id ?? null);

  useEffect(() => {
    setPickedId(assignedVehicle?.id ?? null);
  }, [assignedVehicle?.id]);

  const items = useMemo(() => vehicles.map(vehicleToSelectItem), [vehicles]);

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-line-2">
      <EntitySearchSelect
        label="Vehicle"
        required
        entityKind="vehicle"
        triggerIcon={Car}
        items={items}
        valueId={pickedId}
        onChange={(id) => setPickedId(id)}
        placeholder="Select a vehicle from list…"
        searchPlaceholder="Search by plate, model, or ID…"
        selectedBadge="Assigned"
        loading={loading}
        emptyListText="No vehicles in fleet"
      />

      <Button
        variant="primary"
        className="w-full h-9 text-sm"
        icon={Check}
        disabled={!pickedId || assigning || loading}
        onClick={() => pickedId && void onAssign(pickedId)}
      >
        {assigning ? "Saving…" : assignedVehicle ? "Update assignment" : "Confirm assignment"}
      </Button>
    </div>
  );
};
