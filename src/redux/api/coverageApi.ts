import { baseApi } from '../baseApi'
import type { PayerType } from '@/features/cms/constants/payerTypes'

export type { PayerType }

export type FacilityType = 'hospital' | 'clinic' | 'program' | 'nursingHome' | 'other'

export interface IPayer {
  _id: string
  name: string
  type: PayerType
  isActive?: boolean
  __v?: number
}

export interface IPayerBody {
  name: string
  type: PayerType
}

export interface IPayersResponse {
  success: boolean
  message?: string
  data: IPayer[]
}

export interface IPayerMutationResponse {
  success: boolean
  message?: string
  data?: IPayer
}

export interface IFacility {
  _id: string
  name: string
  type: FacilityType
  status?: boolean
  isDeleted?: boolean
}

export interface IFacilityBody {
  name: string
  type: FacilityType
}

export interface IFacilitiesResponse {
  success: boolean
  message?: string
  data: IFacility[]
}

export interface IFacilityMutationResponse {
  success: boolean
  message?: string
  data?: IFacility
}

const normalizeList = <T>(response: any): T[] =>
  Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : []

export const coverageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayers: builder.query<IPayersResponse, void>({
      query: () => ({ url: '/payers', method: 'GET' }),
      transformResponse: (response: any): IPayersResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: normalizeList<IPayer>(response),
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Payers' as const, id: _id })),
              { type: 'Payers', id: 'LIST' },
            ]
          : [{ type: 'Payers', id: 'LIST' }],
    }),
    createPayer: builder.mutation<IPayerMutationResponse, IPayerBody>({
      query: (body) => ({
        url: '/payers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Payers', id: 'LIST' }],
    }),
    updatePayer: builder.mutation<IPayerMutationResponse, { id: string; body: IPayerBody }>({
      query: ({ id, body }) => ({
        url: `/payers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Payers', id: arg.id },
        { type: 'Payers', id: 'LIST' },
      ],
    }),
    getFacilities: builder.query<IFacilitiesResponse, void>({
      query: () => ({ url: '/facilities-and-programs', method: 'GET' }),
      transformResponse: (response: any): IFacilitiesResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: normalizeList<IFacility>(response),
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Facilities' as const, id: _id })),
              { type: 'Facilities', id: 'LIST' },
            ]
          : [{ type: 'Facilities', id: 'LIST' }],
    }),
    createFacility: builder.mutation<IFacilityMutationResponse, IFacilityBody>({
      query: (body) => ({
        url: '/facilities-and-programs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Facilities', id: 'LIST' }],
    }),
    updateFacility: builder.mutation<IFacilityMutationResponse, { id: string; body: IFacilityBody }>({
      query: ({ id, body }) => ({
        url: `/facilities-and-programs/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Facilities', id: arg.id },
        { type: 'Facilities', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPayersQuery,
  useCreatePayerMutation,
  useUpdatePayerMutation,
  useGetFacilitiesQuery,
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
} = coverageApi
