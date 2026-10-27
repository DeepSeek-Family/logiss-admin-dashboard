import { baseApi } from '../baseApi'
import type { IBookingPagination } from './bookingApi'
import {
  FILE_EXPORT_FALLBACK_NAMES,
  requestFileExport,
  type FileExportType,
} from '@/utils/fileExportDownload'

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

export interface IExportPaymentsArgs extends IGetPaymentsQueryParams {
  type: FileExportType
}

export interface IGetPaymentsResponse {
  success: boolean
  message: string
  pagination?: IBookingPagination
  data: IPayment[]
}

const buildPaymentQueryParams = (params?: IGetPaymentsQueryParams | void) => {
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
  return queryParams
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
      query: (params) => ({
        url: '/payment',
        method: 'GET',
        params: buildPaymentQueryParams(params),
      }),
      transformResponse: normalizePaymentsResponse,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Payments' as const, id: _id })),
              { type: 'Payments', id: 'LIST' },
            ]
          : [{ type: 'Payments', id: 'LIST' }],
    }),
    exportPayments: builder.mutation<null, IExportPaymentsArgs>({
      queryFn: async ({ type, ...filters }, _api, _extraOptions, baseQuery) =>
        requestFileExport(baseQuery as unknown as (args: Record<string, unknown>) => unknown, {
          url: '/payment/export',
          params: buildPaymentQueryParams(filters),
          type,
          fallbackFileName: FILE_EXPORT_FALLBACK_NAMES.payments[type],
        }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPaymentsQuery,
  useLazyGetPaymentsQuery,
  useExportPaymentsMutation,
} = transitionApi
