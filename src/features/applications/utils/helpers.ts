import type { IDriverUser } from "@/redux/api/driversApi";
import { driverFullName, driverInitials } from "@/features/drivers/utils/helpers";
import { resolveMediaUrl } from "@/utils/imageUrl";

const displayDate = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const licenseImageUrls = (value: unknown): string[] => {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? [value]
      : [];
  return list
    .map((item) => (typeof item === "string" ? resolveMediaUrl(item) : undefined))
    .filter((url): url is string => Boolean(url));
};

/** Maps API driver application fields only — no mock vehicle/docs/stages. */
export const mapApiDriverApplication = (driver: IDriverUser) => {
  const id = driver._id || driver.id || "";
  const status = String(driver.applicationStatus || "pending").toLowerCase();

  return {
    id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    name: driverFullName(driver) || "Applicant",
    initials: driverInitials(driver),
    email: driver.email?.trim() || "",
    phone: driver.contact?.trim() || "",
    image: resolveMediaUrl(driver.profile),
    authorizationID: driver.authorizationID?.trim() || "",
    county: driver.county ? String(driver.county) : "",
    dateOfBirth: displayDate(driver.dateOfBirth),
    role: driver.role?.trim() || "",
    applicationStatus: status,
    status,
    isAdminVerifiedDriver: Boolean(driver.isAdminVerifiedDriver),
    isOnDuty: Boolean(driver.isOnDuty),
    trip: driver.trip ?? 0,
    verified: Boolean(driver.verified),
    isBanned: Boolean(driver.isBanned),
    createdAt: displayDate(driver.createdAt),
    updatedAt: displayDate(driver.updatedAt),
    driverExperience: driver.driverData?.driverExperience?.trim() || "",
    licenseNumber: driver.driverData?.licenseNumber?.trim() || "",
    licenseClass: driver.driverData?.licenseClass?.trim() || "",
    licenseExpires: displayDate(driver.driverData?.expirationDate),
    licenseImages: licenseImageUrls(driver.driverData?.licenseImage),
  };
};

export type MappedDriverApplication = ReturnType<typeof mapApiDriverApplication>;
