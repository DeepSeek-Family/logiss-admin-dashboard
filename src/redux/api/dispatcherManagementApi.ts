import { baseApi } from '../baseApi'
import type { IBookingPagination } from './bookingApi'

export interface IDispatcher {
  _id: string
  id?: string
  firstName: string
  lastName: string
  email: string
  contact?: string
  role?: string
  accessScope?: string[]
  dateOfBirth?: string
  isBanned?: boolean
  isAdminVerifiedDriver?: boolean
  applicationStatus?: string
  isOnDuty?: boolean
  trip?: number
  profile?: string
  verified?: boolean
  fcmToken?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface IGetDispatchersQueryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

export interface IGetDispatchersResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IDispatcher[]
}

export interface ICreateDispatcherInput {
  firstName: string
  lastName: string
  email: string
  password?: string
  contact?: string
  accessScope: string[]
}

export interface ICreateDispatcherResponse {
  success: boolean
  message?: string
  data?: IDispatcher
}

const normalizeDispatchersResponse = (response: any): IGetDispatchersResponse => {
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
    message: response?.message || 'Dispatcher list retrieved successfully',
    pagination,
    data: list,
  }
}

export const dispatcherManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDispatchers: builder.query<IGetDispatchersResponse, IGetDispatchersQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          if (params.search) queryParams.search = params.search
        }
        return {
          url: '/user/dispatcher',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizeDispatchersResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Dispatchers' as const, id: _id })),
              { type: 'Dispatchers', id: 'LIST' },
            ]
          : [{ type: 'Dispatchers', id: 'LIST' }],
    }),
    createDispatcher: builder.mutation<ICreateDispatcherResponse, ICreateDispatcherInput>({
      query: (body) => ({
        url: '/user/dispatcher',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Dispatchers', id: 'LIST' }],
    }),
    updateDispatcher: builder.mutation<
      ICreateDispatcherResponse,
      { id: string; body: Partial<ICreateDispatcherInput> }
    >({
      query: ({ id, body }) => ({
        url: `/user/dispatcher/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Dispatchers', id: arg.id },
        { type: 'Dispatchers', id: 'LIST' },
      ],
    }),
    deleteDispatcher: builder.mutation<{ success: boolean; message?: string }, string>({
      query: (id) => ({
        url: `/user/dispatcher/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Dispatchers', id },
        { type: 'Dispatchers', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetDispatchersQuery,
  useLazyGetDispatchersQuery,
  useCreateDispatcherMutation,
  useUpdateDispatcherMutation,
  useDeleteDispatcherMutation,
} = dispatcherManagementApi
