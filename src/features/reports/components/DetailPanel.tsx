import { AlertTriangle, Calendar, MapPin, Repeat } from "lucide-react";
import { Badge, Button, TripStatusBadge } from "@/shared/components/ui";
import { useGetSingleReportQuery } from "@/redux/apivtwo/dashboardOnvording";
import { Loader } from "@/shared/Lodder";
import {
  formatDateTime,
  formatShortDate,
  money,
  tripTypeLabel,
} from "@/utils/helpers";
import { reportStatusVariant, reportTrip, statusLabel } from "../utils/helpers";

interface DetailPanelProps {
  reportId: string;
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

export const DetailPanel = ({ reportId }: DetailPanelProps) => {
  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useGetSingleReportQuery(reportId);

  if (isLoading) {
    return <Loader message="Loading report..." />;
  }
  console.log("report", report);
  if (isError || !report) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12">
        <div className="w-12 h-12 bg-urgent/10 rounded-xl flex items-center justify-center mb-3 text-urgent">
          <AlertTriangle size={22} />
        </div>
        <p className="text-sm font-medium text-ink">
          Could not load this report
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const trip = reportTrip(report);
  const filed = formatDateTime(report.createdAt);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="px-6 py-4 border-b border-line-2 flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-xs text-ink-4 mb-0.5">Filed {filed}</p>
          <h2 className="text-xl font-bold text-ink tracking-tight">
            {report.documents || "Untitled report"}
          </h2>
        </div>
        <Badge
          variant={reportStatusVariant(report.reportStatus)}
          className="shrink-0"
        >
          {statusLabel(report.reportStatus)}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <div className="pb-5 border-b border-line-2">
          <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">
            Report
          </h4>
          <p className="text-sm text-ink leading-relaxed">{report.documents}</p>
        </div>

        {trip ? (
          <>
            <div className="pb-5 border-b border-line-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider">
                  Related trip
                </h4>
                {trip.bookingStatus ? (
                  <TripStatusBadge status={trip.bookingStatus.toLowerCase()} />
                ) : null}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Reason" value={trip.tripReason} />
                <Field
                  label="Trip type"
                  value={
                    trip.tripType ? tripTypeLabel(trip.tripType) : undefined
                  }
                />
                <Field
                  label="Service date"
                  value={formatShortDate(trip.serviceDate)}
                />
                <Field label="Program" value={trip.programContext} />
                <Field label="Pickup" value={trip.pickupTime} />
                <Field label="Appointment" value={trip.appointmentTime} />
                <Field label="Return" value={trip.returnTime} />
                <Field
                  label="Passengers"
                  value={
                    trip.passengerSeats != null
                      ? trip.passengerSeats
                      : undefined
                  }
                />
                <Field
                  label="Fare"
                  value={trip.price != null ? money(trip.price) : undefined}
                />
              </div>
            </div>

            <div className="pb-5 border-b border-line-2">
              <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin size={12} /> Locations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Pickup ZIP" value={trip.pickupLocation} />
                <Field label="Drop-off ZIP" value={trip.dropOffLocation} />
                <Field label="Stop ZIP" value={trip.stopAddress} />
              </div>
            </div>

            {trip.recurringBooking ? (
              <div className="pb-5 border-b border-line-2">
                <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Repeat size={12} /> Recurring
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Days"
                    value={
                      trip.selectedDate?.length
                        ? weekdayLabel(trip.selectedDate)
                        : undefined
                    }
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
                    <p className="text-sm text-ink leading-relaxed">
                      {trip.tripNote}
                    </p>
                  </div>
                ) : null}
                {trip.internalPrivateNote ? (
                  <div>
                    <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">
                      Internal note
                    </h4>
                    <p className="text-sm text-ink leading-relaxed">
                      {trip.internalPrivateNote}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-4">
            This report is not linked to a trip.
          </p>
        )}
      </div>
    </div>
  );
};
