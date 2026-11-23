import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Flag, Loader2, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { useGetAllTripHistoryQuery, type IBooking } from "@/redux/api/bookingApi";
import { useCreateReportMutation } from "@/redux/apivtwo/dashboardOnvording";
import { getUserFacingApiError } from "@/utils/apiError";
import { formatDateTime } from "@/utils/helpers";

interface CreateReportModalProps {
  onClose: () => void;
}

const REASON_MAX = 500;
const NOTE_MAX = 2000;

const inputClass =
  "w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-colors";
const labelClass = "block text-xs font-semibold text-ink-3 mb-1.5";

type Party = { id: string; name: string } | null;

const personName = (value: unknown): string => {
  if (!value || typeof value !== "object") return "";
  const p = value as { firstName?: string; middleName?: string; lastName?: string };
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim();
};

const party = (value: unknown): Party => {
  if (!value) return null;
  if (typeof value === "string") return { id: value, name: "" };
  const v = value as { _id?: string; id?: string };
  const id = v._id || v.id;
  return id ? { id, name: personName(value) } : null;
};

const shortTripId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

/**
 * Manually file an incident report from the dashboard. Matches the backend
 * Reports model: a trip (tripId), the person it is about (userId: the trip's
 * rider or driver), a free-text reason and an optional internal note.
 */
export const CreateReportModal = ({ onClose }: CreateReportModalProps) => {
  const [createReport, { isLoading: isSaving }] = useCreateReportMutation();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [trip, setTrip] = useState<IBooking | null>(null);
  const [against, setAgainst] = useState<"driver" | "rider">("driver");
  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: tripsRes,
    isFetching: tripsLoading,
    isError: tripsError,
  } = useGetAllTripHistoryQuery(
    { page: 1, limit: 8, sort: "-serviceDate", ...(debounced ? { searchTerm: debounced } : {}) },
    { skip: Boolean(trip) },
  );
  const trips = tripsRes?.data ?? [];

  const rider = useMemo(() => party(trip?.userId), [trip]);
  const driver = useMemo(() => party(trip?.driverId), [trip]);
  const reportedUser = against === "driver" ? driver : rider;

  const selectTrip = (t: IBooking) => {
    setTrip(t);
    // Default to the driver when the trip has one, otherwise the rider.
    setAgainst(party(t.driverId) ? "driver" : "rider");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return setError("Select the trip this incident happened on.");
    if (!reportedUser) return setError(`This trip has no ${against} to report.`);
    if (!reason.trim()) return setError("Describe the reason for this report.");

    try {
      await createReport({
        tripId: trip._id,
        userId: reportedUser.id,
        reason: reason.trim(),
        ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {}),
      }).unwrap();
      toast.success("Incident report created.");
      onClose();
    } catch (err) {
      setError(getUserFacingApiError(err));
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={() => !isSaving && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-report-title"
        className="relative bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-line-2 shrink-0 flex items-start justify-between gap-4">
          <div>
            <h3
              id="create-report-title"
              className="text-xl font-semibold text-ink flex items-center gap-2"
            >
              <Flag className="text-urgent" size={20} /> New Incident Report
            </h3>
            <p className="text-sm text-ink-3 mt-0.5">
              File a report against the driver or rider of a trip. It starts as pending.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-bg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* 1. Trip */}
            <div>
              <span className={labelClass}>Trip *</span>
              {trip ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {shortTripId(trip._id)}
                      <span className="ml-2 text-xs font-medium text-ink-4">
                        {trip.serviceDate ? formatDateTime(trip.serviceDate) : ""}
                      </span>
                    </p>
                    <p className="text-xs text-ink-3 truncate">
                      Rider: {rider?.name || "—"} · Driver: {driver?.name || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTrip(null)}
                    className="text-xs font-semibold text-primary hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-9`}
                      placeholder="Search trips by rider / driver name or trip ID…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search trips"
                      autoFocus
                    />
                    <Search
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4"
                    />
                  </div>
                  <div className="border border-line-2 rounded-xl divide-y divide-line-2 max-h-60 overflow-y-auto">
                    {tripsLoading ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-xs text-ink-4">
                        <Loader2 size={14} className="animate-spin" /> Loading trips…
                      </div>
                    ) : tripsError ? (
                      <p className="p-4 text-center text-xs text-urgent">Could not load trips.</p>
                    ) : trips.length === 0 ? (
                      <p className="p-4 text-center text-xs text-ink-4">
                        {debounced ? "No trips match your search." : "No trips found."}
                      </p>
                    ) : (
                      trips.map((t) => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => selectTrip(t)}
                          className="w-full text-left px-4 py-2.5 hover:bg-bg transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-ink">
                              {shortTripId(t._id)}
                            </span>
                            <span className="text-xs text-ink-4 shrink-0">
                              {t.serviceDate ? formatDateTime(t.serviceDate) : ""}
                            </span>
                          </div>
                          <p className="text-xs text-ink-3 truncate">
                            Rider: {personName(t.userId) || "—"} · Driver:{" "}
                            {personName(t.driverId) || "—"}
                            {t.bookingStatus ? ` · ${String(t.bookingStatus)}` : ""}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-ink-4">
                    Only trips that have a driver assigned are listed.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Who */}
            {trip && (
              <fieldset>
                <legend className={labelClass}>Report against *</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { key: "driver", label: "Driver", who: driver },
                      { key: "rider", label: "Rider", who: rider },
                    ] as const
                  ).map(({ key, label, who }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                        !who
                          ? "opacity-50 cursor-not-allowed border-line-2"
                          : against === key
                            ? "border-primary bg-primary/5 cursor-pointer"
                            : "border-line-2 hover:border-line cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-against"
                        className="accent-primary"
                        checked={against === key}
                        disabled={!who}
                        onChange={() => setAgainst(key)}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs text-ink-4">{label}</span>
                        <span className="block text-sm font-semibold text-ink truncate">
                          {who ? who.name || "Unnamed" : `No ${label.toLowerCase()}`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {/* 3. Reason (free text) */}
            <div>
              <div className="flex items-baseline justify-between">
                <label className={labelClass} htmlFor="report-reason">
                  Reason *
                </label>
                <span className="text-xs text-ink-4 tabular-nums">
                  {reason.length}/{REASON_MAX}
                </span>
              </div>
              <input
                id="report-reason"
                className={inputClass}
                value={reason}
                maxLength={REASON_MAX}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Reckless or unsafe driving"
              />
            </div>

            {/* 4. Internal note */}
            <div>
              <div className="flex items-baseline justify-between">
                <label className={labelClass} htmlFor="report-note">
                  Internal note
                </label>
                <span className="text-xs text-ink-4 tabular-nums">
                  {internalNote.length}/{NOTE_MAX}
                </span>
              </div>
              <textarea
                id="report-note"
                rows={4}
                className={`${inputClass} resize-y`}
                value={internalNote}
                maxLength={NOTE_MAX}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Details for staff only (optional)"
              />
            </div>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
              {isSaving ? "Creating…" : "Create report"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
