import { baseApi } from '../baseApi'
import type { IBookingPagination } from './bookingApi'

export interface IPaymentUser {
  _id: string
  firstName: string
  middleName?: string
  lastName: string
  email?: string
  contact?: string
  profile?: string
  id?: string
}

export interface IPaymentBooking {
  _id: string
  id?: string
  pickupLocation?: any
  dropOffLocation?: any
  tripType?: string
  scheduledTime?: string
  serviceDate?: string
  [key: string]: any
}

export interface IPayment {
  _id: string
  bookingId?: IPaymentBooking | string
  price: number
  paymentStatus: 'paid' | 'pending' | 'refunded' | string
  userId?: IPaymentUser | string
  txnNumber?: string
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface IGetPaymentsQueryParams {
  page?: number
  limit?: number
  search?: string
  searchTerm?: string
  paymentStatus?: string
  startDate?: string
  endDate?: string
  [key: string]: any
}

export interface IGetPaymentsResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IPayment[]
}

const normalizePaymentsResponse = (response: any): IGetPaymentsResponse => {
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
    message: response?.message || 'Payments fetched successfully',
    pagination,
    data: list,
  }
}

export const transitionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<IGetPaymentsResponse, IGetPaymentsQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          if (params.page != null) queryParams.page = params.page
          if (params.limit != null) queryParams.limit = params.limit
          const searchTerm = params.searchTerm || params.search
          if (searchTerm) queryParams.searchTerm = searchTerm
          if (params.paymentStatus && params.paymentStatus !== 'all') {
            queryParams.paymentStatus = params.paymentStatus
          }
          if (params.startDate) queryParams.startDate = params.startDate
          if (params.endDate) queryParams.endDate = params.endDate
        }
        return {
          url: '/payment',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: normalizePaymentsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Payments' as const, id: _id })),
              { type: 'Payments', id: 'LIST' },
            ]
          : [{ type: 'Payments', id: 'LIST' }],
    }),
    exportPayments: builder.query<string, IGetPaymentsQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          const searchTerm = params.searchTerm || params.search
          if (searchTerm) queryParams.searchTerm = searchTerm
          if (params.paymentStatus && params.paymentStatus !== 'all') {
            queryParams.paymentStatus = params.paymentStatus
          }
          if (params.startDate) queryParams.startDate = params.startDate
          if (params.endDate) queryParams.endDate = params.endDate
        }
        return {
          url: '/payment/export',
          method: 'GET',
          params: queryParams,
          responseHandler: 'text',
        }
      },
    }),
    exportPaymentsMutation: builder.mutation<string, IGetPaymentsQueryParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        if (params && typeof params === 'object') {
          const searchTerm = params.searchTerm || params.search
          if (searchTerm) queryParams.searchTerm = searchTerm
          if (params.paymentStatus && params.paymentStatus !== 'all') {
            queryParams.paymentStatus = params.paymentStatus
          }
          if (params.startDate) queryParams.startDate = params.startDate
          if (params.endDate) queryParams.endDate = params.endDate
        }
        return {
          url: '/payment/export',
          method: 'GET',
          params: queryParams,
          responseHandler: 'text',
        }
      },
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPaymentsQuery,
  useLazyGetPaymentsQuery,
  useExportPaymentsQuery,
  useLazyExportPaymentsQuery,
  useExportPaymentsMutationMutation,
} = transitionApi
