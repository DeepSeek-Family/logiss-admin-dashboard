/**
 * Normalizes a phone number from any country to E.164 (`+<country code><number>`),
 * which is the format the backend stores and validates.
 * Accepts spaces, dashes, dots and parentheses (e.g. `+1 (202) 555-0123`),
 * and the `00` international prefix (e.g. `00447911123456`).
 * A country code is required, except for Bangladeshi local numbers
 * (`01XXXXXXXXX` / `8801XXXXXXXXX`), which are still accepted for convenience.
 */
export const normalizeContact = (value: string): string | null => {
  const trimmed = String(value || "").trim();
  // Only digits, a leading +, and common separators are allowed.
  if (!/^\+?[\d\s\-().]+$/.test(trimmed)) return null;

  let compact = trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : trimmed.replace(/\D/g, "");

  // `00` international dialing prefix -> `+`
  if (/^00\d/.test(compact)) compact = `+${compact.slice(2)}`;

  // Bangladesh shortcuts (kept for backward compatibility)
  if (/^01[3-9]\d{8}$/.test(compact)) return `+88${compact}`;
  if (/^8801[3-9]\d{8}$/.test(compact)) return `+${compact}`;

  // E.164: + followed by 8–15 digits, country code cannot start with 0
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;

  return null;
};

export const CONTACT_FORMAT_HINT =
  "Enter a valid phone number with country code, e.g. +1 202 555 0123 or +8801712345678.";

export const CONTACT_PLACEHOLDER = "+1 202 555 0123";
