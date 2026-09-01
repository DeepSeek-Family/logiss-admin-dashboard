import { baseApi } from '../baseApi'
import type { Trip } from '../slice/tripsSlice'

export const tripsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrips: builder.query<Trip[], { status?: string } | void>({
      query: (params) => ({
        url: '/trips',
        params: params || {},
      }),
      providesTags: ['Trips'],
    }),
    getTripById: builder.query<Trip, string>({
      query: (id) => `/trips/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Trips', id }],
    }),
    updateTripStatus: builder.mutation<Trip, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/trips/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Trips'],
    }),
    assignDriverToTrip: builder.mutation<Trip, { tripId: string; driverId: string }>({
      query: ({ tripId, driverId }) => ({
        url: `/trips/${tripId}/assign`,
        method: 'POST',
        body: { driverId },
      }),
      invalidatesTags: ['Trips', 'Drivers'],
    }),
    createTrip: builder.mutation<Trip, Partial<Trip>>({
      query: (body) => ({
        url: '/trips',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trips'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTripsQuery,
  useGetTripByIdQuery,
  useUpdateTripStatusMutation,
  useAssignDriverToTripMutation,
  useCreateTripMutation,
} = tripsApi
