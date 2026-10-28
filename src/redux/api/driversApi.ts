import { baseApi } from '../baseApi'
import type { IBooking, IBookingPagination } from './bookingApi'
import { buildDriverFormData, type ICreateDriverInput } from '@/features/drivers/utils/createDriverForm'

export type { ICreateDriverInput }

export type DriverExperience = '1-3 years' | '4-6 years' | '7-10 years' | '11-15 years'
export type DriverLicenseClass = 'A' | 'B' | 'C'

export interface IDriverData {
  driverExperience?: DriverExperience | string
  licenseNumber?: string
  licenseClass?: DriverLicenseClass | string
  expirationDate?: string
  licenseImage?: string | string[]
}

export interface IDriverUser {
  _id: string
  id?: string
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth?: string
  role?: string
  driverData?: IDriverData
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
  fcmToken?: string | null
  isPushNotificationEnabled?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface IListQueryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

export interface IDriverListResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IDriverUser[]
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface IUpdateApplicationStatusPayload {
  id: string
  applicationStatus: ApplicationStatus
  isAdminVerifiedDriver: boolean
}

export interface IUpdateApplicationStatusResponse {
  success: boolean
  message?: string
  data?: IDriverUser
}

export interface ICreateDriverResponse {
  success: boolean
  message?: string
  data?: IDriverUser
}

const normalizeDriverListResponse = (response: any): IDriverListResponse => {
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

export interface IDriverTripHistoryQueryParams {
  id: string
  page?: number
  limit?: number
}

export interface IDriverTripHistoryResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IBooking[]
}

export interface IDutyDuration {
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  formatted: string
}

export interface IDutySession {
  startTime: string
  endTime: string | null
  duration: IDutyDuration
}

export interface IDriverDutyLog {
  _id: string
  driverId: IDriverUser | string
  date: string
  isOnDuty: boolean
  firstStartTime: string
  lastEndTime: string | null
  sessions: IDutySession[]
  totalDuration: IDutyDuration
}

export interface IDriverDutyLogsQueryParams {
  driverId: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface IDriverDutyLogsResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IDriverDutyLog[]
}

const normalizeDriverDutyLogsResponse = (response: any): IDriverDutyLogsResponse => {
  const list = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : []
  return {
    success: response?.success !== false,
    message: response?.message || '',
    pagination: response?.pagination || response?.data?.pagination,
    data: list,
  }
}

const normalizeDriverTripHistoryResponse = (response: any): IDriverTripHistoryResponse => {
  const list = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : []
  return {
    success: response?.success !== false,
    message: response?.message || '',
    pagination: response?.pagination || response?.data?.pagination,
    data: list,
  }
}

export const driversApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDriverApplications: builder.query<IDriverListResponse, IListQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search) queryParams.search = params.search
        }
        return {
          url: '/user/driver-applications',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeDriverListResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Applications' as const, id: _id })),
              { type: 'Applications', id: 'LIST' },
            ]
          : [{ type: 'Applications', id: 'LIST' }],
    }),
    getDrivers: builder.query<IDriverListResponse, IListQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          const searchTerm = params.searchTerm || params.search
          if (searchTerm) queryParams.searchTerm = searchTerm
        }
        return {
          url: '/applications/drivers',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeDriverListResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Drivers' as const, id: _id })),
              { type: 'Drivers', id: 'LIST' },
            ]
          : [{ type: 'Drivers', id: 'LIST' }],
    }),
    getDriverDutyLogs: builder.query<IDriverDutyLogsResponse, IDriverDutyLogsQueryParams>({
      query: ({ driverId, from, to, page, limit }) => {
        const queryParams: Record<string, string | number> = { driverId }
        if (from) queryParams.from = from
        if (to) queryParams.to = to
        if (page != null) queryParams.page = page
        if (limit != null) queryParams.limit = limit
        return {
          url: '/driver-duty/logs',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeDriverDutyLogsResponse,
      providesTags: (_result, _error, arg) => [
        { type: 'Drivers', id: `DUTY-${arg.driverId}` },
      ],
    }),
    getDriverTripHistory: builder.query<IDriverTripHistoryResponse, IDriverTripHistoryQueryParams>({
      query: ({ id, page, limit }) => {
        const queryParams: Record<string, string | number> = {}
        if (page != null) queryParams.page = page
        if (limit != null) queryParams.limit = limit
        return {
          url: `/dashboard/rider/trip-history/${id}`,
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeDriverTripHistoryResponse,
      providesTags: (_result, _error, arg) => [
        { type: 'Drivers', id: `HISTORY-${arg.id}` },
        { type: 'bookings', id: 'LIST' },
      ],
    }),
    updateApplicationStatus: builder.mutation<IUpdateApplicationStatusResponse, IUpdateApplicationStatusPayload>({
      query: ({ id, applicationStatus, isAdminVerifiedDriver }) => ({
        url: `/applications/${id}`,
        method: 'PATCH',
        body: { applicationStatus, isAdminVerifiedDriver },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: arg.id },
        { type: 'Applications', id: 'LIST' },
        { type: 'Drivers', id: 'LIST' },
      ],
    }),
    createDriver: builder.mutation<ICreateDriverResponse, ICreateDriverInput>({
      query: (body) => ({
        url: '/user/driver',
        method: 'POST',
        body: buildDriverFormData(body),
      }),
      invalidatesTags: [
        { type: 'Drivers', id: 'LIST' },
        { type: 'Applications', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetDriverApplicationsQuery,
  useGetDriversQuery,
  useGetDriverDutyLogsQuery,
  useGetDriverTripHistoryQuery,
  useUpdateApplicationStatusMutation,
  useCreateDriverMutation,
} = driversApi
