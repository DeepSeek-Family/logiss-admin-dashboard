import type { EntitySearchSelectItem } from "@/shared/components/ui/EntitySearchSelect";
import { resolveMediaUrl } from "@/utils/imageUrl";
export type AssignableVehicle = {
  id: string;
  name: string;
  type: string;
  plate: string;
};

export const driverToSelectItem = (driver: {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  initials?: string;
  profile?: string;
  image?: string;
  onDuty?: boolean;
}): EntitySearchSelectItem => ({
  id: String(driver.id),
  title: driver.name || "Driver",
  subtitle: driver.phone || driver.email || undefined,
  initials: driver.initials,
  imageUrl: resolveMediaUrl(driver.profile || driver.image),
  online: driver.onDuty,
});

export const vehicleToSelectItem = (vehicle: AssignableVehicle): EntitySearchSelectItem => ({
  id: vehicle.id,
  title: vehicle.name,
  subtitle: `${vehicle.type} · ${vehicle.plate}`,
});
