import type { DriverExperience, DriverLicenseClass } from "@/redux/api/driversApi";

export const DRIVER_EXPERIENCE_OPTIONS: DriverExperience[] = [
  "1-3 years",
  "4-6 years",
  "7-10 years",
  "11-15 years",
];

export const DRIVER_LICENSE_CLASS_OPTIONS: DriverLicenseClass[] = ["A", "B", "C"];

export interface ICreateDriverInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  contact: string;
  email: string;
  password: string;
  driverExperience: DriverExperience;
  licenseNumber: string;
  licenseClass: DriverLicenseClass;
  expirationDate: string;
  licenseImages: File[];
}

export const normalizeLicenseClass = (value: string): DriverLicenseClass => {
  const trimmed = String(value || "").trim();
  const fromLabel = trimmed.match(/class\s*([abc])/i);
  if (fromLabel) return fromLabel[1].toUpperCase() as DriverLicenseClass;
  if (/^[ABC]$/i.test(trimmed)) return trimmed.toUpperCase() as DriverLicenseClass;
  const letter = trimmed
    .replace(/^class\s*/i, "")
    .trim()
    .toUpperCase();
  if (letter === "A" || letter === "B" || letter === "C") return letter;
  return "C";
};

export const normalizeDriverExperience = (value: string): DriverExperience | null => {
  const trimmed = String(value || "").trim();
  if (DRIVER_EXPERIENCE_OPTIONS.includes(trimmed as DriverExperience)) {
    return trimmed as DriverExperience;
  }
  if (trimmed === "11-15 years+") return "11-15 years";
  if (trimmed === "Less than 1 year") return "1-3 years";
  return null;
};

/** Backend accepts Bangladesh numbers as `+8801XXXXXXXXX`. */
export const normalizeContact = (value: string): string | null => {
  const raw = String(value || "").replace(/[^\d+]/g, "");
  const compact = raw.startsWith("+")
    ? `+${raw.slice(1).replace(/\D/g, "")}`
    : raw.replace(/\D/g, "");
  if (/^\+8801[3-9]\d{8}$/.test(compact)) return compact;
  if (/^8801[3-9]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^01[3-9]\d{8}$/.test(compact)) return `+88${compact}`;
  return null;
};

export const toIsoDate = (ymd: string): string => {
  if (!ymd) return "";
  const d = new Date(`${ymd}T12:00:00`);
  return Number.isNaN(d.getTime()) ? ymd : d.toISOString();
};

export const buildDriverFormData = (input: ICreateDriverInput): FormData => {
  const formData = new FormData();
  formData.append("firstName", input.firstName.trim());
  formData.append("lastName", input.lastName.trim());
  if (input.middleName?.trim()) {
    formData.append("middleName", input.middleName.trim());
  }
  formData.append("dateOfBirth", toIsoDate(input.dateOfBirth));
  formData.append("contact", input.contact.trim());
  formData.append("email", input.email.trim());
  formData.append("role", "DRIVER");
  formData.append("password", input.password.trim());

  const licenseClass = normalizeLicenseClass(input.licenseClass);
  formData.append("driverData[driverExperience]", input.driverExperience);
  formData.append("driverData[licenseNumber]", input.licenseNumber.trim());
  formData.append("driverData[licenseClass]", licenseClass);
  formData.append("driverData[expirationDate]", toIsoDate(input.expirationDate));
  input.licenseImages.slice(0, 3).forEach((file) => {
    formData.append("driverData[licenseImage]", file);
  });

  return formData;
};
