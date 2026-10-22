import { AlertTriangle, Calendar, MapPin, Repeat, User } from "lucide-react";

import { Badge, Button, TripStatusBadge } from "@/shared/components/ui";

import type { IIncidentReport } from "@/redux/apivtwo/dashboardOnvording";

import { useGetSingleReportQuery } from "@/redux/apivtwo/dashboardOnvording";

import { Loader } from "@/shared/Lodder";

import {
  formatDateTime,
  formatShortDate,
  money,
  tripTypeLabel,
} from "@/utils/helpers";
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



  if (isLoading && !previewReport) {

    return <Loader message="Loading report..." />;

  }



  const merged = report ?? previewReport;



  if ((isError && !previewReport) || !merged) {

    return (

      <div className="h-full flex flex-col items-center justify-center text-center p-12">

        <div className="w-12 h-12 bg-urgent/10 rounded-xl flex items-center justify-center mb-3 text-urgent">

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

    trip?.userId && typeof trip.userId === "object"

      ? formatReportUser(trip.userId)

      : subjectName;



  const hasTripDetails =

    trip &&

    (trip.tripReason ||

      trip.serviceDate ||

      trip.pickupLocation ||

      trip.dropOffLocation ||

      trip.bookingStatus ||

      trip.price != null);



  return (

    <div className="h-full flex flex-col overflow-hidden bg-white">

      <div className="px-6 py-4 border-b border-line-2 flex items-start justify-between gap-4 shrink-0">

        <div className="min-w-0">

          <p className="text-xs text-ink-4 mb-0.5">Filed {filed}</p>

          <h2 className="text-xl font-bold text-ink tracking-tight">

            {subjectName}

          </h2>

          <p className="text-sm text-ink-3 mt-1">

            {reportCategory(merged)} · Reported by {reporterName}

          </p>

        </div>

        <Badge variant={reportStatusVariant(merged.reportStatus)} className="shrink-0">

          {statusLabel(merged.reportStatus)}

        </Badge>

      </div>



      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        <div className="pb-5 border-b border-line-2 space-y-4">

          <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">

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

          <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3 flex items-center gap-1.5">

            <User size={12} /> People

          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

                <h4 className="text-xs font-bold text-ink-4 uppercase tracking-wider">

                  Related trip

                </h4>

                {trip.bookingStatus ? (

                  <TripStatusBadge status={trip.bookingStatus.toLowerCase()} />

                ) : null}

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

                      value={

                        trip.passengerSeats != null ? trip.passengerSeats : undefined

                      }

                    />

                    <Field

                      label="Fare"

                      value={trip.price != null ? money(trip.price) : undefined}

                    />

                  </>

                ) : null}

              </div>

              {!hasTripDetails && trip.tripType ? (

                <p className="text-xs text-ink-4 mt-2">

                  Linked trip: {tripTypeLabel(trip.tripType)} for {tripPassenger}.

                </p>

              ) : null}

            </div>



            {(trip.pickupLocation || trip.dropOffLocation || trip.stopAddress) && (

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

            )}



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

                    <p className="text-sm text-ink leading-relaxed">{trip.tripNote}</p>

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

          <p className="text-sm text-ink-4">This report is not linked to a trip.</p>

        )}

      </div>

    </div>

  );

};

