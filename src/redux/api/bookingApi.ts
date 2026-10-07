import { baseApi } from '../baseApi'

export interface IBookingUser {
  _id: string
  firstName: string
  middleName?: string
  lastName: string
  profile?: string
  id?: string
}

export interface IMobilityRequirement {
  _id: string
  name: string
  price: number
  icon?: string
  status?: boolean
  creator?: string
  __v?: number
}

export interface IBookingDriver {
  _id: string
  firstName: string
  lastName: string
  profile?: string
  id?: string
}

export interface IBooking {
  _id: string
  userId?: IBookingUser | string
  pickupLocation: string | number
  dropOffLocation: string | number
  stopAddress?: string | number
  mobilityRequirements?: IMobilityRequirement | string
  tripNote?: string
  internalPrivateNote?: string
  tripType: 'round-trip' | 'one-way' | string
  tripReason?: string
  passengerSeats?: number
  payerSource?: any
  programContext?: string
  serviceDate?: string
  appointmentTime?: string
  pickupTime?: string
  returnTime?: string
  recurringBooking?: boolean
  selectedDate?: string[]
  endDate?: string
  driverId?: IBookingDriver | string
  vehicleId?: string
  bookingStatus?: 'pending' | 'assigned' | 'in-progress'|  'confirmed' | 'completed' | 'cancelled' | string
  recurringBatchId?: string
  price?: number
  isApproved?: string
  paymentStatus?: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface IBookingPagination {
  total: number
  limit: number
  page: number
  totalPage: number
}

export interface IGetAllBookingsResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IBooking[]
}

export interface ISingleBookingResponse {
  success: boolean
  message: string
  data: IBooking
}

export interface IScheduleOnboardingData {
  todayTotalTrips: number
  todayAssignedStatusTrips: number
  todayInProgressStatusTrips: number
  todayCompletedStatusTrips: number
  todayCancelledStatusTrips: number
}

export interface IScheduleOnboardingResponse {
  success: boolean
  message: string
  data: IScheduleOnboardingData
}

export interface IPayerSource {
  _id: string
  name?: string
  title?: string
  payerName?: string
  status?: boolean
  [key: string]: any
}

export interface IPayersListResponse {
  success: boolean
  message?: string
  data: IPayerSource[]
}

export interface ICreateBookingPayload {
  userId: string
  pickupLocation: number[] | number
  dropOffLocation: number[] | number
  stopAddress?: number[] | number
  mobilityRequirements?: string
  tripNote?: string
  internalPrivateNote?: string
  tripType?: 'round-trip' | 'one-way' | string
  tripReason?: string
  passengerSeats?: number
  payerSource: string
  programContext?: string
  serviceDate?: string
  appointmentTime?: string
  pickupTime?: string
  returnTime?: string
  recurringBooking?: boolean
  selectedDate?: string[]
  endDate?: string
  driverId: string
  vehicleId?: string
  [key: string]: any
}

export interface IGetBookingsQueryParams {
  page?: number
  limit?: number
  search?: string
  searchTerm?: string
  payerSource?: string
  payers?: string
  status?: string
  bookingStatus?: string
  serviceDate?: string
  driverId?: string
  [key: string]: any
}

const buildQueryParams = (params?: IGetBookingsQueryParams | void) => {
  const queryParams: Record<string, string | number> = {}
  if (params && typeof params === 'object') {
    if (params.page != null) queryParams.page = params.page
    if (params.limit != null) queryParams.limit = params.limit

    const searchVal = params.searchTerm || params.search
    if (searchVal) {
      queryParams.searchTerm = searchVal
    }

    const payerVal = params.payerSource || params.payers
    if (payerVal && payerVal !== 'all') {
      queryParams.payerSource = payerVal
    }

    if (params.serviceDate) queryParams.serviceDate = params.serviceDate
    if (params.driverId && params.driverId !== 'all') queryParams.driverId = params.driverId
    if (params.bookingStatus) queryParams.bookingStatus = params.bookingStatus
    if (params.status && !queryParams.bookingStatus) queryParams.bookingStatus = params.status
  }
  return queryParams
}


const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const normalizeBookingsResponse = (response: any): IGetAllBookingsResponse => {
  const list = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : []
  const pagination = response?.pagination || response?.data?.pagination
  return {
    success: response?.success !== false,
    message: response?.message || '',
    pagination,
    data: list,
  }
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBookings: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: '/booking',
        method: 'GET',
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'bookings' as const, id: _id })),
              { type: 'bookings', id: 'LIST' },
            ]
          : [{ type: 'bookings', id: 'LIST' }],
    }),
    getAllAssignedBookings: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: '/booking/approved',
        method: 'GET',
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'bookings' as const, id: _id })),
              { type: 'bookings', id: 'LIST' },
            ]
          : [{ type: 'bookings', id: 'LIST' }],
    }),

    getAllTripHistory: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: '/booking/history',
        method: 'GET',
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'bookings' as const, id: _id })),
              { type: 'bookings', id: 'LIST' },
            ]
          : [{ type: 'bookings', id: 'LIST' }],
    }),

    exportTripHistoryExcel: builder.mutation<null, IGetBookingsQueryParams | void>({
      // Blob is downloaded here instead of being returned, since Redux state must stay serializable.
      queryFn: async (params, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: '/booking/history/excel',
          method: 'GET',
          params: buildQueryParams(params),
          responseHandler: (response) => response.blob(),
          cache: 'no-cache',
        })
        if (result.error) return { error: result.error }

        const disposition = result.meta?.response?.headers.get('content-disposition') || ''
        const fileName =
          /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1] ||
          `Trip_History_${new Date().toISOString().split('T')[0]}.xlsx`
        downloadBlob(result.data as Blob, decodeURIComponent(fileName))
        return { data: null }
      },
    }),

    getAllPayers: builder.query<IPayersListResponse, void>({
      query: () => ({
        url: '/payers',
        method: 'GET',
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
              ...result.data.map(({ _id }) => ({ type: 'Payers' as const, id: _id })),
              { type: 'Payers', id: 'LIST' },
            ]
          : [{ type: 'Payers', id: 'LIST' }],
    }),
    manualCreateBooking: builder.mutation<ISingleBookingResponse, ICreateBookingPayload>({
      query: (body) => ({
        url: '/booking',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'bookings', id: 'LIST' },
        { type: 'Riders', id: 'LIST' },
      ],
    }),

    updateBooking: builder.mutation<ISingleBookingResponse, { id: string; payload: Partial<ICreateBookingPayload> | Record<string, any> }>({
      query: ({ id, payload }) => ({
        url: `/booking/${id}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: [
        { type: 'bookings', id: 'LIST' },
        { type: 'Riders', id: 'LIST' },
      ],
    }),


    scheduleBooking: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: `/bookings/schedule`,
        method: 'GET',
        params: buildQueryParams(params),
      }),
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'bookings' as const, id: _id })),
              { type: 'bookings', id: 'LIST' },
            ]
          : [{ type: 'bookings', id: 'LIST' }],
    }),

    getScheduleOnboarding: builder.query<IScheduleOnboardingResponse, void>({
      query: () => ({
        url: `/bookings/schedule/onboarding`,
        method: 'GET',
      }),
      providesTags: [{ type: 'bookings', id: 'LIST' }],
    }),
 
  }),
  overrideExisting: false,
})

export const {
  useGetAllBookingsQuery,
  useGetAllPayersQuery,
  useManualCreateBookingMutation,
  useUpdateBookingMutation,
  useGetAllAssignedBookingsQuery,
  useGetAllTripHistoryQuery,
  useExportTripHistoryExcelMutation,
  useScheduleBookingQuery,
  useGetScheduleOnboardingQuery,
} = bookingApi