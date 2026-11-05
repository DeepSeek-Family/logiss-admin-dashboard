import type { IDriverUser } from "@/redux/api/driversApi";
import type { IVehicleAssignUpdateBody } from "@/redux/api/vehiclesMangeApi";

export const resolveVehicleAssignId = (params: {
  assignmentId?: string | null;
  vehicleId: string;
  currentDriverId?: string;
  drivers?: IDriverUser[];
  vehicleRecord?: Record<string, unknown> | null;
}): string | undefined => {
  if (params.assignmentId) return params.assignmentId;

  const fromVehicle = params.vehicleRecord?.vehicleAssign;
  if (
    fromVehicle &&
    typeof fromVehicle === "object" &&
    fromVehicle !== null &&
    "_id" in fromVehicle
  ) {
    const id = String((fromVehicle as { _id?: string })._id || "");
    if (id) return id;
  }

  const drivers = params.drivers ?? [];
  if (params.currentDriverId) {
    const current = drivers.find((d) => d._id === params.currentDriverId);
    const id = current?.vehicleAssign?._id;
    if (id) return id;
  }

  for (const d of drivers) {
    const va = d.vehicleAssign;
    if (!va?._id) continue;
    const vid = typeof va.vehicleId === "object" && va.vehicleId ? va.vehicleId._id : va.vehicleId;
    if (String(vid) === String(params.vehicleId)) return va._id;
  }

  return undefined;
};

export type VehicleAssignMutations = {
  create: (body: { driverId: string; vehicleId: string }) => Promise<{ message?: string }>;
  update: (args: { id: string; body: IVehicleAssignUpdateBody }) => Promise<{ message?: string }>;
};

export async function submitVehicleAssign(
  mutate: VehicleAssignMutations,
  args: {
    driverId: string;
    vehicleId: string;
    assignmentId?: string;
    /** When true, PATCH sends only `{ driverId }` (fleet driver swap). */
    patchDriverOnly?: boolean;
  },
): Promise<{ message?: string }> {
  const { driverId, vehicleId, assignmentId, patchDriverOnly } = args;

  if (assignmentId) {
    const body: IVehicleAssignUpdateBody = patchDriverOnly ? { driverId } : { driverId, vehicleId };
    return mutate.update({ id: assignmentId, body });
  }

  return mutate.create({ driverId, vehicleId });
}
