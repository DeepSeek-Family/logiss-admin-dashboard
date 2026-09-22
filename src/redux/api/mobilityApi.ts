import { baseApi } from '../baseApi'

export interface IMobility {
  _id: string
  name: string
  price: number
  icon?: string
  status?: boolean
  creator?: string
  __v?: number
}

export interface IMobilityListResponse {
  success: boolean
  message?: string
  data: IMobility[]
}

export interface IMobilityMutationResponse {
  success: boolean
  message?: string
  data?: IMobility
}

export interface IMobilityFormInput {
  name: string
  price: number
  image?: File
}

const buildMobilityFormData = ({ name, price, image }: IMobilityFormInput): FormData => {
  const formData = new FormData()
  formData.append('name', name.trim())
  formData.append('price', String(price))
  if (image) formData.append('image', image)
  return formData
}

const normalizeMobilityList = (response: any): IMobilityListResponse => ({
  success: response?.success !== false,
  message: response?.message,
  data: Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [],
})

export const mobilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMobilities: builder.query<IMobilityListResponse, void>({
      query: () => ({ url: '/mobility', method: 'GET' }),
      transformResponse: normalizeMobilityList,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Mobility' as const, id: _id })),
              { type: 'Mobility', id: 'LIST' },
            ]
          : [{ type: 'Mobility', id: 'LIST' }],
    }),
    createMobility: builder.mutation<IMobilityMutationResponse, IMobilityFormInput>({
      query: (body) => ({
        url: '/mobility',
        method: 'POST',
        body: buildMobilityFormData(body),
      }),
      invalidatesTags: [{ type: 'Mobility', id: 'LIST' }],
    }),
    updateMobility: builder.mutation<IMobilityMutationResponse, { id: string; body: IMobilityFormInput }>({
      query: ({ id, body }) => ({
        url: `/mobility/${id}`,
        method: 'PATCH',
        body: buildMobilityFormData(body),
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Mobility', id: arg.id },
        { type: 'Mobility', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetMobilitiesQuery,
  useCreateMobilityMutation,
  useUpdateMobilityMutation,
} = mobilityApi
