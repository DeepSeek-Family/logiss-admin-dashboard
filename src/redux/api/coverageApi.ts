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
  isActive?: boolean
}

export type CountyPriceMethod = 'flat_rate' | 'per_mile' | 'mileage_based'

export interface IMileageBasedPrice {
  starting_mileage?: number
  first_miles_price?: number
  per_mile_price?: number
}

export interface ICountyPayerRef {
  _id: string
  name?: string
  type?: string
  isActive?: boolean
}

export interface ICountyGeoJSON {
  type?: string
  coordinates?: unknown
}

export interface ICounty {
  _id: string
  payersId?: ICountyPayerRef | string
  coversAreasGeoJSON?: ICountyGeoJSON | null
  countyName?: string
  priceMethod?: CountyPriceMethod | string
  flat_rate_price?: number
  starting_fare?: number
  first_miles_price?: number
  per_mile_price?: number
  mileage_based_price?: IMileageBasedPrice
  insidePrice?: number
  outsidePrice?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ICountiesResponse {
  success: boolean
  message?: string
  data: ICounty[]
}

export interface ICountyMutationResponse {
  success: boolean
  message?: string
  data?: ICounty | ICounty[]
}

export interface ISaveCountyInput {
  payersId: string
  priceMethod: CountyPriceMethod
  flat_rate_price?: number
  starting_fare?: number
  starting_mileage?: number
  first_miles_price?: number
  per_mile_price?: number
  insidePrice: number
  outsidePrice: number
  file?: File
}

export const countyPayerId = (county?: ICounty | null): string => {
  if (!county?.payersId) return ''
  return typeof county.payersId === 'string' ? county.payersId : county.payersId._id || ''
}

const API_PRICE_METHODS: CountyPriceMethod[] = ['flat_rate', 'per_mile', 'mileage_based']

export const toApiPriceMethod = (method?: string): CountyPriceMethod => {
  const value = String(method || '').trim().toLowerCase()
  if (value === 'flat_rate' || value === 'flat' || value === 'geofence') return 'flat_rate'
  if (value === 'per_mile') return 'per_mile'
  if (API_PRICE_METHODS.includes(value as CountyPriceMethod)) return value as CountyPriceMethod
  return 'mileage_based'
}

const buildCountyFormData = (input: ISaveCountyInput): FormData => {
  const formData = new FormData()
  const priceMethod = toApiPriceMethod(input.priceMethod)
  formData.append('payersId', input.payersId)
  formData.append('priceMethod', priceMethod)
  formData.append('insidePrice', String(input.insidePrice ?? 0))
  formData.append('outsidePrice', String(input.outsidePrice ?? 0))

  if (priceMethod === 'flat_rate') {
    formData.append('flat_rate_price', String(input.flat_rate_price ?? 0))
  } else if (priceMethod === 'per_mile') {
    formData.append('starting_fare', String(input.starting_fare ?? 0))
    formData.append('first_miles_price', String(input.first_miles_price ?? 0))
    formData.append('per_mile_price', String(input.per_mile_price ?? 0))
  } else {
    formData.append('starting_mileage', String(input.starting_mileage ?? 0))
    formData.append('first_miles_price', String(input.first_miles_price ?? 0))
    formData.append('per_mile_price', String(input.per_mile_price ?? 0))
  }

  if (input.file) formData.append('file', input.file)
  return formData
}

const unwrapCounty = (response: any): ICounty | undefined => {
  const raw = response?.data ?? response
  if (Array.isArray(raw)) return raw[0]
  if (raw && typeof raw === 'object' && (raw._id || raw.payersId)) return raw as ICounty
  return undefined
}

const mergeCountyCaches = (
  dispatch: (action: unknown) => void,
  payersId: string,
  saved: ICounty,
) => {
  const mergeCounty = (draft: ICountiesResponse) => {
    const idx = draft.data.findIndex(
      (c) => c._id === saved._id || countyPayerId(c) === payersId,
    )
    if (idx >= 0) draft.data[idx] = { ...draft.data[idx], ...saved }
    else draft.data.push(saved)
  }
  dispatch(coverageApi.util.updateQueryData('getCounties', undefined, mergeCounty))
  dispatch(coverageApi.util.updateQueryData('getCountiesByPayer', payersId, mergeCounty))
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
    getCounties: builder.query<ICountiesResponse, void>({
      query: () => ({ url: '/counties', method: 'GET' }),
      transformResponse: (response: any): ICountiesResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: normalizeList<ICounty>(response),
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Counties' as const, id: _id })),
              { type: 'Counties', id: 'LIST' },
            ]
          : [{ type: 'Counties', id: 'LIST' }],
    }),
    getCountiesByPayer: builder.query<ICountiesResponse, string>({
      query: (payerId) => ({ url: `/counties/admin/${payerId}`, method: 'GET' }),
      transformResponse: (response: any): ICountiesResponse => ({
        success: response?.success !== false,
        message: response?.message,
        data: normalizeList<ICounty>(response),
      }),
      providesTags: (result, _e, payerId) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Counties' as const, id: _id })),
              { type: 'Counties', id: `PAYER_${payerId}` },
              { type: 'Counties', id: 'LIST' },
            ]
          : [
              { type: 'Counties', id: `PAYER_${payerId}` },
              { type: 'Counties', id: 'LIST' },
            ],
    }),
    saveCounty: builder.mutation<ICountyMutationResponse, ISaveCountyInput>({
      query: (input) => ({
        url: '/counties',
        method: 'POST',
        body: buildCountyFormData(input),
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Counties', id: 'LIST' },
        { type: 'Counties', id: `PAYER_${arg.payersId}` },
      ],
      async onQueryStarted(input, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const saved = unwrapCounty(data)
          if (!saved) return
          mergeCountyCaches(dispatch, input.payersId, saved)
        } catch {
          /* cache stays until invalidation refetch */
        }
      },
    }),
    updateCounty: builder.mutation<ICountyMutationResponse, { id: string; body: ISaveCountyInput }>({
      query: ({ id, body }) => ({
        url: `/counties/${id}`,
        method: 'PATCH',
        body: buildCountyFormData(body),
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Counties', id: arg.id },
        { type: 'Counties', id: 'LIST' },
        { type: 'Counties', id: `PAYER_${arg.body.payersId}` },
      ],
      async onQueryStarted({ body }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const saved = unwrapCounty(data)
          if (!saved) return
          mergeCountyCaches(dispatch, body.payersId, saved)
        } catch {
          /* cache stays until invalidation refetch */
        }
      },
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
  useGetCountiesQuery,
  useGetCountiesByPayerQuery,
  useSaveCountyMutation,
  useUpdateCountyMutation,
  useGetFacilitiesQuery,
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
} = coverageApi
