export interface AuthenticatedUserProfile {
  _id?: string;
  id?: string;
  userId?: string;
  employeeId?: string;
  employeeID?: string;
  staffId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  role?: string;
  profile?: string;
  image?: string;
  avatar?: string;
  accessScope?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

const words = (value?: string): string[] =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const getUserFullName = (user?: AuthenticatedUserProfile | null): string => {
  if (!user) return "User";
  const structuredName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return structuredName || user.fullName?.trim() || user.name?.trim() || "User";
};

export const getUserInitials = (user?: AuthenticatedUserProfile | null): string => {
  const nameParts = words(getUserFullName(user));
  if (!nameParts.length) return "U";
  return `${nameParts[0][0] || ""}${nameParts.length > 1 ? nameParts.at(-1)?.[0] || "" : ""}`.toUpperCase();
};

export const getUserDisplayId = (user?: AuthenticatedUserProfile | null): string =>
  String(
    user?.employeeId ||
      user?.employeeID ||
      user?.staffId ||
      user?.userId ||
      user?.id ||
      user?._id ||
      "Not available",
  );

export const getUserRoleLabel = (
  user?: AuthenticatedUserProfile | null,
  fallbackRole?: string | null,
): string => {
  const rawRole = String(user?.role || fallbackRole || "User").trim();
  if (/^admin$/i.test(rawRole)) return "Administrator";
  if (/dispatch/i.test(rawRole)) return "Dispatch Officer";
  return rawRole.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
};

export const getUserProfileImage = (user?: AuthenticatedUserProfile | null): string | undefined =>
  user?.profile || user?.image || user?.avatar || undefined;
