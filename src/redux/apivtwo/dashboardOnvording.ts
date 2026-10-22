import { baseApi } from "../baseApi";

export interface ITripDistributionMonth {
  month: string;
  oneWayTrips: number;
  roundTripTrips: number;
}

export interface IReportUser {
  _id: string;
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
}

export interface IIncidentReportTrip {
  _id: string;
  userId?: IReportUser | string;
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
  userId?: IReportUser | string;
  reportStatus: string;
  /** API category label (e.g. "Reckless or unsafe driving") */
  documents: string;
  reportedBy?: IReportUser | string;
  tripId?: IIncidentReportTrip | string | null;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IReportsPagination {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
}

export interface IReportsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  reportStatus?: string;
  tripType?: string;
}

export interface IReportsListResponse {
  success?: boolean;
  message?: string;
  pagination?: IReportsPagination;
  data: IIncidentReport[];
}

const normalizeTripDistribution = (
  response: ITripDistributionMonth[] | { data?: ITripDistributionMonth[] },
): ITripDistributionMonth[] => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.data) ? response.data : [];
};

const normalizeReportsListResponse = (response: unknown): IReportsListResponse => {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: {
        total: response.length,
        limit: response.length || 10,
        page: 1,
        totalPage: 1,
      },
    };
  }

  const body = response as Record<string, unknown> | null | undefined;
  const nested = body?.data as Record<string, unknown> | IIncidentReport[] | undefined;

  let list: IIncidentReport[] = [];
  if (Array.isArray(body?.data)) {
    list = body.data as IIncidentReport[];
  } else if (Array.isArray(nested)) {
    list = nested as IIncidentReport[];
  } else if (nested && typeof nested === "object" && "_id" in nested) {
    list = [nested as unknown as IIncidentReport];
  } else if (body && typeof body === "object" && "_id" in body) {
    list = [body as unknown as IIncidentReport];
  }

  const pagination =
    (body?.pagination as IReportsPagination | undefined) ||
    (nested && !Array.isArray(nested)
      ? (nested as { pagination?: IReportsPagination }).pagination
      : undefined);

  return {
    success: body?.success as boolean | undefined,
    message: body?.message as string | undefined,
    pagination,
    data: list,
  };
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
    getAllReports: builder.query<IReportsListResponse, IReportsQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {};
        if (params && typeof params === "object") {
          if (params.page != null) queryParams.page = params.page;
          if (params.limit != null) queryParams.limit = params.limit;
          if (params.search?.trim()) queryParams.search = params.search.trim();
          if (params.reportStatus?.trim()) queryParams.reportStatus = params.reportStatus.trim();
          if (params.tripType?.trim()) queryParams.tripType = params.tripType.trim();
        }
        return {
          url: "/reports",
          method: "GET",
          params: queryParams,
        };
      },
      transformResponse: normalizeReportsListResponse,
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map(({ _id }) => ({
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
