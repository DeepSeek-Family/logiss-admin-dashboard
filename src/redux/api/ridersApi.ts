import { baseApi } from '../baseApi'
import type { IBooking, IBookingPagination } from './bookingApi'

export interface IRiderDriverData {
  driverExperience?: string
  licenseNumber?: string
  licenseClass?: string
  expirationDate?: string
  licenseImage?: string
}

export interface IRider {
  _id: string
  id?: string
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth?: string
  role?: string
  driverData?: IRiderDriverData
  authorizationID?: string
  accessScope?: string[]
  isBanned?: boolean
  isAdminVerifiedDriver?: boolean
  county?: string
  email?: string
  contact?: string
  applicationStatus?: string
  isOnDuty?: boolean
  trip?: number
  profile?: string
  verified?: boolean
  deviceToken?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface IGetRidersQueryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

export interface IGetRidersResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IRider[]
}

export interface IGetRiderHistoryQueryParams {
  id: string
  page?: number
  limit?: number
}

export interface IGetRiderHistoryResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IBooking[]
}

const normalizeRidersResponse = (response: any): IGetRidersResponse => {
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

const normalizeRiderHistoryResponse = (response: any): IGetRiderHistoryResponse => {
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

export const ridersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRiders: builder.query<IGetRidersResponse, IGetRidersQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search) queryParams.search = params.search
        }
        return {
          url: '/user/riders',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeRidersResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Riders' as const, id: _id })),
              { type: 'Riders', id: 'LIST' },
            ]
          : [{ type: 'Riders', id: 'LIST' }],
    }),
    getRiderHistory: builder.query<IGetRiderHistoryResponse, IGetRiderHistoryQueryParams>({
      query: ({ id, page, limit }) => {
        const queryParams: Record<string, string | number> = {}
        if (page != null) queryParams.page = page
        if (limit != null) queryParams.limit = limit
        return {
          url: `/booking/rider/${id}`,
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeRiderHistoryResponse,
      providesTags: (_result, _error, arg) => [
        { type: 'Riders', id: `HISTORY-${arg.id}` },
        { type: 'bookings', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const { useGetRidersQuery, useGetRiderHistoryQuery } = ridersApi
