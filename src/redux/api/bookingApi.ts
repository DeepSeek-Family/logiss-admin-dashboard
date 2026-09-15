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
  bookingStatus?: 'pending' | 'confirmed' | 'cancelled' | string
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

export interface ICreateBookingPayload {
  userId?: string
  pickupLocation: string | number
  dropOffLocation: string | number
  stopAddress?: string | number
  mobilityRequirements?: string
  tripNote?: string
  internalPrivateNote?: string
  tripType?: 'round-trip' | 'one-way' | string
  tripReason?: string
  passengerSeats?: number
  payerSource?: string
  programContext?: string
  serviceDate?: string
  appointmentTime?: string
  pickupTime?: string
  returnTime?: string
  recurringBooking?: boolean
  selectedDate?: string[]
  endDate?: string
  driverId?: string
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

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBookings: builder.query<IGetAllBookingsResponse, IGetBookingsQueryParams | void>({
      query: (params) => ({
        url: '/booking',
        method: 'GET',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'bookings' as const, id: _id })),
              { type: 'bookings', id: 'LIST' },
            ]
          : [{ type: 'bookings', id: 'LIST' }],
    }),
    manualCreateBooking: builder.mutation<ISingleBookingResponse, ICreateBookingPayload>({
      query: (body) => ({
        url: '/booking',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'bookings', id: 'LIST' }],
    }),
    createBooking: builder.mutation<ISingleBookingResponse, ICreateBookingPayload>({
      query: (body) => ({
        url: '/booking',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'bookings', id: 'LIST' }],
    }),
    getBookingById: builder.query<ISingleBookingResponse, string>({
      query: (id) => ({
        url: `/booking/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'bookings', id }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAllBookingsQuery,
  useManualCreateBookingMutation,
  useCreateBookingMutation,
  useGetBookingByIdQuery,
} = bookingApi