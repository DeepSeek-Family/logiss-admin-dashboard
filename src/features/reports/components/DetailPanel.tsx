import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, MapPin, Repeat, Save, User } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, Button, TripStatusBadge } from "@/shared/components/ui";
import type { IIncidentReport, ReportResolutionStatus } from "@/redux/apivtwo/dashboardOnvording";
import {
  useGetSingleReportQuery,
  useUpdateReportStatusMutation,
} from "@/redux/apivtwo/dashboardOnvording";
import { useGetDispatchersQuery } from "@/redux/api/dispatcherManagementApi";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";
import { ReportLocationField } from "./ReportLocationField";

import { Loader } from "@/shared/Lodder";

import { formatDateTime, formatShortDate, money, tripTypeLabel } from "@/utils/helpers";
import {
  formatReportUser,
  reportCategory,
  reportPersonEmail,
  reportPersonName,
  reportReasonText,
  reportStatusVariant,
  reportTrip,
  statusLabel,
} from "../utils/helpers";

interface DetailPanelProps {
  reportId: string;

  /** List row often has populated names; detail fetch may return IDs only */

  previewReport?: IIncidentReport | null;
}

const Field = ({
  label,

  value,
}: {
  label: string;

  value?: string | number | null;
}) => {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div>
      <p className="text-xs text-ink-4">{label}</p>

      <p className="text-sm font-medium text-ink mt-0.5 break-words">{value}</p>
    </div>
  );
};

const weekdayLabel = (days: string[]) =>
  days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");

export const DetailPanel = ({ reportId, previewReport }: DetailPanelProps) => {
  const {
    data: report,

    isLoading,

    isError,

    refetch,
  } = useGetSingleReportQuery(reportId);
  const [updateReportStatus, { isLoading: isUpdating }] = useUpdateReportStatusMutation();
  const {
    data: dispatchersResponse,
    isLoading: isLoadingDispatchers,
    isError: dispatchersError,
  } = useGetDispatchersQuery();
  const [draftStatus, setDraftStatus] = useState<ReportResolutionStatus>("pending");
  const [draftAssignedUserId, setDraftAssignedUserId] = useState("");
  const [draftInternalNote, setDraftInternalNote] = useState("");

  useEffect(() => {
    const current = report ?? previewReport;
    if (!current) return;

    const status = current.reportStatus?.toLowerCase();
    setDraftStatus(status === "approved" || status === "rejected" ? status : "pending");
    setDraftAssignedUserId(
      typeof current.assignedUserId === "string"
        ? current.assignedUserId
        : (current.assignedUserId?._id ?? current.assignedUserId?.id ?? ""),
    );
    setDraftInternalNote(current.internalNote ?? "");
  }, [report, previewReport, reportId]);

  if (isLoading && !previewReport) {
    return <Loader message="Loading report..." />;
  }

  const merged = report ?? previewReport;

  if ((isError && !previewReport) || !merged) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="flex items-center justify-center w-12 h-12 mb-3 bg-urgent/10 rounded-xl text-urgent">
          <AlertTriangle size={22} />
        </div>

        <p className="text-sm font-medium text-ink">Could not load this report</p>

        <Button variant="primary" size="sm" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const trip = reportTrip(merged);

  const filed = formatDateTime(merged.createdAt);

  const reason = reportReasonText(merged);

  const subjectName = reportPersonName(merged, "userId", previewReport);

  const reporterName = reportPersonName(merged, "reportedBy", previewReport);

  const subjectEmail = reportPersonEmail(merged, "userId", previewReport);

  const reporterEmail = reportPersonEmail(merged, "reportedBy", previewReport);

  const tripPassenger =
    trip?.userId && typeof trip.userId === "object" ? formatReportUser(trip.userId) : subjectName;

  const hasTripDetails =
    trip &&
    (trip.tripReason ||
      trip.serviceDate ||
      trip.pickupLocation ||
      trip.dropOffLocation ||
      trip.bookingStatus ||
      trip.price != null);

  const currentAssignee = merged.assignedUserId;
  const currentAssigneeId =
    typeof currentAssignee === "string"
      ? currentAssignee
      : (currentAssignee?._id ?? currentAssignee?.id);
  const currentAssigneeLabel =
    typeof currentAssignee === "object" && currentAssignee
      ? [currentAssignee.firstName, currentAssignee.lastName].filter(Boolean).join(" ") ||
        currentAssignee.email ||
        "Current assignee"
      : "Current assignee";

  const saveReport = async () => {
    try {
      await updateReportStatus({
        id: reportId,
        body: {
          ...(draftAssignedUserId ? { assignedUserId: draftAssignedUserId } : {}),
          reportStatus: draftStatus,
          internalNote: draftInternalNote,
        },
      }).unwrap();
      toast.success("Report changes saved");
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to save report changes"));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-line-2 shrink-0">
        <div className="min-w-0">
          <p className="text-xs text-ink-4 mb-0.5">Filed {filed}</p>

          <h2 className="text-xl font-bold tracking-tight text-ink">{subjectName}</h2>

          <p className="mt-1 text-sm text-ink-3">
            {reportCategory(merged)} · Reported by {reporterName}
          </p>
        </div>

        <Badge variant={reportStatusVariant(merged.reportStatus)} className="shrink-0">
          {statusLabel(merged.reportStatus)}
        </Badge>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
        <div className="pb-5 space-y-4 border-b border-line-2">
          <h4 className="mb-2 text-xs font-bold tracking-wider uppercase text-ink-4">
            Report details
          </h4>

          <Field label="Concern type" value={merged.documents} />

          {reason ? (
            <div>
              <p className="text-xs text-ink-4">Reason / notes</p>

              <p className="text-sm text-ink leading-relaxed mt-0.5">{reason}</p>
            </div>
          ) : (
            <p className="text-sm text-ink-4">No additional reason provided.</p>
          )}
        </div>

        <div className="pb-5 border-b border-line-2">
          <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-ink-4">
            Report management
          </h4>
          <div className="overflow-x-auto border rounded-lg border-line-2">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-line-2">
                <tr>
                  <th
                    scope="row"
                    className="px-3 py-3 text-xs font-semibold align-top w-36 bg-bg/50 text-ink-3"
                  >
                    Assigned dispatcher
                  </th>
                  <td className="px-3 py-2.5">
                    <select
                      value={draftAssignedUserId}
                      onChange={(event) => setDraftAssignedUserId(event.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border rounded-md outline-none min-w-48 border-line-2 text-ink focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {!draftAssignedUserId && <option value="">Unassigned</option>}
                      {currentAssigneeId &&
                        !dispatchersResponse?.data.some(
                          (dispatcher) => dispatcher._id === currentAssigneeId,
                        ) && <option value={currentAssigneeId}>{currentAssigneeLabel}</option>}
                      {dispatchersResponse?.data.map((dispatcher) => (
                        <option key={dispatcher._id} value={dispatcher._id}>
                          {[dispatcher.firstName, dispatcher.lastName].filter(Boolean).join(" ") ||
                            dispatcher.email}
                        </option>
                      ))}
                    </select>
                    {isLoadingDispatchers && (
                      <p className="mt-1 text-xs text-ink-4">Loading dispatchers…</p>
                    )}
                    {dispatchersError && (
                      <p className="mt-1 text-xs text-urgent">Could not load dispatchers.</p>
                    )}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-3 py-3 text-xs font-semibold align-top w-36 bg-bg/50 text-ink-3"
                  >
                    Status
                  </th>
                  <td className="px-3 py-2.5">
                    <select
                      value={draftStatus}
                      onChange={(event) =>
                        setDraftStatus(event.target.value as ReportResolutionStatus)
                      }
                      className="w-full px-3 py-2 text-sm bg-white border rounded-md outline-none min-w-48 border-line-2 text-ink focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Solved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-3 py-3 text-xs font-semibold align-top w-36 bg-bg/50 text-ink-3"
                  >
                    Internal note
                  </th>
                  <td className="px-3 py-2.5">
                    <textarea
                      value={draftInternalNote}
                      onChange={(event) => setDraftInternalNote(event.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-white border rounded-md outline-none resize-y min-w-48 border-line-2 text-ink focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="Add a note for the internal team"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pb-5 border-b border-line-2">
          <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User size={12} /> People
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Reported about" value={subjectName} />

            <Field label="Email" value={subjectEmail} />

            <Field label="Filed by" value={reporterName} />

            <Field label="Email" value={reporterEmail} />
          </div>
        </div>

        {trip ? (
          <>
            <div className="pb-5 border-b border-line-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="text-xs font-bold tracking-wider uppercase text-ink-4">
                  Related trip
                </h4>

                {trip.bookingStatus ? (
                  <TripStatusBadge status={trip.bookingStatus.toLowerCase()} />
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Passenger" value={tripPassenger} />

                <Field
                  label="Trip type"
                  value={trip.tripType ? tripTypeLabel(trip.tripType) : undefined}
                />

                {hasTripDetails ? (
                  <>
                    <Field label="Trip reason" value={trip.tripReason} />

                    <Field label="Service date" value={formatShortDate(trip.serviceDate)} />

                    <Field label="Program" value={trip.programContext} />

                    <Field label="Pickup" value={trip.pickupTime} />

                    <Field label="Appointment" value={trip.appointmentTime} />

                    <Field label="Return" value={trip.returnTime} />

                    <Field
                      label="Passengers"
                      value={trip.passengerSeats != null ? trip.passengerSeats : undefined}
                    />

                    <Field
                      label="Fare"
                      value={trip.price != null ? money(trip.price) : undefined}
                    />
                  </>
                ) : null}
              </div>

              {!hasTripDetails && trip.tripType ? (
                <p className="mt-2 text-xs text-ink-4">
                  Linked trip: {tripTypeLabel(trip.tripType)} for {tripPassenger}.
                </p>
              ) : null}
            </div>

            {(trip.pickupLocation || trip.dropOffLocation || trip.stopAddress) && (
              <div className="pb-5 border-b border-line-2">
                <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin size={12} /> Locations
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ReportLocationField label="Pickup location" value={trip.pickupLocation} />

                  <ReportLocationField label="Drop-off location" value={trip.dropOffLocation} />

                  <ReportLocationField label="Stop location" value={trip.stopAddress} />
                </div>
              </div>
            )}

            {trip.recurringBooking ? (
              <div className="pb-5 border-b border-line-2">
                <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Repeat size={12} /> Recurring
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Days"
                    value={trip.selectedDate?.length ? weekdayLabel(trip.selectedDate) : undefined}
                  />

                  <Field label="Ends" value={formatShortDate(trip.endDate)} />
                </div>
              </div>
            ) : null}

            {(trip.tripNote || trip.internalPrivateNote) && (
              <div className="space-y-4">
                {trip.tripNote ? (
                  <div>
                    <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={12} /> Trip note
                    </h4>

                    <p className="text-sm leading-relaxed text-ink">{trip.tripNote}</p>
                  </div>
                ) : null}

                {trip.internalPrivateNote ? (
                  <div>
                    <h4 className="mb-2 text-xs font-bold tracking-wider uppercase text-ink-4">
                      Internal note
                    </h4>

                    <p className="text-sm leading-relaxed text-ink">{trip.internalPrivateNote}</p>
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-4">This report is not linked to a trip.</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line-2 shrink-0 bg-bg/30">
        <Button
          type="button"
          variant="primary"
          icon={Save}
          disabled={isUpdating}
          onClick={saveReport}
        >
          {isUpdating ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
};
