import { baseApi } from "../baseApi";
import {
  FILE_EXPORT_FALLBACK_NAMES,
  requestFileExport,
  type FileExportType,
} from "@/utils/fileExportDownload";

export interface IBookingUser {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  profile?: string;
  id?: string;
}

export interface IMobilityRequirement {
  _id: string;
  name: string;
  price: number;
  icon?: string;
  status?: boolean;
  creator?: string;
  __v?: number;
}

export interface IBookingDriver {
  _id: string;
  firstName: string;
  lastName: string;
  profile?: string;
  id?: string;
}

export interface IBookingCountyPayerRef {
  _id?: string;
  name?: string;
  title?: string;
  payerName?: string;
  type?: string;
}

export interface IBookingCountyRef {
  _id: string;
  payersId?: IBookingCountyPayerRef | string;
  countyName?: string;
  name?: string;
}

export interface IBookingPricingLeg {
  leg?: string;
  zone?: string;
  billingClass?: string;
  priceMethod?: string;
  straightLineMileage?: number | null;
  calculatedRouteMileage?: number | null;
  billingMileage?: number | null;
  billingMileageSource?: string;
  fundingSourceCharge?: number;
  passengerCoPay?: number;
}

export interface IBooking {
  _id: string;
  userId?: IBookingUser | string;
  pickupLocation: string | number;
  dropOffLocation: string | number;
  stopAddress?: string | number;
  mobilityRequirements?: IMobilityRequirement | string;
  tripNote?: string;
  internalPrivateNote?: string;
  tripType: "round-trip" | "one-way" | string;
  tripReason?: string;
  passengerSeats?: number;
  payerSource?: IPayerSource | string;
  countyId?: IBookingCountyRef | string;
  programContext?: string;
  serviceDate?: string;
  appointmentTime?: string;
  pickupTime?: string;
  returnTime?: string;
  recurringBooking?: boolean;
  selectedDate?: string[];
  endDate?: string;
  driverId?: IBookingDriver | string;
  vehicleId?: string;
  bookingStatus?:
    "pending" | "assigned" | "in-progress" | "confirmed" | "completed" | "cancelled" | string;
  recurringBatchId?: string;
  /** Super-admin-only display status (always "completed"); absent for other roles. */
  adminStatus?: string;
  /**
   * Legacy response-only alias of `passengerCoPay` (rider apps / old rows).
   * The admin never sends or stores it.
   */
  price?: number;
  /** Rider pays this only. */
  passengerCoPay?: number;
  /** Funding source / county charge — the full FS amount, copay is not subtracted. */
  organizationContribution?: number;
  /** `organizationContribution + passengerCoPay`. */
  totalPrice?: number;
  isApproved?: string;
  paymentStatus?: string;
  billingMileageSource?: string;
  pricingLegs?: IBookingPricingLeg[];
  cancellationOutcome?: string;
  noShowOutcome?: string;
  createdAt?: string;
  updatedAt?: string;
  driverArrivedAt?: string;
  driverPicupAt?: string;
  __v?: number;
}

export interface IBookingPagination {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
}

export interface IGetAllBookingsResponse {
  success: boolean;
  message: string;
  pagination?: IBookingPagination;
  data: IBooking[];
}

export interface ISingleBookingResponse {
  success: boolean;
  message: string;
  data: IBooking;
}

export interface IScheduleOnboardingData {
  todayTotalTrips: number;
  todayAssignedStatusTrips: number;
  todayInProgressStatusTrips: number;
  todayCompletedStatusTrips: number;
  todayCancelledStatusTrips: number;
}

export interface IScheduleOnboardingResponse {
  success: boolean;
  message: string;
  data: IScheduleOnboardingData;
}

export interface IPayerSource {
  _id: string;
  name?: string;
  title?: string;
  payerName?: string;
  status?: boolean;
  [key: string]: any;
}

export interface IPayersListResponse {
  success: boolean;
  message?: string;
  data: IPayerSource[];
}

export interface ICalculateBookingPriceBody {
  pickupLocation: [number, number];
  dropOffLocation: [number, number];
  stopAddress?: [number, number];
  /** Optional when `countyId` is set — server resolves the contract from the county. */
  payerSource?: string;
  tripType: string;
  mobilityRequirements: string;
  countyId: string;
  /** Used for contract rules (auth / monthly limit / trip reason). */
  userId?: string;
  serviceDate?: string;
  tripReason?: string;
  passengerSeats?: number;
  adminOverride?: boolean;
  adminOverrideReason?: string;
}

/**
 * Quote from `POST /booking/calculate-price`.
 * The three fare fields are the same ones a booking stores:
 * `totalPrice = organizationContribution + passengerCoPay`.
 */
export interface ICalculatedBookingPrice {
  /** Rider pays this only. */
  passengerCoPay: number;
  /** Funding source / county charge — the full FS amount, copay is not subtracted. */
  organizationContribution: number;
  /** `organizationContribution + passengerCoPay`. */
  totalPrice: number;
  /** Engine name for `organizationContribution` (includes any companion fee). */
  fundingSourceCharge?: number;
  priceMethod: string;
  countyId: string;
  /** Zone of the outbound leg. */
  zone: string;
  /** One entry per billable leg (round trip = outbound + return). */
  legs?: IBookingPricingLeg[];
  /** Miles the contract billed on, after source selection and rounding. */
  billingMileage?: number;
  billingMileageSource?: string;
  calculatedRouteMileage?: number | null;
  actualGpsMileage?: number | null;
  straightLineMileage?: number;
  cancellationOutcome?: string;
  noShowOutcome?: string;
  /** Same value as `passengerCoPay`. */
  zoneCoPay?: number;
  /** Total billing miles — a distance, not a dollar amount, despite the name. */
  milesPrice?: number;
  /** Always 0: mobility is priced through the billing class, not as an add-on. */
  mobilityTotalPrice?: number;
}

export interface ICalculateBookingPriceResponse {
  success: boolean;
  message: string;
  data: ICalculatedBookingPrice;
}

export interface ICreateBookingPayload {
  userId: string;
  pickupLocation: number[] | number;
  dropOffLocation: number[] | number;
  stopAddress?: number[] | number;
  mobilityRequirements?: string;
  tripNote?: string;
  internalPrivateNote?: string;
  tripType?: "round-trip" | "one-way" | string;
  tripReason?: string;
  passengerSeats?: number;
  /** Optional when `countyId` is set — server resolves payer from the county. */
  payerSource?: string;
  programContext?: string;
  serviceDate?: string;
  appointmentTime?: string;
  pickupTime?: string;
  returnTime?: string;
  recurringBooking?: boolean;
  selectedDate?: string[];
  endDate?: string;
  driverId: string;
  vehicleId?: string;
  [key: string]: any;
}

export interface IGetBookingsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  searchTerm?: string;
  /** Filter bookings by county id (all booking lists, trip history, export, schedule). */
  countyId?: string;
  status?: string;
  bookingStatus?: string;
  serviceDate?: string;
  startDate?: string;
  endDate?: string;
  driverId?: string;
  sort?: string;
  /** When true, only bookings without a driver (`/booking/approved?unassign=true`). */
  unassign?: boolean;
  [key: string]: any;
}

export type TripHistoryExportType = FileExportType;

export interface ITripHistoryExportField {
  header: string;
  key: string;
}

export interface ITripHistoryExportFieldsResponse {
  success: boolean;
  message: string;
  data: ITripHistoryExportField[];
}

export interface IExportTripHistoryArgs extends IGetBookingsQueryParams {
  type: FileExportType;
  fields: string[];
  bookingIds?: string[];
}

const buildQueryParams = (params?: IGetBookingsQueryParams | void) => {
  const queryParams: Record<string, string | number> = {};
  if (params && typeof params === "object") {
    if (params.page != null) queryParams.page = params.page;
    if (params.limit != null) queryParams.limit = params.limit;

    const searchVal = params.searchTerm || params.search;
    if (searchVal) {
      queryParams.searchTerm = searchVal;
    }

    if (params.countyId && params.countyId !== "all") {
      queryParams.countyId = params.countyId;
    }

    if (params.serviceDate) queryParams.serviceDate = params.serviceDate;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.driverId && params.driverId !== "all") queryParams.driverId = params.driverId;
    if (params.bookingStatus) queryParams.bookingStatus = params.bookingStatus;
    if (params.status && !queryParams.bookingStatus) queryParams.bookingStatus = params.status;
    if (params.sort) queryParams.sort = params.sort;
    if (params.unassign === true) queryParams.unassign = "true";
    else if (params.unassign === false) queryParams.unassign = "false";
  }
  return queryParams;
};

const normalizeBookingsResponse = (response: any): IGetAllBookingsResponse => {
  const list = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
  const pagination = response?.pagination || response?.data?.pagination;
  return {
    success: response?.success !== false,
    message: response?.message || "",
    pagination,
    data: list,
  };
};

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBookings: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: "/booking",
        method: "GET",
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "bookings" as const, id: _id })),
              { type: "bookings", id: "LIST" },
            ]
          : [{ type: "bookings", id: "LIST" }],
    }),
    getAllAssignedBookings: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: "/booking/approved",
        method: "GET",
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "bookings" as const, id: _id })),
              { type: "bookings", id: "LIST" },
            ]
          : [{ type: "bookings", id: "LIST" }],
    }),

    getAllTripHistory: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: "/booking/history",
        method: "GET",
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "bookings" as const, id: _id })),
              { type: "bookings", id: "LIST" },
            ]
          : [{ type: "bookings", id: "LIST" }],
    }),

    getTripHistoryExportFields: builder.query<ITripHistoryExportFieldsResponse, void>({
      query: () => ({
        url: "/booking/history/export-fields",
        method: "GET",
      }),
      transformResponse: (response: unknown): ITripHistoryExportFieldsResponse => {
        const payload = response as {
          success?: boolean;
          message?: string;
          data?: unknown;
        };
        const seen = new Set<string>();
        const fields = Array.isArray(payload?.data)
          ? payload.data.filter((field): field is ITripHistoryExportField => {
              if (!field || typeof field !== "object") return false;
              const candidate = field as Partial<ITripHistoryExportField>;
              if (
                typeof candidate.header !== "string" ||
                !candidate.header.trim() ||
                typeof candidate.key !== "string" ||
                !candidate.key.trim() ||
                seen.has(candidate.key)
              ) {
                return false;
              }
              seen.add(candidate.key);
              return true;
            })
          : [];
        return {
          success: payload?.success !== false,
          message: payload?.message || "",
          data: fields,
        };
      },
      keepUnusedDataFor: 300,
    }),

    exportTripHistory: builder.mutation<null, IExportTripHistoryArgs>({
      queryFn: async ({ type, fields, bookingIds, ...filters }, _api, _extraOptions, baseQuery) =>
        requestFileExport(baseQuery as unknown as (args: Record<string, unknown>) => unknown, {
          url: "/booking/history/export",
          params: buildQueryParams(filters),
          type,
          fallbackFileName: FILE_EXPORT_FALLBACK_NAMES.tripHistory[type],
          method: "POST",
          body: {
            type,
            fields,
            ...(bookingIds?.length ? { bookingIds } : {}),
          },
        }),
    }),

    getAllPayers: builder.query<IPayersListResponse, void>({
      query: () => ({
        url: "/payers",
        method: "GET",
      }),
      transformResponse: (response: any): IPayersListResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [],
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Payers" as const, id: _id })),
              { type: "Payers", id: "LIST" },
            ]
          : [{ type: "Payers", id: "LIST" }],
    }),
    calculateBookingPrice: builder.mutation<
      ICalculateBookingPriceResponse,
      ICalculateBookingPriceBody
    >({
      query: (body) => ({
        url: "/booking/calculate-price",
        method: "POST",
        body,
      }),
    }),

    manualCreateBooking: builder.mutation<ISingleBookingResponse, ICreateBookingPayload>({
      query: (body) => ({
        url: "/booking",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "bookings", id: "LIST" },
        { type: "Riders", id: "LIST" },
      ],
    }),

    updateBooking: builder.mutation<
      ISingleBookingResponse,
      { id: string; payload: Partial<ICreateBookingPayload> | Record<string, any> }
    >({
      query: ({ id, payload }) => ({
        url: `/booking/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: [
        { type: "bookings", id: "LIST" },
        { type: "Riders", id: "LIST" },
      ],
    }),

    /** Randomly spreads unassigned bookings across on-duty drivers (runs on a server worker). */
    bulkAssignDrivers: builder.mutation<
      { success: boolean; message: string; data: IBulkAssignResult },
      IBulkAssignBody | void
    >({
      query: (body) => ({
        url: `/booking/bulk-assign`,
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: [
        { type: "bookings", id: "LIST" },
        { type: "Drivers", id: "ACTIVE" },
      ],
    }),

    scheduleBooking: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: `/bookings/schedule`,
        method: "GET",
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "bookings" as const, id: _id })),
              { type: "bookings", id: "LIST" },
            ]
          : [{ type: "bookings", id: "LIST" }],
    }),

    getScheduleOnboarding: builder.query<IScheduleOnboardingResponse, void>({
      query: () => ({
        url: `/bookings/schedule/onboarding`,
        method: "GET",
      }),
      providesTags: [{ type: "bookings", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export interface IBulkAssignBody {
  bookingIds?: string[];
  driverIds?: string[];
  countyId?: string;
}

export interface IBulkAssignResult {
  totalBookings: number;
  totalDrivers: number;
  assigned: number;
  skipped: string[];
  assignments: { bookingId: string; driverId: string; driverName: string }[];
}

export const {
  useBulkAssignDriversMutation,
  useGetAllBookingsQuery,
  useGetAllPayersQuery,
  useCalculateBookingPriceMutation,
  useManualCreateBookingMutation,
  useUpdateBookingMutation,
  useGetAllAssignedBookingsQuery,
  useGetAllTripHistoryQuery,
  useGetTripHistoryExportFieldsQuery,
  useExportTripHistoryMutation,
  useScheduleBookingQuery,
  useGetScheduleOnboardingQuery,
} = bookingApi;
