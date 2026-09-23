import { baseApi } from "../baseApi";

export interface ITripDistributionMonth {
  month: string;
  oneWayTrips: number;
  roundTripTrips: number;
}

export interface IIncidentReportTrip {
  _id: string;
  userId?: string;
  pickupLocation?: string | number;
  dropOffLocation?: string | number;
  stopAddress?: string | number;
  tripNote?: string;
  internalPrivateNote?: string;
  tripType?: string;
  tripReason?: string;
  passengerSeats?: number;
  programContext?: string;
  serviceDate?: string;
  appointmentTime?: string;
  pickupTime?: string;
  returnTime?: string;
  recurringBooking?: boolean;
  selectedDate?: string[];
  endDate?: string;
  bookingStatus?: string;
  price?: number;
}

export interface IIncidentReport {
  _id: string;
  userId?: string;
  reportStatus: string;
  documents: string;
  reportedBy?: string;
  tripId?: IIncidentReportTrip | string;
  createdAt: string;
  updatedAt?: string;
}

export interface IReportsQuery {
  reportStatus?: string;
  tripType?: string;
}

const normalizeTripDistribution = (
  response: ITripDistributionMonth[] | { data?: ITripDistributionMonth[] },
): ITripDistributionMonth[] => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.data) ? response.data : [];
};

const normalizeReports = (
  response:
    | IIncidentReport[]
    | IIncidentReport
    | { data?: IIncidentReport[] | IIncidentReport },
): IIncidentReport[] => {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object" && "data" in response) {
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return [data];
  }
  if (response && typeof response === "object" && "_id" in response) {
    return [response];
  }
  return [];
};

const normalizeReport = (
  response: IIncidentReport | { data?: IIncidentReport },
): IIncidentReport => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data &&
    typeof response.data === "object"
  ) {
    return response.data;
  }
  return response as IIncidentReport;
};

export const dashboardOnvordingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<any, void>({
      query: () => "/dashboard/admin/dashboard-overview",
      providesTags: ["DashboardOverview"],
    }),
    getDashboardAnalytics: builder.query<ITripDistributionMonth[], void>({
      query: () => "/dashboard/admin/trip-distribution",
      transformResponse: normalizeTripDistribution,
      providesTags: ["trip_distribution"],
    }),
    getAllReports: builder.query<IIncidentReport[], IReportsQuery | void>({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        if (params && typeof params === "object") {
          const reportStatus = params.reportStatus?.trim();
          const tripType = params.tripType?.trim();
          if (reportStatus && reportStatus !== "all") {
            queryParams.reportStatus = reportStatus;
          }
          if (tripType && tripType !== "all") {
            queryParams.tripType = tripType;
          }
        }
        if (Object.keys(queryParams).length === 0) {
          return { url: "/reports", method: "GET" as const };
        }
        return {
          url: "/reports",
          method: "GET" as const,
          params: queryParams,
        };
      },
      transformResponse: normalizeReports,
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map(({ _id }) => ({
                type: "all_reports" as const,
                id: _id,
              })),
              { type: "all_reports", id: "LIST" },
            ]
          : [{ type: "all_reports", id: "LIST" }],
    }),
    getSingleReport: builder.query<IIncidentReport, string>({
      query: (id) => `/reports/${id}`,
      transformResponse: normalizeReport,
      providesTags: (_result, _error, id) => [{ type: "all_reports", id }],
    }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetDashboardAnalyticsQuery,
  useGetAllReportsQuery,
  useGetSingleReportQuery,
} = dashboardOnvordingApi;
