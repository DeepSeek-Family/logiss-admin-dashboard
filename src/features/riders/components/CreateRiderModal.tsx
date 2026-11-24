import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, BadgeCheck, Loader2, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button, GoogleAddressInput } from "@/shared/components/ui";
import { geocodeAddress } from "@/utils/geofenceEngine";
import { useCreateRiderMutation, type IRider } from "@/redux/api/ridersApi";
import { getUserFacingApiError } from "@/utils/apiError";
import { CONTACT_FORMAT_HINT, CONTACT_PLACEHOLDER, normalizeContact } from "@/shared/utils/phone";

interface CreateRiderModalProps {
  onClose: () => void;
  /** Called with the new rider so the caller can select it right away. */
  onCreated?: (rider: IRider) => void;
  /** Prefill the name fields, e.g. from what was typed in a search box. */
  initialName?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClass =
  "w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-colors";
const labelClass = "block text-xs font-semibold text-ink-3 mb-1.5";

const splitName = (value?: string) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const todayYmd = () => new Date().toISOString().slice(0, 10);

/**
 * Creates a rider (role USER) from the admin dashboard. The backend marks the
 * account as verified and emails the rider a generated password.
 */
export const CreateRiderModal = ({ onClose, onCreated, initialName }: CreateRiderModalProps) => {
  const [createRider, { isLoading }] = useCreateRiderMutation();
  const [form, setForm] = useState(() => ({
    ...splitName(initialName && !/[@\d]/.test(initialName) ? initialName : ""),
    middleName: "",
    email: initialName && initialName.includes("@") ? initialName.trim() : "",
    contact: "",
    dateOfBirth: "",
    authorizationID: "",
  }));
  const [homeAddress, setHomeAddress] = useState("");
  /** [latitude, longitude] from the Google picker; cleared whenever the text is edited. */
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (error) setError("");
  };

  const validate = (): string => {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!EMAIL_PATTERN.test(form.email.trim())) return "Enter a valid email address.";
    if (!normalizeContact(form.contact)) return CONTACT_FORMAT_HINT;
    if (!homeAddress.trim()) return "Home address is required.";
    if (form.dateOfBirth && form.dateOfBirth >= todayYmd()) {
      return "Date of birth must be in the past.";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    // Typed but not picked from the suggestions: try to locate it once.
    let coords = homeCoords;
    if (!coords) {
      coords = await geocodeAddress(homeAddress.trim());
      if (!coords) {
        setError("Could not locate the home address. Pick it from the Google suggestions.");
        return;
      }
    }
    const [lat, lng] = coords;

    try {
      const res = await createRider({
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        contact: normalizeContact(form.contact) as string,
        dateOfBirth: form.dateOfBirth || undefined,
        authorizationID: form.authorizationID.trim() || undefined,
        homeAddress: { address: homeAddress.trim(), coordinates: [lng, lat] },
      }).unwrap();

      if (res.data?.credentialsEmailSent === false) {
        toast(res.message || "Rider created, but the login email could not be sent.", {
          icon: "⚠️",
        });
      } else {
        toast.success(res.message || "Rider created and verified.");
      }
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(getUserFacingApiError(err));
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={() => !isLoading && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-rider-title"
        className="relative bg-white rounded-2xl shadow-lg max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-line-2 shrink-0 flex items-start justify-between gap-4">
          <div>
            <h3
              id="create-rider-title"
              className="text-xl font-semibold text-ink flex items-center gap-2"
            >
              <UserPlus className="text-primary" size={22} /> New Passenger
            </h3>
            <p className="text-sm text-ink-3 mt-0.5">
              The account is verified right away and login details are emailed to the passenger.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-bg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor="rider-first">
                  First name *
                </label>
                <input
                  id="rider-first"
                  className={inputClass}
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Jane"
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="rider-middle">
                  Middle name
                </label>
                <input
                  id="rider-middle"
                  className={inputClass}
                  value={form.middleName}
                  onChange={set("middleName")}
                  autoComplete="additional-name"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="rider-last">
                  Last name *
                </label>
                <input
                  id="rider-last"
                  className={inputClass}
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="rider-email">
                  Email *
                </label>
                <input
                  id="rider-email"
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={set("email")}
                  placeholder="jane@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="rider-phone">
                  Phone *
                </label>
                <input
                  id="rider-phone"
                  type="tel"
                  inputMode="tel"
                  className={inputClass}
                  value={form.contact}
                  onChange={set("contact")}
                  placeholder={CONTACT_PLACEHOLDER}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="rider-dob">
                  Date of birth
                </label>
                <input
                  id="rider-dob"
                  type="date"
                  max={todayYmd()}
                  className={inputClass}
                  value={form.dateOfBirth}
                  onChange={set("dateOfBirth")}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="rider-auth">
                  Authorization ID
                </label>
                <input
                  id="rider-auth"
                  className={inputClass}
                  value={form.authorizationID}
                  onChange={set("authorizationID")}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="rider-home">
                Home address *
              </label>
              <GoogleAddressInput
                value={homeAddress}
                onChange={(address) => {
                  setHomeAddress(address);
                  setHomeCoords(null);
                  if (error) setError("");
                }}
                onSelectCoords={(c) => setHomeCoords(c)}
                placeholder="Search the passenger's home address..."
                className={inputClass}
              />
              <p className="text-xs text-ink-4 mt-1">
                {homeCoords
                  ? `Located: ${homeCoords[0].toFixed(5)}, ${homeCoords[1].toFixed(5)}`
                  : "Pick from the suggestions to save the exact location. Used as the default pickup."}
              </p>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-ink-4">
              <BadgeCheck size={14} className="text-primary shrink-0" />
              Role: Passenger (not a driver or dispatcher) · Verified on creation
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-6 mb-4 px-4 py-3 bg-urgent-light rounded-xl border border-urgent/20 text-xs font-semibold text-urgent flex items-center gap-2"
            >
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="px-6 py-4 border-t border-line-2 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {isLoading ? "Creating…" : "Create passenger"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
