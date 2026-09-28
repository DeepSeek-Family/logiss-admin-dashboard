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
  pickupLocation: number
  dropOffLocation: number
  stopAddress?: number
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
  status?: string
  [key: string]: any
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
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search) queryParams.search = params.search
        }
        return {
          url: '/booking',
          method: 'GET',
          params: queryParams,
        }
      },
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
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search) queryParams.search = params.search
        }
        return {
          url: '/booking/approved',
          method: 'GET',
          params: queryParams,
        }
      },
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
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search) queryParams.search = params.search
        }
        return {
          url: '/booking/history',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeBookingsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'bookings' as const, id: _id })),
              { type: 'bookings', id: 'LIST' },
            ]
          : [{ type: 'bookings', id: 'LIST' }],
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
} = bookingApi