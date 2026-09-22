import { baseApi } from '../baseApi'
import type { IBookingPagination } from './bookingApi'
import { buildDriverFormData, type ICreateDriverInput } from '@/features/drivers/utils/createDriverForm'

export type { ICreateDriverInput }

export interface IDriverData {
  driverExperience?: string
  licenseNumber?: string
  licenseClass?: string
  expirationDate?: string
  licenseImage?: string
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

export interface IUpdateApplicationStatusPayload {
  id: string
  applicationStatus: string
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
          if (params.search) queryParams.search = params.search
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
    updateApplicationStatus: builder.mutation<IUpdateApplicationStatusResponse, IUpdateApplicationStatusPayload>({
      query: ({ id, applicationStatus }) => ({
        url: `/applications/${id}`,
        method: 'PATCH',
        body: { applicationStatus },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: arg.id },
        { type: 'Applications', id: 'LIST' },
        { type: 'Drivers', id: 'LIST' },
      ],
    }),
    createDriver: builder.mutation<ICreateDriverResponse, ICreateDriverInput>({
      query: (body) => ({
        url: '/user',
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
  useUpdateApplicationStatusMutation,
  useCreateDriverMutation,
} = driversApi
